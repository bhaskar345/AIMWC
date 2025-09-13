import torch
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.mood_trends import MoodTrendsResponse
from fastapi_jwt_auth import AuthJWT
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi import BackgroundTasks
from typing import Dict, List
from schemas.journal import JournalEntryModel
from database.models import User, JournalEntry
from database.connections import get_db, SessionLocal
from utils.utils import generate_embedding, find_similar_entries
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from google import genai
from collections import defaultdict
from datetime import date
from dotenv import load_dotenv


router = APIRouter()

load_dotenv()

tokenizer = AutoTokenizer.from_pretrained("monologg/bert-base-cased-goemotions-original")
model = AutoModelForSequenceClassification.from_pretrained("monologg/bert-base-cased-goemotions-original")

client = genai.Client(api_key=os.getenv('gemini_api_key'))

@router.post("/add")
def add_entry(entry: JournalEntryModel, db: Session = Depends(get_db), Authorize: AuthJWT = Depends(), background_tasks: BackgroundTasks = None):
    Authorize.jwt_required()
    username = Authorize.get_jwt_subject()
    user = db.query(User).filter(User.email == username).first()
    user_id = user.id

    text = entry.text

    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
    topk = torch.topk(probs, k=3)
    labels = [model.config.id2label[i.item()] for i in topk.indices]
    scores = [round(s.item(), 2) for s in topk.values]
    emotions = [{"label": label, "score": scores[i]} for i, label in enumerate(labels)]

    query_embedding = generate_embedding(text)

    retrieved_entries = find_similar_entries(
        db=db,
        user_id=user_id,
        query_embedding=query_embedding,
        top_k=5
    )

    new_entry = JournalEntry(user_id=user_id, sender="user", text=text, emotions=emotions, embedding=query_embedding)
    db.add(new_entry)
    db.commit()

    context_text = "\n".join([
        f"- {e.created_at.strftime('%Y-%m-%d')}: {e.text} | Emotions: {e.emotions}"
        for e in retrieved_entries
    ])

    prompt = f"""
You are a compassionate and supportive mental wellness companion.
Reflect on the user's emotions using the context below.

Context (recent journal entries):
{context_text if context_text else "No relevant past entries found."}

User's new journal entry:
{text}

Instructions:
- Respond in the SAME LANGUAGE as the user's journal entry
- Acknowledge the user's feelings in a warm, empathetic way
- Suggest 1-2 coping strategies that feel FRESH and DIFFERENT from the most common "5-4-3-2-1 grounding exercise"
- Rotate strategies across different categories: mindful breathing, journaling, gratitude practice, light stretching, music, short walks, positive self-talk, progressive muscle relaxation, guided imagery, drawing, hydration
- If a grounding exercise is truly the best fit, reword it creatively so it feels new and not identical to past responses
- Keep the message short, encouraging, and supportive
- Use 2-3 emojis naturally
- No markdown or bold text, only plain text output
- Avoid repeating the exact same suggestions across different conversations if possible
Answer:
"""

    ai_text_container = {"text": ""}

    def stream():
        try:
            response_stream = client.models.generate_content_stream(
                model="gemini-2.0-flash",
                contents=[{"role": "user", "parts": [{"text": prompt}]}],
                config=genai.types.GenerateContentConfig(max_output_tokens=150),
            )

            got_chunk = False
            for chunk in response_stream:
                if hasattr(chunk, "text") and chunk.text:
                    got_chunk = True
                    ai_text_container["text"] += chunk.text
                    yield chunk.text

            if not got_chunk:
                fallback = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[{"role": "user", "parts": [{"text": prompt}]}],
                    config=genai.types.GenerateContentConfig(max_output_tokens=150),
                )
                ai_text_container["text"] = fallback.text or "I hear you, but I couldn’t generate a response right now."
                yield ai_text_container["text"]

        except Exception as e:
            print("AI Error:", e)
            yield "Sorry, I couldn’t generate a response."

    def save_bot_response(ai_text: str):
        if ai_text.strip():
            db_session = SessionLocal()
            try:
                db_session.add(JournalEntry(
                    user_id=user_id,
                    sender="bot",
                    text=ai_text,
                    emotions=[],
                    embedding=[]
                ))
                db_session.commit()
            finally:
                db_session.close()

    response = StreamingResponse(stream(), media_type="text/plain")

    background_tasks.add_task(lambda: save_bot_response(ai_text_container["text"]))
    response.background = background_tasks
    return response

@router.get("/history")
def get_history(db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    username = Authorize.get_jwt_subject()
    user = db.query(User).filter(User.email == username).first()
    entries = db.query(JournalEntry).filter(JournalEntry.user_id == user.id).order_by(JournalEntry.created_at).all()
    return [{"sender": e.sender, "text": e.text} for e in entries]

@router.get("/moods/", response_model=MoodTrendsResponse)
def get_entries(db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    username = Authorize.get_jwt_subject()
    user = db.query(User).filter(User.email == username).first()

    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id)
        .order_by(JournalEntry.created_at)
        .all()
    )

    emotion_trends: Dict[str, List[Dict[str, float]]] = defaultdict(list)

    for entry in entries:
        date_str = entry.created_at.strftime("%Y-%m-%d")
        for emo in entry.emotions:
            label = emo["label"]
            score = float(emo["score"])
            emotion_trends[label].append({"date": date_str, "score": score})

    today_str = date.today().strftime("%Y-%m-%d")
    today_scores = []

    for label, values in emotion_trends.items():
        today_value = next((v["score"] for v in values if v["date"] == today_str), None)
        if today_value is not None:
            today_scores.append((label, today_value))

    today_scores.sort(key=lambda x: x[1], reverse=True)
    top3 = [label for label, _ in today_scores[:3]]

    positive_message = "Take a deep breath — you showed up today, and that matters!"
    if top3:
        try:
            prompt = (
                f"The user feels {', '.join(top3)} today. "
                "Write a short, warm, uplifting response under 50 words, "
                "that responds to the overall emotional vibe without directly naming the emotions. "
                "Avoid generic phrases like 'That's a lovely mix of feelings!'. "
                "Keep it natural, empathetic, and motivating. "
                "No markdown or bold text, only plain text output."
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash", 
                contents=prompt, 
                config=genai.types.GenerateContentConfig(
                    max_output_tokens=100,
                    thinking_config=genai.types.ThinkingConfig(thinking_budget=0)
                ),
            )

            if response and response.candidates:
                candidate = response.candidates[0]
                if candidate.content.parts:
                    positive_message = "".join(
                        part.text for part in candidate.content.parts if hasattr(part, "text")
                    ).strip()
        except Exception as e:
            positive_message = f"You're feeling {', '.join(top3)} today — stay mindful and keep going!"

    return JSONResponse(
        {
            "emotion_trends": emotion_trends,
            "positive_message": positive_message,
        }
    )

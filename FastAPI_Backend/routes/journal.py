import torch
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.mood_trends import MoodTrendsResponse
from fastapi_jwt_auth import AuthJWT
from fastapi.responses import StreamingResponse
from schemas.journal import JournalEntryModel
from database.models import User, JournalEntry
from database.connections import get_db
from utils.utils import generate_embedding, find_similar_entries
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from google import genai
from collections import defaultdict
from dotenv import load_dotenv


router = APIRouter()

load_dotenv()

tokenizer = AutoTokenizer.from_pretrained("monologg/bert-base-cased-goemotions-original")
model = AutoModelForSequenceClassification.from_pretrained("monologg/bert-base-cased-goemotions-original")

client = genai.Client(api_key=os.getenv('gemini_api_key'))

@router.post("/add")
def add_entry(entry: JournalEntryModel, db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    username = Authorize.get_jwt_subject()
    user = db.query(User).filter(User.email == username).first()

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
        user_id=user.id,
        query_embedding=query_embedding,
        top_k=5
    )

    new_entry = JournalEntry(text=text, emotions=emotions, user_id=user.id, embedding=query_embedding)
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
                    yield chunk.text

            if not got_chunk:
                fallback = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[{"role": "user", "parts": [{"text": prompt}]}],
                    config=genai.types.GenerateContentConfig(max_output_tokens=150),
                )
                yield fallback.text or "I hear you, but I couldn’t generate a response right now."

        except Exception as e:
            yield "Sorry, I couldn’t generate a response."

    response = StreamingResponse(stream(), media_type="text/plain")
    return response

@router.get("/moods", response_model=MoodTrendsResponse)
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

    emotion_trends = defaultdict(list)

    for entry in entries:
        date = entry.created_at.strftime("%Y-%m-%d")
        for i in range(len(entry.emotions)):
            label = entry.emotions[i]['label']
            score = float(entry.emotions[i]['score'])
            emotion_trends[label].append({"date": date, "score": score})

    return emotion_trends

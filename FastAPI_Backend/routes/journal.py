from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.mood_trends import MoodTrendsResponse
from fastapi_jwt_auth import AuthJWT
from schemas.journal import JournalEntryModel, JournalAddResponse
from database.models import User, JournalEntry
from database.connections import get_db
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from fastapi_jwt_auth.exceptions import AuthJWTException
from fastapi.responses import JSONResponse
from google.genai import types
from google import genai
from collections import defaultdict
from dotenv import load_dotenv
import torch
import torch.nn.functional as F
import os


router = APIRouter()

load_dotenv()

tokenizer = AutoTokenizer.from_pretrained("monologg/bert-base-cased-goemotions-original")
model = AutoModelForSequenceClassification.from_pretrained("monologg/bert-base-cased-goemotions-original")

client = genai.Client(api_key=os.getenv('gemini_api_key'))


@router.post("/add", response_model=JournalAddResponse)
def add_entry(entry: JournalEntryModel, db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()
    except AuthJWTException:
        return JSONResponse({'message':'Token Expired'} ,status_code=401)
    username = Authorize.get_jwt_subject()
    user = db.query(User).filter(User.email == username).first()

    text = entry.text
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model(**inputs)
    probs = F.softmax(outputs.logits, dim=-1)[0]
    topk = torch.topk(probs, k=3)
    labels = [model.config.id2label[i.item()] for i in topk.indices]
    scores = [round(s.item(), 2) for s in topk.values]

    emotions = [{"label":label, "score": scores[i]} for i,label in enumerate(labels)]

    prompt = f'Give a short 50-word response to "{text}". Response have emojis and avoid using any bold or stylized text.'

    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=prompt, 
        config=types.GenerateContentConfig(
            max_output_tokens=100,
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        ),
    )

    new_entry = JournalEntry(text=text, emotions=emotions, user_id=user.id)
    db.add(new_entry)
    db.commit()

    return {'text': text, 'suggestion': response.text}

@router.get("/moods", response_model=MoodTrendsResponse)
def get_entries(db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()
    except AuthJWTException:
        return JSONResponse({'message':'Token Expired'} ,status_code=401)
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

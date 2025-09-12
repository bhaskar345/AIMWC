import numpy as np
from sentence_transformers import SentenceTransformer
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import JournalEntry


embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embedding(text: str):
    if not text or not text.strip():
        return []
    vector = embedding_model.encode(text)
    return vector.tolist()

def find_similar_entries(
    db: AsyncSession, user_id: int, query_embedding: list, top_k: int = 5
):
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    result = db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .where(JournalEntry.created_at >= one_week_ago)
    )
    entries = result.scalars().all()

    if not entries:
        return []

    results = []
    for e in entries:
        if not e.embedding:
            continue

        entry_vec = np.array(e.embedding, dtype=np.float32)
        similarity = np.dot(query_embedding, entry_vec) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(entry_vec)
        )
        results.append((similarity, e))

    results.sort(key=lambda x: x[0], reverse=True)
    return [entry for _, entry in results[:top_k]]

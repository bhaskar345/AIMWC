import numpy as np
from sentence_transformers import SentenceTransformer
from django.utils import timezone
from datetime import timedelta
from .models import JournalEntry

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embedding(text):
    if not text or not text.strip():
        return []
    vector = embedding_model.encode(text)
    return vector.tolist()

def find_similar_entries(user, query_embedding, top_k=5):
    one_week_ago = timezone.now() - timedelta(days=7)
    entries = JournalEntry.objects.filter(user=user, created_at__gte=one_week_ago)

    if not entries.exists():
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
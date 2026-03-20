import numpy as np
import json
import onnxruntime as ort
from fastembed import TextEmbedding
from django.utils import timezone
from datetime import timedelta
from .models import JournalEntry
from tokenizers import Tokenizer

embed_model = TextEmbedding()

tokenizer = Tokenizer.from_file("model/tokenizer.json")

with open("model/config.json") as f:
    config = json.load(f)

label_classes = np.load("model/label_classes.npy", allow_pickle=True)
emotion_labels = np.load("model/emotion_labels.npy", allow_pickle=True)

session = ort.InferenceSession("model/multitask_model.onnx")

MAX_LEN = config["max_len"]

id2label = {i: l for i, l in enumerate(label_classes)}

def generate_embedding(text):
    if not text or not text.strip():
        return []

    embedding = list(embed_model.embed([text]))[0]
    return embedding.tolist()

def predict_emotion(text):
    encoded = tokenizer.encode(text)

    input_ids = encoded.ids[:MAX_LEN]
    attention_mask = encoded.attention_mask[:MAX_LEN]

    # pad manually
    pad_len = MAX_LEN - len(input_ids)

    input_ids = input_ids + [0] * pad_len
    attention_mask = attention_mask + [0] * pad_len

    input_ids = np.array([input_ids], dtype=np.int64)
    attention_mask = np.array([attention_mask], dtype=np.int64)

    inputs = {
        "input_ids": input_ids,
        "attention_mask": attention_mask
    }

    outputs = session.run(None, inputs)
    emotion_logits, distortion_logits, start_logits, end_logits = outputs

    # --- Distortion (softmax) ---
    exp_logits = np.exp(distortion_logits - np.max(distortion_logits, axis=1, keepdims=True))
    distortion_probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)

    d_idx = int(np.argmax(distortion_probs[0]))
    distortion = id2label[d_idx]

    # --- Emotion (multi-label sigmoid) ---
    emotion_probs = 1 / (1 + np.exp(-emotion_logits[0]))

    # Top 3
    top_indices = np.argsort(emotion_probs)[-3:][::-1]

    emotions = [
        {
            "label": str(emotion_labels[int(i)]),
            "score": round(float(emotion_probs[i]), 2)
        }
        for i in top_indices
    ]

    return distortion, emotions

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
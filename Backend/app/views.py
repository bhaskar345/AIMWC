import torch, os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
from django.contrib.auth import authenticate
from django.http import StreamingHttpResponse
from datetime import date
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from .models import JournalEntry, CustomUser
from google import genai
from collections import defaultdict
from .utils import generate_embedding, find_similar_entries
from dotenv import load_dotenv


load_dotenv()
client = genai.Client(api_key=os.getenv('gemini_api_key'))

tokenizer = AutoTokenizer.from_pretrained("monologg/bert-base-cased-goemotions-original")
model = AutoModelForSequenceClassification.from_pretrained("monologg/bert-base-cased-goemotions-original")


class UserRegistrationView(APIView):
    def post(self, request):
        try:
            firstName = request.data.get('firstName')
            lastName = request.data.get('lastName')
            password = request.data.get('password')
            email = request.data.get('email')

            if not password or not email:
                return Response({'error': 'Please provide email and password'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = CustomUser.objects.create_user(first_name=firstName, last_name=lastName ,email=email)
                user.set_password(password)
                user.save()
                return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({'message': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as err:
            print(err)


class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(email=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            })
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        first_name = request.user.first_name
        return Response({'username': first_name})


class EntryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            text = request.data.get('text')

            inputs = tokenizer(text, return_tensors="pt", truncation=True)
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
            topk = torch.topk(probs, k=3)
            labels = [model.config.id2label[i.item()] for i in topk.indices]
            scores = [round(s.item(), 2) for s in topk.values]
            emotions = [{"label": label, "score": scores[i]} for i, label in enumerate(labels)]

            query_embedding = generate_embedding(text)

            retrieved_entries = find_similar_entries(
                user=request.user,
                query_embedding=query_embedding,
                top_k=5
            )

            JournalEntry.objects.create(
                user=request.user,
                sender="user",
                text=text,
                emotions=emotions,
                embedding=query_embedding
            )

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

            def stream():
                ai_text = ""
                try:
                    response_stream = client.models.generate_content_stream(
                        model="gemini-2.5-flash",
                        contents=[{"role": "user", "parts": [{"text": prompt}]}],
                        config=genai.types.GenerateContentConfig(
                            max_output_tokens=8192,
                            thinking_config=genai.types.ThinkingConfig(thinking_budget=0)
                        ),
                    )

                    got_chunk = False
                    for chunk in response_stream:
                        if hasattr(chunk, "text") and chunk.text:
                            got_chunk = True
                            ai_text += chunk.text
                            yield chunk.text

                    if not got_chunk:
                        fallback = client.models.generate_content(
                            model="gemini-2.5-flash",
                            contents=[{"role": "user", "parts": [{"text": prompt}]}],
                            config=genai.types.GenerateContentConfig(
                                max_output_tokens=8192,
                                thinking_config=genai.types.ThinkingConfig(thinking_budget=0)
                            ),
                        )
                        ai_text = fallback.text or "I hear you, but I couldn’t generate a response right now."
                        yield ai_text

                except Exception as e:
                    print(e)
                    yield "Sorry, I couldn’t generate a response."
                finally:
                    if ai_text.strip():
                        JournalEntry.objects.create(
                            user=request.user,
                            sender="bot",
                            text=ai_text,
                            emotions=[],
                            embedding=[]
                        )

            return StreamingHttpResponse(stream(), content_type="text/plain", status=200)

        except Exception as err:
            print("Error:", err)

class JournalHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entries = JournalEntry.objects.filter(user=request.user).order_by("created_at")
        return Response([
            {
                "id": e.id,
                "text": e.text,
                "sender": e.sender,
                "emotions": e.emotions,
                "created_at": e.created_at.isoformat()
            }
            for e in entries
        ])

class MoodStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entries = JournalEntry.objects.filter(user=request.user).order_by('created_at')
        emotion_trends = defaultdict(list)

        for entry in entries:
            date_str = entry.created_at.strftime("%Y-%m-%d")
            for emo in entry.emotions:
                label = emo['label']
                score = float(emo['score'])
                emotion_trends[label].append({"date": date_str, "score": score})

        today_str = date.today().strftime("%Y-%m-%d")
        today_scores = []
        for label, values in emotion_trends.items():
            today_value = next((v['score'] for v in values if v['date'] == today_str), None)
            if today_value:
                today_scores.append((label, today_value))

        today_scores.sort(key=lambda x: x[1], reverse=True)
        top3 = [label for label, score in today_scores[:3]]

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
                if response:
                    positive_message = response.text
            except Exception as e:
                positive_message = f"You're feeling {', '.join(top3)} today — stay mindful and keep going!"

        return Response({
            "emotion_trends": emotion_trends,
            "positive_message": positive_message
        })
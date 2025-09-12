import torch, os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
from django.contrib.auth import authenticate
from django.http import StreamingHttpResponse
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

            entry = JournalEntry.objects.create(
                user=request.user,
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
                        config=genai.types.GenerateContentConfig(max_output_tokens=200),
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
                            config=genai.types.GenerateContentConfig(max_output_tokens=200),
                        )
                        yield fallback.text or "I hear you, but I couldn’t generate a response right now."

                except Exception as e:
                    yield "Sorry, I couldn’t generate a response."

            return StreamingHttpResponse(stream(), content_type="text/plain", status=200)

        except Exception as err:
            print("Error:", err)


class MoodStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entries = JournalEntry.objects.filter(user= request.user).order_by('created_at')
        emotion_trends = defaultdict(list)

        for entry in entries:
            date = entry.created_at.strftime("%Y-%m-%d")
            for i in range(len(entry.emotions)):
                label = entry.emotions[i]['label']
                score = float(entry.emotions[i]['score'])
                emotion_trends[label].append({"date": date, "score": score})

        return Response(emotion_trends)

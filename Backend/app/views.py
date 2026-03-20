import os, logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
from django.contrib.auth import authenticate
from django.http import StreamingHttpResponse
from datetime import date
from .models import JournalEntry, CustomUser
from google import genai
from collections import defaultdict
from .utils import generate_embedding, find_similar_entries, predict_emotion
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv('API_KEY'))

logger = logging.getLogger(__name__)

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
            logger.exception(f"User registration failed for email: {email}")
            return Response({"error": "Internal server error"},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

            distortion_label, emotions = predict_emotion(text)

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
You are a compassionate and emotionally intelligent mental wellness companion.

Your goal is to respond with empathy while gently helping the user reframe their thinking.

Context (recent journal entries):
{context_text if context_text else "No relevant past entries found."}

User's new journal entry:
{text}

Detected Cognitive Distortion:
{distortion_label}

Instructions:
- Respond in the SAME LANGUAGE as the user's journal entry
- Start by acknowledging the user's feelings in a warm, validating way
- Then gently address the cognitive distortion WITHOUT naming it explicitly

Distortion-Specific Guidance:
- If Magnification: Help the user see a more balanced perspective; reduce exaggeration of the problem
- If Catastrophizing: Calm worst-case thinking; suggest more realistic possible outcomes
- If Overgeneralization: Remind them that one situation does not define everything
- If Mind Reading: Encourage checking assumptions instead of guessing others' thoughts
- If Emotional Reasoning: Separate feelings from facts gently
- If Labeling: Encourage self-compassion instead of harsh identity judgments
- If Fortune-telling: Emphasize uncertainty of the future in a hopeful way
- If Personalization: Reduce self-blame; introduce alternative explanations
- If Mental Filter: Help them notice positives they might be ignoring
- If Should Statements: Encourage flexibility and self-kindness
- If All-or-nothing thinking: Introduce middle ground perspectives
- If No distortion: Focus purely on emotional support

Coping Strategy Rules:
- Suggest 1-2 coping strategies that feel natural and situation-specific
- Rotate across: mindful breathing, journaling, gratitude, stretching, music, walking, self-talk, relaxation, visualization, drawing, hydration
- Avoid repeating the exact same suggestions across different conversations if possible
- Make the strategy feel personalized to the user's situation

Tone & Style:
- Keep response short, supportive, and human-like (4–6 sentences)
- Use 2–3 emojis naturally
- No markdown or bold text, only plain text output
- Avoid sounding robotic, clinical, or like a therapist manual

Goal:
Help the user feel heard, slightly calmer, and gently shift their perspective.

Answer:
"""

            def stream():
                ai_text = ""
                try:
                    response_stream = client.models.generate_content_stream(
                        model="gemini-2.5-flash",
                        contents=[{"role": "user", "parts": [{"text": prompt}]}],
                        config=genai.types.GenerateContentConfig(
                            max_output_tokens=2048,
                            temperature=0.7,
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
                                max_output_tokens=2048,
                                temperature=0.7,
                                thinking_config=genai.types.ThinkingConfig(thinking_budget=0)
                            ),
                        )
                        ai_text = fallback.text or "I hear you, but I couldn’t generate a response right now."
                        yield ai_text

                except Exception as e:
                    logger.exception(f"Entry Failed:")
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
            logger.exception(f"Entry Failed:")
            return Response({"error": "Internal Server Error"},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
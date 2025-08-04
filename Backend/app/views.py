from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
from django.contrib.auth import authenticate
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from .models import JournalEntry, CustomUser
from google import genai
from google.genai import types
from collections import defaultdict
from dotenv import load_dotenv
import torch.nn.functional as F
import torch, os


load_dotenv()

tokenizer = AutoTokenizer.from_pretrained("monologg/bert-base-cased-goemotions-original")
model = AutoModelForSequenceClassification.from_pretrained("monologg/bert-base-cased-goemotions-original")

client = genai.Client(api_key=os.getenv('gemini_api_key'))

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
            probs = F.softmax(outputs.logits, dim=-1)[0]
            topk = torch.topk(probs, k=3)
            labels = [model.config.id2label[i.item()] for i in topk.indices]
            scores = [round(s.item(), 2) for s in topk.values]

            emotions = [{"label":label, "score": scores[i]} for i,label in enumerate(labels)]

            # max_value = max(scores)
            # max_index = scores.index(max_value)
            # label = labels[max_index]

            prompt = f'Give a short 50-word response to "{text}". Response have emojis and avoid using any bold or stylized text.'
            # prompt1 = f'Craft a calm, reflective 50-word response to "{text}" focused on mindfulness or wellness. Use gentle, soothing language and 3–4 appropriate emojis. No bold or styled text—keep it soft, reassuring, and emotionally intelligent.'

            response = client.models.generate_content(
                model="gemini-2.5-flash", 
                contents=prompt, 
                config=types.GenerateContentConfig(
                    max_output_tokens=100,
                    thinking_config=types.ThinkingConfig(thinking_budget=0)
                ),
            )

            entry = JournalEntry.objects.create(user=request.user, text= text, emotions= emotions)
            return Response({'text': text, 'suggestion': response.text})
        except Exception as err:
            print(err)


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

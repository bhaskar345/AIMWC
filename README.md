<!-- Header with emoji and centered title -->
<h1 align="center">AI Mental Wellness Companion 🤖💬</h1>
<p align="center">
  Your AI-powered mood tracker and mental support chatbot.
</p>

---

##  Overview

The **AI Mental Wellness Companion** (AIMWC) helps you by:
-  **Tracking moods** over time with visual charts.
-  Offering **positive, empathetic suggestions** via an AI chatbot.
-  Providing both **Django** and **FastAPI** backends to suit your preferred backend stack.

---

##  Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/bhaskar345/AIMWC.git
cd AIMWC
```

### 2. Backend Setup

#### Django Backend
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export gemini_api_key="your_gemini_api_key_here"
python manage.py migrate
python manage.py runserver
```

#### FastAPI Backend
```bash
cd FastAPI_Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export gemini_api_key="your_gemini_api_key_here"
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
Visit your browser at `http://localhost:5173` to explore the app!

---

##  Architecture Overview

```
┌─────────────────┐      ┌───────────────┐      ┌───────────────┐
│   Frontend      │◀────▶│  Backend API  │◀────▶│  Gemini AI    │
│ (charts + chat) │      │ (Django/FastAPI) │      │ (mood insights) │
└─────────────────┘      └───────────────┘      └───────────────┘
```

- **Frontend**: Captures mood input, displays charts, and enables chat.
- **Backend**: Handles mood data, communicates with Gemini API for responses.
- **Gemini AI**: Generates compassionate suggestions based on mood.

---

##  Why This Matters

Maintaining mental wellness has never been more important. By combining **emotional tracking** and **AI-powered support**, AIMWC aims to provide:
- Self-awareness through mood visualization.
- Timely, sensitive mental encouragement.
- A lightweight, flexible architecture for easy deployment.


---

##  How You Can Help

Contributions are welcome! You can help by:
- Reporting bugs or suggesting enhancements via Issues.
- Designing a more interactive frontend (UI/UX improvements).
- Optimizing backend performance or better API error handling.
- Writing tests (unit, integration, frontend — wherever needed).

---

##  Get In Touch

Let’s collaborate to improve mental wellness with tech!  
Reach me via **GitHub**: [@bhaskar345](https://github.com/bhaskar345)  

---

<p align="center">
  “Caring for your mind is the first step toward caring for everything else.” — Keep building with care. ❤️
</p>

# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
from gtts import gTTS
import os
from datetime import datetime
import json

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (small for speed)
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")

# Symptom database (RAG knowledge base)
SYMPTOM_DB = {
    "fever": {
        "conditions": ["Malaria", "Dengue", "Typhoid", "COVID-19"],
        "advice": "Rest, stay hydrated, monitor temperature",
        "emergency": False
    },
    "fever+rash": {
        "conditions": ["Dengue", "Measles", "Chikungunya"],
        "advice": "Seek medical attention, dengue testing recommended",
        "emergency": True,
        "syndrome": "Dengue-like Syndrome"
    },
    "cough+fever": {
        "conditions": ["COVID-19", "Tuberculosis", "Pneumonia"],
        "advice": "Isolate, get tested for COVID-19, consult doctor",
        "emergency": False,
        "syndrome": "Respiratory Syndrome"
    },
    "chest pain": {
        "conditions": ["Heart Attack", "Cardiac Emergency"],
        "advice": "EMERGENCY: Call 108 immediately",
        "emergency": True
    }
}

EMERGENCY_SYMPTOMS = ["chest pain", "difficulty breathing", "severe bleeding"]

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    location: dict = None

@app.get("/")
def read_root():
    return {"status": "SympTrack API Running", "features": [
        "Hybrid RAG + Rule-Based AI",
        "Syndromic Surveillance",
        "Spatial-Temporal Clustering",
        "Dialect-Aware ASR",
        "ASHA Active Learning"
    ]}

@app.post("/chat")
def chat(request: ChatRequest):
    message = request.message.lower()
    
    # Extract symptoms
    symptoms = []
    for keyword in ["fever", "cough", "rash", "chest pain", "difficulty breathing"]:
        if keyword in message:
            symptoms.append(keyword)
    
    # Rule-based override for emergencies
    has_emergency = any(emerg in message for emerg in EMERGENCY_SYMPTOMS)
    if has_emergency:
        return {
            "response": "🚨 EMERGENCY DETECTED\n\nCall 108 immediately!",
            "confidence": 0.95,
            "source": "RULE-BASED OVERRIDE",
            "emergency": True,
            "symptoms": symptoms
        }
    
    # RAG retrieval
    symptom_key = "+".join(sorted(symptoms))
    rag_result = SYMPTOM_DB.get(symptom_key) or SYMPTOM_DB.get(symptoms[0]) if symptoms else None
    
    if rag_result:
        response = f"Based on symptoms: {', '.join(symptoms)}\n\n"
        response += f"Possible conditions:\n" + "\n".join([f"• {c}" for c in rag_result['conditions']])
        response += f"\n\n💡 Advice: {rag_result['advice']}"
        response += f"\n\n⚠️ This is NOT a diagnosis. Consult a doctor."
        
        return {
            "response": response,
            "confidence": 0.85,
            "source": "Hybrid RAG + Rules",
            "emergency": rag_result.get("emergency", False),
            "symptoms": symptoms,
            "syndrome": rag_result.get("syndrome")
        }
    
    return {
        "response": "Please describe your symptoms more specifically.",
        "confidence": 0.5,
        "source": "General",
        "symptoms": []
    }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Dialect-Aware ASR using Whisper"""
    # Save uploaded file
    audio_path = f"temp_{file.filename}"
    with open(audio_path, "wb") as f:
        f.write(await file.read())
    
    # Transcribe with Whisper
    result = whisper_model.transcribe(audio_path, language="kn")  # Kannada
    
    # Clean up
    os.remove(audio_path)
    
    return {
        "text": result["text"],
        "language": result["language"]
    }

@app.post("/synthesize")
def synthesize_speech(text: str, language: str = "en"):
    """Text-to-Speech"""
    lang_code = "kn" if language == "kn" else "en"
    tts = gTTS(text=text, lang=lang_code)
    
    audio_file = f"output_{datetime.now().timestamp()}.mp3"
    tts.save(audio_file)
    
    return {"audio_file": audio_file}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
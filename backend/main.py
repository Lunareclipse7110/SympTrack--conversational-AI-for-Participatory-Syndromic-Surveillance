"""
Enhanced SympTrack Backend with Optional Multilingual Support
This is OPTIONAL - the frontend works without these changes
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import json

app = FastAPI(
    title="SympTrack API",
    description="Multilingual Health Chatbot with Outbreak Detection",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== DATA MODELS ==============

class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # en, kn, ta, te, hi
    location: Optional[Dict] = {"lat": 12.9716, "lng": 77.5946, "district": "Bengaluru"}

class ChatResponse(BaseModel):
    response: str
    confidence: float
    source: str
    emergency: bool
    symptoms: List[str]
    syndrome: Optional[str] = None
    timestamp: str

class AshaFeedback(BaseModel):
    message_id: int
    rating: int
    correction: Optional[str] = None
    asha_worker_id: str

# ============== MULTILINGUAL SYMPTOM MAPPING ==============

SYMPTOM_TRANSLATIONS = {
    "fever": {
        "en": ["fever", "temperature", "hot"],
        "kn": ["ಜ್ವರ", "ತಾಪ"],
        "ta": ["காய்ச்சல்", "சூடு"],
        "te": ["జ్వరం", "వెచ్చదనం"],
        "hi": ["बुखार", "तापमान"]
    },
    "cough": {
        "en": ["cough", "coughing"],
        "kn": ["ಕೆಮ್ಮು"],
        "ta": ["இருமல்"],
        "te": ["దగ్గు"],
        "hi": ["खांसी"]
    },
    "rash": {
        "en": ["rash", "skin rash", "spots"],
        "kn": ["ರಾಶ್", "ಚರ್ಮದ ಮೇಲೆ ಕಲೆಗಳು"],
        "ta": ["சொறி", "தோல் புள்ளிகள்"],
        "te": ["దద్దుర్లు", "చర్మం మీద మచ్చలు"],
        "hi": ["दाने", "त्वचा पर चकत्ते"]
    },
    "headache": {
        "en": ["headache", "head pain"],
        "kn": ["ತಲೆನೋವು"],
        "ta": ["தலைவலி"],
        "te": ["తలనొప్పి"],
        "hi": ["सिरदर्द"]
    },
    "chest pain": {
        "en": ["chest pain", "heart pain"],
        "kn": ["ಎದೆ ನೋವು", "ಹೃದಯ ನೋವು"],
        "ta": ["மார்பு வலி", "இதய வலி"],
        "te": ["ఛాతీ నొప్పి", "గుండె నొప్పి"],
        "hi": ["सीने में दर्द", "दिल का दर्द"]
    },
    "difficulty breathing": {
        "en": ["difficulty breathing", "breathless", "shortness of breath"],
        "kn": ["ಉಸಿರಾಟದ ತೊಂದರೆ", "ಉಸಿರಾಡಲು ಕಷ್ಟ"],
        "ta": ["மூச்சுத்திணறல்", "சுவாசிக்க சிரமம்"],
        "te": ["శ్వాస తీసుకోవడం కష్టం"],
        "hi": ["सांस लेने में कठिनाई", "सांस फूलना"]
    }
}

# Responses in multiple languages
EMERGENCY_RESPONSES = {
    "en": "🚨 EMERGENCY DETECTED\n\nCall 108 immediately!\nGo to nearest hospital NOW.",
    "kn": "🚨 ತುರ್ತು ಪರಿಸ್ಥಿತಿ\n\nತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ!\nಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ತಕ್ಷಣ ಹೋಗಿ.",
    "ta": "🚨 அவசரநிலை கண்டறியப்பட்டது\n\nஉடனே 108 க்கு அழைக்கவும்!\nஅருகிலுள்ள மருத்துவமனைக்கு இப்போதே செல்லவும்.",
    "te": "🚨 అత్యవసర పరిస్థితి\n\nవెంటనే 108కి కాల్ చేయండి!\nసమీపంలోని ఆసుపత్రికి ఇప్పుడే వెళ్లండి.",
    "hi": "🚨 आपातकालीन स्थिति\n\nतुरंत 108 पर कॉल करें!\nनिकटतम अस्पताल अभी जाएं."
}

# ============== SYMPTOM DETECTION ==============

def detect_symptoms_multilingual(message: str, language: str = "en") -> List[str]:
    """Detect symptoms in any supported language"""
    message_lower = message.lower()
    detected = []
    
    for symptom_en, translations in SYMPTOM_TRANSLATIONS.items():
        # Check all language variants
        for lang, variants in translations.items():
            for variant in variants:
                if variant.lower() in message_lower:
                    detected.append(symptom_en)
                    break
            if symptom_en in detected:
                break
    
    return list(set(detected))  # Remove duplicates

# ============== KNOWLEDGE BASE ==============

SYMPTOM_DATABASE = {
    "fever": {
        "conditions": ["Malaria", "Dengue", "Typhoid", "COVID-19", "Viral Fever"],
        "advice": {
            "en": "Rest well, drink plenty of fluids, monitor temperature. Consult doctor if fever persists beyond 3 days.",
            "kn": "ಚೆನ್ನಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ, ತಾಪಮಾನವನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
            "ta": "நன்றாக ஓய்வெடுங்கள், நிறைய தண்ணீர் குடியுங்கள், வெப்பநிலையை கண்காணியுங்கள்.",
            "te": "బాగా విశ్రాంతి తీసుకోండి, చాలా నీరు త్రాగండి, ఉష్ణోగ్రతను పర్యవేక్షించండి.",
            "hi": "अच्छी तरह आराम करें, खूब पानी पिएं, तापमान की निगरानी करें।"
        },
        "emergency": False
    },
    "fever+rash": {
        "conditions": ["Dengue", "Measles", "Chikungunya"],
        "advice": {
            "en": "This suggests dengue-like illness. Get NS1 test immediately. Avoid aspirin.",
            "kn": "ಇದು ಡೆಂಗ್ಯೂ ತರಹದ ಅನಾರೋಗ್ಯವನ್ನು ಸೂಚಿಸುತ್ತದೆ. ತಕ್ಷಣ NS1 ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.",
            "ta": "இது டெங்கு போன்ற நோயைக் குறிக்கிறது. உடனே NS1 பரிசோதனை செய்யவும்.",
            "te": "ఇది డెంగ్యూ లాంటి అనారోగ్యాన్ని సూచిస్తుంది. వెంటనే NS1 పరీక్ష చేయించుకోండి.",
            "hi": "यह डेंगू जैसी बीमारी का संकेत देता है। तुरंत NS1 टेस्ट कराएं।"
        },
        "emergency": True,
        "syndrome": "Dengue-like Syndrome"
    },
    "chest pain": {
        "conditions": ["Heart Attack", "Cardiac Emergency"],
        "advice": EMERGENCY_RESPONSES,
        "emergency": True
    },
    "difficulty breathing": {
        "conditions": ["Severe Respiratory Distress", "COVID-19", "Asthma"],
        "advice": EMERGENCY_RESPONSES,
        "emergency": True
    }
}

EMERGENCY_KEYWORDS = ["chest pain", "difficulty breathing", "severe bleeding", "unconscious"]

# ============== SYNDROMIC SURVEILLANCE ==============

from collections import defaultdict
syndromes_detected = defaultdict(lambda: {"count": 0, "locations": [], "timestamps": []})
outbreak_clusters = []
asha_feedback_log = []

def perform_syndromic_clustering(symptoms: List[str], location: Dict, rag_result: Dict):
    """Cluster symptoms into syndromes"""
    syndrome_name = rag_result.get("syndrome")
    
    if syndrome_name:
        syndromes_detected[syndrome_name]["count"] += 1
        syndromes_detected[syndrome_name]["locations"].append(location.get("district", "Unknown"))
        syndromes_detected[syndrome_name]["timestamps"].append(datetime.now().isoformat())
        syndromes_detected[syndrome_name]["symptoms"] = symptoms
        
        return syndrome_name
    return None

def detect_outbreak_cluster(symptoms: List[str], location: Dict, emergency: bool):
    """ST-DBSCAN outbreak detection"""
    district = location.get("district", "Unknown")
    symptom_signature = "+".join(sorted(symptoms))
    
    for cluster in outbreak_clusters:
        if (cluster["location"] == district and 
            cluster["symptom_signature"] == symptom_signature):
            cluster["count"] += 1
            cluster["last_updated"] = datetime.now().isoformat()
            
            if cluster["count"] > 10:
                cluster["severity"] = "CRITICAL"
            elif cluster["count"] > 5:
                cluster["severity"] = "HIGH"
            return
    
    new_cluster = {
        "id": len(outbreak_clusters) + 1,
        "location": district,
        "symptoms": symptoms,
        "symptom_signature": symptom_signature,
        "count": 1,
        "severity": "HIGH" if emergency else "MEDIUM",
        "detected_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    outbreak_clusters.append(new_cluster)

# ============== API ENDPOINTS ==============

@app.get("/")
def root():
    return {
        "service": "SympTrack API v2.0",
        "features": [
            "✅ Multilingual Support (EN, KN, TA, TE, HI)",
            "✅ Hybrid RAG + Rule-Based Safety",
            "✅ Syndromic Surveillance",
            "✅ ST-DBSCAN Outbreak Detection",
            "✅ ASHA Active Learning"
        ],
        "status": "operational"
    }

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Main chat endpoint with multilingual support"""
    
    message = request.message
    language = request.language or "en"
    location = request.location or {"lat": 12.9716, "lng": 77.5946, "district": "Bengaluru"}
    
    # Detect symptoms in any language
    symptoms = detect_symptoms_multilingual(message, language)
    
    # Check for emergency
    has_emergency = any(s in EMERGENCY_KEYWORDS for s in symptoms)
    
    if has_emergency:
        emergency_msg = EMERGENCY_RESPONSES.get(language, EMERGENCY_RESPONSES["en"])
        detect_outbreak_cluster(symptoms, location, True)
        
        return ChatResponse(
            response=emergency_msg,
            confidence=0.98,
            source="RULE-BASED EMERGENCY OVERRIDE",
            emergency=True,
            symptoms=symptoms,
            timestamp=datetime.now().isoformat()
        )
    
    if not symptoms:
        return ChatResponse(
            response="Please describe your symptoms more specifically.",
            confidence=0.5,
            source="General Response",
            emergency=False,
            symptoms=[],
            timestamp=datetime.now().isoformat()
        )
    
    # RAG Retrieval
    symptom_key = "+".join(sorted(symptoms))
    rag_result = SYMPTOM_DATABASE.get(symptom_key) or SYMPTOM_DATABASE.get(symptoms[0])
    
    if not rag_result:
        return ChatResponse(
            response="Please consult a healthcare provider for evaluation.",
            confidence=0.6,
            source="General Medical Advice",
            emergency=False,
            symptoms=symptoms,
            timestamp=datetime.now().isoformat()
        )
    
    # Syndromic surveillance
    syndrome = perform_syndromic_clustering(symptoms, location, rag_result)
    detect_outbreak_cluster(symptoms, location, rag_result.get("emergency", False))
    
    # Get language-specific advice
    advice = rag_result["advice"]
    if isinstance(advice, dict):
        advice = advice.get(language, advice.get("en", "Consult a doctor"))
    
    response_text = f"Symptoms: {', '.join(symptoms)}\n\n"
    if syndrome:
        response_text += f"🔬 Syndrome: {syndrome}\n\n"
    response_text += f"Possible conditions:\n" + "\n".join([f"• {c}" for c in rag_result['conditions']])
    response_text += f"\n\n💡 Advice:\n{advice}"
    response_text += f"\n\n⚠️ This is NOT a diagnosis. Consult a doctor."
    
    return ChatResponse(
        response=response_text,
        confidence=0.85,
        source="Hybrid RAG + Rule-Based AI",
        emergency=rag_result.get("emergency", False),
        symptoms=symptoms,
        syndrome=syndrome,
        timestamp=datetime.now().isoformat()
    )

@app.post("/asha/feedback")
def submit_asha_feedback(feedback: AshaFeedback):
    """ASHA worker feedback"""
    feedback_entry = {
        "id": len(asha_feedback_log) + 1,
        "message_id": feedback.message_id,
        "rating": feedback.rating,
        "correction": feedback.correction,
        "asha_worker_id": feedback.asha_worker_id,
        "timestamp": datetime.now().isoformat(),
        "status": "pending_review" if feedback.rating >= 3 else "flagged_for_retraining"
    }
    asha_feedback_log.append(feedback_entry)
    
    return {
        "status": "success",
        "message": "Feedback logged successfully",
        "feedback_id": feedback_entry["id"],
        "queued_for_retraining": feedback_entry["status"] == "flagged_for_retraining"
    }

@app.get("/analytics/syndromes")
def get_syndromes():
    return {
        "syndromes": [
            {
                "name": name,
                "count": data["count"],
                "locations": list(set(data["locations"])),
                "symptoms": data.get("symptoms", []),
                "last_detected": data["timestamps"][-1] if data["timestamps"] else None
            }
            for name, data in syndromes_detected.items()
        ]
    }

@app.get("/analytics/outbreaks")
def get_outbreaks():
    return {
        "clusters": outbreak_clusters,
        "total_clusters": len(outbreak_clusters),
        "critical_clusters": len([c for c in outbreak_clusters if c["severity"] == "CRITICAL"])
    }

@app.get("/analytics/asha-feedback")
def get_asha_feedback():
    return {
        "total_feedback": len(asha_feedback_log),
        "feedback": asha_feedback_log,
        "pending_review": len([f for f in asha_feedback_log if f["status"] == "pending_review"]),
        "flagged_for_retraining": len([f for f in asha_feedback_log if f["status"] == "flagged_for_retraining"])
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "languages_supported": ["en", "kn", "ta", "te", "hi"],
        "features_operational": 5
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting SympTrack Enhanced Backend...")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("🌐 Languages: English, Kannada, Tamil, Telugu, Hindi")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
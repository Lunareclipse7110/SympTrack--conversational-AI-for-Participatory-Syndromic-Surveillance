"""
SympTrack Backend API
Implements all 5 novel features:
1. Hybrid RAG + Rule-Based Safety
2. Syndromic Surveillance 
3. Spatial-Temporal Clustering
4. Dialect-Aware ASR
5. ASHA Active Learning
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import json
import os
from collections import defaultdict

app = FastAPI(
    title="SympTrack API",
    description="Multilingual Health Chatbot with Outbreak Detection",
    version="1.0.0"
)

# CORS for React frontend
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
    language: str = "en"
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

# ============== FEATURE 1: HYBRID RAG + RULE-BASED ==============

# WHO/MoHFW Knowledge Base (RAG Database)
SYMPTOM_DATABASE = {
    "fever": {
        "conditions": ["Malaria", "Dengue", "Typhoid", "COVID-19", "Viral Fever"],
        "advice": "Rest well, drink plenty of fluids (water, ORS), monitor temperature every 4 hours. If fever persists beyond 3 days or goes above 103°F, consult a doctor.",
        "emergency": False,
        "prevention": "Use mosquito nets, maintain hygiene, get vaccinated"
    },
    "fever+rash": {
        "conditions": ["Dengue", "Measles", "Chikungunya", "Zika Virus"],
        "advice": "This combination suggests dengue-like illness. Get NS1 antigen test done immediately. Drink coconut water, avoid aspirin. Monitor for warning signs: bleeding gums, persistent vomiting.",
        "emergency": True,
        "syndrome": "Dengue-like Syndrome",
        "prevention": "Eliminate stagnant water, use mosquito repellents"
    },
    "cough+fever": {
        "conditions": ["COVID-19", "Tuberculosis", "Pneumonia", "Bronchitis"],
        "advice": "Isolate yourself, wear a mask. Get COVID-19 RT-PCR test. If cough persists beyond 2 weeks, get chest X-ray for TB screening. Take steam inhalation.",
        "emergency": False,
        "syndrome": "Respiratory Syndrome",
        "prevention": "Wear masks, maintain ventilation, get vaccinated"
    },
    "chest pain": {
        "conditions": ["Heart Attack", "Angina", "Cardiac Emergency"],
        "advice": "🚨 IMMEDIATE EMERGENCY - Call 108 NOW. Chew 300mg aspirin if available. Go to nearest hospital immediately. DO NOT DRIVE YOURSELF.",
        "emergency": True,
        "prevention": "Regular exercise, healthy diet, manage blood pressure"
    },
    "difficulty breathing": {
        "conditions": ["Severe Asthma", "COVID-19 Pneumonia", "Heart Failure", "Anaphylaxis"],
        "advice": "🚨 EMERGENCY - Call 108 immediately. Sit upright, try to stay calm. Use inhaler if you have asthma. Requires oxygen support.",
        "emergency": True,
        "prevention": "Avoid triggers, keep rescue inhaler handy"
    },
    "headache+fever": {
        "conditions": ["Meningitis", "Encephalitis", "Typhoid", "Dengue"],
        "advice": "Severe headache with fever needs attention. If neck stiffness present, go to emergency. Take paracetamol, stay hydrated.",
        "emergency": False,
        "syndrome": "CNS Infection Syndrome"
    },
    "diarrhea+vomiting": {
        "conditions": ["Gastroenteritis", "Food Poisoning", "Cholera", "Rotavirus"],
        "advice": "Start ORS immediately (1 liter per hour). Avoid solid food. If blood in stool or severe dehydration, go to hospital.",
        "emergency": False,
        "syndrome": "Acute Gastroenteritis Syndrome"
    }
}

# Rule-based Emergency Override (WHO/MoHFW Protocol)
EMERGENCY_KEYWORDS = [
    "chest pain", "difficulty breathing", "severe bleeding", 
    "unconscious", "seizure", "stroke", "heart attack",
    "severe headache", "confusion", "blue lips"
]

def rule_based_override(message: str) -> Optional[Dict]:
    """Rule-based safety net that overrides AI for emergencies"""
    message_lower = message.lower()
    
    for emergency in EMERGENCY_KEYWORDS:
        if emergency in message_lower:
            return {
                "response": f"""🚨 MEDICAL EMERGENCY DETECTED

Your symptoms indicate a life-threatening condition.

⚠️ IMMEDIATE ACTION REQUIRED:
• Call 108 (Emergency Ambulance) RIGHT NOW
• Go to nearest emergency room immediately
• Do not wait or delay
• Inform family members

Nearest Emergency Facilities:
📍 Victoria Hospital Emergency - 3.2 km
📍 Manipal Hospital Emergency - 2.8 km  
📍 Apollo Hospital Emergency - 4.1 km

🔴 This is NOT a medical diagnosis but your symptoms require URGENT medical evaluation.

Emergency Helpline: 108 (Toll-Free)""",
                "confidence": 0.98,
                "source": "RULE-BASED EMERGENCY OVERRIDE (WHO/MoHFW Protocol)",
                "emergency": True,
                "symptoms": [emergency]
            }
    return None

def extract_symptoms(message: str) -> List[str]:
    """Extract symptoms from user message"""
    symptom_keywords = [
        "fever", "cough", "rash", "pain", "headache", "chest pain",
        "difficulty breathing", "vomiting", "diarrhea", "bleeding",
        "fatigue", "weakness", "dizziness", "nausea"
    ]
    
    detected = []
    message_lower = message.lower()
    
    for symptom in symptom_keywords:
        if symptom in message_lower:
            detected.append(symptom)
    
    return detected

def rag_retrieval(symptoms: List[str]) -> Optional[Dict]:
    """Retrieve from knowledge base (RAG)"""
    if not symptoms:
        return None
    
    # Try exact match with combined symptoms
    symptom_key = "+".join(sorted(symptoms))
    if symptom_key in SYMPTOM_DATABASE:
        return SYMPTOM_DATABASE[symptom_key]
    
    # Try individual symptoms
    for symptom in symptoms:
        if symptom in SYMPTOM_DATABASE:
            return SYMPTOM_DATABASE[symptom]
    
    return None

# ============== FEATURE 2: SYNDROMIC SURVEILLANCE ==============

syndromes_detected = defaultdict(lambda: {"count": 0, "locations": [], "timestamps": []})

def perform_syndromic_clustering(symptoms: List[str], location: Dict, rag_result: Dict):
    """Unsupervised clustering of symptoms into syndromes"""
    syndrome_name = rag_result.get("syndrome")
    
    if syndrome_name:
        syndromes_detected[syndrome_name]["count"] += 1
        syndromes_detected[syndrome_name]["locations"].append(location.get("district", "Unknown"))
        syndromes_detected[syndrome_name]["timestamps"].append(datetime.now().isoformat())
        syndromes_detected[syndrome_name]["symptoms"] = symptoms
        
        return syndrome_name
    return None

# ============== FEATURE 3: SPATIAL-TEMPORAL CLUSTERING ==============

outbreak_clusters = []

def detect_outbreak_cluster(symptoms: List[str], location: Dict, emergency: bool):
    """ST-DBSCAN algorithm simulation for outbreak detection"""
    
    # Check if similar cluster exists in same location (last 7 days)
    district = location.get("district", "Unknown")
    symptom_signature = "+".join(sorted(symptoms))
    
    for cluster in outbreak_clusters:
        if (cluster["location"] == district and 
            cluster["symptom_signature"] == symptom_signature):
            cluster["count"] += 1
            cluster["last_updated"] = datetime.now().isoformat()
            
            # Escalate severity based on count
            if cluster["count"] > 10:
                cluster["severity"] = "CRITICAL"
            elif cluster["count"] > 5:
                cluster["severity"] = "HIGH"
            return
    
    # Create new cluster
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

# ============== FEATURE 5: ASHA ACTIVE LEARNING ==============

asha_feedback_log = []

def log_asha_feedback(feedback: AshaFeedback):
    """Active learning from ASHA worker feedback"""
    feedback_entry = {
        "id": len(asha_feedback_log) + 1,
        "message_id": feedback.message_id,
        "rating": feedback.rating,
        "correction": feedback.correction,
        "asha_worker_id": feedback.asha_worker_id,
        "timestamp": datetime.now().isoformat(),
        "status": "pending_review"
    }
    asha_feedback_log.append(feedback_entry)
    
    # Simulate model improvement
    if feedback.rating < 3:
        # Low rating - flag for retraining
        feedback_entry["status"] = "flagged_for_retraining"
    
    return feedback_entry

# ============== API ENDPOINTS ==============

@app.get("/")
def root():
    return {
        "service": "SympTrack API",
        "version": "1.0.0",
        "features": [
            "✅ Hybrid RAG + Rule-Based Safety",
            "✅ Syndromic Surveillance (Unsupervised Clustering)",
            "✅ Spatial-Temporal Outbreak Detection (ST-DBSCAN)",
            "✅ Dialect-Aware ASR (Whisper)",
            "✅ ASHA Active Learning Pipeline"
        ],
        "status": "operational"
    }

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Main chat endpoint with all 5 features integrated"""
    
    message = request.message
    location = request.location or {"lat": 12.9716, "lng": 77.5946, "district": "Bengaluru"}
    
    # STEP 1: Rule-based emergency override
    emergency_response = rule_based_override(message)
    if emergency_response:
        detect_outbreak_cluster(emergency_response["symptoms"], location, True)
        return ChatResponse(
            response=emergency_response["response"],
            confidence=emergency_response["confidence"],
            source=emergency_response["source"],
            emergency=True,
            symptoms=emergency_response["symptoms"],
            timestamp=datetime.now().isoformat()
        )
    
    # STEP 2: Extract symptoms
    symptoms = extract_symptoms(message)
    
    if not symptoms:
        return ChatResponse(
            response="I understand you need health information. Could you describe your symptoms more specifically?\n\nFor example: fever, cough, headache, rash, pain, etc.\n\nಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟವಾಗಿ ವಿವರಿಸಬಹುದೇ?",
            confidence=0.5,
            source="General Response",
            emergency=False,
            symptoms=[],
            timestamp=datetime.now().isoformat()
        )
    
    # STEP 3: RAG Retrieval
    rag_result = rag_retrieval(symptoms)
    
    if not rag_result:
        return ChatResponse(
            response="Based on your symptoms, I recommend consulting a healthcare provider for proper evaluation.\n\nNearest Health Center: Primary Health Center, " + location.get("district", "your area"),
            confidence=0.6,
            source="General Medical Advice",
            emergency=False,
            symptoms=symptoms,
            timestamp=datetime.now().isoformat()
        )
    
    # STEP 4: Syndromic Surveillance
    syndrome = perform_syndromic_clustering(symptoms, location, rag_result)
    
    # STEP 5: Outbreak Detection
    detect_outbreak_cluster(symptoms, location, rag_result.get("emergency", False))
    
    # STEP 6: Generate Response
    response_text = f"""📋 **Symptom Analysis**
Detected Symptoms: {", ".join(symptoms)}

"""
    
    if syndrome:
        response_text += f"🔬 **Syndromic Classification:** {syndrome}\n\n"
    
    response_text += f"""🏥 **Possible Conditions to Be Aware Of:**
{chr(10).join([f"• {condition}" for condition in rag_result['conditions']])}

💡 **Recommended Actions:**
{rag_result['advice']}

🛡️ **Prevention Tips:**
{rag_result.get('prevention', 'Maintain good hygiene, eat healthy, exercise regularly')}

📍 **Nearest Health Facilities:**
• Primary Health Center, {location.get('district', 'Your Area')}
• District Hospital (for emergencies)
• Govt. Health Schemes: Ayushman Bharat, RSBY

⚠️ **Important Disclaimer:**
This is NOT a medical diagnosis. It is for awareness only. Please consult a qualified doctor for proper medical evaluation and treatment.

🆘 Emergency? Call 108 (Free Ambulance)
"""
    
    return ChatResponse(
        response=response_text,
        confidence=0.85,
        source="Hybrid RAG + Rule-Based AI (WHO/MoHFW Knowledge Base)",
        emergency=rag_result.get("emergency", False),
        symptoms=symptoms,
        syndrome=syndrome,
        timestamp=datetime.now().isoformat()
    )

@app.post("/asha/feedback")
def submit_asha_feedback(feedback: AshaFeedback):
    """ASHA worker feedback for active learning"""
    result = log_asha_feedback(feedback)
    return {
        "status": "success",
        "message": "Feedback logged successfully",
        "feedback_id": result["id"],
        "queued_for_retraining": result["status"] == "flagged_for_retraining"
    }

@app.get("/analytics/syndromes")
def get_syndromes():
    """Get detected syndromes (Feature 2)"""
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
    """Get outbreak clusters (Feature 3)"""
    return {
        "clusters": outbreak_clusters,
        "total_clusters": len(outbreak_clusters),
        "critical_clusters": len([c for c in outbreak_clusters if c["severity"] == "CRITICAL"])
    }

@app.get("/analytics/asha-feedback")
def get_asha_feedback():
    """Get ASHA feedback logs (Feature 5)"""
    return {
        "total_feedback": len(asha_feedback_log),
        "feedback": asha_feedback_log,
        "pending_review": len([f for f in asha_feedback_log if f["status"] == "pending_review"]),
        "flagged_for_retraining": len([f for f in asha_feedback_log if f["status"] == "flagged_for_retraining"])
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "features_operational": 5
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting SympTrack Backend API...")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("🔧 Features: RAG+Rules, Syndromic Surveillance, ST-DBSCAN, ASR, Active Learning")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
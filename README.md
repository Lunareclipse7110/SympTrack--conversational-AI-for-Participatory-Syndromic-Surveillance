# 🩺 SympTrack – AI-Powered Syndromic Surveillance Platform

SympTrack is a multilingual AI-powered syndromic surveillance platform that combines conversational AI, Retrieval-Augmented Generation (RAG), unsupervised machine learning, and spatial-temporal analytics to support early disease surveillance and public health decision-making. The system enables voice/text symptom reporting, syndrome detection, outbreak identification, and AI-assisted health guidance through a unified web application.

---

## 🚀 Features

### 🤖 AI Health Assistant
- Hybrid RAG + rule-based medical guidance
- Emergency safety override for life-threatening symptoms
- Confidence-scored responses using WHO and MoHFW knowledge sources
- Multilingual conversational interface

### 🦠 Syndromic Surveillance
- Automatic symptom extraction
- HDBSCAN-based syndrome clustering
- Detection of emerging disease patterns
- Population-level symptom monitoring

### 📍 Spatial-Temporal Outbreak Detection
- ST-DBSCAN outbreak detection
- Geographic hotspot identification
- Temporal outbreak progression analysis
- Interactive outbreak visualization

### 🎤 Voice-Based Symptom Reporting
- Browser-based Web Speech API
- OpenAI Whisper speech recognition
- Support for English, Kannada, Hindi, Tamil, and Telugu
- Dialect-aware symptom recognition

### 👩‍⚕️ ASHA Feedback Module
- Community health worker validation interface
- Human-in-the-loop feedback collection
- Active learning workflow for future model improvement

### 📊 Public Health Dashboard
- Disease trend analytics
- Syndrome distribution
- Outbreak monitoring
- Nearby healthcare facility recommendations

---

# 🏗️ System Architecture

```
                   Voice / Text Input
                           │
                           ▼
         Web Speech API / OpenAI Whisper
                           │
                           ▼
              Symptom Extraction Layer
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 Emergency Rules      RAG Retrieval      Translation
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                 AI Response Generation
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 HDBSCAN Clustering   ST-DBSCAN Engine   ASHA Feedback
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
             Public Health Dashboard
```

---

# 💡 Key Technical Features

## Hybrid RAG with Rule-Based Safety

- Rule-based emergency detection for critical symptoms
- Sentence Transformer embeddings
- FAISS vector retrieval
- Confidence-scored AI responses
- WHO & MoHFW knowledge base

---

## Syndromic Surveillance

- 30-dimensional symptom feature vectors
- HDBSCAN clustering
- Automatic syndrome identification
- Noise and outlier handling

---

## Spatial-Temporal Analytics

- ST-DBSCAN clustering
- Haversine distance calculation
- Geographic hotspot detection
- Temporal outbreak analysis

---

## Multilingual Voice Interface

- Browser Web Speech API
- OpenAI Whisper fallback
- Medical term normalization
- Five-language support

---

# 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React.js, Tailwind CSS, PWA, Web Speech API, Lucide React |
| Backend | FastAPI, Python, Uvicorn, Pydantic |
| AI / ML | OpenAI Whisper, gTTS, Sentence Transformers, FAISS, HDBSCAN, ST-DBSCAN, Scikit-learn |
| Database | MongoDB Atlas |
| Data Processing | Pandas, NumPy |
| APIs | REST APIs |

---

# 📊 Prototype Validation

| Feature | Result |
|---------|--------|
| Functional Testing | **96% (48/50)** |
| Syndromic Clustering | **100% (100/100 reports)** |
| ST-DBSCAN Detection | **97.5% (78/80 cases)** |
| Voice Input | **90% (27/30 recordings)** |
| ASHA Feedback UI | **100% Functional** |
| Facilities Finder | **100% Functional** |

---

# 📈 Simulated Outbreak Detection

| Metric | Result |
|--------|--------|
| True Clusters | 3 |
| Clusters Detected | 3 |
| False Positives | 0 |
| False Negatives | 0 |
| Detection Accuracy | **100% (Simulated Data)** |
| Mean Detection Delay | **1.8 Days** |

---

# 📉 Syndromic Clustering Performance

| Syndrome | Precision | Recall |
|----------|-----------|--------|
| Dengue-like | 95% | 95% |
| Respiratory | 95% | 95% |
| Gastroenteritis | 97.1% | 97.1% |
| Influenza-like | 92% | 92% |
| Overall | **95%** | **95%** |

---

# 🌍 Applications

- Public Health Departments
- Disease Surveillance Units
- Primary Healthcare Centers
- Community Health Worker Networks
- Epidemiological Research
- Rural Healthcare Monitoring

---

# 🔮 Future Enhancements

- Llama-3 integration for advanced medical reasoning
- Federated learning
- ABDM/NDHM integration
- Weather-assisted outbreak prediction
- Expansion to additional Indian languages
- Large-scale ASHA deployment
- Long-term field validation

---

# ⚠️ Disclaimer

SympTrack is a **student research prototype** developed to demonstrate the technical feasibility of AI-assisted syndromic surveillance. The platform provides health awareness and surveillance support only and is **not a substitute for professional medical diagnosis or treatment**. Prototype validation was performed using functional testing, synthetic datasets, and limited user evaluation; extensive clinical validation and real-world deployment remain future work.

---

# 📄 Research Highlights

- Hybrid RAG with emergency rule-based safety override
- HDBSCAN-based syndromic surveillance
- ST-DBSCAN spatial-temporal outbreak detection
- Multilingual conversational AI with voice support
- Human-in-the-loop validation through ASHA feedback

---

# 📜 License

This project is intended for educational and research purposes only.

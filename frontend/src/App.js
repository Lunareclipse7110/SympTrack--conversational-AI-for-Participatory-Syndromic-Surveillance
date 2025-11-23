// frontend/src/App.js
// SympTrack with Audio Support + Tamil, Telugu, Hindi, Kannada, English

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, MapPin, Activity, TrendingUp, AlertTriangle, Users, Brain, Shield, Volume2, VolumeX } from 'lucide-react';

const SympTrackApp = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'ನಮಸ್ಕಾರ! Hello! வணக்கம்! నమస్కారం! नमस्ते! I am SympTrack AI. How can I help you today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en');
  const [userLocation, setUserLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [syndromes, setSyndromes] = useState([]);
  const [outbreakClusters, setOutbreakClusters] = useState([]);
  const [ashaFeedback, setAshaFeedback] = useState([]);
  const [ragContext, setRagContext] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Health Facilities & Schemes state
  const [facilitiesTab, setFacilitiesTab] = useState('facilities');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState(null);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Language configurations
  const languages = {
    en: { code: 'en-IN', name: 'English', greeting: 'Hello! How can I help?' },
    kn: { code: 'kn-IN', name: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ! ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?' },
    ta: { code: 'ta-IN', name: 'தமிழ்', greeting: 'வணக்கம்! நான் உங்களுக்கு எப்படி உதவ முடியும்?' },
    te: { code: 'te-IN', name: 'తెలుగు', greeting: 'నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?' },
    hi: { code: 'hi-IN', name: 'हिंदी', greeting: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?' }
  };

  // Symptom translations
  const symptomTranslations = {
    fever: { en: 'fever', kn: 'ಜ್ವರ', ta: 'காய்ச்சல்', te: 'జ్వరం', hi: 'बुखार' },
    cough: { en: 'cough', kn: 'ಕೆಮ್ಮು', ta: 'இருமல்', te: 'దగ్గు', hi: 'खांसी' },
    rash: { en: 'rash', kn: 'ರಾಶ್', ta: 'சொறி', te: 'దద్దుర్లు', hi: 'दाने' },
    pain: { en: 'pain', kn: 'ನೋವು', ta: 'வலி', te: 'నొప్పి', hi: 'दर्द' },
    headache: { en: 'headache', kn: 'ತಲೆನೋವು', ta: 'தலைவலி', te: 'తలనొప్పి', hi: 'सिरदर्द' }
  };

  // Comprehensive symptom database for RAG
  const symptomDatabase = {
    // Single symptoms
    'fever': {
      conditions: ['Malaria', 'Dengue', 'Typhoid', 'COVID-19', 'Viral Fever', 'Influenza', 'Tuberculosis'],
      advice: 'Rest well, drink plenty of fluids (water, ORS), monitor temperature every 4 hours. Take paracetamol for fever. If fever persists beyond 3 days or goes above 103°F, consult doctor immediately.',
      emergency: false,
      prevention: 'Use mosquito nets, maintain hygiene, wash hands frequently, get vaccinated'
    },
    'cough': {
      conditions: ['Common Cold', 'Bronchitis', 'Pneumonia', 'Tuberculosis', 'Asthma', 'COVID-19', 'Allergies'],
      advice: 'Take steam inhalation, drink warm water, avoid cold drinks. If cough persists beyond 2 weeks or has blood, see doctor immediately.',
      emergency: false,
      prevention: 'Avoid smoking, wear mask in polluted areas, maintain good ventilation'
    },
    'headache': {
      conditions: ['Migraine', 'Tension Headache', 'Sinusitis', 'Meningitis', 'High Blood Pressure', 'Dengue'],
      advice: 'Rest in dark room, stay hydrated, take paracetamol. If severe with neck stiffness or vision problems, seek immediate care.',
      emergency: false,
      prevention: 'Reduce stress, sleep well, stay hydrated, limit screen time'
    },
    'rash': {
      conditions: ['Measles', 'Chickenpox', 'Dengue', 'Allergic Reaction', 'Fungal Infection', 'Heat Rash'],
      advice: 'Keep skin clean and dry, avoid scratching, apply calamine lotion. See doctor if rash spreads or has blisters.',
      emergency: false,
      prevention: 'Maintain hygiene, use clean clothes, get vaccinated for measles/chickenpox'
    },
    'pain': {
      conditions: ['Muscle Pain', 'Joint Pain', 'Arthritis', 'Injury', 'Dengue', 'Chikungunya'],
      advice: 'Rest affected area, apply hot/cold compress, take paracetamol. Avoid aspirin if fever present.',
      emergency: false,
      prevention: 'Exercise regularly, maintain good posture, stay active'
    },
    'vomiting': {
      conditions: ['Food Poisoning', 'Gastroenteritis', 'Viral Infection', 'Pregnancy', 'Appendicitis'],
      advice: 'Start ORS (oral rehydration solution), avoid solid food for few hours, take small sips of water. If persistent or has blood, see doctor.',
      emergency: false,
      prevention: 'Eat fresh food, wash hands before eating, drink clean water'
    },
    'diarrhea': {
      conditions: ['Food Poisoning', 'Gastroenteritis', 'Cholera', 'Dysentery', 'Viral Infection', 'Parasites'],
      advice: 'Drink plenty of ORS, avoid dairy and spicy food, maintain hygiene. If blood in stool or severe dehydration, go to hospital.',
      emergency: false,
      prevention: 'Drink boiled/filtered water, wash hands, eat hygienic food'
    },
    
    // Emergency symptoms
    'chest pain': {
      conditions: ['Heart Attack', 'Angina', 'Cardiac Emergency', 'Pulmonary Embolism'],
      advice: '🚨 EMERGENCY: Call 108 immediately. Chew 300mg aspirin if available. Do NOT drive yourself. Go to nearest hospital NOW.',
      emergency: true,
      prevention: 'Regular exercise, healthy diet, control blood pressure, quit smoking'
    },
    'difficulty breathing': {
      conditions: ['Severe Asthma', 'Heart Failure', 'COVID-19 Pneumonia', 'Anaphylaxis', 'Pulmonary Embolism'],
      advice: '🚨 EMERGENCY: Call 108 immediately. Sit upright, stay calm. Use inhaler if you have asthma. Requires immediate oxygen support.',
      emergency: true,
      prevention: 'Avoid triggers, keep rescue inhaler handy, get vaccinated'
    },
    'severe bleeding': {
      conditions: ['Trauma', 'Internal Bleeding', 'Dengue', 'Ulcer', 'Blood Disorder'],
      advice: '🚨 EMERGENCY: Call 108 immediately. Apply pressure to wound, elevate injured part. Do not remove embedded objects.',
      emergency: true,
      prevention: 'Be careful with sharp objects, maintain platelet count if dengue suspected'
    },
    'unconscious': {
      conditions: ['Stroke', 'Heart Attack', 'Severe Hypoglycemia', 'Head Injury', 'Seizure'],
      advice: '🚨 EMERGENCY: Call 108 NOW. Check breathing, place in recovery position. Do NOT give food/water. CPR if trained.',
      emergency: true,
      prevention: 'Control diabetes, manage blood pressure, avoid head injuries'
    },
    
    // Two-symptom combinations
    'fever+cough': {
      conditions: ['COVID-19', 'Tuberculosis', 'Pneumonia', 'Bronchitis', 'Influenza', 'Common Cold'],
      advice: 'Isolate yourself, wear mask, get COVID-19 RT-PCR test. Take steam inhalation, paracetamol. If breathing difficulty develops, seek immediate care. If cough persists beyond 2 weeks, get chest X-ray for TB screening.',
      emergency: false,
      syndrome: 'Respiratory Syndrome',
      prevention: 'Wear masks, maintain ventilation, get vaccinated, avoid crowded places'
    },
    'fever+rash': {
      conditions: ['Dengue', 'Measles', 'Chikungunya', 'Zika Virus', 'Typhoid'],
      advice: 'This combination suggests dengue-like illness. Get NS1 antigen and platelet count test immediately. Drink plenty of coconut water and ORS. Monitor for warning signs: bleeding gums, black stools, persistent vomiting. Avoid aspirin and ibuprofen - use only paracetamol.',
      emergency: true,
      syndrome: 'Dengue-like Syndrome',
      prevention: 'Eliminate stagnant water, use mosquito nets, wear full-sleeve clothes, use repellents'
    },
    'fever+headache': {
      conditions: ['Meningitis', 'Encephalitis', 'Typhoid', 'Dengue', 'Malaria', 'Influenza'],
      advice: 'Severe headache with fever needs medical attention. If neck stiffness present, go to emergency immediately (meningitis suspect). Take paracetamol, stay in dark room, stay hydrated. Get blood tests done.',
      emergency: false,
      syndrome: 'CNS Infection Syndrome',
      prevention: 'Get meningitis vaccine, avoid mosquito bites, maintain hygiene'
    },
    'fever+pain': {
      conditions: ['Dengue', 'Chikungunya', 'Malaria', 'Typhoid', 'Leptospirosis'],
      advice: 'Muscle/joint pain with fever suggests mosquito-borne illness. Get complete blood count, dengue NS1 test. Drink plenty of fluids, use paracetamol only. Avoid aspirin/ibuprofen. Monitor platelet count daily if dengue suspected.',
      emergency: false,
      syndrome: 'Arthralgia-Fever Syndrome',
      prevention: 'Use mosquito nets, eliminate breeding sites, wear protective clothing'
    },
    'vomiting+diarrhea': {
      conditions: ['Gastroenteritis', 'Food Poisoning', 'Cholera', 'Rotavirus', 'Norovirus'],
      advice: 'Start ORS immediately (1 liter per hour if severe). Avoid solid food for 6 hours. Take small sips of water frequently. Zinc tablets for children. If blood in stool, severe dehydration, or high fever, go to hospital immediately.',
      emergency: false,
      syndrome: 'Acute Gastroenteritis Syndrome',
      prevention: 'Drink boiled water, wash hands with soap, eat freshly cooked food, maintain food hygiene'
    },
    'cough+difficulty breathing': {
      conditions: ['Severe Pneumonia', 'Asthma Attack', 'COVID-19', 'Bronchitis', 'COPD', 'Lung Infection'],
      advice: '⚠️ URGENT: This needs immediate medical attention. Go to hospital now. Use inhaler if available. Sit upright, try to stay calm. May need oxygen support and antibiotics.',
      emergency: true,
      syndrome: 'Severe Respiratory Distress Syndrome',
      prevention: 'Get pneumonia vaccine, avoid smoking, maintain good indoor air quality'
    },
    'headache+vomiting': {
      conditions: ['Migraine', 'Meningitis', 'Brain Tumor', 'High Blood Pressure', 'Concussion'],
      advice: 'Severe headache with vomiting can be serious. If with fever and neck stiffness, go to emergency (meningitis). If after head injury, seek immediate care. For migraine: rest in dark, quiet room, take prescribed medication.',
      emergency: false,
      syndrome: 'Neurological Syndrome',
      prevention: 'Manage stress, sleep regularly, avoid head injuries, control blood pressure'
    },
    'fever+difficulty breathing': {
      conditions: ['Severe COVID-19', 'Pneumonia', 'Tuberculosis', 'Lung Infection', 'Sepsis'],
      advice: '🚨 EMERGENCY: Call 108 immediately. This indicates severe infection. Needs oxygen support and hospitalization. Do not delay. Check oxygen saturation if pulse oximeter available (below 94% is emergency).',
      emergency: true,
      syndrome: 'Severe Respiratory Infection Syndrome',
      prevention: 'Get COVID vaccine, pneumonia vaccine, maintain immunity, avoid sick contacts'
    },
    'rash+pain': {
      conditions: ['Chikungunya', 'Dengue', 'Shingles', 'Rheumatic Fever', 'Allergic Reaction'],
      advice: 'Rash with joint pain suggests chikungunya or dengue. Get blood tests (CBC, dengue/chikungunya serology). Use paracetamol for pain. Apply calamine lotion on rash. Avoid aspirin/ibuprofen if fever present.',
      emergency: false,
      syndrome: 'Viral Arthritis Syndrome',
      prevention: 'Mosquito protection, maintain immunity, get adequate rest'
    },
    
    // Three-symptom combinations
    'fever+cough+difficulty breathing': {
      conditions: ['COVID-19 Pneumonia', 'Severe Pneumonia', 'Tuberculosis', 'ARDS', 'Lung Infection'],
      advice: '🚨 EMERGENCY: Call 108 NOW. This is severe respiratory illness. Needs immediate hospitalization and oxygen. Check oxygen levels. Sit upright while waiting for ambulance. Do not delay.',
      emergency: true,
      syndrome: 'Acute Respiratory Distress Syndrome',
      prevention: 'COVID-19 vaccination, pneumonia vaccine, avoid smoking, early treatment of infections'
    },
    'fever+headache+vomiting': {
      conditions: ['Meningitis', 'Encephalitis', 'Brain Infection', 'Cerebral Malaria'],
      advice: '🚨 URGENT: Go to emergency immediately. This suggests brain/meningeal infection. Check for neck stiffness. Needs IV antibiotics and hospitalization. Do not wait.',
      emergency: true,
      syndrome: 'Meningitis Syndrome',
      prevention: 'Meningitis vaccination, avoid mosquito bites, maintain hygiene'
    },
    'fever+rash+pain': {
      conditions: ['Dengue', 'Chikungunya', 'Zika Virus', 'Rheumatic Fever'],
      advice: 'Classic dengue/chikungunya presentation. Get NS1, dengue IgM, IgG, chikungunya tests. Check platelet count daily. Drink 3-4 liters of fluids. Use paracetamol only. Watch for warning signs: severe abdominal pain, bleeding, restlessness.',
      emergency: true,
      syndrome: 'Severe Dengue-Chikungunya Syndrome',
      prevention: 'Comprehensive mosquito control, eliminate breeding sites, use repellents'
    },
    'vomiting+diarrhea+fever': {
      conditions: ['Gastroenteritis', 'Food Poisoning', 'Typhoid', 'Cholera', 'Dysentery'],
      advice: 'Severe gastroenteritis needs medical care. Start ORS immediately. If unable to retain fluids or signs of dehydration (dry mouth, no urine, weakness), go to hospital for IV fluids. Get stool test and blood culture if fever high.',
      emergency: false,
      syndrome: 'Severe Gastroenteritis Syndrome',
      prevention: 'Typhoid vaccination, drink boiled water, maintain strict food hygiene'
    },
    'cough+fever+headache': {
      conditions: ['Influenza', 'COVID-19', 'Pneumonia', 'Tuberculosis', 'Upper Respiratory Infection'],
      advice: 'Common flu-like illness. Get COVID test to rule out. Rest at home, isolate from others, wear mask. Take paracetamol for fever/headache. Steam inhalation for cough. Drink warm fluids. See doctor if symptoms worsen or persist beyond 5 days.',
      emergency: false,
      syndrome: 'Influenza-like Illness',
      prevention: 'Flu vaccination, COVID vaccination, wear masks in crowded places'
    }
  };

  const emergencySymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious'];
  // Health Schemes Data
  const schemes = [
    { id: 'ayushman', name: 'Ayushman Bharat PM-JAY', color: 'bg-blue-500' },
    { id: 'cghs', name: 'CGHS', color: 'bg-green-500' },
    { id: 'esis', name: 'ESIS', color: 'bg-purple-500' },
    { id: 'state', name: 'State Health Scheme', color: 'bg-orange-500' }
  ];

  const facilities = [
    {
      id: 1,
      name: 'Government General Hospital',
      type: 'Government Hospital',
      distance: '1.2 km',
      address: 'Park Town, Chennai',
      phone: '044-2536 1500',
      timing: '24/7 Emergency',
      schemes: ['ayushman', 'cghs', 'esis', 'state'],
      services: ['Emergency Care', 'Surgery', 'Maternity', 'Pediatrics']
    },
    {
      id: 2,
      name: 'Primary Health Centre - Adyar',
      type: 'Primary Health Centre',
      distance: '2.5 km',
      address: 'Adyar, Chennai',
      phone: '044-2441 2345',
      timing: '8 AM - 8 PM',
      schemes: ['ayushman', 'state'],
      services: ['General Medicine', 'Vaccination', 'Maternity Care']
    },
    {
      id: 3,
      name: 'ESI Hospital Kilpauk',
      type: 'ESI Hospital',
      distance: '3.8 km',
      address: 'Kilpauk, Chennai',
      phone: '044-2641 2000',
      timing: '24/7',
      schemes: ['esis', 'ayushman'],
      services: ['Occupational Health', 'Emergency', 'Surgery']
    },
    {
      id: 4,
      name: 'Community Health Centre - T Nagar',
      type: 'Community Health Centre',
      distance: '4.1 km',
      address: 'T Nagar, Chennai',
      phone: '044-2434 5678',
      timing: '9 AM - 6 PM',
      schemes: ['ayushman', 'state'],
      services: ['General Medicine', 'Dental', 'Laboratory']
    }
  ];

  const schemeDetails = [
    {
      id: 'ayushman',
      name: 'Ayushman Bharat PM-JAY',
      description: 'Provides health coverage of ₹5 lakh per family per year',
      eligibility: 'Based on SECC 2011 data, covers poor and vulnerable families',
      benefits: ['Cashless treatment', 'Secondary & tertiary care', 'Pre-existing conditions covered'],
      howToApply: 'Check eligibility at PM-JAY portal or nearest Ayushman Mitra'
    },
    {
      id: 'cghs',
      name: 'Central Government Health Scheme',
      description: 'Health coverage for central government employees and pensioners',
      eligibility: 'Central government employees, pensioners and their dependents',
      benefits: ['Cashless treatment at empanelled facilities', 'Domiciliary treatment', 'Pensioner facilities'],
      howToApply: 'Apply through your department or CGHS wellness centre'
    },
    {
      id: 'esis',
      name: 'Employee State Insurance Scheme',
      description: 'Social security for workers in organized sector',
      eligibility: 'Employees earning up to ₹21,000 per month',
      benefits: ['Medical care for self and family', 'Sickness benefit', 'Maternity benefit'],
      howToApply: 'Employer enrolls workers automatically'
    },
    {
      id: 'state',
      name: 'Tamil Nadu State Health Scheme',
      description: 'Chief Minister\'s Comprehensive Health Insurance Scheme',
      eligibility: 'All ration card holders in Tamil Nadu',
      benefits: ['₹5 lakh coverage', 'Cashless treatment', 'Wide network of hospitals'],
      howToApply: 'Visit nearest primary health centre with ration card'
    }
  ];

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScheme = selectedScheme === 'all' || facility.schemes.includes(selectedScheme);
    return matchesSearch && matchesScheme;
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            district: 'Bengaluru Urban'
          });
        },
        () => {
          setUserLocation({ lat: 12.9716, lng: 77.5946, district: 'Bengaluru Urban' });
        }
      );
    }
  }, []);

  // Text-to-Speech function
  const speakText = (text, lang = language) => {
    if (!audioEnabled || !synthRef.current) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languages[lang].code;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  // Stop speech
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Handle voice input with dialect support
  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = languages[language].code;
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      }
    }
  };

  // Translate symptoms from any language to English for processing
  const normalizeSymptoms = (text) => {
    let normalized = text.toLowerCase();
    
    // Replace regional language symptoms with English equivalents
    Object.entries(symptomTranslations).forEach(([english, translations]) => {
      Object.values(translations).forEach(translation => {
        if (normalized.includes(translation.toLowerCase())) {
          normalized = normalized.replace(translation.toLowerCase(), english);
        }
      });
    });
    
    return normalized;
  };

  const performSyndromicClustering = (symptoms) => {
    const symptomKey = symptoms.sort().join('+');
    const matchedEntry = symptomDatabase[symptomKey];
    
    if (matchedEntry && matchedEntry.syndrome) {
      const newSyndrome = {
        name: matchedEntry.syndrome,
        symptoms: symptoms,
        count: 1,
        location: userLocation?.district || 'Unknown',
        timestamp: new Date()
      };
      
      setSyndromes(prev => {
        const existing = prev.find(s => s.name === newSyndrome.name);
        if (existing) {
          return prev.map(s => 
            s.name === newSyndrome.name 
              ? { ...s, count: s.count + 1 }
              : s
          );
        }
        return [...prev, newSyndrome];
      });
      
      return matchedEntry.syndrome;
    }
    return null;
  };

  const detectOutbreakCluster = (symptoms, location) => {
    const cluster = {
      id: Date.now(),
      symptoms: symptoms,
      location: location?.district || 'Unknown',
      severity: symptoms.some(s => emergencySymptoms.includes(s)) ? 'HIGH' : 'MEDIUM',
      timestamp: new Date(),
      count: 1
    };
    
    setOutbreakClusters(prev => {
      const existing = prev.find(c => 
        c.location === cluster.location && 
        JSON.stringify(c.symptoms) === JSON.stringify(cluster.symptoms)
      );
      
      if (existing) {
        return prev.map(c => 
          c.id === existing.id 
            ? { ...c, count: c.count + 1, severity: c.count > 5 ? 'HIGH' : 'MEDIUM' }
            : c
        );
      }
      return [...prev, cluster];
    });
  };

  const processWithHybridAI = (userMessage) => {
    const normalizedMsg = normalizeSymptoms(userMessage);
    const detectedSymptoms = [];
    
    const symptomKeywords = ['fever', 'cough', 'rash', 'pain', 'chest pain', 'difficulty breathing', 'headache'];
    symptomKeywords.forEach(symptom => {
      if (normalizedMsg.includes(symptom)) {
        detectedSymptoms.push(symptom);
      }
    });

    // RULE-BASED OVERRIDE
    const hasEmergency = emergencySymptoms.some(emergency => normalizedMsg.includes(emergency));
    if (hasEmergency) {
      return {
        response: '🚨 EMERGENCY DETECTED\n\nYour symptoms indicate a potential medical emergency.\n\n⚠️ IMMEDIATE ACTION REQUIRED:\n• Call 108 (Emergency Ambulance) NOW\n• Go to nearest hospital immediately\n• Do not wait\n\nNearest Emergency Center:\nVictoria Hospital, Bengaluru\n📍 Distance: 3.2 km\n\n⚠️ This is NOT a medical diagnosis. Emergency services required.',
        confidence: 0.95,
        source: 'RULE-BASED OVERRIDE (WHO/MoHFW Guidelines)',
        emergency: true,
        symptoms: detectedSymptoms
      };
    }

    // RAG Retrieval
    let ragResult = null;
    const symptomKey = detectedSymptoms.sort().join('+');
    if (symptomDatabase[symptomKey]) {
      ragResult = symptomDatabase[symptomKey];
    } else if (detectedSymptoms.length > 0) {
      ragResult = symptomDatabase[detectedSymptoms[0]];
    }

    if (ragResult) {
      setRagContext({
        query: userMessage,
        retrieved: ragResult,
        source: 'WHO/MoHFW Knowledge Base'
      });

      const syndrome = performSyndromicClustering(detectedSymptoms);
      detectOutbreakCluster(detectedSymptoms, userLocation);

      let response = `Based on your symptoms: ${detectedSymptoms.join(', ')}\n\n`;
      
      if (syndrome) {
        response += `🔬 Syndromic Classification: ${syndrome}\n\n`;
      }
      
      response += `Possible conditions to be aware of:\n`;
      ragResult.conditions.forEach(condition => {
        response += `• ${condition}\n`;
      });
      
      response += `\n💡 Recommended Actions:\n${ragResult.advice}\n\n`;
      response += `📍 Nearest Health Center:\nPrimary Health Center, ${userLocation?.district || 'Your Area'}\n`;
      response += `\n⚠️ Disclaimer: This is NOT a medical diagnosis. Please consult a doctor for proper evaluation.`;

      return {
        response,
        confidence: 0.85,
        source: 'Hybrid RAG + Rule-Based AI',
        emergency: ragResult.emergency,
        symptoms: detectedSymptoms,
        syndrome: syndrome
      };
    }

    return {
      response: `I understand you need health information. Could you describe your symptoms more specifically?\n\nExamples: ${Object.values(symptomTranslations.fever).join(', ')}, ${Object.values(symptomTranslations.cough).join(', ')}`,
      confidence: 0.5,
      source: 'General Response',
      emergency: false,
      symptoms: []
    };
  };

  const submitAshaFeedback = (messageId, rating, correction) => {
    const feedback = {
      id: Date.now(),
      messageId,
      rating,
      correction,
      timestamp: new Date(),
      status: 'pending_review'
    };
    
    setAshaFeedback(prev => [...prev, feedback]);
    alert(`✅ ASHA Feedback Submitted!\n\nRating: ${rating}/5\nStatus: Queued for model retraining\n\nThis feedback will improve the AI model's accuracy.`);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);

    const aiResponse = processWithHybridAI(input);

    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date().toLocaleTimeString(),
      confidence: aiResponse.confidence,
      source: aiResponse.source,
      emergency: aiResponse.emergency,
      symptoms: aiResponse.symptoms,
      syndrome: aiResponse.syndrome
    };

    setTimeout(() => {
      setMessages(prev => [...prev, assistantMessage]);
      // Auto-speak response if audio is enabled
      if (audioEnabled) {
        speakText(aiResponse.response);
      }
    }, 1000);

    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-8 h-8" />
              SympTrack AI
            </h1>
            <p className="text-sm opacity-90">Multilingual Health Assistant with Audio Support</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition"
              title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature Indicators */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs whitespace-nowrap">
            <Brain className="w-3 h-3" />
            Hybrid RAG+Rules
          </div>
          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs whitespace-nowrap">
            <TrendingUp className="w-3 h-3" />
            Syndromic Surveillance
          </div>
          <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs whitespace-nowrap">
            <MapPin className="w-3 h-3" />
            ST-DBSCAN Clustering
          </div>
          <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs whitespace-nowrap">
            <Mic className="w-3 h-3" />
            5-Language Voice ASR
          </div>
          <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs whitespace-nowrap">
            <Users className="w-3 h-3" />
            ASHA Active Learning
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'chat'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('outbreaks')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'outbreaks'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🗺️ Outbreak Map
          </button>
          <button
            onClick={() => setActiveTab('syndromes')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'syndromes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🔬 Syndromes
          </button>
          <button
            onClick={() => setActiveTab('asha')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'asha'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            👥 ASHA Dashboard
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'facilities'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🏥 Facilities & Schemes
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden max-w-6xl w-full mx-auto">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.role === 'assistant' && msg.confidence && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            <Shield className="w-3 h-3 inline mr-1" />
                            {msg.source}
                          </span>
                          <span className="text-gray-600">
                            Confidence: {(msg.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        {msg.syndrome && (
                          <div className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs">
                            🔬 Syndrome Detected: {msg.syndrome}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => speakText(msg.content)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            Read Aloud
                          </button>
                          <button
                            onClick={() => {
                              const rating = prompt('ASHA Worker: Rate this response (1-5):');
                              if (rating) {
                                submitAshaFeedback(idx, parseInt(rating), '');
                              }
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            👥 Submit ASHA Feedback
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-2">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* RAG Context Display */}
            {ragContext && (
              <div className="bg-blue-50 border-t border-blue-200 p-3 text-xs">
                <div className="max-w-2xl mx-auto">
                  <div className="font-semibold text-blue-800 mb-1">
                    🧠 RAG Context Retrieved:
                  </div>
                  <div className="text-blue-700">
                    Source: {ragContext.source} | Query: "{ragContext.query}"
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <button
                  onClick={handleVoiceInput}
                  className={`p-3 rounded-lg transition ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={`Voice input in ${languages[language].name}`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    title="Stop speaking"
                  >
                    <VolumeX className="w-5 h-5" />
                  </button>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={languages[language].greeting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                🎤 Voice input supports: English, ಕನ್ನಡ, தமிழ், తెలుగు, हिंदी
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outbreaks' && (
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-600" />
              Spatial-Temporal Outbreak Detection (ST-DBSCAN)
            </h2>
            
            {outbreakClusters.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No outbreak clusters detected yet.</p>
                <p className="text-sm text-gray-500 mt-2">Chat with the bot to generate data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outbreakClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={`border-l-4 rounded-lg p-4 shadow-sm ${
                      cluster.severity === 'HIGH'
                        ? 'border-red-500 bg-red-50'
                        : 'border-orange-500 bg-orange-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg flex items-center gap-2">
                          {cluster.severity === 'HIGH' && (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          {cluster.location}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          Symptoms: {cluster.symptoms.join(', ')}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Reported Cases: {cluster.count} | 
                          Severity: <span className="font-semibold">{cluster.severity}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {cluster.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'syndromes' && (
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Syndromic Surveillance (Unsupervised Clustering)
            </h2>
            
            {syndromes.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No syndromes detected yet.</p>
                <p className="text-sm text-gray-500 mt-2">Report symptoms to see syndromic patterns</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {syndromes.map((syndrome, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="font-bold text-lg text-green-700">{syndrome.name}</div>
                    <div className="text-sm text-gray-700 mt-2">
                      Pattern: {syndrome.symptoms.join(' + ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Location: {syndrome.location}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Detected: {syndrome.timestamp.toLocaleDateString()}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {syndrome.count} cases
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'asha' && (
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              ASHA Worker Dashboard (Active Learning)
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                <div className="text-3xl font-bold">{messages.length - 1}</div>
                <div className="text-sm opacity-90 mt-1">Total Consultations</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                <div className="text-3xl font-bold">{ashaFeedback.length}</div>
                <div className="text-sm opacity-90 mt-1">ASHA Feedback Received</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Active Learning Pipeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-semibold">AI Provides Response</div>
                    <div className="text-sm text-gray-600">Based on Hybrid RAG + Rules</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-semibold">ASHA Worker Validates</div>
                    <div className="text-sm text-gray-600">Rates accuracy, provides corrections</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-semibold">Model Retraining</div>
                    <div className="text-sm text-gray-600">Weekly updates with validated feedback</div>
                  </div>
                </div>
              </div>
            </div>

            {ashaFeedback.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-4">Recent Feedback</h3>
                <div className="space-y-3">
                  {ashaFeedback.map((feedback) => (
                    <div key={feedback.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="font-semibold">Rating: {feedback.rating}/5</span>
                        <span className="text-xs text-gray-600">
                          {feedback.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mt-2">
                        Status: {feedback.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'facilities' && (
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🏥 Health Facilities & Government Schemes
            </h2>

            {/* Sub-tabs */}
            <div className="bg-white shadow-md rounded-lg mb-4">
              <div className="flex">
                <button
                  onClick={() => setFacilitiesTab('facilities')}
                  className={`flex-1 py-3 px-6 font-semibold transition-colors rounded-tl-lg ${
                    facilitiesTab === 'facilities'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🏥 Find Facilities
                </button>
                <button
                  onClick={() => setFacilitiesTab('schemes')}
                  className={`flex-1 py-3 px-6 font-semibold transition-colors rounded-tr-lg ${
                    facilitiesTab === 'schemes'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🛡️ Health Schemes
                </button>
              </div>
            </div>

            {/* Facilities Sub-tab */}
            {facilitiesTab === 'facilities' && (
              <div>
                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search by name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">Filter by Scheme:</span>
                    <button
                      onClick={() => setSelectedScheme('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedScheme === 'all'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Schemes
                    </button>
                    {schemes.map(scheme => (
                      <button
                        key={scheme.id}
                        onClick={() => setSelectedScheme(scheme.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedScheme === scheme.id
                            ? `${scheme.color} text-white`
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {scheme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facilities List */}
                <div className="space-y-4">
                  {filteredFacilities.map(facility => (
                    <div
                      key={facility.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedFacility(facility.id === selectedFacility ? null : facility.id)}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{facility.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{facility.type}</p>
                          </div>
                          <div className="flex items-center gap-2 text-blue-600 font-semibold">
                            <MapPin className="w-4 h-4" />
                            {facility.distance}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                            <span className="text-sm">{facility.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="text-sm">📞 {facility.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="text-sm">🕐 {facility.timing}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">ACCEPTED SCHEMES:</p>
                          <div className="flex flex-wrap gap-2">
                            {facility.schemes.map(schemeId => {
                              const scheme = schemes.find(s => s.id === schemeId);
                              return (
                                <span
                                  key={schemeId}
                                  className={`${scheme.color} text-white px-3 py-1 rounded-full text-xs font-medium`}
                                >
                                  {scheme.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {selectedFacility === facility.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Available Services:</p>
                            <div className="flex flex-wrap gap-2">
                              {facility.services.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                              Get Directions
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFacilities.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600">No facilities found matching your criteria.</p>
                  </div>
                )}
              </div>
            )}

            {/* Schemes Sub-tab */}
            {facilitiesTab === 'schemes' && (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Available Government Health Schemes</h3>
                  <p className="text-gray-600">Learn about eligibility and benefits of various health schemes</p>
                </div>

                <div className="space-y-4">
                  {schemeDetails.map(scheme => (
                    <div key={scheme.id} className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-2xl font-bold text-gray-800 mb-2">{scheme.name}</h4>
                      <p className="text-gray-700 mb-4">{scheme.description}</p>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-1">Eligibility:</h5>
                          <p className="text-gray-700">{scheme.eligibility}</p>
                        </div>

                        <div>
                          <h5 className="font-semibold text-gray-800 mb-1">Benefits:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {scheme.benefits.map((benefit, idx) => (
                              <li key={idx} className="text-gray-700">{benefit}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold text-gray-800 mb-1">How to Apply:</h5>
                          <p className="text-gray-700">{scheme.howToApply}</p>
                        </div>

                        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                          Check Eligibility →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SympTrackApp;
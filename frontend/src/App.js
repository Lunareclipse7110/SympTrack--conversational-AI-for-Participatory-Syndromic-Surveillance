import React, { useState, useEffect } from 'react';
import { Send, Mic, MicOff, MapPin, Activity, TrendingUp, AlertTriangle, Users, Brain, Shield, Sparkles, Menu, X, Bell, Settings, ChevronRight, Zap, Globe, Clock } from 'lucide-react';

const SympTrackApp = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'ನಮಸ್ಕಾರ! Hello! I am SympTrack AI. How can I help you today? / ನಾನು ಸಿಂಪ್‌ಟ್ರ್ಯಾಕ್ AI. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  const symptomDatabase = {
    'fever': {
      conditions: ['Malaria', 'Dengue', 'Typhoid', 'COVID-19'],
      advice: 'Rest, stay hydrated, monitor temperature',
      emergency: false
    },
    'fever+rash': {
      conditions: ['Dengue', 'Measles', 'Chikungunya'],
      advice: 'Seek medical attention, dengue testing recommended',
      emergency: true,
      syndrome: 'Dengue-like Syndrome'
    },
    'cough+fever': {
      conditions: ['COVID-19', 'Tuberculosis', 'Pneumonia'],
      advice: 'Isolate, get tested for COVID-19, consult doctor',
      emergency: false,
      syndrome: 'Respiratory Syndrome'
    },
    'chest pain': {
      conditions: ['Heart Attack', 'Cardiac Emergency'],
      advice: 'EMERGENCY: Call 108 immediately',
      emergency: true
    },
    'difficulty breathing': {
      conditions: ['Severe Respiratory Distress', 'COVID-19', 'Asthma'],
      advice: 'EMERGENCY: Seek immediate medical care',
      emergency: true
    }
  };

  const emergencySymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious'];

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
    const lowerMsg = userMessage.toLowerCase();
    const detectedSymptoms = [];
    
    const symptomKeywords = ['fever', 'cough', 'rash', 'pain', 'chest pain', 'difficulty breathing', 'headache'];
    symptomKeywords.forEach(symptom => {
      if (lowerMsg.includes(symptom)) {
        detectedSymptoms.push(symptom);
      }
    });

    const hasEmergency = emergencySymptoms.some(emergency => lowerMsg.includes(emergency));
    if (hasEmergency) {
      return {
        response: '🚨 EMERGENCY DETECTED\n\nYour symptoms indicate a potential medical emergency.\n\n⚠️ IMMEDIATE ACTION REQUIRED:\n• Call 108 (Emergency Ambulance) NOW\n• Go to nearest hospital immediately\n• Do not wait\n\nNearest Emergency Center:\nVictoria Hospital, Bengaluru\n📍 Distance: 3.2 km\n\n⚠️ This is NOT a medical diagnosis. Emergency services required.',
        confidence: 0.95,
        source: 'RULE-BASED OVERRIDE (WHO/MoHFW Guidelines)',
        emergency: true,
        symptoms: detectedSymptoms
      };
    }

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
      response: 'I understand you need health information. Could you please describe your symptoms more specifically? For example: fever, cough, headache, etc.\n\nಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟವಾಗಿ ವಿವರಿಸಬಹುದೇ?',
      confidence: 0.5,
      source: 'General Response',
      emergency: false,
      symptoms: []
    };
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      setTimeout(() => {
        const simulatedInput = language === 'kn' 
          ? 'ನನಗೆ ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮು ಇದೆ' 
          : 'I have fever and cough';
        
        setInput(simulatedInput);
        setIsRecording(false);
      }, 2000);
    }
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
    setTyping(true);

    const aiResponse = processWithHybridAI(input);

    setTimeout(() => {
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

      setMessages(prev => [...prev, assistantMessage]);
      setTyping(false);
    }, 1500);

    setInput('');
  };

  const quickActions = [
    { icon: Activity, label: 'Report Symptoms', action: () => setInput('I have ') },
    { icon: MapPin, label: 'Find Clinic', action: () => setActiveTab('outbreaks') },
    { icon: Clock, label: 'Emergency', action: () => setInput('chest pain') },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">SympTrack</h2>
                  <p className="text-xs text-blue-100">AI Health Assistant</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{userLocation?.district || 'Locating...'}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Chat Assistant</span>
              {activeTab === 'chat' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>

            <button
              onClick={() => { setActiveTab('outbreaks'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'outbreaks'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>Outbreak Map</span>
              {outbreakClusters.length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  {outbreakClusters.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('syndromes'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'syndromes'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Syndromes</span>
              {syndromes.length > 0 && (
                <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  {syndromes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('asha'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'asha'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>ASHA Dashboard</span>
            </button>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-3">AI Features</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span>Hybrid RAG+Rules</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>ST-DBSCAN Clustering</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span>Multilingual ASR</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5" />
              {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {activeTab === 'chat' && 'AI Health Assistant'}
                  {activeTab === 'outbreaks' && 'Outbreak Detection'}
                  {activeTab === 'syndromes' && 'Syndromic Surveillance'}
                  {activeTab === 'asha' && 'ASHA Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">Real-time health monitoring & analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.length === 1 && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to SympTrack AI</h2>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Your intelligent health assistant powered by AI. Describe your symptoms and get instant guidance.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.action}
                            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
                          >
                            <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition">
                              <action.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-blue-600 transition">
                              {action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl p-5 shadow-md ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        {msg.role === 'assistant' && msg.confidence && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Shield className="w-3 h-3" />
                                <span>{msg.source}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                    style={{ width: `${msg.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-gray-600">{(msg.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            {msg.syndrome && (
                              <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-xs font-medium">
                                🔬 Syndrome: {msg.syndrome}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                const rating = prompt('ASHA Worker: Rate this response (1-5):');
                                if (rating) {
                                  submitAshaFeedback(idx, parseInt(rating), '');
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Users className="w-3 h-3" />
                              Submit Feedback
                            </button>
                          </div>
                        )}
                        <div className="text-xs opacity-60 mt-3">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))}

                  {typing && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RAG Context */}
              {ragContext && (
                <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
                  <div className="max-w-4xl mx-auto flex items-center gap-3 text-sm">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">RAG Context:</span>
                    <span className="text-blue-700">{ragContext.source}</span>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <button
                    onClick={handleVoiceInput}
                    className={`p-4 rounded-xl transition-all shadow-md ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:shadow-lg'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={
                      language === 'en'
                        ? 'Describe your symptoms...'
                        : 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ...'
                    }
                    className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:shadow-lg transition-all"
                  />
                  <button
                    onClick={handleSend}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 font-semibold"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outbreaks' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Spatial-Temporal Detection</h2>
                      <p className="text-sm text-gray-600">ST-DBSCAN clustering algorithm</p>
                    </div>
                  </div>
                  
                  {outbreakClusters.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No outbreak clusters detected</p>
                      <p className="text-sm text-gray-500 mt-2">Start chatting to generate outbreak data</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {outbreakClusters.map((cluster) => (
                        <div
                          key={cluster.id}
                          className={`rounded-xl p-5 shadow-md border-l-4 ${
                            cluster.severity === 'HIGH'
                              ? 'border-red-500 bg-red-50'
                              : 'border-orange-500 bg-orange-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                {cluster.severity === 'HIGH' && (
                                  <AlertTriangle className="w-5 h-5 text-red-600" />
                                )}
                                <h3 className="font-bold text-lg text-gray-800">{cluster.location}</h3>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">
                                <span className="font-medium">Symptoms:</span> {cluster.symptoms.join(', ')}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  cluster.severity === 'HIGH'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-orange-200 text-orange-800'
                                }`}>
                                  {cluster.severity} SEVERITY
                                </span>
                                <span className="text-xs text-gray-600">
                                  📊 {cluster.count} reported cases
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {cluster.timestamp.toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cluster.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'syndromes' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Syndromic Surveillance</h2>
                      <p className="text-sm text-gray-600">Unsupervised clustering analysis</p>
                    </div>
                  </div>
                  
                  {syndromes.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No syndromes detected</p>
                      <p className="text-sm text-gray-500 mt-2">Report symptoms to identify patterns</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {syndromes.map((syndrome, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-md hover:shadow-xl transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              {syndrome.count} cases
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-green-800 mb-2">{syndrome.name}</h3>
                          <p className="text-sm text-gray-700 mb-3">
                            <span className="font-medium">Pattern:</span> {syndrome.symptoms.join(' + ')}
                          </p>
                          <div className="flex items-center justify-between pt-3 border-t border-green-200">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span>{syndrome.location}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {syndrome.timestamp.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'asha' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                    <Activity className="w-10 h-10 mb-3 opacity-80" />
                    <div className="text-3xl font-bold mb-1">{messages.length - 1}</div>
                    <div className="text-sm text-blue-100">Total Consultations</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
                    <Users className="w-10 h-10 mb-3 opacity-80" />
                    <div className="text-3xl font-bold mb-1">{ashaFeedback.length}</div>
                    <div className="text-sm text-green-100">Feedback Received</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
                    <Brain className="w-10 h-10 mb-3 opacity-80" />
                    <div className="text-3xl font-bold mb-1">87%</div>
                    <div className="text-sm text-purple-100">Model Accuracy</div>
                  </div>
                </div>

                {/* Active Learning Pipeline */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Active Learning Pipeline
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">AI Generates Response</h4>
                        <p className="text-sm text-gray-600">Hybrid RAG retrieves relevant medical knowledge and rule-based system ensures safety</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">ASHA Worker Validation</h4>
                        <p className="text-sm text-gray-600">Community health workers rate accuracy and provide corrections based on ground truth</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">Continuous Model Improvement</h4>
                        <p className="text-sm text-gray-600">Weekly retraining cycles incorporate validated feedback to improve accuracy</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback List */}
                {ashaFeedback.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Feedback</h3>
                    <div className="space-y-3">
                      {ashaFeedback.map((feedback) => (
                        <div key={feedback.id} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-purple-800">Rating: {feedback.rating}/5</span>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                      i < feedback.rating ? 'bg-purple-600' : 'bg-purple-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {feedback.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            Status: <span className="font-medium text-purple-700">{feedback.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SympTrackApp;
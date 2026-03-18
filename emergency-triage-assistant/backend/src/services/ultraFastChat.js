const fs = require('fs').promises;
const path = require('path');

/**
 * Ultra-Fast Chat Service for Emergency Triage Assistant
 * Target: <400ms response time with comprehensive medical chat responses
 */
class UltraFastChatService {
  constructor() {
    this.conversationCache = new Map();
    this.responseTemplates = new Map();
    this.medicalRules = new MedicalChatRules();
    this.stats = {
      cacheHits: 0,
      ruleHits: 0,
      templateHits: 0,
      fallbackHits: 0,
      totalRequests: 0
    };
    this.loadChatTemplates();
  }

  /**
   * Process chat message with ultra-fast response
   */
  async processChat(messages, context = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const lastMessage = messages[messages.length - 1];
      const userMessage = lastMessage.content.toLowerCase();

      // Step 1: Check conversation cache (0-5ms)
      const cacheResult = this.checkConversationCache(messages);
      if (cacheResult) {
        this.stats.cacheHits++;
        return this.formatResponse(cacheResult, 'cache', startTime);
      }

      // Step 2: Medical rule-based responses (5-20ms)
      const ruleResult = await this.medicalRules.processMessage(userMessage, context);
      if (ruleResult) {
        this.stats.ruleHits++;
        this.cacheConversation(messages, ruleResult);
        return this.formatResponse(ruleResult, 'rules', startTime);
      }

      // Step 3: Template matching (10-30ms)
      const templateResult = this.matchTemplate(userMessage, context);
      if (templateResult) {
        this.stats.templateHits++;
        this.cacheConversation(messages, templateResult);
        return this.formatResponse(templateResult, 'template', startTime);
      }

      // Step 4: Smart fallback (no external calls)
      this.stats.fallbackHits++;
      const fallbackResult = this.generateSmartFallback(userMessage, context);
      return this.formatResponse(fallbackResult, 'fallback', startTime);

    } catch (error) {
      // Emergency fallback
      const errorResult = {
        content: "I'm having trouble processing your message right now. For immediate medical concerns, please speak with a healthcare provider directly.",
        confidence: 0.5,
        suggestions: ["Contact your doctor", "Call emergency services if urgent", "Try rephrasing your question"]
      };
      return this.formatResponse(errorResult, 'error', startTime, error.message);
    }
  }

  /**
   * Check conversation cache for similar exchanges
   */
  checkConversationCache(messages) {
    if (messages.length < 2) return null;

    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
    const conversationKey = this.generateConversationKey(lastUserMessage);

    return this.conversationCache.get(conversationKey) || null;
  }

  /**
   * Generate conversation cache key
   */
  generateConversationKey(message) {
    // Extract key medical terms for caching
    const keyTerms = message.match(/\b(pain|fever|nausea|dizzy|chest|head|stomach|breathing|heart|blood|pressure|medication|allergy|emergency|help|symptoms?|feel|hurt|sick|doctor|hospital|ambulance)\b/g);
    return keyTerms ? keyTerms.sort().join('_') : message.substring(0, 50);
  }

  /**
   * Match message to response templates
   */
  matchTemplate(message, context) {
    for (const [pattern, template] of this.responseTemplates.entries()) {
      if (this.matchesPattern(message, pattern)) {
        return this.personalizeTemplate(template, context);
      }
    }
    return null;
  }

  /**
   * Check if message matches pattern
   */
  matchesPattern(message, pattern) {
    const keywords = pattern.keywords || [];
    const requiredWords = pattern.required || [];
    const excludeWords = pattern.exclude || [];

    // Check required words
    if (requiredWords.length > 0 && !requiredWords.some(word => message.includes(word))) {
      return false;
    }

    // Check excluded words
    if (excludeWords.some(word => message.includes(word))) {
      return false;
    }

    // Check keyword matches
    const matchCount = keywords.filter(keyword => message.includes(keyword)).length;
    return matchCount >= (pattern.minMatches || 1);
  }

  /**
   * Personalize template with context
   */
  personalizeTemplate(template, context) {
    let response = template.response;
    
    // Replace placeholders
    if (context.patientName) {
      response = response.replace('{name}', context.patientName);
    }
    if (context.age) {
      response = response.replace('{age}', context.age);
    }

    return {
      content: response,
      confidence: template.confidence || 0.8,
      suggestions: template.suggestions || [],
      urgency: template.urgency || 'standard'
    };
  }

  /**
   * Generate smart fallback response
   */
  generateSmartFallback(message, context) {
    // Analyze message for urgency indicators
    const urgentWords = ['emergency', 'urgent', 'help', 'pain', 'can\'t breathe', 'chest pain', 'bleeding', 'unconscious'];
    const isUrgent = urgentWords.some(word => message.includes(word));

    if (isUrgent) {
      return {
        content: "This sounds like it could be urgent. For immediate medical emergencies, please call 911 or go to the nearest emergency room. I can help with general health questions, but urgent symptoms need immediate professional attention.",
        confidence: 0.9,
        suggestions: ["Call 911 for emergencies", "Visit emergency room", "Contact your doctor"],
        urgency: 'high'
      };
    }

    // General health inquiry
    if (message.includes('symptom') || message.includes('feel') || message.includes('hurt')) {
      return {
        content: "I understand you're concerned about symptoms you're experiencing. While I can provide general health information, it's important to discuss specific symptoms with a healthcare provider who can properly evaluate your condition.",
        confidence: 0.7,
        suggestions: ["Schedule appointment with doctor", "Keep symptom diary", "Monitor changes"],
        urgency: 'standard'
      };
    }

    // Default response
    return {
      content: "I'm here to help with health-related questions. Could you tell me more specifically what you'd like to know about? For urgent medical concerns, please contact a healthcare provider directly.",
      confidence: 0.6,
      suggestions: ["Ask about specific symptoms", "Request health information", "Contact healthcare provider"],
      urgency: 'standard'
    };
  }

  /**
   * Cache conversation for future use
   */
  cacheConversation(messages, response) {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      const key = this.generateConversationKey(lastMessage);
      this.conversationCache.set(key, response);
    }
  }

  /**
   * Format response with timing and metadata
   */
  formatResponse(result, source, startTime, error = null) {
    const latency = Date.now() - startTime;

    return {
      role: 'assistant',
      content: result.content,
      confidence: result.confidence || 0.8,
      suggestions: result.suggestions || [],
      urgency: result.urgency || 'standard',
      metadata: {
        source: source,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
        error: error
      }
    };
  }

  /**
   * Load comprehensive chat templates
   */
  loadChatTemplates() {
    const templates = new Map([
      // Greeting patterns
      ['greeting', {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        response: "Hello! I'm here to help with your health questions. What can I assist you with today?",
        confidence: 0.9,
        suggestions: ["Ask about symptoms", "Request health information", "Emergency guidance"]
      }],

      // Pain-related queries
      ['chest_pain', {
        keywords: ['chest pain', 'chest hurt', 'heart pain'],
        required: ['chest'],
        response: "Chest pain can be serious and should be evaluated immediately. If you're experiencing severe chest pain, shortness of breath, or pain radiating to your arm or jaw, please call 911 or go to the emergency room right away.",
        confidence: 0.95,
        suggestions: ["Call 911 if severe", "Go to emergency room", "Don't drive yourself"],
        urgency: 'high'
      }],

      ['headache', {
        keywords: ['headache', 'head hurt', 'migraine'],
        required: ['head'],
        response: "Headaches can have many causes. For severe, sudden headaches, especially with fever, stiff neck, or vision changes, seek immediate medical attention. For routine headaches, rest, hydration, and over-the-counter pain relievers may help.",
        confidence: 0.85,
        suggestions: ["Rest in dark room", "Stay hydrated", "See doctor if severe"],
        urgency: 'standard'
      }],

      ['abdominal_pain', {
        keywords: ['stomach pain', 'belly hurt', 'abdominal pain', 'stomach ache'],
        required: ['stomach', 'belly', 'abdominal'],
        response: "Abdominal pain can range from mild to serious. Severe pain, especially with fever, vomiting, or inability to pass gas, needs immediate evaluation. For mild stomach upset, rest and clear fluids may help.",
        confidence: 0.8,
        suggestions: ["Monitor symptoms", "Clear fluids only", "Seek care if worsening"],
        urgency: 'standard'
      }],

      // Respiratory symptoms
      ['breathing_difficulty', {
        keywords: ['can\'t breathe', 'shortness of breath', 'breathing hard', 'wheezing'],
        required: ['breath', 'breathing'],
        response: "Difficulty breathing is a serious symptom that requires immediate medical attention. Please call 911 or go to the emergency room right away, especially if you have chest pain, blue lips, or severe shortness of breath.",
        confidence: 0.98,
        suggestions: ["Call 911 immediately", "Go to emergency room", "Don't wait"],
        urgency: 'critical'
      }],

      // Fever queries
      ['fever', {
        keywords: ['fever', 'temperature', 'hot', 'chills'],
        required: ['fever', 'temperature'],
        response: "Fever is your body's response to infection. For adults, seek medical care if fever is over 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe symptoms like difficulty breathing or persistent vomiting.",
        confidence: 0.85,
        suggestions: ["Monitor temperature", "Stay hydrated", "Rest", "See doctor if high fever"],
        urgency: 'standard'
      }],

      // Medication queries
      ['medication_question', {
        keywords: ['medication', 'medicine', 'pill', 'drug', 'prescription'],
        response: "For questions about medications, dosages, or side effects, it's best to consult with your pharmacist or the healthcare provider who prescribed them. Never stop or change medications without professional guidance.",
        confidence: 0.9,
        suggestions: ["Contact pharmacist", "Call prescribing doctor", "Read medication guide"],
        urgency: 'standard'
      }],

      // Allergy queries
      ['allergy_reaction', {
        keywords: ['allergy', 'allergic reaction', 'hives', 'rash', 'swelling'],
        response: "Allergic reactions can range from mild to life-threatening. If you have difficulty breathing, swelling of face/throat, or severe whole-body reaction, call 911 immediately. For mild reactions, antihistamines may help.",
        confidence: 0.92,
        suggestions: ["Call 911 if severe", "Take antihistamine for mild reactions", "Avoid known allergens"],
        urgency: 'variable'
      }],

      // Mental health
      ['anxiety_stress', {
        keywords: ['anxious', 'stressed', 'worried', 'panic', 'anxiety'],
        response: "It's normal to feel anxious sometimes, but persistent anxiety can affect your daily life. Deep breathing, regular exercise, and talking to someone can help. If anxiety is severe or interfering with your life, consider speaking with a mental health professional.",
        confidence: 0.8,
        suggestions: ["Practice deep breathing", "Regular exercise", "Talk to counselor", "Contact mental health professional"],
        urgency: 'standard'
      }],

      // Emergency situations
      ['emergency', {
        keywords: ['emergency', 'urgent', 'help', '911'],
        required: ['emergency', 'urgent', 'help'],
        response: "For medical emergencies, call 911 immediately or go to the nearest emergency room. Don't wait or try to drive yourself if you're having a medical emergency.",
        confidence: 0.98,
        suggestions: ["Call 911", "Go to emergency room", "Don't drive yourself"],
        urgency: 'critical'
      }],

      // General health
      ['general_health', {
        keywords: ['healthy', 'wellness', 'prevention', 'diet', 'exercise'],
        response: "Maintaining good health involves regular exercise, a balanced diet, adequate sleep, stress management, and regular check-ups with your healthcare provider. What specific aspect of health would you like to know more about?",
        confidence: 0.75,
        suggestions: ["Regular exercise", "Balanced diet", "Adequate sleep", "Regular check-ups"],
        urgency: 'standard'
      }]
    ]);

    this.responseTemplates = templates;
    console.log(`✅ Loaded ${templates.size} chat response templates`);
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const total = this.stats.totalRequests;
    if (total === 0) {
      return {
        totalRequests: 0,
        cacheHitRate: '0%',
        ruleHitRate: '0%',
        templateHitRate: '0%',
        fallbackHitRate: '0%',
        cacheSize: this.conversationCache.size
      };
    }

    return {
      totalRequests: total,
      cacheHitRate: `${(this.stats.cacheHits / total * 100).toFixed(1)}%`,
      ruleHitRate: `${(this.stats.ruleHits / total * 100).toFixed(1)}%`,
      templateHitRate: `${(this.stats.templateHits / total * 100).toFixed(1)}%`,
      fallbackHitRate: `${(this.stats.fallbackHits / total * 100).toFixed(1)}%`,
      cacheSize: this.conversationCache.size
    };
  }
}

/**
 * Medical chat rules for critical situations
 */
class MedicalChatRules {
  async processMessage(message, context) {
    // Critical emergency rules
    if (this.isEmergencyKeywords(message)) {
      return {
        content: "🚨 This sounds like a medical emergency. Please call 911 or go to the nearest emergency room immediately. Do not wait or try to treat this yourself.",
        confidence: 0.98,
        suggestions: ["Call 911 NOW", "Go to emergency room", "Don't drive yourself"],
        urgency: 'critical'
      };
    }

    // Suicide/self-harm detection
    if (this.isSuicidalContent(message)) {
      return {
        content: "I'm concerned about what you're sharing. Please reach out for help immediately. Call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room. You don't have to go through this alone.",
        confidence: 0.95,
        suggestions: ["Call 988 (Crisis Lifeline)", "Go to emergency room", "Call 911", "Reach out to trusted person"],
        urgency: 'critical'
      };
    }

    // Medication safety rules
    if (this.isMedicationSafety(message)) {
      return {
        content: "Medication questions require professional guidance. Please contact your pharmacist or the doctor who prescribed your medication. Never stop or change medications without professional advice.",
        confidence: 0.92,
        suggestions: ["Contact pharmacist", "Call prescribing doctor", "Don't change doses alone"],
        urgency: 'high'
      };
    }

    // Pregnancy-related concerns
    if (this.isPregnancyConcern(message)) {
      return {
        content: "Pregnancy-related symptoms should be discussed with your obstetrician or healthcare provider. For severe symptoms like heavy bleeding, severe pain, or signs of preeclampsia, seek immediate medical attention.",
        confidence: 0.90,
        suggestions: ["Contact OB/GYN", "Call doctor's office", "Go to L&D if severe"],
        urgency: 'high'
      };
    }

    return null; // No rule matched
  }

  isEmergencyKeywords(message) {
    const emergencyKeywords = [
      'can\'t breathe', 'chest pain', 'heart attack', 'stroke', 'bleeding heavily',
      'unconscious', 'overdose', 'poisoning', 'severe allergic reaction',
      'broken bone', 'head injury', 'seizure', 'choking'
    ];
    return emergencyKeywords.some(keyword => message.includes(keyword));
  }

  isSuicidalContent(message) {
    const suicidalKeywords = [
      'want to die', 'kill myself', 'end it all', 'suicide', 'not worth living',
      'better off dead', 'hurt myself', 'end my life'
    ];
    return suicidalKeywords.some(keyword => message.includes(keyword));
  }

  isMedicationSafety(message) {
    const medicationConcerns = [
      'overdose', 'too many pills', 'wrong dose', 'side effects', 'drug interaction',
      'stop taking', 'double dose', 'missed dose'
    ];
    return medicationConcerns.some(concern => message.includes(concern));
  }

  isPregnancyConcern(message) {
    const pregnancyKeywords = ['pregnant', 'pregnancy', 'baby', 'contractions', 'bleeding while pregnant'];
    return pregnancyKeywords.some(keyword => message.includes(keyword));
  }
}

module.exports = { UltraFastChatService, MedicalChatRules };
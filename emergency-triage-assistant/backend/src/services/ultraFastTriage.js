const fs = require('fs').promises;
const path = require('path');

/**
 * Ultra-Fast Triage Service - Target: <400ms response time
 * Uses cache-first approach with rule-based fallback
 */
class UltraFastTriageService {
  constructor() {
    this.cache = new Map();
    this.ruleEngine = new TriageRuleEngine();
    this.stats = {
      cacheHits: 0,
      ruleHits: 0,
      llmHits: 0,
      totalRequests: 0
    };
    this.loadPrecomputedCache();
  }

  /**
   * Main assessment function - target <400ms
   */
  async assess(patientData) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Step 1: Cache lookup (target: 30-50ms)
      const cacheResult = await this.checkCache(patientData);
      if (cacheResult) {
        this.stats.cacheHits++;
        return {
          ...cacheResult,
          source: 'cache',
          latency: Date.now() - startTime,
          confidence: 0.95
        };
      }

      // Step 2: Rule-based assessment (target: 10-30ms)
      const ruleResult = this.ruleEngine.evaluate(patientData);
      if (ruleResult && ruleResult.confidence > 0.9) {
        this.stats.ruleHits++;
        // Cache this result for future use
        await this.cacheResult(patientData, ruleResult);
        return {
          ...ruleResult,
          source: 'rules',
          latency: Date.now() - startTime
        };
      }

      // Step 3: Fallback to mini-LLM (target: <300ms)
      this.stats.llmHits++;
      const llmResult = await this.miniLLMAssess(patientData);
      
      // Cache high-confidence results
      if (llmResult.confidence > 0.85) {
        await this.cacheResult(patientData, llmResult);
      }

      return {
        ...llmResult,
        source: 'llm',
        latency: Date.now() - startTime
      };

    } catch (error) {
      // Emergency fallback - always return something safe
      return {
        level: 'URGENT',
        action: 'Manual assessment required - system error',
        confidence: 0.5,
        source: 'fallback',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Check cache for matching scenario
   */
  async checkCache(patientData) {
    const cacheKey = this.generateCacheKey(patientData);
    
    // Exact match first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Fuzzy match for similar scenarios
    return this.fuzzyMatch(patientData);
  }

  /**
   * Generate cache key from patient data
   */
  generateCacheKey(data) {
    const symptoms = (data.symptoms || []).sort().join(',');
    const vitals = `${data.bp_systolic || 0}-${data.bp_diastolic || 0}-${data.temp || 0}-${data.o2_sat || 0}`;
    const demographics = `${data.age || 0}-${data.gender || 'U'}`;
    return `${symptoms}:${vitals}:${demographics}`;
  }

  /**
   * Fuzzy matching for cache hits
   */
  fuzzyMatch(patientData) {
    const symptoms = new Set(patientData.symptoms || []);
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, result] of this.cache.entries()) {
      const [cachedSymptoms] = key.split(':');
      const cachedSymptomsSet = new Set(cachedSymptoms.split(','));
      
      // Calculate symptom overlap
      const intersection = new Set([...symptoms].filter(x => cachedSymptomsSet.has(x)));
      const union = new Set([...symptoms, ...cachedSymptomsSet]);
      const similarity = intersection.size / union.size;

      if (similarity > 0.7 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = result;
      }
    }

    return bestScore > 0.7 ? bestMatch : null;
  }

  /**
   * Cache a result for future use
   */
  async cacheResult(patientData, result) {
    const cacheKey = this.generateCacheKey(patientData);
    this.cache.set(cacheKey, result);
    
    // Persist to file for next startup
    try {
      await this.saveCacheToFile();
    } catch (error) {
      console.warn('Failed to persist cache:', error.message);
    }
  }

  /**
   * Mini-LLM assessment for edge cases
   */
  async miniLLMAssess(patientData) {
    const { triageQuery } = require('../ollamaService');
    
    // Create concise prompt for faster processing
    const prompt = this.createConcisePrompt(patientData);
    
    try {
      const result = await triageQuery(prompt);
      return this.parseTriageResponse(result.response);
    } catch (error) {
      return {
        level: 'URGENT',
        action: 'Manual assessment required',
        confidence: 0.6,
        error: error.message
      };
    }
  }

  /**
   * Create optimized prompt for speed
   */
  createConcisePrompt(data) {
    const symptoms = (data.symptoms || []).join(', ');
    const vitals = `BP:${data.bp_systolic}/${data.bp_diastolic} T:${data.temp}°F O2:${data.o2_sat}%`;
    
    return `EMERGENCY TRIAGE - RESPOND IN 20 WORDS MAX:
Patient: ${data.age}yo ${data.gender}
Symptoms: ${symptoms}
Vitals: ${vitals}
Triage level (CRITICAL/URGENT/STANDARD):`;
  }

  /**
   * Parse LLM response into structured format
   */
  parseTriageResponse(response) {
    const text = response.toLowerCase();
    
    let level = 'STANDARD';
    if (text.includes('critical')) level = 'CRITICAL';
    else if (text.includes('urgent')) level = 'URGENT';
    
    return {
      level,
      action: response.substring(0, 100),
      confidence: 0.8
    };
  }

  /**
   * Load pre-computed cache scenarios
   */
  async loadPrecomputedCache() {
    // Load from file if exists
    try {
      const cacheFile = path.join(__dirname, '../../data/triage_cache.json');
      const data = await fs.readFile(cacheFile, 'utf8');
      const cacheData = JSON.parse(data);
      
      for (const [key, value] of Object.entries(cacheData)) {
        this.cache.set(key, value);
      }
      
      console.log(`✅ Loaded ${this.cache.size} cached triage scenarios`);
    } catch (error) {
      // Generate default cache
      this.generateDefaultCache();
      console.log(`✅ Generated ${this.cache.size} default triage scenarios`);
    }
  }

  /**
   * Generate default cache with common scenarios
   */
  generateDefaultCache() {
    const scenarios = [
      // Cardiac emergencies
      {
        key: 'chest_pain,shortness_of_breath:160-95-98-95:45-M',
        response: {
          level: 'CRITICAL',
          action: 'Immediate cardiac evaluation. Obtain ECG, cardiac enzymes. Consider MI protocol.',
          confidence: 0.95
        }
      },
      {
        key: 'chest_pain:180-110-99-98:55-M',
        response: {
          level: 'CRITICAL', 
          action: 'Hypertensive emergency with chest pain. Immediate cardiology consult.',
          confidence: 0.98
        }
      },
      
      // Neurological emergencies
      {
        key: 'sudden_weakness,facial_droop,speech_difficulty:140-85-98-98:65-F',
        response: {
          level: 'CRITICAL',
          action: 'Possible stroke. Activate stroke protocol immediately. CT head stat.',
          confidence: 0.97
        }
      },
      
      // Respiratory emergencies
      {
        key: 'shortness_of_breath,wheezing:130-80-99-88:35-F',
        response: {
          level: 'URGENT',
          action: 'Severe asthma exacerbation. Nebulizer treatment, consider steroids.',
          confidence: 0.92
        }
      },
      
      // Infectious diseases
      {
        key: 'fever,headache,neck_stiffness:120-70-104-98:25-M',
        response: {
          level: 'CRITICAL',
          action: 'Possible meningitis. Immediate lumbar puncture, antibiotics, isolation.',
          confidence: 0.96
        }
      },
      
      // Trauma
      {
        key: 'head_injury,confusion,vomiting:110-70-99-98:28-M',
        response: {
          level: 'URGENT',
          action: 'Possible traumatic brain injury. CT head, neurological monitoring.',
          confidence: 0.90
        }
      },
      
      // Allergic reactions
      {
        key: 'facial_swelling,difficulty_swallowing,hives:90-60-98-98:22-F',
        response: {
          level: 'CRITICAL',
          action: 'Anaphylaxis. Epinephrine immediately, IV access, airway monitoring.',
          confidence: 0.98
        }
      },
      
      // Pediatric emergencies
      {
        key: 'fever,irritability,poor_feeding:100-60-104-98:3-M',
        response: {
          level: 'URGENT',
          action: 'Pediatric fever workup. Blood cultures, urinalysis, consider sepsis.',
          confidence: 0.88
        }
      },
      
      // Minor conditions
      {
        key: 'minor_laceration:120-80-98-98:25-M',
        response: {
          level: 'STANDARD',
          action: 'Wound care, tetanus status, consider sutures if needed.',
          confidence: 0.85
        }
      },
      
      // Psychiatric emergencies
      {
        key: 'suicidal_ideation,agitation:130-85-98-98:35-F',
        response: {
          level: 'URGENT',
          action: 'Psychiatric evaluation, safety precautions, consider 1:1 monitoring.',
          confidence: 0.90
        }
      }
    ];

    scenarios.forEach(scenario => {
      this.cache.set(scenario.key, scenario.response);
    });
  }

  /**
   * Save cache to file for persistence
   */
  async saveCacheToFile() {
    const cacheFile = path.join(__dirname, '../../data/triage_cache.json');
    const cacheData = Object.fromEntries(this.cache);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(cacheFile), { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const total = this.stats.totalRequests;
    return {
      totalRequests: total,
      cacheHitRate: total > 0 ? (this.stats.cacheHits / total * 100).toFixed(1) + '%' : '0%',
      ruleHitRate: total > 0 ? (this.stats.ruleHits / total * 100).toFixed(1) + '%' : '0%',
      llmHitRate: total > 0 ? (this.stats.llmHits / total * 100).toFixed(1) + '%' : '0%',
      cacheSize: this.cache.size
    };
  }
}

/**
 * Rule-based triage engine for fast decisions
 */
class TriageRuleEngine {
  constructor() {
    this.rules = this.loadRules();
  }

  evaluate(patientData) {
    for (const rule of this.rules) {
      if (rule.condition(patientData)) {
        return {
          level: rule.level,
          action: rule.action,
          confidence: rule.confidence,
          rule: rule.name
        };
      }
    }
    return null;
  }

  loadRules() {
    return [
      // Critical vital signs
      {
        name: 'hypertensive_crisis',
        condition: (p) => p.bp_systolic > 180 || p.bp_diastolic > 120,
        level: 'CRITICAL',
        action: 'Hypertensive crisis. Immediate BP management required.',
        confidence: 0.95
      },
      {
        name: 'severe_hypoxemia',
        condition: (p) => p.o2_sat < 85,
        level: 'CRITICAL', 
        action: 'Severe hypoxemia. Immediate oxygen therapy and airway assessment.',
        confidence: 0.98
      },
      {
        name: 'hyperthermia',
        condition: (p) => p.temp > 104,
        level: 'CRITICAL',
        action: 'Hyperthermia. Immediate cooling measures and sepsis workup.',
        confidence: 0.92
      },
      {
        name: 'severe_hypotension',
        condition: (p) => p.bp_systolic < 80,
        level: 'CRITICAL',
        action: 'Severe hypotension. IV access, fluid resuscitation, vasopressors.',
        confidence: 0.94
      },
      
      // Age-based rules
      {
        name: 'elderly_fall',
        condition: (p) => p.age > 75 && (p.symptoms || []).includes('fall'),
        level: 'URGENT',
        action: 'Elderly fall. Hip X-ray, head CT if altered mental status.',
        confidence: 0.88
      },
      {
        name: 'pediatric_fever',
        condition: (p) => p.age < 3 && p.temp > 101,
        level: 'URGENT',
        action: 'Pediatric fever. Full sepsis workup indicated.',
        confidence: 0.90
      },
      
      // Symptom combinations
      {
        name: 'chest_pain_cardiac_risk',
        condition: (p) => {
          const symptoms = p.symptoms || [];
          return symptoms.includes('chest_pain') && 
                 (p.age > 40 || symptoms.includes('shortness_of_breath'));
        },
        level: 'URGENT',
        action: 'Chest pain with cardiac risk factors. ECG and cardiac enzymes.',
        confidence: 0.87
      },
      {
        name: 'stroke_symptoms',
        condition: (p) => {
          const symptoms = p.symptoms || [];
          return symptoms.includes('sudden_weakness') || 
                 symptoms.includes('facial_droop') ||
                 symptoms.includes('speech_difficulty');
        },
        level: 'CRITICAL',
        action: 'Possible stroke. Immediate neurological assessment and CT.',
        confidence: 0.93
      }
    ];
  }
}

module.exports = { UltraFastTriageService, TriageRuleEngine };
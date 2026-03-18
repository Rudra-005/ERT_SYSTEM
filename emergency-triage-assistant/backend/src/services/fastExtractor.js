/**
 * FastExtractor - Ultra-optimized patient data extraction
 * Pre-compiled regex patterns, single-pass extraction, zero string duplication
 */

// Pre-compiled regex patterns (compiled once, reused)
const PATTERNS = {
  // Age patterns
  age: [
    /(\d{1,3})\s*(?:year|yr|yo|y\.o\.)?\s*old/i,
    /age[:\s]+(\d{1,3})/i,
    /(\d{1,3})\s*(?:yo|y\.o\.)/i,
  ],
  
  // Vital signs - optimized patterns
  bp: /(?:bp|blood pressure|systolic|diastolic)[:\s]*(\d{2,3})\D+(\d{2,3})/i,
  systolic: /systolic[:\s]*(\d{2,3})|(\d{2,3})\s*(?:systolic|mmhg)/i,
  diastolic: /diastolic[:\s]*(\d{2,3})|(\d{2,3})\s*(?:diastolic|mmhg)/i,
  
  temp: [
    /(?:temp|temperature)[:\s]*(\d{2,3}\.\d?)\s*(?:f|deg|°)?/i,
    /(\d{2,3}\.\d)\s*(?:fahrenheit|f|°f)/i,
    /(\d{2,3})\s*(?:degrees?|°)?\s*f(?:aren)?/i,
  ],
  
  o2: [
    /(?:o2|oxygen|spo2)[:\s]*(\d{2,3})(?:%)?/i,
    /(\d{2,3})%?\s*(?:oxygen|o2)/i,
    /(?:sat|saturation)[:\s]*(\d{2,3})/i,
  ],
  
  pulse: [
    /(?:pulse|heart rate|hr)[:\s]*(\d{2,3})/i,
    /(\d{2,3})\s*(?:bpm|beats?)/i,
  ],
  
  respiration: [
    /(?:resp|respiratory rate|rr)[:\s]*(\d{1,2})/i,
    /(\d{1,2})\s*(?:respirations?|breaths?)/i,
  ],
  
  gender: /\b(male|female|m|f)\b/i,
};

// Symptom keyword map (compiled once)
const SYMPTOM_MAP = {
  'chest pain': 'chest_pain',
  'chest pressure': 'chest_pain',
  'chest tightness': 'chest_pain',
  'shortness of breath': 'shortness_of_breath',
  'dyspnea': 'shortness_of_breath',
  'trouble breathing': 'shortness_of_breath',
  'difficulty breathing': 'shortness_of_breath',
  'breathing difficulty': 'shortness_of_breath',
  'headache': 'headache',
  'head pain': 'headache',
  'fever': 'fever',
  'high temperature': 'fever',
  'elevated temp': 'fever',
  'nausea': 'nausea',
  'vomiting': 'vomiting',
  'abdominal pain': 'abdominal_pain',
  'belly pain': 'abdominal_pain',
  'stomach pain': 'abdominal_pain',
  'diarrhea': 'diarrhea',
  'loss of consciousness': 'altered_mental_status',
  'unconscious': 'altered_mental_status',
  'confusion': 'altered_mental_status',
  'confused': 'altered_mental_status',
  'dizziness': 'dizziness',
  'dizzy': 'dizziness',
  'vertigo': 'dizziness',
  'weakness': 'weakness',
  'weak': 'weakness',
  'fainting': 'syncope',
  'fatigued': 'fatigue',
  'fatigue': 'fatigue',
  'seizure': 'seizure',
  'convulsion': 'seizure',
  'bleeding': 'hemorrhage',
  'hemorrhage': 'hemorrhage',
  'blood': 'hemorrhage',
  'rash': 'rash',
  'skin rash': 'rash',
  'injury': 'trauma',
  'trauma': 'trauma',
  'fall': 'trauma',
  'burn': 'burn',
  'severe pain': 'severe_pain',
};

/**
 * Fast extraction engine - single pass, minimal object allocation
 */
class FastExtractor {
  constructor() {
    // Pre-compile symptom keywords for search
    this.symptomKeywords = Object.keys(SYMPTOM_MAP);
    this.symptomKeywords.sort((a, b) => b.length - a.length); // Longer first
  }

  /**
   * Extract all patient data in single pass
   * @param {string} text - Patient description text
   * @returns {object} Extracted patient data
   */
  extractPatientData(text) {
    const lowerText = text.toLowerCase();
    const start = Date.now();

    return {
      symptoms: this._extractSymptoms(lowerText),
      age: this._extractAge(lowerText),
      gender: this._extractGender(lowerText),
      bp_systolic: this._extractSystolic(lowerText),
      bp_diastolic: this._extractDiastolic(lowerText),
      temp: this._extractTemperature(lowerText),
      o2_sat: this._extractO2Sat(lowerText),
      pulse: this._extractPulse(lowerText),
      respiration: this._extractRespiration(lowerText),
      extraction_time_ms: Date.now() - start,
    };
  }

  /**
   * Extract symptoms - O(n) single pass
   */
  _extractSymptoms(lowerText) {
    const symptoms = [];
    const seen = new Set();

    for (const keyword of this.symptomKeywords) {
      if (lowerText.includes(keyword)) {
        const symptomCode = SYMPTOM_MAP[keyword];
        if (!seen.has(symptomCode)) {
          symptoms.push(symptomCode);
          seen.add(symptomCode);
        }
      }
    }

    return symptoms;
  }

  /**
   * Extract age - try patterns in order
   */
  _extractAge(lowerText) {
    for (const pattern of PATTERNS.age) {
      const match = lowerText.match(pattern);
      if (match) {
        const age = parseInt(match[1], 10);
        if (age >= 0 && age <= 120) return age;
      }
    }
    return null;
  }

  /**
   * Extract gender
   */
  _extractGender(lowerText) {
    const match = lowerText.match(PATTERNS.gender);
    if (match) {
      const g = match[1].toLowerCase();
      return g === 'f' || g === 'female' ? 'F' : 'M';
    }
    return null;
  }

  /**
   * Extract systolic BP
   */
  _extractSystolic(lowerText) {
    // Try full BP pattern first
    let match = lowerText.match(PATTERNS.bp);
    if (match) {
      const sys = parseInt(match[1], 10);
      if (sys >= 60 && sys <= 250) return sys;
    }

    // Try systolic-specific pattern
    match = lowerText.match(PATTERNS.systolic);
    if (match) {
      const sys = parseInt(match[1] || match[2], 10);
      if (sys >= 60 && sys <= 250) return sys;
    }

    return null;
  }

  /**
   * Extract diastolic BP
   */
  _extractDiastolic(lowerText) {
    // Try full BP pattern first
    let match = lowerText.match(PATTERNS.bp);
    if (match) {
      const dia = parseInt(match[2], 10);
      if (dia >= 40 && dia <= 150) return dia;
    }

    // Try diastolic-specific pattern
    match = lowerText.match(PATTERNS.diastolic);
    if (match) {
      const dia = parseInt(match[1] || match[2], 10);
      if (dia >= 40 && dia <= 150) return dia;
    }

    return null;
  }

  /**
   * Extract temperature
   */
  _extractTemperature(lowerText) {
    for (const pattern of PATTERNS.temp) {
      const match = lowerText.match(pattern);
      if (match) {
        let temp = parseFloat(match[1]);
        // Convert Celsius to Fahrenheit if needed
        if (temp < 37) temp = temp * 9/5 + 32;
        if (temp >= 94 && temp <= 107) return Math.round(temp * 10) / 10;
      }
    }
    return null;
  }

  /**
   * Extract O2 saturation
   */
  _extractO2Sat(lowerText) {
    for (const pattern of PATTERNS.o2) {
      const match = lowerText.match(pattern);
      if (match) {
        const o2 = parseInt(match[1], 10);
        if (o2 >= 50 && o2 <= 100) return o2;
      }
    }
    return null;
  }

  /**
   * Extract pulse/heart rate
   */
  _extractPulse(lowerText) {
    for (const pattern of PATTERNS.pulse) {
      const match = lowerText.match(pattern);
      if (match) {
        const pulse = parseInt(match[1], 10);
        if (pulse >= 30 && pulse <= 200) return pulse;
      }
    }
    return null;
  }

  /**
   * Extract respiration rate
   */
  _extractRespiration(lowerText) {
    for (const pattern of PATTERNS.respiration) {
      const match = lowerText.match(pattern);
      if (match) {
        const rr = parseInt(match[1], 10);
        if (rr >= 8 && rr <= 40) return rr;
      }
    }
    return null;
  }
}

// Singleton instance
const fastExtractor = new FastExtractor();

module.exports = { FastExtractor, fastExtractor };

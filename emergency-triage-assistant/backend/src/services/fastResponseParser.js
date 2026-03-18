/**
 * FastResponseParser - Ultra-optimized structured response parsing
 * Handles JSON extraction, error recovery, and direct object parsing
 */

class FastResponseParser {
  constructor() {
    // Pre-compiled patterns for response extraction
    this.patterns = {
      // Extract JSON blocks
      jsonBlock: /```json\s*\n?([\s\S]*?)\n?```/i,
      jsonInline: /\{[\s\S]*\}/,
      
      // Extract common fields
      immediateAction: /immediate[_\s]?action[:\s]*"([^"]+)"/i,
      differentialDiagnosis: /differential[_\s]?diagnosis[:\s]*\[([^\]]*)\]/i,
      riskConsiderations: /risk[_\s]?considerations[:\s]*"([^"]+)"/i,
      supportingEvidence: /supporting[_\s]?evidence[:\s]*"([^"]+)"/i,
    };
  }

  /**
   * Parse LLM response - handles multiple formats
   * @param {string|object} response - Raw response from LLM
   * @returns {object} Parsed structured response
   */
  parseResponse(response) {
    const startTime = Date.now();

    // If already an object, return as-is
    if (typeof response === 'object' && response !== null) {
      return {
        ...response,
        __parsed: true,
        parse_time_ms: Date.now() - startTime,
      };
    }

    const text = String(response).trim();

    // Try JSON block first (fastest)
    let parsed = this._parseJsonBlock(text);
    if (parsed) {
      return {
        ...parsed,
        __parsed: true,
        __source: 'json_block',
        parse_time_ms: Date.now() - startTime,
      };
    }

    // Try direct JSON parsing
    parsed = this._parseDirectJson(text);
    if (parsed) {
      return {
        ...parsed,
        __parsed: true,
        __source: 'direct_json',
        parse_time_ms: Date.now() - startTime,
      };
    }

    // Fall back to field extraction
    parsed = this._extractFields(text);
    return {
      ...parsed,
      __parsed: true,
      __source: 'field_extraction',
      parse_time_ms: Date.now() - startTime,
    };
  }

  /**
   * Parse JSON code block
   * @private
   */
  _parseJsonBlock(text) {
    const match = text.match(this.patterns.jsonBlock);
    if (!match) return null;

    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse direct JSON
   * @private
   */
  _parseDirectJson(text) {
    // Find first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1) return null;

    try {
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      // Try to fix common JSON issues
      try {
        const fixed = this._fixJsonString(jsonStr);
        return JSON.parse(fixed);
      } catch (e2) {
        return null;
      }
    }
  }

  /**
   * Extract fields from unstructured text
   * @private
   */
  _extractFields(text) {
    const result = {
      immediate_action: null,
      differential_diagnosis: [],
      risk_considerations: null,
      supporting_evidence: null,
      verification_status: null,
    };

    // Extract immediate action
    let match = text.match(this.patterns.immediateAction);
    if (match) result.immediate_action = match[1];

    // Extract differential diagnosis
    match = text.match(this.patterns.differentialDiagnosis);
    if (match) {
      const items = match[1]
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      result.differential_diagnosis = items.slice(0, 5); // Limit to 5
    }

    // Extract risk considerations
    match = text.match(this.patterns.riskConsiderations);
    if (match) result.risk_considerations = match[1];

    // Extract supporting evidence
    match = text.match(this.patterns.supportingEvidence);
    if (match) result.supporting_evidence = match[1];

    // Extract verification status from text
    if (text.match(/verified/i)) result.verification_status = 'Verified';
    else if (text.match(/mostly verified|largely verified/i)) result.verification_status = 'Mostly Verified';
    else if (text.match(/needs review|uncertain/i)) result.verification_status = 'Needs Review';

    return result;
  }

  /**
   * Fix common JSON formatting issues
   * @private
   */
  _fixJsonString(jsonStr) {
    return jsonStr
      // Fix missing quotes in keys
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix single quotes to double quotes in values
      .replace(/'([^']+)'/g, '"$1"')
      // Fix unescaped newlines in strings
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Safe field extraction with defaults
   */
  safeExtract(response, fieldPath, defaultValue = null) {
    try {
      const parts = fieldPath.split('.');
      let current = response;

      for (const part of parts) {
        if (current === null || current === undefined) return defaultValue;
        current = current[part];
      }

      return current !== null && current !== undefined ? current : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Validate response structure
   */
  validateResponse(response) {
    const validFields = {
      immediate_action: 'string',
      differential_diagnosis: 'array',
      risk_considerations: 'string',
      supporting_evidence: 'string',
      verification_status: 'string',
      confidence: 'number',
    };

    const issues = [];

    for (const [field, expectedType] of Object.entries(validFields)) {
      const value = response[field];

      if (value === null || value === undefined) {
        issues.push(`Missing field: ${field}`);
        continue;
      }

      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== expectedType) {
        issues.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Normalize response to standard format
   */
  normalize(response) {
    return {
      immediate_action: this.safeExtract(response, 'immediate_action', 'Immediate evaluation required'),
      differential_diagnosis: this.safeExtract(response, 'differential_diagnosis', []).slice(0, 5),
      risk_considerations: this.safeExtract(response, 'risk_considerations', 'Standard precautions'),
      supporting_evidence: this.safeExtract(response, 'supporting_evidence', 'Assessment based on clinical presentation'),
      verification_status: this.safeExtract(response, 'verification_status', 'Needs Review'),
      confidence: Math.min(100, Math.max(0, this.safeExtract(response, 'confidence', 50))),
    };
  }
}

// Singleton instance
const fastResponseParser = new FastResponseParser();

module.exports = { FastResponseParser, fastResponseParser };

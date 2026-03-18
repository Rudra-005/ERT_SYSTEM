/**
 * FastVerification - Ultra-optimized response verification
 * No object stringification, no tokenization, single-pass analysis
 */

class FastVerificationService {
  constructor() {
    // Pre-compiled word boundary pattern
    this.wordPattern = /\b\w+\b/g;
    
    // Medical keywords that are always allowed (won't flag as unsupported)
    this.trustedTerms = new Set([
      'immediate', 'urgent', 'evaluation', 'assessment', 'monitoring', 'treatment',
      'hospitalization', 'admission', 'cardiac', 'respiratory', 'neurological',
      'critical', 'severe', 'moderate', 'mild', 'stable', 'unstable', 'alert',
      'medication', 'airway', 'oxygen', 'vital', 'signs', 'symptoms', 'condition',
      'further', 'necessary', 'protocol', 'management', 'intervention', 'support'
    ]);
  }

  /**
   * Verify recommendation against source data - O(n) single pass
   * @param {string} sourceText - Original patient description
   * @param {object} recommendation - Parsed recommendation object
   * @returns {object} Verification result
   */
  verify(sourceText, recommendation) {
    const startTime = Date.now();
    
    if (!sourceText || !recommendation) {
      return {
        status: 'Needs Review',
        confidence: 50,
        unsupported_claims: [],
        verify_time_ms: Date.now() - startTime,
      };
    }

    const lowerSource = sourceText.toLowerCase();
    const sourceWords = new Set(this._extractWords(lowerSource));

    // Build searchable source index (for faster lookups)
    const sourceIndex = this._buildIndex(lowerSource);

    // Verify each field
    const verification = {
      immediate_action: this._verifyText(recommendation.immediate_action, sourceIndex, sourceWords),
      differential_diagnosis: this._verifyArray(recommendation.differential_diagnosis, sourceIndex, sourceWords),
      risk_considerations: this._verifyText(recommendation.risk_considerations, sourceIndex, sourceWords),
    };

    // Calculate overall status
    const totalWeight = 3;
    const verifiedWeight = Object.values(verification).filter(v => v.verified).length;
    const verificationScore = verifiedWeight / totalWeight;

    let status;
    if (verificationScore >= 0.8) status = 'Verified';
    else if (verificationScore >= 0.5) status = 'Mostly Verified';
    else status = 'Needs Review';

    return {
      status,
      confidence: Math.round(verificationScore * 100),
      unsupported_claims: [
        ...verification.immediate_action.unsupported,
        ...verification.differential_diagnosis.unsupported,
        ...verification.risk_considerations.unsupported,
      ].slice(0, 3),
      verify_time_ms: Date.now() - startTime,
      details: verification,
    };
  }

  /**
   * Verify text field against source
   * @private
   */
  _verifyText(text, sourceIndex, sourceWords) {
    if (!text) return { verified: true, unsupported: [] };

    const words = this._extractImportantWords(text);
    if (words.length === 0) return { verified: true, unsupported: [] };

    let matchCount = 0;
    let unsupported = [];

    for (const word of words) {
      if (sourceIndex.has(word) || this.trustedTerms.has(word)) {
        matchCount++;
      } else {
        unsupported.push(word);
      }
    }

    const matchRatio = matchCount / words.length;
    const verified = matchRatio > 0.4 || matchCount >= 3;

    return {
      verified,
      unsupported: unsupported.slice(0, 2),
      match_ratio: matchRatio,
    };
  }

  /**
   * Verify array field against source
   * @private
   */
  _verifyArray(items, sourceIndex, sourceWords) {
    if (!Array.isArray(items) || items.length === 0) {
      return { verified: true, unsupported: [] };
    }

    const unsupported = [];
    let verifiedCount = 0;

    for (const item of items) {
      const verification = this._verifyText(item, sourceIndex, sourceWords);
      if (verification.verified) {
        verifiedCount++;
      } else {
        unsupported.push(String(item).substring(0, 50));
      }
    }

    const verified = verifiedCount / items.length > 0.5;
    return {
      verified,
      unsupported: unsupported.slice(0, 2),
    };
  }

  /**
   * Extract important words (>4 characters) - single pass
   * @private
   */
  _extractImportantWords(text) {
    if (!text) return [];

    const words = [];
    const matches = text.matchAll(this.wordPattern);

    for (const match of matches) {
      const word = match[0].toLowerCase();
      // Only important words (>4 chars, not common)
      if (word.length > 4 && !this._isCommonWord(word)) {
        words.push(word);
      }
    }

    return words;
  }

  /**
   * Extract all words from text
   * @private
   */
  _extractWords(text) {
    const words = [];
    const matches = text.matchAll(this.wordPattern);

    for (const match of matches) {
      words.push(match[0].toLowerCase());
    }

    return words;
  }

  /**
   * Check if word is common filler
   * @private
   */
  _isCommonWord(word) {
    const common = ['the', 'and', 'that', 'with', 'this', 'from', 'have', 'been', 
                   'were', 'which', 'their', 'about', 'would', 'could', 'should'];
    return common.includes(word);
  }

  /**
   * Build index of words in source for O(1) lookup
   * @private
   */
  _buildIndex(text) {
    const index = new Set();
    const matches = text.matchAll(this.wordPattern);

    for (const match of matches) {
      index.add(match[0].toLowerCase());
    }

    return index;
  }

  /**
   * Quick verification - just check if any key terms match
   */
  quickVerify(sourceText, fieldText) {
    if (!sourceText || !fieldText) return true;

    const lowerSource = sourceText.toLowerCase();
    const words = fieldText.toLowerCase().match(/\b\w{4,}\b/g) || [];

    const matchCount = words.filter(w => lowerSource.includes(w)).length;
    return matchCount > 0 || words.length < 3; // Pass if any match or short text
  }
}

// Singleton instance
const fastVerificationService = new FastVerificationService();

module.exports = { FastVerificationService, fastVerificationService };

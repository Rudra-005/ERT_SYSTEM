const { getLLMRelevanceFilter } = require('./llmFilter');
const { countTokens } = require('../utils/tokenCounter');

function extractRelevantByRules(patientHistory, emergencyDescription) {
  const lines = patientHistory.split(/\n+/);
  const emergencyKeywords = emergencyDescription.toLowerCase().split(/\s+/);
  
  const medicalKeywords = [
    'pain', 'fever', 'bleeding', 'fracture', 'injury', 'allergic', 'medication',
    'surgery', 'chronic', 'acute', 'diagnosis', 'treatment', 'symptom', 'condition',
    'blood', 'pressure', 'heart', 'respiratory', 'cardiac', 'trauma', 'emergency'
  ];

  const relevantLines = lines.filter(line => {
    const lineLower = line.toLowerCase();
    
    const hasEmergencyKeyword = emergencyKeywords.some(kw => 
      kw.length > 3 && lineLower.includes(kw)
    );
    
    const hasMedicalKeyword = medicalKeywords.some(kw => lineLower.includes(kw));
    
    return hasEmergencyKeyword || hasMedicalKeyword;
  });

  return relevantLines.join('\n');
}

async function scaleDownCompress(patientHistory, emergencyDescription) {
  const startTime = Date.now();
  
  const ruleFiltered = extractRelevantByRules(patientHistory, emergencyDescription);
  
  const llmFiltered = await getLLMRelevanceFilter(
    ruleFiltered, 
    emergencyDescription
  );
  
  const originalTokens = countTokens(patientHistory);
  const compressedTokens = countTokens(llmFiltered);
  const reductionPercent = ((originalTokens - compressedTokens) / originalTokens * 100).toFixed(2);
  
  return {
    original_tokens: originalTokens,
    compressed_tokens: compressedTokens,
    reduction_percent: parseFloat(reductionPercent),
    compressed_text: llmFiltered,
    compression_latency_ms: Date.now() - startTime
  };
}

module.exports = { scaleDownCompress };

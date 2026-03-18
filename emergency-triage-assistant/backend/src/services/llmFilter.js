const { callOllama, formatPhi3Prompt } = require('../ollamaService');

async function getLLMRelevanceFilter(ruleFilteredText, emergencyDescription) {
  const systemMessage = 'You are a medical AI assistant that extracts relevant information from patient records.';
  
  const userMessage = `Given this emergency: "${emergencyDescription}"

Extract ONLY the relevant medical records from the patient history below. Preserve exact wording. Remove irrelevant information.

Patient History:
${ruleFilteredText}

Return only the relevant excerpts:`;

  const prompt = formatPhi3Prompt(systemMessage, userMessage);

  try {
    const result = await callOllama(prompt, { num_predict: 500 });
    return result.response.trim();
  } catch (error) {
    console.error('LLM filter error:', error.message);
    return ruleFilteredText;
  }
}

module.exports = { getLLMRelevanceFilter };

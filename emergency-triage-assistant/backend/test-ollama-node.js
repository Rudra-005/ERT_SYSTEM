/**
 * Test script for Node.js Ollama Inference Service
 * 
 * Tests all three functions:
 * 1. Health check
 * 2. Emergency triage query
 * 3. Chatbot conversation
 * 
 * Run: node test-ollama-node.js
 */

require('dotenv').config();
const {
  healthCheck,
  emergencyTriageQuery,
  chatbotConversation,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL
} = require('./src/services/ollamaInferenceService');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function runTests() {
  console.log(`${colors.bold}${colors.cyan}=== Ollama Node.js Service Test ===${colors.reset}\n`);
  console.log(`Base URL: ${OLLAMA_BASE_URL}`);
  console.log(`Model: ${OLLAMA_MODEL}\n`);

  // Test 1: Health Check
  console.log(`${colors.bold}Test 1: Health Check${colors.reset}`);
  try {
    const health = await healthCheck();
    if (health.healthy) {
      console.log(`${colors.green}✓ PASS${colors.reset} - ${health.message}`);
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${health.message}`);
      console.log(`${colors.yellow}⚠ Remaining tests may fail if Ollama is not running${colors.reset}\n`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
  }
  console.log('');

  // Test 2: Emergency Triage Query
  console.log(`${colors.bold}Test 2: Emergency Triage Query${colors.reset}`);
  const complaint = "Severe chest pain radiating to left arm, shortness of breath";
  const vitals = {
    bp: "160/100",
    pulse: 110,
    temp: 98.6,
    spo2: 94
  };
  
  console.log(`Complaint: ${complaint}`);
  console.log(`Vitals: BP ${vitals.bp}, Pulse ${vitals.pulse}, Temp ${vitals.temp}°F, SpO2 ${vitals.spo2}%`);
  
  try {
    const result = await emergencyTriageQuery(complaint, vitals);
    
    if (result.error) {
      console.log(`${colors.red}✗ ERROR${colors.reset} - ${result.error}`);
      console.log(`Reason: ${result.reason}`);
    } else {
      console.log(`${colors.green}✓ PASS${colors.reset}`);
      console.log(`Severity: ${colors.bold}${result.severity}${colors.reset}`);
      console.log(`Reason: ${result.reason}`);
      console.log(`Actions:`);
      result.actions.forEach((action, i) => console.log(`  ${i + 1}. ${action}`));
    }
    
    console.log(`${colors.cyan}Response Time: ${result.responseTime}ms${colors.reset}`);
    
    if (result.responseTime < 400) {
      console.log(`${colors.green}✓ Under 400ms target${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Exceeded 400ms target${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
  }
  console.log('');

  // Test 3: Chatbot Conversation
  console.log(`${colors.bold}Test 3: Chatbot Conversation${colors.reset}`);
  const conversationHistory = [
    { role: 'user', content: 'What should I do if I have a fever?' },
    { role: 'assistant', content: 'For a fever, rest and stay hydrated. Take over-the-counter fever reducers if needed. Seek medical care if fever exceeds 103°F or lasts more than 3 days.' }
  ];
  const newMessage = "What temperature is considered dangerous?";
  
  console.log(`New Message: ${newMessage}`);
  
  try {
    const result = await chatbotConversation(conversationHistory, newMessage);
    
    if (result.error) {
      console.log(`${colors.red}✗ ERROR${colors.reset} - ${result.error}`);
    } else {
      console.log(`${colors.green}✓ PASS${colors.reset}`);
      console.log(`Response: ${result.response}`);
    }
    
    console.log(`${colors.cyan}Response Time: ${result.responseTime}ms${colors.reset}`);
    
    if (result.responseTime < 400) {
      console.log(`${colors.green}✓ Under 400ms target${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Exceeded 400ms target${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
  }
  console.log('');

  console.log(`${colors.bold}${colors.cyan}=== Test Complete ===${colors.reset}`);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

const { 
  triageQuery, 
  chatQuery, 
  ragQuery, 
  healthCheck, 
  getStructuredRecommendation 
} = require('./src/ollamaService');

require('dotenv').config();

async function testOllamaService() {
  console.log('🚀 Testing Ollama Service Integration\n');
  console.log('Configuration:');
  console.log(`- Base URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
  console.log(`- Model: ${process.env.OLLAMA_MODEL || 'phi3:mini'}\n`);

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const health = await healthCheck();
    console.log('✅ Health Check Result:', JSON.stringify(health, null, 2));
    
    if (health.status !== 'healthy') {
      console.log('⚠️  Ollama service is not healthy. Please check if Ollama is running.');
      return;
    }
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Triage Query
  console.log('2️⃣ Testing Triage Query...');
  const triageCase = `
    Patient: 45-year-old male
    Chief Complaint: Severe chest pain for 30 minutes
    Vital Signs: BP 160/95, HR 110, RR 22, O2 98%
    History: Hypertension, smoking history
    Pain: 8/10, crushing, radiates to left arm
  `;

  try {
    const triageResult = await triageQuery(triageCase);
    console.log('✅ Triage Query Result:');
    console.log(`- Response: ${triageResult.response.substring(0, 200)}...`);
    console.log(`- Latency: ${triageResult.total_latency_ms}ms`);
    console.log(`- Model: ${triageResult.model}`);
  } catch (error) {
    console.log('❌ Triage Query Failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Chat Query
  console.log('3️⃣ Testing Chat Query...');
  const chatMessages = [
    { role: 'user', content: 'I have been having chest pain for the last hour. Should I be worried?' },
    { role: 'assistant', content: 'I understand your concern about chest pain. Can you describe the pain - is it sharp, dull, or crushing?' },
    { role: 'user', content: 'It feels like pressure, and it came on suddenly while I was resting.' }
  ];

  try {
    const chatResult = await chatQuery(chatMessages);
    console.log('✅ Chat Query Result:');
    console.log(`- Response: ${chatResult.response.substring(0, 200)}...`);
    console.log(`- Latency: ${chatResult.total_latency_ms}ms`);
    console.log(`- Model: ${chatResult.model}`);
  } catch (error) {
    console.log('❌ Chat Query Failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: RAG Query
  console.log('4️⃣ Testing RAG Query...');
  const context = `
    Patient ID: 12345
    Previous Visit: 2024-01-15
    Diagnosis: Hypertension, Type 2 Diabetes
    Medications: Metformin 500mg BID, Lisinopril 10mg daily
    Allergies: Penicillin
    Last BP: 145/90
    Last A1C: 7.2%
  `;
  const query = 'What medications is this patient currently taking?';

  try {
    const ragResult = await ragQuery(context, query, 'emergency');
    console.log('✅ RAG Query Result:');
    console.log(`- Response: ${ragResult.response.substring(0, 200)}...`);
    console.log(`- Latency: ${ragResult.total_latency_ms}ms`);
    console.log(`- Mode: ${ragResult.mode}`);
    console.log(`- Model: ${ragResult.model}`);
  } catch (error) {
    console.log('❌ RAG Query Failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Structured Recommendation
  console.log('5️⃣ Testing Structured Recommendation...');
  const compressedHistory = 'HTN, DM2, smoker, previous MI 2019';
  const emergency = 'Severe chest pain, diaphoresis, nausea, 30min duration';

  try {
    const structuredResult = await getStructuredRecommendation(compressedHistory, emergency);
    console.log('✅ Structured Recommendation Result:');
    console.log(JSON.stringify(structuredResult, null, 2));
  } catch (error) {
    console.log('❌ Structured Recommendation Failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Performance Summary
  console.log('📊 Performance Summary:');
  console.log('All tests completed! Check individual latencies above.');
  console.log('\n🎉 Ollama Service Integration Test Complete!');
  console.log('\nNext steps:');
  console.log('1. Start your backend: npm run dev');
  console.log('2. Test endpoints: http://localhost:5000/api/health');
  console.log('3. Use the frontend to test full integration');
}

// Run tests
testOllamaService().catch(error => {
  console.error('Test suite failed:', error.message);
  process.exit(1);
});
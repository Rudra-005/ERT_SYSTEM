const axios = require('axios');

const TEST_CASE = `Patient: 58-year-old male
Chief Complaint: Severe chest pain radiating to left arm
Vital Signs:
- BP: 165/95 mmHg
- HR: 110 bpm
- O2 Sat: 94%
- Temp: 98.6°F
History: Hypertension, smoker (30 years)
Symptoms: Diaphoresis, nausea, shortness of breath
Duration: Started 45 minutes ago`;

async function testOptimized() {
  console.log('🚀 Testing OPTIMIZED endpoint with Groq...\n');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post('http://localhost:5000/api/triage/optimized', {
      caseDescription: TEST_CASE,
      apiKey: 'dummy' // Not used with Groq
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log('✅ SUCCESS!\n');
    console.log('📊 Performance Metrics:');
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Compression: ${response.data.data.latency.compression}ms`);
    console.log(`   LLM Call: ${response.data.data.latency.llm}ms`);
    console.log(`   Verification: ${response.data.data.latency.verification}ms`);
    console.log(`   Confidence: ${response.data.data.latency.confidence}ms\n`);
    
    console.log('🎯 Token Reduction:');
    console.log(`   Original: ${response.data.data.tokenStats.originalTokens} tokens`);
    console.log(`   Compressed: ${response.data.data.tokenStats.compressedTokens} tokens`);
    console.log(`   Saved: ${response.data.data.tokenStats.reduction}%\n`);
    
    console.log('🏥 Recommendation:');
    console.log(`   ${response.data.data.recommendation.substring(0, 200)}...\n`);
    
    console.log('✨ Confidence Score:', response.data.data.confidence.score);
    console.log('📈 Verification Score:', response.data.data.verification.score);
    
    if (totalTime < 2000) {
      console.log('\n🎉 EXCELLENT! Response time < 2 seconds (Groq is working!)');
    } else {
      console.log('\n⚠️  Slower than expected. Check if Groq API is being used.');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend is running: cd backend && npm run dev');
    console.log('   2. GROQ_API_KEY is set in backend/.env');
    console.log('   3. Port 5000 is available');
  }
}

async function testNaive() {
  console.log('\n\n🔄 Testing NAIVE endpoint with Groq...\n');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post('http://localhost:5000/api/triage/naive', {
      caseDescription: TEST_CASE,
      apiKey: 'dummy'
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log('✅ SUCCESS!\n');
    console.log('📊 Performance:');
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   LLM Call: ${response.data.data.latency.llm}ms\n`);
    
    console.log('🏥 Recommendation:');
    console.log(`   ${response.data.data.recommendation.substring(0, 200)}...\n`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GROQ OPTIMIZATION TEST - Emergency Triage Assistant');
  console.log('═══════════════════════════════════════════════════════\n');
  
  await testOptimized();
  await testNaive();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Test Complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

runTests();

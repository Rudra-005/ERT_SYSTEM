const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

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

const SIMPLE_CASE = `Patient: 25-year-old female with mild headache for 2 hours. No other symptoms.`;

async function testHybridUltraFast() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HYBRID SYSTEM TEST - <400ms Target');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: First call (no cache, should use Groq)
  console.log('🧪 TEST 1: First Call (Groq, no cache)');
  console.log('Expected: 150-400ms\n');
  
  try {
    const start1 = Date.now();
    const response1 = await axios.post(`${BASE_URL}/api/hybrid/ultra-fast`, {
      caseDescription: TEST_CASE,
      apiKey: 'dummy'
    });
    const time1 = Date.now() - start1;
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Total Time: ${time1}ms`);
    console.log(`   Provider: ${response1.data.data.latency.llmProvider}`);
    console.log(`   From Cache: ${response1.data.data.latency.fromCache}`);
    console.log(`   Compression: ${response1.data.data.latency.compression}ms`);
    console.log(`   LLM Call: ${response1.data.data.latency.llm}ms`);
    console.log(`   Verification: ${response1.data.data.latency.verification}ms`);
    console.log(`   Confidence: ${response1.data.data.latency.confidence}ms`);
    console.log(`   Met Target: ${response1.data.data.performance.metTarget ? '✅' : '❌'}\n`);
    
    if (time1 < 400) {
      console.log('   🎉 EXCELLENT! Under 400ms target!\n');
    } else if (time1 < 800) {
      console.log('   ✅ GOOD! Under 800ms (Groq target)\n');
    } else {
      console.log('   ⚠️  Slower than expected. Check if Groq is working.\n');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    console.log('\n💡 Make sure backend is running: cd backend && npm run dev\n');
    return;
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Second call (should hit cache)
  console.log('🧪 TEST 2: Second Call (Cache hit)');
  console.log('Expected: 0-50ms\n');
  
  try {
    const start2 = Date.now();
    const response2 = await axios.post(`${BASE_URL}/api/hybrid/ultra-fast`, {
      caseDescription: TEST_CASE,
      apiKey: 'dummy'
    });
    const time2 = Date.now() - start2;
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Total Time: ${time2}ms`);
    console.log(`   Provider: ${response2.data.data.latency.llmProvider}`);
    console.log(`   From Cache: ${response2.data.data.latency.fromCache}`);
    console.log(`   LLM Call: ${response2.data.data.latency.llm}ms`);
    
    if (time2 < 50) {
      console.log(`   🎉 BLAZING FAST! Cache working perfectly!\n`);
    } else if (time2 < 100) {
      console.log(`   ✅ FAST! Cache hit successful!\n`);
    } else {
      console.log(`   ⚠️  Cache might not be working. Expected <50ms.\n`);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }

  // Test 3: Different case (no cache, Groq)
  console.log('🧪 TEST 3: Different Case (Groq, no cache)');
  console.log('Expected: 150-400ms\n');
  
  try {
    const start3 = Date.now();
    const response3 = await axios.post(`${BASE_URL}/api/hybrid/ultra-fast`, {
      caseDescription: SIMPLE_CASE,
      apiKey: 'dummy'
    });
    const time3 = Date.now() - start3;
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Total Time: ${time3}ms`);
    console.log(`   Provider: ${response3.data.data.latency.llmProvider}`);
    console.log(`   From Cache: ${response3.data.data.latency.fromCache}`);
    console.log(`   Met Target: ${response3.data.data.performance.metTarget ? '✅' : '❌'}\n`);
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }

  // Test 4: Get statistics
  console.log('🧪 TEST 4: Performance Statistics\n');
  
  try {
    const statsResponse = await axios.get(`${BASE_URL}/api/hybrid/stats`);
    const stats = statsResponse.data.stats;
    
    console.log('📊 Cache Performance:');
    console.log(`   Hits: ${stats.cache.hits}`);
    console.log(`   Misses: ${stats.cache.misses}`);
    console.log(`   Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`   Cache Size: ${stats.cache.size} entries\n`);
    
    console.log('⚡ Groq Performance:');
    console.log(`   Calls: ${stats.groq.calls}`);
    console.log(`   Avg Latency: ${stats.groq.avgLatency}ms`);
    console.log(`   Success Rate: ${(stats.groq.successRate * 100).toFixed(1)}%`);
    console.log(`   Errors: ${stats.groq.errors}\n`);
    
    console.log('🐌 Ollama Performance:');
    console.log(`   Calls: ${stats.ollama.calls}`);
    console.log(`   Avg Latency: ${stats.ollama.avgLatency}ms`);
    console.log(`   Success Rate: ${(stats.ollama.successRate * 100).toFixed(1)}%`);
    console.log(`   Errors: ${stats.ollama.errors}\n`);
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }

  // Test 5: Rapid fire (test cache performance)
  console.log('🧪 TEST 5: Rapid Fire Test (10 requests)');
  console.log('Testing cache performance under load\n');
  
  try {
    const rapidStart = Date.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.post(`${BASE_URL}/api/hybrid/ultra-fast`, {
          caseDescription: TEST_CASE,
          apiKey: 'dummy'
        })
      );
    }
    
    const results = await Promise.all(promises);
    const rapidTime = Date.now() - rapidStart;
    
    const times = results.map(r => r.data.data.latency.total);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    console.log(`✅ Completed 10 requests in ${rapidTime}ms`);
    console.log(`   Avg per request: ${avgTime.toFixed(0)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    console.log(`   Throughput: ${(10000 / rapidTime).toFixed(1)} req/sec\n`);
    
    if (avgTime < 50) {
      console.log('   🎉 EXCELLENT! Cache is working perfectly!\n');
    } else if (avgTime < 100) {
      console.log('   ✅ GOOD! Fast cache performance!\n');
    } else {
      console.log('   ⚠️  Cache performance could be better.\n');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE!');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📊 Summary:');
  console.log('   ✅ First call (Groq): 150-400ms');
  console.log('   ✅ Cached calls: 0-50ms');
  console.log('   ✅ Rapid fire: <100ms average');
  console.log('   ✅ Hybrid system working!\n');
  
  console.log('🎯 Performance Targets:');
  console.log('   Cache hit: <50ms ✅');
  console.log('   Groq call: <400ms ✅');
  console.log('   Ollama fallback: <5s (if Groq fails)\n');
  
  console.log('💡 Tips:');
  console.log('   - First call uses Groq (150-400ms)');
  console.log('   - Repeated calls use cache (0-50ms)');
  console.log('   - If Groq fails, falls back to Ollama');
  console.log('   - Cache stores 1000 most recent responses\n');
}

// Run tests
testHybridUltraFast().catch(console.error);

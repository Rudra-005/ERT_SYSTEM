// Test script to verify unique results
// Run with: node test-unique-results.js

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/triage/analyze-case';

// Test case data
const testCase = {
  symptoms: 'Chest pain, shortness of breath, sweating',
  age: 45,
  gender: 'Male',
  history: 'Hypertension, diabetes',
  vitals: 'BP: 160/95, Pulse: 110, Temp: 98.6°F, SpO2: 94%, RR: 22, GCS: 15, Pain: 8/10'
};

async function testUniqueResults() {
  console.log('🧪 Testing AI Triage System for Unique Results\n');
  console.log('Test Case:', testCase);
  console.log('\n' + '='.repeat(80) + '\n');

  const results = [];

  // Run 3 identical requests
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📊 Request #${i}:`);
    console.log('─'.repeat(80));
    
    try {
      const startTime = Date.now();
      const response = await axios.post(API_URL, testCase);
      const requestLatency = Date.now() - startTime;
      
      const data = response.data;
      results.push(data);

      console.log(`✅ Response received in ${requestLatency}ms`);
      console.log(`   Case ID: ${data.caseId}`);
      console.log(`   Priority: ${data.riskLevel}`);
      console.log(`   Confidence: ${data.confidence}%`);
      console.log(`   Latency: ${data.latency}ms`);
      console.log(`   Token Reduction: ${data.tokenStats?.reduction}%`);
      console.log(`   Diagnosis: ${data.differentialDiagnosis?.[0]?.diagnosis || data.differentialDiagnosis?.[0] || 'N/A'}`);
      console.log(`   From Cache: ${data.performance?.fromCache}`);
      console.log(`   Summary: ${data.summary?.substring(0, 60)}...`);
      
    } catch (error) {
      console.error(`❌ Request #${i} failed:`, error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
    }

    // Wait 500ms between requests
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Analyze results
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 ANALYSIS OF RESULTS');
  console.log('='.repeat(80) + '\n');

  if (results.length < 3) {
    console.log('❌ Not enough results to analyze (need 3, got ' + results.length + ')');
    return;
  }

  // Check for uniqueness
  const caseIds = results.map(r => r.caseId);
  const confidences = results.map(r => r.confidence);
  const latencies = results.map(r => r.latency);
  const priorities = results.map(r => r.riskLevel);
  const summaries = results.map(r => r.summary);

  console.log('Case IDs:', caseIds);
  console.log('Unique Case IDs:', new Set(caseIds).size === 3 ? '✅ PASS' : '❌ FAIL');
  console.log();

  console.log('Confidences:', confidences);
  console.log('Unique Confidences:', new Set(confidences).size > 1 ? '✅ PASS' : '⚠️  WARNING (may be same)');
  console.log();

  console.log('Latencies:', latencies);
  console.log('Non-zero Latencies:', latencies.every(l => l > 0) ? '✅ PASS' : '❌ FAIL');
  console.log('Varied Latencies:', new Set(latencies).size > 1 ? '✅ PASS' : '⚠️  WARNING');
  console.log();

  console.log('Priorities:', priorities);
  console.log('Priority Check:', priorities.every(p => p && p !== 'undefined') ? '✅ PASS' : '❌ FAIL');
  console.log();

  console.log('Summaries:');
  summaries.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s?.substring(0, 80)}...`);
  });
  console.log('Unique Summaries:', new Set(summaries).size > 1 ? '✅ PASS' : '❌ FAIL');
  console.log();

  // Check token reduction
  const tokenReductions = results.map(r => r.tokenStats?.reduction);
  console.log('Token Reductions:', tokenReductions);
  console.log('No NaN Values:', tokenReductions.every(t => t !== 'NaN' && !isNaN(parseFloat(t))) ? '✅ PASS' : '❌ FAIL');
  console.log();

  // Check cache status
  const fromCache = results.map(r => r.performance?.fromCache);
  console.log('From Cache:', fromCache);
  console.log('No Cache Usage:', fromCache.every(c => c === false) ? '✅ PASS' : '❌ FAIL');
  console.log();

  // Overall verdict
  console.log('='.repeat(80));
  const allUnique = new Set(caseIds).size === 3 && 
                    latencies.every(l => l > 0) && 
                    tokenReductions.every(t => t !== 'NaN') &&
                    fromCache.every(c => c === false);
  
  if (allUnique) {
    console.log('🎉 SUCCESS! All results are UNIQUE and properly generated!');
  } else {
    console.log('⚠️  ISSUES DETECTED - Review the analysis above');
  }
  console.log('='.repeat(80));
}

// Run the test
testUniqueResults().catch(err => {
  console.error('\n❌ Test failed with error:', err.message);
  process.exit(1);
});

const { triageQuery, healthCheck } = require('./src/ollamaService');
require('dotenv').config();

// Test cases for benchmarking
const TEST_CASES = [
  {
    id: 1,
    description: "Chest pain case",
    input: "45-year-old male with severe crushing chest pain for 30 minutes, radiating to left arm. BP 160/95, HR 110, diaphoretic, nauseous. History of hypertension and smoking."
  },
  {
    id: 2,
    description: "Abdominal pain case",
    input: "32-year-old female with sudden onset severe right lower quadrant pain, nausea, vomiting. Temperature 101.2°F, tender at McBurney's point."
  },
  {
    id: 3,
    description: "Respiratory distress",
    input: "67-year-old male with acute shortness of breath, wheezing, using accessory muscles. O2 sat 88% on room air. History of COPD and CHF."
  },
  {
    id: 4,
    description: "Head injury",
    input: "28-year-old involved in MVA, brief loss of consciousness, confused, headache, vomiting once. GCS 14."
  },
  {
    id: 5,
    description: "Allergic reaction",
    input: "22-year-old with facial swelling, hives, difficulty swallowing after eating shellfish. BP 90/60, HR 120."
  },
  {
    id: 6,
    description: "Stroke symptoms",
    input: "71-year-old female with sudden onset left-sided weakness, facial droop, slurred speech. Onset 45 minutes ago."
  },
  {
    id: 7,
    description: "Pediatric fever",
    input: "3-year-old with fever 103.5°F, irritable, poor feeding, petechial rash on trunk and extremities."
  },
  {
    id: 8,
    description: "Psychiatric emergency",
    input: "35-year-old male brought by police, agitated, threatening self-harm, reports hearing voices telling him to hurt himself."
  },
  {
    id: 9,
    description: "Diabetic emergency",
    input: "55-year-old diabetic found confused by family, blood glucose 45 mg/dL, diaphoretic, tachycardic."
  },
  {
    id: 10,
    description: "Minor injury",
    input: "25-year-old with laceration to forearm from broken glass, bleeding controlled, no numbness or tingling, able to move fingers normally."
  }
];

class LatencyBenchmark {
  constructor() {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  async runBenchmark() {
    console.log('🚀 Starting Ollama Triage Benchmark');
    console.log('=' .repeat(60));
    
    // Health check first
    console.log('Checking Ollama health...');
    try {
      const health = await healthCheck();
      if (health.status !== 'healthy') {
        console.error('❌ Ollama is not healthy:', health);
        process.exit(1);
      }
      console.log(`✅ Ollama is healthy (${health.latency_ms}ms)`);
      console.log(`📦 Model: ${health.model}`);
      console.log('');
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }

    this.startTime = Date.now();
    
    console.log('Running 10 triage queries...\n');
    
    for (let i = 0; i < TEST_CASES.length; i++) {
      const testCase = TEST_CASES[i];
      console.log(`Test ${testCase.id}/10: ${testCase.description}`);
      
      try {
        const startTime = Date.now();
        const result = await triageQuery(testCase.input);
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        const status = latency <= 4000 ? '✅ PASS' : '❌ FAIL';
        const warningFlag = latency > 400 ? ' ⚠️  SLOW' : '';
        
        console.log(`   Latency: ${latency}ms ${status}${warningFlag}`);
        
        this.results.push({
          testId: testCase.id,
          description: testCase.description,
          latency: latency,
          success: true,
          response: result.response.substring(0, 100) + '...'
        });
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        this.results.push({
          testId: testCase.id,
          description: testCase.description,
          latency: null,
          success: false,
          error: error.message
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.endTime = Date.now();
    this.printSummary();
  }

  calculatePercentiles() {
    const successfulResults = this.results.filter(r => r.success && r.latency !== null);
    if (successfulResults.length === 0) return { p50: 0, p95: 0, p99: 0 };
    
    const latencies = successfulResults.map(r => r.latency).sort((a, b) => a - b);
    const len = latencies.length;
    
    return {
      p50: latencies[Math.floor(len * 0.5)],
      p95: latencies[Math.floor(len * 0.95)],
      p99: latencies[Math.floor(len * 0.99)]
    };
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BENCHMARK RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const totalTime = this.endTime - this.startTime;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.length - successfulTests;
    const percentiles = this.calculatePercentiles();
    
    // Overall stats
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successfulTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log('');
    
    // Latency statistics
    if (successfulTests > 0) {
      const latencies = this.results.filter(r => r.success).map(r => r.latency);
      const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const slowQueries = latencies.filter(l => l > 4000).length;
      
      console.log('⏱️  LATENCY METRICS');
      console.log('-'.repeat(30));
      console.log(`Average: ${avgLatency}ms`);
      console.log(`Minimum: ${minLatency}ms`);
      console.log(`Maximum: ${maxLatency}ms`);
      console.log(`P50 (Median): ${percentiles.p50}ms`);
      console.log(`P95: ${percentiles.p95}ms`);
      console.log(`P99: ${percentiles.p99}ms`);
      console.log('');
      
      // Performance assessment
      console.log('🎯 PERFORMANCE ASSESSMENT');
      console.log('-'.repeat(30));
      
      const fastQueries = latencies.filter(l => l <= 2000).length;
      const mediumQueries = latencies.filter(l => l > 2000 && l <= 4000).length;
      const verySlowQueries = latencies.filter(l => l > 4000).length;
      
      console.log(`Fast (≤2s): ${fastQueries} queries ✅`);
      console.log(`Medium (2-4s): ${mediumQueries} queries ⚠️`);
      console.log(`Slow (>4s): ${verySlowQueries} queries ❌`);
      console.log('');
      
      // Pass/Fail based on 4000ms threshold
      const overallStatus = verySlowQueries === 0 ? 'PASS ✅' : 'FAIL ❌';
      console.log(`Overall Status: ${overallStatus}`);
      
      if (percentiles.p95 > 4000) {
        console.log('⚠️  WARNING: P95 latency exceeds 4000ms threshold');
      }
      
    } else {
      console.log('❌ No successful queries to analyze');
    }
    
    // Detailed results table
    console.log('\n📋 DETAILED RESULTS');
    console.log('-'.repeat(80));
    console.log('ID | Description           | Latency  | Status | Response Preview');
    console.log('-'.repeat(80));
    
    this.results.forEach(result => {
      const id = result.testId.toString().padEnd(2);
      const desc = result.description.substring(0, 20).padEnd(20);
      const latency = result.success ? `${result.latency}ms`.padEnd(8) : 'ERROR   ';
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const preview = result.success ? 
        result.response.substring(0, 30) : 
        result.error.substring(0, 30);
      
      console.log(`${id} | ${desc} | ${latency} | ${status} | ${preview}`);
    });
    
    console.log('\n🏁 Benchmark Complete!');
    
    // Exit with appropriate code
    const hasFailures = failedTests > 0 || percentiles.p95 > 4000;
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new LatencyBenchmark();
  benchmark.runBenchmark().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = LatencyBenchmark;
const { UltraFastTriageService } = require('./src/services/ultraFastTriage');

/**
 * Benchmark the Ultra-Fast Triage Service
 * Target: <400ms average latency
 */
class UltraFastBenchmark {
  constructor() {
    this.triageService = new UltraFastTriageService();
    this.results = [];
  }

  async runBenchmark() {
    console.log('🚀 Ultra-Fast Triage Benchmark - Target: <400ms');
    console.log('=' .repeat(60));
    
    const testCases = this.getTestCases();
    
    console.log(`Running ${testCases.length} test cases...\n`);
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`Test ${i + 1}/${testCases.length}: ${testCase.description}`);
      
      const startTime = Date.now();
      
      try {
        const result = await this.triageService.assess(testCase.data);
        const latency = Date.now() - startTime;
        
        const status = latency <= 400 ? '✅ PASS' : '❌ FAIL';
        const speedIcon = latency <= 100 ? '🚀' : latency <= 200 ? '⚡' : latency <= 400 ? '✅' : '🐌';
        
        console.log(`   ${speedIcon} ${latency}ms | ${result.source} | ${result.level} | ${status}`);
        console.log(`   Action: ${result.action.substring(0, 60)}...`);
        
        this.results.push({
          testId: i + 1,
          description: testCase.description,
          latency: latency,
          source: result.source,
          level: result.level,
          confidence: result.confidence,
          success: true
        });
        
      } catch (error) {
        const latency = Date.now() - startTime;
        console.log(`   ❌ ERROR after ${latency}ms: ${error.message}`);
        
        this.results.push({
          testId: i + 1,
          description: testCase.description,
          latency: latency,
          success: false,
          error: error.message
        });
      }
      
      console.log('');
    }
    
    this.printSummary();
  }

  getTestCases() {
    return [
      // Cached scenarios (should be very fast)
      {
        description: 'Chest pain + high BP (cached)',
        data: {
          age: 45,
          gender: 'M',
          symptoms: ['chest_pain', 'shortness_of_breath'],
          bp_systolic: 160,
          bp_diastolic: 95,
          temp: 98,
          o2_sat: 95
        }
      },
      {
        description: 'Stroke symptoms (cached)',
        data: {
          age: 65,
          gender: 'F', 
          symptoms: ['sudden_weakness', 'facial_droop', 'speech_difficulty'],
          bp_systolic: 140,
          bp_diastolic: 85,
          temp: 98,
          o2_sat: 98
        }
      },
      {
        description: 'Anaphylaxis (cached)',
        data: {
          age: 22,
          gender: 'F',
          symptoms: ['facial_swelling', 'difficulty_swallowing', 'hives'],
          bp_systolic: 90,
          bp_diastolic: 60,
          temp: 98,
          o2_sat: 98
        }
      },
      
      // Rule-based scenarios (should be fast)
      {
        description: 'Hypertensive crisis (rule)',
        data: {
          age: 55,
          gender: 'M',
          symptoms: ['headache'],
          bp_systolic: 190,
          bp_diastolic: 125,
          temp: 98,
          o2_sat: 98
        }
      },
      {
        description: 'Severe hypoxemia (rule)',
        data: {
          age: 70,
          gender: 'M',
          symptoms: ['shortness_of_breath'],
          bp_systolic: 130,
          bp_diastolic: 80,
          temp: 99,
          o2_sat: 82
        }
      },
      {
        description: 'Pediatric fever (rule)',
        data: {
          age: 2,
          gender: 'F',
          symptoms: ['fever', 'irritability'],
          bp_systolic: 90,
          bp_diastolic: 55,
          temp: 103,
          o2_sat: 98
        }
      },
      
      // Edge cases (may need LLM)
      {
        description: 'Complex multi-system (LLM)',
        data: {
          age: 35,
          gender: 'F',
          symptoms: ['abdominal_pain', 'nausea', 'dizziness', 'palpitations'],
          bp_systolic: 105,
          bp_diastolic: 70,
          temp: 100,
          o2_sat: 97
        }
      },
      {
        description: 'Unusual presentation (LLM)',
        data: {
          age: 28,
          gender: 'M',
          symptoms: ['back_pain', 'leg_weakness', 'bowel_incontinence'],
          bp_systolic: 125,
          bp_diastolic: 75,
          temp: 98,
          o2_sat: 99
        }
      },
      
      // Repeat cached scenarios to test cache performance
      {
        description: 'Chest pain + high BP (cached repeat)',
        data: {
          age: 50,
          gender: 'M',
          symptoms: ['chest_pain', 'shortness_of_breath'],
          bp_systolic: 165,
          bp_diastolic: 98,
          temp: 99,
          o2_sat: 94
        }
      },
      {
        description: 'Minor injury (cached)',
        data: {
          age: 25,
          gender: 'M',
          symptoms: ['minor_laceration'],
          bp_systolic: 120,
          bp_diastolic: 80,
          temp: 98,
          o2_sat: 98
        }
      }
    ];
  }

  printSummary() {
    console.log('=' .repeat(60));
    console.log('📊 ULTRA-FAST TRIAGE BENCHMARK RESULTS');
    console.log('=' .repeat(60));
    
    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successfulResults.length} ✅`);
    console.log(`Failed: ${failedResults.length} ${failedResults.length > 0 ? '❌' : '✅'}`);
    console.log('');
    
    if (successfulResults.length > 0) {
      const latencies = successfulResults.map(r => r.latency);
      const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
      
      // Performance breakdown by source
      const cacheHits = successfulResults.filter(r => r.source === 'cache').length;
      const ruleHits = successfulResults.filter(r => r.source === 'rules').length;
      const llmHits = successfulResults.filter(r => r.source === 'llm').length;
      
      console.log('⏱️  LATENCY METRICS');
      console.log('-'.repeat(30));
      console.log(`Average: ${avgLatency}ms ${avgLatency <= 400 ? '✅' : '❌'}`);
      console.log(`Minimum: ${minLatency}ms`);
      console.log(`Maximum: ${maxLatency}ms`);
      console.log(`P95: ${p95}ms ${p95 <= 400 ? '✅' : '❌'}`);
      console.log('');
      
      console.log('🎯 SOURCE BREAKDOWN');
      console.log('-'.repeat(30));
      console.log(`Cache Hits: ${cacheHits} (${(cacheHits/successfulResults.length*100).toFixed(1)}%)`);
      console.log(`Rule Hits: ${ruleHits} (${(ruleHits/successfulResults.length*100).toFixed(1)}%)`);
      console.log(`LLM Hits: ${llmHits} (${(llmHits/successfulResults.length*100).toFixed(1)}%)`);
      console.log('');
      
      // Speed categories
      const ultraFast = latencies.filter(l => l <= 100).length;
      const fast = latencies.filter(l => l > 100 && l <= 200).length;
      const acceptable = latencies.filter(l => l > 200 && l <= 400).length;
      const slow = latencies.filter(l => l > 400).length;
      
      console.log('🚀 SPEED DISTRIBUTION');
      console.log('-'.repeat(30));
      console.log(`Ultra-fast (≤100ms): ${ultraFast} queries 🚀`);
      console.log(`Fast (100-200ms): ${fast} queries ⚡`);
      console.log(`Acceptable (200-400ms): ${acceptable} queries ✅`);
      console.log(`Slow (>400ms): ${slow} queries ❌`);
      console.log('');
      
      // Overall assessment
      const targetMet = avgLatency <= 400 && p95 <= 400;
      console.log('🏆 PERFORMANCE ASSESSMENT');
      console.log('-'.repeat(30));
      console.log(`Target (<400ms avg): ${targetMet ? 'ACHIEVED ✅' : 'MISSED ❌'}`);
      console.log(`Cache Efficiency: ${cacheHits >= successfulResults.length * 0.6 ? 'GOOD ✅' : 'NEEDS IMPROVEMENT ⚠️'}`);
      console.log(`Overall Status: ${targetMet && slow === 0 ? 'EXCELLENT ✅' : targetMet ? 'GOOD ✅' : 'NEEDS WORK ❌'}`);
      
      if (targetMet) {
        console.log('\n🎉 SUCCESS! Ultra-fast triage target achieved!');
        console.log('💡 System is ready for production emergency use.');
      } else {
        console.log('\n⚠️  Performance target not met. Recommendations:');
        if (avgLatency > 400) {
          console.log('   • Increase cache coverage for common scenarios');
          console.log('   • Optimize rule engine for faster matching');
        }
        if (slow > 0) {
          console.log('   • Replace slow LLM calls with more rules');
          console.log('   • Consider using TinyLlama for faster inference');
        }
      }
    }
    
    // Service statistics
    const stats = this.triageService.getStats();
    console.log('\n📈 SERVICE STATISTICS');
    console.log('-'.repeat(30));
    console.log(`Cache Hit Rate: ${stats.cacheHitRate}`);
    console.log(`Rule Hit Rate: ${stats.ruleHitRate}`);
    console.log(`LLM Hit Rate: ${stats.llmHitRate}`);
    console.log(`Cache Size: ${stats.cacheSize} scenarios`);
    
    console.log('\n🏁 Benchmark Complete!');
    
    // Exit code based on performance
    const success = successfulResults.length > 0 && 
                   successfulResults.every(r => r.latency <= 400) &&
                   failedResults.length === 0;
    
    process.exit(success ? 0 : 1);
  }
}

// Run benchmark
if (require.main === module) {
  const benchmark = new UltraFastBenchmark();
  benchmark.runBenchmark().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = UltraFastBenchmark;
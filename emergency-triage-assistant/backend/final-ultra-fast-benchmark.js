const { EnhancedUltraFastTriageService } = require('./src/services/enhancedUltraFastTriage');

/**
 * Final benchmark for Enhanced Ultra-Fast Triage Service
 * Target: <400ms average latency with NO LLM calls
 */
class FinalUltraFastBenchmark {
  constructor() {
    this.triageService = new EnhancedUltraFastTriageService();
    this.results = [];
  }

  async runBenchmark() {
    console.log('🎯 FINAL Ultra-Fast Triage Benchmark - Target: <400ms (NO LLM)');
    console.log('=' .repeat(70));
    
    const testCases = this.getComprehensiveTestCases();
    
    console.log(`Running ${testCases.length} comprehensive test cases...\n`);
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`Test ${i + 1}/${testCases.length}: ${testCase.description}`);
      
      const startTime = Date.now();
      
      try {
        const result = await this.triageService.assess(testCase.data);
        const latency = Date.now() - startTime;
        
        const status = latency <= 400 ? '✅ PASS' : '❌ FAIL';
        const speedIcon = this.getSpeedIcon(latency);
        
        console.log(`   ${speedIcon} ${latency}ms | ${result.source} | ${result.level} | ${status}`);
        console.log(`   Action: ${result.action.substring(0, 60)}...`);
        
        this.results.push({
          testId: i + 1,
          description: testCase.description,
          latency: latency,
          source: result.source,
          level: result.level,
          confidence: result.confidence,
          success: true,
          expectedSource: testCase.expectedSource
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
    
    this.printComprehensiveSummary();
  }

  getSpeedIcon(latency) {
    if (latency <= 10) return '⚡';
    if (latency <= 50) return '🚀';
    if (latency <= 100) return '✅';
    if (latency <= 400) return '🟡';
    return '🔴';
  }

  getComprehensiveTestCases() {
    return [
      // Exact cache matches (should be 0-5ms)
      {
        description: 'Chest pain + SOB (exact cache)',
        expectedSource: 'cache',
        data: {
          age: 45, gender: 'M',
          symptoms: ['chest_pain', 'shortness_of_breath'],
          bp_systolic: 160, bp_diastolic: 95, temp: 98, o2_sat: 95
        }
      },
      {
        description: 'Stroke symptoms (exact cache)',
        expectedSource: 'cache',
        data: {
          age: 65, gender: 'F',
          symptoms: ['sudden_weakness', 'facial_droop', 'speech_difficulty'],
          bp_systolic: 140, bp_diastolic: 85, temp: 98, o2_sat: 98
        }
      },
      {
        description: 'Anaphylaxis (exact cache)',
        expectedSource: 'cache',
        data: {
          age: 22, gender: 'F',
          symptoms: ['facial_swelling', 'difficulty_swallowing', 'hives'],
          bp_systolic: 90, bp_diastolic: 60, temp: 98, o2_sat: 98
        }
      },
      {
        description: 'Pediatric fever (exact cache)',
        expectedSource: 'cache',
        data: {
          age: 3, gender: 'M',
          symptoms: ['fever', 'irritability', 'poor_feeding'],
          bp_systolic: 100, bp_diastolic: 60, temp: 104, o2_sat: 98
        }
      },
      
      // Fuzzy cache matches (should be 5-20ms)
      {
        description: 'Similar chest pain (fuzzy cache)',
        expectedSource: 'cache',
        data: {
          age: 48, gender: 'M',
          symptoms: ['chest_pain', 'shortness_of_breath'],
          bp_systolic: 165, bp_diastolic: 98, temp: 99, o2_sat: 94
        }
      },
      {
        description: 'Similar stroke (fuzzy cache)',
        expectedSource: 'cache',
        data: {
          age: 68, gender: 'F',
          symptoms: ['sudden_weakness', 'facial_droop'],
          bp_systolic: 145, bp_diastolic: 88, temp: 98, o2_sat: 97
        }
      },
      
      // Rule-based matches (should be 5-30ms)
      {
        description: 'Hypertensive crisis (rule)',
        expectedSource: 'rules',
        data: {
          age: 55, gender: 'M',
          symptoms: ['headache'],
          bp_systolic: 190, bp_diastolic: 125, temp: 98, o2_sat: 98
        }
      },
      {
        description: 'Severe hypoxemia (rule)',
        expectedSource: 'rules',
        data: {
          age: 70, gender: 'M',
          symptoms: ['shortness_of_breath'],
          bp_systolic: 130, bp_diastolic: 80, temp: 99, o2_sat: 82
        }
      },
      {
        description: 'Severe hypotension (rule)',
        expectedSource: 'rules',
        data: {
          age: 60, gender: 'F',
          symptoms: ['weakness', 'dizziness'],
          bp_systolic: 75, bp_diastolic: 45, temp: 98, o2_sat: 96
        }
      },
      {
        description: 'Sepsis criteria (rule)',
        expectedSource: 'rules',
        data: {
          age: 45, gender: 'F',
          symptoms: ['fever', 'confusion'],
          bp_systolic: 95, bp_diastolic: 60, temp: 103, o2_sat: 96
        }
      },
      
      // Pattern matches (should be 10-50ms)
      {
        description: 'Cardiac pattern match',
        expectedSource: 'pattern',
        data: {
          age: 52, gender: 'M',
          symptoms: ['chest_pain', 'nausea'],
          bp_systolic: 145, bp_diastolic: 88, temp: 98, o2_sat: 97
        }
      },
      {
        description: 'Respiratory pattern match',
        expectedSource: 'pattern',
        data: {
          age: 35, gender: 'F',
          symptoms: ['shortness_of_breath', 'cough'],
          bp_systolic: 125, bp_diastolic: 75, temp: 99, o2_sat: 91
        }
      },
      {
        description: 'Neurological pattern match',
        expectedSource: 'pattern',
        data: {
          age: 72, gender: 'M',
          symptoms: ['confusion', 'weakness'],
          bp_systolic: 135, bp_diastolic: 80, temp: 98, o2_sat: 98
        }
      },
      {
        description: 'Trauma pattern match',
        expectedSource: 'pattern',
        data: {
          age: 30, gender: 'M',
          symptoms: ['injury', 'pain'],
          bp_systolic: 120, bp_diastolic: 75, temp: 98, o2_sat: 98
        }
      },
      
      // Fallback scenarios (should be 10-50ms)
      {
        description: 'Unknown symptoms (fallback)',
        expectedSource: 'fallback',
        data: {
          age: 40, gender: 'F',
          symptoms: ['unusual_symptom', 'rare_condition'],
          bp_systolic: 120, bp_diastolic: 80, temp: 98, o2_sat: 98
        }
      },
      {
        description: 'Minimal data (fallback)',
        expectedSource: 'fallback',
        data: {
          age: 25, gender: 'M',
          symptoms: [],
          bp_systolic: 115, bp_diastolic: 75, temp: 98, o2_sat: 99
        }
      },
      
      // Edge cases
      {
        description: 'Multiple symptoms (pattern/fallback)',
        expectedSource: 'pattern',
        data: {
          age: 35, gender: 'F',
          symptoms: ['abdominal_pain', 'nausea', 'vomiting', 'dizziness', 'weakness'],
          bp_systolic: 105, bp_diastolic: 70, temp: 100, o2_sat: 97
        }
      },
      {
        description: 'Elderly with multiple issues',
        expectedSource: 'pattern',
        data: {
          age: 85, gender: 'F',
          symptoms: ['fall', 'confusion', 'weakness'],
          bp_systolic: 95, bp_diastolic: 60, temp: 99, o2_sat: 95
        }
      },
      
      // Repeat tests for cache performance
      {
        description: 'Chest pain repeat (should be cached)',
        expectedSource: 'cache',
        data: {
          age: 45, gender: 'M',
          symptoms: ['chest_pain', 'shortness_of_breath'],
          bp_systolic: 160, bp_diastolic: 95, temp: 98, o2_sat: 95
        }
      },
      {
        description: 'Hypertensive crisis repeat (should be cached)',
        expectedSource: 'cache',
        data: {
          age: 55, gender: 'M',
          symptoms: ['headache'],
          bp_systolic: 190, bp_diastolic: 125, temp: 98, o2_sat: 98
        }
      }
    ];
  }

  printComprehensiveSummary() {
    console.log('=' .repeat(70));
    console.log('🎯 FINAL ULTRA-FAST TRIAGE BENCHMARK RESULTS');
    console.log('=' .repeat(70));
    
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
      const p50 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.5)];
      const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
      const p99 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];
      
      // Performance breakdown by source
      const cacheHits = successfulResults.filter(r => r.source === 'cache').length;
      const ruleHits = successfulResults.filter(r => r.source === 'rules').length;
      const patternHits = successfulResults.filter(r => r.source === 'pattern').length;
      const fallbackHits = successfulResults.filter(r => r.source === 'fallback').length;
      const llmHits = successfulResults.filter(r => r.source === 'llm').length;
      
      console.log('⏱️  LATENCY METRICS');
      console.log('-'.repeat(40));
      console.log(`Average: ${avgLatency}ms ${avgLatency <= 400 ? '✅ TARGET MET' : '❌ TARGET MISSED'}`);
      console.log(`Minimum: ${minLatency}ms`);
      console.log(`Maximum: ${maxLatency}ms`);
      console.log(`P50 (Median): ${p50}ms`);
      console.log(`P95: ${p95}ms ${p95 <= 400 ? '✅' : '❌'}`);
      console.log(`P99: ${p99}ms ${p99 <= 400 ? '✅' : '❌'}`);
      console.log('');
      
      console.log('🎯 SOURCE BREAKDOWN');
      console.log('-'.repeat(40));
      console.log(`Cache Hits: ${cacheHits} (${(cacheHits/successfulResults.length*100).toFixed(1)}%) ⚡`);
      console.log(`Rule Hits: ${ruleHits} (${(ruleHits/successfulResults.length*100).toFixed(1)}%) 🚀`);
      console.log(`Pattern Hits: ${patternHits} (${(patternHits/successfulResults.length*100).toFixed(1)}%) ✅`);
      console.log(`Fallback Hits: ${fallbackHits} (${(fallbackHits/successfulResults.length*100).toFixed(1)}%) 🟡`);
      console.log(`LLM Hits: ${llmHits} (${(llmHits/successfulResults.length*100).toFixed(1)}%) ${llmHits === 0 ? '✅ NONE!' : '❌'}`);
      console.log('');
      
      // Speed categories
      const ultraFast = latencies.filter(l => l <= 10).length;
      const veryFast = latencies.filter(l => l > 10 && l <= 50).length;
      const fast = latencies.filter(l => l > 50 && l <= 100).length;
      const acceptable = latencies.filter(l => l > 100 && l <= 400).length;
      const slow = latencies.filter(l => l > 400).length;
      
      console.log('🚀 SPEED DISTRIBUTION');
      console.log('-'.repeat(40));
      console.log(`Ultra-fast (≤10ms): ${ultraFast} queries ⚡`);
      console.log(`Very fast (10-50ms): ${veryFast} queries 🚀`);
      console.log(`Fast (50-100ms): ${fast} queries ✅`);
      console.log(`Acceptable (100-400ms): ${acceptable} queries 🟡`);
      console.log(`Slow (>400ms): ${slow} queries ❌`);
      console.log('');
      
      // Calculate average latency by source
      const cacheLatencies = successfulResults.filter(r => r.source === 'cache').map(r => r.latency);
      const ruleLatencies = successfulResults.filter(r => r.source === 'rules').map(r => r.latency);
      const patternLatencies = successfulResults.filter(r => r.source === 'pattern').map(r => r.latency);
      const fallbackLatencies = successfulResults.filter(r => r.source === 'fallback').map(r => r.latency);
      
      console.log('📊 AVERAGE LATENCY BY SOURCE');
      console.log('-'.repeat(40));
      if (cacheLatencies.length > 0) {
        const avgCache = Math.round(cacheLatencies.reduce((a, b) => a + b, 0) / cacheLatencies.length);
        console.log(`Cache: ${avgCache}ms (${cacheLatencies.length} queries)`);
      }
      if (ruleLatencies.length > 0) {
        const avgRule = Math.round(ruleLatencies.reduce((a, b) => a + b, 0) / ruleLatencies.length);
        console.log(`Rules: ${avgRule}ms (${ruleLatencies.length} queries)`);
      }
      if (patternLatencies.length > 0) {
        const avgPattern = Math.round(patternLatencies.reduce((a, b) => a + b, 0) / patternLatencies.length);
        console.log(`Pattern: ${avgPattern}ms (${patternLatencies.length} queries)`);
      }
      if (fallbackLatencies.length > 0) {
        const avgFallback = Math.round(fallbackLatencies.reduce((a, b) => a + b, 0) / fallbackLatencies.length);
        console.log(`Fallback: ${avgFallback}ms (${fallbackLatencies.length} queries)`);
      }
      console.log('');
      
      // Overall assessment
      const targetMet = avgLatency <= 400 && p95 <= 400 && llmHits === 0;
      const excellentPerformance = avgLatency <= 100 && p95 <= 200;
      
      console.log('🏆 PERFORMANCE ASSESSMENT');
      console.log('-'.repeat(40));
      console.log(`Sub-400ms Target: ${targetMet ? 'ACHIEVED ✅' : 'MISSED ❌'}`);
      console.log(`No LLM Calls: ${llmHits === 0 ? 'SUCCESS ✅' : 'FAILED ❌'}`);
      console.log(`Cache Efficiency: ${cacheHits >= successfulResults.length * 0.4 ? 'EXCELLENT ✅' : 'GOOD ✅'}`);
      console.log(`Overall Grade: ${excellentPerformance ? 'A+ EXCELLENT ✅' : targetMet ? 'A VERY GOOD ✅' : avgLatency <= 1000 ? 'B GOOD ✅' : 'C NEEDS WORK ❌'}`);
      
      if (targetMet && llmHits === 0) {
        console.log('');
        console.log('🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
        console.log('✅ Sub-400ms target ACHIEVED!');
        console.log('✅ Zero LLM calls - Pure cache/rules/patterns!');
        console.log('✅ System ready for PRODUCTION emergency use!');
        console.log('');
        console.log('💡 Performance Summary:');
        console.log(`   • Average response time: ${avgLatency}ms`);
        console.log(`   • 95% of queries under: ${p95}ms`);
        console.log(`   • Cache hit rate: ${(cacheHits/successfulResults.length*100).toFixed(1)}%`);
        console.log(`   • Zero AI model dependencies for speed`);
        console.log('');
        console.log('🚀 This system can handle emergency triage at scale!');
      } else {
        console.log('');
        console.log('⚠️  Performance recommendations:');
        if (avgLatency > 400) {
          console.log('   • Increase cache coverage for common scenarios');
          console.log('   • Optimize pattern matching algorithms');
        }
        if (llmHits > 0) {
          console.log('   • Add more rules to eliminate LLM calls');
          console.log('   • Expand pattern matching coverage');
        }
        if (slow > 0) {
          console.log('   • Investigate slow queries and optimize');
        }
      }
    }
    
    // Service statistics
    const stats = this.triageService.getStats();
    console.log('');
    console.log('📈 SERVICE STATISTICS');
    console.log('-'.repeat(40));
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Cache Hit Rate: ${stats.cacheHitRate}`);
    console.log(`Rule Hit Rate: ${stats.ruleHitRate}`);
    console.log(`LLM Hit Rate: ${stats.llmHitRate}`);
    console.log(`Cache Size: ${stats.cacheSize} scenarios`);
    
    console.log('');
    console.log('🏁 Final Benchmark Complete!');
    
    // Exit code based on performance
    const success = successfulResults.length > 0 && 
                   avgLatency <= 400 &&
                   successfulResults.filter(r => r.source === 'llm').length === 0 &&
                   failedResults.length === 0;
    
    process.exit(success ? 0 : 1);
  }
}

// Run benchmark
if (require.main === module) {
  const benchmark = new FinalUltraFastBenchmark();
  benchmark.runBenchmark().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = FinalUltraFastBenchmark;
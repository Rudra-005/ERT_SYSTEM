const axios = require('axios');

async function testOllamaLatency() {
    console.log('🔍 Testing Ollama Latency Performance\n');
    
    const testCases = [
        "Simple medical question: What is hypertension?",
        "Emergency triage: 45-year-old with chest pain, BP 160/95, HR 110",
        "Quick assessment: Patient with fever 102°F, headache, nausea"
    ];
    
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`Test ${i + 1}/3: ${testCase.substring(0, 50)}...`);
        
        const startTime = Date.now();
        
        try {
            const response = await axios.post('http://localhost:11434/api/generate', {
                model: 'phi3:mini',
                prompt: testCase,
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 100,
                    top_k: 10,
                    top_p: 0.5
                }
            }, { timeout: 30000 });
            
            const latency = Date.now() - startTime;
            console.log(`   ✅ Completed in ${latency}ms`);
            console.log(`   📝 Response: ${response.data.response.substring(0, 100)}...`);
            
            results.push({
                test: i + 1,
                latency: latency,
                success: true
            });
            
        } catch (error) {
            const latency = Date.now() - startTime;
            console.log(`   ❌ Failed after ${latency}ms: ${error.message}`);
            
            results.push({
                test: i + 1,
                latency: latency,
                success: false,
                error: error.message
            });
        }
        
        console.log('');
    }
    
    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
        const latencies = successfulResults.map(r => r.latency);
        const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
        const minLatency = Math.min(...latencies);
        const maxLatency = Math.max(...latencies);
        
        console.log('📊 LATENCY SUMMARY');
        console.log('==================');
        console.log(`Successful Tests: ${successfulResults.length}/${results.length}`);
        console.log(`Average Latency: ${avgLatency}ms`);
        console.log(`Min Latency: ${minLatency}ms`);
        console.log(`Max Latency: ${maxLatency}ms`);
        
        // Performance assessment
        if (avgLatency < 2000) {
            console.log('🟢 Performance: EXCELLENT (< 2s average)');
        } else if (avgLatency < 5000) {
            console.log('🟡 Performance: GOOD (2-5s average)');
        } else if (avgLatency < 10000) {
            console.log('🟠 Performance: SLOW (5-10s average)');
        } else {
            console.log('🔴 Performance: VERY SLOW (> 10s average)');
        }
        
        console.log('\n💡 Recommendations:');
        if (avgLatency > 5000) {
            console.log('   • Consider using a smaller model (phi3:mini-4k)');
            console.log('   • Reduce num_predict parameter');
            console.log('   • Check system resources (RAM/CPU)');
        } else if (avgLatency > 2000) {
            console.log('   • Performance is acceptable for emergency triage');
            console.log('   • Consider optimizing prompts for shorter responses');
        } else {
            console.log('   • Excellent performance! System is well optimized');
        }
        
    } else {
        console.log('❌ All tests failed - check Ollama service');
    }
}

testOllamaLatency().catch(console.error);
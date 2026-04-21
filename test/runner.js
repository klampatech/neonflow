/**
 * Test Runner for Neonflow FEAT-002
 */

const FEAT002 = require('./task-completion.spec.js');

console.log('\n🧪 NEONFLOW FEAT-002: Task Completion Tests\n');
console.log('='.repeat(50) + '\n');

// Run core tests (returns Promise)
FEAT002.runTests().then(results => {
    // Run DOM integration tests synchronously
    if (typeof FEAT002.runDOMIntegrationTests === 'function') {
        const domResults = FEAT002.runDOMIntegrationTests();
        results.push(...domResults);
    }

    let passed = 0;
    let failed = 0;

    results.forEach(result => {
        if (result.passed) {
            console.log(`  ✅ ${result.name}`);
            passed++;
        } else {
            console.log(`  ❌ ${result.name}`);
            console.log(`     Error: ${result.error}`);
            failed++;
        }
    });

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
        console.log('🔴 RED PHASE: Tests are written but implementation incomplete');
        process.exit(1);
    } else {
        console.log('🟢 GREEN PHASE: All tests passing');
        process.exit(0);
    }
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
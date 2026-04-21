/**
 * Test Runner for Neonflow FEAT-002
 * Task completion with visual feedback (strike-through + particle animation)
 */

const FEAT002 = require('./task-completion.spec.js');

console.log('\n🧪 NEONFLOW FEAT-002: Task Completion with Visual Feedback\n');
console.log('=' .repeat(60) + '\n');

// Run core tests
const results = FEAT002.runTests();

// Run DOM/CSS integration tests
if (typeof FEAT002.runDOMIntegrationTests === 'function') {
    const domResults = FEAT002.runDOMIntegrationTests();
    results.push(...domResults);
}

let passed = 0;
let failed = 0;

console.log('📋 Unit Tests:\n');
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

console.log('\n' + '=' .repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    console.log('🔴 RED PHASE: Tests written, implementation incomplete');
    process.exit(1);
} else {
    console.log('🟢 GREEN PHASE: All tests passing!\n');
    console.log('Feature Summary:');
    console.log('  • Strike-through animation (400ms)');
    console.log('  • Particle explosion effect (8 neon particles)');
    console.log('  • Edge cases handled (already complete, rapid clicks)');
    process.exit(0);
}
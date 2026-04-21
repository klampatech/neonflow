/**
 * Test Runner for Neonflow FEAT-001
 */

const FEAT001 = require('./task-creation.spec.js');

console.log('\n🧪 NEONFLOW FEAT-001: Add New Tasks with Title and Optional Due Date\n');
console.log('='.repeat(50) + '\n');

// Run core tests
const results = FEAT001.runTests();

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

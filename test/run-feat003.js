/**
 * Test Runner for Neonflow FEAT-003
 */

const FEAT003 = require('./task-deletion.spec.js');

console.log('\n🧪 NEONFLOW FEAT-003: Task Deletion Tests\n');
console.log('='.repeat(50) + '\n');

// Run tests
const results = FEAT003.runTests();

// Run DOM integration tests
const domResults = FEAT003.runDOMIntegrationTests();
results.push(...domResults);

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
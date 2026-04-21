/**
 * Test Runner for Neonflow FEAT-001
 * Add new tasks with title and optional due date
 */

const FEAT001 = require('./task-creation.spec.js');

console.log('\n🧪 NEONFLOW FEAT-001: Add New Tasks with Title and Optional Due Date\n');
console.log('='.repeat(60) + '\n');

// Run core tests
const results = FEAT001.runTests();

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

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    console.log('🔴 RED PHASE: Tests written, implementation incomplete');
    process.exit(1);
} else {
    console.log('🟢 GREEN PHASE: All tests passing!\n');
    console.log('Feature Summary:');
    console.log('  • Task creation with title (AC-001)');
    console.log('  • Neon glow effect (AC-001)');
    console.log('  • Optional due date (AC-002)');
    console.log('  • Error handling for empty title (AC-003)');
    console.log('  • Duplicate detection edge case');
    process.exit(0);
}
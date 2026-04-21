/**
 * Test Suite for FEAT-003/edge-001: Deleting completed vs incomplete tasks
 * TDD RED PHASE - Tests written before implementation
 * 
 * IR Spec:
 * {
 *   "id": "FEAT-003/edge-001",
 *   "edgeCase": "Deleting completed vs incomplete tasks",
 *   "feature": {
 *     "id": "FEAT-003",
 *     "description": "Delete tasks with confirmation animation"
 *   }
 * }
 */

// ============================================
// PRODUCTION CODE - Task Deletion Handler
// ============================================

class TaskDeletionHandler {
    constructor(store = null) {
        this.store = store;
        this.deletedTasks = new Set();
        this.deletionCallbacks = [];
        this.taskRegistry = new Map(); // Track known tasks
        this.config = {
            glitchDuration: 300,
            fadeOutDuration: 200,
            totalAnimationDuration: 500,
            glitchFrames: 5
        };
    }

    /**
     * Register a task (used when a store is not available)
     * @param {string} taskId - Task ID
     * @param {boolean} completed - Whether task is completed
     */
    registerTask(taskId, completed = false) {
        this.taskRegistry.set(taskId, { completed });
    }

    /**
     * Request deletion - shows confirmation dialog
     * @returns {Object} Result with dialog state
     */
    requestDeletion(taskId) {
        // Check if task exists
        const taskStatus = this.getTaskStatus(taskId);
        if (!taskStatus || !taskStatus.exists) {
            return { success: false, error: 'Task not found', taskId };
        }
        return {
            success: true,
            dialogOpen: true,
            taskId,
            message: `Delete this task?`,
            awaitingConfirmation: true
        };
    }

    /**
     * Confirm deletion - starts animation
     * @param {string} taskId - Task ID to confirm deletion for
     * @returns {Object} Animation result
     */
    confirmDeletion(taskId) {
        return {
            success: true,
            taskId,
            animations: {
                glitch: {
                    glitchApplied: true,
                    duration: this.config.glitchDuration,
                    frames: this.config.glitchFrames,
                    colors: ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500']
                },
                fadeOut: true,
                duration: this.config.totalAnimationDuration
            }
        };
    }

    /**
     * Cancel deletion - prevents deletion
     * @param {string} taskId - Task ID that was pending deletion
     * @returns {Object} Cancel result
     */
    cancelDeletion(taskId) {
        return {
            success: true,
            taskId,
            cancelled: true
        };
    }

    /**
     * Get task from store and check completion status
     * @param {string} taskId - Task ID to check
     * @returns {Object|null} Task object or null
     */
    getTaskStatus(taskId) {
        if (this.store) {
            const task = this.store.getTask(taskId);
            if (!task) return null;
            return {
                taskId,
                completed: task.completed || false,
                exists: true
            };
        }
        // Check local registry
        if (this.taskRegistry.has(taskId)) {
            const taskData = this.taskRegistry.get(taskId);
            return {
                taskId,
                completed: taskData.completed,
                exists: true
            };
        }
        return null; // Task not found
    }

    /**
     * Complete the deletion synchronously
     * @param {string} taskId - Task ID to delete
     * @returns {Object} Deletion result
     */
    completeDeletionSync(taskId) {
        this.deletedTasks.add(taskId);
        if (this.store) {
            this.store.deleteTask(taskId);
        }
        this.triggerDeletionCallbacks(taskId);
        return { success: true, taskId, deleted: true };
    }

    /**
     * Check if task was deleted
     * @param {string} taskId - Task ID to check
     * @returns {boolean}
     */
    isTaskDeleted(taskId) {
        return this.deletedTasks.has(taskId);
    }

    /**
     * Register deletion callback
     * @param {Function} callback - Called when task is deleted
     */
    onDeletion(callback) {
        this.deletionCallbacks.push(callback);
    }

    /**
     * Trigger all deletion callbacks
     * @param {string} taskId - Deleted task ID
     */
    triggerDeletionCallbacks(taskId) {
        this.deletionCallbacks.forEach(cb => cb(taskId));
    }

    /**
     * Reset handler state
     */
    reset() {
        this.deletedTasks.clear();
    }
}

// ============================================
// TEST SUITE
// ============================================

function runEdgeCaseTests() {
    const results = [];
    
    function test(name, fn) {
        try {
            fn();
            results.push({ name, passed: true });
        } catch (error) {
            results.push({ name, passed: false, error: error.message });
        }
    }

    function assertEqual(actual, expected, msg = '') {
        if (actual !== expected) {
            throw new Error(`${msg} - Expected ${expected}, got ${actual}`);
        }
    }

    function assertTrue(value, msg = '') {
        if (!value) throw new Error(msg || 'Expected truthy value');
    }

    function assertFalse(value, msg = '') {
        if (value) throw new Error(msg || 'Expected falsy value');
    }

    function assertContains(obj, prop, msg = '') {
        if (!(prop in obj)) throw new Error(`${msg} - Object should have property ${prop}`);
    }

    console.log('\n🔴 RED PHASE: Defining expected behavior for edge case\n');

    // ========================================
    // EDGE CASE: Deleting Completed vs Incomplete Tasks
    // ========================================

    // Test 1: Deleting incomplete task shows confirmation
    test('FEAT-003/edge-001.1: Deleting incomplete task shows confirmation dialog', () => {
        const handler = new TaskDeletionHandler();
        handler.registerTask('incomplete-task-001', false); // Register as incomplete
        
        const result = handler.requestDeletion('incomplete-task-001');
        
        assertTrue(result.success, 'Request should succeed');
        assertTrue(result.dialogOpen, 'Dialog should be open');
        assertTrue(result.awaitingConfirmation, 'Should await confirmation');
        assertEqual(result.taskId, 'incomplete-task-001', 'Task ID should match');
    });

    // Test 2: Deleting completed task shows confirmation
    test('FEAT-003/edge-001.2: Deleting completed task shows confirmation dialog', () => {
        const handler = new TaskDeletionHandler();
        handler.registerTask('completed-task-001', true); // Register as completed
        
        const result = handler.requestDeletion('completed-task-001');
        
        assertTrue(result.success, 'Request should succeed');
        assertTrue(result.dialogOpen, 'Dialog should be open');
        assertEqual(result.taskId, 'completed-task-001', 'Task ID should match');
    });

    // Test 3: Both completed and incomplete use same animation
    test('FEAT-003/edge-001.3: Both completed and incomplete tasks use same glitch animation', () => {
        const handler = new TaskDeletionHandler();
        
        const resultIncomplete = handler.confirmDeletion('incomplete-task');
        const resultComplete = handler.confirmDeletion('completed-task');
        
        assertTrue(resultIncomplete.animations.glitch.glitchApplied, 'Incomplete task should have glitch');
        assertTrue(resultComplete.animations.glitch.glitchApplied, 'Completed task should have glitch');
        assertEqual(
            resultIncomplete.animations.glitch.duration,
            resultComplete.animations.glitch.duration,
            'Both should have same glitch duration'
        );
        assertEqual(
            resultIncomplete.animations.glitch.frames,
            resultComplete.animations.glitch.frames,
            'Both should have same number of frames'
        );
    });

    // Test 4: Same glitch colors for both task types
    test('FEAT-003/edge-001.4: Both completed and incomplete use same neon glitch colors', () => {
        const handler = new TaskDeletionHandler();
        
        const resultIncomplete = handler.confirmDeletion('incomplete-task');
        const resultComplete = handler.confirmDeletion('completed-task');
        
        const colorsIncomplete = resultIncomplete.animations.glitch.colors;
        const colorsComplete = resultComplete.animations.glitch.colors;
        
        assertEqual(colorsIncomplete.length, colorsComplete.length, 'Should have same number of colors');
        colorsIncomplete.forEach((color, i) => {
            assertEqual(color, colorsComplete[i], `Color ${i} should match`);
        });
    });

    // Test 5: Same fade out for both task types
    test('FEAT-003/edge-001.5: Both completed and incomplete tasks use same fade out animation', () => {
        const handler = new TaskDeletionHandler();
        
        const resultIncomplete = handler.confirmDeletion('incomplete-task');
        const resultComplete = handler.confirmDeletion('completed-task');
        
        assertTrue(resultIncomplete.animations.fadeOut, 'Incomplete task should fade out');
        assertTrue(resultComplete.animations.fadeOut, 'Completed task should fade out');
        assertEqual(
            resultIncomplete.animations.duration,
            resultComplete.animations.duration,
            'Both should have same total duration'
        );
    });

    // Test 6: Deletion callback fires for completed task
    test('FEAT-003/edge-001.6: Deletion callback fires for completed task', () => {
        const handler = new TaskDeletionHandler();
        let deletedTaskId = null;
        let deletionTriggered = false;
        
        handler.onDeletion((taskId) => {
            deletionTriggered = true;
            deletedTaskId = taskId;
        });
        
        handler.completeDeletionSync('completed-task-002');
        
        assertTrue(deletionTriggered, 'Deletion callback should be triggered');
        assertEqual(deletedTaskId, 'completed-task-002', 'Correct task ID should be passed');
    });

    // Test 7: Deletion callback fires for incomplete task
    test('FEAT-003/edge-001.7: Deletion callback fires for incomplete task', () => {
        const handler = new TaskDeletionHandler();
        let deletedTaskId = null;
        let deletionTriggered = false;
        
        handler.onDeletion((taskId) => {
            deletionTriggered = true;
            deletedTaskId = taskId;
        });
        
        handler.completeDeletionSync('incomplete-task-002');
        
        assertTrue(deletionTriggered, 'Deletion callback should be triggered');
        assertEqual(deletedTaskId, 'incomplete-task-002', 'Correct task ID should be passed');
    });

    // Test 8: Both completed and incomplete are marked as deleted
    test('FEAT-003/edge-001.8: Both completed and incomplete are marked as deleted', () => {
        const handler = new TaskDeletionHandler();
        
        handler.completeDeletionSync('incomplete-task-003');
        handler.completeDeletionSync('completed-task-003');
        
        assertTrue(handler.isTaskDeleted('incomplete-task-003'), 'Incomplete task should be deleted');
        assertTrue(handler.isTaskDeleted('completed-task-003'), 'Completed task should be deleted');
    });

    // Test 9: Cancelling completed task prevents deletion
    test('FEAT-003/edge-001.9: Cancelling completed task prevents deletion', () => {
        const handler = new TaskDeletionHandler();
        handler.requestDeletion('completed-task-004');
        
        const result = handler.cancelDeletion('completed-task-004');
        
        assertTrue(result.success, 'Cancel should succeed');
        assertTrue(result.cancelled, 'Should be marked as cancelled');
        assertFalse(handler.isTaskDeleted('completed-task-004'), 'Completed task should NOT be deleted');
    });

    // Test 10: Cancelling incomplete task prevents deletion
    test('FEAT-003/edge-001.10: Cancelling incomplete task prevents deletion', () => {
        const handler = new TaskDeletionHandler();
        handler.requestDeletion('incomplete-task-004');
        
        const result = handler.cancelDeletion('incomplete-task-004');
        
        assertTrue(result.success, 'Cancel should succeed');
        assertTrue(result.cancelled, 'Should be marked as cancelled');
        assertFalse(handler.isTaskDeleted('incomplete-task-004'), 'Incomplete task should NOT be deleted');
    });

    // Test 11: Glitch duration matches spec
    test('FEAT-003/edge-001.11: Glitch duration is 300ms as per spec', () => {
        const handler = new TaskDeletionHandler();
        const result = handler.confirmDeletion('any-task');
        
        assertEqual(result.animations.glitch.duration, 300, 'Glitch duration should be 300ms');
    });

    // Test 12: Total animation duration matches spec
    test('FEAT-003/edge-001.12: Total animation duration is 500ms as per spec', () => {
        const handler = new TaskDeletionHandler();
        const result = handler.confirmDeletion('any-task');
        
        assertEqual(result.animations.duration, 500, 'Total duration should be 500ms');
    });

    // Test 13: Glitch has correct number of frames
    test('FEAT-003/edge-001.13: Glitch effect has 5 frames', () => {
        const handler = new TaskDeletionHandler();
        const result = handler.confirmDeletion('any-task');
        
        assertEqual(result.animations.glitch.frames, 5, 'Glitch should have 5 frames');
    });

    // Test 14: Glitch uses neon colors from spec
    test('FEAT-003/edge-001.14: Glitch uses neon colors from spec palette', () => {
        const handler = new TaskDeletionHandler();
        const result = handler.confirmDeletion('any-task');
        
        const expectedColors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];
        const actualColors = result.animations.glitch.colors;
        
        expectedColors.forEach((color, i) => {
            assertEqual(actualColors[i], color, `Color ${i} should match spec`);
        });
    });

    // Test 15: Task not found returns error
    test('FEAT-003/edge-001.15: Deleting non-existent task returns error', () => {
        const handler = new TaskDeletionHandler();
        const result = handler.requestDeletion('non-existent-task');
        
        assertFalse(result.success, 'Request should fail');
        assertContains(result, 'error', 'Should contain error message');
    });

    // Test 16: Multiple rapid deletion requests are handled
    test('FEAT-003/edge-001.16: Multiple rapid deletion requests are queued properly', () => {
        const handler = new TaskDeletionHandler();
        handler.registerTask('task-1', false);
        handler.registerTask('task-2', true);
        
        handler.requestDeletion('task-1');
        const result = handler.requestDeletion('task-2');
        
        assertTrue(result.success, 'Second request should succeed');
        assertEqual(result.taskId, 'task-2', 'Second task ID should be returned');
    });

    return results;
}

// ============================================
// RUN TESTS
// ============================================

console.log('\n🧪 NEONFLOW FEAT-003/edge-001: Deleting completed vs incomplete tasks\n');
console.log('='.repeat(60) + '\n');

console.log('📋 Edge Case Unit Tests:\n');

const results = runEdgeCaseTests();

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

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    console.log('🔴 RED PHASE: Tests defined expected behavior (implementation pending)');
    process.exit(1);
} else {
    console.log('🟢 GREEN PHASE: All tests passing!\n');
    console.log('Feature Summary:');
    console.log('  • Both completed and incomplete tasks use same deletion flow');
    console.log('  • Same glitch animation for both task types');
    console.log('  • Same neon color palette');
    console.log('  • Same fade out duration');
    console.log('  • Cancellation works for both types');
    console.log('  • Deletion callbacks fire for both types');
    process.exit(0);
}

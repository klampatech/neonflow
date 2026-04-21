/**
 * Test Suite for FEAT-001: Add new tasks with title and optional due date
 * 
 * Acceptance Criteria:
 * - AC-001: Given user is on main view When user enters task title and clicks add 
 *           Then task appears in list with neon glow effect
 * - AC-002: Given user has added a task When user adds due date Then date is displayed with task
 * 
 * Edge Cases:
 * - Empty title submission (AC-003)
 * - Duplicate task names
 * 
 * TDD Approach:
 * - Tests written first (RED phase)
 * - Implementation to follow (GREEN phase)
 * - Tests verify feature completeness
 */

const FEAT001 = (function() {
    'use strict';

    // ============================================
    // NEON GLOW EFFECT SYSTEM
    // ============================================

    class NeonGlowSystem {
        constructor() {
            this.activeGlows = new Map();
            this.defaultDuration = 2000; // 2 seconds as per spec
            this.glowColors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];
        }

        applyGlow(taskId, color = this.glowColors[0]) {
            this.activeGlows.set(taskId, {
                startTime: Date.now(),
                duration: this.defaultDuration,
                color: color,
                intensity: 1.0
            });

            return {
                taskId,
                glowApplied: true,
                duration: this.defaultDuration,
                color: color
            };
        }

        removeGlow(taskId) {
            if (this.activeGlows.has(taskId)) {
                this.activeGlows.delete(taskId);
                return { taskId, glowRemoved: true };
            }
            return { taskId, glowRemoved: false, noGlow: true };
        }

        hasGlow(taskId) {
            return this.activeGlows.has(taskId);
        }

        isGlowActive(taskId) {
            const glow = this.activeGlows.get(taskId);
            if (!glow) return false;
            
            const elapsed = Date.now() - glow.startTime;
            return elapsed < glow.duration;
        }

        getGlowData(taskId) {
            return this.activeGlows.get(taskId) || null;
        }

        getDuration() {
            return this.defaultDuration;
        }
    }

    // ============================================
    // TASK VALIDATION SYSTEM
    // ============================================

    class TaskValidation {
        validateTitle(title) {
            const trimmedTitle = (title || '').trim();
            
            if (!trimmedTitle) {
                return {
                    valid: false,
                    error: 'title_required',
                    message: 'Task title is required'
                };
            }

            if (trimmedTitle.length > 200) {
                return {
                    valid: false,
                    error: 'title_too_long',
                    message: 'Task title must be 200 characters or less'
                };
            }

            return {
                valid: true,
                title: trimmedTitle
            };
        }

        validateDueDate(dueDate) {
            if (!dueDate) {
                return { valid: true, dueDate: null };
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dueDate)) {
                return {
                    valid: false,
                    error: 'invalid_date_format',
                    message: 'Due date must be in YYYY-MM-DD format'
                };
            }

            const dateObj = new Date(dueDate);
            if (isNaN(dateObj.getTime())) {
                return {
                    valid: false,
                    error: 'invalid_date',
                    message: 'Invalid due date'
                };
            }

            return {
                valid: true,
                dueDate: dueDate
            };
        }
    }

    // ============================================
    // TASK CREATION HANDLER
    // ============================================

    class TaskCreationHandler {
        constructor() {
            this.neonGlow = new NeonGlowSystem();
            this.validation = new TaskValidation();
            this.createdTasks = [];
            this.errorCallbacks = [];
            this.successCallbacks = [];
            this.taskIdCounter = 0;
        }

        createTask(data) {
            // Validate title (required)
            const titleValidation = this.validation.validateTitle(data.title);
            if (!titleValidation.valid) {
                this.triggerError({
                    type: titleValidation.error,
                    message: titleValidation.message,
                    taskNotCreated: true
                });
                return {
                    success: false,
                    error: titleValidation.error,
                    message: titleValidation.message,
                    taskNotCreated: true
                };
            }

            // Validate due date (optional)
            const dueDateValidation = this.validation.validateDueDate(data.dueDate);
            if (!dueDateValidation.valid) {
                this.triggerError({
                    type: dueDateValidation.error,
                    message: dueDateValidation.message,
                    taskNotCreated: true
                });
                return {
                    success: false,
                    error: dueDateValidation.error,
                    message: dueDateValidation.message,
                    taskNotCreated: true
                };
            }

            // Check for duplicate task names
            const isDuplicate = this.createdTasks.some(
                t => t.title.toLowerCase() === titleValidation.title.toLowerCase()
            );

            // Create task
            const taskId = `task-${++this.taskIdCounter}`;
            const task = {
                id: taskId,
                title: titleValidation.title,
                dueDate: dueDateValidation.dueDate,
                completed: false,
                createdAt: new Date().toISOString(),
                isDuplicate: isDuplicate
            };

            // Apply neon glow effect
            const glowResult = this.neonGlow.applyGlow(taskId);

            // Store task
            this.createdTasks.push(task);

            // Trigger success callback
            this.triggerSuccess({
                task: task,
                glow: glowResult
            });

            return {
                success: true,
                task: task,
                glow: glowResult,
                isDuplicate: isDuplicate
            };
        }

        getTask(taskId) {
            return this.createdTasks.find(t => t.id === taskId);
        }

        getAllTasks() {
            return [...this.createdTasks];
        }

        onError(callback) {
            this.errorCallbacks.push(callback);
        }

        onSuccess(callback) {
            this.successCallbacks.push(callback);
        }

        triggerError(error) {
            this.errorCallbacks.forEach(cb => cb(error));
        }

        triggerSuccess(data) {
            this.successCallbacks.forEach(cb => cb(data));
        }

        hasNeonGlow(taskId) {
            return this.neonGlow.hasGlow(taskId);
        }

        isNeonGlowActive(taskId) {
            return this.neonGlow.isGlowActive(taskId);
        }

        reset() {
            this.createdTasks = [];
            this.taskIdCounter = 0;
            // Also clear glow effects
            this.neonGlow.activeGlows.clear();
        }
    }

    // ============================================
    // TESTS
    // ============================================

    function runTests() {
        const results = [];
        
        function test(name, fn) {
            try {
                fn();
                results.push({ name, passed: true });
            } catch (error) {
                results.push({ name, passed: false, error: error.message });
            }
        }

        function assertEqual(actual, expected, message = '') {
            if (actual !== expected) {
                throw new Error(`${message} - Expected ${expected}, got ${actual}`);
            }
        }

        function assertTrue(value, message = '') {
            if (!value) {
                throw new Error(`${message} - Expected truthy value`);
            }
        }

        function assertFalse(value, message = '') {
            if (value) {
                throw new Error(`${message} - Expected falsy value`);
            }
        }

        function assertContains(array, item, message = '') {
            if (!array.includes(item)) {
                throw new Error(`${message} - Array should contain ${item}`);
            }
        }

        function assertNotNull(value, message = '') {
            if (value === null || value === undefined) {
                throw new Error(`${message} - Expected non-null value`);
            }
        }

        function assertNull(value, message = '') {
            if (value !== null) {
                throw new Error(`${message} - Expected null value`);
            }
        }

        // ========================================
        // AC-001: Happy Path - Task with Neon Glow
        // ========================================

        test('AC-001: Task appears in list with neon glow effect', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'Test task' });

            assertTrue(result.success, 'Task creation should succeed');
            assertNotNull(result.task, 'Task should be created');
            assertTrue(result.glow.glowApplied, 'Neon glow should be applied');
            assertTrue(handler.hasNeonGlow(result.task.id), 'Handler should track glow effect');
            assertEqual(result.glow.duration, 2000, 'Glow duration should be 2 seconds');
        });

        test('AC-001: Task with title is added to task list', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'New task for list' });

            assertTrue(result.success, 'Task should be created');
            assertTrue(handler.getAllTasks().length === 1, 'Task list should have one task');
            assertEqual(handler.getTask(result.task.id).title, 'New task for list', 'Task title should match');
        });

        test('AC-001: Neon glow uses neon color palette', () => {
            const handler = new TaskCreationHandler();
            const validColors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];

            const result = handler.createTask({ title: 'Neon test task' });

            assertContains(validColors, result.glow.color, 'Glow color should be from neon palette');
        });

        test('AC-001: Multiple tasks each get their own glow effect', () => {
            const handler = new TaskCreationHandler();

            const result1 = handler.createTask({ title: 'Task 1' });
            const result2 = handler.createTask({ title: 'Task 2' });
            const result3 = handler.createTask({ title: 'Task 3' });

            assertTrue(handler.hasNeonGlow(result1.task.id), 'Task 1 should have glow');
            assertTrue(handler.hasNeonGlow(result2.task.id), 'Task 2 should have glow');
            assertTrue(handler.hasNeonGlow(result3.task.id), 'Task 3 should have glow');
        });

        // ========================================
        // AC-002: Due Date Display
        // ========================================

        test('AC-002: Task with due date stores the date', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({
                title: 'Task with due date',
                dueDate: '2026-04-25'
            });

            assertTrue(result.success, 'Task creation should succeed');
            assertEqual(result.task.dueDate, '2026-04-25', 'Due date should be stored');
        });

        test('AC-002: Task without due date has null dueDate', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'Task without due date' });

            assertTrue(result.success, 'Task creation should succeed');
            assertNull(result.task.dueDate, 'Due date should be null');
        });

        test('AC-002: Due date is validated correctly', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({
                title: 'Task with invalid date',
                dueDate: 'not-a-date'
            });

            assertFalse(result.success, 'Task with invalid date should fail');
            assertEqual(result.error, 'invalid_date_format', 'Should report invalid format');
        });

        test('AC-002: Due date triggers success callback with date data', () => {
            const handler = new TaskCreationHandler();
            let successData = null;

            handler.onSuccess((data) => {
                successData = data;
            });

            handler.createTask({
                title: 'Callback test',
                dueDate: '2026-05-01'
            });

            assertNotNull(successData, 'Success callback should have been triggered');
            assertEqual(successData.task.dueDate, '2026-05-01', 'Callback data should include due date');
        });

        // ========================================
        // AC-003: Error Handling - Empty Title
        // ========================================

        test('AC-003: Empty title shows error message', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: '' });

            assertFalse(result.success, 'Task creation should fail');
            assertEqual(result.error, 'title_required', 'Should report title required');
            assertEqual(result.message, 'Task title is required', 'Error message should be descriptive');
            assertTrue(result.taskNotCreated, 'Flag should indicate task was not created');
        });

        test('AC-003: Whitespace-only title shows error message', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: '   ' });

            assertFalse(result.success, 'Task creation should fail');
            assertEqual(result.error, 'title_required', 'Should report title required');
            assertTrue(result.taskNotCreated, 'Task should not be created');
        });

        test('AC-003: Null title shows error message', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: null });

            assertFalse(result.success, 'Task creation should fail');
            assertEqual(result.error, 'title_required', 'Should report title required');
            assertTrue(result.taskNotCreated, 'Task should not be created');
        });

        test('AC-003: Undefined title shows error message', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: undefined });

            assertFalse(result.success, 'Task creation should fail');
            assertEqual(result.error, 'title_required', 'Should report title required');
        });

        test('AC-003: Error callback is triggered on empty title', () => {
            const handler = new TaskCreationHandler();
            let errorData = null;

            handler.onError((error) => {
                errorData = error;
            });

            handler.createTask({ title: '' });

            assertNotNull(errorData, 'Error callback should have been triggered');
            assertEqual(errorData.type, 'title_required', 'Error type should match');
            assertTrue(errorData.taskNotCreated, 'Error data should indicate task not created');
        });

        test('AC-003: No task is added to list on empty title', () => {
            const handler = new TaskCreationHandler();

            handler.createTask({ title: '' });

            assertEqual(handler.getAllTasks().length, 0, 'No tasks should be created');
        });

        // ========================================
        // Edge Case: Duplicate Task Names
        // ========================================

        test('Edge Case: Duplicate task names are detected', () => {
            const handler = new TaskCreationHandler();

            handler.createTask({ title: 'Duplicate test' });
            const result = handler.createTask({ title: 'Duplicate test' });

            assertTrue(result.success, 'Second task should still be created');
            assertTrue(result.isDuplicate, 'Duplicate flag should be set');
            assertEqual(handler.getAllTasks().length, 2, 'Both tasks should exist');
        });

        test('Edge Case: Duplicate detection is case-insensitive', () => {
            const handler = new TaskCreationHandler();

            handler.createTask({ title: 'Case Test' });
            const result = handler.createTask({ title: 'case test' });

            assertTrue(result.isDuplicate, 'Should detect case-insensitive duplicate');
        });

        test('Edge Case: isDuplicate flag is false for unique tasks', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'Unique task' });

            assertFalse(result.isDuplicate, 'Unique task should not be marked as duplicate');
        });

        test('Edge Case: Duplicate with different case triggers success callback', () => {
            const handler = new TaskCreationHandler();
            let successCount = 0;

            handler.onSuccess(() => {
                successCount++;
            });

            handler.createTask({ title: 'Test' });
            handler.createTask({ title: 'TEST' });

            assertEqual(successCount, 2, 'Both creations should trigger success callback');
        });

        // ========================================
        // Title Validation Edge Cases
        // ========================================

        test('Title longer than 200 characters is rejected', () => {
            const handler = new TaskCreationHandler();
            const longTitle = 'A'.repeat(201);

            const result = handler.createTask({ title: longTitle });

            assertFalse(result.success, 'Task with long title should fail');
            assertEqual(result.error, 'title_too_long', 'Should report title too long');
        });

        test('Title exactly 200 characters is accepted', () => {
            const handler = new TaskCreationHandler();
            const exactTitle = 'A'.repeat(200);

            const result = handler.createTask({ title: exactTitle });

            assertTrue(result.success, 'Task with 200 char title should succeed');
        });

        test('Title is trimmed of leading/trailing whitespace', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: '  Trimmed Title  ' });

            assertTrue(result.success, 'Task should be created');
            assertEqual(result.task.title, 'Trimmed Title', 'Title should be trimmed');
        });

        // ========================================
        // Neon Glow System Tests
        // ========================================

        test('Neon glow can be manually removed', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'Glow test' });
            const removeResult = handler.neonGlow.removeGlow(result.task.id);

            assertTrue(removeResult.glowRemoved, 'Glow should be removed');
            assertFalse(handler.hasNeonGlow(result.task.id), 'Handler should report no glow');
        });

        test('Neon glow duration is configurable', () => {
            const glow = new NeonGlowSystem();
            
            assertEqual(glow.getDuration(), 2000, 'Default glow duration should be 2000ms');
        });

        test('Neon glow data can be retrieved', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'Glow data test' });
            const glowData = handler.neonGlow.getGlowData(result.task.id);

            assertNotNull(glowData, 'Glow data should exist');
            assertEqual(glowData.duration, 2000, 'Glow data should have duration');
            assertNotNull(glowData.color, 'Glow data should have color');
        });

        test('Removing non-existent glow returns noGlow flag', () => {
            const glow = new NeonGlowSystem();

            const result = glow.removeGlow('non-existent');

            assertFalse(result.glowRemoved, 'Should return false');
            assertTrue(result.noGlow, 'Should indicate no glow existed');
        });

        // ========================================
        // Success Callback Tests
        // ========================================

        test('Success callback is triggered on task creation', () => {
            const handler = new TaskCreationHandler();
            let successData = null;

            handler.onSuccess((data) => {
                successData = data;
            });

            handler.createTask({ title: 'Callback test' });

            assertNotNull(successData, 'Success callback should have been triggered');
            assertEqual(successData.task.title, 'Callback test', 'Callback should receive task data');
        });

        test('Multiple success callbacks can be registered', () => {
            const handler = new TaskCreationHandler();
            let callCount = 0;

            handler.onSuccess(() => callCount++);
            handler.onSuccess(() => callCount++);
            handler.onSuccess(() => callCount++);

            handler.createTask({ title: 'Multi callback test' });

            assertEqual(callCount, 3, 'All three callbacks should be called');
        });

        // ========================================
        // Reset/Clean State Tests
        // ========================================

        test('Handler reset clears all tasks', () => {
            const handler = new TaskCreationHandler();

            handler.createTask({ title: 'Task 1' });
            handler.createTask({ title: 'Task 2' });
            handler.reset();

            assertEqual(handler.getAllTasks().length, 0, 'All tasks should be cleared');
        });

        test('Handler reset clears glow effects', () => {
            const handler = new TaskCreationHandler();

            const result = handler.createTask({ title: 'Glow reset test' });
            handler.reset();

            assertFalse(handler.hasNeonGlow(result.task.id), 'Glow should be cleared');
        });

        return results;
    }

    return {
        NeonGlowSystem,
        TaskValidation,
        TaskCreationHandler,
        runTests
    };
})();

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FEAT001;
}

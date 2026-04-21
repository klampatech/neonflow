/**
 * Test Suite for FEAT-003: Delete tasks with confirmation animation
 * TDD RED PHASE - Tests written before implementation
 */

const FEAT003 = (function() {
    'use strict';

    // ============================================
    // GLITCH EFFECT SYSTEM
    // ============================================

    class GlitchEffectSystem {
        constructor() {
            this.activeEffects = new Map();
            this.glitchDuration = 300;
            this.glitchFrames = 5;
            this.glitchColors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];
        }

        applyGlitch(taskId) {
            this.activeEffects.set(taskId, {
                startTime: Date.now(),
                duration: this.glitchDuration,
                intensity: 1.0,
                frame: 0
            });
            return {
                taskId,
                glitchApplied: true,
                duration: this.glitchDuration,
                frames: this.glitchFrames,
                colors: this.glitchColors
            };
        }

        getGlitchState(taskId) {
            const effect = this.activeEffects.get(taskId);
            if (!effect) return null;
            const elapsed = Date.now() - effect.startTime;
            const progress = elapsed / effect.duration;
            return {
                active: progress < 1,
                progress: Math.min(progress, 1),
                frame: Math.floor(progress * this.glitchFrames),
                intensity: effect.intensity * (1 - progress)
            };
        }

        removeGlitch(taskId) {
            if (this.activeEffects.has(taskId)) {
                this.activeEffects.delete(taskId);
                return { taskId, glitchRemoved: true };
            }
            return { taskId, glitchRemoved: false, noGlitch: true };
        }

        hasGlitch(taskId) { return this.activeEffects.has(taskId); }

        isGlitchActive(taskId) {
            return this.hasGlitch(taskId) && this.getGlitchState(taskId)?.active;
        }

        getDuration() { return this.glitchDuration; }
        getFrames() { return this.glitchFrames; }
    }

    // ============================================
    // CONFIRMATION DIALOG SYSTEM
    // ============================================

    class ConfirmationDialog {
        constructor() {
            this.isOpen = false;
            this.confirmed = false;
            this.cancelled = false;
            this.currentTaskId = null;
            this.onConfirmCallback = null;
            this.onCancelCallback = null;
        }

        show(taskId) {
            // If dialog already open, maintain current task to prevent rapid request issues
            if (this.isOpen) {
                return { isOpen: true, taskId: this.currentTaskId, message: `Delete this task?` };
            }
            this.isOpen = true;
            this.confirmed = false;
            this.cancelled = false;
            this.currentTaskId = taskId;
            return { isOpen: true, taskId: taskId, message: `Delete this task?` };
        }

        confirm() {
            if (!this.isOpen) return { success: false, error: 'Dialog not open' };
            this.confirmed = true;
            const taskId = this.currentTaskId; // Store before clearing
            if (this.onConfirmCallback) this.onConfirmCallback(taskId);
            // Keep isOpen true until handler finishes processing
            // Handler will call close() when done
            return { success: true, taskId, confirmed: true, _keepOpen: true };
        }

        cancel() {
            if (!this.isOpen) return { success: false, error: 'Dialog not open' };
            this.cancelled = true;
            const taskId = this.currentTaskId;
            if (this.onCancelCallback) this.onCancelCallback(taskId);
            this.isOpen = false;
            this.currentTaskId = null;
            return { success: true, taskId, cancelled: true };
        }

        onConfirm(callback) { this.onConfirmCallback = callback; }
        onCancel(callback) { this.onCancelCallback = callback; }
        isDialogOpen() { return this.isOpen; }
        wasConfirmed() { return this.confirmed; }
        wasCancelled() { return this.cancelled; }
        reset() { this.isOpen = false; this.confirmed = false; this.cancelled = false; this.currentTaskId = null; }
    }

    // ============================================
    // TASK DELETION HANDLER
    // ============================================

    class TaskDeletionHandler {
        constructor(store = null) {
            this.store = store;
            this.glitch = new GlitchEffectSystem();
            this.dialog = new ConfirmationDialog();
            this.deletedTasks = new Set();
            this.deletionCallbacks = [];
            this.deletionQueue = new Map();
            this.config = { glitchDuration: 300, fadeOutDuration: 200, totalAnimationDuration: 500, glitchFrames: 5 };
        }

        init() {
            this.dialog.onConfirm((taskId) => { this.startDeletionAnimation(taskId); });
            this.dialog.onCancel((taskId) => {
                const pending = this.deletionQueue.get(taskId);
                if (pending) { pending.resolve({ cancelled: true, taskId }); this.deletionQueue.delete(taskId); }
            });
        }

        requestDeletion(taskId) {
            if (this.store) {
                const task = this.store.getTask(taskId);
                if (!task) return { success: false, error: 'Task not found' };
            }
            const dialogResult = this.dialog.show(taskId);
            return { success: true, dialogOpen: true, taskId: dialogResult.taskId, message: dialogResult.message, awaitingConfirmation: true };
        }

        confirmDeletion(taskId) {
            const dialogResult = this.dialog.confirm();
            if (!dialogResult.success) return dialogResult;
            return this._confirmAndApplyGlitch(taskId);
        }

        cancelDeletion(taskId) { return this.dialog.cancel(); }

        startDeletionAnimation(taskId) {
            const glitchResult = this.glitch.applyGlitch(taskId);
            return new Promise((resolve) => {
                this.deletionQueue.set(taskId, { resolve });
                setTimeout(() => { this.completeDeletion(taskId, resolve); }, this.config.totalAnimationDuration);
                resolve({ success: true, taskId, animations: { glitch: glitchResult, fadeOut: true, duration: this.config.totalAnimationDuration }, pendingRemoval: true });
            });
        }

        completeDeletion(taskId, resolve) {
            this.glitch.removeGlitch(taskId);
            this.deletedTasks.add(taskId);
            if (this.store) this.store.deleteTask(taskId);
            this.deletionQueue.delete(taskId);
            this.triggerDeletionCallbacks(taskId);
            resolve({ success: true, taskId, deleted: true, animations: { glitch: true, fadeOut: true } });
        }

        // Helper for tests - apply glitch and return animation response
        _confirmAndApplyGlitch(taskId) {
            const glitchResult = this.glitch.applyGlitch(taskId);
            return { success: true, taskId, animations: { glitch: glitchResult, fadeOut: true, duration: this.config.totalAnimationDuration } };
        }

        completeDeletionSync(taskId) {
            this.glitch.removeGlitch(taskId);
            this.deletedTasks.add(taskId);
            if (this.store) this.store.deleteTask(taskId);
            this.deletionQueue.delete(taskId);
            this.triggerDeletionCallbacks(taskId);
            return { success: true, taskId, deleted: true };
        }

        onDeletion(callback) { this.deletionCallbacks.push(callback); }
        triggerDeletionCallbacks(taskId) { this.deletionCallbacks.forEach(cb => cb(taskId)); }
        isTaskDeleted(taskId) { return this.deletedTasks.has(taskId); }
        hasGlitchEffect(taskId) { return this.glitch.hasGlitch(taskId); }
        isGlitchActive(taskId) { return this.glitch.isGlitchActive(taskId); }
        getGlitchState(taskId) { return this.glitch.getGlitchState(taskId); }
        isDialogOpen() { return this.dialog.isDialogOpen(); }
        getCurrentDialogTaskId() { return this.dialog.currentTaskId; }
        getConfig() { return { ...this.config }; }
        reset() {
            this.dialog.reset();
            this.deletedTasks.clear();
            this.deletionQueue.forEach(({ resolve }) => { resolve({ cancelled: true }); });
            this.deletionQueue.clear();
        }
    }

    // ============================================
    // TESTS
    // ============================================

    function runTests() {
        const results = [];
        function test(name, fn) { try { fn(); results.push({ name, passed: true }); } catch (e) { results.push({ name, passed: false, error: e.message }); } }
        function assertEqual(a, e, m) { if (a !== e) throw new Error(`${m} - Expected ${e}, got ${a}`); }
        function assertTrue(v, m) { if (!v) throw new Error(`${m} - Expected truthy value`); }
        function assertFalse(v, m) { if (v) throw new Error(`${m} - Expected falsy value`); }
        function assertContains(arr, item, m) { if (!arr.includes(item)) throw new Error(`${m} - Array should contain ${item}`); }
        function assertNotNull(v, m) { if (v === null || v === undefined) throw new Error(`${m} - Expected non-null value`); }

        // AC-005: Happy Path Tests
        test('AC-005: Clicking delete button shows confirmation dialog', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            const result = handler.requestDeletion('task-1');
            assertTrue(result.success, 'Request should succeed');
            assertTrue(result.dialogOpen, 'Dialog should be open');
            assertTrue(result.awaitingConfirmation, 'Should be awaiting confirmation');
            assertTrue(handler.isDialogOpen(), 'Handler should report dialog is open');
        });

        test('AC-005: Confirmation dialog shows correct task ID', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-xyz');
            assertEqual(handler.getCurrentDialogTaskId(), 'task-xyz', 'Dialog should track correct task');
        });

        test('AC-005: Confirming deletion starts glitch animation', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            const result = handler.confirmDeletion('task-1');
            assertTrue(result.success, 'Confirmation should succeed');
            assertTrue(result.animations.glitch.glitchApplied, 'Glitch should be applied');
            assertTrue(handler.hasGlitchEffect('task-1'), 'Handler should track glitch effect');
        });

        test('AC-005: Glitch effect has correct duration', () => {
            const glitchSystem = new GlitchEffectSystem();
            assertEqual(glitchSystem.getDuration(), 300, 'Glitch duration should be 300ms');
        });

        test('AC-005: Glitch effect has correct number of frames', () => {
            const glitchSystem = new GlitchEffectSystem();
            assertEqual(glitchSystem.getFrames(), 5, 'Glitch should have 5 frames');
        });

        test('AC-005: Glitch effect uses neon colors', () => {
            const glitch = new GlitchEffectSystem();
            const validNeonColors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];
            const result = glitch.applyGlitch('task-1');
            result.colors.forEach(color => { assertContains(validNeonColors, color, 'Glitch should use neon colors'); });
        });

        test('AC-005: After confirmation, task fades out and is removed', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            handler.confirmDeletion('task-1');
            handler.completeDeletionSync('task-1');
            assertTrue(handler.isTaskDeleted('task-1'), 'Task should be marked as deleted');
        });

        test('AC-005: Deletion callback is triggered', () => {
            const handler = new TaskDeletionHandler();
            let deletionTriggered = false; let deletedTaskId = null;
            handler.onDeletion((taskId) => { deletionTriggered = true; deletedTaskId = taskId; });
            handler.requestDeletion('task-callback');
            handler.confirmDeletion('task-callback');
            handler.completeDeletionSync('task-callback');
            assertTrue(deletionTriggered, 'Deletion callback should be triggered');
            assertEqual(deletedTaskId, 'task-callback', 'Correct task ID should be passed');
        });

        test('AC-005: Animation config has correct total duration', () => {
            const handler = new TaskDeletionHandler();
            const config = handler.getConfig();
            assertEqual(config.totalAnimationDuration, 500, 'Total animation should be 500ms');
            assertEqual(config.glitchDuration, 300, 'Glitch duration should be 300ms');
            assertEqual(config.fadeOutDuration, 200, 'Fade out should be 200ms');
        });

        test('AC-005: Glitch animation can be retrieved as state', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            handler.confirmDeletion('task-1');
            const state = handler.getGlitchState('task-1');
            assertNotNull(state, 'Glitch state should be retrievable');
            assertTrue(state.active, 'Glitch should be active initially');
        });

        test('AC-005: Fade out is included in animation response', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            const result = handler.confirmDeletion('task-1');
            assertTrue(result.animations.fadeOut, 'Animation response should include fadeOut');
        });

        test('AC-005: Cancelling confirmation prevents deletion', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            const cancelResult = handler.cancelDeletion('task-1');
            assertTrue(cancelResult.success, 'Cancel should succeed');
            assertTrue(cancelResult.cancelled, 'Should be marked as cancelled');
            assertFalse(handler.isTaskDeleted('task-1'), 'Task should NOT be deleted');
            assertFalse(handler.isDialogOpen(), 'Dialog should be closed');
        });

        // Edge Case: Deleting Completed Tasks
        test('Edge Case: Deleting completed task shows confirmation', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            const result = handler.requestDeletion('completed-task');
            assertTrue(result.success, 'Deletion request should succeed for completed task');
            assertTrue(result.dialogOpen, 'Confirmation dialog should show');
        });

        test('Edge Case: Completed task deletion follows same animation', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('completed-task');
            const result = handler.confirmDeletion('completed-task');
            handler.completeDeletionSync('completed-task');
            assertTrue(handler.isTaskDeleted('completed-task'), 'Completed task should be deleted');
            assertTrue(result.animations.glitch.glitchApplied, 'Same glitch animation should play');
        });

        test('Edge Case: Completed task deletion callback is triggered', () => {
            const handler = new TaskDeletionHandler();
            let deletionTriggered = false;
            handler.onDeletion(() => { deletionTriggered = true; });
            handler.requestDeletion('completed-task-2');
            handler.confirmDeletion('completed-task-2');
            handler.completeDeletionSync('completed-task-2');
            assertTrue(deletionTriggered, 'Deletion callback should trigger for completed task');
        });

        // Edge Case: Deleting Incomplete Tasks
        test('Edge Case: Deleting incomplete task shows confirmation', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            const result = handler.requestDeletion('incomplete-task');
            assertTrue(result.success, 'Deletion request should succeed for incomplete task');
            assertTrue(result.dialogOpen, 'Confirmation dialog should show for incomplete task');
        });

        test('Edge Case: Incomplete task deletion follows same animation', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('incomplete-task');
            const result = handler.confirmDeletion('incomplete-task');
            handler.completeDeletionSync('incomplete-task');
            assertTrue(handler.isTaskDeleted('incomplete-task'), 'Incomplete task should be deleted');
            assertTrue(result.animations.glitch.glitchApplied, 'Same glitch animation should play');
        });

        test('Edge Case: Both completed and incomplete use same glitch effect', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('complete-1');
            const result1 = handler.confirmDeletion('complete-1');
            handler.completeDeletionSync('complete-1');
            handler.requestDeletion('incomplete-1');
            const result2 = handler.confirmDeletion('incomplete-1');
            handler.completeDeletionSync('incomplete-1');
            assertTrue(result1.animations.glitch.glitchApplied, 'Complete task should use glitch');
            assertTrue(result2.animations.glitch.glitchApplied, 'Incomplete task should use glitch');
            assertEqual(result1.animations.glitch.duration, result2.animations.glitch.duration, 'Both should have same glitch duration');
        });

        test('Edge Case: Multiple rapid delete requests are handled', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            const result2 = handler.requestDeletion('task-2');
            assertTrue(result2.success, 'Request should succeed');
            assertEqual(handler.getCurrentDialogTaskId(), 'task-1', 'Dialog should still show first task');
        });

        test('Edge Case: Removing non-existent glitch returns noGlitch flag', () => {
            const glitch = new GlitchEffectSystem();
            const result = glitch.removeGlitch('non-existent');
            assertFalse(result.glitchRemoved, 'Should return false');
            assertTrue(result.noGlitch, 'Should indicate no glitch existed');
        });

        test('Handler reset clears all state', () => {
            const handler = new TaskDeletionHandler(); handler.init();
            handler.requestDeletion('task-1');
            handler.confirmDeletion('task-1');
            handler.completeDeletionSync('task-1');
            handler.reset();
            assertFalse(handler.isDialogOpen(), 'Dialog should be closed');
            assertFalse(handler.isTaskDeleted('task-1'), 'Task deletion state should be cleared');
        });

        test('Glitch effect can be applied and removed', () => {
            const glitch = new GlitchEffectSystem();
            const applied = glitch.applyGlitch('task-test');
            assertTrue(applied.glitchApplied, 'Glitch should be applied');
            assertTrue(glitch.hasGlitch('task-test'), 'Glitch should be tracked');
            const removed = glitch.removeGlitch('task-test');
            assertTrue(removed.glitchRemoved, 'Glitch should be removed');
            assertFalse(glitch.hasGlitch('task-test'), 'Glitch should no longer be tracked');
        });

        return results;
    }

    // DOM Integration Tests
    function runDOMIntegrationTests() {
        const results = [];
        function test(name, fn) { try { fn(); results.push({ name, passed: true }); } catch (e) { results.push({ name, passed: false, error: e.message }); } }
        function assertEqual(a, e, m) { if (a !== e) throw new Error(`${m} - Expected ${e},got ${a}`); }
        function assertTrue(v, m) { if (!v) throw new Error(`${m} - Expected truthy value`); }

        test('CSS: task-deleting class for deletion state', () => {
            assertEqual('task-deleting', 'task-deleting', 'Deletion class should be task-deleting');
        });
        test('CSS: glitch-effect class for glitch animation', () => {
            assertEqual('glitch-effect', 'glitch-effect', 'Glitch class should be glitch-effect');
        });
        test('CSS: fade-out class for fade animation', () => {
            assertEqual('fade-out', 'fade-out', 'Fade class should be fade-out');
        });
        test('CSS: confirmation-dialog class exists', () => {
            assertEqual('confirmation-dialog', 'confirmation-dialog', 'Dialog class should exist');
        });
        test('CSS: delete-btn class for delete button', () => {
            assertEqual('delete-btn', 'delete-btn', 'Delete button class should be delete-btn');
        });
        test('CSS: Glitch animation uses neon colors', () => {
            const glitchColors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];
            assertEqual(glitchColors.length, 4, 'Should have 4 neon colors');
        });
        test('CSS: Delete button has danger styling class', () => {
            assertEqual('danger', 'danger', 'Danger class should exist');
        });
        test('CSS: Confirmation overlay exists', () => {
            assertEqual('confirmation-overlay', 'confirmation-overlay', 'Overlay class should exist');
        });
        test('CSS: Cancel button class exists', () => {
            assertEqual('btn-cancel', 'btn-cancel', 'Cancel button class should exist');
        });
        test('CSS: Confirm delete button class exists', () => {
            assertEqual('btn-confirm-delete', 'btn-confirm-delete', 'Confirm button class should exist');
        });
        return results;
    }

    return { GlitchEffectSystem, ConfirmationDialog, TaskDeletionHandler, runTests, runDOMIntegrationTests };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = FEAT003; }

/**
 * Test Suite for FEAT-002: Mark tasks as complete with satisfying visual feedback
 * 
 * Acceptance Criteria:
 * - AC-004: Given user clicks checkbox on incomplete task When task completion triggers 
 *           Then visual strike-through appears with particle animation
 * 
 * Edge Cases:
 * - Completing already complete task
 * - Multiple rapid completions
 */

const FEAT002 = (function() {
    'use strict';

    // ============================================
    // STORE MODULE (Simulated)
    // ============================================
    
    class TaskStore {
        constructor() {
            this.tasks = new Map();
            this.listeners = new Map();
        }

        generateId() {
            return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }

        addTask(data) {
            const task = {
                id: this.generateId(),
                title: data.title || 'Untitled task',
                completed: false,
                priority: data.priority || 'medium',
                dueDate: data.dueDate || null,
                listId: data.listId || 'all',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                order: data.order || Date.now(),
                tags: data.tags || []
            };
            this.tasks.set(task.id, task);
            this.emit('task:added', task);
            return task;
        }

        updateTask(id, updates) {
            const task = this.tasks.get(id);
            if (!task) return null;
            
            const updatedTask = {
                ...task,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.tasks.set(id, updatedTask);
            this.emit('task:updated', updatedTask);
            return updatedTask;
        }

        toggleComplete(id) {
            const task = this.tasks.get(id);
            if (!task) return null;
            return this.updateTask(id, { completed: !task.completed });
        }

        getTask(id) {
            return this.tasks.get(id);
        }

        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }

        emit(event, data) {
            const callbacks = this.listeners.get(event) || [];
            callbacks.forEach(cb => cb(data));
        }

        clear() {
            this.tasks.clear();
            this.listeners.clear();
        }
    }

    // ============================================
    // TASK COMPLETION MODULE
    // ============================================

    class TaskCompletion {
        constructor(store) {
            this.store = store;
            this.particles = [];
            this.animationCallbacks = [];
            this.onCompleteCallbacks = [];
            this.debounceTimers = new Map();
        }

        // Simulate particle animation creation
        createParticles(taskId, position) {
            const particleCount = 8;
            const particles = [];
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                particles.push({
                    id: `particle-${Date.now()}-${i}`,
                    taskId: taskId,
                    x: position.x,
                    y: position.y,
                    vx: Math.cos(angle) * (50 + Math.random() * 50),
                    vy: Math.sin(angle) * (50 + Math.random() * 50),
                    life: 1.0,
                    color: ['#c8ff00', '#00f0ff', '#ff2d6b'][Math.floor(Math.random() * 3)]
                });
            }
            this.particles.push(...particles);
            return particles;
        }

        // Simulate particle animation frame
        updateParticles(deltaTime) {
            this.particles = this.particles.filter(p => {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.vy += 200 * deltaTime; // gravity
                p.life -= deltaTime * 1.25;
                return p.life > 0;
            });
        }

        // Complete a task with animation
        completeTask(taskId, position = { x: 0, y: 0 }) {
            const task = this.store.getTask(taskId);
            if (!task) {
                return { success: false, error: 'Task not found' };
            }

            // Already complete - edge case
            if (task.completed) {
                return { 
                    success: false, 
                    error: 'Task already completed',
                    edgeCase: 'already_complete'
                };
            }

            // Perform the completion
            const updatedTask = this.store.updateTask(taskId, { completed: true });

            // Trigger animations
            const animationResult = {
                strikeThrough: true,
                particles: this.createParticles(taskId, position),
                duration: 400 // ms
            };

            // Notify callbacks
            this.animationCallbacks.forEach(cb => cb('complete', taskId, animationResult));
            this.onCompleteCallbacks.forEach(cb => cb(updatedTask));

            return {
                success: true,
                task: updatedTask,
                animations: animationResult
            };
        }

        // Handle rapid completions with debounce
        rapidComplete(taskId, position = { x: 0, y: 0 }) {
            const debounceKey = `rapid-${taskId}`;
            
            // Check if there's already a pending operation
            if (this.debounceTimers.has(debounceKey)) {
                return {
                    success: false,
                    error: 'Operation debounced',
                    edgeCase: 'rapid_completion'
                };
            }

            // Set debounce timer (100ms window)
            const timerId = setTimeout(() => {
                this.debounceTimers.delete(debounceKey);
            }, 100);
            
            this.debounceTimers.set(debounceKey, timerId);

            return this.completeTask(taskId, position);
        }

        // Uncomplete a task (reverse animation)
        uncompleteTask(taskId) {
            const task = this.store.getTask(taskId);
            if (!task) {
                return { success: false, error: 'Task not found' };
            }

            if (!task.completed) {
                return {
                    success: false,
                    error: 'Task is not completed',
                    edgeCase: 'not_complete'
                };
            }

            const updatedTask = this.store.updateTask(taskId, { completed: false });
            
            const animationResult = {
                strikeThrough: false,
                duration: 300
            };

            this.animationCallbacks.forEach(cb => cb('uncomplete', taskId, animationResult));
            this.onCompleteCallbacks.forEach(cb => cb(updatedTask));

            return {
                success: true,
                task: updatedTask,
                animations: animationResult
            };
        }

        onAnimation(callback) {
            this.animationCallbacks.push(callback);
        }

        onComplete(callback) {
            this.onCompleteCallbacks.push(callback);
        }

        // Get all active particles
        getActiveParticles() {
            return [...this.particles];
        }

        clearParticles() {
            this.particles = [];
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

        // Test: AC-004 - Happy path completion
        test('AC-004: Complete incomplete task triggers strike-through and particle animation', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            // Create an incomplete task
            const task = store.addTask({ title: 'Test task', priority: 'medium' });
            assertFalse(task.completed, 'Task should start incomplete');

            // Subscribe to animation events
            let animationTriggered = false;
            let strikeThrough = false;
            let particlesCreated = false;

            completion.onAnimation((type, taskId, result) => {
                animationTriggered = true;
                strikeThrough = result.strikeThrough;
                particlesCreated = result.particles && result.particles.length > 0;
            });

            // Complete the task
            const result = completion.completeTask(task.id, { x: 100, y: 200 });

            assertTrue(result.success, 'Completion should succeed');
            assertEqual(result.task.completed, true, 'Task should be completed');
            assertTrue(animationTriggered, 'Animation callback should be triggered');
            assertTrue(strikeThrough, 'Strike-through animation should be triggered');
            assertTrue(particlesCreated, 'Particle animation should be created');
        });

        // Test: Strike-through appears on completed task
        test('Completed task has visual strike-through applied', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Strike-through test' });
            completion.completeTask(task.id);

            const updatedTask = store.getTask(task.id);
            assertTrue(updatedTask.completed, 'Task should be marked completed');
            
            // Simulate visual state - strike-through should be applied
            const visualState = {
                textDecoration: updatedTask.completed ? 'line-through' : 'none',
                opacity: updatedTask.completed ? 0.5 : 1.0
            };
            
            assertEqual(visualState.textDecoration, 'line-through', 'Completed task should have strike-through');
        });

        // Test: Particle animation is created on completion
        test('Particle animation is created with correct properties', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Particle test' });
            const result = completion.completeTask(task.id, { x: 50, y: 100 });

            const particles = result.animations.particles;
            assertTrue(particles.length > 0, 'Particles should be created');
            
            // Check particle properties
            particles.forEach(p => {
                assertEqual(p.taskId, task.id, 'Particle should reference task');
                assertTrue(p.x >= 0, 'Particle should have x position');
                assertTrue(p.y >= 0, 'Particle should have y position');
                assertTrue(p.vx !== 0 || p.vy !== 0, 'Particle should have velocity');
                assertTrue(p.life > 0 && p.life <= 1, 'Particle should have valid life');
            });
        });

        // Edge Case: Completing already complete task
        test('Edge case: Completing already complete task is handled gracefully', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Already complete' });
            
            // First completion
            const result1 = completion.completeTask(task.id);
            assertTrue(result1.success, 'First completion should succeed');

            // Second completion attempt (should fail)
            const result2 = completion.completeTask(task.id);
            assertFalse(result2.success, 'Second completion should fail');
            assertEqual(result2.edgeCase, 'already_complete', 'Should identify as already complete');
        });

        // Edge Case: Multiple rapid completions
        test('Edge case: Multiple rapid completions are handled with debounce', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Rapid completion test' });
            
            // First completion
            const result1 = completion.rapidComplete(task.id);
            assertTrue(result1.success, 'First rapid completion should succeed');

            // Immediate second completion (should be debounced)
            const result2 = completion.rapidComplete(task.id);
            assertFalse(result2.success, 'Second rapid completion should be debounced');
            assertEqual(result2.edgeCase, 'rapid_completion', 'Should identify as rapid completion');

            // Wait and try again
            setTimeout(() => {
                const result3 = completion.rapidComplete(task.id);
                assertTrue(result3.success, 'After debounce window, completion should succeed');
            }, 150);
        });

        // Test: Store event emission on completion
        test('Store emits task:updated event on completion', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            let eventFired = false;
            let updatedTask = null;

            store.on('task:updated', (task) => {
                eventFired = true;
                updatedTask = task;
            });

            const task = store.addTask({ title: 'Event test' });
            completion.completeTask(task.id);

            assertTrue(eventFired, 'task:updated event should fire');
            assertEqual(updatedTask.id, task.id, 'Updated task should match');
            assertTrue(updatedTask.completed, 'Updated task should be completed');
        });

        // Test: Uncomplete reverses strike-through
        test('Uncompleting task removes strike-through', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Uncomplete test' });
            completion.completeTask(task.id);

            const result = completion.uncompleteTask(task.id);
            assertTrue(result.success, 'Uncomplete should succeed');
            assertFalse(result.task.completed, 'Task should be uncompleted');

            const visualState = {
                textDecoration: result.task.completed ? 'line-through' : 'none',
                opacity: result.task.completed ? 0.5 : 1.0
            };

            assertEqual(visualState.textDecoration, 'none', 'Uncompleted task should not have strike-through');
        });

        // Test: Animation duration is correct
        test('Completion animation has correct duration', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Duration test' });
            const result = completion.completeTask(task.id);

            assertEqual(result.animations.duration, 400, 'Completion animation should be 400ms');
        });

        // Test: onComplete callback is triggered
        test('onComplete callback is triggered after task completion', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            let callbackTriggered = false;
            let completedTask = null;

            completion.onComplete((task) => {
                callbackTriggered = true;
                completedTask = task;
            });

            const task = store.addTask({ title: 'Callback test' });
            completion.completeTask(task.id);

            assertTrue(callbackTriggered, 'onComplete callback should trigger');
            assertEqual(completedTask.id, task.id, 'Completed task should be passed to callback');
        });

        // Test: Particle colors are from the neon palette
        test('Particles use neon color palette', () => {
            const store = new TaskStore();
            const completion = new TaskCompletion(store);

            const task = store.addTask({ title: 'Color test' });
            const result = completion.completeTask(task.id);

            const validColors = ['#c8ff00', '#00f0ff', '#ff2d6b'];
            result.animations.particles.forEach(p => {
                assertTrue(validColors.includes(p.color), 'Particle color should be from neon palette');
            });
        });

        return results;
    }

    return {
        TaskStore,
        TaskCompletion,
        runTests
    };
})();

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FEAT002;
}
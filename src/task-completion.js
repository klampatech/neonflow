/**
 * NEONFLOW - Task Completion Module
 * 
 * Feature: FEAT-002 - Mark tasks as complete with satisfying visual feedback
 * 
 * Acceptance Criteria:
 * - AC-004: Given user clicks checkbox on incomplete task When task completion triggers 
 *           Then visual strike-through appears with particle animation
 * 
 * Edge Cases:
 * - Completing already complete task
 * - Multiple rapid completions
 */

const TaskCompletion = (function() {
    'use strict';

    /**
     * Task Completion handler with animations
     * @param {TaskStore} store - The task store instance
     */
    function TaskCompletionHandler(store) {
        this.store = store;
        this.particles = [];
        this.animationCallbacks = [];
        this.onCompleteCallbacks = [];
        this.debounceTimers = new Map();
        
        // Animation configuration
        this.config = {
            completionDuration: 400,
            uncompleteDuration: 300,
            debounceWindow: 100,
            particleCount: 8,
            particleColors: ['#c8ff00', '#00f0ff', '#ff2d6b'], // Electric Lime, Cyan, Hot Pink
            particleGravity: 200
        };
    }

    /**
     * Create particle effects for completion animation
     * @param {string} taskId - The task ID
     * @param {Object} position - Position {x, y} for particle origin
     * @returns {Array} Array of particle objects
     */
    TaskCompletionHandler.prototype.createParticles = function(taskId, position) {
        const particles = [];
        const count = this.config.particleCount;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 50 + Math.random() * 50;
            
            particles.push({
                id: 'particle-' + Date.now() + '-' + i,
                taskId: taskId,
                x: position.x,
                y: position.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: this.config.particleColors[Math.floor(Math.random() * this.config.particleColors.length)]
            });
        }
        
        this.particles.push(...particles);
        return particles;
    };

    /**
     * Update particle animations (call each animation frame)
     * @param {number} deltaTime - Time since last update in seconds
     */
    TaskCompletionHandler.prototype.updateParticles = function(deltaTime) {
        const gravity = this.config.particleGravity;
        const decay = 1.25;
        
        this.particles = this.particles.filter(function(p) {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += gravity * deltaTime;
            p.life -= deltaTime * decay;
            return p.life > 0;
        });
    };

    /**
     * Complete a task with visual feedback
     * @param {string} taskId - The task ID to complete
     * @param {Object} position - Optional position for particle animation
     * @returns {Object} Result object with success status and animations
     */
    TaskCompletionHandler.prototype.completeTask = function(taskId, position) {
        position = position || { x: 0, y: 0 };
        
        var task = this.store.getTask(taskId);
        if (!task) {
            return { success: false, error: 'Task not found' };
        }

        // Edge case: Already complete
        if (task.completed) {
            return { 
                success: false, 
                error: 'Task already completed',
                edgeCase: 'already_complete'
            };
        }

        // Update task in store
        var updatedTask = this.store.updateTask(taskId, { completed: true });

        // Create animation result
        var animationResult = {
            strikeThrough: true,
            particles: this.createParticles(taskId, position),
            duration: this.config.completionDuration
        };

        // Notify animation subscribers
        this.animationCallbacks.forEach(function(cb) {
            cb('complete', taskId, animationResult);
        });
        
        // Notify completion subscribers
        this.onCompleteCallbacks.forEach(function(cb) {
            cb(updatedTask);
        });

        return {
            success: true,
            task: updatedTask,
            animations: animationResult
        };
    };

    /**
     * Handle rapid completion attempts with debouncing
     * @param {string} taskId - The task ID
     * @param {Object} position - Optional position for particle animation
     * @returns {Object} Result object
     */
    TaskCompletionHandler.prototype.rapidComplete = function(taskId, position) {
        var debounceKey = 'rapid-' + taskId;
        var self = this;
        
        // Check debounce
        if (this.debounceTimers.has(debounceKey)) {
            return {
                success: false,
                error: 'Operation debounced',
                edgeCase: 'rapid_completion'
            };
        }

        // Set debounce timer
        var timerId = setTimeout(function() {
            self.debounceTimers.delete(debounceKey);
        }, this.config.debounceWindow);
        
        this.debounceTimers.set(debounceKey, timerId);

        return this.completeTask(taskId, position);
    };

    /**
     * Uncomplete a task (reverse the completion)
     * @param {string} taskId - The task ID to uncomplete
     * @returns {Object} Result object
     */
    TaskCompletionHandler.prototype.uncompleteTask = function(taskId) {
        var task = this.store.getTask(taskId);
        if (!task) {
            return { success: false, error: 'Task not found' };
        }

        // Edge case: Not complete
        if (!task.completed) {
            return {
                success: false,
                error: 'Task is not completed',
                edgeCase: 'not_complete'
            };
        }

        var updatedTask = this.store.updateTask(taskId, { completed: false });
        
        var animationResult = {
            strikeThrough: false,
            duration: this.config.uncompleteDuration
        };

        this.animationCallbacks.forEach(function(cb) {
            cb('uncomplete', taskId, animationResult);
        });
        
        this.onCompleteCallbacks.forEach(function(cb) {
            cb(updatedTask);
        });

        return {
            success: true,
            task: updatedTask,
            animations: animationResult
        };
    };

    /**
     * Subscribe to animation events
     * @param {Function} callback - Function(type, taskId, result)
     */
    TaskCompletionHandler.prototype.onAnimation = function(callback) {
        this.animationCallbacks.push(callback);
    };

    /**
     * Subscribe to completion events
     * @param {Function} callback - Function(task)
     */
    TaskCompletionHandler.prototype.onComplete = function(callback) {
        this.onCompleteCallbacks.push(callback);
    };

    /**
     * Get all currently active particles
     * @returns {Array} Active particle array
     */
    TaskCompletionHandler.prototype.getActiveParticles = function() {
        return this.particles.slice();
    };

    /**
     * Clear all active particles
     */
    TaskCompletionHandler.prototype.clearParticles = function() {
        this.particles = [];
    };

    /**
     * Calculate visual state for a task based on completion status
     * @param {Object} task - The task object
     * @returns {Object} Visual state properties
     */
    TaskCompletionHandler.getVisualState = function(task) {
        return {
            textDecoration: task.completed ? 'line-through' : 'none',
            opacity: task.completed ? 0.5 : 1.0,
            completed: task.completed
        };
    };

    return TaskCompletionHandler;
})();

// Export for Node.js / module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskCompletion;
}
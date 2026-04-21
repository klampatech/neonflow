/**
 * NeonFlow - Task Completion Animation Module
 * Handles visual effects for task completion including strike-through and particle animations
 */

class TaskCompletionAnimations {
  constructor() {
    this.particles = [];
    this.animationFrame = null;
    this.initParticleCanvas();
  }

  initParticleCanvas() {
    // Create canvas for particle effects if not exists
    if (!document.querySelector('.particle-canvas')) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'particle-canvas';
      this.canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    } else {
      this.canvas = document.querySelector('.particle-canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Create and trigger particle animation at a position
  createParticles(x, y, count = 8) {
    const colors = ['#c8ff00', '#00f0ff', '#ff2d6b', '#ff9500'];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
      const speed = 80 + Math.random() * 60;
      
      const particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50, // Initial upward bias
        radius: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.02 + Math.random() * 0.01
      };
      
      this.particles.push(particle);
    }

    // Start animation loop if not running
    if (!this.animationFrame) {
      this.animate();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const gravity = 300;
    const deltaTime = 1 / 60;

    this.particles = this.particles.filter(p => {
      // Update physics
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += gravity * deltaTime;
      p.life -= p.decay;

      // Draw particle
      if (p.life > 0) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrame = null;
    }
  }

  // Apply strike-through animation to a task element
  applyStrikeThrough(taskElement) {
    const title = taskElement.querySelector('.task-title');
    if (!title || title.classList.contains('strike-through')) return;

    // Add strike-through class with animation
    title.classList.add('strike-through', 'strike-animating');
    
    // Add glow effect
    taskElement.classList.add('completion-glow');
    
    // Remove animation class after completion
    setTimeout(() => {
      title.classList.remove('strike-animating');
    }, 400);
    
    setTimeout(() => {
      taskElement.classList.remove('completion-glow');
    }, 600);
  }

  // Remove strike-through (for uncompleting)
  removeStrikeThrough(taskElement) {
    const title = taskElement.querySelector('.task-title');
    if (title) {
      title.classList.remove('strike-through');
    }
    taskElement.classList.remove('completion-glow');
  }

  // Handle task completion with all visual effects
  animateCompletion(taskElement, position = null) {
    // Get position for particles
    const rect = taskElement.getBoundingClientRect();
    const particleX = position?.x ?? rect.left + rect.width / 2;
    const particleY = position?.y ?? rect.top + rect.height / 2;

    // Trigger particle animation
    this.createParticles(particleX, particleY, 10);

    // Apply strike-through to text
    this.applyStrikeThrough(taskElement);

    // Add completion animation class
    taskElement.classList.add('task-completed-animating');
    setTimeout(() => {
      taskElement.classList.remove('task-completed-animating');
      taskElement.classList.add('task-completed');
    }, 300);
  }

  // Handle task uncomplete animation
  animateUncomplete(taskElement) {
    this.removeStrikeThrough(taskElement);
    taskElement.classList.add('task-uncompleting');
    
    setTimeout(() => {
      taskElement.classList.remove('task-uncompleting', 'task-completed');
    }, 300);
  }

  // Get current active particles (for testing)
  getActiveParticles() {
    return [...this.particles];
  }

  // Clear all particles (for testing)
  clearParticles() {
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

/**
 * TaskCompletionHandler - Wraps TaskCompletionAnimations with state management
 * Handles edge cases like completing already complete tasks
 */
class TaskCompletionHandler {
  constructor() {
    this.animations = new TaskCompletionAnimations();
    this.completedTasks = new Map(); // taskId -> { completed: true, timestamp }
    this.debounceTimers = new Map();
    this.config = {
      completionDuration: 400,
      particleCount: 10
    };
  }

  /**
   * Complete a task with visual effects
   * @param {string} taskId - The task ID to complete
   * @param {Object} position - Optional position for particle effect
   * @returns {Object} Result with success status and edge case info
   */
  completeTask(taskId, position = null) {
    // Edge Case: Already complete task
    if (this.completedTasks.has(taskId)) {
      return {
        success: false,
        error: 'Task already completed',
        edgeCase: 'already_complete',
        taskId
      };
    }

    // Mark as completed
    this.completedTasks.set(taskId, {
      completed: true,
      timestamp: Date.now()
    });

    // Trigger animations via the TaskCompletionAnimations instance
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      this.animations.animateCompletion(taskElement, position);
    }

    return {
      success: true,
      taskId,
      animations: {
        strikeThrough: true,
        particles: true,
        duration: this.config.completionDuration
      }
    };
  }

  /**
   * Handle rapid completion attempts with debouncing
   * @param {string} taskId - The task ID
   * @param {Object} position - Optional position for particle effect
   * @returns {Object} Result with success status
   */
  rapidComplete(taskId, position = null) {
    const debounceKey = `rapid-${taskId}`;
    
    if (this.debounceTimers.has(debounceKey)) {
      return {
        success: false,
        error: 'Operation debounced',
        edgeCase: 'rapid_completion',
        taskId
      };
    }

    // Set debounce timer (100ms)
    const timerId = setTimeout(() => {
      this.debounceTimers.delete(debounceKey);
    }, 100);
    this.debounceTimers.set(debounceKey, timerId);

    return this.completeTask(taskId, position);
  }

  /**
   * Uncomplete a task (remove completion)
   * @param {string} taskId - The task ID to uncomplete
   * @returns {Object} Result with success status
   */
  uncompleteTask(taskId) {
    if (!this.completedTasks.has(taskId)) {
      return {
        success: false,
        error: 'Task is not completed',
        edgeCase: 'not_complete',
        taskId
      };
    }

    this.completedTasks.delete(taskId);

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      this.animations.animateUncomplete(taskElement);
    }

    return {
      success: true,
      taskId,
      animations: {
        strikeThrough: false,
        duration: 300
      }
    };
  }

  /**
   * Check if a task is completed
   * @param {string} taskId - The task ID to check
   * @returns {boolean} True if task is completed
   */
  isTaskCompleted(taskId) {
    return this.completedTasks.has(taskId);
  }

  /**
   * Get all completed task IDs
   * @returns {string[]} Array of completed task IDs
   */
  getCompletedTaskIds() {
    return Array.from(this.completedTasks.keys());
  }

  /**
   * Reset all state (for testing)
   */
  reset() {
    this.completedTasks.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.animations.clearParticles();
  }
}

// Singleton instance
window.taskCompletionAnimations = new TaskCompletionAnimations();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TaskCompletionAnimations, TaskCompletionHandler };
}
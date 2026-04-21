/**
 * NeonFlow - Task Deletion Handler
 * FEAT-003: Delete tasks with confirmation animation
 * 
 * Handles task deletion with confirmation dialog and glitch effect
 */

class TaskDeletionAnimations {
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
        const progress = elapsed / this.glitchDuration;
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

    hasGlitch(taskId) {
        return this.activeEffects.has(taskId);
    }

    isGlitchActive(taskId) {
        return this.hasGlitch(taskId) && this.getGlitchState(taskId)?.active;
    }

    getDuration() {
        return this.glitchDuration;
    }

    getFrames() {
        return this.glitchFrames;
    }
}

// Make available globally
window.TaskDeletionAnimations = TaskDeletionAnimations;

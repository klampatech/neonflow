/**
 * NeonFlow UI - Task Creation Module
 * Handles quick-add bar and full task creation modal with neon effects
 */

class TaskCreationUI {
  constructor(store) {
    this.store = store;
    this.modalOpen = false;
    this.initQuickAdd();
    this.initTaskModal();
    this.bindEvents();
  }

  initQuickAdd() {
    // Create quick-add bar if not exists
    let quickAdd = document.querySelector('.quick-add-bar');
    if (!quickAdd) {
      const container = document.querySelector('#app-main') || document.body;
      quickAdd = document.createElement('input');
      quickAdd.type = 'text';
      quickAdd.className = 'quick-add-bar';
      quickAdd.placeholder = this.getPlaceholderText();
      
      // Insert at top of task list
      const taskList = container.querySelector('.task-list');
      if (taskList) {
        container.insertBefore(quickAdd, taskList);
      } else {
        container.appendChild(quickAdd);
      }
    }
    this.quickAddBar = quickAdd;
  }

  initTaskModal() {
    // Create modal container
    const existingModal = document.querySelector('.task-modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    this.modalOverlay = document.createElement('div');
    this.modalOverlay.className = 'task-modal-overlay';
    this.modalOverlay.innerHTML = this.getModalHTML();
    document.body.appendChild(this.modalOverlay);

    this.modal = this.modalOverlay.querySelector('.task-modal');
    this.titleInput = this.modal.querySelector('.task-title-input');
    this.descriptionInput = this.modal.querySelector('.task-description-input');
    this.dueDateInput = this.modal.querySelector('.task-due-date-input');
    this.addButton = this.modal.querySelector('.btn-add-task');
    this.cancelButton = this.modal.querySelector('.btn-cancel');

    // Set default date to today
    this.dueDateInput.valueAsDate = new Date();
  }

  getPlaceholderText() {
    const texts = [
      'Add a task... (press Enter)',
      'What needs doing?',
      'Next up...'
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  getModalHTML() {
    return `
      <div class="task-modal" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title" class="modal-title">Add New Task</h2>
        <form id="task-creation-form">
          <div class="form-group">
            <label for="task-title">Title</label>
            <input type="text" 
                   id="task-title" 
                   class="task-title-input" 
                   placeholder="What needs to be done?"
                   required
                   maxlength="200">
            <span class="error-message" data-error="title-required" style="display: none;">
              Task title is required
            </span>
          </div>
          
          <div class="form-group">
            <label for="task-description">Description</label>
            <textarea id="task-description" 
                      class="task-description-input" 
                      rows="4" 
                      placeholder="Add details..."></textarea>
          </div>
          
          <div class="form-group">
            <label>Priority</label>
            <div class="priority-options">
              <label class="priority-option">
                <input type="radio" name="priority" value="low">
                <span class="priority-label priority-low">Low</span>
              </label>
              <label class="priority-option">
                <input type="radio" name="priority" value="medium" checked>
                <span class="priority-label priority-medium">Medium</span>
              </label>
              <label class="priority-option">
                <input type="radio" name="priority" value="high">
                <span class="priority-label priority-high">High</span>
              </label>
              <label class="priority-option">
                <input type="radio" name="priority" value="urgent">
                <span class="priority-label priority-urgent">Urgent</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="task-due-date">Due Date</label>
            <input type="date" 
                   id="task-due-date" 
                   class="task-due-date-input">
          </div>
          
          <div class="form-group">
            <label for="task-list">List</label>
            <select id="task-list" class="task-list-select">
              <!-- Populated dynamically -->
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-add-task">Add Task</button>
          </div>
        </form>
      </div>
    `;
  }

  bindEvents() {
    // Quick-add keyboard events
    this.quickAddBar.addEventListener('keydown', (e) => this.handleQuickAddKeydown(e));
    
    // Modal form events
    const form = this.modal.querySelector('#task-creation-form');
    form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Cancel button
    this.cancelButton.addEventListener('click', () => this.closeModal());
    
    // Close on overlay click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOpen) {
        this.closeModal();
      }
    });

    // Modal open button (header)
    const newTaskBtn = document.querySelector('.btn-new-task');
    if (newTaskBtn) {
      newTaskBtn.addEventListener('click', () => this.openModal());
    }

    // Listen for store events
    this.store.on('store:task:added', (task) => this.onTaskAdded(task));
  }

  handleQuickAddKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const title = this.quickAddBar.value.trim();
      
      if (title) {
        const task = this.store.addTask({ title });
        if (task) {
          this.quickAddBar.value = '';
          this.flashSuccess();
        }
      } else {
        this.flashError();
      }
    } else if (e.key === 'Escape') {
      this.quickAddBar.value = '';
    } else if (e.key === 'Tab' && e.shiftKey && this.quickAddBar.value.trim()) {
      // Tab + Shift + Enter opens full modal
      e.preventDefault();
      this.openModal(this.quickAddBar.value.trim());
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const title = this.titleInput.value.trim();
    
    if (!title) {
      this.showError('title-required');
      this.titleInput.focus();
      return;
    }

    // Gather form data
    const selectedPriority = this.modal.querySelector('input[name="priority"]:checked');
    const taskData = {
      title: title,
      description: this.descriptionInput.value.trim(),
      priority: selectedPriority ? selectedPriority.value : 'medium',
      dueDate: this.dueDateInput.value || null,
      listId: this.modal.querySelector('.task-list-select').value
    };

    const task = this.store.addTask(taskData);
    if (task) {
      this.closeModal();
      this.openModalForTask(task); // Trigger glow animation
    }
  }

  showError(errorType) {
    const errorEl = this.modal.querySelector(`[data-error="${errorType}"]`);
    if (errorEl) {
      errorEl.style.display = 'block';
      this.titleInput.classList.add('input-error');
    }
  }

  hideErrors() {
    const errorEls = this.modal.querySelectorAll('.error-message');
    errorEls.forEach(el => el.style.display = 'none');
    this.titleInput.classList.remove('input-error');
  }

  openModal(prefillTitle = '') {
    this.modalOpen = true;
    this.hideErrors();
    
    // Populate list dropdown
    const listSelect = this.modal.querySelector('.task-list-select');
    const lists = this.store.getLists();
    listSelect.innerHTML = lists
      .filter(l => !l.isSmartList || ['my-day', 'planned'].includes(l.id))
      .map(l => `<option value="${l.id}" ${l.id === this.store.getActiveListId() ? 'selected' : ''}>${l.name}</option>`)
      .join('');

    // Set prefill if provided
    if (prefillTitle) {
      this.titleInput.value = prefillTitle;
    } else {
      this.titleInput.value = '';
    }
    
    // Reset form
    this.descriptionInput.value = '';
    this.dueDateInput.value = '';
    this.modal.querySelector('input[name="priority"][value="medium"]').checked = true;

    // Animate open
    this.modalOverlay.style.display = 'flex';
    requestAnimationFrame(() => {
      this.modalOverlay.classList.add('modal-open');
      this.modal.classList.add('modal-visible');
    });

    // Focus title
    this.titleInput.focus();
  }

  closeModal() {
    this.modalOpen = false;
    this.modalOverlay.classList.remove('modal-open');
    this.modal.classList.remove('modal-visible');
    
    setTimeout(() => {
      this.modalOverlay.style.display = 'none';
    }, 300);

    // Return focus to quick-add bar
    this.quickAddBar.focus();
  }

  flashSuccess() {
    this.quickAddBar.classList.add('flash-success');
    setTimeout(() => {
      this.quickAddBar.classList.remove('flash-success');
    }, 300);
  }

  flashError() {
    this.quickAddBar.classList.add('flash-error');
    setTimeout(() => {
      this.quickAddBar.classList.remove('flash-error');
    }, 300);
  }

  openModalForTask(task) {
    // This can be used to highlight a newly created task
    const taskCard = document.querySelector(`.task-card[data-id="${task.id}"]`);
    if (taskCard) {
      taskCard.classList.add('new-task-glow');
      setTimeout(() => {
        taskCard.classList.remove('new-task-glow');
      }, 2000);
    }
  }

  onTaskAdded(task) {
    // Trigger visual feedback for new task
    this.openModalForTask(task);
  }

  // Public method to trigger modal from external button
  showNewTaskModal() {
    this.openModal();
  }
}

// Make TaskCreationUI available globally
window.TaskCreationUI = TaskCreationUI;
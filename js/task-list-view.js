/**
 * NeonFlow - Task List View with Neon Effects
 * Handles rendering tasks with visual effects and animations
 */

class TaskListView {
  constructor(store, containerSelector) {
    this.store = store;
    this.container = document.querySelector(containerSelector) || document.querySelector('#app-main');
    this.animatingTasks = new Set();
    
    this.init();
    this.bindEvents();
  }

  init() {
    // Create task list container structure
    this.render();
    
    // Listen for store changes
    this.store.on('store:task:added', (task) => this.onTaskAdded(task));
    this.store.on('store:task:updated', (task) => this.onTaskUpdated(task));
    this.store.on('store:task:deleted', (task) => this.onTaskDeleted(task));
    this.store.on('store:list:activated', (data) => this.onListChanged(data));
  }

  render() {
    // Ensure basic structure exists
    if (!this.container.querySelector('.quick-add-bar')) {
      this.renderQuickAddBar();
    }
    
    if (!this.container.querySelector('.task-list-header')) {
      this.renderListHeader();
    }
    
    if (!this.container.querySelector('.task-list')) {
      const taskList = document.createElement('div');
      taskList.className = 'task-list';
      this.container.appendChild(taskList);
    }
  }

  renderQuickAddBar() {
    const quickAddBar = document.createElement('input');
    quickAddBar.type = 'text';
    quickAddBar.className = 'quick-add-bar';
    quickAddBar.placeholder = 'Add a task... (press Enter)';
    quickAddBar.setAttribute('aria-label', 'Add new task');
    
    // Insert at top
    if (this.container.firstChild) {
      this.container.insertBefore(quickAddBar, this.container.firstChild);
    } else {
      this.container.appendChild(quickAddBar);
    }
    
    // Bind quick-add behavior
    quickAddBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const title = quickAddBar.value.trim();
        if (title) {
          this.store.addTask({ title });
          quickAddBar.value = '';
          this.flashElement(quickAddBar, 'success');
        } else {
          this.flashElement(quickAddBar, 'error');
        }
      } else if (e.key === 'Escape') {
        quickAddBar.value = '';
      }
    });
  }

  renderListHeader() {
    const activeList = this.store.getLists().find(l => l.id === this.store.getActiveListId());
    if (!activeList) return;

    const header = document.createElement('div');
    header.className = 'task-list-header';
    header.innerHTML = `
      <h1 class="list-name">${activeList.name}</h1>
      <span class="task-count">0 tasks</span>
    `;
    
    // Insert after quick-add bar
    const quickAdd = this.container.querySelector('.quick-add-bar');
    if (quickAdd && quickAdd.nextSibling) {
      this.container.insertBefore(header, quickAdd.nextSibling);
    } else if (quickAdd) {
      this.container.appendChild(header);
    }
  }

  renderTasks() {
    const taskList = this.container.querySelector('.task-list');
    if (!taskList) return;

    const tasks = this.store.getTasks(this.store.getActiveListId());
    const activeList = this.store.getLists().find(l => l.id === this.store.getActiveListId());
    
    // Update header
    const header = this.container.querySelector('.task-list-header');
    if (header) {
      header.querySelector('.list-name').textContent = activeList?.name || 'Tasks';
      header.querySelector('.task-count').textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    }

    // Clear and rebuild
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      taskList.innerHTML = this.renderEmptyState();
      return;
    }

    // Render active (incomplete) tasks
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    activeTasks.forEach((task, index) => {
      const card = this.createTaskCard(task);
      card.style.animationDelay = `${index * 50}ms`;
      taskList.appendChild(card);
    });

    // Completed section
    if (completedTasks.length > 0) {
      const completedSection = document.createElement('div');
      completedSection.className = 'completed-section';
      completedSection.innerHTML = `
        <button class="completed-header">
          <span class="checkmark">✓</span>
          <span>${completedTasks.length} completed</span>
        </button>
      `;

      const completedList = document.createElement('div');
      completedList.className = 'completed-tasks';
      completedTasks.forEach(task => {
        completedList.appendChild(this.createTaskCard(task));
      });

      completedSection.appendChild(completedList);
      taskList.appendChild(completedSection);
    }
  }

  createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'task-completed' : ''} priority-${task.priority}`;
    card.dataset.id = task.id;

    // Priority border color
    const priorityColors = {
      low: 'var(--color-muted)',
      medium: 'var(--color-purple)',
      high: 'var(--color-orange)',
      urgent: 'var(--color-pink)'
    };

    // Due date display
    let dueDateBadge = '';
    if (task.dueDate) {
      const dueInfo = this.formatDueDate(task.dueDate);
      dueDateBadge = `<span class="due-date-badge ${dueInfo.class}">${dueInfo.text}</span>`;
    }

    // Completion checkbox
    const checkbox = `
      <button class="task-checkbox ${task.completed ? 'checked' : ''}" 
              aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
              data-action="toggle-complete">
        ${task.completed ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>' : ''}
      </button>
    `;

    // Priority indicator
    const priorityIndicator = `
      <span class="priority-indicator" style="background-color: ${priorityColors[task.priority]}"></span>
    `;

    card.innerHTML = `
      ${priorityIndicator}
      ${checkbox}
      <div class="task-content">
        <span class="task-title">${task.title}</span>
        ${dueDateBadge}
      </div>
      <button class="task-menu-btn" aria-label="Task options">⋮</button>
    `;

    // Bind events
    const checkboxEl = card.querySelector('.task-checkbox');
    checkboxEl.addEventListener('click', () => this.toggleTaskComplete(task.id));

    const titleEl = card.querySelector('.task-title');
    titleEl.addEventListener('dblclick', () => this.startInlineEdit(card, task));

    // Add entrance animation class
    card.classList.add('task-entrance');
    setTimeout(() => card.classList.remove('task-entrance'), 300);

    return card;
  }

  formatDueDate(dateStr) {
    const dueDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate < today) {
      return { text: 'Overdue', class: 'overdue' };
    } else if (dueDate.getTime() === today.getTime()) {
      return { text: 'Today', class: 'today' };
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return { text: 'Tomorrow', class: 'tomorrow' };
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const isThisWeek = dueDate - today < 7 * 24 * 60 * 60 * 1000;
      
      if (isThisWeek) {
        return { text: days[dueDate.getDay()], class: 'this-week' };
      } else if (dueDate.getFullYear() === today.getFullYear()) {
        return { text: `${months[dueDate.getMonth()]} ${dueDate.getDate()}`, class: 'future' };
      } else {
        return { text: `${months[dueDate.getMonth()]} ${dueDate.getDate()}, ${dueDate.getFullYear()}`, class: 'future' };
      }
    }
  }

  toggleTaskComplete(taskId) {
    const task = this.store.getTask(taskId);
    const card = this.container.querySelector(`.task-card[data-id="${taskId}"]`);
    
    if (task && card) {
      if (!task.completed) {
        // Trigger visual completion animation
        if (window.taskCompletionAnimations) {
          window.taskCompletionAnimations.animateCompletion(card);
        }
        // Small delay before updating store state
        setTimeout(() => {
          this.store.updateTask(taskId, { completed: true });
        }, 100);
      } else {
        // Trigger uncomplete animation
        if (window.taskCompletionAnimations) {
          window.taskCompletionAnimations.animateUncomplete(card);
        }
        setTimeout(() => {
          this.store.updateTask(taskId, { completed: false });
        }, 100);
      }
    }
  }

  startInlineEdit(card, task) {
    const titleEl = card.querySelector('.task-title');
    const currentTitle = task.title;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentTitle;
    
    titleEl.replaceWith(input);
    input.focus();
    input.select();

    const finishEdit = (save) => {
      const newTitle = input.value.trim();
      if (save && newTitle && newTitle !== currentTitle) {
        this.store.updateTask(task.id, { title: newTitle });
      } else if (!newTitle) {
        // Revert and flash error
        this.store.updateTask(task.id, { title: currentTitle });
        card.classList.add('flash-error');
        setTimeout(() => card.classList.remove('flash-error'), 300);
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        finishEdit(false);
      }
    });

    input.addEventListener('blur', () => finishEdit(true));
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="12" y="8" width="40" height="48" rx="4" />
            <line x1="20" y1="20" x2="44" y2="20" />
            <line x1="20" y1="32" x2="44" y2="32" />
            <line x1="20" y1="44" x2="36" y2="44" />
          </svg>
        </div>
        <h3 class="empty-title">No tasks yet</h3>
        <p class="empty-description">Add your first task to get started</p>
        <button class="btn-new-task-empty">+ New Task</button>
      </div>
    `;
  }

  flashElement(el, type) {
    el.classList.add(`flash-${type}`);
    setTimeout(() => el.classList.remove(`flash-${type}`), 300);
  }

  onTaskAdded(task) {
    this.renderTasks();
    
    // Add neon glow effect to new task
    const newCard = this.container.querySelector(`.task-card[data-id="${task.id}"]`);
    if (newCard) {
      newCard.classList.add('new-task-glow');
      setTimeout(() => newCard.classList.remove('new-task-glow'), 2000);
    }
  }

  onTaskUpdated(task) {
    this.renderTasks();
  }

  onTaskDeleted(task) {
    const card = this.container.querySelector(`.task-card[data-id="${task.id}"]`);
    if (card) {
      card.classList.add('task-deleting');
      setTimeout(() => this.renderTasks(), 250);
    }
  }

  onListChanged(data) {
    this.renderTasks();
  }

  bindEvents() {
    // New task button from empty state
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-new-task-empty')) {
        window.dispatchEvent(new CustomEvent('neonflow:open-task-modal'));
      }
    });

    // Delegate task card interactions
    this.container.addEventListener('click', (e) => {
      const menuBtn = e.target.closest('.task-menu-btn');
      if (menuBtn) {
        // Open task menu (can be expanded)
        menuBtn.classList.toggle('active');
      }
    });
  }
}

// Make TaskListView available globally
window.TaskListView = TaskListView;
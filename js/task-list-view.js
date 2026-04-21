/**
 * NeonFlow - Task List View with Neon Effects
 * Handles rendering tasks with visual effects and animations
 */

class TaskListView {
  constructor(store, containerSelector) {
    this.store = store;
    this.container = document.querySelector(containerSelector) || document.querySelector('#app-main');
    this.animatingTasks = new Set();
    this.openMenuId = null;
    this.draggedCard = null;
    
    this.init();
    this.bindEvents();
  }

  renderNoResultsState() {
    return `
      <div class="no-results-state">
        <div class="no-results-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3 class="no-results-title">No tasks found</h3>
        <p class="no-results-description">Try a different search term</p>
      </div>
    `;
  }

  init() {
    this.render();
    this.initSearch();
    
    this.store.on('store:task:added', (task) => this.onTaskAdded(task));
    this.store.on('store:task:updated', (task) => this.onTaskUpdated(task));
    this.store.on('store:task:deleted', (task) => this.onTaskDeleted(task));
    this.store.on('store:list:activated', (data) => this.onListChanged(data));
    this.store.on('store:search:changed', () => this.renderTasks());
  }

  initSearch() {
    const searchInput = document.querySelector('.global-search');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.store.setSearchQuery(e.target.value);
          this.renderTasks();
        }, 200);
      });
    }
  }

  render() {
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
    
    // Render the actual tasks
    this.renderTasks();
  }

  renderQuickAddBar() {
    const quickAddBar = document.createElement('input');
    quickAddBar.type = 'text';
    quickAddBar.className = 'quick-add-bar';
    quickAddBar.placeholder = 'Add a task... (press Enter)';
    quickAddBar.setAttribute('aria-label', 'Add new task');
    
    if (this.container.firstChild) {
      this.container.insertBefore(quickAddBar, this.container.firstChild);
    } else {
      this.container.appendChild(quickAddBar);
    }
    
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

    const tasks = this.store.getTasks(this.store.getActiveListId(), this.store.getSearchQuery());
    const activeList = this.store.getLists().find(l => l.id === this.store.getActiveListId());
    
    const header = this.container.querySelector('.task-list-header');
    if (header) {
      header.querySelector('.list-name').textContent = activeList?.name || 'Tasks';
      header.querySelector('.task-count').textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    }

    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      const allTasks = this.store.getTasks(this.store.getActiveListId());
      if (allTasks.length === 0) {
        taskList.innerHTML = this.renderEmptyState();
      } else {
        taskList.innerHTML = this.renderNoResultsState();
      }
      return;
    }

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    activeTasks.forEach((task, index) => {
      const card = this.createTaskCard(task);
      card.style.animationDelay = `${index * 50}ms`;
      this.initDragAndDrop(card);
      taskList.appendChild(card);
    });

    if (completedTasks.length > 0) {
      const completedSection = document.createElement('div');
      completedSection.className = 'completed-section expanded';
      completedSection.innerHTML = `
        <button class="completed-header expanded">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <span class="completed-count">${completedTasks.length}</span>
          <span>completed</span>
        </button>
        <div class="completed-tasks"></div>
      `;

      const completedList = completedSection.querySelector('.completed-tasks');
      completedTasks.forEach(task => {
        const card = this.createTaskCard(task);
        this.initDragAndDrop(card);
        completedList.appendChild(card);
      });

      const header = completedSection.querySelector('.completed-header');
      header.addEventListener('click', () => {
        completedSection.classList.toggle('expanded');
        header.classList.toggle('expanded');
      });

      taskList.appendChild(completedSection);
    }
  }

  createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'task-completed' : ''} priority-${task.priority}`;
    card.dataset.id = task.id;
    card.draggable = true;

    let dueDateBadge = '';
    if (task.dueDate) {
      const dueInfo = this.formatDueDate(task.dueDate);
      dueDateBadge = `<span class="due-date-badge ${dueInfo.class}">${dueInfo.text}</span>`;
    }

    const checkbox = `
      <button class="task-checkbox ${task.completed ? 'checked' : ''}" 
              aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
              data-action="toggle-complete">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    `;

    // Wrap menu in a positioned wrapper
    const menuWrapper = `
      <div class="task-menu-wrapper">
        <button class="task-menu-btn" aria-label="Task options" data-task-id="${task.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
        <div class="task-menu-dropdown" data-task-id="${task.id}">
          <div class="task-menu-item" data-action="edit" data-task-id="${task.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            <span>Edit</span>
          </div>
          <div class="task-menu-item danger" data-action="delete" data-task-id="${task.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            <span>Delete</span>
          </div>
        </div>
      </div>
    `;

    card.innerHTML = `
      ${checkbox}
      <div class="task-content">
        <span class="task-title">${this.escapeHtml(task.title)}</span>
        ${dueDateBadge}
      </div>
      ${menuWrapper}
    `;

    const checkboxEl = card.querySelector('.task-checkbox');
    checkboxEl.addEventListener('click', () => this.toggleTaskComplete(task.id));

    const titleEl = card.querySelector('.task-title');
    titleEl.addEventListener('dblclick', () => this.startInlineEdit(card, task));

    card.classList.add('task-entrance');
    setTimeout(() => card.classList.remove('task-entrance'), 300);

    return card;
  }

  initDragAndDrop(card) {
    let dragStarted = false;
    let dragTimeout = null;
    
    // Use a small delay before allowing drag start
    // This allows double-click on title to work without starting a drag
    const startDrag = (e) => {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
      }
      dragTimeout = setTimeout(() => {
        if (!dragStarted) {
          dragStarted = true;
          this.draggedCard = card;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.dataset.id);
        }
      }, 150);
    };
    
    card.addEventListener('mousedown', (e) => {
      // Don't start drag if clicking on checkbox or menu buttons
      if (e.target.closest('.task-checkbox') || e.target.closest('.task-menu-btn')) {
        return;
      }
      startDrag(e);
    });
    
    card.addEventListener('dragstart', (e) => {
      this.draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });

    card.addEventListener('dragend', () => {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
      }
      dragStarted = false;
      card.classList.remove('dragging');
      this.draggedCard = null;
      document.querySelectorAll('.task-card').forEach(c => {
        c.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      });
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (this.draggedCard && this.draggedCard !== card) {
        card.classList.add('drag-over');
        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        card.classList.remove('drag-over-top', 'drag-over-bottom');
        if (e.clientY < midY) {
          card.classList.add('drag-over-top');
        } else {
          card.classList.add('drag-over-bottom');
        }
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (this.draggedCard && this.draggedCard !== card) {
        const draggedId = this.draggedCard.dataset.id;
        const targetId = card.dataset.id;
        
        const rect = card.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2;
        
        this.reorderTasks(draggedId, targetId, insertBefore);
      }
      
      card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });
  }

  reorderTasks(draggedId, targetId, insertBefore) {
    const tasks = this.store.getTasks(this.store.getActiveListId());
    const draggedTask = tasks.find(t => t.id === draggedId);
    const targetTask = tasks.find(t => t.id === targetId);
    
    if (!draggedTask || !targetTask) return;
    
    // Calculate new order
    const targetOrder = targetTask.order;
    
    if (insertBefore) {
      // Insert before target
      const prevTask = tasks.find(t => t.order < targetOrder && t.id !== draggedId);
      if (prevTask) {
        // Place between prev and target
        const newOrder = (prevTask.order + targetOrder) / 2;
        this.store.updateTask(draggedId, { order: newOrder });
      } else {
        // Place at beginning
        const newOrder = targetOrder - 1;
        this.store.updateTask(draggedId, { order: newOrder });
      }
    } else {
      // Insert after target
      const nextTask = tasks.find(t => t.order > targetOrder && t.id !== draggedId);
      if (nextTask) {
        // Place between target and next
        const newOrder = (targetOrder + nextTask.order) / 2;
        this.store.updateTask(draggedId, { order: newOrder });
      } else {
        // Place at end
        const newOrder = targetOrder + 1;
        this.store.updateTask(draggedId, { order: newOrder });
      }
    }
  }

  toggleTaskMenu(taskId) {
    if (this.openMenuId && this.openMenuId !== taskId) {
      const prevDropdown = document.querySelector(`.task-menu-dropdown[data-task-id="${this.openMenuId}"]`);
      if (prevDropdown) {
        prevDropdown.classList.remove('open');
      }
    }

    const dropdown = document.querySelector(`.task-menu-dropdown[data-task-id="${taskId}"]`);
    
    if (dropdown) {
      // CSS handles positioning via absolute positioning within task-menu-wrapper
      dropdown.classList.toggle('open');
      this.openMenuId = dropdown.classList.contains('open') ? taskId : null;
    }
  }

  closeAllMenus() {
    document.querySelectorAll('.task-menu-dropdown.open').forEach(menu => {
      menu.classList.remove('open');
    });
    this.openMenuId = null;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        if (window.taskCompletionAnimations) {
          window.taskCompletionAnimations.animateCompletion(card);
        }
        setTimeout(() => {
          this.store.updateTask(taskId, { completed: true });
        }, 100);
      } else {
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
    if (!titleEl) {
      console.error('Could not find task title element');
      return;
    }
    
    const currentTitle = task.title;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentTitle;
    
    titleEl.replaceWith(input);
    input.focus();
    input.select();
    
    // Store reference for blur handler
    const originalTitle = titleEl;

    const finishEdit = (save) => {
      const newTitle = input.value.trim();
      if (save && newTitle && newTitle !== currentTitle) {
        this.store.updateTask(task.id, { title: newTitle });
      } else if (!newTitle) {
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

  confirmDelete(taskId) {
    const task = this.store.getTask(taskId);
    if (!task) return;

    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    overlay.innerHTML = `
      <div class="confirmation-dialog">
        <h3>Delete Task?</h3>
        <p>Are you sure you want to delete "${this.escapeHtml(task.title)}"? This action cannot be undone.</p>
        <div class="dialog-buttons">
          <button class="btn-cancel" data-action="cancel-delete">Cancel</button>
          <button class="btn-confirm-delete" data-action="confirm-delete" data-task-id="${taskId}">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'cancel-delete') {
        overlay.remove();
      } else if (action === 'confirm-delete') {
        const idToDelete = e.target.dataset.taskId;
        overlay.remove();
        this.store.deleteTask(idToDelete);
      }
    });
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="12" y2="17"/>
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
    const searchInput = document.querySelector('.global-search');
    if (searchInput) {
      searchInput.value = '';
    }
    this.store.setSearchQuery('');
    this.renderTasks();
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-new-task-empty')) {
        window.dispatchEvent(new CustomEvent('neonflow:open-task-modal'));
      }

      const menuBtn = e.target.closest('.task-menu-btn');
      if (menuBtn) {
        e.stopPropagation();
        const taskId = menuBtn.dataset.taskId;
        this.toggleTaskMenu(taskId);
      }

      const menuItem = e.target.closest('.task-menu-item');
      if (menuItem) {
        e.stopPropagation();
        const action = menuItem.dataset.action;
        const taskId = menuItem.dataset.taskId;
        
        this.closeAllMenus();

        if (action === 'edit') {
          // Open full modal for editing
          if (window.taskCreationUI) {
            window.taskCreationUI.openEditModal(taskId);
          }
        } else if (action === 'delete') {
          this.confirmDelete(taskId);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.task-menu-dropdown') && !e.target.closest('.task-menu-btn')) {
        this.closeAllMenus();
      }
    });
  }
}

window.TaskListView = TaskListView;

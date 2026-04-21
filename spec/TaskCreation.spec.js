describe('Task Creation - FEAT-001', function() {
  let store;
  let container;

  beforeEach(function() {
    // Reset localStorage
    localStorage.clear();
    
    // Initialize fresh store
    store = new Store();
    
    // Create test container
    container = document.createElement('div');
    container.id = 'app-main';
    document.body.appendChild(container);
  });

  afterEach(function() {
    document.body.removeChild(container);
  });

  describe('Quick-add bar', function() {
    it('should create task with neon glow effect when user enters title and presses Enter', function() {
      // Given: user is on main view
      const quickAddBar = document.createElement('input');
      quickAddBar.className = 'quick-add-bar';
      quickAddBar.placeholder = 'Add a task...';
      container.appendChild(quickAddBar);
      
      // When: user enters task title and presses Enter
      quickAddBar.value = 'Test task';
      const submitEvent = new Event('keydown');
      submitEvent.key = 'Enter';
      quickAddBar.dispatchEvent(submitEvent);
      
      // Then: task appears in list with neon glow effect
      const taskCard = container.querySelector('.task-card');
      expect(taskCard).not.toBeNull();
      expect(taskCard.style.boxShadow).toContain('c8ff00');
    });

    it('should clear input and show lime flash after adding task', function() {
      // Given: quick-add bar exists with input
      const quickAddBar = document.createElement('input');
      quickAddBar.className = 'quick-add-bar';
      container.appendChild(quickAddBar);
      quickAddBar.value = 'My new task';
      
      // When: user presses Enter
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      quickAddBar.dispatchEvent(event);
      
      // Then: input is cleared and flash effect applied
      expect(quickAddBar.value).toBe('');
      expect(quickAddBar.classList.contains('flash-success')).toBe(true);
    });

    it('should not create task when pressing Enter with empty input', function() {
      // Given: quick-add bar is empty
      const quickAddBar = document.createElement('input');
      quickAddBar.className = 'quick-add-bar';
      container.appendChild(quickAddBar);
      quickAddBar.value = '';
      
      // When: user presses Enter
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      quickAddBar.dispatchEvent(event);
      
      // Then: no task is created
      const tasks = store.getTasks('my-day');
      expect(tasks.length).toBe(0);
    });

    it('should not create task when pressing Enter with whitespace-only input', function() {
      // Given: quick-add bar has only whitespace
      const quickAddBar = document.createElement('input');
      quickAddBar.className = 'quick-add-bar';
      container.appendChild(quickAddBar);
      quickAddBar.value = '   ';
      
      // When: user presses Enter
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      quickAddBar.dispatchEvent(event);
      
      // Then: no task is created
      const tasks = store.getTasks('my-day');
      expect(tasks.length).toBe(0);
    });

    it('should clear input when pressing Escape without creating task', function() {
      // Given: user has typed in quick-add bar
      const quickAddBar = document.createElement('input');
      quickAddBar.className = 'quick-add-bar';
      container.appendChild(quickAddBar);
      quickAddBar.value = 'Some task';
      
      // When: user presses Escape
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      quickAddBar.dispatchEvent(event);
      
      // Then: input is cleared but no task created
      expect(quickAddBar.value).toBe('');
      const tasks = store.getTasks('my-day');
      expect(tasks.length).toBe(0);
    });
  });

  describe('Full task modal - creation', function() {
    it('should show error message when submitting empty title', function() {
      // Given: user clicks "Add Task" with empty title
      const modal = createTaskModal();
      document.body.appendChild(modal);
      
      const titleInput = modal.querySelector('.task-title-input');
      titleInput.value = '';
      
      const addButton = modal.querySelector('.btn-add-task');
      addButton.click();
      
      // Then: error message appears
      const errorMsg = modal.querySelector('.error-title-required');
      expect(errorMsg).not.toBeNull();
      expect(errorMsg.textContent).toContain('required');
    });

    it('should not create task when title is empty', function() {
      // Given: modal is open with empty title
      const modal = createTaskModal();
      document.body.appendChild(modal);
      
      const titleInput = modal.querySelector('.task-title-input');
      titleInput.value = '';
      
      // When: clicking add task
      const addButton = modal.querySelector('.btn-add-task');
      addButton.click();
      
      // Then: task is not created
      const tasks = store.getTasks('my-day');
      expect(tasks.length).toBe(0);
    });

    it('should close modal and create task when title is provided', function() {
      // Given: modal is open with valid title
      const modal = createTaskModal();
      document.body.appendChild(modal);
      
      const titleInput = modal.querySelector('.task-title-input');
      titleInput.value = 'Valid task title';
      
      // When: clicking add task
      const addButton = modal.querySelector('.btn-add-task');
      addButton.click();
      
      // Then: task is created and modal is closed
      const tasks = store.getTasks('my-day');
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Valid task title');
      expect(modal.style.display).toBe('none');
    });
  });

  describe('Task with due date', function() {
    it('should display due date with task when added', function() {
      // Given: user creates task with due date
      const task = store.addTask({
        title: 'Task with due date',
        dueDate: '2026-04-25',
        listId: 'my-day'
      });
      
      // When: task is added to list
      const taskCard = createTaskCardElement(task);
      container.appendChild(taskCard);
      
      // Then: due date is displayed
      const dueDateBadge = taskCard.querySelector('.due-date-badge');
      expect(dueDateBadge).not.toBeNull();
      expect(dueDateBadge.textContent).toContain('Apr 25');
    });

    it('should show "Today" badge for today\'s date', function() {
      // Given: task with today's date
      const today = new Date().toISOString().split('T')[0];
      const task = store.addTask({
        title: 'Today task',
        dueDate: today,
        listId: 'my-day'
      });
      
      // When: task card is rendered
      const taskCard = createTaskCardElement(task);
      
      // Then: shows "Today" badge
      const dueDateBadge = taskCard.querySelector('.due-date-badge');
      expect(dueDateBadge.textContent).toContain('Today');
    });

    it('should show "Overdue" badge for past dates', function() {
      // Given: task with past due date
      const task = store.addTask({
        title: 'Overdue task',
        dueDate: '2020-01-01',
        listId: 'my-day'
      });
      
      // When: task card is rendered
      const taskCard = createTaskCardElement(task);
      
      // Then: shows overdue indicator
      const overdueBadge = taskCard.querySelector('.due-date-badge.overdue');
      expect(overdueBadge).not.toBeNull();
      expect(overdueBadge.textContent).toContain('Overdue');
    });
  });

  describe('Neon glow effect', function() {
    it('should apply neon glow effect to newly added task card', function() {
      // Given: user adds a new task
      const task = store.addTask({
        title: 'Glowing task',
        listId: 'my-day'
      });
      
      // When: task card is rendered
      const taskCard = createTaskCardElement(task);
      taskCard.classList.add('new-task-animation');
      
      // Then: has neon glow effect
      const computedStyle = window.getComputedStyle(taskCard);
      expect(computedStyle.boxShadow).toContain('c8ff00');
    });

    it('should animate in with spring effect', function() {
      // Given: task added to store
      const task = store.addTask({
        title: 'Animated task',
        listId: 'my-day'
      });
      
      // When: task card animates in
      const taskCard = createTaskCardElement(task);
      taskCard.classList.add('task-entrance-animation');
      
      // Then: animation completes with correct properties
      expect(taskCard.style.animation).toContain('spring');
    });
  });

  describe('Error handling for empty title', function() {
    it('should show inline error for empty title in modal', function() {
      // Given: modal with empty title field
      const modal = createTaskModal();
      document.body.appendChild(modal);
      
      // When: submitting with empty title
      const form = modal.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      
      // Then: error is displayed inline
      const errorEl = modal.querySelector('[data-error="title-required"]');
      expect(errorEl).not.toBeNull();
      expect(errorEl.style.display).not.toBe('none');
    });

    it('should focus title input after validation error', function() {
      // Given: modal with empty title field
      const modal = createTaskModal();
      document.body.appendChild(modal);
      
      // When: submitting with empty title
      const form = modal.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      
      // Then: title input is focused
      const titleInput = modal.querySelector('.task-title-input');
      expect(document.activeElement).toBe(titleInput);
    });
  });

  // Helper functions
  function createTaskModal() {
    const modal = document.createElement('div');
    modal.className = 'task-modal';
    modal.innerHTML = `
      <form>
        <input type="text" class="task-title-input" placeholder="Task title">
        <span class="error-title-required" data-error="title-required" style="display:none">Task title is required</span>
        <input type="date" class="task-due-date-input">
        <button type="submit" class="btn-add-task">Add Task</button>
        <button type="button" class="btn-cancel">Cancel</button>
      </form>
    `;
    return modal;
  }

  function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.id = task.id;
    
    let dueDateDisplay = '';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let badgeClass = 'due-date-badge';
      let displayText = formatDate(dueDate);
      
      if (dueDate < today) {
        badgeClass += ' overdue';
        displayText = 'Overdue';
      } else if (dueDate.toDateString() === today.toDateString()) {
        displayText = 'Today';
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        displayText = 'Tomorrow';
      }
      
      dueDateDisplay = `<span class="${badgeClass}">${displayText}</span>`;
    }
    
    card.innerHTML = `
      <span class="task-title">${task.title}</span>
      ${dueDateDisplay}
    `;
    
    return card;
  }

  function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
});
/**
 * NeonFlow Store - Task Data Model and Management
 * Handles all CRUD operations with custom DOM events
 */
class Store {
  constructor() {
    this.state = {
      lists: [],
      tasks: [],
      activeListId: 'my-day',
      activeTaskId: null,
      searchQuery: '',
      filterState: {
        showCompleted: true,
        priorityFilter: null,
        dueDateFilter: null
      },
      schemaVersion: 1
    };
    
    this.listeners = {};
    this.init();
  }

  init() {
    // Try to load from localStorage
    const savedData = localStorage.getItem('neonflow-data');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        this.state = { ...this.state, ...parsed };
      } catch (e) {
        console.warn('Failed to parse saved data, using defaults');
        this.initDefaultState();
      }
    } else {
      this.initDefaultState();
    }

    // Set up auto-save with debounce
    this.saveTimeout = null;
  }

  initDefaultState() {
    // Create default smart lists
    const defaultLists = [
      { id: 'my-day', name: 'My Day', isDefault: true, isSmartList: true, createdAt: new Date().toISOString(), order: 0 },
      { id: 'important', name: 'Important', isDefault: true, isSmartList: true, createdAt: new Date().toISOString(), order: 1 },
      { id: 'planned', name: 'Planned', isDefault: true, isSmartList: true, createdAt: new Date().toISOString(), order: 2 },
      { id: 'all', name: 'All Tasks', isDefault: true, isSmartList: true, createdAt: new Date().toISOString(), order: 3 },
      { id: 'completed', name: 'Completed', isDefault: true, isSmartList: true, createdAt: new Date().toISOString(), order: 4 }
    ];

    // Create sample tasks for My Day
    const today = new Date().toISOString().split('T')[0];
    const sampleTasks = [
      {
        id: crypto.randomUUID(),
        title: 'Review project requirements',
        description: '',
        completed: false,
        priority: 'high',
        dueDate: today,
        listId: 'my-day',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
        tags: []
      },
      {
        id: crypto.randomUUID(),
        title: 'Set up development environment',
        description: '',
        completed: false,
        priority: 'medium',
        dueDate: null,
        listId: 'my-day',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 2,
        tags: []
      },
      {
        id: crypto.randomUUID(),
        title: 'Create initial wireframes',
        description: '',
        completed: true,
        priority: 'medium',
        dueDate: today,
        listId: 'my-day',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 3,
        tags: []
      }
    ];

    this.state.lists = defaultLists;
    this.state.tasks = sampleTasks;
    this.state.activeListId = 'my-day';
  }

  // Persistence
  save() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('neonflow-data', JSON.stringify(this.state));
        this.emit('store:saved');
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }, 300);
  }

  // Event handling
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
    // Also dispatch DOM event for broader compatibility
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  // Task operations
  getTasks(listId, searchQuery = '') {
    const list = this.state.lists.find(l => l.id === listId);
    
    if (!list) return [];
    
    // Smart list filtering
    if (list.isSmartList) {
      let tasks = this.getSmartListTasks(listId);
      
      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        tasks = tasks.filter(t => 
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      
      return tasks;
    }
    
    // Regular list - return tasks for that list
    let tasks = this.state.tasks
      .filter(t => t.listId === listId)
      .sort((a, b) => a.order - b.order);
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    return tasks;
  }

  // Get tasks without search filter (for counts)
  getTasksWithoutFilter(listId) {
    const list = this.state.lists.find(l => l.id === listId);
    
    if (!list) return [];
    
    if (list.isSmartList) {
      return this.getSmartListTasks(listId);
    }
    
    return this.state.tasks
      .filter(t => t.listId === listId)
      .sort((a, b) => a.order - b.order);
  }

  // Get overall stats for sidebar
  getStats() {
    const active = this.state.tasks.filter(t => !t.completed).length;
    const completed = this.state.tasks.filter(t => t.completed).length;
    return { active, completed };
  }

  setSearchQuery(query) {
    this.state.searchQuery = query;
    this.emit('store:search:changed', { query });
  }

  getSearchQuery() {
    return this.state.searchQuery;
  }

  getSmartListTasks(listId) {
    const today = new Date().toISOString().split('T')[0];
    
    switch (listId) {
      case 'my-day':
        // Tasks due today OR urgent priority
        return this.state.tasks
          .filter(t => t.dueDate === today || t.priority === 'urgent')
          .sort((a, b) => a.order - b.order);
      
      case 'important':
        // Note: would need isImportant flag - simplified here
        return this.state.tasks
          .filter(t => t.priority === 'high' || t.priority === 'urgent')
          .sort((a, b) => a.order - b.order);
      
      case 'planned':
        // Tasks with future due dates
        return this.state.tasks
          .filter(t => t.dueDate !== null)
          .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
      
      case 'all':
        return this.state.tasks
          .filter(t => !t.completed)
          .sort((a, b) => a.order - b.order);
      
      case 'completed':
        return this.state.tasks
          .filter(t => t.completed)
          .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      
      default:
        return [];
    }
  }

  getTask(id) {
    return this.state.tasks.find(t => t.id === id);
  }

  addTask(data) {
    // Validate title
    const title = (data.title || '').trim();
    if (!title) {
      this.emit('store:error', { message: 'Task title is required' });
      return null;
    }

    // Truncate if too long
    const truncatedTitle = title.substring(0, 200);
    
    // Calculate order (append to end)
    const listTasks = this.state.tasks.filter(t => t.listId === (data.listId || this.state.activeListId));
    const maxOrder = listTasks.length > 0 ? Math.max(...listTasks.map(t => t.order)) : 0;
    
    const task = {
      id: crypto.randomUUID(),
      title: truncatedTitle,
      description: data.description || '',
      completed: false,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || null,
      listId: data.listId || this.state.activeListId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: maxOrder + 1,
      tags: data.tags || []
    };

    this.state.tasks.push(task);
    this.save();
    this.emit('store:task:added', task);
    
    return task;
  }

  updateTask(id, data) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const task = this.state.tasks[index];
    
    // Handle title validation
    if (data.title !== undefined) {
      const title = data.title.trim();
      if (!title) {
        this.emit('store:error', { message: 'Task title is required' });
        return null;
      }
      data.title = title.substring(0, 200);
    }

    this.state.tasks[index] = {
      ...task,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.save();
    this.emit('store:task:updated', this.state.tasks[index]);
    
    return this.state.tasks[index];
  }

  deleteTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return false;

    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.save();
    this.emit('store:task:deleted', task);
    
    return true;
  }

  // List operations
  getLists() {
    return [...this.state.lists].sort((a, b) => a.order - b.order);
  }

  setActiveList(listId) {
    this.state.activeListId = listId;
    this.emit('store:list:activated', { listId });
  }

  getActiveListId() {
    return this.state.activeListId;
  }

  // State
  getState() {
    return this.state;
  }

  // Export/Import
  exportData() {
    return JSON.stringify({
      ...this.state,
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.state = { ...this.state, ...data };
      this.save();
      this.emit('store:data:imported');
      return true;
    } catch (e) {
      this.emit('store:error', { message: 'Invalid import data' });
      return false;
    }
  }
}

// Make Store available globally
window.Store = Store;
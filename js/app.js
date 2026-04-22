/**
 * NEONFLOW - Main Application Entry Point
 * Initializes all modules and coordinates app startup
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initApp);

    // Lucide SVG icon paths for theming
    const ICON_PATHS = {
        'my-day': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
        'important': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        'planned': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
        'all': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
        'completed': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
    };

    function getListIcon(listId) {
        return ICON_PATHS[listId] || `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
    }

    function initApp() {
        // Create global store instance
        window.store = new Store();

        // Initialize UI components
        initTaskListView();
        initTaskCreation();
        initSidebar();
        initAnimations();

        // Listen for store changes to update sidebar counts
        window.store.on('store:task:added', () => updateAllSidebarCounts());
        window.store.on('store:task:updated', () => updateAllSidebarCounts());
        window.store.on('store:task:deleted', () => updateAllSidebarCounts());
        window.store.on('store:saved', () => updateAllSidebarCounts());

        // Initial stats update
        updateSidebarStats();
        updateAllSidebarCounts();

        // Mark app as ready
        document.body.classList.add('app-ready');

        console.log('NEONFLOW initialized');
    }

    function updateSidebarStats() {
        const stats = window.store.getStats();
        const activeEl = document.getElementById('stat-active');
        const completedEl = document.getElementById('stat-completed');
        if (activeEl) activeEl.textContent = stats.active;
        if (completedEl) completedEl.textContent = stats.completed;
    }

    function updateAllSidebarCounts() {
        const listNav = document.getElementById('list-nav');
        if (!listNav) return;
        
        const listItems = listNav.querySelectorAll('.list-item');
        listItems.forEach(item => {
            const listId = item.dataset.listId;
            const countEl = item.querySelector('.task-count');
            if (countEl && listId) {
                const count = window.store.getTasksWithoutFilter(listId).length;
                countEl.textContent = count;
            }
        });
        
        // Also update footer stats
        updateSidebarStats();
    }

    function initTaskListView() {
        window.taskListView = new TaskListView(window.store, '#app-main');
    }

    function initTaskCreation() {
        window.taskCreationUI = new TaskCreationUI(window.store);
    }

    function initSidebar() {
        // Populate sidebar with lists
        const listNav = document.getElementById('list-nav');
        if (listNav) {
            const lists = window.store.getLists();
            listNav.innerHTML = lists.map(list => `
                <li class="list-item ${list.id === window.store.getActiveListId() ? 'active' : ''}"
                    data-list-id="${list.id}">
                    <span class="list-icon">${getListIcon(list.id)}</span>
                    <span class="list-name">${list.name}</span>
                    <span class="task-count">${getTaskCount(list.id)}</span>
                </li>
            `).join('');

            // Bind click handlers
            listNav.addEventListener('click', (e) => {
                const listItem = e.target.closest('.list-item');
                if (listItem) {
                    const listId = listItem.dataset.listId;
                    window.store.setActiveList(listId);
                    
                    // Update active state
                    listNav.querySelectorAll('.list-item').forEach(li => li.classList.remove('active'));
                    listItem.classList.add('active');

                    // Clear search when changing lists
                    const searchInput = document.querySelector('.global-search');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    window.store.setSearchQuery('');
                }
            });
        }
    }

    function getTaskCount(listId) {
        // Get count without search filter for display
        const tasks = window.store.getTasksWithoutFilter(listId);
        return tasks.length;
    }

    function initAnimations() {
        // Set up particle canvas for completion animations
        const canvas = document.createElement('canvas');
        canvas.className = 'particle-canvas';
        canvas.id = 'particle-canvas';
        document.body.appendChild(canvas);

        // Initialize completion animations module
        if (window.TaskCompletionAnimations) {
            window.taskCompletionAnimations = new TaskCompletionAnimations(canvas);
        }
    }

    // Listen for modal open events
    window.addEventListener('neonflow:open-task-modal', () => {
        if (window.taskCreationUI) {
            window.taskCreationUI.showNewTaskModal();
        }
    });

    // Handle new task button
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-new-task');
        if (btn) {
            if (window.taskCreationUI) {
                window.taskCreationUI.showNewTaskModal();
            }
        }
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const appSidebar = document.getElementById('app-sidebar');
    if (sidebarToggle && appSidebar) {
        sidebarToggle.addEventListener('click', () => {
            appSidebar.classList.toggle('open');
        });
    }

})();
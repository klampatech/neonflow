/**
 * NEONFLOW - Main Application Entry Point
 * Initializes all modules and coordinates app startup
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initApp);

    function initApp() {
        // Create global store instance
        window.store = new Store();

        // Initialize UI components
        initTaskListView();
        initTaskCreation();
        initSidebar();
        initAnimations();

        // Mark app as ready
        document.body.classList.add('app-ready');

        console.log('NEONFLOW initialized');
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
                }
            });
        }
    }

    function getListIcon(listId) {
        const icons = {
            'my-day': '☀️',
            'important': '⭐',
            'planned': '📅',
            'all': '📋',
            'completed': '✅'
        };
        return icons[listId] || '📌';
    }

    function getTaskCount(listId) {
        const tasks = window.store.getTasks(listId);
        return tasks.length;
    }

    function initAnimations() {
        // Set up particle canvas for completion animations
        const canvas = document.createElement('canvas');
        canvas.className = 'particle-canvas';
        canvas.id = 'particle-canvas';
        document.body.appendChild(canvas);

        // Initialize completion animations module
        window.taskCompletionAnimations = new TaskCompletionAnimations(canvas);
    }

    // Listen for modal open events
    window.addEventListener('neonflow:open-task-modal', () => {
        if (window.taskCreationUI) {
            window.taskCreationUI.showNewTaskModal();
        }
    });

    // Handle new task button
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-new-task')) {
            if (window.taskCreationUI) {
                window.taskCreationUI.showNewTaskModal();
            }
        }
    });

})();
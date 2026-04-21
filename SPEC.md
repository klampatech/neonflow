---
title: SPA Task Manager — "NEONFLOW"
jtbd: When I need to manage personal tasks, I want a visually striking, distraction-free single-page app that feels alive and fun to use, so I can stay organized without boring myself to death.
status: draft
priority: critical
---

## Concept & Vision

**NEONFLOW** is a single-page HTML task manager that feels like a living, breathing digital organism. The aesthetic is "acid rave meets brutalist productivity" — deep void backgrounds shattered by electric neons, chunky brutalist typography, and motion that feels physics-driven and satisfying. Every interaction has weight and feedback. Completing a task feels like a small victory. The app should make you want to open it just to experience it, not just to check things off.

This is not a pastel minimalist app. This is bold, unapologetic, and slightly unhinged. The kind of task manager that says "yes, you're an adult, but you're also a person who likes neon colors at 2am."

---

## Design Language

### Color Palette — "ACID VOID"

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Void | `#0a0a0f` | Page background |
| Surface | Deep | `#12121a` | Cards, panels |
| Surface Alt | Midnight | `#1a1a2e` | Hover states, modals |
| Border | Grid | `#2a2a3e` | Subtle dividers |
| Primary | Electric Lime | `#c8ff00` | CTAs, active states, completion |
| Secondary | Hot Pink | `#ff2d6b` | Danger, delete, overdue |
| Accent 1 | Cyan | `#00f0ff` | Info, due dates, links |
| Accent 2 | Purple | `#bf5fff` | Tags, labels, priority medium |
| Accent 3 | Orange | `#ff6b2d` | Warning, priority high |
| Text Primary | White | `#f0f0f5` | Headings, important text |
| Text Secondary | Muted | `#6b6b8a` | Descriptions, metadata |
| Text Inverse | Void | `#0a0a0f` | Text on lime backgrounds |

### Typography

- **Display / Headers**: `Space Grotesk` (Google Fonts) — bold, geometric, brutalist feel. Weight 700.
- **Body / UI**: `JetBrains Mono` (Google Fonts) — monospace for that dev-tool aesthetic. Weight 400/500.
- **Scale**: 12 / 14 / 16 / 20 / 28 / 40 / 56px

### Spacing System

8px base unit. Spacing tokens: 4, 8, 12, 16, 24, 32, 48, 64, 96px.

### Motion Philosophy

Motion is **purposeful and juicy**. Every interaction has physical feedback:
- **Spring-based easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy entrances
- **Ease-out**: `cubic-bezier(0.0, 0.0, 0.2, 1)` for exits
- **Duration scale**: Micro (100ms), Short (200ms), Medium (300ms), Long (500ms)
- **Stagger**: 50ms between list items on load
- **Ambient**: Subtle glow pulse on active task, gradient shift on hover

### Visual Effects

- **Glow**: `box-shadow: 0 0 20px rgba(COLOR, 0.4)` on key elements
- **Glassmorphism**: `backdrop-filter: blur(12px)` on modals/overlays
- **Borders**: 1-2px solid with neon glow on focus/hover
- **Noise texture**: Subtle SVG noise overlay on backgrounds (opacity 0.03)
- **Gradient accents**: Linear gradients using palette colors on dividers and decorative elements

---

## Topics of Concern

1. **[00-core-layout](specs/00-core-layout.md)** — The skeleton: shell, header, sidebar, main content area
2. **[01-task-data-model](specs/01-task-data-model.md)** — The task entity, list/project structure, data schema
3. **[02-task-list-view](specs/02-task-list-view.md)** — Rendering tasks in the main view with filtering and sorting
4. **[03-task-creation](specs/03-task-creation.md)** — Adding new tasks — inline and modal modes
5. **[04-task-editing](specs/04-task-editing.md)** — Editing existing tasks, inline editing, modal editing
6. **[05-task-completion](specs/05-task-completion.md)** — Completing, uncompleting, deleting tasks with animation
7. **[06-drag-and-drop](specs/06-drag-and-drop.md)** — Reordering tasks and moving between lists via drag
8. **[07-search-and-filter](specs/07-search-and-filter.md)** — Full-text search, filter by status/priority/date
9. **[08-persistence](specs/08-persistence.md)** — localStorage save/load, export/import JSON
10. **[09-keyboard-navigation](specs/09-keyboard-navigation.md)** — Full keyboard shortcut system
11. **[10-priorities-and-due-dates](specs/10-priorities-and-due-dates.md)** — Priority levels, due date picker, overdue indicators
12. **[11-visual-feedback](specs/11-visual-feedback.md)** — Animations, transitions, micro-interactions, completion celebrations
13. **[12-responsive-design](specs/12-responsive-design.md)** — Mobile-first responsive layout, touch interactions

---

## Out of Scope

- Backend / server sync
- User authentication
- Team collaboration / sharing
- Recurring tasks / scheduling
- Time tracking
- Multiple workspaces
- Browser notifications
- PWA installability (manifest/service worker)
- Drag-drop file upload (images in tasks)

---

## Quality Gates

- Zero external JS dependencies (vanilla JS only)
- Single `index.html` file — everything inline
- Zero console errors
- WCAG 2.1 AA contrast ratios (at least for text)
- Works offline after first load
- Lighthouse PWA score: 100 on all metrics (inline constraints make this achievable)


---

---
title: Core Layout — The application shell, structural regions, and CSS custom property foundation
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

The skeleton of the application. Defines the structural regions (header, sidebar, main content, modal layer), CSS custom property system for the entire design language, and the base HTML document structure. All other topics plug into this shell.

---

## Requirements

### MUST

- [ ] R1: HTML5 single-file document with `<!DOCTYPE html>`, `<html lang="en">`, proper meta viewport
- [ ] R2: CSS custom properties defined on `:root` for every color, spacing, and typography token from the design language
- [ ] R3: Import `Space Grotesk` and `JetBrains Mono` from Google Fonts via `<link>` in `<head>`
- [ ] R4: Application shell with 4 regions: `#app-header`, `#app-sidebar`, `#app-main`, `#app-modal-layer`
- [ ] R5: `#app-header` fixed at top, contains: app logo/title ("NEONFLOW" in Space Grotesk 700), global search input, "New Task" CTA button
- [ ] R6: `#app-sidebar` fixed left sidebar (240px wide on desktop), contains: list of task lists (My Day, Important, Planned, All Tasks, Completed), list management (add list, rename, delete)
- [ ] R7: `#app-main` scrollable main content area that renders the active task list
- [ ] R8: `#app-modal-layer` fixed overlay layer for modals (task detail, confirm delete, etc.), `z-index: 1000`
- [ ] R9: Base reset: `box-sizing: border-box`, margin/padding reset, smooth scroll behavior
- [ ] R10: Body background: `#0a0a0f`, text: `#f0f0f5`, font-family: `JetBrains Mono` for body

### SHOULD

- [ ] R11: Sidebar collapsible on mobile (hamburger toggle in header)
- [ ] R12: Custom scrollbar styling — thin (6px), track `#12121a`, thumb `#2a2a3e`, thumb:hover `#c8ff00`
- [ ] R13: `::selection` background: `#c8ff00`, color: `#0a0a0f`
- [ ] R14: `scroll-behavior: smooth` globally

### COULD

- [ ] R15: CSS `@keyframes` for ambient background gradient shift (subtle, 30s cycle, very low opacity)
- [ ] R16: SVG noise texture overlay on body (opacity 0.03)
- [ ] R17: Custom `:focus-visible` ring using electric lime with glow

---

## Behavior

### Scenario: App shell renders on load
**Given** the user opens `index.html` in a browser
**When** the DOM is ready
**Then** the shell renders with default "My Day" list active, all CSS custom properties are set, and the font is loaded from Google Fonts

### Scenario: Sidebar toggle on mobile
**Given** viewport width ≤ 768px
**When** the user taps the hamburger icon in the header
**Then** the sidebar slides in from the left with a `300ms` ease-out animation, and the main content area is masked with a semi-transparent overlay

### Scenario: Sidebar closes when clicking overlay
**Given** the sidebar is open (mobile)
**When** the user taps the overlay mask behind the sidebar
**Then** the sidebar closes with a `200ms` ease-in animation and the overlay disappears

---

## Edge Cases

- EC1: Google Fonts fails to load → fall back to system monospace (`ui-monospace, monospace`)
- EC2: Very narrow viewport (320px) → sidebar pushes content entirely off-screen, overlay covers everything
- EC3: Tall task list → `#app-main` scrolls independently while header and sidebar stay fixed
- EC4: Modal open + sidebar toggle → sidebar closes first, then modal state preserved

---

## Acceptance Criteria

- AC1: `index.html` is valid HTML5 and passes `htmlhint` or equivalent
- AC2: All 13+ color tokens are defined as CSS custom properties and used throughout
- AC3: At 1440px wide: header 64px tall, sidebar 240px wide, main fills remaining space
- AC4: At 375px wide (mobile): header 56px tall, sidebar hidden by default, hamburger visible
- AC5: Custom scrollbar appears on `#app-main` when content overflows
- AC6: No layout shift when fonts load (use `font-display: swap`)

---

## Out of Scope

- Task rendering in main (Topic 02)
- Sidebar list item click behavior (Topic 02)
- Modal content rendering (Topics 03, 04)
- Search functionality in header (Topic 07)
- Keyboard shortcuts (Topic 09)

---

## Notes

- CSS custom property naming: `--color-void`, `--color-electric-lime`, `--space-4`, `--space-8`, etc.
- The sidebar should use CSS Grid for internal layout: logo area + list items + add-list area
- Modal layer uses `position: fixed; inset: 0` with `backdrop-filter: blur(4px)` on the overlay


---

---
title: Task Data Model — The task entity schema, list structure, and in-memory data store
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

Defines the shape of every piece of data in the app: individual tasks, task lists (projects), and the top-level app state. All CRUD operations mutate this data model. Persistence (Topic 08) serializes this model to localStorage.

---

## Requirements

### MUST

- [ ] R1: Task entity schema:
  ```js
  {
    id: string,           // UUID v4
    title: string,        // 1–200 chars, required
    description: string,  // 0–2000 chars, optional
    completed: boolean,  // default false
    priority: 'low' | 'medium' | 'high' | 'urgent',  // default 'medium'
    dueDate: string,      // ISO date string YYYY-MM-DD, or null
    listId: string,      // references List.id
    createdAt: string,   // ISO datetime
    updatedAt: string,   // ISO datetime
    order: number,       // float for fractional ordering
    tags: string[]       // array of tag strings, max 10
  }
  ```
- [ ] R2: List entity schema:
  ```js
  {
    id: string,           // UUID v4
    name: string,         // 1–50 chars
    isDefault: boolean,   // true for My Day, Important, Planned, All Tasks, Completed
    isSmartList: boolean, // true for computed lists (My Day, Important, Planned, All Tasks, Completed)
    createdAt: string,
    order: number
  }
  ```
- [ ] R3: App state schema:
  ```js
  {
    lists: List[],
    tasks: Task[],
    activeListId: string,
    activeTaskId: string | null,
    searchQuery: string,
    filterState: {
      showCompleted: boolean,
      priorityFilter: string | null,
      dueDateFilter: 'today' | 'overdue' | 'upcoming' | null
    }
  }
  ```
- [ ] R4: Default smart lists created on first launch: "My Day" (id: `my-day`), "Important" (id: `important`), "Planned" (id: `planned`), "All Tasks" (id: `all`), "Completed" (id: `completed`)
- [ ] R5: Custom list creation: user can add a new list that persists as a regular list
- [ ] R6: In-memory data store as a singleton `Store` object with methods: `getTasks(listId)`, `getTask(id)`, `addTask(data)`, `updateTask(id, data)`, `deleteTask(id)`, `getLists()`, `addList(data)`, `updateList(id, data)`, `deleteList(id)`
- [ ] R7: `Store` emits custom DOM events (`'store:task:added'`, etc.) on every mutation so UI can react without a virtual DOM

### SHOULD

- [ ] R8: Task title trimmed of leading/trailing whitespace before saving
- [ ] R9: Empty title defaults to "Untitled task" with a warning indicator
- [ ] R10: Fractional ordering: when inserting between task A (order 1.0) and task B (order 2.0), new task gets order 1.5
- [ ] R11: Smart list "My Day" contains tasks with dueDate === today OR priority === 'urgent'
- [ ] R12: Smart list "Important" contains tasks with a user-marked `isImportant` flag (add this field to Task)
- [ ] R13: Smart list "Planned" contains tasks with dueDate in the future (including today)
- [ ] R14: Smart list "Completed" contains tasks with completed === true

### COULD

- [ ] R15: Tags autocomplete: when typing in tag input, suggest existing tags from all tasks
- [ ] R16: Task `recurrence` field: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

---

## Behavior

### Scenario: First app load with no saved data
**Given** `localStorage` has no `neonflow-data` key
**When** the app initializes
**Then** initialize with 4 default smart lists, 3 sample tasks in "My Day", and empty other lists

### Scenario: Add a new task
**Given** user is on a task list view
**When** user submits the new task form
**Then** `Store.addTask()` is called with generated UUID, ISO timestamps, and default values; a `'store:task:added'` event is emitted; the task appears in the list at the correct position

### Scenario: Complete a task
**Given** a task exists in the store
**When** `Store.updateTask(id, { completed: true, updatedAt: now })` is called
**Then** the task's `completed` flag is set, `updatedAt` is updated, and `'store:task:updated'` is emitted

### Scenario: Delete a custom list
**Given** a custom (non-smart) list exists with tasks
**When** the list is deleted
**Then** all tasks in that list are also deleted, and `'store:list:deleted'` is emitted

### Scenario: Smart list returns correct tasks
**Given** there are 20 tasks with various due dates and priorities
**When** `Store.getTasks('my-day')` is called
**Then** it returns only tasks where `dueDate === today` OR `priority === 'urgent'`

---

## Edge Cases

- EC1: Duplicate task titles allowed (IDs are unique)
- EC2: Deleting a smart list is not allowed — delete button hidden/grayed for smart lists
- EC3: Empty list name prevented — minimum 1 character required
- EC4: Very long task title truncated in display with ellipsis at 2 lines
- EC5: If `localStorage` is full or unavailable, operations succeed in-memory with a toast warning "Changes not saved"
- EC6: Due date in the past on task creation → allowed but task shows "overdue" styling immediately

---

## Acceptance Criteria

- AC1: Every task has a unique UUID
- AC2: Tasks persist across page reload via localStorage (Topic 08)
- AC3: Smart lists dynamically compute their contents — adding a task with dueDate today immediately appears in "My Day"
- AC4: Fractional ordering means drag-reorder between items A and B results in new order value `(A.order + B.order) / 2`
- AC5: The store emits events that the UI listens to — no polling, no explicit re-render calls needed from callers
- AC6: All 4 CRUD operations (add task, update task, delete task, move task between lists) update the store and emit events

---

## Out of Scope

- UI rendering of tasks (Topic 02)
- Task creation form UI (Topic 03)
- Task editing modal UI (Topic 04)
- Drag-and-drop reordering (Topic 06)
- Search and filter UI (Topic 07)
- localStorage serialization itself (Topic 08)
- Keyboard navigation (Topic 09)

---

## Notes

- Use `crypto.randomUUID()` for ID generation
- Dates stored as ISO strings, displayed in local timezone
- Smart lists ignore `isDefault` — they are identified by hardcoded IDs
- Tags stored as lowercase strings, deduplicated on save
- `order` is a float; when reordering, recalculate all orders in the list (1, 2, 3...) to prevent float precision drift after many reorderings


---

---
title: Task List View — Rendering the active task list with all states, animations, and empty states
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

The visual rendering of a task list in the main content area. This topic covers the task card component (how a single task looks), the list container (how tasks are laid out), and all visual states including empty states, loading states, and the "My Day" smart list welcome message.

---

## Requirements

### MUST

- [ ] R1: Task card component (`.task-card`) renders: checkbox, priority indicator (colored left border), title, due date badge (if set), tag chips (if any), overflow menu (⋮)
- [ ] R2: Task card checkbox: custom styled circle, unchecked = hollow with `#2a2a3e` border, checked = filled `#c8ff00` with checkmark SVG, glow on check
- [ ] R3: Priority left border: `low=#6b6b8a`, `medium=#bf5fff`, `high=#ff6b2d`, `urgent=#ff2d6b` with subtle glow matching color
- [ ] R4: Due date badge: positioned right of title, styled with cyan (`#00f0ff`) pill background, shows "Today" / "Tomorrow" / "Mon" / "Jan 5" / "Jan 5, 2026" based on proximity
- [ ] R5: Overdue badge: due date past today, styled with hot pink (`#ff2d6b`), text "Overdue"
- [ ] R6: Tag chips: small pills with purple (`#bf5fff`) border, `JetBrains Mono` 11px
- [ ] R7: Task title: `JetBrains Mono` 15px, `#f0f0f5`, 2-line max with ellipsis, completed tasks get `text-decoration: line-through` and opacity 0.5
- [ ] R8: Overflow menu (⋮): appears on card hover, opens a dropdown with: Edit, Set Priority, Set Due Date, Add Tag, Delete (hot pink)
- [ ] R9: List container: tasks sorted by `order` ascending, vertical stack with `12px` gap between cards
- [ ] R10: Stagger animation on initial load: each task card fades in + slides up, 50ms stagger, `200ms` per card
- [ ] R11: Empty state for regular list: centered illustration (CSS-drawn neon clipboard icon), heading "No tasks yet", subtext "Add your first task to get started", prominent "+ New Task" button
- [ ] R12: Empty state for smart list with no results: contextual message (e.g., "My Day is clear. Add a task with a due date or high priority.")
- [ ] R13: List header: shows list name in `Space Grotesk` 28px bold, task count badge (e.g., "3 tasks"), and sort/filter controls

### SHOULD

- [ ] R14: Completed tasks section: at the bottom of the list, visually dimmed (opacity 0.6), collapsible header "✓ 3 completed"
- [ ] R15: Hover state on task card: slight scale up (`1.01`), shadow lift, border glow in electric lime
- [ ] R16: Active/selected task card: lime left border full height, background slightly lighter
- [ ] R17: Long press (mobile) opens the overflow menu
- [ ] R18: "My Day" welcome banner: if My Day has 0 tasks, show motivational message with time-based greeting ("Good evening, still time to add to your day")

### COULD

- [ ] R19: "completed" section shows relative time since completion ("completed 2 hours ago")
- [ ] R20: Subtle "breathing" glow animation on urgent priority cards
- [ ] R21: Category color coding: each custom list has a user-selectable accent color shown on the list item in sidebar and the card priority border override

---

## Behavior

### Scenario: Render active task list
**Given** user clicks "All Tasks" in sidebar
**When** `'store:list:activated'` event fires (or initial load)
**Then** `#app-main` renders the task list for "All Tasks", tasks sorted by order, with stagger animation

### Scenario: Task appears after being added
**Given** user is viewing a list
**When** `'store:task:added'` event fires
**Then** the new task card slides in from the top of the list with a `300ms` spring animation

### Scenario: Task completion
**Given** user clicks the checkbox on an uncompleted task
**When** the click registers
**Then** checkbox fills with lime, checkmark appears, title gets strikethrough, card slides down to "completed" section with a `400ms` animation

### Scenario: Task card hover
**Given** user hovers over a task card
**When** the mouse enters the card
**Then** card scales to 1.01, lifts with box-shadow, and overflow menu (⋮) fades in at top-right

### Scenario: Overflow menu — Delete task
**Given** overflow menu is open on a task card
**When** user clicks "Delete"
**Then** confirm modal appears (Topic 05), if confirmed, task card slides out left with fade, then is removed from DOM

---

## Edge Cases

- EC1: Task with very long title (>200 chars) — title truncates at 2 lines in card, full title visible in edit modal
- EC2: Task with 10+ tags — display first 3 tags as chips, then "+N more" chip
- EC3: Task with no title (shouldn't happen per data model, but handle gracefully) — show "Untitled" in muted italic
- EC4: Empty list with pending filter → show "No tasks match your filters" with a "Clear filters" link
- EC5: Rapid task additions → queue animations, don't stack/overlap, process one per frame
- EC6: Task dragged while animating in → cancel the in-animation, immediately place at dragged position

---

## Acceptance Criteria

- AC1: Task cards display all fields from the data model (title, priority, due date, tags, completed state)
- AC2: Clicking a checkbox toggles completion with animation in under 100ms
- AC3: Empty state renders correctly for each of the 5 smart lists with unique messages
- EC4: All animations run at 60fps
- AC5: Completed tasks are visually distinct (strikethrough + opacity + moved to bottom section)
- AC6: Overflow menu contains all 6 options: Edit, Set Priority (submenu), Set Due Date (submenu), Add Tag, Delete
- AC7: The list re-renders reactively when store events fire, without full DOM rebuild (append/prepend/update individual cards)


---

---
title: Task Creation — Adding new tasks via inline quick-add and full creation modal
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

Two pathways for creating tasks: (1) a frictionless inline quick-add bar always visible at the top of the task list, and (2) a full creation modal for adding all fields (description, priority, due date, tags) in one go. Both ultimately call `Store.addTask()`.

---

## Requirements

### MUST

- [ ] R1: Quick-add bar: always visible at top of `#app-main` content area, single-line input, placeholder "Add a task... (press Enter)", `#12121a` background, `#2a2a3e` border
- [ ] R2: Quick-add behavior: pressing Enter with non-empty input creates task with title = input value, `priority: 'medium'`, `listId: activeListId`, `order: append to end`, then clears input with a brief lime flash on the bar
- [ ] R3: Quick-add keyboard: Escape clears the input without creating
- [ ] R4: Full task modal (triggered by "+ New Task" button in header OR "Add task" in overflow menu): centered, `480px` wide, glassmorphism background (`backdrop-filter: blur(16px)`), dark surface
- [ ] R5: Modal form fields: Title (required, text input), Description (textarea, 4 rows), Priority (4 radio buttons with color indicators: Low/Medium/High/Urgent), Due Date (date input), Tags (tag input with chip display + Enter to add), List (select dropdown)
- [ ] R6: Modal actions: "Add Task" (lime button, primary), "Cancel" (ghost button, secondary)
- [ ] R7: Form validation: Title required (inline error "Task title is required"), no other required fields
- [ ] R8: On "Add Task": validate → call `Store.addTask()` → close modal → task appears in list with animation
- [ ] R9: Modal open animation: fade in overlay (200ms) + modal scales from 0.95 to 1.0 with spring (300ms)
- [ ] R10: Modal close: Escape key, clicking overlay, or Cancel button — closes with reverse animation

### SHOULD

- [ ] R11: Quick-add bar glows briefly (electric lime) when a task is successfully added
- [ ] R12: In quick-add, `Tab + Enter` opens the full modal with the quick-add title pre-filled in the title field
- [ ] R13: Priority radio buttons are visually large tap targets (48px min height) with color swatches
- [ ] R14: Due date input shows a native date picker, but also accepts typed formats like "tomorrow", "today", "next monday" parsed by a lightweight parser
- [ ] R15: Tag input: type tag + Enter or comma to add as chip; backspace on empty input removes last tag; max 10 tags shown as chips

### COULD

- [ ] R16: Quick-add bar placeholder cycles through hints: "Add a task... (press Enter)", "What needs doing?", "Next up..."
- [ ] R17: Voice input icon next to quick-add bar (uses Web Speech API `SpeechRecognition`) — if available, shows microphone icon; clicking it starts listening
- [ ] R18: "Add to My Day" quick toggle next to due date in modal — one-click to set due date to today

---

## Behavior

### Scenario: Quick-add task
**Given** user is on any task list
**When** user types "Buy groceries" and presses Enter in the quick-add bar
**Then** a task "Buy groceries" appears at the bottom of the list, input clears, lime flash feedback

### Scenario: Quick-add with Tab+Enter
**Given** user has typed "Weekly report draft" in the quick-add bar
**When** user presses Tab then Enter
**Then** the full task modal opens with Title pre-filled as "Weekly report draft", cursor in Description field

### Scenario: Open full modal via button
**Given** user clicks "+ New Task" in the header
**When** the modal opens
**Then** all fields are at defaults (medium priority, no due date, no tags, active list pre-selected)

### Scenario: Full modal — required field error
**Given** user clicks "Add Task" with empty title
**When** the form submission is attempted
**Then** the title input gets a hot pink border, error message "Task title is required" appears below the input, focus stays on title

### Scenario: Cancel modal
**Given** full task modal is open
**When** user presses Escape or clicks overlay
**Then** modal closes with reverse animation, no task is created

---

## Edge Cases

- EC1: Submitting empty quick-add (empty string or whitespace only) → no task created, input flashes red briefly, no error message needed
- EC2: User types very long title in quick-add (>200 chars) → silently truncate to 200 chars before saving
- EC3: Opening modal while another modal is already open → stack modals or prevent second open (prefer prevent)
- EC4: Double-click on "+ New Task" button → only one modal opens
- EC5: In the full modal, clicking "Add Task" twice rapidly → debounce, only one task created
- EC6: Date parser: "tomorrow" = today + 1 day, "today" = today, "next week" = Monday of next week, "Jan 5" = nearest Jan 5 (future if past)

---

## Acceptance Criteria

- AC1: Quick-add creates a task in under 50ms of the Enter keypress
- AC2: Full modal validates title and shows inline error on empty submit
- AC3: All fields in the modal are optional except title
- AC4: Modal closes on Escape and overlay click
- AC5: The task appears in the correct list with correct order after creation
- AC6: After creating a task, focus returns to the quick-add bar (accessibility)


---

---
title: Task Editing — Editing existing tasks via inline editing and full edit modal
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

Allow editing all fields of an existing task. Inline editing (double-click title to edit in place) for quick title changes, and a full edit modal for comprehensive changes. Both paths validate and call `Store.updateTask()`.

---

## Requirements

### MUST

- [ ] R1: Inline title edit: double-click on task title → title becomes an `<input>` field, auto-focused, pre-filled with current title, `JetBrains Mono` same size as title
- [ ] R2: Inline title edit: Enter confirms, Escape cancels, blur confirms
- [ ] R3: Inline title edit confirm: if new title is non-empty, call `Store.updateTask(id, { title: newValue })`, input reverts to static text with new title; if empty, revert to original title and show brief red flash
- [ ] R4: Full edit modal: triggered by "Edit" in overflow menu or by clicking the task card itself (not the checkbox)
- [ ] R5: Full edit modal: pre-populated with all current task fields, same layout as creation modal but with "Save Changes" (lime) and "Cancel" buttons
- [ ] R6: In full edit modal, "Delete Task" button (hot pink, smaller) below the form, left-aligned
- [ ] R7: On save: call `Store.updateTask(id, { ...changedFields, updatedAt: now })`, close modal, reflect changes in task card with a brief highlight flash
- [ ] R8: Optimistic UI: UI updates immediately on edit confirm; if store operation fails, revert with error toast

### SHOULD

- [ ] R9: Click outside the inline edit input (not on checkbox, not on menu) → behaves as blur (confirm edit)
- [ ] R10: Full edit modal opens with a subtle scale+fade animation matching creation modal
- [ ] R11: Priority change in edit modal: radio buttons with immediate visual feedback (card's priority border updates live as you select)
- [ ] R12: Due date change in edit modal: live preview of the due date badge on a mini task card preview below the date input

### COULD

- [ ] R13: Inline description edit: double-click on description area → becomes `<textarea>`, auto-resize
- [ ] R14: Undo last change: `Ctrl/Cmd+Z` inside any inline edit reverts to pre-edit value
- [ ] R15: "Duplicate task" option in overflow menu → creates a copy with "(copy)" appended to title


---

---
title: Task Completion & Deletion — Toggling completion state and permanent deletion with animations
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

Handle the lifecycle-ending operations: completing a task (with a satisfying animation) and permanently deleting a task (with confirmation). Completion moves a task to the "completed" section; deletion removes it entirely after user confirmation.

---

## Requirements

### MUST

- [ ] R1: Toggle completion: click checkbox → `Store.updateTask(id, { completed: !completed, updatedAt: now })` → update UI
- [ ] R2: Completion animation: on complete: checkbox fills with lime + checkmark draws in (SVG stroke-dashoffset animation 300ms), title gets strikethrough, card slides down to completed section (400ms, ease-in-out)
- [ ] R3: Uncomplete animation: card slides up from completed section, checkbox unfills, strikethrough removes (reverse of completion animation)
- [ ] R4: Delete confirmation modal: triggered by "Delete" in overflow menu OR in edit modal; shows "Delete '[task title]'?" with task title in bold, "This cannot be undone." in muted text, "Delete" (hot pink, danger) + "Cancel" buttons
- [ ] R5: Delete animation: on confirm, card slides left + fades out (250ms), then removed from DOM; if in completed section, slide right instead
- [ ] R6: Completed section: always visible at bottom of list if any completed tasks exist; shows "✓ N completed" as collapsible header
- [ ] R7: "Clear all completed" button in completed section header (appears on hover), hot pink text, requires confirmation modal
- [ ] R8: Completing a task with a due date clears the overdue indicator immediately

### SHOULD

- [ ] R9: Completion sound: optional Web Audio API "pop" sound (sine wave 400Hz, 50ms, quick decay) on task completion — user preference to mute
- [ ] R10: Bulk complete: in sidebar, "All Tasks" overflow menu has "Mark all as complete" option
- [ ] R11: On completing all tasks in a list: celebratory animation — brief confetti of lime/cyan/pink particles (CSS-only, 1 second)
- [ ] R12: Uncompleted tasks with past due dates that get completed → the overdue badge disappears mid-animation (not after)

### COULD

- [ ] R13: "Undo" toast appears for 5 seconds after delete: "Task deleted. Undo" — clicking Undo restores the task at its original position
- [ ] R14: Swipe left on mobile to delete (with red background reveal), swipe right to complete


---

---
title: Drag and Drop — Reordering tasks within a list and moving tasks between lists via drag
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: high
---

## Purpose

Allow physical, intuitive reordering of tasks via mouse/touch drag. This includes dragging to reorder within a list and dragging to move a task to a different list (via sidebar drop zones). Uses the HTML5 Drag and Drop API with custom visual feedback.

---

## Requirements

### MUST

- [ ] R1: Each task card has `draggable="true"` attribute
- [ ] R2: On drag start: card gets `opacity: 0.5`, a "ghost" clone follows the cursor (custom drag image using `drawImage` on a canvas), cursor shows `grabbing`
- [ ] R3: On drag over a task card (drop target): insert indicator line appears above or below the target card (lime colored, 2px, full width) indicating where the task will land
- [ ] R4: On drag over sidebar list item (cross-list drop): sidebar list item highlights with lime background to indicate it's a valid drop target
- [ ] R5: On drop within same list: calculate new `order` value for the dropped position, call `Store.updateTask(id, { order: newOrder })`, animate task to new position (300ms spring)
- [ ] R6: On drop to different list: call `Store.updateTask(id, { listId: newListId, order: appendToEnd })`, animate task card flying to sidebar list icon + remove from current list, add to new list
- [ ] R7: On drag cancel (Escape): restore original position, remove all drag indicators
- [ ] R8: Touch support: `touchstart` → `touchmove` → `touchend` polyfill for mobile drag; long-press (500ms) initiates drag mode on mobile

### SHOULD

- [ ] R9: During drag, other task cards shift smoothly to make room (CSS transition on `transform`)
- [ ] R10: Auto-scroll when dragging near top or bottom edges of the list container (scroll speed proportional to proximity)
- [ ] R11: Drop zone indicators in sidebar show the list name as a tooltip while dragging over it

### COULD

- [ ] R12: "Pick up and drop" micro-animation on successful drop: brief scale up then settle (spring)
- [ ] R13: Drag handle icon (⋮⋮) appears on card hover as an alternative drag initiator (better UX than grabbing the whole card)

---

## Behavior

### Scenario: Reorder within list
**Given** user is dragging a task card with order=3.0
**When** user drops it between order=1.0 and order=2.0
**Then** new order = 1.5; all affected orders updated in store; card animates to new position

### Scenario: Move task to different list
**Given** user drags a task over the sidebar "Work" list item
**When** user drops on that list item
**Then** task moves to Work list, appended at end; sidebar list item shows brief lime flash; task removed from current list view

### Scenario: Drag cancel
**Given** user is dragging a task
**When** user presses Escape
**Then** all drag indicators clear; task returns to original position with animation; `draggable` resets

---

## Edge Cases

- EC1: Dragging the only task in a list → still works, drop indicator shows at top
- EC2: Dropping task on itself (no position change) → no-op, no animation
- EC3: Dragging a completed task → allowed; maintains completed state when dropped in new list
- EC4: Very fast drag operations → debounce order calculations, final position always reflects last drop point
- EC5: Mobile: touch-drag and native drag events can conflict → use feature detection to pick one approach

---

## Acceptance Criteria

- AC1: Drag-and-drop works on both mouse (desktop) and touch (mobile)
- AC2: Task order persists to localStorage after drag
- AC3: Drop indicator always accurately shows landing position
- AC4: Cross-list drop updates `task.listId` correctly in the store
- AC5: Escape cancels drag without side effects
- AC6: Performance: dragging 100+ tasks is smooth (use `transform` for animations, not `top/left`)


---

---
title: Search and Filter — Full-text search, status filters, priority filters, and date filters
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: high
---

## Purpose

Allow users to find tasks quickly (search) and narrow down their view (filters). Search is global across all lists; filters are per-list. The active filter state is shown visually and persists in the store.

---

## Requirements

### MUST

- [ ] R1: Global search input in header: `JetBrains Mono`, placeholder "Search tasks...", `#1a1a2e` background, lime border on focus
- [ ] R2: Search: filters tasks in real-time as user types (debounce 150ms), searches across `title` and `description` fields (case-insensitive)
- [ ] R3: Search results: tasks from all lists shown in main area with a "Search results for '[query]'" header and list name badge per task
- [ ] R4: No results state: "No tasks match '[query]'" with a "Clear search" link
- [ ] R5: Filter bar: appears below the list header when a filter is active, shows active filter pills (e.g., "Priority: High ✕", "Due: Today ✕")
- [ ] R6: Filter options accessible via filter icon button in list header:
  - Status: All / Active / Completed
  - Priority: All / Low / Medium / High / Urgent
  - Due Date: All / Overdue / Today / This Week / This Month
- [ ] R7: Filters are additive (AND logic): can have priority=High AND dueDate=Today active simultaneously
- [ ] R8: "Clear all filters" link appears when any filter is active
- [ ] R9: Filter state persists in `Store.filterState`

### SHOULD

- [ ] R10: Search highlights matching text in task titles and descriptions (wrap match in `<mark>` with lime background)
- [ ] R11: Filter options shown as a dropdown popover (not a modal) anchored to the filter icon button
- [ ] R12: "Sort by" option: Relevance (default for search), Due Date, Priority, Created Date, Alphabetical — each with Asc/Desc toggle
- [ ] R13: Empty search query + no filters = normal list view (no search results overlay)

### COULD

- [ ] R14: Search with `due:` prefix filters by due date (e.g., "due:today", "due:next week")
- [ ] R15: Search with `priority:` prefix (e.g., "priority:high") pre-selects priority filter
- [ ] R16: Search with `#tag` prefix searches for specific tags
- [ ] R17: Recent searches saved in localStorage, shown as dropdown below search input (max 5)


---

---
title: Persistence — localStorage save/load, export/import JSON, and data migration
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: critical
---

## Purpose

All app data (tasks, lists, settings) survives page refreshes via localStorage. Includes export/import as JSON for backup and restore. Also handles data schema migrations when the model evolves.

---

## Requirements

### MUST

- [ ] R1: On every store mutation (add/update/delete task or list), serialize entire app state to `localStorage.setItem('neonflow-data', JSON.stringify(state))` after a 300ms debounce
- [ ] R2: On app initialization: `localStorage.getItem('neonflow-data')` → parse → validate schema → hydrate store
- [ ] R3: Schema version field in saved state: `{ ...state, schemaVersion: 1 }` — allows future migrations
- [ ] R4: If saved data is corrupted/invalid JSON: log error, fall back to default initial state (do not crash)
- [ ] R5: Export: "Export Data" in sidebar overflow menu → downloads `neonflow-backup-YYYY-MM-DD.json` with full state
- [ ] R6: Import: "Import Data" in sidebar overflow menu → file picker for `.json`, validates schema, asks "Replace all data?" confirmation, then loads
- [ ] R7: Export includes: all lists, all tasks, schema version, export timestamp

### SHOULD

- [ ] R8: Data size indicator in sidebar footer: "142 tasks · 3.2 KB"
- [ ] R9: "Last saved" timestamp shown in sidebar footer: "Saved 2 min ago"
- [ ] R10: Auto-save indicator: brief "Saving..." → "Saved" in header (next to search) during debounce window

### COULD

- [ ] R11: Undo/redo stack: last 20 state snapshots stored in localStorage separately; `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y` for undo/redo
- [ ] R12: Schema migration function: if `schemaVersion < current`, run migration functions sequentially before hydrating


---

---
title: Keyboard Navigation — Full keyboard shortcut system for power users
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: medium
---

## Purpose

Every meaningful action in the app is accessible via keyboard. A comprehensive shortcut system for power users: navigation, task CRUD, list management, and global shortcuts that work regardless of focus.

---

## Requirements

### MUST

- [ ] R1: Global shortcuts (work anywhere, even when input is focused):
  - `Ctrl/Cmd + N` → open full task creation modal
  - `Ctrl/Cmd + F` → focus global search input
  - `Escape` → close any open modal/popover, cancel drag, blur inline edit
  - `Ctrl/Cmd + Shift + C` → toggle "Clear completed" confirmation for active list
- [ ] R2: List navigation (when not in input):
  - `J` or `↓` → move selection down one task
  - `K` or `↑` → move selection up one task
  - `Enter` → open selected task in edit modal
  - `Space` → toggle completion of selected task
  - `D` → delete selected task (with confirmation)
  - `1–5` → switch to list 1–5 (My Day, Important, Planned, All, Completed)
  - `[` / `]` → previous / next list
- [ ] R3: In modals/forms:
  - `Tab` → next field
  - `Shift+Tab` → previous field
  - `Enter` in textarea → newline; `Enter` in text input → submit form
  - `Escape` → cancel/close
- [ ] R4: In inline title edit:
  - `Enter` → confirm edit
  - `Escape` → cancel edit
- [ ] R5: Visual keyboard shortcut hints shown in UI (e.g., "⌘N" badge on "+ New Task" button)
- [ ] R6: Shortcut for "My Day" quick-add: when My Day is active, `Ctrl/Cmd + T` focuses quick-add bar directly

### SHOULD

- [ ] R7: Keyboard shortcut help modal: triggered by `?` key or "Keyboard shortcuts" link in sidebar footer; shows full shortcut reference table organized by category
- [ ] R8: When search is focused, `↑/↓` navigate through search results, `Enter` selects focused result
- [ ] R9: In overflow menu: `↑/↓` navigate options, `Enter` selects, `Escape` closes

### COULD

- [ ] R10: Vim-style navigation mode toggle (hjkl for arrow movement) — shows "VIM MODE" indicator in header when active


---

---
title: Priorities and Due Dates — Priority levels, due date picker, and overdue visual indicators
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: high
---

## Purpose

Enhanced task metadata: priority levels (with strong visual identity) and due dates (with natural language parsing and smart display). This topic is large enough to warrant its own spec given the number of states and interactions involved.

---

## Requirements

### MUST

- [ ] R1: Four priority levels with distinct visual treatment:
  - **Low**: muted gray `#6b6b8a`, no glow
  - **Medium**: purple `#bf5fff`, subtle glow
  - **High**: orange `#ff6b2d`, stronger glow
  - **Urgent**: hot pink `#ff2d6b`, pulsing glow animation, card has subtle pink tint background
- [ ] R2: Priority can be set: in creation modal (radio), in edit modal (radio), in overflow menu (submenu), via keyboard shortcut (`P` then `1/2/3/4` when task selected)
- [ ] R3: Due date picker: native `<input type="date">` styled to match theme
- [ ] R34: Natural language date parsing for quick-add and modal: accept "today", "tomorrow", "next monday", "this friday", "jan 5", "jan 5 2026", "+3d" (3 days from today), "+1w" (1 week)
- [ ] R5: Due date display logic:
  - Overdue: "Overdue" in hot pink
  - Today: "Today" in cyan
  - Tomorrow: "Tomorrow" in cyan
  - This week (not today): day name "Monday", "Tuesday", etc. in cyan
  - This month (not this week): "Jan 15" in muted
  - Future month: "Jan 15, 2026" in muted
- [ ] R6: Overdue visual: task card gets subtle hot pink left glow, "Overdue" badge
- [ ] R7: Quick due date setter in overflow menu: "Today", "Tomorrow", "Next Week" shortcuts (one click, no picker needed)

### SHOULD

- [ ] R8: Calendar widget popover: click on due date badge or in overflow menu → shows mini calendar with today highlighted, past dates grayed, click to set
- [ ] R9: When setting a due date on an existing overdue task → overdue indicator removed immediately
- [ ] R10: "No due date" option in overflow menu → clears due date with a single click

### COULD

- [ ] R11: Due date reminders: if due date is today and task is not completed, show a persistent banner at the top of the list "You have N tasks due today"
- [ ] R12: Due date color coding on the sidebar list item badge: "My Day" shows count of overdue+today tasks


---

---
title: Visual Feedback & Micro-interactions — Animations, transitions, completion celebrations, and ambient effects
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: medium
---

## Purpose

The "juice" — every interaction has satisfying feedback. This topic covers animations that aren't directly tied to data (completion celebration, ambient effects), transition patterns, and motion specifications to ensure consistency across all interactions.

---

## Requirements

### MUST

- [ ] R1: Completion celebration: when last task in a list is completed, trigger a burst of lime/cyan particles (CSS `@keyframes`, absolutely positioned spans, random trajectory, fade out over 800ms)
- [ ] R2: Toast notifications: slide in from bottom-right, auto-dismiss after 4 seconds, manual dismiss on click. Types: success (lime border), error (pink border), info (cyan border)
- [ ] R3: All list/filter switches: main content area fades out (150ms) and fades in (200ms) to prevent jarring cuts
- [ ] R4: Modal open/close: overlay fades (200ms), modal scales 0.95→1.0 (300ms spring) on open; reverse on close
- [ ] R5: Task card entrance: `opacity: 0, translateY(12px)` → `opacity: 1, translateY(0)` over 200ms, staggered 50ms
- [ ] R6: Task card hover: `transform: scale(1.01) translateY(-2px)`, `box-shadow` lift, 150ms ease-out
- [ ] R7: Sidebar list item hover: lime left border slides in (width 0→3px, 100ms), text shifts right 4px
- [ ] R8: Checkbox animation: custom SVG checkmark draws via `stroke-dashoffset` animation 300ms, bounce easing
- [ ] R9: Glow pulse on urgent tasks: `box-shadow` keyframe animation, 2s cycle, subtle
- [ ] R10: Input focus: border transitions from `#2a2a3e` to `#c8ff00` with `box-shadow: 0 0 8px rgba(200, 255, 0, 0.3)` over 150ms

### SHOULD

- [ ] R11: "Lime flash" on quick-add success: the quick-add bar briefly glows lime (`box-shadow` flash, 300ms)
- [ ] R12: List name editing: double-click list name in sidebar → inline edit with same pattern as task title inline edit
- [ ] R13: Progress indicator in header: when list has tasks, show a thin lime progress bar at top of `#app-main` showing % completed (updated live on completion)
- [ ] R14: Ambient gradient: very subtle background radial gradient that slowly shifts position (30s cycle, opacity 0.1)
- [ ] R15: Delete animation: card slides left + opacity 0 + scale 0.95 over 250ms, then removed

### COULD

- [ ] R16: "Pick up" animation when starting drag: card briefly scales to 1.05 then settles to 1.0 with shadow deepening
- [ ] R17: Page load: brief "NEONFLOW" wordmark animation (letter stagger in header) — letters drop in with spring physics on first load
- [ ] R18: Task completion counter in header: animate the number change (count up/down) when task count changes


---

---
title: Responsive Design — Mobile-first layout, touch interactions, and viewport adaptation
jtbd: NEONFLOW SPA Task Manager
status: draft
priority: medium
---

## Purpose

The app is fully functional on mobile (375px+) and tablet (768px–1024px) as well as desktop. Sidebar collapses, touch targets are appropriately sized, and the layout adapts gracefully across breakpoints.

---

## Requirements

### MUST

- [ ] R1: Breakpoints:
  - Mobile: `< 768px` — single column, sidebar hidden, hamburger in header
  - Tablet: `768px – 1024px` — sidebar 200px ( narrower), hamburger always visible
  - Desktop: `> 1024px` — full layout, sidebar 240px, no hamburger
- [ ] R2: Mobile sidebar: slides in from left over the content, `position: fixed`, `z-index: 500`, width 280px, backdrop blur overlay
- [ ] R3: Touch targets: all interactive elements minimum `44px × 44px` tap area (WCAG 2.1 AA)
- [ ] R4: Task cards on mobile: full-width, comfortable padding (16px), checkbox slightly larger (24px)
- [ ] R5: Quick-add bar on mobile: full-width, fixed at bottom of screen (above safe area), `position: fixed` with safe-area-inset-bottom padding
- [ ] R6: Modals on mobile: full-screen (`width: 100vw; height: 100dvh`), slide up from bottom, no border-radius on corners (brutalist edge)
- [ ] R7: Filter/sort dropdowns: full-width bottom sheet on mobile, modal on desktop
- [ ] R8: Overflow menu on mobile: full-width bottom sheet instead of floating dropdown
- [ ] R9: Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`

### SHOULD

- [ ] R10: Safe area handling for notched phones: `padding: env(safe-area-inset-* )` on header and quick-add bar
- [ ] R11: Drag-and-drop on tablet: same as desktop — works with touch drag via polyfill
- [ ] R12: Swipe gestures: swipe left on task card → delete (red background reveal); swipe right → complete (lime background reveal); velocity-aware (slow swipe = reveal, fast swipe = execute)
- [ ] R13: "Pull to refresh" on mobile: CSS-only `@keyframes` spin animation on a refresh icon appears at top of list on pull-down gesture

### COULD

- [ ] R14: Adaptive typography: slightly smaller font sizes on mobile (14px body vs 15px desktop)
- [ ] R15: "Open app" prompt: if viewed in a browser on iOS/Android, small banner at top "Add to Home Screen for the best experience"

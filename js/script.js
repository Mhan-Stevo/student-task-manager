// This is the main array that stores all the tasks in our app.
// Each item in the array is an object with task details.
let tasks = [];

// Grab references to important HTML elements so we can work with them in JavaScript.
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-chip');
const fab = document.getElementById('fab');
const modal = document.getElementById('taskModal');
const cancelTask = document.getElementById('cancelTask');
const form = document.getElementById('taskForm');
const searchInput = document.getElementById('taskSearch');

// These variables keep track of what the user is currently viewing.
let currentFilter = 'all';
let currentSearch = '';
let editingTaskId = null;

// This function fills the modal form with task data when editing an existing task.
// If no task is passed, it clears the form to create a new task.
function populateForm(task) {
  const titleInput = document.getElementById('taskTitle');
  const descriptionInput = document.getElementById('taskDescription');
  const dueDateInput = document.getElementById('taskDueDate');
  const priorityInput = document.getElementById('taskPriority');

  if (!task) {
    titleInput.value = '';
    descriptionInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'Medium';
    return;
  }

  titleInput.value = task.title || '';
  descriptionInput.value = task.description || '';
  dueDateInput.value = task.dueDate || '';
  priorityInput.value = task.priority || 'Medium';
}

// Open the modal either for adding a new task or editing an existing one.
function openModal(task = null) {
  const modalTitle = document.getElementById('taskModalTitle');

  // If a task is passed in, we are editing it; otherwise we are creating a new task.
  editingTaskId = task ? task.id : null;
  modalTitle.textContent = task ? 'Edit Task' : 'Add New Task';
  populateForm(task);
  clearFieldErrors();
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('taskTitle').focus();
}

// Close the modal and reset the form.
function closeModal() {
  editingTaskId = null;
  clearFieldErrors();
  form.reset();
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

// Create a unique ID so each task is different.
// Date.now() gives a timestamp, and random numbers make it extra unique.
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Validate task form input.
// It returns an object with:
// - isValid: true if everything is okay
// - errors: an object with error messages for each field
function validateTaskInput(title, description, priority, dueDate) {
  const errors = {};

  // Title is required and must have at least 1 character.
  if (!title || title.trim().length < 1) {
    errors.title = 'Title is required.';
  }

  // Description is optional, so no validation needed unless you want to add rules later.
  // Priority is optional in this project, but we keep it in the structure.
  // Due date is optional. If provided, it can be any date, including past dates.
  if (dueDate) {
    const due = new Date(dueDate + 'T00:00:00');
    if (Number.isNaN(due.getTime())) {
      errors.dueDate = 'Due date is invalid.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Show error messages under the relevant fields.
function showFieldErrors(errors) {
  const titleError = document.getElementById('titleError');
  const descriptionError = document.getElementById('descriptionError');
  const priorityError = document.getElementById('priorityError');
  const dueDateError = document.getElementById('dueDateError');

  titleError.textContent = errors.title || '';
  descriptionError.textContent = errors.description || '';
  priorityError.textContent = errors.priority || '';
  dueDateError.textContent = errors.dueDate || '';
}

// Clear all validation messages.
function clearFieldErrors() {
  showFieldErrors({});
}

// Add a new task to the beginning of the tasks array.
function addTask(title, description, priority, dueDate) {
  const trimmedTitle = title.trim();

  // Do not allow empty task titles.
  if (!trimmedTitle) return null;

  const newTask = {
    id: generateUniqueId(),
    title: trimmedTitle,
    description: description ? description.trim() : '',
    priority: priority || 'Medium',
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date().toISOString()
  };

  // Add to the front of the array so the newest tasks appear first.
  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  return newTask;
}

// Update an existing task based on its id.
function editTask(id, updatedFields) {
  // Search for the task using its id.
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) return null;

  // Replace the old task with the updated version while keeping any values we did not change.
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updatedFields
  };

  saveTasks();
  renderTasks();
  return tasks[taskIndex];
}

// Remove a task by filtering it out of the array.
function deleteTask(id) {
  const originalLength = tasks.length;
  tasks = tasks.filter((task) => task.id !== id);

  if (tasks.length === originalLength) return false;

  saveTasks();
  renderTasks();
  return true;
}

// Toggle the completed state of a task.
function toggleComplete(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) return null;

  // Flip true/false.
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  return task;
}

// Save the tasks array to browser storage so the data stays after refresh.
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from browser storage when the page starts.
function loadTasks() {
  try {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return [];
  }
}

// Format the date so it looks nice, like 'Oct 24'.
function formatDueDate(dateString) {
  if (!dateString) return 'No date';

  const date = new Date(dateString + 'T00:00:00');

  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Decide which tasks should be displayed based on the active filter and search query.
function getVisibleTasks() {
  let filteredTasks = [...tasks];

  // Filter by status:
  if (currentFilter === 'active') {
    filteredTasks = filteredTasks.filter((task) => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = filteredTasks.filter((task) => task.completed);
  }

  // Filter by search text.
  if (currentSearch.trim()) {
    const query = currentSearch.trim().toLowerCase();
    filteredTasks = filteredTasks.filter((task) => {
      const searchableText = `${task.title} ${task.description || ''} ${task.priority || ''}`.toLowerCase();
      return searchableText.includes(query);
    });
  }

  return filteredTasks;
}

// Clear the list and draw the task cards again.
function renderTasks() {
  const visibleTasks = getVisibleTasks();

  // Remove previous cards before drawing a fresh list.
  taskList.innerHTML = '';

  // If no tasks match the filter/search, show the empty state instead.
  if (!visibleTasks.length) {
    emptyState.classList.remove('hidden');
    taskList.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  taskList.classList.remove('hidden');

  // Loop through each task and create a card for it.
  visibleTasks.forEach((task) => {
    const article = document.createElement('article');
    article.className = `task-card task-card--${task.priority.toLowerCase()}`;
    if (task.completed) article.classList.add('task-card--done');

    article.innerHTML = `
      <div class="task-main">
        <button class="task-check ${task.completed ? 'checked' : ''}" type="button" data-id="${task.id}" aria-label="Toggle ${task.title}"></button>
        <div class="task-text">
          <h2 class="task-title">${task.title}</h2>
          <div class="task-meta-row">
            <span class="priority priority--${task.priority.toLowerCase()}">${task.priority}</span>
            <span class="task-date ${task.completed ? 'task-date--done' : ''}">${task.completed ? 'Done' : formatDueDate(task.dueDate)}</span>
          </div>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-button action-edit" type="button" aria-label="Edit ${task.title}">✎</button>
        <button class="icon-button action-delete" type="button" data-id="${task.id}" aria-label="Delete ${task.title}">🗑</button>
      </div>
    `;

    taskList.appendChild(article);
  });
}

// When a filter button is clicked, update the active filter and redraw the tasks.
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((chip) => chip.classList.toggle('active', chip === button));
    renderTasks();
  });
});

// As the user types in the search box, update the current search value and re-render.
searchInput.addEventListener('input', (event) => {
  currentSearch = event.target.value;
  renderTasks();
});

// Open the modal when the floating action button is clicked.
fab.addEventListener('click', () => {
  openModal();
});

// Close the modal when cancel is clicked.
cancelTask.addEventListener('click', () => {
  closeModal();
});

// If the user clicks outside the modal panel, close it.
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Pressing Escape should close the modal.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

// This runs when the user clicks Save in the form.
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const title = formData.get('title').toString().trim();
  const description = formData.get('description').toString().trim();
  const priority = formData.get('priority').toString();
  const dueDate = formData.get('dueDate').toString();

  // Validate before saving.
  const validation = validateTaskInput(title, description, priority, dueDate);

  if (!validation.isValid) {
    showFieldErrors(validation.errors);
    if (validation.errors.title) {
      document.getElementById('taskTitle').focus();
    }
    return;
  }

  // Clear any previous validation errors before saving.
  clearFieldErrors();

  const payload = {
    title,
    description,
    priority: priority || 'Medium',
    dueDate
  };

  // If we are editing, update the task. Otherwise create a new one.
  if (editingTaskId) {
    editTask(editingTaskId, payload);
  } else {
    addTask(payload.title, payload.description, payload.priority, payload.dueDate);
  }

  closeModal();
});

// Event delegation: one click listener handles all task card actions.
taskList.addEventListener('click', (event) => {
  // If the click happened on the check button, toggle completion.
  const taskCheck = event.target.closest('.task-check');
  if (taskCheck) {
    toggleComplete(taskCheck.dataset.id);
    return;
  }

  // If the click happened on the edit icon, open the modal filled with that task's details.
  const editButton = event.target.closest('.action-edit');
  if (editButton) {
    const taskId = editButton.closest('.task-card')?.querySelector('.task-check')?.dataset.id;
    const task = tasks.find((item) => item.id === taskId);
    if (task) openModal(task);
    return;
  }

  // If the click happened on the delete button, remove the task.
  const deleteButton = event.target.closest('.action-delete');
  if (deleteButton) {
    deleteTask(deleteButton.dataset.id);
  }
});

// Initialize app state when the page loads.
function init() {
  tasks = loadTasks();
  renderTasks();
}

init();

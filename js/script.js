let tasks = [];

const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-chip');
const fab = document.getElementById('fab');
const modal = document.getElementById('taskModal');
const cancelTask = document.getElementById('cancelTask');
const form = document.getElementById('taskForm');
const searchInput = document.getElementById('taskSearch');

let currentFilter = 'all';
let currentSearch = '';
let editingTaskId = null;

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

function openModal(task = null) {
  const modalTitle = document.getElementById('taskModalTitle');

  editingTaskId = task ? task.id : null;
  modalTitle.textContent = task ? 'Edit Task' : 'Add New Task';
  populateForm(task);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('taskTitle').focus();
}

function closeModal() {
  editingTaskId = null;
  form.reset();
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addTask(title, description, priority, dueDate) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) return null;

  const newTask = {
    id: generateUniqueId(),git add .
    title: trimmedTitle,
    description: description ? description.trim() : '',
    priority: priority || 'Medium',
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  return newTask;
}

function editTask(id, updatedFields) {
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) return null;

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updatedFields
  };

  saveTasks();
  renderTasks();
  return tasks[taskIndex];
}

function deleteTask(id) {
  const originalLength = tasks.length;
  tasks = tasks.filter((task) => task.id !== id);

  if (tasks.length === originalLength) return false;

  saveTasks();
  renderTasks();
  return true;
}

function toggleComplete(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) return null;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  return task;
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return [];
  }
}

function formatDueDate(dateString) {
  if (!dateString) return 'No date';

  const date = new Date(dateString + 'T00:00:00');

  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function getVisibleTasks() {
  let filteredTasks = [...tasks];

  if (currentFilter === 'active') {
    filteredTasks = filteredTasks.filter((task) => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = filteredTasks.filter((task) => task.completed);
  }

  if (currentSearch.trim()) {
    const query = currentSearch.trim().toLowerCase();
    filteredTasks = filteredTasks.filter((task) => {
      const searchableText = `${task.title} ${task.description || ''} ${task.priority || ''}`.toLowerCase();
      return searchableText.includes(query);
    });
  }

  return filteredTasks;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = '';

  if (!visibleTasks.length) {
    emptyState.classList.remove('hidden');
    taskList.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  taskList.classList.remove('hidden');

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

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((chip) => chip.classList.toggle('active', chip === button));
    renderTasks();
  });
});

searchInput.addEventListener('input', (event) => {
  currentSearch = event.target.value;
  renderTasks();
});

fab.addEventListener('click', () => {
  openModal();
});

cancelTask.addEventListener('click', () => {
  closeModal();
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const title = formData.get('title').toString().trim();

  if (!title) {
    document.getElementById('taskTitle').focus();
    return;
  }

  const payload = {
    title,
    description: formData.get('description').toString().trim(),
    priority: formData.get('priority').toString() || 'Medium',
    dueDate: formData.get('dueDate').toString()
  };

  if (editingTaskId) {
    editTask(editingTaskId, payload);
  } else {
    addTask(payload.title, payload.description, payload.priority, payload.dueDate);
  }

  closeModal();
});

taskList.addEventListener('click', (event) => {
  const taskCheck = event.target.closest('.task-check');
  if (taskCheck) {
    toggleComplete(taskCheck.dataset.id);
    return;
  }

  const editButton = event.target.closest('.action-edit');
  if (editButton) {
    const taskId = editButton.closest('.task-card')?.querySelector('.task-check')?.dataset.id;
    const task = tasks.find((item) => item.id === taskId);
    if (task) openModal(task);
    return;
  }

  const deleteButton = event.target.closest('.action-delete');
  if (deleteButton) {
    deleteTask(deleteButton.dataset.id);
  }
});

function init() {
  tasks = loadTasks();
  renderTasks();
}

init();

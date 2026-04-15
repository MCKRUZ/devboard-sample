let allUsers = [];
let allTasks = [];

async function fetchData() {
  try {
    const [tasksRes, usersRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/users'),
    ]);
    allTasks = await tasksRes.json();
    allUsers = await usersRes.json();
    renderBoard();
    populateAssigneeSelect();
  } catch (err) {
    showError('Failed to load data: ' + err.message);
  }
}

function renderBoard() {
  const columns = { todo: [], in_progress: [], done: [] };

  for (const task of allTasks) {
    if (columns[task.status]) {
      columns[task.status].push(task);
    }
  }

  document.getElementById('col-todo').innerHTML = columns.todo.map(cardHTML).join('');
  document.getElementById('col-in_progress').innerHTML = columns.in_progress.map(cardHTML).join('');
  document.getElementById('col-done').innerHTML = columns.done.map(cardHTML).join('');

  document.getElementById('badge-todo').textContent = `${columns.todo.length} Todo`;
  document.getElementById('badge-in_progress').textContent = `${columns.in_progress.length} In Progress`;
  document.getElementById('badge-done').textContent = `${columns.done.length} Done`;
}

function cardHTML(task) {
  const nextStatus = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
  const nextLabel = { todo: 'Start', in_progress: 'Complete', done: 'Reopen' };

  return `
    <div class="card status-${task.status}" data-id="${task.id}">
      <div class="card-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="card-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="card-assignee">${task.assignee_name ? 'Assigned to ' + escapeHtml(task.assignee_name) : 'Unassigned'}</div>
      <div class="card-actions">
        <button class="btn-advance" onclick="advanceTask(${task.id}, '${nextStatus[task.status]}')">${nextLabel[task.status]}</button>
        <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function advanceTask(id, newStatus) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const data = await res.json();
      showError(data.error || 'Failed to update task');
      return;
    }
    await fetchData();
  } catch (err) {
    showError('Failed to update task: ' + err.message);
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      showError(data.error || 'Failed to delete task');
      return;
    }
    await fetchData();
  } catch (err) {
    showError('Failed to delete task: ' + err.message);
  }
}

function populateAssigneeSelect() {
  const select = document.getElementById('task-assignee');
  const current = select.value;
  select.innerHTML = '<option value="">Unassigned</option>';
  for (const user of allUsers) {
    const opt = document.createElement('option');
    opt.value = user.id;
    opt.textContent = user.name;
    if (String(user.id) === current) opt.selected = true;
    select.appendChild(opt);
  }
}

// Task modal
function openTaskModal() {
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-status').value = 'todo';
  populateAssigneeSelect();
  document.getElementById('task-modal').classList.remove('hidden');
  document.getElementById('task-title').focus();
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.add('hidden');
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const status = document.getElementById('task-status').value;
  const assignee_id = document.getElementById('task-assignee').value || null;

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status, assignee_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Failed to create task');
      return;
    }
    closeTaskModal();
    await fetchData();
  } catch (err) {
    showError('Failed to create task: ' + err.message);
  }
});

// User modal
function openUserModal() {
  document.getElementById('user-name').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('user-modal').classList.remove('hidden');
  document.getElementById('user-name').focus();
}

function closeUserModal() {
  document.getElementById('user-modal').classList.add('hidden');
}

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Failed to create user');
      return;
    }
    closeUserModal();
    await fetchData();
  } catch (err) {
    showError('Failed to create user: ' + err.message);
  }
});

function showError(msg) {
  const banner = document.getElementById('error-banner');
  banner.textContent = msg;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 4000);
}

// Close modals on overlay click
document.getElementById('task-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeTaskModal();
});
document.getElementById('user-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeUserModal();
});

fetchData();

let currentColumn = '';
let editTaskId = null;

function openModal(colId, taskId = null) {
    currentColumn = colId;
    editTaskId = taskId;
    const modal = document.getElementById('taskModal');
    const input = document.getElementById('taskInput');
    const dateInput = document.getElementById('taskDate');

    if (taskId) {
        const taskEl = document.getElementById(taskId);
        input.value = taskEl.querySelector('.task-content').innerText;
        dateInput.value = taskEl.querySelector('.task-date')?.innerText.replace('📅 ', '') || '';
    } else {
        input.value = '';
        dateInput.value = '';
    }
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('taskModal').style.display = 'none'; editTaskId = null; }

function handleSave() {
    const text = document.getElementById('taskInput').value.trim();
    const date = document.getElementById('taskDate').value;
    if (!text) return closeModal();

    if (editTaskId) {
        const taskEl = document.getElementById(editTaskId);
        taskEl.querySelector('.task-content').innerText = text;
        let dateSpan = taskEl.querySelector('.task-date');
        if (date) {
            if (dateSpan) dateSpan.innerText = `📅 ${date}`;
            else {
                dateSpan = document.createElement('span');
                dateSpan.className = 'task-date';
                dateSpan.innerText = `📅 ${date}`;
                taskEl.appendChild(dateSpan);
            }
        } else if (dateSpan) dateSpan.remove();
    } else {
        const list = document.getElementById(`${currentColumn}-tasks`);
        list.prepend(createTaskElement('task-' + Date.now(), text, date));
    }
    updateCounts();
    saveTasks();
    closeModal();
}

function createTaskElement(id, text, date) {
    const div = document.createElement('div');
    div.className = 'task';
    div.id = id;
    div.draggable = true;
    div.innerHTML = `
        <div class="task-content">${text}</div>
        ${date ? `<span class="task-date" style="display:block;font-size:0.8rem;margin-top:5px;">📅 ${date}</span>` : ''}
        <button onclick="deleteTask(event, '${id}')" style="position:absolute;top:5px;right:10px;border:none;background:none;cursor:pointer;color:#aaa;font-size:1.2rem;">&times;</button>
    `;
    div.addEventListener('dblclick', () => openModal(div.closest('.column').id, id));
    div.addEventListener('dragstart', (e) => {
        div.classList.add('dragging');
        e.dataTransfer.setData("text/plain", id);
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    return div;
}

function deleteTask(e, id) {
    e.stopPropagation();
    document.getElementById(id).remove();
    updateCounts();
    saveTasks();
}

function allowDrop(ev) { ev.preventDefault(); }
function dragEnter(ev) { ev.target.closest('.column')?.classList.add('drag-over'); }
function dragLeave(ev) { ev.target.closest('.column')?.classList.remove('drag-over'); }

function drop(ev) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain");
    const task = document.getElementById(id);
    const col = ev.target.closest('.column');
    if (col && task) {
        col.classList.remove('drag-over');
        col.querySelector('.task-list').prepend(task);
        updateCounts();
        saveTasks();
    }
}

// FIXED: This specifically resets counts to 0 before counting tasks in each column
function updateCounts() {
    ['todo', 'inprogress', 'done'].forEach(col => {
        const count = document.querySelectorAll(`#${col}-tasks .task`).length;
        document.getElementById(`${col}-count`).innerText = count;
    });
}

function saveTasks() {
    const data = {};
    ['todo', 'inprogress', 'done'].forEach(col => {
        data[col] = Array.from(document.querySelectorAll(`#${col}-tasks .task`)).map(t => ({
            id: t.id, text: t.querySelector('.task-content').innerText,
            date: t.querySelector('.task-date')?.innerText.replace('📅 ', '') || ''
        }));
    });
    localStorage.setItem('kanbanTasks', JSON.stringify(data));
}

function loadTasks() {
    const theme = localStorage.getItem('kanbanTheme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const saved = JSON.parse(localStorage.getItem('kanbanTasks') || '{}');
    Object.keys(saved).forEach(col => {
        const list = document.getElementById(`${col}-tasks`);
        if (list) saved[col].forEach(t => list.appendChild(createTaskElement(t.id, t.text, t.date)));
    });
    updateCounts();
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('kanbanTheme', newTheme);
}

function filterTasks() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.task').forEach(t => {
        t.style.display = t.innerText.toLowerCase().includes(q) ? 'block' : 'none';
    });
}

function clearBoard() {
    if (confirm("Clear all?")) {
        document.querySelectorAll('.task-list').forEach(l => l.innerHTML = '');
        updateCounts();
        localStorage.removeItem('kanbanTasks');
    }
}

window.onload = loadTasks;
window.onclick = (e) => { if(e.target.id === 'taskModal') closeModal(); };
function createStars() {
    const sky = document.querySelector('.sky-container');
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 'px';
        star.style.width = size;
        star.style.height = size;
        star.style.top = Math.random() * 100 + '%';
        star.style.left = Math.random() * 100 + '%';
        star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        sky.appendChild(star);
    }
}

// Add to your existing window.onload
window.onload = () => {
    loadTasks();
    createStars();
};

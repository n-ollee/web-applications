class Todo {
  constructor() {
    this.storageKey = 'todos_v1';
    this.tasks = []; 
    this.term = '';
    // DOM 
    this.listEl = document.getElementById('tasksList');
    this.searchInput = document.getElementById('searchInput');
    this.taskTextInput = document.getElementById('taskText');
    this.taskDateInput = document.getElementById('taskDate');
    this.addBtn = document.getElementById('addBtn');

    this.load();
    this.attachEvents();
    this.draw();
  }

  attachEvents() {
   
    this.addBtn.addEventListener('click', () => this.handleAdd());
    this.taskTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleAdd();
    });

    this.searchInput.addEventListener('input', (e) => {
      this.term = e.target.value.trim();
      this.draw();
    });

    window.addEventListener('beforeunload', () => this.save());
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.tasks = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed', e);
    }
    this.tasks = [
      { id: this._id(), text: 'Do homework', dateISO: '' },
      { id: this._id(), text: 'Make a dinner', dateISO: new Date(Date.now() + 86400000).toISOString() } 
    ];
    this.save();
  }

  _id() {
    return 't_' + Math.random().toString(36).slice(2, 9);
  }

  _formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  validateText(text) {
    if (!text) return 'Task test cannot be empty!';
    const len = text.trim().length;
    if (len < 3) return 'Text have to have at least 3 signs.';
    if (len > 255) return 'Text cannot be longer than 255 signs.';
    return null;
  }

  validateDateInput(value) {
    if (!value) return null; 
    const entered = new Date(value);
    if (Number.isNaN(entered.getTime())) return 'Invalid date.';
    const now = new Date();
    if (entered <= now) return 'Date must be in the future.';
    return null;
  }

  addTask(text, dateISO='') {
    const vText = this.validateText(text);
    if (vText) throw new Error(vText);
    if (dateISO) {
      const vDate = this.validateDateInput(dateISO);
      if (vDate) throw new Error(vDate);
    }
    const task = { id: this._id(), text: text.trim(), dateISO: dateISO || '' };
    this.tasks.push(task);
    this.save();
    this.draw();
    return task;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
    this.draw();
  }

  editTask(id, newText, newDateISO) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const vText = this.validateText(newText);
    if (vText) throw new Error(vText);
    if (newDateISO) {
      const vDate = this.validateDateInput(newDateISO);
      if (vDate) throw new Error(vDate);
    }
    this.tasks[idx].text = newText.trim();
    this.tasks[idx].dateISO = newDateISO || '';
    this.save();
    this.draw();
  }

  get filteredTasks() {
    const q = this.term.trim().toLowerCase();
    if (q.length < 2) return this.tasks.slice(); 
    return this.tasks.filter(t => t.text.toLowerCase().includes(q));
  }

  highlight(text, term) {
    if (!term || term.trim().length < 2) return this.escapeHtml(text);
    const q = this.escapeRegExp(term.trim());
    const re = new RegExp(`(${q})`, 'ig');
    return this.escapeHtml(text).replace(re, '<span class="highlight">$1</span>');
  }

  escapeHtml(s){
    return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  escapeRegExp(s){
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  //DOM rendering
  clearList() {
    this.listEl.innerHTML = '';
  }

  draw() {
    this.clearList();
    const tasks = this.filteredTasks;
    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'task-item';
      empty.innerHTML = '<div class="task-main"><div class="task-title" style="color:var(--muted)">No tasks</div></div>';
      this.listEl.appendChild(empty);
      return;
    }

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;

      //title
      const main = document.createElement('div');
      main.className = 'task-main';

      // editable on click
      const titleDiv = document.createElement('div');
      titleDiv.className = 'task-title';
      
      titleDiv.innerHTML = this.highlight(task.text, this.term);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'task-meta';
      metaDiv.textContent = task.dateISO ? `Date: ${this._formatDate(task.dateISO)}` : 'No date';

      main.appendChild(titleDiv);
      main.appendChild(metaDiv);

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn delete-btn';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Remove';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to remove task?')) {
          this.removeTask(task.id);
        }
      });

      actions.appendChild(delBtn);

      li.appendChild(main);
      li.appendChild(actions);

      titleDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        this._enterEditMode(li, task);
      });

      this.listEl.appendChild(li);
    });
  }

  _enterEditMode(li, task){
    li.innerHTML = '';
    li.classList.add('editing');

    const main = document.createElement('div');
    main.className = 'task-main';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'edit-input';
    textInput.value = task.text;
    textInput.maxLength = 255;

    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    dateInput.className = 'edit-datetime';
    if (task.dateISO) {
      const d = new Date(task.dateISO);
      const pad = (n) => String(n).padStart(2, '0');
      const val = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      dateInput.value = val;
    } else {
      dateInput.value = '';
    }

    main.appendChild(textInput);
    main.appendChild(dateInput);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'icon-btn';
    saveBtn.textContent = '💾';
    saveBtn.title = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'icon-btn';
    cancelBtn.textContent = '✖';
    cancelBtn.title = 'Cancel';

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete-btn';
    delBtn.textContent = '🗑️';
    delBtn.title = 'Remove';

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    actions.appendChild(delBtn);

    li.appendChild(main);
    li.appendChild(actions);

    textInput.focus();
    textInput.select();

    const saveChanges = () => {
      const newText = textInput.value;
      const newDateRaw = dateInput.value;
      let dateISO = '';
      if (newDateRaw) {
        const entered = new Date(newDateRaw);
        if (!Number.isNaN(entered.getTime())) {
          dateISO = entered.toISOString();
        }
      }
      try {
        this.editTask(task.id, newText, dateISO);
      } catch (err) {
        alert(err.message || 'Validation error');
        // keep edit mode
        textInput.focus();
        return;
      }
    };

    const cancel = () => this.draw();

    saveBtn.addEventListener('click', (e) => { e.stopPropagation(); saveChanges(); });
    cancelBtn.addEventListener('click', (e) => { e.stopPropagation(); cancel(); });
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Are you sure you want to remove task?')) this.removeTask(task.id); });

    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveChanges();
      if (e.key === 'Escape') cancel();
    });
    dateInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveChanges();
      if (e.key === 'Escape') cancel();
    });

    const onFocusOut = (e) => {
      setTimeout(() => {
        if (!li.contains(document.activeElement)) {
          saveChanges();
        }
      }, 0);
    };
    textInput.addEventListener('focusout', onFocusOut);
    dateInput.addEventListener('focusout', onFocusOut);
  }

  handleAdd() {
    const text = this.taskTextInput.value;
    const dateRaw = this.taskDateInput.value;
    let dateISO = '';
    if (dateRaw) {
      const entered = new Date(dateRaw);
      if (!Number.isNaN(entered.getTime())) dateISO = entered.toISOString();
    }
    try {
      this.addTask(text, dateISO);
      this.taskTextInput.value = '';
      this.taskDateInput.value = '';
      this.taskTextInput.focus();
    } catch (err) {
      alert(err.message || 'Validation error during loading');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.TODO_APP = new Todo();
});

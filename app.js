(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(`kaytlin-${key}`)); return value ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(`kaytlin-${key}`, JSON.stringify(value));
  let tasks = read('tasks', []);
  let steps = read('steps', [
    { text: 'Take a short walk outside', done: false },
    { text: 'Make a screen-free cup of tea', done: false },
    { text: 'Write down one thing I enjoyed', done: false }
  ]);
  let mood = read('mood', '');
  let goal = read('goal', 'Make a little time for myself');
  let selectedCheckinMood = mood;

  const now = new Date();
  const dateLong = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  const dateWeekday = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(now).toUpperCase();
  $('#today-date').textContent = `YOUR ${dateWeekday}`;
  $('.welcome-card .eyebrow').textContent = dateLong.toUpperCase();

  function renderTasks() {
    const todayList = $('#today-task-list');
    const allList = $('#all-task-list');
    const html = tasks.map((task, index) => `<li class="task-row ${task.done ? 'done' : ''}"><button class="task-toggle" data-task-toggle="${index}" aria-label="${task.done ? 'Mark incomplete' : 'Mark complete'}">${task.done ? '✓' : ''}</button><span class="task-text">${escapeHtml(task.text)}</span><button class="task-delete" data-task-delete="${index}" aria-label="Delete task">×</button></li>`).join('');
    todayList.innerHTML = html;
    allList.innerHTML = html;
    $('#task-empty').hidden = tasks.length > 0;
    $('#all-task-empty').hidden = tasks.length > 0;
    $('#nav-count').textContent = tasks.filter(item => !item.done).length;
  }
  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function renderGoals() {
    $('#goal-heading').textContent = goal;
    $('#today-goal').textContent = `${goal.charAt(0).toUpperCase()}${goal.slice(1)}.`;
    $('#goal-steps').innerHTML = steps.map((step, index) => `<label class="goal-step ${step.done ? 'done' : ''}"><input type="checkbox" data-step="${index}" ${step.done ? 'checked' : ''}><span>${escapeHtml(step.text)}</span></label>`).join('');
    const done = steps.filter(step => step.done).length;
    const percent = steps.length ? `${done / steps.length * 100}%` : '0%';
    $('#goal-progress-bar').style.width = percent;
    $('#goal-progress-bar-large').style.width = percent;
    $('#goal-progress-text').textContent = `${done} of ${steps.length} small steps`;
    $('#goal-progress-text-large').textContent = `${done} of ${steps.length} steps complete`;
  }
  function setMood(value) {
    mood = value;
    selectedCheckinMood = value;
    write('mood', mood);
    $$('[data-mood]').forEach(button => button.classList.toggle('selected', button.dataset.mood === mood));
    $('#mood-result').textContent = mood ? `Today feels ${mood.toLowerCase()}. Thanks for checking in.` : 'There is no wrong way to feel today.';
  }
  function showView(name) {
    $$('.view-panel').forEach(panel => panel.classList.toggle('active', panel.id === `view-${name}`));
    $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === name));
    const titles = { today: 'A little space for today', tasks: 'Tasks for your day', goals: 'Goals & intentions', checkin: 'Daily check-in', notes: 'Your notes' };
    $('#view-title').textContent = titles[name] || titles.today;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderTasks();
  renderGoals();
  setMood(mood);
  $('#quick-note').value = read('quick-note', '');
  $('#long-note').value = read('long-note', '');
  $('#checkin-note').value = read('checkin-note', '');
  const history = read('checkin-history', []);
  $('#checkin-history').textContent = history.length ? `Previous check-ins: ${history.slice(-3).map(item => `${item.date} · ${item.mood}`).join('  /  ')}` : '';

  $$('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  $$('[data-jump]').forEach(button => button.addEventListener('click', () => showView(button.dataset.jump)));
  $$('[data-form="task"]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const input = $('input[name="task"]', form);
    const value = input.value.trim();
    if (!value) return;
    tasks.unshift({ text: value, done: false });
    write('tasks', tasks);
    renderTasks();
    form.reset();
  }));
  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-task-toggle]');
    const remove = event.target.closest('[data-task-delete]');
    const moodButton = event.target.closest('[data-mood]');
    if (toggle) {
      const index = Number(toggle.dataset.taskToggle); tasks[index].done = !tasks[index].done; write('tasks', tasks); renderTasks();
    }
    if (remove) {
      tasks.splice(Number(remove.dataset.taskDelete), 1); write('tasks', tasks); renderTasks();
    }
    if (moodButton) { selectedCheckinMood = moodButton.dataset.mood; setMood(selectedCheckinMood); }
  });
  $('#goal-steps').addEventListener('change', event => {
    if (!event.target.matches('[data-step]')) return;
    steps[Number(event.target.dataset.step)].done = event.target.checked; write('steps', steps); renderGoals();
  });
  $('#goal-form').addEventListener('submit', event => {
    event.preventDefault(); const input = $('input[name="step"]', event.currentTarget); const value = input.value.trim();
    if (!value) return; steps.push({ text: value, done: false }); write('steps', steps); renderGoals(); event.currentTarget.reset();
  });
  $('#edit-goal').addEventListener('click', () => {
    const next = window.prompt('What intention would you like to keep in view?', goal);
    if (next?.trim()) { goal = next.trim(); write('goal', goal); renderGoals(); }
  });
  function saveText(id, key, statusId) {
    const field = $(`#${id}`); let timer;
    field.addEventListener('input', () => {
      $(`#${statusId}`).textContent = 'Saving…'; clearTimeout(timer);
      timer = setTimeout(() => { write(key, field.value); $(`#${statusId}`).textContent = 'Saved on this device'; }, 250);
    });
  }
  saveText('quick-note', 'quick-note', 'note-status');
  saveText('long-note', 'long-note', 'long-note-status');
  $('#checkin-note').addEventListener('input', event => write('checkin-note', event.target.value));
  $('#save-checkin').addEventListener('click', () => {
    const historyItems = read('checkin-history', []);
    historyItems.push({ date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(now), mood: selectedCheckinMood || 'No mood selected', note: $('#checkin-note').value.trim() });
    write('checkin-history', historyItems);
    $('#checkin-history').textContent = `Saved for today. Previous check-ins: ${historyItems.slice(-3).map(item => `${item.date} · ${item.mood}`).join('  /  ')}`;
    $('#save-checkin').innerHTML = 'Check-in saved <span>✓</span>';
    setTimeout(() => { $('#save-checkin').innerHTML = 'Save today\'s check-in <span>→</span>'; }, 1800);
  });
})();

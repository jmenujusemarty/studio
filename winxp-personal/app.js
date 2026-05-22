const startButton = document.getElementById('startButton');
const startMenu = document.getElementById('startMenu');
const taskbar = document.getElementById('tasks');
const clock = document.getElementById('clock');
const windows = [...document.querySelectorAll('.xp-window')];
const securityBalloon = document.querySelector('.security-balloon');
let topZ = 30;

const titles = {
  welcome: 'Welcome',
  computer: 'My Computer',
  about: 'About Me',
  projects: 'My Projects',
  notepad: 'Notes.txt',
  paint: 'Gallery',
  trash: 'Recycle Bin'
};

function setClock() {
  clock.textContent = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function renderTasks(activeId) {
  taskbar.innerHTML = '';
  windows
    .filter((windowEl) => windowEl.classList.contains('open'))
    .forEach((windowEl) => {
      const id = windowEl.dataset.window;
      const button = document.createElement('button');
      button.className = `task-button${id === activeId ? ' active' : ''}`;
      button.innerHTML = `<i class="mini folder"></i>${titles[id] || id}`;
      button.addEventListener('click', () => {
        if (windowEl.classList.contains('active')) {
          windowEl.classList.remove('open', 'active');
        } else {
          openWindow(id);
        }
        renderTasks(id);
      });
      taskbar.appendChild(button);
    });
}

function focusWindow(windowEl) {
  topZ += 1;
  windows.forEach((item) => item.classList.remove('active'));
  windowEl.classList.add('active');
  windowEl.style.zIndex = topZ;
  renderTasks(windowEl.dataset.window);
}

function openWindow(id) {
  const windowEl = document.querySelector(`[data-window="${id}"]`);
  if (!windowEl) return;
  windowEl.classList.add('open');
  focusWindow(windowEl);
  startMenu.classList.remove('open');
}

function closeWindow(id) {
  const windowEl = document.querySelector(`[data-window="${id}"]`);
  if (!windowEl) return;
  windowEl.classList.remove('open', 'active');
  const next = windows.find((item) => item.classList.contains('open'));
  if (next) focusWindow(next);
  renderTasks(next?.dataset.window || '');
}

function makeDraggable(windowEl) {
  const bar = windowEl.querySelector('.titlebar');
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let dragging = false;

  bar.addEventListener('pointerdown', (event) => {
    if (window.matchMedia('(max-width: 780px)').matches) return;
    dragging = true;
    focusWindow(windowEl);
    startX = event.clientX;
    startY = event.clientY;
    const rect = windowEl.getBoundingClientRect();
    originX = rect.left;
    originY = rect.top;
    bar.setPointerCapture(event.pointerId);
  });

  bar.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const nextX = Math.max(8, Math.min(window.innerWidth - windowEl.offsetWidth - 8, originX + event.clientX - startX));
    const nextY = Math.max(8, Math.min(window.innerHeight - windowEl.offsetHeight - 48, originY + event.clientY - startY));
    windowEl.style.left = `${nextX}px`;
    windowEl.style.top = `${nextY}px`;
  });

  bar.addEventListener('pointerup', (event) => {
    dragging = false;
    bar.releasePointerCapture(event.pointerId);
  });
}

document.querySelectorAll('[data-open]').forEach((control) => {
  control.addEventListener('click', () => openWindow(control.dataset.open));
});

document.querySelectorAll('[data-close]').forEach((control) => {
  control.addEventListener('click', (event) => {
    event.stopPropagation();
    closeWindow(control.dataset.close);
  });
});

document.querySelectorAll('[data-minimize]').forEach((control) => {
  control.addEventListener('click', (event) => {
    event.stopPropagation();
    const windowEl = document.querySelector(`[data-window="${control.dataset.minimize}"]`);
    windowEl?.classList.remove('open', 'active');
    renderTasks('');
  });
});

windows.forEach((windowEl) => {
  windowEl.addEventListener('pointerdown', () => focusWindow(windowEl));
  makeDraggable(windowEl);
});

startButton.addEventListener('click', (event) => {
  event.stopPropagation();
  startMenu.classList.toggle('open');
});

document.addEventListener('click', (event) => {
  if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
    startMenu.classList.remove('open');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') startMenu.classList.remove('open');
});

securityBalloon?.querySelector('button')?.addEventListener('click', () => {
  securityBalloon.remove();
});

setClock();
setInterval(setClock, 15000);
renderTasks('computer');

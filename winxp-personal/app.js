const windows = [...document.querySelectorAll('[data-window-panel]')];
const triggers = [...document.querySelectorAll('[data-window]')];
const taskApps = [...document.querySelectorAll('.task-app')];
const icons = [...document.querySelectorAll('.desktop-icon[data-window]')];
const startMenu = document.getElementById('startMenu');
const startButton = document.getElementById('startButton');
const clock = document.getElementById('clock');
let topZ = 40;

function setClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function syncActive(id) {
  taskApps.forEach((button) => button.classList.toggle('is-active', button.dataset.window === id));
  icons.forEach((button) => button.classList.toggle('is-active', button.dataset.window === id));
}

function openWindow(id) {
  const panel = document.querySelector(`[data-window-panel="${id}"]`);
  if (!panel) return;

  panel.classList.add('is-open');
  focusWindow(panel);
  syncActive(id);
  startMenu.classList.remove('is-open');
}

function closeWindow(id) {
  const panel = document.querySelector(`[data-window-panel="${id}"]`);
  if (!panel) return;

  panel.classList.remove('is-open', 'is-front');
  const next = windows.find((windowPanel) => windowPanel.classList.contains('is-open'));
  if (next) {
    focusWindow(next);
    syncActive(next.dataset.windowPanel);
  }
}

function focusWindow(panel) {
  topZ += 1;
  windows.forEach((windowPanel) => windowPanel.classList.remove('is-front'));
  panel.classList.add('is-front');
  panel.style.zIndex = topZ;
}

function makeDraggable(panel) {
  const titlebar = panel.querySelector('.window-titlebar');
  let startX = 0;
  let startY = 0;
  let panelX = 0;
  let panelY = 0;
  let dragging = false;

  titlebar.addEventListener('pointerdown', (event) => {
    if (window.matchMedia('(max-width: 820px)').matches) return;
    dragging = true;
    focusWindow(panel);
    startX = event.clientX;
    startY = event.clientY;
    const rect = panel.getBoundingClientRect();
    panelX = rect.left;
    panelY = rect.top;
    titlebar.setPointerCapture(event.pointerId);
  });

  titlebar.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const nextX = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, panelX + event.clientX - startX));
    const nextY = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 48, panelY + event.clientY - startY));
    panel.style.left = `${nextX}px`;
    panel.style.top = `${nextY}px`;
  });

  titlebar.addEventListener('pointerup', (event) => {
    dragging = false;
    titlebar.releasePointerCapture(event.pointerId);
  });
}

triggers.forEach((trigger) => {
  trigger.addEventListener('click', () => openWindow(trigger.dataset.window));
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    closeWindow(button.dataset.close);
  });
});

windows.forEach((panel) => {
  panel.addEventListener('pointerdown', () => {
    focusWindow(panel);
    syncActive(panel.dataset.windowPanel);
  });
  makeDraggable(panel);
});

startButton.addEventListener('click', () => {
  startMenu.classList.toggle('is-open');
});

document.addEventListener('click', (event) => {
  if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
    startMenu.classList.remove('is-open');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    startMenu.classList.remove('is-open');
  }
});

setClock();
setInterval(setClock, 15000);

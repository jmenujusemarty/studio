const startButton = document.getElementById('startButton');
const startMenu = document.getElementById('startMenu');
const trayTabs = document.getElementById('trayTabs');
const clock = document.getElementById('clock');
const securityTip = document.getElementById('securityTip');
const galleryImage = document.getElementById('galleryImage');
const windows = [...document.querySelectorAll('.window')];
const galleryImages = [
  '/winxp-personal/assets/gallery/0.webp',
  '/winxp-personal/assets/gallery/1.webp',
  '/winxp-personal/assets/gallery/2.webp',
  '/winxp-personal/assets/gallery/3.webp',
  '/winxp-personal/assets/gallery/4.webp',
  '/winxp-personal/assets/gallery/5.webp'
];
let galleryIndex = 0;
let topZ = 40;

const windowMeta = {
  computer: { title: 'My Computer', icon: '/winxp-personal/assets/mycomputer.png' },
  welcome: { title: 'Quick Start Guide', icon: '/winxp-personal/assets/help.png' },
  about: { title: 'System Information', icon: '/winxp-personal/assets/users.png' },
  work: { title: 'My Work', icon: '/winxp-personal/assets/cmd.png' },
  gallery: { title: 'My Photography Collection', icon: '/winxp-personal/assets/folder_image.png' },
  outlook: { title: 'Outlook Express', icon: '/winxp-personal/assets/outlook.png' },
  bin: { title: 'Recycle Bin', icon: '/winxp-personal/assets/recycling_bin.png' }
};

function setClock() {
  clock.textContent = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function renderTray(activeId) {
  trayTabs.innerHTML = '';
  windows
    .filter((windowEl) => windowEl.classList.contains('open'))
    .forEach((windowEl) => {
      const id = windowEl.dataset.window;
      const meta = windowMeta[id] || { title: id, icon: '/winxp-personal/assets/folder.png' };
      const button = document.createElement('button');
      button.className = `tray-tab${id === activeId ? ' active' : ''}`;
      button.innerHTML = `<img src="${meta.icon}" alt="">${meta.title}`;
      button.addEventListener('click', () => {
        if (windowEl.classList.contains('active')) {
          windowEl.classList.remove('open', 'active');
          renderTray('');
        } else {
          openWindow(id);
        }
      });
      trayTabs.appendChild(button);
    });
}

function focusWindow(windowEl) {
  topZ += 1;
  windows.forEach((item) => item.classList.remove('active'));
  windowEl.classList.add('active');
  windowEl.style.zIndex = topZ;
  renderTray(windowEl.dataset.window);
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
  windowEl.classList.remove('open', 'active', 'maximized');
  const next = windows.find((item) => item.classList.contains('open'));
  if (next) focusWindow(next);
  renderTray(next?.dataset.window || '');
}

function makeDraggable(windowEl) {
  const titlebar = windowEl.querySelector('.titlebar');
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let dragging = false;

  titlebar.addEventListener('pointerdown', (event) => {
    if (window.matchMedia('(max-width: 760px)').matches || windowEl.classList.contains('maximized')) return;
    dragging = true;
    focusWindow(windowEl);
    startX = event.clientX;
    startY = event.clientY;
    const rect = windowEl.getBoundingClientRect();
    originX = rect.left;
    originY = rect.top;
    titlebar.setPointerCapture(event.pointerId);
  });

  titlebar.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const nextX = Math.max(4, Math.min(window.innerWidth - windowEl.offsetWidth - 4, originX + event.clientX - startX));
    const nextY = Math.max(4, Math.min(window.innerHeight - windowEl.offsetHeight - 39, originY + event.clientY - startY));
    windowEl.style.left = `${nextX}px`;
    windowEl.style.top = `${nextY}px`;
  });

  titlebar.addEventListener('pointerup', (event) => {
    dragging = false;
    titlebar.releasePointerCapture(event.pointerId);
  });
}

document.querySelectorAll('[data-open]').forEach((control) => {
  control.addEventListener('click', (event) => {
    const href = control.getAttribute('href');
    if (href === '#') event.preventDefault();
    openWindow(control.dataset.open);
  });
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
    renderTray('');
  });
});

document.querySelectorAll('[data-maximize]').forEach((control) => {
  control.addEventListener('click', (event) => {
    event.stopPropagation();
    const windowEl = document.querySelector(`[data-window="${control.dataset.maximize}"]`);
    if (!windowEl) return;
    windowEl.classList.toggle('maximized');
    focusWindow(windowEl);
  });
});

document.querySelectorAll('[data-slide]').forEach((control) => {
  control.addEventListener('click', () => {
    galleryIndex = (galleryIndex + Number(control.dataset.slide) + galleryImages.length) % galleryImages.length;
    galleryImage.src = galleryImages[galleryIndex];
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

securityTip?.querySelector('button')?.addEventListener('click', () => securityTip.remove());

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') startMenu.classList.remove('open');
});

setClock();
setInterval(setClock, 15000);
renderTray('computer');

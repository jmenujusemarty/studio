const startButton = document.getElementById('startButton');
const startMenu = document.getElementById('startMenu');
const clock = document.getElementById('clock');
const detailsPanel = document.getElementById('detailsPanel');

const sections = {
  about: {
    title: 'About Me',
    text: 'Jsem Marty. Stavim weby, male produkty, automatizace a retro digitalni veci s vlastnim charakterem.'
  },
  computer: {
    title: 'My Computer',
    text: 'Cesta: C:\\Documents and Settings\\Marty\\Portfolio. Tady je rozcestnik na projekty, odkazy a kontakt.'
  },
  bin: {
    title: 'Recycling Bin',
    text: 'Tady konci nudne sablony, genericke landing pages a veci bez nazoru.'
  },
  resume: {
    title: 'My Resume',
    text: 'Profil je pripraveny na doplneni realneho CV, klientu, stacku a rychlych odkazu.'
  },
  work: {
    title: 'My Work',
    text: 'AI Studio, webove nastroje, automatizace, obsahove systemy a hrave mikrostranky.'
  },
  hobbies: {
    title: 'My Hobbies',
    text: 'Retro UI, fotografie, experimenty, hry s webovou grafikou a veci, ktere pusobi jako z jine doby.'
  }
};

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function showSection(key) {
  const section = sections[key] || sections.about;
  detailsPanel.innerHTML = `
    <div class="details-title"><span class="tiny-icon info"></span><strong>${section.title}</strong></div>
    <p>${section.text}</p>
  `;
  startMenu.classList.remove('open');
}

document.querySelectorAll('[data-section]').forEach((item) => {
  item.addEventListener('click', () => showSection(item.dataset.section));
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
  if (event.key === 'Escape') {
    startMenu.classList.remove('open');
  }
});

updateClock();
setInterval(updateClock, 15000);

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function getBrusselsNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });

  const wkMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayIdx = wkMap[map.weekday] ?? now.getDay();
  const mins = Number(map.hour) * 60 + Number(map.minute);
  return { dayIdx, dayKey: JS_DAY_TO_KEY[dayIdx], mins, date: `${map.year}-${map.month}-${map.day}` };
}

function resolveDay(config, dayKey, date) {
  return (config.exceptions || []).find(e => e.date === date) || config.hours[dayKey];
}
function findNextOpening(config, currentDayIdx, todayDate) {
  const base = new Date(todayDate + 'T12:00:00Z');
  for (let offset = 1; offset <= 14; offset++) {
    const date = new Date(base.getTime() + offset * 86400000).toISOString().slice(0,10);
    const idx = (currentDayIdx + offset) % 7;
    const day = resolveDay(config, JS_DAY_TO_KEY[idx], date);
    if (day && !day.closed && day.shifts?.length) {
      return (offset === 1 ? 'Morgen' : date) + ' ' + day.shifts[0][0];
    }
  }
  return 'Binnenkort';
}

function computeShopStatus(config) {
  const { dayIdx, dayKey, mins, date } = getBrusselsNow();
  const today = resolveDay(config, dayKey, date);

  if (!today || today.closed || !today.shifts || today.shifts.length === 0) {
    const nextOpen = findNextOpening(config, dayIdx, date);
    return {
      state: 'closed',
      pillText: `GESLOTEN • ${nextOpen}`,
      detailText: `Vandaag gesloten. Eerstvolgende opening: ${nextOpen} — altijd zonder afspraak.`
    };
  }

  for (let i = 0; i < today.shifts.length; i++) {
    const [startStr, endStr] = today.shifts[i];
    const start = parseMinutes(startStr);
    const end = parseMinutes(endStr);

    if (mins >= start && mins < end) {
      return {
        state: 'open',
        pillText: `NU OPEN • tot ${endStr}`,
        detailText: `Nu open tot ${endStr}! Spring gerust binnen zonder afspraak.`
      };
    }

    if (mins < start) {
      if (i > 0) {
        return {
          state: 'break',
          pillText: `MIDDAGPAUZE • ${startStr}`,
          detailText: `Korte middagpauze — om ${startStr} staan we weer klaar zonder afspraak!`
        };
      }
      return {
        state: 'closed',
        pillText: `OPEN OM ${startStr}`,
        detailText: `Vandaag open vanaf ${startStr} — gewoon binnenstappen zonder afspraak.`
      };
    }
  }

  const nextOpen = findNextOpening(config, dayIdx, date);
  return {
    state: 'closed',
    pillText: `GESLOTEN • ${nextOpen}`,
    detailText: `De zaak is gesloten voor vandaag. We verwelkomen je graag terug (${nextOpen}).`
  };
}

function renderAnnouncement(config) {
  const bar = document.getElementById('announcement-bar');
  const textEl = document.getElementById('announcement-text');
  const tagEl = document.getElementById('announcement-tag');
  if (!bar || !textEl || !tagEl) return;

  if (config.announcement && config.announcement.active && config.announcement.text) {
    bar.classList.add('is-visible');
    bar.classList.toggle('is-alert', config.announcement.type === 'alert');
    tagEl.textContent = config.announcement.type === 'alert' ? 'Opgelet' : 'Update';
    textEl.textContent = config.announcement.text;
  } else {
    bar.classList.remove('is-visible', 'is-alert');
  }
}

function renderStatus(config) {
  const status = computeShopStatus(config);
  const pills = document.querySelectorAll('.js-status-pill');
  pills.forEach((pill) => {
    pill.classList.remove('is-open', 'is-break', 'is-closed');
    pill.classList.add(`is-${status.state}`);
    const txt = pill.querySelector('.js-status-text');
    if (txt) txt.textContent = status.pillText;
  });

  const heroDetail = document.getElementById('hero-live-detail');
  if (heroDetail) {
    heroDetail.textContent = status.detailText;
  }
}

function renderServices(config) {
  const grid = document.getElementById('services-grid');
  if (!grid || !Array.isArray(config.services)) return;

  grid.innerHTML = config.services.map((srv) => `
    <article class="service-card">
      <div class="service-info">
        <h3>
          <span>${escapeHtml(srv.name)}</span>
          ${srv.tag ? `<span class="service-tag">${escapeHtml(srv.tag)}</span>` : ''}
        </h3>
        <p>${escapeHtml(srv.desc)}</p>
      </div>
      <div class="service-price">${escapeHtml(srv.price)}</div>
    </article>
  `).join('');
}

function renderHours(config) {
  const list = document.getElementById('hours-list');
  if (!list || !config.hours) return;

  const { dayKey, date } = getBrusselsNow();

  list.innerHTML = DAY_ORDER.map((key) => {
    const d = key === dayKey ? resolveDay(config, key, date) : config.hours[key];
    if (!d) return '';
    const isToday = key === dayKey;
    let timeHtml = '';

    if (d.closed || !d.shifts || d.shifts.length === 0) {
      timeHtml = `<span class="hours-closed">Gesloten${d.note ? ` (${escapeHtml(d.note)})` : ''}</span>`;
    } else {
      const formattedShifts = d.shifts.map(([s, e]) => `${s} – ${e}`).join(' &amp; ');
      timeHtml = `${formattedShifts}${d.note ? `<br><small>${escapeHtml(d.note)}</small>` : ''}`;
    }

    return `
      <li class="hours-row ${isToday ? 'is-today' : ''}">
        <span class="hours-day">
          ${escapeHtml(d.label)}
          ${isToday ? '<span class="today-badge">Vandaag</span>' : ''}
        </span>
        <span class="hours-time">${timeHtml}</span>
      </li>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let lastValidConfig = null;
async function loadConfig() {
  try {
    const response = await fetch('/api/config', {cache:'no-store'});
    if (response.ok) {
      const data = await response.json();
      if (data && data.config && data.config.hours && Array.isArray(data.config.services)) {
        lastValidConfig = data.config;
        return data.config;
      }
    }
  } catch (_) { /* API unavailable */ }
  if (lastValidConfig) return lastValidConfig;
  // Temporary static fallback only; the live API remains the source of truth.
  try {
    const response = await fetch('./data/site-config.json', {cache:'no-store'});
    if (response.ok) { lastValidConfig = await response.json(); return lastValidConfig; }
  } catch (_) {}
  return null;
}

function applyAll(config) {
  if (!config) return;
  renderAnnouncement(config);
  renderStatus(config);
  renderServices(config);
  renderHours(config);
}

async function init() {
  const refresh = async () => {
    const config = await loadConfig();
    if (config) applyAll(config);
  };
  await refresh();
  // Refresh both status and changes published from Murat's phone.
  setInterval(refresh, 60000);
}
document.addEventListener('DOMContentLoaded', init);

const STORAGE_KEY = 'mk_style_live_config_v1';
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
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });

  const wkMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayIdx = wkMap[map.weekday] ?? now.getDay();
  const mins = Number(map.hour) * 60 + Number(map.minute);
  return { dayIdx, dayKey: JS_DAY_TO_KEY[dayIdx], mins };
}

function findNextOpening(hoursConfig, currentDayIdx) {
  for (let offset = 1; offset <= 7; offset++) {
    const idx = (currentDayIdx + offset) % 7;
    const key = JS_DAY_TO_KEY[idx];
    const dayObj = hoursConfig[key];
    if (dayObj && !dayObj.closed && dayObj.shifts && dayObj.shifts.length > 0) {
      const shortLabel = dayObj.label.slice(0, 2);
      return `${offset === 1 ? 'Morgen' : shortLabel} ${dayObj.shifts[0][0]}`;
    }
  }
  return 'Binnenkort';
}

function computeShopStatus(config) {
  const { dayIdx, dayKey, mins } = getBrusselsNow();
  const today = config.hours[dayKey];

  if (config.announcement?.active && config.announcement?.forceClosedToday) {
    return {
      state: 'closed',
      pillText: 'TIJDELIJK GESLOTEN',
      detailText: config.announcement.text || 'Uitzonderlijk gesloten — bekijk de melding bovenaan.'
    };
  }

  if (!today || today.closed || !today.shifts || today.shifts.length === 0) {
    const nextOpen = findNextOpening(config.hours, dayIdx);
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

  const nextOpen = findNextOpening(config.hours, dayIdx);
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
    bar.classList.toggle('is-alert', Boolean(config.announcement.forceClosedToday || config.announcement.type === 'alert'));
    tagEl.textContent = config.announcement.forceClosedToday ? 'Sluiting / Verlof' : 'Update';
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

  const { dayKey } = getBrusselsNow();

  list.innerHTML = DAY_ORDER.map((key) => {
    const d = config.hours[key];
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

async function loadConfig() {
  let baseConfig = null;
  try {
    const res = await fetch('./data/site-config.json', { cache: 'no-store' });
    if (res.ok) baseConfig = await res.json();
  } catch (_) {
    // Fallback if opened via file://
  }

  const localRaw = localStorage.getItem(STORAGE_KEY);
  if (localRaw) {
    try {
      const parsed = JSON.parse(localRaw);
      return baseConfig ? { ...baseConfig, ...parsed } : parsed;
    } catch (_) {}
  }

  return baseConfig;
}

function applyAll(config) {
  if (!config) return;
  renderAnnouncement(config);
  renderStatus(config);
  renderServices(config);
  renderHours(config);
}

async function init() {
  const config = await loadConfig();
  if (config) {
    applyAll(config);
    setInterval(() => renderStatus(config), 30000);
  }

  window.addEventListener('storage', async (e) => {
    if (e.key === STORAGE_KEY) {
      const updated = await loadConfig();
      applyAll(updated);
    }
  });

  if ('BroadcastChannel' in window) {
    const bc = new BroadcastChannel('mk_style_sync');
    bc.onmessage = async () => {
      const updated = await loadConfig();
      applyAll(updated);
    };
  }
}

document.addEventListener('DOMContentLoaded', init);

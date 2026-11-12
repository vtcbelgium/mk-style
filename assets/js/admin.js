const STORAGE_KEY = 'mk_style_live_config_v1';
const DAY_MAP = {
  maandag: 'monday',
  dinsdag: 'tuesday',
  woensdag: 'wednesday',
  donderdag: 'thursday',
  vrijdag: 'friday',
  zaterdag: 'saturday',
  zondag: 'sunday'
};
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

let baseConfig = null;
let currentConfig = null;
const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('mk_style_sync') : null;

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.remove('is-visible'), 3400);
}

async function fetchBaseConfig() {
  try {
    const res = await fetch('./data/site-config.json', { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (_) {}
  return null;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function saveConfig(cfg) {
  currentConfig = cfg;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  if (syncChannel) syncChannel.postMessage({ updatedAt: Date.now() });
  renderAdminControls();
}

function normalizeTimeToken(raw) {
  const m = raw.trim().match(/^(\d{1,2})(?:[:uU.](\d{2}))?$/);
  if (!m) return null;
  const hh = String(Math.min(23, Number(m[1]))).padStart(2, '0');
  const mm = String(Math.min(59, Number(m[2] || '00'))).padStart(2, '0');
  return `${hh}:${mm}`;
}

function builtInDutchAiEngine(prompt, cfg) {
  const next = clone(cfg);
  const lower = prompt.toLowerCase();
  const actions = [];

  // 1. Check for reset / restore normal hours
  if (/(herstel|normale|standaard|verwijder.*melding|wis.*melding)/.test(lower) && baseConfig) {
    const fresh = clone(baseConfig);
    return {
      config: fresh,
      summary: 'Standaard openingsuren zijn hersteld en de melding bovenaan de website is verwijderd.',
      socialPost: `💈 Deze week staan we weer op onze vertrouwde uren voor jullie klaar bij MK Style!\n\nSpring gewoon binnen ZONDER AFSPRAAK:\n🕒 Di – Vr: 09:30 – 13:00 & 13:30 – 18:30\n🕒 Za: 09:00 – 17:00\n\n📍 Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt)\n📞 0484 07 39 08\n\n#MKStyle #MK38Style #BarbierBilzen #Beverst #BilzenHoeselt #ZonderAfspraak`
    };
  }

  // 2. Detect day-specific hour / closure changes
  let matchedDayLabel = null;
  for (const [nlDay, enKey] of Object.entries(DAY_MAP)) {
    const dayRegex = new RegExp(`\\b${nlDay}\\b`, 'i');
    if (!dayRegex.test(lower)) continue;

    // Watch out if a second day is mentioned only as "vrijdag terug open"
    const clauseAroundDay = lower.split(/[.!]|maar|en vanaf/)[0];
    const inFirstClause = clauseAroundDay.includes(nlDay);

    if (inFirstClause && /(gesloten|dicht|toe)/.test(clauseAroundDay)) {
      next.hours[enKey].closed = true;
      next.hours[enKey].shifts = [];
      next.hours[enKey].note = 'Uitzonderlijk gesloten';
      matchedDayLabel = next.hours[enKey].label;
      actions.push(`${matchedDayLabel} op 'Gesloten' gezet`);
    } else {
      const timeRange = prompt.match(/(\d{1,2}(?:[:uU.]\d{2})?)\s*(?:tot|-|–|t\/m)\s*(\d{1,2}(?:[:uU.]\d{2})?)/i);
      if (timeRange && inFirstClause) {
        const start = normalizeTimeToken(timeRange[1]);
        const end = normalizeTimeToken(timeRange[2]);
        if (start && end) {
          next.hours[enKey].closed = false;
          next.hours[enKey].shifts = [[start, end]];
          next.hours[enKey].note = 'Aangepaste uren';
          matchedDayLabel = next.hours[enKey].label;
          actions.push(`${matchedDayLabel} aangepast naar ${start} – ${end}`);
        }
      }
    }
  }

  // 3. Detect holiday / vacation / today closure
  const isVacationOrHoliday = /(verlof|vakantie|feestdag|gesloten|uitzonderlijk dicht)/.test(lower);
  const isTodayClosed = /(vandaag.*gesloten|nu.*gesloten|met verlof|in jaarlijks verlof)/.test(lower);

  next.announcement = {
    active: true,
    type: isVacationOrHoliday ? 'alert' : 'info',
    text: prompt.trim(),
    forceClosedToday: isTodayClosed,
    updatedAt: new Date().toISOString()
  };
  actions.push('Melding bovenaan de website geactiveerd');

  // 4. Optional price tweak detection (e.g., "herenknipbeurt €27")
  const priceMatch = prompt.match(/(knip(?:pen|beurt)?|baard|kindersnit|bros|tondeuse)[^€\d]{0,25}€?\s*(\d{2})/i);
  if (priceMatch && Array.isArray(next.services)) {
    const targetWord = priceMatch[1].toLowerCase();
    const newPrice = `€${priceMatch[2]}`;
    const srv = next.services.find((s) => s.name.toLowerCase().includes(targetWord.slice(0, 4)));
    if (srv) {
      srv.price = newPrice;
      actions.push(`Prijs van '${srv.name}' aangepast naar ${newPrice}`);
    }
  }

  const emoji = isVacationOrHoliday ? '📢' : '✨';
  const socialPost = `${emoji} UPDATE VAN MK STYLE!\n\n${prompt.trim()}\n\nKom gerust langs in ons salon — zoals altijd 100% ZONDER AFSPRAAK! ✂️💈\n\n📍 Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt)\n📞 0484 07 39 08\n🌐 mk38style.be\n\n#MKStyle #MK38Style #KapperBilzen #BarbierBilzen #Beverst #BilzenHoeselt #ZonderAfspraak`;

  return {
    config: next,
    summary: `AI heeft je website bijgewerkt: ${actions.join(' • ')}.`,
    socialPost
  };
}

async function runGeminiIfKeyProvided(apiKey, prompt, cfg) {
  const sysPrompt = `Je bent de AI-assistent voor herenkapsalon MK Style (Murat) op Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt).
Pas op basis van de instructie van Murat het JSON configuratie-object aan en schrijf een vlotte Vlaamse Facebook/Instagram post met emoji's en lokale hashtags (#MKStyle #BarbierBilzen #Beverst #ZonderAfspraak).
Geef ENKEL geldige JSON terug met exact deze 3 velden:
{
  "config": <volledig bijgewerkt site-config object>,
  "summary": "<korte Nederlandse samenvatting wat op de site is aangepast>",
  "socialPost": "<klaarstaande Facebook & Instagram post tekst>"
}
Huidige config: ${JSON.stringify(cfg)}
Instructie van Murat: ${prompt}`;

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: sysPrompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!resp.ok) throw new Error(`Gemini API fout (${resp.status})`);
  const data = await resp.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawText);
}

function renderAdminControls() {
  if (!currentConfig) return;
  document.getElementById('manual-banner-text').value = currentConfig.announcement?.text || '';
  document.getElementById('manual-banner-active').checked = Boolean(currentConfig.announcement?.active);
  document.getElementById('manual-force-closed').checked = Boolean(currentConfig.announcement?.forceClosedToday);

  const editor = document.getElementById('admin-hours-editor');
  editor.innerHTML = DAY_ORDER.map((key) => {
    const d = currentConfig.hours[key];
    const val = d.closed ? 'Gesloten' : d.shifts.map(([s, e]) => `${s}-${e}`).join(', ');
    return `
      <div style="display: grid; grid-template-columns: 115px 1fr; gap: 10px; align-items: center;">
        <span style="font-size: 0.88rem; font-weight: 600;">${d.label}</span>
        <input type="text" class="input-text js-day-input" data-day="${key}" value="${val}" style="padding: 7px 11px; font-family: var(--font-mono); font-size: 0.83rem;" />
      </div>
    `;
  }).join('');
}

function parseManualHoursInputs() {
  const inputs = document.querySelectorAll('.js-day-input');
  inputs.forEach((inp) => {
    const key = inp.dataset.day;
    const raw = inp.value.trim();
    if (!raw || /gesloten/i.test(raw)) {
      currentConfig.hours[key].closed = true;
      currentConfig.hours[key].shifts = [];
    } else {
      const parts = raw.split(/[,&]/).map((s) => s.trim()).filter(Boolean);
      const shifts = [];
      parts.forEach((p) => {
        const m = p.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
        if (m) shifts.push([m[1], m[2]]);
      });
      if (shifts.length > 0) {
        currentConfig.hours[key].closed = false;
        currentConfig.hours[key].shifts = shifts;
      }
    }
  });
}

function setupSpeechRecognition() {
  const micBtn = document.getElementById('mic-btn');
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    micBtn.title = 'Spraakherkenning wordt niet ondersteund in deze browser (gebruik Chrome/Edge/Safari)';
    micBtn.addEventListener('click', () => showToast('Gebruik Chrome of Safari om in te spreken, of typ je boodschap hiernaast.'));
    return;
  }

  const rec = new SpeechRec();
  rec.lang = 'nl-BE';
  rec.interimResults = false;

  micBtn.addEventListener('click', () => {
    try {
      rec.start();
      micBtn.classList.add('is-listening');
      showToast('Aan het luisteren... Spreek je update in het Nederlands.');
    } catch (_) {
      rec.stop();
    }
  });

  rec.onresult = (ev) => {
    const transcript = ev.results?.[0]?.[0]?.transcript || '';
    if (transcript) {
      document.getElementById('ai-prompt').value = transcript;
      showToast('Spraak herkend! Klik op Verwerk met AI.');
    }
  };
  rec.onend = () => micBtn.classList.remove('is-listening');
  rec.onerror = () => micBtn.classList.remove('is-listening');
}

async function initAdmin() {
  baseConfig = await fetchBaseConfig();
  const saved = localStorage.getItem(STORAGE_KEY);
  currentConfig = saved ? JSON.parse(saved) : clone(baseConfig);
  renderAdminControls();
  setupSpeechRecognition();

  // PIN gate
  if (sessionStorage.getItem('mk_admin_unlocked') === '1') {
    document.getElementById('pin-modal').classList.add('is-hidden');
  }
  document.getElementById('pin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('pin-input').value.trim();
    if (val === '3824' || val === '3800') {
      sessionStorage.setItem('mk_admin_unlocked', '1');
      document.getElementById('pin-modal').classList.add('is-hidden');
    } else {
      showToast('Verkeerde pincode (Demo-code: 3824)');
    }
  });

  // Preset chips
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('ai-prompt').value = btn.dataset.prompt;
    });
  });

  // Run AI button
  document.getElementById('run-ai-btn').addEventListener('click', async () => {
    const prompt = document.getElementById('ai-prompt').value.trim();
    if (!prompt) {
      showToast('Typ of spreek eerst een instructie in!');
      return;
    }

    const btn = document.getElementById('run-ai-btn');
    const apiKey = document.getElementById('gemini-key-input').value.trim();
    btn.disabled = true;
    btn.textContent = 'Bezig met verwerken...';

    try {
      const result = apiKey
        ? await runGeminiIfKeyProvided(apiKey, prompt, currentConfig)
        : builtInDutchAiEngine(prompt, currentConfig);

      saveConfig(result.config);
      document.getElementById('social-caption').value = result.socialPost;

      const sumEl = document.getElementById('ai-summary');
      sumEl.textContent = `✓ ${result.summary}`;
      sumEl.classList.add('is-visible');
      showToast('Website live aangepast + Social post klaargezet!');
    } catch (err) {
      showToast(`Fout: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '&#9889; Verwerk met AI &amp; Pas Website Aan';
    }
  });

  // Manual save
  document.getElementById('save-manual-btn').addEventListener('click', () => {
    currentConfig.announcement = {
      active: document.getElementById('manual-banner-active').checked,
      type: document.getElementById('manual-force-closed').checked ? 'alert' : 'info',
      text: document.getElementById('manual-banner-text').value.trim(),
      forceClosedToday: document.getElementById('manual-force-closed').checked,
      updatedAt: new Date().toISOString()
    };
    parseManualHoursInputs();
    saveConfig(currentConfig);
    showToast('Handmatige instellingen opgeslagen!');
  });

  // Reset to defaults
  document.getElementById('reset-all-btn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    currentConfig = clone(baseConfig);
    if (syncChannel) syncChannel.postMessage({ updatedAt: Date.now() });
    renderAdminControls();
    document.getElementById('ai-summary').classList.remove('is-visible');
    showToast('Standaardinstellingen zijn teruggezet.');
  });

  // Export JSON
  document.getElementById('export-json-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site-config.json';
    a.click();
    showToast('site-config.json gedownload!');
  });

  // Photo picker for social post
  document.querySelectorAll('.photo-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.photo-thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      document.getElementById('social-preview-img').src = thumb.dataset.src;
    });
  });

  // Copy social caption
  document.getElementById('copy-caption-btn').addEventListener('click', async () => {
    const text = document.getElementById('social-caption').value;
    await navigator.clipboard.writeText(text);
    showToast('Tekst gekopieerd naar klembord!');
  });

  // Publish via Make/n8n Webhook
  document.getElementById('publish-webhook-btn').addEventListener('click', async () => {
    const url = document.getElementById('webhook-url').value.trim();
    const caption = document.getElementById('social-caption').value;
    const activeThumb = document.querySelector('.photo-thumb.is-active');
    const imagePath = activeThumb ? activeThumb.dataset.src : './assets/images/interior-hex-lights.jpg';

    if (!url) {
      showToast('Demo-modus: Stel onderaan een Make.com / n8n Webhook URL in om live te posten naar FB & IG!');
      return;
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          imageUrl: new URL(imagePath, window.location.href).href,
          channels: ['facebook_page', 'instagram_business'],
          shop: 'MK Style'
        })
      });
      showToast('Verzonden naar Make.com / n8n voor publicatie op Facebook & Instagram!');
    } catch (err) {
      showToast(`Webhook fout: ${err.message}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', initAdmin);

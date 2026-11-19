// Zero-latency deterministic parser for common Dutch salon admin commands.
// Returns null for anything nuanced, ambiguous, or multi-intent so an LLM handles it.
import { applyAiOperation, applyChanges, datesInRange, isIsoDate, localBelgianDate } from './site.js';
import { makeSocialDraft } from './social.js';

const MONTHS = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maart: 3, mrt: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  augustus: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  december: 12, dec: 12
};

const WEEKDAYS = {
  zondag: 0,
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function addDaysIso(iso, deltaDays) {
  const base = new Date(iso + 'T12:00:00Z');
  return new Date(base.getTime() + deltaDays * 86400000).toISOString().slice(0, 10);
}

function inferYear(month, day, todayIso) {
  const year = Number(todayIso.slice(0, 4));
  const candidate = `${year}-${pad2(month)}-${pad2(day)}`;
  if (isIsoDate(candidate) && candidate >= todayIso) return candidate;
  const nextYear = `${year + 1}-${pad2(month)}-${pad2(day)}`;
  return isIsoDate(nextYear) ? nextYear : null;
}

/**
 * Resolve an isolated Dutch date expression into YYYY-MM-DD, or null if invalid.
 */
export function resolveDutchDate(raw, todayIso = localBelgianDate()) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'vandaag') return todayIso;
  if (s === 'morgen') return addDaysIso(todayIso, 1);
  if (s === 'overmorgen') return addDaysIso(todayIso, 2);

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso && isIsoDate(s)) return s;

  const dm = /^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/.exec(s);
  if (dm) {
    const day = Number(dm[1]), month = Number(dm[2]);
    if (dm[3]) {
      const year = dm[3].length === 2 ? 2000 + Number(dm[3]) : Number(dm[3]);
      const full = `${year}-${pad2(month)}-${pad2(day)}`;
      return isIsoDate(full) ? full : null;
    }
    return inferYear(month, day, todayIso);
  }

  const named = /^(\d{1,2})\s+([a-z]+)\.?(?:\s+(\d{4}))?$/.exec(s);
  if (named && MONTHS[named[2]]) {
    const day = Number(named[1]), month = MONTHS[named[2]];
    if (named[3]) {
      const full = `${named[3]}-${pad2(month)}-${pad2(day)}`;
      return isIsoDate(full) ? full : null;
    }
    return inferYear(month, day, todayIso);
  }

  const wd = /^(?:komende|volgende|aanstaande)\s+(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)$/.exec(s);
  if (wd) {
    const target = WEEKDAYS[wd[1]];
    const current = new Date(todayIso + 'T12:00:00Z').getUTCDay();
    let delta = (target - current + 7) % 7;
    if (delta === 0) delta = 7;
    return addDaysIso(todayIso, delta);
  }
  return null;
}

function extractDates(text, todayIso) {
  const matches = [];
  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}\s+(?:januari|jan|februari|feb|maart|mrt|april|apr|mei|juni|jun|juli|jul|augustus|aug|september|sept|sep|oktober|okt|november|nov|december|dec)\.?(?:\s+\d{4})?\b/gi,
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    /\b(?:komende|volgende|aanstaande)\s+(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/gi,
    /\b(?:overmorgen|morgen|vandaag)\b/gi
  ];

  const occupied = [];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const start = m.index, end = start + m[0].length;
      if (occupied.some(([a, b]) => start < b && end > a)) continue;
      const iso = resolveDutchDate(m[0], todayIso);
      if (!iso) return null;
      occupied.push([start, end]);
      matches.push({ start, end, raw: m[0], iso });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

function extractTimeRanges(text) {
  const ranges = [];
  const re = /\b([01]?\d|2[0-3])(?:[:.](\d{2})|u(\d{2})?)\s*(?:-|–|tot|t\/m)\s*([01]?\d|2[0-3])(?:[:.](\d{2})|u(\d{2})?)\b/gi;
  for (const m of text.matchAll(re)) {
    const sH = pad2(m[1]), sM = pad2(m[2] || m[3] || '0');
    const eH = pad2(m[4]), eM = pad2(m[5] || m[6] || '0');
    ranges.push([`${sH}:${sM}`, `${eH}:${eM}`]);
  }
  return ranges;
}

function cleanNote(text, fallback = '') {
  const match = /\b(?:wegens|omwille\s+van|reden:?|voor)\s+([^.,;!?<>]{2,60})/i.exec(text);
  const candidate = match ? match[1].trim() : fallback;
  return candidate.replace(/[<>]/g, '').slice(0, 80);
}

function normalizePrice(text) {
  const euroBefore = /€\s*(\d{1,3}(?:[,.]\d{2})?)(?!\d)/.exec(text);
  const euroAfter = /\b(\d{1,3}(?:[,.]\d{2})?)\s*euro\b/i.exec(text);
  const matches = [...text.matchAll(/€\s*\d{1,3}(?:[,.]\d{2})?|\b\d{1,3}(?:[,.]\d{2})?\s*euro\b/gi)];
  if (matches.length !== 1) return null;
  const num = (euroBefore?.[1] || euroAfter?.[1] || '').replace(/\s+/g, '');
  if (!num) return null;
  return '€' + num;
}

function findMatchingService(text, services = []) {
  const low = text.toLowerCase();
  const specificRules = [
    ['knip-baard', /\bknippen\s*(?:en|&|\+)\s*baard\b/i],
    ['was-style', /\b(?:wassen|hoofdhuidmassage|was-style|knippen,?\s*wassen)\b/i],
    ['kids', /\b(?:kindersnit|kinder\w*|kids|jongens|tot\s*12)\b/i],
    ['tondeuse', /\b(?:tondeuse\w*|bros|buzzcut|buzz)\b/i],
    ['baard', /\bbaard\b/i],
    ['knip', /\b(?:herenknipbeurt|herensnit|normale\s+knipbeurt|knipbeurt|heren)\b/i]
  ];
  const matchedIds = new Set();
  for (const [id, re] of specificRules) {
    if (re.test(low) && services.some(s => s.id === id)) {
      if (id === 'baard' && matchedIds.has('knip-baard')) continue;
      if (id === 'knip' && (matchedIds.has('knip-baard') || matchedIds.has('was-style'))) continue;
      matchedIds.add(id);
    }
  }
  if (matchedIds.size !== 1) return null;
  const id = [...matchedIds][0];
  return services.find(s => s.id === id) || null;
}

function buildResult(config, operation, summary) {
  const changes = applyAiOperation(config, operation);
  const preview = applyChanges(config, changes);
  let socialDraft = '';
  try {
    if (operation.action === 'set_exception') {
      socialDraft = makeSocialDraft(preview, { platform: 'instagram', topic: 'special_hours', date: operation.date }).caption;
    } else if (operation.action === 'set_price') {
      socialDraft = makeSocialDraft(preview, { platform: 'instagram', topic: 'service', serviceId: operation.serviceId }).caption;
    }
  } catch {
    socialDraft = '';
  }
  return { operation, changes, preview, summary, socialDraft };
}

/**
 * Deterministically parse clear single Dutch salon commands before falling back to an LLM.
 */
export function parseDutchCommand(prompt, config, todayIso = localBelgianDate()) {
  const raw = String(prompt || '').trim();
  if (raw.length < 5 || raw.length > 500) return null;
  // Unedited placeholders or template hints belong to human/clarify handling.
  if (/[[\]]|JJJJ-MM-DD|YYYY-MM-DD|voorbeeld/i.test(raw)) return null;

  const dates = extractDates(raw, todayIso);
  if (dates === null) return null;
  const timeRanges = extractTimeRanges(raw);
  const euroMatches = [...raw.matchAll(/€|\beuro\b/gi)];

  // Guard against multi-intent sentences combining price + schedule or multiple prices.
  if (euroMatches.length > 0 && dates.length > 0) return null;

  // 1. Hide announcement
  if (dates.length === 0 && euroMatches.length === 0 &&
      /\b(?:verberg|verwijder|zet\s+uit|sluit|haal\s+.*weg|geen)\b/i.test(raw) &&
      /\b(?:melding|banner|bericht|aankondiging)\b/i.test(raw)) {
    return buildResult(
      config,
      { action: 'set_announcement', active: false, type: 'info', text: '' },
      'De melding bovenaan de website wordt verborgen.'
    );
  }

  // 2. Show explicit announcement (requires clear colon or quotes so vague creative requests go to LLM)
  if (dates.length === 0 && euroMatches.length === 0 &&
      /\b(?:melding|banner|aankondiging)\b/i.test(raw) &&
      /\b(?:toon|zet|plaats|maak|activeer|zet\s+aan)\b/i.test(raw)) {
    const colonOrQuote = /:\s*["']?([^"'\n<>]{4,220})["']?$|["']([^"'\n<>]{4,220})["']/.exec(raw);
    const text = (colonOrQuote?.[1] || colonOrQuote?.[2] || '').trim();
    if (text && text.length <= 220) {
      const type = /\b(?:alert|waarschuwing|opgelet|spoed|dringend|belangrijk)\b/i.test(raw) ? 'alert' : 'info';
      return buildResult(
        config,
        { action: 'set_announcement', active: true, type, text },
        `Melding bovenaan de website ingesteld (${type}): "${text}".`
      );
    }
    return null;
  }

  // 3. Multi-day holiday closure range (strictly 2 dates with explicit range separator)
  if (dates.length === 2 && timeRanges.length === 0 &&
      /\b(?:van|vanaf)\b[\s\S]{1,40}\b(?:tot(?:\s+en\s+met)?|t\/m|tm|-|–)\b/i.test(raw) &&
      /\b(?:gesloten|dicht|toe|verlof|vakantie|sluit\w*)\b/i.test(raw)) {
    const startDate = dates[0].iso, endDate = dates[1].iso;
    try {
      const days = datesInRange(startDate, endDate);
      const fallback = /\bverlof\b/i.test(raw) ? 'Jaarlijks verlof' : (/\bvakantie\b/i.test(raw) ? 'Vakantie' : 'Gesloten');
      const note = cleanNote(raw, fallback);
      return buildResult(
        config,
        { action: 'set_exception_range', startDate, endDate, closed: true, note },
        `Sluiting voor ${days.length} dag(en) van ${startDate} t/m ${endDate}${note ? ` (${note})` : ''}. Vaste weekuren blijven behouden.`
      );
    } catch {
      return null;
    }
  }

  // 4. Remove an existing single-date exception
  if (dates.length === 1 && timeRanges.length === 0 &&
      /\b(?:verwijder|annuleer|schrap|herstel|toch\s+open|normale?\s+(?:uren|openingsuren))\b/i.test(raw)) {
    const date = dates[0].iso;
    if ((config.exceptions || []).some(e => e.date === date)) {
      return buildResult(
        config,
        { action: 'remove_exception', date },
        `Uitzondering op ${date} verwijderen (normale weekuren gelden weer).`
      );
    }
  }

  // 5. Single-date exception (closed OR custom hours)
  if (dates.length === 1) {
    const date = dates[0].iso;
    if (timeRanges.length >= 1 && timeRanges.length <= 3 && /\b(?:open|geopend|uren|openingsuren)\b/i.test(raw)) {
      const note = cleanNote(raw, 'Aangepaste openingsuren');
      try {
        return buildResult(
          config,
          { action: 'set_exception', date, closed: false, shifts: timeRanges, note },
          `Aangepaste uren op ${date}: ${timeRanges.map(r => r.join('–')).join(' & ')}.`
        );
      } catch {
        return null;
      }
    }
    if (timeRanges.length === 0 && /\b(?:gesloten|dicht|toe|sluit\w*|verlof|feestdag|ziek|familiedag|vakantie)\b/i.test(raw)) {
      const kwFallback =
        /\bfeestdag\b/i.test(raw) ? 'Feestdag'
        : /\bfamiliedag\b/i.test(raw) ? 'Familiedag'
        : /\bverlof\b/i.test(raw) ? 'Verlof'
        : /\bvakantie\b/i.test(raw) ? 'Vakantie'
        : 'Uitzonderlijk gesloten';
      const note = cleanNote(raw, kwFallback);
      try {
        return buildResult(
          config,
          { action: 'set_exception', date, closed: true, shifts: [], note },
          `Uitzonderlijk gesloten op ${date}${note ? ` (${note})` : ''}. Vaste weekuren blijven ongewijzigd.`
        );
      } catch {
        return null;
      }
    }
  }

  // 6. Single service price change
  if (dates.length === 0 && euroMatches.length === 1) {
    const price = normalizePrice(raw);
    const service = findMatchingService(raw, config.services);
    if (price && service) {
      try {
        return buildResult(
          config,
          { action: 'set_price', serviceId: service.id, price },
          `Prijs van "${service.name}" aanpassen van ${service.price} naar ${price}.`
        );
      } catch {
        return null;
      }
    }
  }

  return null;
}

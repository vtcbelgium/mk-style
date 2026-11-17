// Shared pure validation. Never trust AI output or browser input.
export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const obj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v, max) => typeof v === 'string' && v.length <= max && !/[<>]/.test(v);
const time = (v) => typeof v === 'string' && /^([01]\\d|2[0-3]):[0-5]\\d$/.test(v);
const minutes = (v) => Number(v.slice(0,2)) * 60 + Number(v.slice(3));
const price = (v) => typeof v === 'string' && /^€\\s?(?:[1-9]\\d{0,2}|0)(?:[,.]\\d{2})?$/.test(v);
const fail = (m) => { throw new InputError(m); };
export const isIsoDate = (value) => {
  if (typeof value !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value;
};
function shifts(value, day) {
  if (!Array.isArray(value) || value.length > 3) fail('Ongeldige tijdvakken voor ' + day);
  let last = -1;
  return value.map((range) => {
    if (!Array.isArray(range) || range.length !== 2 || !time(range[0]) || !time(range[1])) fail('Ongeldige uren voor ' + day);
    const [start, end] = range.map(minutes);
    if (end <= start || start < last) fail('Overlappende of omgekeerde uren voor ' + day);
    last = end;
    return [...range];
  });
}
function schedule(input, label, fallbackLabel) {
  if (!obj(input) || typeof input.closed !== 'boolean' || !text(input.note ?? '', 80)) fail('Ongeldig rooster voor ' + label);
  const slots = shifts(input.shifts, label);
  if ((input.closed && slots.length) || (!input.closed && slots.length === 0)) fail('Inconsistente sluiting voor ' + label);
  return { label: fallbackLabel || input.label || label, closed: input.closed, shifts: slots, note: input.note || '' };
}
export function applyChanges(base, changes) {
  if (!obj(base) || !obj(changes)) fail('Onjuiste configuratie');
  const keys = Object.keys(changes);
  if (!keys.length || keys.some(k => !['hours','exceptions','announcement','services'].includes(k))) fail('Niet-toegestane wijziging');
  const next = structuredClone(base);
  if ('hours' in changes) {
    if (!obj(changes.hours) || Object.keys(changes.hours).length !== 7 || !weekdays.every(d => d in changes.hours)) fail('Onvolledig weekrooster');
    next.hours = Object.fromEntries(weekdays.map(d => [d, schedule(changes.hours[d], d, base.hours[d]?.label)]));
  }
  if ('exceptions' in changes) {
    if (!Array.isArray(changes.exceptions) || changes.exceptions.length > 120) fail('Te veel sluitingsdagen');
    const dates = new Set();
    next.exceptions = changes.exceptions.map(e => {
      if (!obj(e) || !isIsoDate(e.date) || dates.has(e.date)) fail('Ongeldige of dubbele datum');
      dates.add(e.date);
      const hours = schedule(e, e.date, e.date);
      return { date: e.date, closed: hours.closed, shifts: hours.shifts, note: hours.note };
    }).sort((a,b) => a.date.localeCompare(b.date));
  }
  if ('announcement' in changes) {
    const a = changes.announcement;
    if (!obj(a) || typeof a.active !== 'boolean' || !['info','alert'].includes(a.type) || !text(a.text, 220)) fail('Ongeldige melding');
    if (a.active && !a.text.trim()) fail('Actieve melding is leeg');
    // Old demo forceClosedToday was not date-bounded and is deliberately disabled.
    next.announcement = { active:a.active, type:a.type, text:a.text.trim(), forceClosedToday:false, updatedAt:new Date().toISOString() };
  }
  if ('services' in changes) {
    const old = base.services;
    if (!Array.isArray(old) || !Array.isArray(changes.services) || old.length !== changes.services.length) fail('Dienstenlijst komt niet overeen');
    const proposed = new Map(changes.services.map(s => [s?.id, s]));
    if (proposed.size !== old.length) fail('Dubbele diensten');
    next.services = old.map(s => {
      const edit = proposed.get(s.id);
      if (!obj(edit) || !price(edit.price) || !text(edit.name, 100) || !text(edit.desc, 350)) fail('Ongeldige dienst of prijs');
      return { ...s, name:edit.name, desc:edit.desc, price:edit.price };
    });
  }
  return next;
}
export function applyAiOperation(base, operation) {
  if (!obj(operation) || typeof operation.action !== 'string') fail('AI voorstel onduidelijk');
  const op = operation;
  if (op.action === 'set_exception') {
    if (!isIsoDate(op.date)) fail('AI geeft ongeldige datum');
    const current = Array.isArray(base.exceptions) ? base.exceptions.filter(e => e.date !== op.date) : [];
    return { exceptions: [...current, { date:op.date, closed:op.closed, shifts:op.shifts || [], note:op.note || '' }] };
  }
  if (op.action === 'set_announcement') {
    return { announcement: { active:op.active, type:op.type, text:op.text } };
  }
  if (op.action === 'set_price') {
    if (!Array.isArray(base.services) || !base.services.some(s=>s.id===op.serviceId)) fail('Dienst niet gevonden');
    return { services:base.services.map(s=>s.id===op.serviceId ? { ...s, price:op.price } : s) };
  }
  fail('AI-actie niet toegestaan. Gebruik handmatige bediening.');
}
export function localBelgianDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}

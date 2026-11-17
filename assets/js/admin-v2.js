// Production-oriented admin client: Cloudflare Access + server-side JWT + D1.
let current = null;
let version = null;
let pending = null;
const $ = id => document.getElementById(id);
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
function toast(message) {
  const e = $('toast'); e.textContent = message; e.classList.add('is-visible');
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>e.classList.remove('is-visible'),6000);
}
async function api(url,method='GET',body) {
  const res = await fetch(url,{method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const data = await res.json().catch(()=>({error:'Onverwacht serverantwoord'}));
  if (!res.ok) throw new Error(data.error || 'Serverfout (' + res.status + ')');
  return data;
}
function showSummary(text) {
  const e=$('ai-summary');e.textContent=text;e.classList.add('is-visible');
}
async function reload() {
  const data = await api('/api/admin/config');
  current = data.config; version = data.version; pending = null;
  $('pending-ai').style.display='none';
  render();
  toast('Servergegevens geladen (versie ' + version + ')');
}
function render() {
  if (!current) return;
  $('manual-banner-text').value=current.announcement?.text||'';
  $('manual-banner-active').checked=!!current.announcement?.active;
  const editor=$('admin-hours-editor');editor.replaceChildren();
  for (const day of DAYS) {
    const d=current.hours[day], row=document.createElement('div');
    row.style.cssText='display:grid;grid-template-columns:115px 1fr;gap:10px;align-items:center';
    const label=document.createElement('label');label.textContent=d.label;
    const input=document.createElement('input');
    input.className='input-text js-day-input';input.dataset.day=day;
    input.value=d.closed?'Gesloten':d.shifts.map(s=>s.join(' - ')).join(', ');
    input.placeholder='09:30 - 13:00, 13:30 - 18:30';input.style.padding='7px 11px';
    label.htmlFor='hours-'+day;input.id='hours-'+day;
    row.append(label,input);editor.append(row);
  }
  const service=$('price-service');service.replaceChildren();
  for(const s of current.services) {
    const option=document.createElement('option');option.value=s.id;
    option.textContent=s.name+' — '+s.price;service.appendChild(option);
  }
  $('existing-exceptions').replaceChildren();
  for(const exception of (current.exceptions||[]).slice().sort((a,b)=>a.date.localeCompare(b.date))) {
    const item=document.createElement('div');
    item.style.cssText='display:flex;gap:8px;align-items:center;justify-content:space-between;margin:7px 0';
    const label=document.createElement('span');
    label.textContent=exception.date + ' · ' + (exception.closed?'Gesloten':exception.shifts.map(s=>s.join('-')).join(', ')) + (exception.note?' · '+exception.note:'');
    const btn=document.createElement('button');btn.type='button';btn.className='btn btn-outline btn-sm';
    btn.textContent='Verwijder';btn.addEventListener('click',()=>deleteException(exception.date));
    item.append(label,btn);$('existing-exceptions').appendChild(item);
  }
}
function parseShifts(raw) {
  if (/^gesloten$/i.test(raw.trim())) return {closed:true,shifts:[]};
  const parts=raw.split(',').map(s=>s.trim());
  if (!parts.length || parts.some(s=>!/^([01]\d|2[0-3]):[0-5]\d\s*[-–]\s*([01]\d|2[0-3]):[0-5]\d$/.test(s))) {
    throw new Error('Gebruik "Gesloten" of bijvoorbeeld 09:30 - 13:00, 13:30 - 18:30.');
  }
  const shifts=parts.map(p=>p.split(/[-–]/).map(s=>s.trim()));
  return {closed:false,shifts};
}
async function publish(changes,source='manual') {
  const data=await api('/api/admin/config','PATCH',{expectedVersion:version,changes,source});
  if (data.unchanged) {toast('Geen wijziging nodig.');return;}
  if (!data.published) throw new Error('Geen bevestiging van publicatie');
  current=data.config;version=data.version;pending=null;
  $('pending-ai').style.display='none';render();
  showSummary('✓ Server heeft versie '+version+' opgeslagen en teruggelezen. Controleer de openbare website op een ander toestel.');
  toast('Wijziging centraal opgeslagen, versie '+version);
}
function showProposal(data) {
  pending=data;
  const box=$('pending-ai');box.replaceChildren();box.style.display='block';
  const title=document.createElement('h3');title.textContent='Controleer het AI-voorstel';
  const p=document.createElement('p');p.textContent=data.summary||'Is dit correct?';
  const details=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Toon alle gewijzigde gegevens';
  const pre=document.createElement('pre');pre.style.cssText='max-height:240px;overflow:auto;white-space:pre-wrap;font-size:12px';
  pre.textContent=JSON.stringify(data.changes,null,2);
  details.append(summary,pre);
  const controls=document.createElement('div');controls.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin-top:12px';
  const confirm=document.createElement('button');confirm.className='btn btn-gold btn-sm';confirm.textContent='Ik keur goed — publiceer';
  const cancel=document.createElement('button');cancel.className='btn btn-outline btn-sm';cancel.textContent='Annuleer';
  confirm.addEventListener('click',async()=>{
    confirm.disabled=true;
    try{await publish(data.changes,'ai');if(data.socialDraft) $('social-caption').value=data.socialDraft;}
    catch(e){toast('Niet gepubliceerd: '+e.message);}finally{confirm.disabled=false;}
  });
  cancel.addEventListener('click',()=>{pending=null;box.style.display='none';toast('Voorstel geannuleerd; niets gewijzigd.');});
  controls.append(confirm,cancel);box.append(title,p,details,controls);
}
function addManualPanel() {
  const root=document.querySelector('.admin-grid > div');
  const sec=document.createElement('section');sec.className='panel';
  // Only static markup; user-supplied data is always inserted via textContent/value.
  sec.innerHTML=`<h2>📅 Uitzonderlijke sluitingsdag</h2>
    <p class="panel-sub">Verandert alleen deze datum, niet alle woensdagen of vrijdagen.</p>
    <div class="field-row"><label for="exception-date">Datum</label><input id="exception-date" class="input-text" type="date"></div>
    <div class="field-row"><label><input id="exception-closed" type="checkbox" checked> Op deze datum gesloten</label></div>
    <div class="field-row"><label for="exception-hours">Alternatieve uren (bij open)</label><input id="exception-hours" class="input-text" placeholder="09:00 - 13:00"></div>
    <div class="field-row"><label for="exception-note">Reden</label><input id="exception-note" class="input-text" maxlength="80" placeholder="Bijvoorbeeld: verlof"></div>
    <button id="exception-save" class="btn btn-outline btn-sm">Bewaar uitzondering</button>
    <div id="existing-exceptions" style="margin-top:18px"></div>
    <hr style="margin:22px 0;border:0;border-top:1px solid var(--border-subtle)">
    <h2>💶 Prijs aanpassen</h2>
    <div class="field-row"><label for="price-service">Dienst</label><select id="price-service" class="input-text"></select></div>
    <div class="field-row"><label for="price-value">Nieuwe prijs</label><input id="price-value" class="input-text" placeholder="€27" maxlength="9"></div>
    <button id="price-save" class="btn btn-outline btn-sm">Bewaar prijs</button>
    <hr style="margin:22px 0;border:0;border-top:1px solid var(--border-subtle)">
    <h2>↩️ Herstel vorige wijziging</h2>
    <p class="panel-sub">Maak de laatst gepubliceerde wijziging ongedaan. De server bewaart ook de herstelactie.</p>
    <button id="undo-last" class="btn btn-outline btn-sm">Herstel vorige versie</button>`;
  root.append(sec);
}
async function deleteException(date) {
  if (!confirm('Uitzondering '+date+' verwijderen?')) return;
  try { await publish({exceptions:(current.exceptions||[]).filter(e=>e.date!==date)}); }
  catch(e){toast(e.message);}
}
function wire() {
  $('reset-all-btn').addEventListener('click',()=>reload().catch(e=>toast(e.message)));
  $('run-ai-btn').addEventListener('click',async()=>{
    const prompt=$('ai-prompt').value.trim();if(!prompt){toast('Geef eerst een opdracht.');return;}
    const btn=$('run-ai-btn');btn.disabled=true;showSummary('Voorstel voorbereiden; er wordt nog niets gepubliceerd.');
    try {
      const data=await api('/api/admin/propose','POST',{prompt,expectedVersion:version});
      if (data.clarification) showSummary(data.clarification);
      else showProposal(data);
    }catch(e){toast('AI niet beschikbaar: '+e.message);}
    finally{btn.disabled=false;}
  });
  document.querySelectorAll('.chip-btn').forEach(b=>b.addEventListener('click',()=>{$('ai-prompt').value=b.dataset.prompt;}));
  $('save-manual-btn').addEventListener('click',async()=>{
    try{
      const hours=structuredClone(current.hours);
      for(const input of document.querySelectorAll('.js-day-input')){
        const parsed=parseShifts(input.value);
        hours[input.dataset.day]={...hours[input.dataset.day],...parsed};
      }
      const text=$('manual-banner-text').value.trim();
      const announcement={active:$('manual-banner-active').checked,type:'info',text};
      await publish({hours,announcement});
    }catch(e){toast('Niet opgeslagen: '+e.message);}
  });
  $('exception-save').addEventListener('click',async()=>{
    try {
      const date=$('exception-date').value;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Selecteer een geldige datum.');
      const closed=$('exception-closed').checked;
      const shifts=closed?[]:parseShifts($('exception-hours').value).shifts;
      if(!closed&&!shifts.length)throw new Error('Voer de afwijkende uren in.');
      const note=$('exception-note').value.trim();
      const exceptions=(current.exceptions||[]).filter(e=>e.date!==date);
      exceptions.push({date,closed,shifts,note});
      await publish({exceptions});
    }catch(e){toast('Niet opgeslagen: '+e.message);}
  });
  $('undo-last').addEventListener('click',async()=>{
    if(!Number.isSafeInteger(version) || version<2) {toast('Geen eerdere wijziging gevonden.');return;}
    if(!confirm('Laatste wijziging ongedaan maken? Dit wordt voor alle bezoekers toegepast.'))return;
    try {
      const data=await api('/api/admin/undo','POST',{expectedVersion:version});
      if(!data.published)throw new Error('Geen bevestiging van herstel');
      current=data.config;version=data.version;render();
      showSummary('✓ Vorige wijziging is hersteld. Versie '+version+' gecontroleerd.');
      toast('Wijziging teruggedraaid.');
    }catch(e){toast('Herstellen mislukt: '+e.message);}
  });
  $('price-save').addEventListener('click',async()=>{
    try {
      const id=$('price-service').value,price=$('price-value').value.trim();
      await publish({services:current.services.map(s=>s.id===id?{...s,price}:s)});
    }catch(e){toast('Niet opgeslagen: '+e.message);}
  });
  $('export-json-btn').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mk-style-config-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  document.querySelectorAll('.photo-thumb').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.photo-thumb').forEach(x=>x.classList.remove('is-active'));
    t.classList.add('is-active');$('social-preview-img').src=t.dataset.src;
  }));
  $('copy-caption-btn').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('social-caption').value);toast('Concept gekopieerd, nog niet gepubliceerd.');}
    catch(e){toast('Kopiëren niet gelukt: '+e.message);}
  });
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(SR) {
    const rec=new SR();rec.lang='nl-BE';rec.interimResults=false;
    $('mic-btn').addEventListener('click',()=>{try{rec.start();toast('Luistert...');}catch{rec.stop();}});
    rec.onresult=e=>{const transcript=e.results?.[0]?.[0]?.transcript;if(transcript)$('ai-prompt').value=transcript;};
  } else {$('mic-btn').disabled=true;$('mic-btn').title='Spraakherkenning niet ondersteund';}
}
document.addEventListener('DOMContentLoaded',async()=>{
  addManualPanel();wire();
  try{await reload();}catch(e){
    showSummary('Beheer is beveiligd of nog niet geconfigureerd. '+e.message);
    toast('Nog niet klaar voor gebruik: '+e.message);
  }
});

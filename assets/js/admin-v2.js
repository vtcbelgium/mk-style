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
async function refreshHistory() {
  const root = $('change-history');
  if (!root) return;
  try {
    const result = await api('/api/admin/history');
    root.replaceChildren();
    if (!Array.isArray(result.history) || result.history.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Nog geen wijzigingen opgeslagen.';
      root.append(empty);
      return;
    }
    for (const entry of result.history.slice(0, 10)) {
      const item = document.createElement('li');
      item.style.cssText = 'padding:9px 0;border-bottom:1px solid var(--border-subtle)';
      const version = document.createElement('strong');
      const type = entry.source === 'ai' ? 'AI-voorstel bevestigd' : 'Handmatige wijziging';
      version.textContent = 'Versie ' + entry.version + ' · ' + type;
      const info = document.createElement('div');
      info.style.cssText = 'font-size:0.78rem;color:var(--text-secondary);margin-top:4px';
      const stamp = new Date(entry.created_at);
      const when = Number.isNaN(stamp.getTime())
        ? 'Datum niet beschikbaar'
        : new Intl.DateTimeFormat('nl-BE', {
            timeZone:'Europe/Brussels',dateStyle:'medium',timeStyle:'short'
          }).format(stamp);
      info.textContent = when + ' · ' + (entry.actor || 'Beheerder');
      item.append(version, info);
      root.append(item);
    }
  } catch {
    root.textContent = 'Wijzigingsgeschiedenis tijdelijk niet beschikbaar.';
  }
}

function showSummary(text) {
  const e=$('ai-summary');e.textContent=text;e.classList.add('is-visible');
}
async function reload() {
  const data = await api('/api/admin/config');
  current = data.config; version = data.version; pending = null;
  $('pending-ai').style.display='none';
  render();
  await refreshHistory();
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
  const socialService=$('social-service');
  if (socialService) {
    const previousId=socialService.value;
    socialService.replaceChildren();
    for(const item of current.services){
      const option=document.createElement('option');
      option.value=item.id;
      option.textContent=item.name+' · '+item.price;
      socialService.appendChild(option);
    }
    if(current.services.some(item=>item.id===previousId))socialService.value=previousId;
  }
  const socialDate=$('social-date');
  if(socialDate){
    const oldDate=socialDate.value;
    socialDate.replaceChildren();
    for(const exception of (current.exceptions||[]).slice().sort((a,b)=>a.date.localeCompare(b.date))){
      const option=document.createElement('option');
      option.value=exception.date;
      option.textContent=exception.date+' · '+(exception.closed?'Gesloten':'Aangepaste uren');
      socialDate.appendChild(option);
    }
    if((current.exceptions||[]).some(e=>e.date===oldDate))socialDate.value=oldDate;
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
  await refreshHistory();
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
function datesForPeriod(startDate,endDate) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error('Kies een begin- en einddatum.');
  }
  const from = new Date(startDate + 'T12:00:00Z');
  const to = new Date(endDate + 'T12:00:00Z');
  if(Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) ||
      from.toISOString().slice(0,10)!==startDate || to.toISOString().slice(0,10)!==endDate) {
    throw new Error('Ongeldige verlofdatum.');
  }
  const days = Math.round((to.getTime()-from.getTime())/86400000)+1;
  if(days<1 || days>31) throw new Error('Kies maximaal 31 opeenvolgende dagen.');
  return Array.from({length:days},(_,i)=>
    new Date(from.getTime()+i*86400000).toISOString().slice(0,10));
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
    <hr style="margin:22px 0;border:0;border-top:1px solid var(--border-subtle)">
    <h2>🏖️ Jaarlijks verlof of meerdere sluitingsdagen</h2>
    <p class="panel-sub">Alle gekozen datums worden als gesloten gemarkeerd. De normale weekuren blijven behouden. Maximaal 31 dagen per keer.</p>
    <div class="field-row"><label for="holiday-start">Van (inclusief)</label><input id="holiday-start" class="input-text" type="date"></div>
    <div class="field-row"><label for="holiday-end">Tot en met (inclusief)</label><input id="holiday-end" class="input-text" type="date"></div>
    <div class="field-row"><label for="holiday-note">Reden</label><input id="holiday-note" class="input-text" maxlength="80" placeholder="Jaarlijks verlof"></div>
    <button id="holiday-save" class="btn btn-outline btn-sm">Bewaar verlofperiode</button>
    <div id="existing-exceptions" style="margin-top:18px"></div>
    <hr style="margin:22px 0;border:0;border-top:1px solid var(--border-subtle)">
    <h2>💶 Prijs aanpassen</h2>
    <div class="field-row"><label for="price-service">Dienst</label><select id="price-service" class="input-text"></select></div>
    <div class="field-row"><label for="price-value">Nieuwe prijs</label><input id="price-value" class="input-text" placeholder="€27" maxlength="9"></div>
    <button id="price-save" class="btn btn-outline btn-sm">Bewaar prijs</button>
    <hr style="margin:22px 0;border:0;border-top:1px solid var(--border-subtle)">
    <h2>↩️ Herstel vorige wijziging</h2>
    <p class="panel-sub">Maak de laatst gepubliceerde wijziging ongedaan. De server bewaart ook de herstelactie.</p>
    <button id="undo-last" class="btn btn-outline btn-sm">Herstel vorige versie</button>
    <hr style="margin:22px 0;border:0;border-top:1px solid var(--border-subtle)">
    <h2>🕒 Laatste wijzigingen</h2>
    <p class="panel-sub">Alleen zichtbaar voor bevoegde beheerders. De server registreert datum, versie en uitvoerder.</p>
    <ol id="change-history" aria-live="polite" style="margin:0;padding:0;list-style:none">
      <li>Geschiedenis laden...</li>
    </ol>`;
  root.append(sec);
}
async function deleteException(date) {
  if (!confirm('Uitzondering '+date+' verwijderen?')) return;
  try { await publish({exceptions:(current.exceptions||[]).filter(e=>e.date!==date)}); }
  catch(e){toast(e.message);}
}
function showSocialOptions(){
  const topic=$('social-topic').value;
  $('social-service-row').style.display=topic==='service'?'block':'none';
  $('social-date-row').style.display=topic==='special_hours'?'block':'none';
}
async function generateSocialDraft(mode){
  if(!current||!Number.isSafeInteger(version))throw new Error('Laad eerst de actuele sitegegevens');
  const topic=$('social-topic').value;
  const payload={
    platform:$('social-platform').value,
    topic,mode,expectedVersion:version,
    brief:$('social-brief').value.trim()
  };
  if(topic==='service')payload.serviceId=$('social-service').value;
  if(topic==='special_hours')payload.date=$('social-date').value;
  const result=await api('/api/admin/social-draft','POST',payload);
  if(result.status!=='draft'||result.posted!==false||result.requiresApproval!==true)
    throw new Error('Server bevestigde niet dat dit alleen een concept is');
  $('social-caption').value=result.caption;
  const labels={instagram:'Instagram',facebook:'Facebook',google:'Google Bedrijfsprofiel'};
  $('social-draft-status').textContent=
    (result.mode==='ai'?'AI-concept':'Gratis sjabloon')+' voor '+
    (labels[result.platform]||result.platform)+
    '. Nog niet geplaatst. Controleer ook de rechten op de gekozen foto.';
  toast('Tekstconcept klaar om te controleren en te kopiëren');
}
function setupSocialStudio(){
  $('social-topic').addEventListener('change',showSocialOptions);
  showSocialOptions();
  for(const [id,mode] of [['social-template-btn','template'],['social-ai-btn','ai']]){
    const button=$(id);
    button.addEventListener('click',async()=>{
      button.disabled=true;
      try{await generateSocialDraft(mode);}
      catch(e){
        $('social-draft-status').textContent='Geen concept gegenereerd: '+e.message;
        toast(e.message);
      }finally{button.disabled=false;}
    });
  }
}
function wire() {
  setupSocialStudio();
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
  $('holiday-save').addEventListener('click',async()=>{
    const btn=$('holiday-save');
    btn.disabled=true;
    try {
      const start=$('holiday-start').value, end=$('holiday-end').value;
      const dates=datesForPeriod(start,end);
      const note=$('holiday-note').value.trim()||'Jaarlijks verlof';
      const dateSet=new Set(dates);
      if(!confirm('Sluit '+dates.length+' dagen van '+start+' t/m '+end+'? Bestaande uitzonderingen op die datums worden vervangen.'))return;
      const exceptions=(current.exceptions||[]).filter(e=>!dateSet.has(e.date));
      exceptions.push(...dates.map(date=>({date,closed:true,shifts:[],note})));
      await publish({exceptions});
    }catch(e){toast('Verlof niet opgeslagen: '+e.message);}
    finally{btn.disabled=false;}
  });
  $('undo-last').addEventListener('click',async()=>{
    if(!Number.isSafeInteger(version) || version<2) {toast('Geen eerdere wijziging gevonden.');return;}
    if(!confirm('Laatste wijziging ongedaan maken? Dit wordt voor alle bezoekers toegepast.'))return;
    try {
      const data=await api('/api/admin/undo','POST',{expectedVersion:version});
      if(!data.published)throw new Error('Geen bevestiging van herstel');
      current=data.config;version=data.version;render();
      await refreshHistory();
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

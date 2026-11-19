// MK Style Social Studio — zero publish capability, drafts only.
// Every factual detail comes from the current D1 shop configuration.
import { InputError, isIsoDate } from './site.js';

export const SOCIAL_PLATFORMS = ['instagram','facebook','google'];
export const SOCIAL_TOPICS = ['walkin','service','location','special_hours'];

function fail(message) { throw new InputError(message); }
function validText(value,max=80) {
 return typeof value === 'string' && value.length <= max && !/[<>]/.test(value);
}
export function draftInput(input, config) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Kies een onderwerp en platform');
 const {platform,topic}=input;
 if (!SOCIAL_PLATFORMS.includes(platform)) fail('Onbekend sociaal platform');
 if (!SOCIAL_TOPICS.includes(topic)) fail('Onbekend onderwerp');
 if (!['template','ai'].includes(input.mode || 'template')) fail('Onbekende conceptmodus');
 if (input.brief !== undefined && !validText(input.brief,250)) fail('Opdracht is te lang of bevat HTML');
 const services=Array.isArray(config.services)?config.services:[];
 let service=null,exception=null;
 if(topic==='service') {
   service=services.find(s=>s.id===input.serviceId);
   if(!service)fail('Kies een bestaande dienst');
 }
 if(topic==='special_hours'){
   if(!isIsoDate(input.date))fail('Kies een geldige uitzonderingsdatum');
   exception=(config.exceptions||[]).find(e=>e.date===input.date);
   if(!exception)fail('Deze afwijkende openingsdag staat nog niet op de website');
 }
 return {platform,topic,mode:input.mode||'template',brief:input.brief||'',service,exception};
}

function sentence(config, args){
 const city=config.address?.locality || 'Beverst';
 switch(args.topic){
  case 'walkin':
   if(config.walkInOnly!==true)fail('Zonder-afspraak-claim is niet bevestigd');
   return 'Bij MK Style ben je welkom voor een verzorgde snit zonder afspraak. Spring gerust binnen wanneer het voor jou past.';
  case 'service':
   return args.service.name+' bij MK Style: '+args.service.price+'. Persoonlijke service in ons kapsalon.';
  case 'location':
   return 'Je vindt MK Style op '+config.address.street+', '+config.address.postalCode+' '+city+'. Kom langs voor je volgende knipbeurt.';
  case 'special_hours': {
   const d=new Intl.DateTimeFormat('nl-BE',{timeZone:'Europe/Brussels',dateStyle:'long'}).format(new Date(args.exception.date+'T12:00:00Z'));
   if(args.exception.closed)return 'Op '+d+' is MK Style uitzonderlijk gesloten.'+
       (args.exception.note?' Reden: '+args.exception.note+'.':'')+' Bekijk onze gewone openingsuren voor je bezoek.';
   const periods=args.exception.shifts.map(s=>s[0]+'–'+s[1]).join(' en ');
   return 'Op '+d+' gelden bij MK Style aangepaste openingsuren: '+periods+'.';
  }
 }
 fail('Onbekend onderwerp');
}
export function makeSocialDraft(config,input){
 const args=draftInput(input,config);
 const core=sentence(config,args);
 const shop=config.shopName;
 const address=config.address.street+', '+config.address.postalCode+' '+config.address.locality;
 const hashtags='#MKStyle #Beverst #BilzenHoeselt #Herenkapper';
 let caption;
 if(args.platform==='instagram'){
  caption='💈 '+core+'\n\n📍 '+address+'\n\n'+hashtags;
 } else if(args.platform==='facebook'){
  caption='✂️ '+core+'\n\n📍 '+address+'\n📞 '+config.phoneDisplay+'\n\nTot binnenkort bij '+shop+'!';
 } else {
  // Google Business Posts must stay factual and concise; no self-serving reviews or hashtags.
  caption=core+'\n\n'+address;
 }
 return {
  platform:args.platform,topic:args.topic,mode:'template',status:'draft',
  caption,requiresApproval:true,posted:false,
  mediaRequiresRightsCheck:true,
  notice:'Controleer tekst, foto en rechten. Niets wordt automatisch gepubliceerd.'
 };
}
export function validateAiCaption(text,config){
 if(typeof text!=='string'||!text.trim()||text.length>1200||/[<>]/.test(text))
   fail('AI-tekst is ongeldig');
 if(/\b(?:korting|solden|actieprijs|gratis knipbeurt|winactie|giveaway|limited offer)\b/i.test(text))
   fail('AI stelde een niet-bevestigde promotie voor');
 if(/https?:\/\/\S+/i.test(text))fail('Ongecontroleerde link in AI-tekst');
 const prices=[...text.matchAll(/€\s*\d+(?:[,.]\d\d)?/g)].map(m=>m[0].replace(/\s+/g,''));
 const allowed=(config.services||[]).map(s=>s.price.replace(/\s+/g,''));
 if(prices.some(p=>!allowed.includes(p)))fail('AI noemt een niet-bevestigde prijs');
 return text.trim();
}

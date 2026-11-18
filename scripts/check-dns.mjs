// Read-only DNS check to prepare domain migration; does NOT change any records.
import dns from 'node:dns/promises';
const domain = 'mk38style.be';
const target = process.env.MK_STYLE_EXPECTED_NS?.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)||[];
async function lookup(label,fn) {
  try {
    const records = await fn();
    return Array.isArray(records) ? records : [records];
  } catch(err) {
    if(['ENOTFOUND','ENODATA','ENOTIMP','ETIMEOUT','ESERVFAIL','ENODOMAIN','ENOSYS'].includes(err.code)) return [];
    console.error(label+' lookup warning: '+err.code);
    return [];
  }
}
const [ns,a,aaaa,wwwCname,wwwA] = await Promise.all([
  lookup('NS',()=>dns.resolveNs(domain)),
  lookup('A',()=>dns.resolve4(domain)),
  lookup('AAAA',()=>dns.resolve6(domain)),
  lookup('WWW CNAME',()=>dns.resolveCname('www.'+domain)),
  lookup('WWW A',()=>dns.resolve4('www.'+domain))
]);
const normalized=ns.map(x=>x.replace(/\.$/,'').toLowerCase()).sort();
const nsMatches=target.length>0&&normalized.length===target.length&&target.every(n=>normalized.includes(n.replace(/\.$/,'')));
console.log(JSON.stringify({
  domain,checked_at:new Date().toISOString(),nameservers:normalized,
  apex_a:a,apex_aaaa:aaaa,www_cname:wwwCname,www_a:wwwA,
  expected_cloudflare_nameservers:target.length?target:'not_assigned_yet',
  expected_nameservers_match:target.length?nsMatches:'not_checked',
  note:'Public DNS evidence only. Does not prove domain ownership, Cloudflare Pages app health, TLS or backend safety.'
},null,2));

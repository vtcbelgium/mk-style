import { createRemoteJWKSet, jwtVerify } from 'jose';
const keySets = new Map();
export async function adminIdentity(request, env) {
  const team = String(env.TEAM_DOMAIN || '').replace(/\\/$/, '');
  const aud = String(env.POLICY_AUD || '');
  const allowed = String(env.ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  // Fail closed until Cloudflare Access and the explicit allowlist are configured.
  if (!/^https:\/\/[a-z0-9-]+\\.cloudflareaccess\\.com$/.test(team) || !aud || !allowed.length) {
    return { error:'Beheeromgeving nog niet geconfigureerd', status:503 };
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { error:'Aanmelden vereist', status:401 };
  try {
    let jwks = keySets.get(team);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(team + '/cdn-cgi/access/certs'));
      keySets.set(team, jwks);
    }
    const { payload } = await jwtVerify(token,jwks,{issuer:team,audience:aud,algorithms:['RS256']});
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    if (!email || !allowed.includes(email)) return { error:'Geen beheerdersrechten', status:403 };
    return { email };
  } catch {
    return { error:'Ongeldige of verlopen sessie', status:401 };
  }
}
export function sameOriginMutation(request) {
  const origin = request.headers.get('Origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}

import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root=new URL('../',import.meta.url);
const dist=new URL('../dist/',import.meta.url);
rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});
for(const path of [
  'index.html','admin.html','404.html','assets/css','assets/images',
  'assets/js/main.js','assets/js/admin-v2.js',
  'data/site-config.json','robots.txt','sitemap.xml','_headers'
]){
  const src=new URL('../'+path,import.meta.url),dest=new URL('../dist/'+path,import.meta.url);
  if (!existsSync(src)) throw new Error('Missing asset: '+path);
  mkdirSync(new URL('.',dest),{recursive:true});
  cpSync(src,dest,{recursive:true});
}
console.log('Cloudflare Pages static site prepared in dist/ without docs, secrets, migrations or legacy demo JS.');

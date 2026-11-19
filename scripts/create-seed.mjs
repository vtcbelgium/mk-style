// Run only after Murat has verified the business facts. This script creates SQL locally.
import { readFileSync, writeFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(new URL('../data/site-config.json', import.meta.url),'utf8'));
config.exceptions ??= [];
if (config.announcement) config.announcement.forceClosedToday = false;
const sqlString = s => "'" + String(s).replaceAll("'", "''") + "'";
const sql = '-- Review this seed with Murat before applying to staging or production.\n'
  + 'INSERT INTO site_config (id, config_json, version, updated_at) VALUES ('
  + ["'main'",sqlString(JSON.stringify(config)),'1',sqlString(new Date().toISOString())].join(', ')
  + ') ON CONFLICT(id) DO NOTHING;\n';
writeFileSync(new URL('../migrations/0002_seed.sql',import.meta.url),sql);
console.log('Seed generated in migrations/0002_seed.sql. Review before applying.');

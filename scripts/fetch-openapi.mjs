/**
 * 백엔드 OpenAPI 스펙을 내려받아 openapi.json으로 저장.
 * 사용: BACKEND_URL=http://localhost:8000 npm run fetch-openapi
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'openapi.json');
const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
const url = `${baseUrl.replace(/\/$/, '')}/v1/openapi.json`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`fetch failed: ${res.status} ${url}`);
  process.exit(1);
}
const spec = await res.json();
fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
console.log(`Written: ${outPath}`);

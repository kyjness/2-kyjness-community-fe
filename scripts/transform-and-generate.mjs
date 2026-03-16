/**
 * openapi.json으로부터 TypeScript 타입 생성.
 * 백엔드가 OpenAPI 스펙을 이미 camelCase로 노출하므로 별도 변환 없이 사용.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const specPath = path.join(root, 'openapi.json');

if (!fs.existsSync(specPath)) {
  console.error('openapi.json not found. Run: npm run fetch-openapi (with backend up)');
  process.exit(1);
}

const outDir = path.join(root, 'src', 'api', 'generated');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'schema.d.ts');

execSync(`npx openapi-typescript "${specPath}" -o "${outFile}"`, {
  cwd: root,
  stdio: 'inherit',
});
console.log(`Generated: ${outFile}`);

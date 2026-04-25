import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(currentDir, '../../src/public');
const targetDir = path.resolve(currentDir, '../../dist/public');

if (!existsSync(sourceDir)) {
  throw new Error(`前端构建产物不存在: ${sourceDir}`);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, {
  recursive: true,
  force: true
});


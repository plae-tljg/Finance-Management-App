import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('开始编译 TypeScript 文件...');
  
  // 编译 services 目录下的 TypeScript 文件
  execSync('tsc --project tsconfig.json', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('TypeScript 编译完成');
} catch (error) {
  console.error('编译失败:', error);
  process.exit(1);
} 
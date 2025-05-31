const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Проверка Next.js сборки...');
console.log('📂 Текущая директория:', process.cwd());
console.log('📦 Next.js версия:', require('./node_modules/next/package.json').version);

try {
  console.log('🚀 Запуск сборки...');
  execSync('npx next build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Сборка завершена успешно!');
} catch (error) {
  console.error('❌ Ошибка сборки:', error.message);
  process.exit(1);
}

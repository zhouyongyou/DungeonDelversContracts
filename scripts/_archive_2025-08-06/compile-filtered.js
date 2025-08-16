// compile-filtered.js - 過濾編譯腳本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 要排除的資料夾名稱
const EXCLUDE_FOLDERS = ['old', 'archive', 'deprecated', 'test'];

// 暫存資料夾
const TEMP_DIR = path.join(__dirname, '..', 'contracts', '.temp_excluded');

// 需要移動的資料夾
const foldersToMove = [];

// 掃描 contracts/current 目錄
const currentDir = path.join(__dirname, '..', 'contracts', 'current');

function findExcludedFolders(dir, basePath = '') {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (EXCLUDE_FOLDERS.includes(item)) {
        foldersToMove.push({
          source: fullPath,
          temp: path.join(TEMP_DIR, relativePath),
          relative: relativePath
        });
      } else {
        // 遞迴檢查子目錄
        findExcludedFolders(fullPath, relativePath);
      }
    }
  });
}

console.log('🔍 掃描要排除的資料夾...');
findExcludedFolders(currentDir);

if (foldersToMove.length === 0) {
  console.log('✅ 沒有需要排除的資料夾');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  process.exit(0);
}

console.log(`📁 找到 ${foldersToMove.length} 個需要排除的資料夾`);

// 創建暫存目錄
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 移動資料夾
console.log('📦 暫時移動資料夾...');
foldersToMove.forEach(folder => {
  console.log(`  移動: ${folder.relative}`);
  const tempParent = path.dirname(folder.temp);
  if (!fs.existsSync(tempParent)) {
    fs.mkdirSync(tempParent, { recursive: true });
  }
  fs.renameSync(folder.source, folder.temp);
});

try {
  // 執行編譯
  console.log('\n🔨 開始編譯...\n');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  console.log('\n✅ 編譯完成！');
} catch (error) {
  console.error('\n❌ 編譯失敗！');
  console.error(error.message);
} finally {
  // 恢復資料夾
  console.log('\n📦 恢復資料夾...');
  foldersToMove.forEach(folder => {
    console.log(`  恢復: ${folder.relative}`);
    fs.renameSync(folder.temp, folder.source);
  });
  
  // 清理暫存目錄
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

console.log('\n✨ 完成！');
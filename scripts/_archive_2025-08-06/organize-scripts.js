const fs = require('fs');
const path = require('path');

// 定義腳本分類規則
const SCRIPT_CATEGORIES = {
  // 當前活躍腳本（V22）
  active: [
    'check-baseuri.js',
    'set-baseuri.js',
    'fix-v22-contracts.js',
    'check-nft-complete-status.js',
    'deploy-v22-complete.js',
    'deploy-v22-oracle.js',
    'complete-v22-deployment.js',
    'v22-sync-config.js',
    'verify-v22-deployment.js'
  ],
  
  // 工具類腳本（保留）
  utils: [
    'check-contract-owners.js',
    'check-dungeoncore-connections.js',
    'check-oracle-setup.js',
    'check-subgraph-status.js',
    'sync-config.js',
    'extractABI.js',
    'decode-error.js'
  ],
  
  // V21 相關（可能還需要）
  v21: [
    'v21-check-config.js',
    'v21-phase1-cleanup.js',
    'v21-phase1-execute.js',
    'v21-phase1-move.js',
    'v21-sync-config.js',
    'deploy-v21-oracle-only.js'
  ]
};

async function organizeScripts() {
  console.log('🗂️  開始整理 scripts 資料夾...\n');
  
  const scriptsDir = __dirname;
  const archiveDir = path.join(scriptsDir, 'archive');
  const activeDir = path.join(scriptsDir, 'active');
  const utilsDir = path.join(scriptsDir, 'utils');
  const v21Dir = path.join(scriptsDir, 'archive', 'v21');
  
  // 創建必要的目錄
  const dirs = [archiveDir, activeDir, utilsDir, v21Dir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 創建目錄: ${path.basename(dir)}/`);
    }
  }
  
  // 獲取所有 .js 文件
  const allFiles = fs.readdirSync(scriptsDir)
    .filter(file => file.endsWith('.js') && file !== 'organize-scripts.js');
  
  console.log(`\n📊 找到 ${allFiles.length} 個腳本文件\n`);
  
  // 統計
  let movedCount = 0;
  let activeCount = 0;
  let utilsCount = 0;
  let v21Count = 0;
  let archivedCount = 0;
  
  // 處理每個文件
  for (const file of allFiles) {
    const filePath = path.join(scriptsDir, file);
    let targetDir = null;
    let category = '';
    
    // 檢查是否為目錄
    if (fs.statSync(filePath).isDirectory()) {
      continue;
    }
    
    // 判斷文件類別
    if (SCRIPT_CATEGORIES.active.includes(file)) {
      targetDir = activeDir;
      category = '✅ Active';
      activeCount++;
    } else if (SCRIPT_CATEGORIES.utils.includes(file)) {
      targetDir = utilsDir;
      category = '🔧 Utils';
      utilsCount++;
    } else if (SCRIPT_CATEGORIES.v21.includes(file)) {
      targetDir = v21Dir;
      category = '📦 V21';
      v21Count++;
    } else {
      // 其他文件歸檔
      targetDir = archiveDir;
      category = '📁 Archive';
      archivedCount++;
    }
    
    if (targetDir) {
      const targetPath = path.join(targetDir, file);
      
      // 移動文件
      try {
        fs.renameSync(filePath, targetPath);
        console.log(`${category} ${file} → ${path.relative(scriptsDir, targetDir)}/`);
        movedCount++;
      } catch (error) {
        if (error.code === 'ENOENT') {
          // 文件已經在目標位置
          continue;
        }
        console.error(`❌ 無法移動 ${file}: ${error.message}`);
      }
    }
  }
  
  // 創建索引文件
  const indexContent = `# Scripts 目錄結構

更新時間: ${new Date().toLocaleString()}

## 📁 目錄說明

### active/ - 當前活躍腳本 (V22)
包含當前版本正在使用的腳本

### utils/ - 工具腳本
通用工具腳本，可跨版本使用

### archive/ - 歸檔腳本
舊版本腳本，保留作為參考

### archive/v21/ - V21 版本腳本
V21 版本相關腳本

## 🔍 快速查找

### NFT 設置相關
- \`active/check-baseuri.js\` - 檢查 NFT baseURI 設置
- \`active/set-baseuri.js\` - 設置 NFT baseURI
- \`active/fix-v22-contracts.js\` - 修復 V22 合約配置
- \`active/check-nft-complete-status.js\` - 完整 NFT 狀態檢查

### 部署相關
- \`active/deploy-v22-complete.js\` - V22 完整部署
- \`active/deploy-v22-oracle.js\` - V22 Oracle 部署
- \`active/verify-v22-deployment.js\` - 驗證 V22 部署

### 配置同步
- \`active/v22-sync-config.js\` - 同步 V22 配置
- \`utils/sync-config.js\` - 通用配置同步

## 📊 統計
- Active: ${activeCount} 個腳本
- Utils: ${utilsCount} 個腳本  
- V21: ${v21Count} 個腳本
- Archived: ${archivedCount} 個腳本
- 總計: ${movedCount} 個腳本已整理
`;
  
  fs.writeFileSync(path.join(scriptsDir, 'SCRIPTS_INDEX.md'), indexContent);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 整理完成！');
  console.log('='.repeat(60));
  console.log(`📊 統計：`);
  console.log(`   Active: ${activeCount} 個`);
  console.log(`   Utils: ${utilsCount} 個`);
  console.log(`   V21: ${v21Count} 個`);
  console.log(`   Archived: ${archivedCount} 個`);
  console.log(`   總計: ${movedCount} 個腳本已整理`);
  console.log('\n📄 已創建 SCRIPTS_INDEX.md 索引文件');
  console.log('\n💡 提示：');
  console.log('   - 活躍腳本在 active/ 目錄');
  console.log('   - 工具腳本在 utils/ 目錄');
  console.log('   - 舊版本腳本在 archive/ 目錄');
}

// 執行整理
organizeScripts().catch(console.error);
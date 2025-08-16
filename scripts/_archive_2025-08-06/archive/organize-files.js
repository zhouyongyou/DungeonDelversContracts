#!/usr/bin/env node

/**
 * 專案文件整理腳本
 * 整理部署記錄、測試報告和配置文件
 */

const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 要整理的文件規則
const ORGANIZE_RULES = [
  {
    pattern: /^bsc-v\d+.*\.json$/,
    targetDir: 'deployments/v15',
    description: 'V15 部署記錄'
  },
  {
    pattern: /^deployment-v\d+-.*\.json$/,
    targetDir: 'deployments/legacy',
    description: '舊版部署記錄'
  },
  {
    pattern: /^ERROR_.*\.json$/,
    targetDir: 'deployments/errors',
    description: '錯誤記錄'
  },
  {
    pattern: /^(functional-test|config-sync-test|test-report).*\.json$/,
    targetDir: 'test-reports',
    description: '測試報告'
  },
  {
    pattern: /^(backend-config|contract-config|shared-config).*\.json$/,
    targetDir: 'config/legacy',
    description: '舊配置文件'
  }
];

// 要清理的文件
const FILES_TO_REMOVE = [
  'test-config.js',  // 臨時測試腳本
  'quick-test.js',   // 已移到 test 目錄
  'CONTRACT_ADDRESSES.md',  // 已整合到其他文檔
  'DEPLOYMENT_RECORDS',  // 空目錄或舊記錄
];

async function organizeFiles() {
  log('\n📁 開始整理專案文件', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  let movedCount = 0;
  let removedCount = 0;
  let createdDirs = [];
  
  // 1. 整理部署文件
  log('\n1️⃣ 整理部署文件...', 'cyan');
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  if (fs.existsSync(deploymentsDir)) {
    const files = fs.readdirSync(deploymentsDir);
    
    for (const file of files) {
      const filePath = path.join(deploymentsDir, file);
      
      // 跳過目錄
      if (fs.statSync(filePath).isDirectory()) continue;
      
      // 檢查每個規則
      for (const rule of ORGANIZE_RULES) {
        if (rule.pattern.test(file) && rule.targetDir.startsWith('deployments/')) {
          const targetDir = path.join(__dirname, '..', rule.targetDir);
          
          // 創建目標目錄
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            createdDirs.push(rule.targetDir);
            log(`  📂 創建目錄: ${rule.targetDir}`, 'green');
          }
          
          // 移動文件
          const targetPath = path.join(targetDir, file);
          fs.renameSync(filePath, targetPath);
          log(`  ✅ 移動: ${file} → ${rule.targetDir}`, 'green');
          movedCount++;
          break;
        }
      }
    }
  }
  
  // 2. 整理根目錄文件
  log('\n2️⃣ 整理根目錄文件...', 'cyan');
  const rootDir = path.join(__dirname, '..');
  const rootFiles = fs.readdirSync(rootDir);
  
  for (const file of rootFiles) {
    const filePath = path.join(rootDir, file);
    
    // 跳過目錄
    if (fs.statSync(filePath).isDirectory()) continue;
    
    // 檢查是否需要移動
    for (const rule of ORGANIZE_RULES) {
      if (rule.pattern.test(file)) {
        const targetDir = path.join(rootDir, rule.targetDir);
        
        // 創建目標目錄
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
          createdDirs.push(rule.targetDir);
          log(`  📂 創建目錄: ${rule.targetDir}`, 'green');
        }
        
        // 移動文件
        const targetPath = path.join(targetDir, file);
        fs.renameSync(filePath, targetPath);
        log(`  ✅ 移動: ${file} → ${rule.targetDir}`, 'green');
        movedCount++;
        break;
      }
    }
  }
  
  // 3. 清理不需要的文件
  log('\n3️⃣ 清理不需要的文件...', 'cyan');
  
  for (const file of FILES_TO_REMOVE) {
    const filePath = path.join(rootDir, file);
    
    if (fs.existsSync(filePath)) {
      // 如果是目錄，檢查是否為空
      if (fs.statSync(filePath).isDirectory()) {
        const contents = fs.readdirSync(filePath);
        if (contents.length === 0) {
          fs.rmdirSync(filePath);
          log(`  🗑️ 刪除空目錄: ${file}`, 'yellow');
          removedCount++;
        }
      } else {
        fs.unlinkSync(filePath);
        log(`  🗑️ 刪除文件: ${file}`, 'yellow');
        removedCount++;
      }
    }
  }
  
  // 4. 創建整理報告
  log('\n4️⃣ 創建整理報告...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesOrganized: movedCount,
      filesRemoved: removedCount,
      directoriesCreated: createdDirs.length
    },
    details: {
      createdDirectories: createdDirs,
      organizationRules: ORGANIZE_RULES.map(r => ({
        pattern: r.pattern.toString(),
        targetDir: r.targetDir,
        description: r.description
      }))
    }
  };
  
  const reportsDir = path.join(rootDir, 'docs/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `file-organization-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`  📄 報告已保存: docs/reports/`, 'green');
  
  // 5. 更新 .gitignore
  log('\n5️⃣ 更新 .gitignore...', 'cyan');
  
  const gitignorePath = path.join(rootDir, '.gitignore');
  let gitignore = fs.readFileSync(gitignorePath, 'utf8');
  
  const toAdd = [
    '\n# Organized files',
    'deployments/errors/',
    'deployments/legacy/',
    'config/legacy/',
    'test-reports/',
    '',
    '# Temporary files',
    '*.tmp',
    '*.log',
    '.DS_Store'
  ];
  
  let addedLines = 0;
  for (const line of toAdd) {
    if (!gitignore.includes(line)) {
      gitignore += '\n' + line;
      addedLines++;
    }
  }
  
  if (addedLines > 0) {
    fs.writeFileSync(gitignorePath, gitignore);
    log(`  ✅ 更新 .gitignore (添加 ${addedLines} 行)`, 'green');
  }
  
  // 顯示總結
  log('\n' + '=' .repeat(50), 'magenta');
  log('📊 整理完成總結', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  log(`\n📦 文件整理: ${movedCount} 個`, 'green');
  log(`🗑️ 文件清理: ${removedCount} 個`, 'yellow');
  log(`📂 創建目錄: ${createdDirs.length} 個`, 'green');
  
  if (createdDirs.length > 0) {
    log('\n📂 新創建的目錄:', 'cyan');
    createdDirs.forEach(dir => log(`  • ${dir}`, 'cyan'));
  }
  
  log('\n✅ 專案文件整理完成！', 'green');
  
  // 建議後續操作
  log('\n💡 建議後續操作:', 'yellow');
  log('  1. 檢查整理後的文件結構', 'yellow');
  log('  2. 提交變更到 Git', 'yellow');
  log('  3. 更新相關文檔中的路徑引用', 'yellow');
}

// 執行整理
if (require.main === module) {
  organizeFiles()
    .then(() => {
      log('\n🎉 整理成功完成！', 'green');
      process.exit(0);
    })
    .catch(error => {
      log(`\n❌ 整理失敗: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { organizeFiles };
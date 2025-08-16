#!/usr/bin/env node

// V23 ABI 複製腳本 - 自動將編譯後的 ABI 複製到前端和子圖專案
// 專為批量鑄造機制更新設計

const fs = require('fs');
const path = require('path');

// 要複製的合約列表（V23 更新的合約）
const CONTRACTS_TO_COPY = [
  {
    name: 'Hero',
    sourcePath: 'artifacts/contracts/current/nft/Hero.sol/Hero.json',
    description: 'Hero NFT with batch minting'
  },
  {
    name: 'Relic',
    sourcePath: 'artifacts/contracts/current/nft/Relic.sol/Relic.json',
    description: 'Relic NFT with batch minting'
  }
];

// 目標路徑
const DESTINATIONS = [
  {
    name: '前端專案',
    path: '../GitHub/DungeonDelvers/src/config/abis/',
    description: 'Frontend ABI directory'
  },
  {
    name: '子圖專案',
    path: '../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/',
    description: 'Subgraph ABI directory'
  }
];

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function copyABIs() {
  log('\n🚀 V23 ABI 複製腳本', 'bright');
  log('=====================================', 'cyan');
  log(`📅 執行時間: ${new Date().toLocaleString()}`, 'blue');
  log(`📍 工作目錄: ${process.cwd()}\n`, 'blue');

  // 檢查是否在正確的目錄
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ 錯誤: 請在 DungeonDelversContracts 根目錄執行此腳本', 'red');
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  // 對每個合約進行處理
  for (const contract of CONTRACTS_TO_COPY) {
    log(`\n📄 處理合約: ${contract.name}`, 'yellow');
    log(`   描述: ${contract.description}`, 'blue');

    // 檢查源文件是否存在
    const sourcePath = path.join(process.cwd(), contract.sourcePath);
    if (!fs.existsSync(sourcePath)) {
      log(`   ❌ 找不到源文件: ${contract.sourcePath}`, 'red');
      log(`   💡 提示: 請先執行 npx hardhat compile`, 'yellow');
      errorCount++;
      results.push({
        contract: contract.name,
        status: 'failed',
        error: '源文件不存在'
      });
      continue;
    }

    // 讀取並解析 ABI
    let artifact;
    try {
      const content = fs.readFileSync(sourcePath, 'utf8');
      artifact = JSON.parse(content);
      log(`   ✅ 成功讀取 ABI (${artifact.abi.length} 個函數/事件)`, 'green');
    } catch (error) {
      log(`   ❌ 無法解析 ABI: ${error.message}`, 'red');
      errorCount++;
      results.push({
        contract: contract.name,
        status: 'failed',
        error: '無法解析 ABI'
      });
      continue;
    }

    // 複製到各個目標
    for (const dest of DESTINATIONS) {
      const destPath = path.join(process.cwd(), dest.path);
      const destFile = path.join(destPath, `${contract.name}.json`);

      try {
        // 確保目標目錄存在
        if (!fs.existsSync(destPath)) {
          log(`   ⚠️  目標目錄不存在: ${dest.path}`, 'yellow');
          log(`   📁 創建目錄...`, 'blue');
          fs.mkdirSync(destPath, { recursive: true });
        }

        // 備份現有文件（如果存在）
        if (fs.existsSync(destFile)) {
          const backupFile = destFile + `.backup-${Date.now()}`;
          fs.copyFileSync(destFile, backupFile);
          log(`   📋 已備份舊文件`, 'blue');
        }

        // 複製文件
        fs.writeFileSync(destFile, JSON.stringify(artifact, null, 2));
        log(`   ✅ 已複製到 ${dest.name}: ${destFile}`, 'green');
        successCount++;

      } catch (error) {
        log(`   ❌ 複製到 ${dest.name} 失敗: ${error.message}`, 'red');
        errorCount++;
      }
    }

    results.push({
      contract: contract.name,
      status: 'success'
    });
  }

  // 生成摘要報告
  log('\n\n========== 執行摘要 ==========', 'bright');
  log(`✅ 成功操作: ${successCount} 個`, 'green');
  log(`❌ 失敗操作: ${errorCount} 個`, errorCount > 0 ? 'red' : 'green');
  
  log('\n📊 詳細結果:', 'cyan');
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    const color = result.status === 'success' ? 'green' : 'red';
    log(`${icon} ${result.contract}: ${result.status}${result.error ? ` (${result.error})` : ''}`, color);
  });

  // 保存執行日誌
  const logData = {
    timestamp: new Date().toISOString(),
    version: 'V23',
    contracts: CONTRACTS_TO_COPY.map(c => c.name),
    destinations: DESTINATIONS.map(d => d.name),
    results,
    summary: {
      success: successCount,
      errors: errorCount
    }
  };

  const logPath = path.join(process.cwd(), 'scripts', 'logs', `v23-abi-copy-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  log(`\n📄 執行日誌已保存: ${logPath}`, 'blue');

  // 提供下一步建議
  if (successCount > 0) {
    log('\n💡 下一步建議:', 'yellow');
    log('1. 前端: cd ../GitHub/DungeonDelvers && npm run dev', 'cyan');
    log('2. 子圖: cd ../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers && npm run codegen', 'cyan');
    log('3. 確認批量鑄造機制在前端正常顯示', 'cyan');
  }

  // 檢查是否需要額外操作
  log('\n🔍 額外檢查:', 'yellow');
  
  // 檢查是否有其他可能需要更新的合約
  const otherContracts = ['Party', 'DungeonCore', 'AltarOfAscension'];
  log('以下合約可能也需要確認是否需要更新 ABI:', 'blue');
  otherContracts.forEach(contract => {
    log(`   - ${contract}`, 'cyan');
  });

  log('\n✨ V23 ABI 複製完成！\n', 'bright');
}

// 執行主函數
if (require.main === module) {
  copyABIs().catch(error => {
    log(`\n❌ 執行錯誤: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { copyABIs };
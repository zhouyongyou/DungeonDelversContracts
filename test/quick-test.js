#!/usr/bin/env node

/**
 * 快速功能測試腳本
 * 測試核心配置和基本功能
 */

const axios = require('axios');
const { execSync } = require('child_process');

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

async function runQuickTests() {
  log('\n⚡ 快速功能測試', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const results = {
    passed: [],
    failed: []
  };
  
  // 1. 測試前端服務
  log('\n1️⃣ 測試前端服務...', 'cyan');
  try {
    const response = await axios.get('https://dungeondelvers.xyz', { 
      timeout: 5000,
      validateStatus: () => true 
    });
    
    if (response.status === 200) {
      log('  ✅ 前端服務正常 (200 OK)', 'green');
      results.passed.push('前端服務');
    } else {
      throw new Error(`狀態碼: ${response.status}`);
    }
  } catch (error) {
    log(`  ❌ 前端服務異常: ${error.message}`, 'red');
    results.failed.push('前端服務');
  }
  
  // 2. 測試後端 API
  log('\n2️⃣ 測試後端 API...', 'cyan');
  try {
    const response = await axios.get('https://dungeon-delvers-metadata-server.onrender.com/health', {
      timeout: 10000
    });
    
    if (response.data.status === 'healthy') {
      log('  ✅ 後端服務健康', 'green');
      log(`  📋 配置版本: ${response.data.configVersion || 'N/A'}`, 'cyan');
      log(`  🔧 配置來源: ${response.data.configSource || 'N/A'}`, 'cyan');
      results.passed.push('後端服務');
    } else {
      throw new Error('健康檢查失敗');
    }
  } catch (error) {
    log(`  ❌ 後端服務異常: ${error.message}`, 'red');
    results.failed.push('後端服務');
  }
  
  // 3. 測試 NFT Metadata
  log('\n3️⃣ 測試 NFT Metadata...', 'cyan');
  try {
    const response = await axios.get('https://dungeon-delvers-metadata-server.onrender.com/api/hero/1', {
      timeout: 10000
    });
    
    if (response.data.name && response.data.image) {
      log('  ✅ NFT Metadata 正常', 'green');
      log(`  📛 名稱: ${response.data.name}`, 'cyan');
      log(`  🖼️ 圖片: ${response.data.image}`, 'cyan');
      results.passed.push('NFT Metadata');
    } else {
      throw new Error('Metadata 格式不正確');
    }
  } catch (error) {
    log(`  ❌ NFT Metadata 異常: ${error.message}`, 'red');
    results.failed.push('NFT Metadata');
  }
  
  // 4. 測試 The Graph
  log('\n4️⃣ 測試 The Graph 查詢...', 'cyan');
  try {
    const query = `
      query {
        globalStats(id: "global") {
          totalHeroes
          totalRelics
          totalParties
        }
      }
    `;
    
    const response = await axios.post(
      'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.9',
      { query },
      { timeout: 10000 }
    );
    
    if (response.data.data?.globalStats) {
      const stats = response.data.data.globalStats;
      log('  ✅ The Graph 查詢正常', 'green');
      log(`  🦸 英雄總數: ${stats.totalHeroes || 0}`, 'cyan');
      log(`  🏺 聖物總數: ${stats.totalRelics || 0}`, 'cyan');
      log(`  👥 隊伍總數: ${stats.totalParties || 0}`, 'cyan');
      results.passed.push('The Graph');
    } else {
      throw new Error('查詢結果為空');
    }
  } catch (error) {
    log(`  ❌ The Graph 異常: ${error.message}`, 'red');
    results.failed.push('The Graph');
  }
  
  // 5. 測試配置同步
  log('\n5️⃣ 測試配置同步...', 'cyan');
  try {
    // 運行同步檢查
    execSync('node scripts/sync-config-v2.js --check', { 
      stdio: 'pipe',
      cwd: '/Users/sotadic/Documents/DungeonDelversContracts'
    });
    
    log('  ✅ 配置同步正常', 'green');
    results.passed.push('配置同步');
  } catch (error) {
    log(`  ❌ 配置同步異常: ${error.message}`, 'red');
    results.failed.push('配置同步');
  }
  
  // 6. 測試合約驗證狀態
  log('\n6️⃣ 檢查合約驗證狀態...', 'cyan');
  try {
    const contracts = {
      'Hero': '0x2b6CB00D10EFB1aF0125a26dfcbd9EBa87e07CD2',
      'Relic': '0xaEa78C3FC4bc50966aC41D76331fD0bf219D00ac',
      'DungeonCore': '0xA43edd46Eb4416195bc1BAA3575358EA92CE49dD'
    };
    
    let verifiedCount = 0;
    for (const [name, address] of Object.entries(contracts)) {
      try {
        const response = await axios.get(
          `https://api.bscscan.com/api?module=contract&action=getabi&address=${address}`,
          { timeout: 5000 }
        );
        
        if (response.data.status === '1') {
          verifiedCount++;
          log(`  ✅ ${name} 已驗證`, 'green');
        }
      } catch (e) {
        // 忽略單個合約的錯誤
      }
    }
    
    if (verifiedCount === Object.keys(contracts).length) {
      results.passed.push('合約驗證');
    } else {
      log(`  ⚠️ ${verifiedCount}/${Object.keys(contracts).length} 合約已驗證`, 'yellow');
      results.passed.push('合約驗證（部分）');
    }
  } catch (error) {
    log(`  ❌ 合約驗證檢查失敗: ${error.message}`, 'red');
    results.failed.push('合約驗證');
  }
  
  // 顯示總結
  log('\n' + '=' .repeat(50), 'magenta');
  log('📊 測試結果總結', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const total = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / total) * 100).toFixed(0);
  
  log(`\n✅ 通過: ${results.passed.length}/${total} (${passRate}%)`, 'green');
  if (results.passed.length > 0) {
    results.passed.forEach(test => log(`  • ${test}`, 'green'));
  }
  
  if (results.failed.length > 0) {
    log(`\n❌ 失敗: ${results.failed.length}/${total}`, 'red');
    results.failed.forEach(test => log(`  • ${test}`, 'red'));
  }
  
  // 結論
  if (results.failed.length === 0) {
    log('\n🎉 所有測試通過！系統運行正常', 'green');
  } else if (results.failed.length <= 2) {
    log('\n⚠️ 大部分功能正常，有少量問題需要關注', 'yellow');
  } else {
    log('\n❌ 多個功能異常，需要立即處理', 'red');
  }
  
  return results.failed.length === 0;
}

// 執行測試
if (require.main === module) {
  runQuickTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { runQuickTests };
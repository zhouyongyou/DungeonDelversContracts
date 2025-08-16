const { run } = require("hardhat");
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 等待函數
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyContract(contractName, address, constructorArgs = [], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      log(`\n🔍 驗證 ${contractName} (嘗試 ${i + 1}/${retries})...`, 'yellow');
      log(`📍 地址: ${address}`, 'cyan');
      log(`📝 構造參數: ${JSON.stringify(constructorArgs)}`, 'cyan');
      
      await run("verify:verify", {
        address: address,
        constructorArguments: constructorArgs,
        contract: contractName.includes(':') ? contractName : undefined
      });
      
      log(`✅ ${contractName} 驗證成功！`, 'green');
      log(`🔗 查看: https://bscscan.com/address/${address}#code`, 'green');
      return true;
      
    } catch (error) {
      if (error.message.includes("already verified")) {
        log(`✅ ${contractName} 已經驗證過了`, 'green');
        return true;
      }
      
      log(`❌ ${contractName} 驗證失敗 (嘗試 ${i + 1}): ${error.message}`, 'red');
      
      if (i < retries - 1) {
        log(`⏳ 等待 10 秒後重試...`, 'yellow');
        await sleep(10000);
      }
    }
  }
  
  log(`💥 ${contractName} 驗證徹底失敗`, 'red');
  return false;
}

async function main() {
  log('\n🔍 開始 V15 完整版合約驗證', 'magenta');
  log('='.repeat(70), 'magenta');
  log('🏆 最終測試：12/12 合約 + viaIR + 真實交易對', 'cyan');
  log('🎯 目標：證明終極解決方案的完美性', 'cyan');
  log('='.repeat(70), 'magenta');

  // 讀取完整部署地址
  const summaryPath = path.join(__dirname, '../../deployments/bsc-v15-complete-summary.json');
  
  if (!fs.existsSync(summaryPath)) {
    log('❌ 找不到 V15 完整部署摘要，請先執行完整部署', 'red');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const contracts = deployment.contracts;
  const deployerAddress = deployment.deployer;
  const realTokens = deployment.realTokens;
  
  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`📅 部署時間: ${deployment.timestamp}`, 'cyan');
  log(`⏱️  階段一時間: ${deployment.stage1Time}`, 'cyan');
  log(`⏱️  階段二時間: ${deployment.stage2Time}`, 'cyan');
  log(`⏱️  總部署時間: ${deployment.totalTime}`, 'cyan');
  
  log('\n💱 真實交易對配置:', 'yellow');
  log(`   USD Token: ${realTokens.USD_ADDRESS}`, 'cyan');
  log(`   SOUL Token: ${realTokens.SOUL_ADDRESS}`, 'cyan');
  log(`   Pool Address: ${realTokens.POOL_ADDRESS}`, 'cyan');
  
  const verificationResults = [];
  const startTime = Date.now();

  // 完整驗證合約列表 (12個)
  const contractsToVerify = [
    // 代幣合約
    {
      name: "TestUSDToken",
      address: contracts.TESTUSD_ADDRESS,
      args: []
    },
    {
      name: "contracts/test/Test_SoulShard.sol:Test_SoulShard",
      address: contracts.SOULSHARD_ADDRESS,
      args: []
    },
    // NFT 合約
    {
      name: "Hero",
      address: contracts.HERO_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "Relic",
      address: contracts.RELIC_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "Party",
      address: contracts.PARTY_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "PlayerProfile",
      address: contracts.PLAYERPROFILE_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "VIPStaking",
      address: contracts.VIPSTAKING_ADDRESS,
      args: [deployerAddress]
    },
    // 核心合約
    {
      name: "contracts/core/DungeonCore.sol:DungeonCore",
      address: contracts.DUNGEONCORE_ADDRESS,
      args: [deployerAddress, contracts.TESTUSD_ADDRESS, contracts.SOULSHARD_ADDRESS]
    },
    {
      name: "DungeonMasterV8",
      address: contracts.DUNGEONMASTER_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "DungeonStorage",
      address: contracts.DUNGEONSTORAGE_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "PlayerVault",
      address: contracts.PLAYERVAULT_ADDRESS,
      args: [deployerAddress]
    },
    // 預言機 (新部署)
    {
      name: "Oracle",
      address: contracts.ORACLE_ADDRESS,
      args: [realTokens.POOL_ADDRESS, realTokens.SOUL_ADDRESS, realTokens.USD_ADDRESS]
    }
  ];

  log(`\n🎯 準備驗證 ${contractsToVerify.length} 個合約...`, 'magenta');

  // 逐一驗證
  for (const contract of contractsToVerify) {
    const success = await verifyContract(contract.name, contract.address, contract.args);
    verificationResults.push({
      name: contract.name,
      address: contract.address,
      success: success,
      isNew: contract.name === "Oracle"
    });
    
    // 每次驗證間隔
    await sleep(5000);
  }

  const endTime = Date.now();
  const verifyTime = ((endTime - startTime) / 1000).toFixed(1);

  // 生成最終驗證報告
  log('\n' + '='.repeat(70), 'magenta');
  log('📊 V15 完整版驗證結果統計', 'magenta');
  log('='.repeat(70), 'magenta');
  
  const successful = verificationResults.filter(r => r.success).length;
  const total = verificationResults.length;
  const successRate = ((successful / total) * 100).toFixed(1);
  
  log(`⏱️  總驗證時間: ${verifyTime} 秒`, 'cyan');
  log(`📈 成功率: ${successful}/${total} (${successRate}%)`, 'cyan');
  
  if (successful > 0) {
    log('\n🎉 驗證成功的合約:', 'green');
    verificationResults.filter(r => r.success).forEach(r => {
      const newBadge = r.isNew ? ' 🆕' : '';
      log(`   ✅ ${r.name}: https://bscscan.com/address/${r.address}#code${newBadge}`, 'green');
    });
  }
  
  const failed = verificationResults.filter(r => !r.success);
  if (failed.length > 0) {
    log('\n❌ 驗證失敗的合約:', 'red');
    failed.forEach(r => {
      log(`   ❌ ${r.name}: ${r.address}`, 'red');
    });
  }
  
  // 保存最終驗證結果
  const reportPath = path.join(__dirname, '../../deployments/bsc-v15-complete-verification.json');
  const report = {
    version: "V15-Complete",
    timestamp: new Date().toISOString(),
    verifyTime: `${verifyTime}s`,
    successRate: `${successRate}%`,
    deployment: {
      totalTime: deployment.totalTime,
      viaIR: true,
      dependencyUnified: true,
      realTokenIntegration: true
    },
    results: verificationResults,
    summary: {
      total,
      successful,
      failed: failed.length
    },
    evolutionHistory: {
      "V13": "0% (0/11) - 依賴衝突 + viaIR混合",
      "V14": "100% (8/8) - 依賴統一 + viaIR關閉", 
      "V15-Stage1": "100% (11/11) - 依賴統一 + viaIR啟用",
      "V15-Complete": `${successRate}% (${successful}/${total}) - 完整生態 + 真實交易對`
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 最終驗證報告: ${reportPath}`, 'cyan');
  
  // 最終結果分析
  if (successRate === '100.0') {
    log('\n🚀🚀🚀 DungeonDelvers V15 完美達成！🚀🚀🚀', 'green');
    log('🌟 12/12 合約 100% 開源透明度！', 'green');
    log('⚡ viaIR + 依賴統一 + 真實交易對 = 終極勝利！', 'green');
    log('🎊 技術棧達到絕對巔峰狀態！', 'green');
    log('🏆 從 V13 的 0% 到 V15 的 100% - 完美進化！', 'green');
    log('💎 DungeonDelvers 成為區塊鏈遊戲標杆！', 'green');
  } else if (successRate >= '95.0') {
    log('\n🎯 V15 接近完美！', 'green');
    log('💪 終極解決方案基本驗證成功', 'green');
    log('🔧 個別問題需要微調', 'yellow');
  } else if (successRate >= '90.0') {
    log('\n💡 V15 大幅成功！', 'green');
    log('📈 相比歷史版本有巨大進步', 'green');
    log('🔍 少數問題需要進一步分析', 'yellow');
  } else {
    log('\n🤔 意外結果，需要深入調查', 'yellow');
    log('💡 可能存在未預期的技術因素', 'yellow');
  }
  
  // 技術演進總結
  log('\n📝 DungeonDelvers 技術演進史:', 'magenta');
  log('V13 → V14: 依賴衝突修復，驗證率 0% → 100%', 'cyan');
  log('V14 → V15: viaIR 重新啟用，性能大幅提升', 'cyan');
  log('V15: 分階段部署，真實交易對整合', 'cyan');
  if (successRate === '100.0') {
    log('✅ 最終結論: 完美的技術解決方案', 'green');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V15 完整版驗證腳本執行失敗:', error);
    process.exit(1);
  });
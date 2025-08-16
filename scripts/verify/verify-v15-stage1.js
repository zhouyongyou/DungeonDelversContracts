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
  log('\n🔍 開始 V15 階段一合約驗證', 'magenta');
  log('='.repeat(70), 'magenta');
  log('🎯 V15 驗證目標：viaIR 重新啟用 + 依賴統一 = 完美驗證', 'cyan');
  log('🧪 測試假設：OpenZeppelin 統一後，viaIR 不再影響驗證', 'cyan');
  log('='.repeat(70), 'magenta');

  // 讀取部署地址
  const summaryPath = path.join(__dirname, '../../deployments/bsc-v15-stage1-summary.json');
  
  if (!fs.existsSync(summaryPath)) {
    log('❌ 找不到 V15 階段一部署摘要，請先執行部署', 'red');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const contracts = deployment.contracts;
  const deployerAddress = deployment.deployer;
  
  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`📅 部署時間: ${deployment.timestamp}`, 'cyan');
  log(`⏱️  部署耗時: ${deployment.deployTime}`, 'cyan');
  
  const verificationResults = [];
  const startTime = Date.now();

  // 驗證合約列表 (按重要性排序)
  const contractsToVerify = [
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
      name: "PartyV3",
      address: contracts.PARTY_ADDRESS,
      args: [deployerAddress]
    },
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
    {
      name: "PlayerProfile",
      address: contracts.PLAYERPROFILE_ADDRESS,
      args: [deployerAddress]
    },
    {
      name: "VIPStaking",
      address: contracts.VIPSTAKING_ADDRESS,
      args: [deployerAddress]
    }
  ];

  // 逐一驗證
  for (const contract of contractsToVerify) {
    const success = await verifyContract(contract.name, contract.address, contract.args);
    verificationResults.push({
      name: contract.name,
      address: contract.address,
      success: success
    });
    
    // 每次驗證間隔
    await sleep(5000);
  }

  const endTime = Date.now();
  const verifyTime = ((endTime - startTime) / 1000).toFixed(1);

  // 生成驗證報告
  log('\n' + '='.repeat(70), 'magenta');
  log('📊 V15 階段一驗證結果統計', 'magenta');
  log('='.repeat(70), 'magenta');
  
  const successful = verificationResults.filter(r => r.success).length;
  const total = verificationResults.length;
  const successRate = ((successful / total) * 100).toFixed(1);
  
  log(`⏱️  總驗證時間: ${verifyTime} 秒`, 'cyan');
  log(`📈 成功率: ${successful}/${total} (${successRate}%)`, 'cyan');
  
  if (successful > 0) {
    log('\n🎉 驗證成功的合約:', 'green');
    verificationResults.filter(r => r.success).forEach(r => {
      log(`   ✅ ${r.name}: https://bscscan.com/address/${r.address}#code`, 'green');
    });
  }
  
  const failed = verificationResults.filter(r => !r.success);
  if (failed.length > 0) {
    log('\n❌ 驗證失敗的合約:', 'red');
    failed.forEach(r => {
      log(`   ❌ ${r.name}: ${r.address}`, 'red');
    });
  }
  
  // 保存驗證結果
  const reportPath = path.join(__dirname, '../../deployments/bsc-v15-stage1-verification.json');
  const report = {
    version: "V15-Stage1",
    timestamp: new Date().toISOString(),
    verifyTime: `${verifyTime}s`,
    successRate: `${successRate}%`,
    viaIR: true,
    dependencyUnified: true,
    results: verificationResults,
    summary: {
      total,
      successful,
      failed: failed.length
    },
    comparison: {
      "V13": "0% (0/11) - viaIR混合 + 依賴衝突",
      "V14": "100% (8/8) - viaIR關閉 + 依賴統一", 
      "V15-S1": `${successRate}% (${successful}/${total}) - viaIR啟用 + 依賴統一`
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 驗證報告已保存: ${reportPath}`, 'cyan');
  
  // 結果分析
  if (successRate === '100.0') {
    log('\n🚀🚀🚀 V15 階段一完美達成！🚀🚀🚀', 'green');
    log('🌟 viaIR + 依賴統一 = 終極解決方案！', 'green');
    log('✨ 證明了技術假設完全正確！', 'green');
    log('🎊 DungeonDelvers 技術棧達到巔峰！', 'green');
    log('⚡ 享受 viaIR 性能優化 + 100% 開源透明度！', 'green');
  } else if (successRate >= '90.0') {
    log('\n🎯 V15 階段一基本成功！', 'green');
    log('💪 viaIR + 依賴統一策略證明有效', 'green');
    log('🔧 少數問題需要微調', 'yellow');
  } else if (successRate >= '70.0') {
    log('\n💡 V15 有顯著改善！', 'yellow');
    log('📈 相比 V13 有巨大進步', 'yellow');
    log('🔍 需要進一步優化', 'yellow');
  } else {
    log('\n🤔 意外結果，需要深入分析', 'yellow');
    log('💡 可能存在未知因素', 'yellow');
  }
  
  // 實驗結論
  log('\n📝 實驗結論:', 'magenta');
  if (successRate === '100.0') {
    log('🧪 假設驗證：viaIR 問題確實來自依賴衝突', 'green');
    log('✅ 最終解決方案：依賴統一 + viaIR = 完美', 'green');
  } else {
    log('🧪 假設部分正確：依賴統一顯著改善驗證', 'yellow');
    log('🔍 viaIR 可能仍有其他影響因素', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V15 階段一驗證腳本執行失敗:', error);
    process.exit(1);
  });
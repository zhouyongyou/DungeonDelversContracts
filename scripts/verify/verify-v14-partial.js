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
  log('\n🔍 開始 V14 部分合約驗證', 'magenta');
  log('='.repeat(60), 'magenta');
  log('🎯 驗證策略：OpenZeppelin 5.3.0 統一 + viaIR 關閉', 'cyan');
  log('='.repeat(60), 'magenta');

  // 讀取部署地址
  const summaryPath = path.join(__dirname, '../../deployments/bsc-v14-partial.json');
  
  if (!fs.existsSync(summaryPath)) {
    log('❌ 找不到 V14 部分部署摘要', 'red');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const contracts = deployment.contracts;
  const deployerAddress = deployment.deployer;
  
  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`📅 部署時間: ${deployment.timestamp}`, 'cyan');
  
  const verificationResults = [];
  const startTime = Date.now();

  // 驗證合約列表
  const contractsToVerify = [
    {
      name: "Oracle",
      address: contracts.ORACLE_ADDRESS,
      args: ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000001"]
    },
    {
      name: "TestUSDToken", 
      address: contracts.TESTUSD_ADDRESS,
      args: []
    },
    {
      name: "Test_SoulShard",
      address: contracts.SOULSHARD_ADDRESS,
      args: []
    },
    {
      name: "contracts/core/DungeonCore.sol:DungeonCore", 
      address: contracts.DUNGEONCORE_ADDRESS,
      args: [deployerAddress, contracts.TESTUSD_ADDRESS, contracts.SOULSHARD_ADDRESS]
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
      name: "DungeonMasterV8",
      address: contracts.DUNGEONMASTER_ADDRESS,
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
  log('\n' + '='.repeat(60), 'magenta');
  log('📊 V14 部分驗證結果統計', 'magenta');
  log('='.repeat(60), 'magenta');
  
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
  
  if (successRate === '100.0') {
    log('\n🚀🚀🚀 V14 部分驗證完美達成！🚀🚀🚀', 'green');
    log('🌟 OpenZeppelin 版本統一策略證明成功！', 'green');
    log('✨ viaIR 關閉策略完全有效！', 'green');
    log('🎊 依賴衝突徹底解決！', 'green');
  } else if (successRate >= '80.0') {
    log('\n🎯 V14 部分驗證基本成功！', 'green');
    log('💪 依賴統一策略證明有效', 'green');
  } else if (successRate >= '50.0') {
    log('\n💡 V14 有顯著改善！', 'yellow');
    log('📈 成功率明顯提升', 'yellow');
  } else {
    log('\n🤔 仍需進一步分析', 'yellow');
    log('💡 可能需要其他解決方案', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 驗證腳本執行失敗:', error);
    process.exit(1);
  });
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
  log('\n🔍 開始 V16 統一版合約驗證', 'magenta');
  log('='.repeat(70), 'magenta');
  log('🎯 V16 特色：單階段部署 + 真實代幣整合', 'cyan');
  log('='.repeat(70), 'magenta');

  // 讀取 V16 部署地址
  const summaryPath = path.join(__dirname, '../../deployments/bsc-v16-unified-summary.json');
  
  if (!fs.existsSync(summaryPath)) {
    log('❌ 找不到 V16 部署摘要，請先執行 npm run deploy:v16', 'red');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const contracts = deployment.contracts;
  const deployerAddress = deployment.deployer;
  const tokenConfig = deployment.tokenConfig;
  
  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`📅 部署時間: ${deployment.timestamp}`, 'cyan');
  log(`⏱️  部署時間: ${deployment.deployTime}`, 'cyan');
  log(`🔧 部署類型: ${deployment.deploymentType}`, 'cyan');
  
  if (tokenConfig.type === 'Real Tokens') {
    log('\n💱 真實代幣配置:', 'yellow');
    log(`   USD Token: ${tokenConfig.USD_ADDRESS}`, 'cyan');
    log(`   SOUL Token: ${tokenConfig.SOUL_ADDRESS}`, 'cyan');
    log(`   Pool Address: ${tokenConfig.POOL_ADDRESS}`, 'cyan');
  }
  
  const verificationResults = [];
  const startTime = Date.now();

  // 構建驗證列表
  const contractsToVerify = [];
  
  // 如果使用測試代幣，添加測試代幣驗證
  if (tokenConfig.type === 'Test Tokens') {
    contractsToVerify.push(
      {
        name: "TestUSDToken",
        address: contracts.TESTUSD_ADDRESS,
        args: []
      },
      {
        name: "contracts/test/Test_SoulShard.sol:Test_SoulShard",
        address: contracts.SOULSHARD_ADDRESS,
        args: []
      }
    );
  }

  // 添加其他合約
  contractsToVerify.push(
    {
      name: "Oracle",
      address: contracts.ORACLE_ADDRESS,
      args: [
        tokenConfig.POOL_ADDRESS || contracts.POOL_ADDRESS,
        tokenConfig.SOUL_ADDRESS || contracts.SOULSHARD_ADDRESS,
        tokenConfig.USD_ADDRESS || contracts.TESTUSD_ADDRESS
      ]
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
      args: [
        deployerAddress, 
        tokenConfig.USD_ADDRESS || contracts.TESTUSD_ADDRESS,
        tokenConfig.SOUL_ADDRESS || contracts.SOULSHARD_ADDRESS
      ]
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
  );

  log(`\n🎯 準備驗證 ${contractsToVerify.length} 個合約...`, 'magenta');

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
  log('📊 V16 統一版驗證結果統計', 'magenta');
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
  const reportPath = path.join(__dirname, '../../deployments/bsc-v16-verification.json');
  const report = {
    version: "V16-Unified",
    timestamp: new Date().toISOString(),
    verifyTime: `${verifyTime}s`,
    successRate: `${successRate}%`,
    deployment: {
      deployTime: deployment.deployTime,
      deploymentType: deployment.deploymentType,
      viaIR: true,
      unifiedDeployment: true
    },
    results: verificationResults,
    summary: {
      total,
      successful,
      failed: failed.length
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 驗證報告已保存: ${reportPath}`, 'cyan');
  
  // 結果分析
  if (successRate === '100.0') {
    log('\n🚀🚀🚀 DungeonDelvers V16 完美驗證！🚀🚀🚀', 'green');
    log('🌟 統一部署 + 100% 開源透明度！', 'green');
    log('⚡ 單階段部署效率最大化！', 'green');
    log('💎 真實代幣無縫整合！', 'green');
    log('🏆 技術架構達到完美狀態！', 'green');
  } else if (successRate >= '90.0') {
    log('\n🎯 V16 驗證基本成功！', 'green');
    log('💪 統一部署方案驗證有效', 'green');
    log('🔧 個別合約可能需要手動驗證', 'yellow');
  } else {
    log('\n🤔 驗證結果不理想，需要調查', 'yellow');
    log('💡 建議檢查編譯器設置和依賴版本', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V16 驗證腳本執行失敗:', error);
    process.exit(1);
  });
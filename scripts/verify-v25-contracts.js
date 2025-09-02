#!/usr/bin/env node

/**
 * V25 合約驗證腳本
 * 在 BSCScan 上驗證所有部署的合約源碼
 * 
 * 使用方式：
 * npx hardhat run scripts/verify-v25-contracts.js --network bsc
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`,
    title: `${colors.bright}${colors.cyan}`
  };
  
  if (type === 'title') {
    console.log(`${prefix[type]}${message}${colors.reset}`);
  } else {
    console.log(`${prefix[type]} ${message}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 載入部署配置
function loadDeploymentConfig() {
  const configPath = path.join(__dirname, '../deployments/v25-unified-1755412192571.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`配置文件不存在: ${configPath}`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

async function verifyContract(name, address, constructorArgs) {
  try {
    log(`驗證 ${name} (${address})...`);
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs || [],
    });
    
    log(`${name} 驗證成功！`, 'success');
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`${name} 已經驗證過`, 'warning');
      return true;
    } else if (error.message.includes("does not have bytecode")) {
      log(`${name} 合約不存在於該地址`, 'error');
      return false;
    } else {
      log(`${name} 驗證失敗: ${error.message}`, 'error');
      return false;
    }
  }
}

async function main() {
  console.log('\n');
  log('================================================', 'title');
  log('     V25 合約驗證腳本', 'title');
  log('================================================', 'title');
  console.log('\n');
  
  try {
    // 檢查 API Key
    if (!process.env.BSCSCAN_API_KEY) {
      throw new Error('請設置 BSCSCAN_API_KEY 環境變數');
    }
    
    // 載入配置
    log('載入部署配置...');
    const config = loadDeploymentConfig();
    
    log(`找到 ${Object.keys(config.contracts).length} 個合約需要驗證\n`);
    
    // 驗證統計
    let successCount = 0;
    let failCount = 0;
    let alreadyVerified = 0;
    
    // 需要驗證的合約列表（按部署順序）
    const contractsToVerify = [
      'Oracle',
      'DungeonCore', 
      'DungeonStorage',
      'VRFConsumerV2Plus',
      'Hero',
      'Relic',
      'Party',
      'PlayerVault',
      'PlayerProfile',
      'VIPStaking',
      'DungeonMaster',
      'AltarOfAscension'
    ];
    
    // 逐個驗證
    for (const contractName of contractsToVerify) {
      const contractData = config.contracts[contractName];
      if (!contractData) {
        log(`跳過 ${contractName}：未找到部署數據`, 'warning');
        continue;
      }
      
      const result = await verifyContract(
        contractName,
        contractData.address,
        contractData.constructorArgs
      );
      
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
      
      // 避免請求過快
      await sleep(3000);
    }
    
    // 顯示結果
    console.log('\n');
    log('================================================', 'title');
    log('     驗證結果總結', 'title');
    log('================================================', 'title');
    
    console.log(`
✅ 成功驗證: ${successCount} 個
❌ 驗證失敗: ${failCount} 個

詳細合約地址：
`);
    
    // 列出所有合約地址
    for (const [name, data] of Object.entries(config.contracts)) {
      const checkUrl = `https://bscscan.com/address/${data.address}#code`;
      console.log(`${name}: ${data.address}`);
      console.log(`   查看: ${checkUrl}`);
    }
    
    if (failCount === 0) {
      log('\n🎉 所有合約驗證成功！', 'success');
    } else {
      log(`\n⚠️ 有 ${failCount} 個合約驗證失敗，請手動檢查`, 'warning');
    }
    
  } catch (error) {
    log(`\n驗證失敗: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 執行驗證
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
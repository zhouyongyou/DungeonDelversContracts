const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

/**
 * V25.0.3 完整合約驗證腳本
 * 
 * 自動驗證所有部署的合約
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              V25.0.3 合約驗證 - 驗證所有部署合約                     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('=' . repeat(70));

  // 讀取部署配置
  const envPath = path.join(__dirname, '..', '.env.v25.0.3');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ 錯誤: .env.v25.0.3 未找到。請先執行部署腳本。${colors.reset}`);
    process.exit(1);
  }

  // 解析配置
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim();
    }
  });

  // 需要驗證的合約列表
  const contractsToVerify = [
    // 代幣合約
    {
      name: 'TSOUL',
      address: config.VITE_SOULSHARD_ADDRESS,
      contract: 'contracts/current/defi/TSOUL.sol:TSOUL',
      constructorArgs: []
    },
    {
      name: 'TUSD1',
      address: config.VITE_USD_ADDRESS,
      contract: 'contracts/current/defi/TUSD1.sol:TUSD1',
      constructorArgs: []
    },
    // 核心基礎設施
    {
      name: 'DungeonCore',
      address: config.VITE_DUNGEONCORE_ADDRESS,
      contract: 'contracts/current/core/DungeonCore.sol:DungeonCore',
      constructorArgs: []
    },
    {
      name: 'Oracle',
      address: config.VITE_ORACLE_ADDRESS,
      contract: 'contracts/current/defi/Oracle.sol:Oracle',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'VRFManagerV2Plus',
      address: config.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
      contract: 'contracts/current/core/VRFConsumerV2Plus.sol:VRFConsumerV2Plus',
      constructorArgs: []
    },
    // NFT 合約
    {
      name: 'Hero',
      address: config.VITE_HERO_ADDRESS,
      contract: 'contracts/current/nft/Hero.sol:Hero',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'Relic',
      address: config.VITE_RELIC_ADDRESS,
      contract: 'contracts/current/nft/Relic.sol:Relic',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'Party',
      address: config.VITE_PARTY_ADDRESS,
      contract: 'contracts/current/nft/Party.sol:Party',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    // 遊戲邏輯合約
    {
      name: 'DungeonStorage',
      address: config.VITE_DUNGEONSTORAGE_ADDRESS,
      contract: 'contracts/current/core/DungeonStorage.sol:DungeonStorage',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'DungeonMaster',
      address: config.VITE_DUNGEONMASTER_ADDRESS,
      contract: 'contracts/current/core/DungeonMaster.sol:DungeonMaster',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'AltarOfAscension',
      address: config.VITE_ALTAROFASCENSION_ADDRESS,
      contract: 'contracts/current/core/AltarOfAscension.sol:AltarOfAscension',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'PlayerVault',
      address: config.VITE_PLAYERVAULT_ADDRESS,
      contract: 'contracts/current/defi/PlayerVault.sol:PlayerVault',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'PlayerProfile',
      address: config.VITE_PLAYERPROFILE_ADDRESS,
      contract: 'contracts/current/nft/PlayerProfile.sol:PlayerProfile',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    },
    {
      name: 'VIPStaking',
      address: config.VITE_VIPSTAKING_ADDRESS,
      contract: 'contracts/current/nft/VIPStaking.sol:VIPStaking',
      constructorArgs: [config.VITE_DUNGEONCORE_ADDRESS]
    }
  ];

  console.log(`\n📋 需要驗證的合約數量: ${contractsToVerify.length}`);
  console.log('=' . repeat(70));

  // 確保有 BSCScan API Key
  const BSCSCAN_API_KEY = process.env.VITE_BSCSCAN_API_KEY || process.env.BSCSCAN_API_KEY || '2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC';
  if (!BSCSCAN_API_KEY) {
    console.error(`${colors.red}❌ 錯誤: BSCSCAN_API_KEY 未在環境中找到${colors.reset}`);
    process.exit(1);
  }

  console.log(`🔑 使用 BSCScan API Key: ${BSCSCAN_API_KEY.substring(0, 10)}...`);

  let successCount = 0;
  let failCount = 0;
  let alreadyVerifiedCount = 0;

  for (const contract of contractsToVerify) {
    console.log(`\n🔍 驗證 ${contract.name}...`);
    console.log(`  地址: ${contract.address}`);
    console.log(`  合約: ${contract.contract}`);
    
    if (!contract.address) {
      console.log(`  ${colors.yellow}⚠️  跳過: 未找到地址${colors.reset}`);
      failCount++;
      continue;
    }

    try {
      await hre.run("verify:verify", {
        address: contract.address,
        contract: contract.contract,
        constructorArguments: contract.constructorArgs,
      });
      console.log(`  ${colors.green}✅ 驗證成功${colors.reset}`);
      successCount++;
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`  ${colors.green}✅ 已經驗證${colors.reset}`);
        alreadyVerifiedCount++;
      } else if (error.message.includes("Contract source code already verified")) {
        console.log(`  ${colors.green}✅ 源碼已驗證${colors.reset}`);
        alreadyVerifiedCount++;
      } else {
        console.log(`  ${colors.red}❌ 失敗: ${error.message}${colors.reset}`);
        failCount++;
      }
    }

    // 添加延遲避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 驗證總結
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}🎉 驗證完成${colors.reset}`);
  console.log('=' . repeat(70));
  console.log('\n📊 驗證總結:');
  console.log(`  ${colors.green}✅ 新驗證成功: ${successCount}${colors.reset}`);
  console.log(`  ${colors.green}✅ 已經驗證: ${alreadyVerifiedCount}${colors.reset}`);
  console.log(`  ${colors.red}❌ 驗證失敗: ${failCount}${colors.reset}`);
  console.log(`  📊 總計: ${contractsToVerify.length} 個合約`);

  if (failCount > 0) {
    console.log(`\n${colors.yellow}⚠️  部分合約驗證失敗${colors.reset}`);
    console.log('您可以手動在 BSCScan 上驗證:');
    console.log('https://bscscan.com/verifyContract');
    
    console.log('\n失敗的合約可能原因:');
    console.log('1. 合約尚未部署或地址錯誤');
    console.log('2. 網路延遲，稍後重試');
    console.log('3. 合約字節碼與源碼不匹配');
  } else {
    console.log(`\n${colors.green}✨ 所有合約驗證成功！${colors.reset}`);
  }

  console.log('\n' + '=' . repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n${colors.red}❌ 驗證腳本失敗:${colors.reset}`, error);
    process.exit(1);
  });
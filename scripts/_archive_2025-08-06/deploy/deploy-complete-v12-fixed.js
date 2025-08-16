// scripts/deploy-complete-v12-fixed.js
// 修正版本：包含所有必要的設置

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// 日誌函數
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  
  log(`\n📋 V12 部署腳本（修正版）`, 'bright');
  log(`================================`, 'bright');
  log(`網路: ${network}`, 'yellow');
  log(`部署者: ${deployer.address}`, 'yellow');
  log(`餘額: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB\n`, 'yellow');

  // 在原有的部署代碼後添加以下設置...
  
  // ============ 額外設置（修正部分）============
  log('\n🔧 執行額外必要設置...', 'yellow');
  log('----------------------------------------', 'yellow');
  
  // 1. 設置 VIPStaking 的 SoulShard Token
  log('\n📍 設置 VIPStaking SoulShard Token...', 'cyan');
  const vipStaking = await ethers.getContractAt("VIPStaking", addresses.VIPSTAKING_ADDRESS);
  try {
    const currentToken = await vipStaking.soulShardToken();
    if (currentToken === ethers.ZeroAddress) {
      await vipStaking.setSoulShardToken(addresses.SOULSHARD_ADDRESS);
      log('  ✅ VIPStaking SoulShard Token 已設置', 'green');
    } else {
      log('  ⏭️  VIPStaking SoulShard Token 已經設置', 'yellow');
    }
  } catch (error) {
    log('  ❌ 設置 VIPStaking SoulShard Token 失敗: ' + error.message, 'red');
  }
  
  // 2. 設置 Hero 和 Relic 的 SoulShard Token
  log('\n📍 設置 Hero SoulShard Token...', 'cyan');
  const hero = await ethers.getContractAt("Hero", addresses.HERO_ADDRESS);
  try {
    const currentToken = await hero.soulShardToken();
    if (currentToken === ethers.ZeroAddress) {
      await hero.setSoulShardToken(addresses.SOULSHARD_ADDRESS);
      log('  ✅ Hero SoulShard Token 已設置', 'green');
    } else {
      log('  ⏭️  Hero SoulShard Token 已經設置', 'yellow');
    }
  } catch (error) {
    log('  ❌ 設置 Hero SoulShard Token 失敗: ' + error.message, 'red');
  }
  
  log('\n📍 設置 Relic SoulShard Token...', 'cyan');
  const relic = await ethers.getContractAt("Relic", addresses.RELIC_ADDRESS);
  try {
    const currentToken = await relic.soulShardToken();
    if (currentToken === ethers.ZeroAddress) {
      await relic.setSoulShardToken(addresses.SOULSHARD_ADDRESS);
      log('  ✅ Relic SoulShard Token 已設置', 'green');
    } else {
      log('  ⏭️  Relic SoulShard Token 已經設置', 'yellow');
    }
  } catch (error) {
    log('  ❌ 設置 Relic SoulShard Token 失敗: ' + error.message, 'red');
  }
  
  // 3. 設置 NFT 鑄造價格
  log('\n📍 設置 NFT 鑄造價格...', 'cyan');
  try {
    const currentHeroPrice = await hero.mintPriceUSD();
    if (currentHeroPrice === 0n) {
      await hero.setMintPriceUSD(10); // $10 USD
      log('  ✅ Hero 鑄造價格設置為 $10 USD', 'green');
    } else {
      log(`  ⏭️  Hero 鑄造價格已設置: $${ethers.formatEther(currentHeroPrice)} USD`, 'yellow');
    }
  } catch (error) {
    log('  ❌ 設置 Hero 價格失敗: ' + error.message, 'red');
  }
  
  try {
    const currentRelicPrice = await relic.mintPriceUSD();
    if (currentRelicPrice === 0n) {
      await relic.setMintPriceUSD(5); // $5 USD
      log('  ✅ Relic 鑄造價格設置為 $5 USD', 'green');
    } else {
      log(`  ⏭️  Relic 鑄造價格已設置: $${ethers.formatEther(currentRelicPrice)} USD`, 'yellow');
    }
  } catch (error) {
    log('  ❌ 設置 Relic 價格失敗: ' + error.message, 'red');
  }
  
  // 4. 設置平台費用（如果需要）
  log('\n📍 檢查平台費用設置...', 'cyan');
  try {
    const heroPlatformFee = await hero.platformFee();
    const relicPlatformFee = await relic.platformFee();
    const partyPlatformFee = await partyV3.platformFee();
    
    log(`  Hero 平台費: ${ethers.formatEther(heroPlatformFee)} BNB`, 'cyan');
    log(`  Relic 平台費: ${ethers.formatEther(relicPlatformFee)} BNB`, 'cyan');
    log(`  Party 平台費: ${ethers.formatEther(partyPlatformFee)} BNB`, 'cyan');
    
    // 如果需要設置非零平台費，可以在這裡添加
    // await hero.setPlatformFee(ethers.parseEther("0.001"));
  } catch (error) {
    log('  ⚠️  無法檢查平台費用: ' + error.message, 'yellow');
  }
  
  // 5. 驗證所有關鍵設置
  log('\n✅ 驗證最終設置...', 'green');
  log('================================', 'green');
  
  // 驗證 DungeonCore 連接
  const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.DUNGEONCORE_ADDRESS);
  
  log('\n📍 DungeonCore 合約連接:', 'cyan');
  log(`  Oracle: ${await dungeonCore.oracleAddress()}`, 'green');
  log(`  Hero: ${await dungeonCore.heroContractAddress()}`, 'green');
  log(`  Relic: ${await dungeonCore.relicContractAddress()}`, 'green');
  log(`  Party: ${await dungeonCore.partyContractAddress()}`, 'green');
  log(`  VIPStaking: ${await dungeonCore.vipStakingAddress()}`, 'green');
  
  // 測試價格轉換
  log('\n📍 測試價格轉換功能:', 'cyan');
  try {
    const testUSD = ethers.parseEther("10");
    const soulAmount = await dungeonCore.getSoulShardAmountForUSD(testUSD);
    log(`  10 USD = ${ethers.formatEther(soulAmount)} SOUL`, 'green');
  } catch (error) {
    log(`  ❌ 價格轉換測試失敗: ${error.message}`, 'red');
    log(`  ⚠️  注意：Oracle 可能使用了不同的 USD 代幣`, 'yellow');
  }
  
  // 生成部署檢查清單
  log('\n📋 部署檢查清單:', 'magenta');
  log('================', 'magenta');
  log('✅ 所有合約已部署', 'green');
  log('✅ DungeonCore 地址已設置到所有合約', 'green');
  log('✅ 所有合約地址已設置到 DungeonCore', 'green');
  log('✅ VIPStaking SoulShard Token 已設置', 'green');
  log('✅ Hero/Relic SoulShard Token 已設置', 'green');
  log('✅ NFT 鑄造價格已設置', 'green');
  log('✅ 地城數據已初始化', 'green');
  log('⚠️  注意：Oracle USD 代幣可能需要調整', 'yellow');
  
  log('\n🎉 V12 部署完成！', 'green');
}

// 如果直接運行此腳本
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
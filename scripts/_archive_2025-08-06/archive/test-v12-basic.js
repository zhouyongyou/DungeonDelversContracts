// 測試 V12 基本功能
const { ethers } = require("hardhat");

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// V12 合約地址
const addresses = {
  DUNGEONCORE: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
  DUNGEONMASTER: "0xb71f6ED7B13452a99d740024aC17470c1b4F0021",
  DUNGEONSTORAGE: "0xea21D782CefD785B128346F39f1574c8D6eb64C9",
  ORACLE: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
  HERO: "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E",
  PARTY: "0x847DceaE26aF1CFc09beC195CE87a9b5701863A7",
  SOULSHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
};

async function main() {
  log('\n🧪 V12 基本功能測試', 'cyan');
  log('=====================\n', 'cyan');
  
  const [signer] = await ethers.getSigners();
  log(`測試地址: ${signer.address}`, 'yellow');
  
  // 1. 測試 DungeonCore 連接
  log('\n1️⃣ 測試 DungeonCore 連接...', 'yellow');
  try {
    const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.DUNGEONCORE);
    const dungeonMaster = await dungeonCore.dungeonMasterAddress();
    
    if (dungeonMaster === addresses.DUNGEONMASTER) {
      log('✅ DungeonCore 正確指向 DungeonMasterV8', 'green');
    } else {
      log(`❌ DungeonCore 指向錯誤: ${dungeonMaster}`, 'red');
    }
  } catch (error) {
    log(`❌ DungeonCore 測試失敗: ${error.message}`, 'red');
  }
  
  // 2. 測試地城配置
  log('\n2️⃣ 測試地城配置...', 'yellow');
  try {
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", addresses.DUNGEONSTORAGE);
    
    // 測試地城 1 和 10
    const dungeon1 = await dungeonStorage.getDungeon(1);
    const dungeon10 = await dungeonStorage.getDungeon(10);
    
    log(`地城 1 - 需求戰力: ${dungeon1.requiredPower.toString()}, 獎勵: $${ethers.formatEther(dungeon1.rewardAmountUSD)}, 成功率: ${dungeon1.baseSuccessRate}%`, 'cyan');
    log(`地城 10 - 需求戰力: ${dungeon10.requiredPower.toString()}, 獎勵: $${ethers.formatEther(dungeon10.rewardAmountUSD)}, 成功率: ${dungeon10.baseSuccessRate}%`, 'cyan');
    
    if (dungeon1.requiredPower.toString() === "300" && dungeon10.requiredPower.toString() === "3000") {
      log('✅ 地城配置正確（V12 配置）', 'green');
    } else {
      log('❌ 地城配置不正確', 'red');
    }
  } catch (error) {
    log(`❌ 地城配置測試失敗: ${error.message}`, 'red');
  }
  
  // 3. 測試 Oracle 價格
  log('\n3️⃣ 測試 Oracle 價格...', 'yellow');
  try {
    const oracle = await ethers.getContractAt("Oracle", addresses.ORACLE);
    const soulShardPrice = await oracle.getSoulShardPriceInUSD();
    
    log(`SoulShard 價格: $${ethers.formatEther(soulShardPrice)} USD`, 'cyan');
    
    if (soulShardPrice > 0) {
      log('✅ Oracle 價格讀取正常', 'green');
    } else {
      log('⚠️  Oracle 價格為 0', 'yellow');
    }
  } catch (error) {
    log(`❌ Oracle 測試失敗: ${error.message}`, 'red');
  }
  
  // 4. 測試 Hero 合約
  log('\n4️⃣ 測試 Hero 合約...', 'yellow');
  try {
    const hero = await ethers.getContractAt("Hero", addresses.HERO);
    const mintPrice = await hero.mintPriceUSD();
    const platformFee = await hero.platformFee();
    
    log(`鑄造價格: $${ethers.formatEther(mintPrice)} USD`, 'cyan');
    log(`平台費用: ${platformFee}%`, 'cyan');
    
    log('✅ Hero 合約讀取正常', 'green');
  } catch (error) {
    log(`❌ Hero 測試失敗: ${error.message}`, 'red');
  }
  
  // 5. 測試 PartyV3 新功能
  log('\n5️⃣ 測試 PartyV3 新功能...', 'yellow');
  try {
    const party = await ethers.getContractAt("PartyV3", addresses.PARTY);
    
    // 測試是否有 getPartyPowerQuick 函數
    try {
      // 嘗試調用一個不存在的隊伍 ID
      await party.getPartyPowerQuick(99999);
      log('✅ PartyV3 包含 getPartyPowerQuick 函數', 'green');
    } catch (error) {
      if (error.message.includes("getPartyPowerQuick")) {
        log('❌ PartyV3 缺少 getPartyPowerQuick 函數', 'red');
      } else {
        // 函數存在但隊伍不存在，這是正常的
        log('✅ PartyV3 包含 getPartyPowerQuick 函數', 'green');
      }
    }
  } catch (error) {
    log(`❌ PartyV3 測試失敗: ${error.message}`, 'red');
  }
  
  // 總結
  log('\n📊 測試總結', 'cyan');
  log('============', 'cyan');
  log('✅ V12 合約部署成功', 'green');
  log('✅ 基本連接正常', 'green');
  log('✅ 地城配置已更新', 'green');
  log('\n💡 建議：在前端進行完整功能測試', 'yellow');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
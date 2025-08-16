// scripts/deploy-storage-with-init.js
// 部署帶有初始化功能的 DungeonStorage

const { ethers } = require("hardhat");

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

// 地城配置 - 在部署時就設定好
const DUNGEON_CONFIG = [
  { id: 1, requiredPower: 300, rewardAmountUSD: ethers.parseEther("6"), baseSuccessRate: 89 },
  { id: 2, requiredPower: 600, rewardAmountUSD: ethers.parseEther("12"), baseSuccessRate: 84 },
  { id: 3, requiredPower: 900, rewardAmountUSD: ethers.parseEther("20"), baseSuccessRate: 79 },
  { id: 4, requiredPower: 1200, rewardAmountUSD: ethers.parseEther("33"), baseSuccessRate: 74 },
  { id: 5, requiredPower: 1500, rewardAmountUSD: ethers.parseEther("52"), baseSuccessRate: 69 },
  { id: 6, requiredPower: 1800, rewardAmountUSD: ethers.parseEther("78"), baseSuccessRate: 64 },
  { id: 7, requiredPower: 2100, rewardAmountUSD: ethers.parseEther("113"), baseSuccessRate: 59 },
  { id: 8, requiredPower: 2400, rewardAmountUSD: ethers.parseEther("156"), baseSuccessRate: 54 },
  { id: 9, requiredPower: 2700, rewardAmountUSD: ethers.parseEther("209"), baseSuccessRate: 49 },
  { id: 10, requiredPower: 3000, rewardAmountUSD: ethers.parseEther("225"), baseSuccessRate: 44 },
  { id: 11, requiredPower: 3300, rewardAmountUSD: ethers.parseEther("320"), baseSuccessRate: 39 },
  { id: 12, requiredPower: 3600, rewardAmountUSD: ethers.parseEther("450"), baseSuccessRate: 34 }
];

async function main() {
  log('\n🏰 部署 DungeonStorageWithInit (帶初始化功能)', 'magenta');
  log('='.repeat(70), 'magenta');
  
  const [deployer] = await ethers.getSigners();
  log(`👤 部署者: ${deployer.address}`, 'cyan');
  
  // 獲取 DungeonMaster 地址（如果已部署）
  const DUNGEON_MASTER_ADDRESS = process.env.DUNGEON_MASTER_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  log('\n📝 準備部署參數:', 'yellow');
  log(`   初始 Owner: ${deployer.address}`, 'cyan');
  log(`   DungeonMaster: ${DUNGEON_MASTER_ADDRESS}`, 'cyan');
  log(`   地城數量: ${DUNGEON_CONFIG.length}`, 'cyan');
  
  // 部署合約
  log('\n🚀 開始部署...', 'yellow');
  
  const DungeonStorageWithInit = await ethers.getContractFactory("DungeonStorageWithInit");
  
  const dungeonStorage = await DungeonStorageWithInit.deploy(
    deployer.address,           // initialOwner
    DUNGEON_MASTER_ADDRESS,      // _logicContract (可以是 0 地址，稍後設置)
    DUNGEON_CONFIG              // _dungeons 數組
  );
  
  await dungeonStorage.waitForDeployment();
  const address = await dungeonStorage.getAddress();
  
  log(`\n✅ DungeonStorageWithInit 部署成功！`, 'green');
  log(`   合約地址: ${address}`, 'green');
  
  // 驗證初始化結果
  log('\n🔍 驗證地城初始化狀態...', 'yellow');
  
  let allSuccess = true;
  for (let i = 1; i <= 12; i++) {
    try {
      const dungeon = await dungeonStorage.getDungeon(i);
      if (dungeon.isInitialized) {
        log(`   ✅ 地城 #${i}: 已初始化 (戰力: ${dungeon.requiredPower}, 獎勵: ${ethers.formatEther(dungeon.rewardAmountUSD)} USD)`, 'green');
      } else {
        log(`   ❌ 地城 #${i}: 未初始化`, 'red');
        allSuccess = false;
      }
    } catch (error) {
      log(`   ❌ 地城 #${i}: 讀取失敗 - ${error.message}`, 'red');
      allSuccess = false;
    }
  }
  
  if (allSuccess) {
    log('\n🎉 所有地城已成功初始化！', 'green');
  } else {
    log('\n⚠️  部分地城初始化失敗', 'yellow');
  }
  
  // 輸出部署資訊
  log('\n📋 部署總結:', 'magenta');
  log('='.repeat(70), 'magenta');
  log(`DungeonStorageWithInit: ${address}`, 'cyan');
  log('\n請將以上地址更新到:', 'yellow');
  log('1. .env 文件中的 DUNGEON_STORAGE_ADDRESS', 'yellow');
  log('2. DungeonMaster 合約的 setDungeonStorage() 函數', 'yellow');
  log('3. 前端配置文件', 'yellow');
  log('='.repeat(70), 'magenta');
  
  // 如果 DungeonMaster 已部署且不是零地址，提示設置步驟
  if (DUNGEON_MASTER_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    log('\n📌 後續步驟:', 'yellow');
    log('1. 在 DungeonMaster 中調用:', 'cyan');
    log(`   setDungeonStorage("${address}")`, 'cyan');
    log('\n2. 如果 DungeonMaster 尚未設置為 LogicContract:', 'cyan');
    log(`   在 DungeonStorage 中調用:`, 'cyan');
    log(`   setLogicContract("${DUNGEON_MASTER_ADDRESS}")`, 'cyan');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

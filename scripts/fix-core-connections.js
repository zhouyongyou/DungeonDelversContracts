// 🔧 修復 CORE 互連腳本
// 手動設定 Hero, Relic, VIPStaking 與 DungeonCore 的雙向連接

const { ethers } = require("hardhat");

// 部署地址 (V25.2.3)
const ADDRESSES = {
  DUNGEON_CORE: "0x5b64a5939735ff762493d9b9666b3e13118c5722",
  HERO: "0x941F44De87B303D792924e38fb8C9BADc697Eba2",
  RELIC: "0xB96D6356C836eA19F7dd006537C4836dD2d3e38d",
  VIPSTAKING: "0x48B5693926d3363024F318dDf486101ee8480AB2"
};

// 優化的 Gas 設定 (BSC 標準)
const GAS_CONFIG = {
  gasLimit: 1000000,
  gasPrice: ethers.parseUnits("0.11", "gwei")
};

async function main() {
  console.log("🔧 開始修復 CORE 互連設定...");
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 操作者: ${deployer.address}`);
  
  // 獲取合約實例
  const DungeonCore = await ethers.getContractFactory("DungeonCore");
  const Hero = await ethers.getContractFactory("Hero");
  const Relic = await ethers.getContractFactory("Relic");
  const VIPStaking = await ethers.getContractFactory("VIPStaking");
  
  const dungeonCore = DungeonCore.attach(ADDRESSES.DUNGEON_CORE);
  const hero = Hero.attach(ADDRESSES.HERO);
  const relic = Relic.attach(ADDRESSES.RELIC);
  const vipStaking = VIPStaking.attach(ADDRESSES.VIPSTAKING);
  
  const tasks = [
    {
      name: "Hero → DungeonCore",
      action: () => hero.setDungeonCore(ADDRESSES.DUNGEON_CORE, GAS_CONFIG)
    },
    {
      name: "Relic → DungeonCore", 
      action: () => relic.setDungeonCore(ADDRESSES.DUNGEON_CORE, GAS_CONFIG)
    },
    {
      name: "VIPStaking → DungeonCore",
      action: () => vipStaking.setDungeonCore(ADDRESSES.DUNGEON_CORE, GAS_CONFIG)
    },
    {
      name: "DungeonCore → Hero",
      action: () => dungeonCore.setHeroContract(ADDRESSES.HERO, GAS_CONFIG)
    },
    {
      name: "DungeonCore → Relic",
      action: () => dungeonCore.setRelicContract(ADDRESSES.RELIC, GAS_CONFIG)
    },
    {
      name: "DungeonCore → VIPStaking",
      action: () => dungeonCore.setVipStaking(ADDRESSES.VIPSTAKING, GAS_CONFIG)
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const task of tasks) {
    console.log(`🔗 設定 ${task.name}...`);
    
    try {
      const tx = await task.action();
      await tx.wait();
      
      console.log(`✅ ${task.name} 設定成功`);
      console.log(`   交易哈希: ${tx.hash}`);
      successCount++;
      
      // 設定間隔避免 nonce 衝突
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ ${task.name} 設定失敗:`, error.message);
      errorCount++;
      
      // 檢查是否是權限問題
      if (error.message.includes("caller is not the owner")) {
        console.log("   ⚠️  請確認部署者是合約的 owner");
      }
    }
  }
  
  console.log("\\n" + "=".repeat(50));
  console.log("🎯 CORE 互連設定完成");
  console.log("=".repeat(50));
  console.log(`✅ 成功: ${successCount} 個連接`);
  console.log(`❌ 失敗: ${errorCount} 個連接`);
  console.log("=".repeat(50));
  
  if (errorCount === 0) {
    console.log("🎉 所有 CORE 互連設定完成！");
  } else {
    console.log("⚠️  部分設定失敗，請檢查錯誤訊息");
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("CORE 互連修復失敗:", error);
      process.exit(1);
    });
}
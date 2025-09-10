// fix-dungeon-rewards-18decimals.js - 修復地牢獎勵金額為正確的18位小數格式
// 🚨 核心問題：當前地牢設置時 rewardAmountUSD 使用純數字而非18位小數格式
// 這導致獎勵計算時數值錯誤，獲得的SOUL獎勵比預期少1e18倍

const { ethers } = require("hardhat");

// 🚨 強制執行 0.11 gwei Gas Price
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 300000;

// 當前地牢配置（需要修復的數據）
const DUNGEON_CONFIGS = [
  { 
    id: 1, 
    requiredPower: 100, 
    rewardAmountUSD_OLD: 10,      // ❌ 錯誤：純數字 10
    rewardAmountUSD_NEW: ethers.parseEther("10"), // ✅ 正確：10 * 1e18
    baseSuccessRate: 80 
  },
  { 
    id: 2, 
    requiredPower: 250, 
    rewardAmountUSD_OLD: 25,      // ❌ 錯誤：純數字 25  
    rewardAmountUSD_NEW: ethers.parseEther("25"), // ✅ 正確：25 * 1e18
    baseSuccessRate: 70 
  },
  { 
    id: 3, 
    requiredPower: 500, 
    rewardAmountUSD_OLD: 50,      // ❌ 錯誤：純數字 50
    rewardAmountUSD_NEW: ethers.parseEther("50"), // ✅ 正確：50 * 1e18
    baseSuccessRate: 60 
  },
  // 新增更高難度地牢
  { 
    id: 4, 
    requiredPower: 1000, 
    rewardAmountUSD_OLD: 100,     // ❌ 錯誤：純數字 100
    rewardAmountUSD_NEW: ethers.parseEther("100"), // ✅ 正確：100 * 1e18
    baseSuccessRate: 50 
  },
  { 
    id: 5, 
    requiredPower: 2000, 
    rewardAmountUSD_OLD: 200,     // ❌ 錯誤：純數字 200
    rewardAmountUSD_NEW: ethers.parseEther("200"), // ✅ 正確：200 * 1e18
    baseSuccessRate: 40 
  }
];

async function executeTransaction(contract, methodName, args, description) {
  console.log(`\n🔗 ${description}`);
  console.log(`Method: ${methodName}`);
  console.log(`Args:`, args);
  
  try {
    const tx = await contract[methodName](...args, {
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    
    return { success: true, receipt };
  } catch (error) {
    console.error(`❌ Transaction failed: ${error.message}`);
    throw error;
  }
}

async function getCurrentDungeonInfo(dungeonStorage, dungeonId) {
  try {
    const dungeon = await dungeonStorage.getDungeon(dungeonId);
    console.log(`\n📋 Current Dungeon ${dungeonId} Info:`);
    console.log(`  Required Power: ${dungeon.requiredPower}`);
    console.log(`  Reward Amount USD: ${dungeon.rewardAmountUSD.toString()}`);
    console.log(`  Reward Amount USD (formatted): ${ethers.formatEther(dungeon.rewardAmountUSD)} USD`);
    console.log(`  Base Success Rate: ${dungeon.baseSuccessRate}%`);
    console.log(`  Is Active: ${dungeon.isActive}`);
    return dungeon;
  } catch (error) {
    console.log(`⚠️ Dungeon ${dungeonId} not found or error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("🔧 修復地牢獎勵金額 - 18位小數格式");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("執行者地址:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("帳戶餘額:", ethers.formatEther(balance), "BNB");
  console.log(`Gas price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);

  // 獲取DungeonStorage合約地址
  const dungeonStorageAddress = process.env.VITE_DUNGEONSTORAGE_ADDRESS || process.env.DUNGEONSTORAGE_ADDRESS;
  if (!dungeonStorageAddress) {
    console.error("❌ Missing DUNGEONSTORAGE_ADDRESS in environment");
    process.exit(1);
  }

  console.log(`\n📍 DungeonStorage: ${dungeonStorageAddress}`);

  try {
    // 連接 DungeonStorage 合約
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = DungeonStorage.attach(dungeonStorageAddress);

    console.log("\n" + "=".repeat(60));
    console.log("📋 第一步：檢查當前地牢配置");
    console.log("=".repeat(60));

    // 檢查當前地牢配置
    for (const config of DUNGEON_CONFIGS) {
      await getCurrentDungeonInfo(dungeonStorage, config.id);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔧 第二步：修復地牢獎勵金額");
    console.log("=".repeat(60));

    const results = [];

    // 修復每個地牢的配置
    for (const config of DUNGEON_CONFIGS) {
      console.log(`\n🎯 修復 Dungeon ${config.id}`);
      console.log(`   舊獎勵: ${config.rewardAmountUSD_OLD} (純數字)`);
      console.log(`   新獎勵: ${ethers.formatEther(config.rewardAmountUSD_NEW)} ETH format`);
      console.log(`   wei 值: ${config.rewardAmountUSD_NEW.toString()}`);

      try {
        const result = await executeTransaction(
          dungeonStorage,
          "setDungeon",
          [
            config.id,
            [
              config.requiredPower,
              config.rewardAmountUSD_NEW,  // ✅ 使用18位小數格式
              config.baseSuccessRate,
              true  // isActive
            ]
          ],
          `修復 Dungeon ${config.id} 獎勵金額 (${config.rewardAmountUSD_OLD} → ${ethers.formatEther(config.rewardAmountUSD_NEW)} USD)`
        );

        results.push({
          dungeonId: config.id,
          status: "success",
          txHash: result.receipt.transactionHash,
          gasUsed: result.receipt.gasUsed.toString()
        });

        // 等待2秒後繼續下一個
        if (DUNGEON_CONFIGS.indexOf(config) < DUNGEON_CONFIGS.length - 1) {
          console.log("   ⏳ 等待 2 秒後繼續...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Dungeon ${config.id} 修復失敗:`, error.message);
        results.push({
          dungeonId: config.id,
          status: "failed",
          error: error.message
        });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔍 第三步：驗證修復結果");
    console.log("=".repeat(60));

    // 驗證修復結果
    for (const config of DUNGEON_CONFIGS) {
      const verifiedDungeon = await getCurrentDungeonInfo(dungeonStorage, config.id);
      if (verifiedDungeon) {
        const expectedAmount = config.rewardAmountUSD_NEW.toString();
        const actualAmount = verifiedDungeon.rewardAmountUSD.toString();
        
        if (expectedAmount === actualAmount) {
          console.log(`✅ Dungeon ${config.id} 驗證成功`);
        } else {
          console.log(`❌ Dungeon ${config.id} 驗證失敗:`);
          console.log(`   Expected: ${expectedAmount}`);
          console.log(`   Actual: ${actualAmount}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 最終結果摘要");
    console.log("=".repeat(60));

    results.forEach(result => {
      console.log(`\nDungeon ${result.dungeonId}:`);
      if (result.status === "success") {
        console.log(`   ✅ 修復成功`);
        console.log(`   📤 交易哈希: ${result.txHash}`);
        console.log(`   ⛽ Gas使用: ${result.gasUsed}`);
      } else {
        console.log(`   ❌ 修復失敗: ${result.error}`);
      }
    });

    const successCount = results.filter(r => r.status === "success").length;
    const totalCount = results.length;

    console.log(`\n🎯 總計: ${successCount}/${totalCount} 個地牢修復成功`);

    if (successCount === totalCount) {
      console.log("🎉 所有地牢獎勵金額修復完成！");
      console.log("\n📈 修復效果:");
      console.log("   - 探險獎勵將從 ~225,599 wei 增加到 ~225,599 * 1e18 wei");
      console.log("   - $12 USD 獎勵將正確轉換為數百萬 SOUL (而非微量)");
      console.log("   - Oracle 價格計算將使用正確的18位小數格式");
      
      console.log("\n🔄 後續步驟:");
      console.log("1. ✅ 地牢獎勵金額修復 - 已完成");
      console.log("2. 🔄 測試探險功能，確認獎勵正確");
      console.log("3. 🔄 更新子圖，確保同步新的獎勵數據");
      console.log("4. 🔄 通知前端更新，顯示正確的獎勵預覽");

    } else {
      console.log("⚠️ 部分地牢修復失敗，需要手動處理");
    }

  } catch (error) {
    console.error("💥 腳本執行失敗:", error);
    process.exit(1);
  }
}

// Execute with proper error handling
main()
  .then(() => {
    console.log("\n🎉 地牢獎勵修復腳本執行完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
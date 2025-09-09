// setup-party-core-connection.js - Setup Party contract DungeonCore connection
// 🚨 Gas Price 核心原則：所有操作使用 0.11 gwei
// 專門處理 Party 合約的 DungeonCore 連接設定

const { ethers } = require("hardhat");

// Contract addresses from ENV
const addresses = {
  dungeonCore: process.env.DUNGEONCORE_ADDRESS,
  party: process.env.VITE_PARTY_ADDRESS || process.env.PARTY_ADDRESS
};

// Validate required addresses
if (!addresses.dungeonCore || !addresses.party) {
  console.error('❌ Missing required environment variables:');
  if (!addresses.dungeonCore) console.error('   - DUNGEONCORE_ADDRESS');
  if (!addresses.party) console.error('   - VITE_PARTY_ADDRESS or PARTY_ADDRESS');
  process.exit(1);
}

// 🚨 強制執行 0.11 gwei Gas Price
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

async function main() {
  console.log("🚀 開始設定 Party 合約的 DungeonCore 連接...");
  console.log(`📍 DungeonCore 地址: ${addresses.dungeonCore}`);
  console.log(`📍 Party 地址: ${addresses.party}`);
  console.log(`⛽ Gas Price: 0.11 gwei`);
  
  try {
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`   部署者地址: ${deployer.address}`);
    
    // Get Party contract instance
    const party = await ethers.getContractAt("Party", addresses.party);
    
    // Check current dungeonCore setting
    console.log(`\n🔍 檢查 Party 的當前 DungeonCore 設定...`);
    
    let currentCore;
    try {
      // Try dungeonCoreContract getter
      currentCore = await party.dungeonCoreContract();
      console.log(`   當前設定: ${currentCore}`);
    } catch (error) {
      try {
        // Try dungeonCore getter as fallback
        currentCore = await party.dungeonCore();
        console.log(`   當前設定: ${currentCore}`);
      } catch (error2) {
        console.log(`   ❌ 無法讀取 Party 的 dungeonCore 設定`);
        console.log(`   錯誤: ${error2.message}`);
        return;
      }
    }
    
    if (currentCore.toLowerCase() === addresses.dungeonCore.toLowerCase()) {
      console.log(`   ✅ Party 已正確設定 DungeonCore`);
      console.log("🎉 無需任何操作！");
      return;
    }
    
    if (currentCore === "0x0000000000000000000000000000000000000000") {
      console.log(`   ❌ Party 未設定 DungeonCore，開始設定...`);
    } else {
      console.log(`   ⚠️ Party 設定了不同的 DungeonCore: ${currentCore}，更新為新地址...`);
    }
    
    // Execute setDungeonCore transaction
    console.log(`\n🔧 在 Party 中設定總機...`);
    const tx = await party.setDungeonCore(addresses.dungeonCore, {
      gasPrice: GAS_PRICE,
      gasLimit: 200000
    });
    
    console.log(`   📤 交易發送: ${tx.hash}`);
    console.log(`   ⏳ 等待確認...`);
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log(`   ✅ 在 Party 中設定總機 成功！`);
      console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);
      
      // Verify the setting
      console.log(`\n🔍 驗證設定結果...`);
      const newCore = await party.dungeonCoreContract();
      console.log(`   新設定: ${newCore}`);
      
      if (newCore.toLowerCase() === addresses.dungeonCore.toLowerCase()) {
        console.log(`   ✅ 驗證成功！Party 已正確連接到 DungeonCore`);
      } else {
        console.log(`   ❌ 驗證失敗！設定可能有問題`);
      }
    } else {
      console.log(`   ❌ 交易失敗`);
    }
    
  } catch (error) {
    console.error("❌ 設定過程中發生錯誤:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n🎯 Party DungeonCore 連接設定完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
  });
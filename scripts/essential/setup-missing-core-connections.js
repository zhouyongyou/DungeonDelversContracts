// setup-missing-core-connections.js - Auto-setup missing DungeonCore connections
// 🚨 Gas Price 核心原則：所有操作使用 0.11 gwei
// 根據管理頁面顯示，自動設定缺失的 DungeonCore 連接

const { ethers } = require("hardhat");

// Contract addresses from ENV - V1.3.6 configuration
const addresses = {
  dungeonCore: process.env.DUNGEONCORE_ADDRESS,
  hero: process.env.VITE_HERO_ADDRESS || process.env.HERO_ADDRESS,
  relic: process.env.VITE_RELIC_ADDRESS || process.env.RELIC_ADDRESS,
  party: process.env.VITE_PARTY_ADDRESS || process.env.PARTY_ADDRESS,
  playerProfile: process.env.VITE_PLAYERPROFILE_ADDRESS || process.env.PLAYERPROFILE_ADDRESS,
  vipStaking: process.env.VITE_VIPSTAKING_ADDRESS || process.env.VIPSTAKING_ADDRESS,
  altarOfAscension: process.env.VITE_ALTAROFASCENSION_ADDRESS || process.env.ALTAROFASCENSION_ADDRESS,
  playerVault: process.env.VITE_PLAYERVAULT_ADDRESS || process.env.PLAYERVAULT_ADDRESS,
  dungeonMaster: process.env.VITE_DUNGEONMASTER_ADDRESS || process.env.DUNGEONMASTER_ADDRESS
};

// Validate required addresses
const requiredAddresses = ['dungeonCore', 'hero', 'relic', 'party', 'playerProfile', 'vipStaking', 'altarOfAscension'];
const missingAddresses = requiredAddresses.filter(key => !addresses[key]);

if (missingAddresses.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingAddresses.forEach(addr => console.error(`   - ${addr.toUpperCase()}_ADDRESS`));
  process.exit(1);
}

// 🚨 強制執行 0.11 gwei Gas Price
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// Contract configurations that need DungeonCore setup
const contractConfigs = [
  {
    name: "Hero",
    address: addresses.hero,
    functionName: "setDungeonCore",
    description: "在 Hero 中設定總機"
  },
  {
    name: "Relic", 
    address: addresses.relic,
    functionName: "setDungeonCore",
    description: "在 Relic 中設定總機"
  },
  {
    name: "Party",
    address: addresses.party,
    functionName: "setDungeonCore", 
    description: "在 Party 中設定總機"
  },
  {
    name: "PlayerProfile",
    address: addresses.playerProfile,
    functionName: "setDungeonCore",
    description: "在 PlayerProfile 中設定總機"
  },
  {
    name: "VIPStaking",
    address: addresses.vipStaking,
    functionName: "setDungeonCore",
    description: "在 VIPStaking 中設定總機"
  },
  {
    name: "AltarOfAscension",
    address: addresses.altarOfAscension,
    functionName: "setDungeonCore",
    description: "在 Altar 中設定總機"
  }
];

async function checkCurrentConnection(contractName, contractAddress) {
  try {
    console.log(`\n🔍 檢查 ${contractName} 的當前 DungeonCore 設定...`);
    
    // Get contract instance
    const contract = await ethers.getContractAt(contractName, contractAddress);
    
    // Check current dungeonCore address
    let currentCore;
    try {
      currentCore = await contract.dungeonCore();
    } catch (error) {
      // Some contracts might use different getter names
      try {
        currentCore = await contract.getDungeonCore();
      } catch (error2) {
        console.log(`   ⚠️ 無法讀取 ${contractName} 的 dungeonCore 設定`);
        return null;
      }
    }
    
    console.log(`   當前設定: ${currentCore}`);
    
    if (currentCore === "0x0000000000000000000000000000000000000000") {
      console.log(`   ❌ ${contractName} 未設定 DungeonCore`);
      return false;
    } else if (currentCore.toLowerCase() === addresses.dungeonCore.toLowerCase()) {
      console.log(`   ✅ ${contractName} 已正確設定 DungeonCore`);
      return true;
    } else {
      console.log(`   ⚠️ ${contractName} 設定了不同的 DungeonCore: ${currentCore}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 檢查 ${contractName} 失敗: ${error.message}`);
    return null;
  }
}

async function setupDungeonCore(config) {
  try {
    console.log(`\n🔧 ${config.description}...`);
    console.log(`   合約地址: ${config.address}`);
    console.log(`   目標 DungeonCore: ${addresses.dungeonCore}`);
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`   部署者地址: ${deployer.address}`);
    
    // Get contract instance
    const contract = await ethers.getContractAt(config.name, config.address);
    
    // Execute setDungeonCore transaction
    const tx = await contract[config.functionName](addresses.dungeonCore, {
      gasPrice: GAS_PRICE,
      gasLimit: 200000
    });
    
    console.log(`   📤 交易發送: ${tx.hash}`);
    console.log(`   ⏳ 等待確認...`);
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log(`   ✅ ${config.description} 成功！`);
      console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);
      return { success: true, txHash: tx.hash };
    } else {
      console.log(`   ❌ 交易失敗`);
      return { success: false, error: "Transaction failed" };
    }
    
  } catch (error) {
    console.log(`   ❌ ${config.description} 失敗: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("🚀 開始設定缺失的 DungeonCore 連接...");
  console.log(`📍 DungeonCore 地址: ${addresses.dungeonCore}`);
  console.log(`⛽ Gas Price: 0.11 gwei`);
  
  const results = [];
  const contractsToSetup = [];
  
  // Step 1: Check all contracts current status
  console.log("\n" + "=".repeat(60));
  console.log("📋 第一步：檢查所有合約的當前狀態");
  console.log("=".repeat(60));
  
  for (const config of contractConfigs) {
    const isSetup = await checkCurrentConnection(config.name, config.address);
    if (isSetup === false) {
      contractsToSetup.push(config);
    }
    results.push({ 
      contract: config.name, 
      currentStatus: isSetup === true ? "已設定" : isSetup === false ? "未設定" : "檢查失敗"
    });
  }
  
  // Step 2: Setup missing connections
  if (contractsToSetup.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("🔧 第二步：設定缺失的 DungeonCore 連接");
    console.log("=".repeat(60));
    
    for (const config of contractsToSetup) {
      const result = await setupDungeonCore(config);
      const statusIndex = results.findIndex(r => r.contract === config.name);
      if (statusIndex !== -1) {
        results[statusIndex].setupResult = result.success ? "設定成功" : `設定失敗: ${result.error}`;
        results[statusIndex].txHash = result.txHash;
      }
      
      // Wait 2 seconds between transactions
      if (contractsToSetup.indexOf(config) < contractsToSetup.length - 1) {
        console.log("   ⏳ 等待 2 秒後繼續...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } else {
    console.log("\n🎉 所有合約的 DungeonCore 連接都已正確設定！");
  }
  
  // Step 3: Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 最終結果摘要");
  console.log("=".repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.contract}:`);
    console.log(`   當前狀態: ${result.currentStatus}`);
    if (result.setupResult) {
      console.log(`   設定結果: ${result.setupResult}`);
    }
    if (result.txHash) {
      console.log(`   交易哈希: ${result.txHash}`);
    }
  });
  
  const successCount = results.filter(r => r.setupResult === "設定成功" || r.currentStatus === "已設定").length;
  const totalCount = results.length;
  
  console.log(`\n🎯 總計: ${successCount}/${totalCount} 個合約正確連接到 DungeonCore`);
  
  if (successCount === totalCount) {
    console.log("✅ 所有合約連接設定完成！");
  } else {
    console.log("⚠️ 部分合約連接設定可能需要手動處理");
  }
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
  });
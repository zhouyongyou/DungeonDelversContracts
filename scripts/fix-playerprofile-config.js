#!/usr/bin/env node

const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 修復 PlayerProfile 合約配置");
  
  // 使用有餘額的管理員錢包
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
  // 管理員錢包地址: 0xEbCF4A36Ad1485A9737025e9d72186b604487274
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || '請提供管理員私鑰';
  
  if (adminPrivateKey === '請提供管理員私鑰') {
    console.error("❌ 請設置 ADMIN_PRIVATE_KEY 環境變數");
    console.log("管理員錢包地址: 0xEbCF4A36Ad1485A9737025e9d72186b604487274");
    console.log("該錢包有 0.54 BNB 餘額");
    process.exit(1);
  }
  
  const deployer = new ethers.Wallet(adminPrivateKey, provider);
  console.log("執行者地址:", deployer.address);
  
  // 檢查餘額
  const balance = await provider.getBalance(deployer.address);
  console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
  
  if (balance === 0n) {
    throw new Error("錢包餘額不足，無法支付 gas 費用");
  }
  
  // V25.0.4 合約地址
  const addresses = {
    playerProfile: '0x3509d0f0cD6f7b518860f945128205ac4F426090',
    dungeonCore: '0x5B64A5939735Ff762493D9B9666b3e13118c5722',
    dungeonMaster: '0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF'
  };
  
  try {
    // 連接到 PlayerProfile 合約（使用有餘額的錢包）
    const playerProfileAbi = [
      "function dungeonCore() view returns (address)",
      "function setDungeonCore(address) external",
      "function owner() view returns (address)"
    ];
    
    const playerProfile = new ethers.Contract(
      addresses.playerProfile,
      playerProfileAbi,
      deployer
    );
    
    // 檢查當前設置
    console.log("\n📍 檢查當前設置...");
    const currentDungeonCore = await playerProfile.dungeonCore();
    console.log("當前 DungeonCore:", currentDungeonCore);
    
    if (currentDungeonCore === ethers.ZeroAddress) {
      console.log("❌ DungeonCore 未設置，需要修復");
      
      // 設置 DungeonCore 地址
      console.log("\n🔧 設置 DungeonCore 地址...");
      const tx = await playerProfile.setDungeonCore(addresses.dungeonCore, {
        gasLimit: 100000
      });
      
      console.log("交易已發送:", tx.hash);
      await tx.wait();
      console.log("✅ DungeonCore 設置成功");
      
      // 驗證設置
      const newDungeonCore = await playerProfile.dungeonCore();
      console.log("新的 DungeonCore:", newDungeonCore);
      
      if (newDungeonCore === addresses.dungeonCore) {
        console.log("✅ 驗證成功！");
      } else {
        console.log("❌ 驗證失敗，請檢查");
      }
    } else {
      console.log("✅ DungeonCore 已正確設置:", currentDungeonCore);
    }
    
    // 檢查 DungeonMaster 設置
    console.log("\n📍 檢查 DungeonMaster 設置...");
    try {
      // 嘗試從 DungeonCore 獲取 DungeonMaster
      const dungeonCoreAbi = [
        "function dungeonMaster() view returns (address)"
      ];
      const dungeonCore = new ethers.Contract(
        addresses.dungeonCore,
        dungeonCoreAbi,
        provider
      );
      const dungeonMasterFromCore = await dungeonCore.dungeonMaster();
      console.log("DungeonCore 中的 DungeonMaster:", dungeonMasterFromCore);
      
      if (dungeonMasterFromCore === addresses.dungeonMaster) {
        console.log("✅ DungeonMaster 配置正確");
      } else {
        console.log("⚠️ DungeonMaster 地址不匹配");
      }
    } catch (e) {
      console.log("無法檢查 DungeonMaster:", e.message);
    }
    
  } catch (error) {
    console.error("❌ 錯誤:", error.message);
    console.error("詳細錯誤:", error);
  }
  
  console.log("\n✅ 修復程序完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// setup-v25-complete-connections.js - 完整的 V25.0.4 合約連接設置
const { ethers } = require("hardhat");
require("dotenv").config();

// V25.0.4 最新合約地址 (2025/8/20 pm11)
const V25_ADDRESSES = {
  DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
  DUNGEONSTORAGE: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec", 
  DUNGEONMASTER: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
  ALTAROFASCENSION: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
  
  // NFT 合約
  HERO: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
  RELIC: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D", 
  PARTY: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
  PLAYERPROFILE: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
  VIPSTAKING: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661",
  
  // 其他合約
  PLAYERVAULT: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
  ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
  VRFMANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
  
  // 代幣
  SOULSHARD: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
  UNISWAP_POOL: "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa",
  
  // 管理員錢包
  DUNGEONMASTERWALLET: "0xEbCF4A36Ad1485A9737025e9d72186b604487274"
};

async function main() {
  console.log("🔗 設置 V25.0.4 完整合約連接...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("📝 使用錢包:", signer.address);
  console.log("💰 錢包餘額:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "BNB\n");
  
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  // 1. 設置 DungeonStorage 的 DungeonCore
  console.log("📋 Step 1: 設置 DungeonStorage -> DungeonCore");
  try {
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = DungeonStorage.attach(V25_ADDRESSES.DUNGEONSTORAGE);
    
    // 檢查當前設置
    const currentCore = await dungeonStorage.dungeonCore();
    if (currentCore === V25_ADDRESSES.DUNGEONCORE) {
      console.log("✅ DungeonStorage -> DungeonCore 已設置");
      skipCount++;
    } else {
      const tx = await dungeonStorage.setDungeonCore(V25_ADDRESSES.DUNGEONCORE);
      console.log(`🔄 交易哈希: ${tx.hash}`);
      await tx.wait();
      console.log("✅ DungeonStorage -> DungeonCore 設置成功");
      successCount++;
    }
  } catch (error) {
    console.log("❌ DungeonStorage -> DungeonCore 設置失敗:", error.message);
    failCount++;
  }
  
  // 2. 設置 DungeonMaster 的 DungeonStorage (如果需要)
  console.log("\n📋 Step 2: 設置 DungeonMaster -> DungeonStorage");
  try {
    const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = DungeonMaster.attach(V25_ADDRESSES.DUNGEONMASTER);
    
    const currentStorage = await dungeonMaster.dungeonStorage();
    if (currentStorage.toLowerCase() === V25_ADDRESSES.DUNGEONSTORAGE.toLowerCase()) {
      console.log("✅ DungeonMaster -> DungeonStorage 已設置");
      skipCount++;
    } else {
      const tx = await dungeonMaster.setDungeonStorage(V25_ADDRESSES.DUNGEONSTORAGE);
      console.log(`🔄 交易哈希: ${tx.hash}`);
      await tx.wait();
      console.log("✅ DungeonMaster -> DungeonStorage 設置成功");
      successCount++;
    }
  } catch (error) {
    console.log("❌ DungeonMaster -> DungeonStorage 設置失敗:", error.message);
    failCount++;
  }
  
  // 3. 設置 DungeonMaster 的 DungeonCore (如果需要)
  console.log("\n📋 Step 3: 設置 DungeonMaster -> DungeonCore");
  try {
    const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = DungeonMaster.attach(V25_ADDRESSES.DUNGEONMASTER);
    
    const currentCore = await dungeonMaster.dungeonCore();
    if (currentCore.toLowerCase() === V25_ADDRESSES.DUNGEONCORE.toLowerCase()) {
      console.log("✅ DungeonMaster -> DungeonCore 已設置");
      skipCount++;
    } else {
      const tx = await dungeonMaster.setDungeonCore(V25_ADDRESSES.DUNGEONCORE);
      console.log(`🔄 交易哈希: ${tx.hash}`);
      await tx.wait();
      console.log("✅ DungeonMaster -> DungeonCore 設置成功");
      successCount++;
    }
  } catch (error) {
    console.log("❌ DungeonMaster -> DungeonCore 設置失敗:", error.message);
    failCount++;
  }
  
  // 4. 設置各個合約的 DungeonCore 連接
  const contractsToConnect = [
    { name: "Hero", address: V25_ADDRESSES.HERO, contractName: "Hero" },
    { name: "Relic", address: V25_ADDRESSES.RELIC, contractName: "Relic" },
    { name: "Party", address: V25_ADDRESSES.PARTY, contractName: "Party" },
    { name: "PlayerProfile", address: V25_ADDRESSES.PLAYERPROFILE, contractName: "PlayerProfile" },
    { name: "VIPStaking", address: V25_ADDRESSES.VIPSTAKING, contractName: "VIPStaking" },
    { name: "PlayerVault", address: V25_ADDRESSES.PLAYERVAULT, contractName: "PlayerVault" },
    { name: "AltarOfAscension", address: V25_ADDRESSES.ALTAROFASCENSION, contractName: "AltarOfAscension" },
  ];
  
  console.log("\n📋 Step 4: 設置各合約的 DungeonCore 連接");
  
  for (const contract of contractsToConnect) {
    try {
      const Contract = await ethers.getContractFactory(contract.contractName);
      const contractInstance = Contract.attach(contract.address);
      
      // 檢查是否有 dungeonCore 函數
      let currentCore;
      try {
        currentCore = await contractInstance.dungeonCore();
      } catch (e) {
        console.log(`⚠️ ${contract.name} 沒有 dungeonCore 函數，跳過`);
        skipCount++;
        continue;
      }
      
      if (currentCore.toLowerCase() === V25_ADDRESSES.DUNGEONCORE.toLowerCase()) {
        console.log(`✅ ${contract.name} -> DungeonCore 已設置`);
        skipCount++;
      } else {
        const tx = await contractInstance.setDungeonCore(V25_ADDRESSES.DUNGEONCORE);
        console.log(`🔄 ${contract.name} 交易哈希: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ ${contract.name} -> DungeonCore 設置成功`);
        successCount++;
      }
      
      // 稍微延遲避免 RPC 限制
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ ${contract.name} -> DungeonCore 設置失敗: ${error.message}`);
      failCount++;
    }
  }
  
  // 總結
  console.log("\n📊 合約連接設置完成統計:");
  console.log(`✅ 成功: ${successCount}`);
  console.log(`⏭️ 跳過: ${skipCount}`);
  console.log(`❌ 失敗: ${failCount}`);
  
  if (failCount === 0) {
    console.log("\n🎉 所有合約連接都已成功設置！");
    console.log("📋 現在可以執行地城初始化了");
  } else {
    console.log("\n⚠️ 部分合約連接未能設置，請檢查錯誤並重試");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * 部署修復的 PlayerProfile 合約
 * 
 * 修復內容：
 * - 添加 _mintProfile 內部函數避免權限檢查嵌套問題
 * - 讓 addExperience 可以正常為新玩家自動創建檔案
 */

const hre = require("hardhat");
const { ethers } = require("ethers");

const EXISTING_CONTRACTS = {
  DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13"
};

async function main() {
  console.log("🚀 部署修復的 PlayerProfile 合約...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`部署錢包: ${deployer.address}\n`);

  try {
    // 1. 部署新的 PlayerProfile 合約
    console.log("1. 部署 PlayerProfile 合約...");
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployer.address);
    await playerProfile.waitForDeployment();
    
    const playerProfileAddress = await playerProfile.getAddress();
    console.log(`✅ PlayerProfile 部署成功: ${playerProfileAddress}\n`);

    // 2. 設置 DungeonCore 地址
    console.log("2. 設置 DungeonCore 地址...");
    const tx1 = await playerProfile.setDungeonCore(EXISTING_CONTRACTS.DUNGEONCORE);
    await tx1.wait();
    console.log("✅ DungeonCore 地址設置成功\n");

    // 3. 設置 BaseURI
    console.log("3. 設置 BaseURI...");
    const baseURI = "https://dungeon-delvers-metadata-server.onrender.com/api/profile/";
    const tx2 = await playerProfile.setBaseURI(baseURI);
    await tx2.wait();
    console.log("✅ BaseURI 設置成功\n");

    // 4. 驗證合約配置
    console.log("4. 驗證合約配置...");
    const dungeonCoreAddr = await playerProfile.dungeonCore();
    console.log(`   DungeonCore 地址: ${dungeonCoreAddr}`);
    console.log(`   配置正確: ${dungeonCoreAddr.toLowerCase() === EXISTING_CONTRACTS.DUNGEONCORE.toLowerCase() ? '✅' : '❌'}\n`);

    // 5. 顯示需要的後續操作
    console.log("📋 後續操作:");
    console.log("1. 更新 DungeonCore 中的 PlayerProfile 地址:");
    console.log(`   DungeonCore(${EXISTING_CONTRACTS.DUNGEONCORE}).setPlayerProfile("${playerProfileAddress}")`);
    console.log("");
    console.log("2. 更新前端配置文件中的 PlayerProfile 地址");
    console.log("");
    console.log("3. 測試 addExperience 功能是否正常工作");

    console.log(`\n🎉 PlayerProfile 合約部署完成！`);
    console.log(`新地址: ${playerProfileAddress}`);

  } catch (error) {
    console.error("❌ 部署失敗:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
#!/usr/bin/env node

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 直接使用 ethers.js，繞過 hardhat-ethers
async function main() {
  console.log("V25 部署 - 使用原生 ethers.js\n");
  
  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("部署者:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 部署配置
  const contracts = {
    ORACLE: "0x9A0FC81b58004F78bD26efEB70E4Ff786bdCF2b4" // 已部署
  };
  
  try {
    // 部署 PlayerVault
    console.log("部署 PlayerVault...");
    
    // 讀取編譯後的合約
    const playerVaultPath = path.join(
      __dirname, 
      "../../artifacts/contracts/current/defi/PlayerVault.sol/PlayerVault.json"
    );
    const playerVaultJson = JSON.parse(fs.readFileSync(playerVaultPath, "utf8"));
    
    // 創建合約工廠
    const PlayerVaultFactory = new ethers.ContractFactory(
      playerVaultJson.abi,
      playerVaultJson.bytecode,
      wallet
    );
    
    // 部署
    console.log("發送交易...");
    const playerVault = await PlayerVaultFactory.deploy(wallet.address);
    
    console.log("交易 hash:", playerVault.deploymentTransaction().hash);
    console.log("等待確認...");
    
    await playerVault.waitForDeployment();
    const pvAddress = await playerVault.getAddress();
    
    console.log("✅ PlayerVault 部署成功:", pvAddress);
    contracts.PLAYERVAULT = pvAddress;
    
    // 繼續部署 DungeonCore
    console.log("\n部署 DungeonCore...");
    
    const dungeonCorePath = path.join(
      __dirname,
      "../../artifacts/contracts/current/core/DungeonCore.sol/DungeonCore.json"
    );
    const dungeonCoreJson = JSON.parse(fs.readFileSync(dungeonCorePath, "utf8"));
    
    const DungeonCoreFactory = new ethers.ContractFactory(
      dungeonCoreJson.abi,
      dungeonCoreJson.bytecode,
      wallet
    );
    
    const USDT_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
    
    const dungeonCore = await DungeonCoreFactory.deploy(
      wallet.address,
      USDT_ADDRESS,
      SOULSHARD_ADDRESS
    );
    
    console.log("交易 hash:", dungeonCore.deploymentTransaction().hash);
    console.log("等待確認...");
    
    await dungeonCore.waitForDeployment();
    const dcAddress = await dungeonCore.getAddress();
    
    console.log("✅ DungeonCore 部署成功:", dcAddress);
    contracts.DUNGEONCORE = dcAddress;
    
    // 輸出結果
    console.log("\n=== 部署結果 ===");
    console.log(JSON.stringify(contracts, null, 2));
    
    // 保存地址
    const outputPath = path.join(__dirname, "v25-deployed-addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(contracts, null, 2));
    console.log(`\n地址已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error("\n部署失敗:", error);
    process.exit(1);
  }
}

// 執行
main().catch(console.error);
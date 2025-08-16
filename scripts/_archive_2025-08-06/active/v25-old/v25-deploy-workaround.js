#!/usr/bin/env node

const hre = require("hardhat");

// 修改部署方式來避開 hardhat-ethers 的 bug
async function deployContractWorkaround(contractName, args = []) {
  console.log(`\n部署 ${contractName}...`);
  console.log(`參數: ${JSON.stringify(args)}`);
  
  try {
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    
    // 不使用 deploy()，而是手動構建交易
    const deployTx = await ContractFactory.getDeployTransaction(...args);
    
    // 手動發送交易
    const [deployer] = await hre.ethers.getSigners();
    const tx = await deployer.sendTransaction(deployTx);
    
    console.log(`交易已發送: ${tx.hash}`);
    
    // 等待交易確認
    const receipt = await tx.wait();
    console.log(`交易已確認，區塊: ${receipt.blockNumber}`);
    
    // 獲取合約地址
    const address = receipt.contractAddress;
    console.log(`✅ ${contractName} 部署成功: ${address}`);
    
    // 返回合約實例
    const contract = ContractFactory.attach(address);
    return { contract, address };
    
  } catch (error) {
    console.error(`❌ ${contractName} 部署失敗:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("開始 V25 部署（修復版 2）...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("餘額:", hre.ethers.formatEther(balance), "BNB\n");
  
  // 部署配置
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const ORACLE_ADDRESS = "0x9A0FC81b58004F78bD26efEB70E4Ff786bdCF2b4"; // 已部署
  const USDT_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
  
  const contracts = {
    ORACLE: { address: ORACLE_ADDRESS }
  };
  
  try {
    // 1. 部署 PlayerVault
    console.log("=== 部署 PlayerVault ===");
    const playerVault = await deployContractWorkaround("PlayerVault", [deployer.address]);
    contracts.PLAYERVAULT = playerVault;
    
    // 2. 部署 DungeonCore
    console.log("\n=== 部署 DungeonCore ===");
    const dungeonCore = await deployContractWorkaround("DungeonCore", [
      deployer.address,
      USDT_ADDRESS,
      SOULSHARD_ADDRESS
    ]);
    contracts.DUNGEONCORE = dungeonCore;
    
    // 3. 部署 DungeonStorage
    console.log("\n=== 部署 DungeonStorage ===");
    const dungeonStorage = await deployContractWorkaround("DungeonStorage", [deployer.address]);
    contracts.DUNGEONSTORAGE = dungeonStorage;
    
    // 繼續部署其他合約...
    console.log("\n=== 部署完成 ===");
    console.log("合約地址:");
    for (const [name, data] of Object.entries(contracts)) {
      console.log(`${name}: ${data.address}`);
    }
    
    // 保存結果
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'v25-deployed-addresses.json');
    fs.writeFileSync(outputPath, JSON.stringify(contracts, null, 2));
    console.log(`\n地址已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error("\n部署失敗:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
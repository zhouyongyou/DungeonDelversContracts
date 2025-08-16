#!/usr/bin/env node

const hre = require("hardhat");
const { ethers } = require("hardhat");

// 重要：避免 hardhat-ethers 的 bug
async function deployContract(contractName, args = []) {
  console.log(`\n部署 ${contractName}...`);
  console.log(`參數: ${JSON.stringify(args)}`);
  
  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    
    // 直接使用 ethers v6 的部署方式
    const contract = await ContractFactory.deploy(...args, {
      // 明確設置 gas 相關參數
      gasLimit: 3000000
    });
    
    // 等待部署
    const deployedContract = await contract.waitForDeployment();
    const address = await deployedContract.getAddress();
    
    console.log(`✅ ${contractName} 部署成功: ${address}`);
    
    return { contract: deployedContract, address };
  } catch (error) {
    console.error(`❌ ${contractName} 部署失敗:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("開始 V25 部署（修復版）...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 部署配置
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const UNISWAP_POOL = "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82";
  const USDT_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
  
  const contracts = {};
  
  try {
    // 1. 部署 Oracle
    console.log("=== 階段 1: 部署 Oracle ===");
    const oracle = await deployContract("Oracle_V22_Adaptive", [
      UNISWAP_POOL,
      SOULSHARD_ADDRESS,
      USDT_ADDRESS
    ]);
    contracts.ORACLE = oracle;
    
    // 2. 部署 PlayerVault
    console.log("\n=== 階段 2: 部署 PlayerVault ===");
    const playerVault = await deployContract("PlayerVault", [deployer.address]);
    contracts.PLAYERVAULT = playerVault;
    
    // 3. 部署 DungeonCore
    console.log("\n=== 階段 3: 部署 DungeonCore ===");
    const dungeonCore = await deployContract("DungeonCore", [
      deployer.address,
      USDT_ADDRESS,
      SOULSHARD_ADDRESS
    ]);
    contracts.DUNGEONCORE = dungeonCore;
    
    // 繼續部署其他合約...
    console.log("\n=== 部署完成 ===");
    console.log("合約地址:");
    for (const [name, data] of Object.entries(contracts)) {
      console.log(`${name}: ${data.address}`);
    }
    
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
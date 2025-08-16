#!/usr/bin/env node

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 載入 ABI
function loadContract(contractPath) {
  const fullPath = path.join(__dirname, "../../artifacts/contracts/current", contractPath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

async function deployContract(wallet, contractName, contractPath, args = []) {
  console.log(`\n部署 ${contractName}...`);
  console.log(`參數: ${JSON.stringify(args)}`);
  
  try {
    const contractJson = loadContract(contractPath);
    const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
    
    const contract = await factory.deploy(...args);
    console.log(`交易 hash: ${contract.deploymentTransaction().hash}`);
    console.log("等待確認...");
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`✅ ${contractName} 部署成功: ${address}`);
    
    return { contract, address };
  } catch (error) {
    console.error(`❌ ${contractName} 部署失敗:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("V25 完整部署 - 使用原生 ethers.js\n");
  
  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("部署者:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 已部署的合約
  const contracts = {
    SOULSHARD: { address: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF" },
    ORACLE: { address: "0x9A0FC81b58004F78bD26efEB70E4Ff786bdCF2b4" },
    PLAYERVAULT: { address: "0x318aF53C838A4021758D369882383dB44Dd7410c" },
    DUNGEONCORE: { address: "0xe8190CDF4E32BcCD97c68D14DDdEEB6c4CEcdF13" }
  };
  
  // 外部地址
  const USDT_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
  
  try {
    // 1. 部署 DungeonStorage
    console.log("=== 階段 1: 部署存儲合約 ===");
    const dungeonStorage = await deployContract(
      wallet,
      "DungeonStorage",
      "core/DungeonStorage.sol/DungeonStorage.json",
      [wallet.address]
    );
    contracts.DUNGEONSTORAGE = dungeonStorage;
    
    // 2. 部署 DungeonMaster
    const dungeonMaster = await deployContract(
      wallet,
      "DungeonMasterV2_Fixed",
      "core/DungeonMaster.sol/DungeonMasterV2_Fixed.json",
      [wallet.address]
    );
    contracts.DUNGEONMASTER = dungeonMaster;
    
    // 3. 部署 NFT 合約
    console.log("\n=== 階段 2: 部署 NFT 合約 ===");
    
    const hero = await deployContract(
      wallet,
      "Hero",
      "nft/Hero.sol/Hero.json",
      [wallet.address]
    );
    contracts.HERO = hero;
    
    const relic = await deployContract(
      wallet,
      "Relic",
      "nft/Relic.sol/Relic.json",
      [wallet.address]
    );
    contracts.RELIC = relic;
    
    const party = await deployContract(
      wallet,
      "PartyV3",
      "nft/Party.sol/PartyV3.json",
      [wallet.address]
    );
    contracts.PARTY = party;
    
    // 4. 部署功能合約
    console.log("\n=== 階段 3: 部署功能合約 ===");
    
    const vipStaking = await deployContract(
      wallet,
      "VIPStaking",
      "nft/VIPStaking.sol/VIPStaking.json",
      [wallet.address]
    );
    contracts.VIPSTAKING = vipStaking;
    
    const playerProfile = await deployContract(
      wallet,
      "PlayerProfile",
      "nft/PlayerProfile.sol/PlayerProfile.json",
      [wallet.address]
    );
    contracts.PLAYERPROFILE = playerProfile;
    
    const altar = await deployContract(
      wallet,
      "AltarOfAscensionV2Fixed",
      "core/AltarOfAscension.sol/AltarOfAscensionV2Fixed.json",
      [wallet.address]
    );
    contracts.ALTAROFASCENSION = altar;
    
    // 輸出結果
    console.log("\n=== 部署完成 ===");
    console.log("\n合約地址:");
    for (const [name, data] of Object.entries(contracts)) {
      console.log(`${name}: ${data.address}`);
    }
    
    // 保存地址
    const outputPath = path.join(__dirname, "v25-deployed-addresses-complete.json");
    fs.writeFileSync(outputPath, JSON.stringify(contracts, null, 2));
    console.log(`\n地址已保存到: ${outputPath}`);
    
    // 生成環境變數格式
    console.log("\n=== 環境變數格式 ===");
    for (const [name, data] of Object.entries(contracts)) {
      if (name !== 'SOULSHARD') { // SOULSHARD 已存在
        console.log(`${name}_ADDRESS=${data.address}`);
      }
    }
    
    // 生成配置更新腳本
    console.log("\n下一步:");
    console.log("1. 執行合約連接設置");
    console.log("2. 初始化遊戲參數");
    console.log("3. 驗證合約");
    console.log("4. 更新子圖和前端配置");
    
  } catch (error) {
    console.error("\n部署失敗:", error);
    
    // 保存部分結果
    const partialPath = path.join(__dirname, "v25-partial-deployment.json");
    fs.writeFileSync(partialPath, JSON.stringify(contracts, null, 2));
    console.log(`\n部分結果已保存到: ${partialPath}`);
    
    process.exit(1);
  }
}

// 執行
main().catch(console.error);
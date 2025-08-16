#!/usr/bin/env node

/**
 * 純 ethers.js VRF 合約部署
 * 避開 Hardhat ethers 包裝器問題
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// BSC 主網 RPC
const BSC_RPC = "https://bsc-dataseed1.binance.org/";

// 已部署的合約（重用）
const EXISTING_CONTRACTS = {
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD"
};

const USDT_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";

async function deployContract(wallet, contractName, ...args) {
  console.log(`\n📦 部署 ${contractName}...`);
  
  const contractPath = path.join(__dirname, `../../artifacts/contracts/current`);
  let artifactPath;
  
  // 找到合約的 artifact
  switch(contractName) {
    case 'DungeonCore':
      artifactPath = `${contractPath}/core/DungeonCore.sol/DungeonCore.json`;
      break;
    case 'DungeonStorage':
      artifactPath = `${contractPath}/core/DungeonStorage.sol/DungeonStorage.json`;
      break;
    case 'DungeonMaster':
      artifactPath = `${contractPath}/core/DungeonMaster.sol/DungeonMaster.json`;
      break;
    case 'Hero':
      artifactPath = `${contractPath}/nft/Hero.sol/Hero.json`;
      break;
    case 'Relic':
      artifactPath = `${contractPath}/nft/Relic.sol/Relic.json`;
      break;
    case 'PartyV3':
      artifactPath = `${contractPath}/nft/Party.sol/PartyV3.json`;
      break;
    case 'AltarOfAscension':
      artifactPath = `${contractPath}/core/AltarOfAscension.sol/AltarOfAscension.json`;
      break;
  }
  
  if (!fs.existsSync(artifactPath)) {
    console.error(`❌ 找不到合約 artifact: ${artifactPath}`);
    return null;
  }
  
  const contractJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  
  console.log(`構造參數: ${JSON.stringify(args)}`);
  
  const contract = await factory.deploy(...args);
  console.log(`交易哈希: ${contract.deploymentTransaction().hash}`);
  console.log(`等待確認...`);
  
  await contract.deploymentTransaction().wait(2);
  const address = await contract.getAddress();
  
  console.log(`✅ ${contractName} 部署成功: ${address}`);
  
  return { contract, address, abi: contractJson.abi };
}

async function main() {
  console.log("🚀 開始部署 VRF 支援合約到 BSC 主網...\n");
  
  // 設置 Provider 和 Wallet
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("部署賬戶:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("賬戶餘額:", ethers.formatEther(balance), "BNB");
  
  if (balance < ethers.parseEther("0.3")) {
    console.error("❌ 餘額不足，至少需要 0.3 BNB");
    process.exit(1);
  }
  
  const deployedContracts = { ...EXISTING_CONTRACTS };
  
  try {
    // 1. 部署 DungeonCore
    const dungeonCore = await deployContract(
      wallet, 
      'DungeonCore',
      wallet.address,
      USDT_ADDRESS,
      EXISTING_CONTRACTS.SOULSHARD
    );
    deployedContracts.DUNGEONCORE = dungeonCore.address;
    
    // 2. 部署 DungeonStorage
    const dungeonStorage = await deployContract(wallet, 'DungeonStorage', wallet.address);
    deployedContracts.DUNGEONSTORAGE = dungeonStorage.address;
    
    // 3. 部署 DungeonMaster
    const dungeonMaster = await deployContract(wallet, 'DungeonMaster', wallet.address);
    deployedContracts.DUNGEONMASTER = dungeonMaster.address;
    
    // 4. 部署 Hero
    const hero = await deployContract(wallet, 'Hero', wallet.address);
    deployedContracts.HERO = hero.address;
    
    // 5. 部署 Relic
    const relic = await deployContract(wallet, 'Relic', wallet.address);
    deployedContracts.RELIC = relic.address;
    
    // 6. 部署 Party
    const party = await deployContract(wallet, 'PartyV3', wallet.address);
    deployedContracts.PARTY = party.address;
    
    // 7. 部署 AltarOfAscension
    const altar = await deployContract(wallet, 'AltarOfAscension', wallet.address);
    deployedContracts.ALTAROFASCENSION = altar.address;
    
    console.log("\n✅ 所有合約部署完成！\n");
    
    // 設置 VRF
    console.log("🔧 設置 VRF 支援...\n");
    
    const vrfABI = [
      "function setVRFManager(address) external",
      "function authorizeContract(address) external"
    ];
    
    // 設置 Hero VRF
    const heroContract = new ethers.Contract(hero.address, vrfABI, wallet);
    await (await heroContract.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log("✅ Hero 設置 VRFManager");
    
    // 設置 Relic VRF
    const relicContract = new ethers.Contract(relic.address, vrfABI, wallet);
    await (await relicContract.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log("✅ Relic 設置 VRFManager");
    
    // 設置 DungeonMaster VRF
    const dmContract = new ethers.Contract(dungeonMaster.address, vrfABI, wallet);
    await (await dmContract.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log("✅ DungeonMaster 設置 VRFManager");
    
    // 設置 AltarOfAscension VRF
    const altarContract = new ethers.Contract(altar.address, vrfABI, wallet);
    await (await altarContract.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log("✅ AltarOfAscension 設置 VRFManager");
    
    // VRFManager 授權
    console.log("\n🔐 VRFManager 授權合約...\n");
    
    const vrfManager = new ethers.Contract(EXISTING_CONTRACTS.VRFMANAGER, vrfABI, wallet);
    
    await (await vrfManager.authorizeContract(hero.address)).wait();
    console.log("✅ 授權 Hero");
    
    await (await vrfManager.authorizeContract(relic.address)).wait();
    console.log("✅ 授權 Relic");
    
    await (await vrfManager.authorizeContract(dungeonMaster.address)).wait();
    console.log("✅ 授權 DungeonMaster");
    
    await (await vrfManager.authorizeContract(altar.address)).wait();
    console.log("✅ 授權 AltarOfAscension");
    
    // 設置合約連接
    console.log("\n🔗 設置合約連接...\n");
    
    // DungeonCore 設置
    const dcABI = [
      "function setOracle(address) external",
      "function setPlayerVault(address) external",
      "function setPlayerProfile(address) external",
      "function setVipStaking(address) external",
      "function setDungeonMaster(address) external",
      "function setAltarOfAscension(address) external",
      "function setHeroContract(address) external",
      "function setRelicContract(address) external",
      "function setPartyContract(address) external"
    ];
    
    const dcContract = new ethers.Contract(dungeonCore.address, dcABI, wallet);
    
    await (await dcContract.setOracle(EXISTING_CONTRACTS.ORACLE)).wait();
    await (await dcContract.setPlayerVault(EXISTING_CONTRACTS.PLAYERVAULT)).wait();
    await (await dcContract.setPlayerProfile(EXISTING_CONTRACTS.PLAYERPROFILE)).wait();
    await (await dcContract.setVipStaking(EXISTING_CONTRACTS.VIPSTAKING)).wait();
    await (await dcContract.setDungeonMaster(dungeonMaster.address)).wait();
    await (await dcContract.setAltarOfAscension(altar.address)).wait();
    await (await dcContract.setHeroContract(hero.address)).wait();
    await (await dcContract.setRelicContract(relic.address)).wait();
    await (await dcContract.setPartyContract(party.address)).wait();
    
    console.log("✅ DungeonCore 模組設置完成");
    
    // 設置各模組的 DungeonCore
    const moduleABI = ["function setDungeonCore(address) external"];
    
    // Hero
    const heroModule = new ethers.Contract(hero.address, moduleABI, wallet);
    await (await heroModule.setDungeonCore(dungeonCore.address)).wait();
    console.log("✅ Hero 設置 DungeonCore");
    
    // Relic
    const relicModule = new ethers.Contract(relic.address, moduleABI, wallet);
    await (await relicModule.setDungeonCore(dungeonCore.address)).wait();
    console.log("✅ Relic 設置 DungeonCore");
    
    // Party
    const partyModule = new ethers.Contract(party.address, moduleABI, wallet);
    await (await partyModule.setDungeonCore(dungeonCore.address)).wait();
    console.log("✅ Party 設置 DungeonCore");
    
    // DungeonMaster
    const dmModule = new ethers.Contract(dungeonMaster.address, moduleABI, wallet);
    await (await dmModule.setDungeonCore(dungeonCore.address)).wait();
    console.log("✅ DungeonMaster 設置 DungeonCore");
    
    // AltarOfAscension
    const altarModule = new ethers.Contract(altar.address, moduleABI, wallet);
    await (await altarModule.setDungeonCore(dungeonCore.address)).wait();
    console.log("✅ AltarOfAscension 設置 DungeonCore");
    
    // DungeonMaster & DungeonStorage
    const dsABI = ["function setDungeonStorage(address) external"];
    const dmStorageContract = new ethers.Contract(dungeonMaster.address, dsABI, wallet);
    await (await dmStorageContract.setDungeonStorage(dungeonStorage.address)).wait();
    
    const storageABI = ["function setLogicContract(address) external"];
    const storageContract = new ethers.Contract(dungeonStorage.address, storageABI, wallet);
    await (await storageContract.setLogicContract(dungeonMaster.address)).wait();
    
    console.log("✅ DungeonMaster <-> DungeonStorage 連接完成");
    
    // 保存部署信息
    const deploymentInfo = {
      network: "BSC Mainnet",
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: deployedContracts,
      vrfEnabled: true
    };
    
    const deploymentPath = path.join(__dirname, "../../deployments", `vrf-deployment-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📋 部署摘要:");
    console.log("================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    
    console.log("\n🎉 VRF 升級部署完成！");
    console.log("\n⚠️ 後續步驟：");
    console.log("1. 同步子圖 v3.6.1");
    console.log("2. 更新後端和前端配置");
    console.log("3. 初始化地城數據（如需要）");
    
  } catch (error) {
    console.error("\n❌ 部署失敗:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
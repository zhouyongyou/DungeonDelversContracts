#!/usr/bin/env node

/**
 * 繼續 VRF 部署 - 部署剩餘合約並設置連接
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// BSC 主網 RPC
const BSC_RPC = "https://bsc-dataseed1.binance.org/";

// 已部署的合約
const DEPLOYED_CONTRACTS = {
  // 現有合約
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
  
  // 剛剛部署的合約
  DUNGEONCORE: "0x67fFb53Cc9aEd4aBd426B666950463c3927d23c4",
  DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  DUNGEONMASTER: "0x6Ed7c6e341600bC7D789AA2392B934E31F99D07D",
  HERO: "0xfA8D78A9245F19B42529f7C17DFaA7152860aB5A",
  RELIC: "0xAd276F8629f48045EACEbf0c2a80Da84669714c9",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3"
};

async function deployContract(wallet, contractName, ...args) {
  console.log(`\n📦 部署 ${contractName}...`);
  
  const contractPath = path.join(__dirname, `../../artifacts/contracts/current`);
  let artifactPath;
  
  switch(contractName) {
    case 'PartyV3':
      artifactPath = `${contractPath}/nft/Party.sol/PartyV3.json`;
      break;
    case 'AltarOfAscension':
      artifactPath = `${contractPath}/core/AltarOfAscension.sol/AltarOfAscensionVRF.json`;
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
  console.log("🚀 繼續 VRF 部署...\n");
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("部署賬戶:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("賬戶餘額:", ethers.formatEther(balance), "BNB\n");
  
  const deployedContracts = { ...DEPLOYED_CONTRACTS };
  
  try {
    // Party 已經部署，跳過
    console.log("✅ Party 已部署:", deployedContracts.PARTY);
    
    // 部署 AltarOfAscension
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
    const heroContract = new ethers.Contract(deployedContracts.HERO, vrfABI, wallet);
    await (await heroContract.setVRFManager(deployedContracts.VRFMANAGER)).wait();
    console.log("✅ Hero 設置 VRFManager");
    
    // 設置 Relic VRF
    const relicContract = new ethers.Contract(deployedContracts.RELIC, vrfABI, wallet);
    await (await relicContract.setVRFManager(deployedContracts.VRFMANAGER)).wait();
    console.log("✅ Relic 設置 VRFManager");
    
    // 設置 DungeonMaster VRF
    const dmContract = new ethers.Contract(deployedContracts.DUNGEONMASTER, vrfABI, wallet);
    await (await dmContract.setVRFManager(deployedContracts.VRFMANAGER)).wait();
    console.log("✅ DungeonMaster 設置 VRFManager");
    
    // 設置 AltarOfAscension VRF
    const altarContract = new ethers.Contract(altar.address, vrfABI, wallet);
    await (await altarContract.setVRFManager(deployedContracts.VRFMANAGER)).wait();
    console.log("✅ AltarOfAscension 設置 VRFManager");
    
    // VRFManager 授權
    console.log("\n🔐 VRFManager 授權合約...\n");
    
    const vrfManager = new ethers.Contract(deployedContracts.VRFMANAGER, vrfABI, wallet);
    
    await (await vrfManager.authorizeContract(deployedContracts.HERO)).wait();
    console.log("✅ 授權 Hero");
    
    await (await vrfManager.authorizeContract(deployedContracts.RELIC)).wait();
    console.log("✅ 授權 Relic");
    
    await (await vrfManager.authorizeContract(deployedContracts.DUNGEONMASTER)).wait();
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
    
    const dcContract = new ethers.Contract(deployedContracts.DUNGEONCORE, dcABI, wallet);
    
    await (await dcContract.setOracle(deployedContracts.ORACLE)).wait();
    await (await dcContract.setPlayerVault(deployedContracts.PLAYERVAULT)).wait();
    await (await dcContract.setPlayerProfile(deployedContracts.PLAYERPROFILE)).wait();
    await (await dcContract.setVipStaking(deployedContracts.VIPSTAKING)).wait();
    await (await dcContract.setDungeonMaster(deployedContracts.DUNGEONMASTER)).wait();
    await (await dcContract.setAltarOfAscension(altar.address)).wait();
    await (await dcContract.setHeroContract(deployedContracts.HERO)).wait();
    await (await dcContract.setRelicContract(deployedContracts.RELIC)).wait();
    await (await dcContract.setPartyContract(deployedContracts.PARTY)).wait();
    
    console.log("✅ DungeonCore 模組設置完成");
    
    // 設置各模組的 DungeonCore
    const moduleABI = [
      "function setDungeonCore(address) external",
      "function setSoulShardToken(address) external",
      "function setAscensionAltarAddress(address) external",
      "function setHeroContract(address) external",
      "function setRelicContract(address) external"
    ];
    
    // PlayerVault
    const pvModule = new ethers.Contract(deployedContracts.PLAYERVAULT, moduleABI, wallet);
    await (await pvModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    console.log("✅ PlayerVault 設置 DungeonCore");
    
    // PlayerProfile
    const ppModule = new ethers.Contract(deployedContracts.PLAYERPROFILE, moduleABI, wallet);
    await (await ppModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    console.log("✅ PlayerProfile 設置 DungeonCore");
    
    // VIPStaking
    const vsModule = new ethers.Contract(deployedContracts.VIPSTAKING, moduleABI, wallet);
    await (await vsModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    console.log("✅ VIPStaking 設置 DungeonCore");
    
    // Hero
    const heroModule = new ethers.Contract(deployedContracts.HERO, moduleABI, wallet);
    await (await heroModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await heroModule.setSoulShardToken(deployedContracts.SOULSHARD)).wait();
    await (await heroModule.setAscensionAltarAddress(altar.address)).wait();
    console.log("✅ Hero 設置完成");
    
    // Relic
    const relicModule = new ethers.Contract(deployedContracts.RELIC, moduleABI, wallet);
    await (await relicModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await relicModule.setSoulShardToken(deployedContracts.SOULSHARD)).wait();
    await (await relicModule.setAscensionAltarAddress(altar.address)).wait();
    console.log("✅ Relic 設置完成");
    
    // Party
    const partyModule = new ethers.Contract(deployedContracts.PARTY, moduleABI, wallet);
    await (await partyModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await partyModule.setHeroContract(deployedContracts.HERO)).wait();
    await (await partyModule.setRelicContract(deployedContracts.RELIC)).wait();
    console.log("✅ Party 設置完成");
    
    // DungeonMaster
    const dmModule = new ethers.Contract(deployedContracts.DUNGEONMASTER, moduleABI, wallet);
    await (await dmModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await dmModule.setSoulShardToken(deployedContracts.SOULSHARD)).wait();
    console.log("✅ DungeonMaster 設置完成");
    
    // AltarOfAscension
    const altarModule = new ethers.Contract(altar.address, [
      "function setDungeonCore(address) external",
      "function setContracts(address,address,address) external"
    ], wallet);
    await (await altarModule.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await altarModule.setContracts(
      deployedContracts.DUNGEONCORE,
      deployedContracts.HERO,
      deployedContracts.RELIC
    )).wait();
    console.log("✅ AltarOfAscension 設置完成");
    
    // DungeonMaster & DungeonStorage
    const dsABI = ["function setDungeonStorage(address) external"];
    const dmStorageContract = new ethers.Contract(deployedContracts.DUNGEONMASTER, dsABI, wallet);
    await (await dmStorageContract.setDungeonStorage(deployedContracts.DUNGEONSTORAGE)).wait();
    
    const storageABI = ["function setLogicContract(address) external"];
    const storageContract = new ethers.Contract(deployedContracts.DUNGEONSTORAGE, storageABI, wallet);
    await (await storageContract.setLogicContract(deployedContracts.DUNGEONMASTER)).wait();
    
    console.log("✅ DungeonMaster <-> DungeonStorage 連接完成");
    
    // 保存部署信息
    const deploymentInfo = {
      network: "BSC Mainnet",
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        ...deployedContracts,
        ALTAROFASCENSION: altar.address
      },
      vrfEnabled: true
    };
    
    const deploymentPath = path.join(__dirname, "../../deployments", `vrf-complete-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    // 更新 master-config.json
    const masterConfigPath = path.join(__dirname, "../../config/master-config.json");
    const masterConfig = {
      version: "V25-VRF",
      lastUpdated: new Date().toISOString(),
      contracts: {
        mainnet: {
          SOULSHARD_ADDRESS: deployedContracts.SOULSHARD,
          ORACLE_ADDRESS: deployedContracts.ORACLE,
          PLAYERVAULT_ADDRESS: deployedContracts.PLAYERVAULT,
          VIPSTAKING_ADDRESS: deployedContracts.VIPSTAKING,
          PLAYERPROFILE_ADDRESS: deployedContracts.PLAYERPROFILE,
          VRFMANAGER_ADDRESS: deployedContracts.VRFMANAGER,
          DUNGEONCORE_ADDRESS: deployedContracts.DUNGEONCORE,
          DUNGEONSTORAGE_ADDRESS: deployedContracts.DUNGEONSTORAGE,
          DUNGEONMASTER_ADDRESS: deployedContracts.DUNGEONMASTER,
          HERO_ADDRESS: deployedContracts.HERO,
          RELIC_ADDRESS: deployedContracts.RELIC,
          PARTY_ADDRESS: deployedContracts.PARTY,
          ALTAROFASCENSION_ADDRESS: altar.address
        }
      },
      vrfEnabled: true
    };
    fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
    
    console.log("\n📋 最終部署摘要:");
    console.log("================");
    console.log("SOULSHARD:", deployedContracts.SOULSHARD);
    console.log("ORACLE:", deployedContracts.ORACLE);
    console.log("PLAYERVAULT:", deployedContracts.PLAYERVAULT);
    console.log("DUNGEONCORE:", deployedContracts.DUNGEONCORE);
    console.log("DUNGEONSTORAGE:", deployedContracts.DUNGEONSTORAGE);
    console.log("DUNGEONMASTER:", deployedContracts.DUNGEONMASTER);
    console.log("HERO:", deployedContracts.HERO);
    console.log("RELIC:", deployedContracts.RELIC);
    console.log("PARTY:", deployedContracts.PARTY);
    console.log("VIPSTAKING:", deployedContracts.VIPSTAKING);
    console.log("PLAYERPROFILE:", deployedContracts.PLAYERPROFILE);
    console.log("ALTAROFASCENSION:", altar.address);
    console.log("VRFMANAGER:", deployedContracts.VRFMANAGER);
    
    console.log("\n🎉 VRF 升級部署完成！");
    console.log("\n⚠️ 後續步驟：");
    console.log("1. 同步子圖 v3.6.1:");
    console.log("   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
    console.log("   npm run codegen && npm run build");
    console.log("   npm run deploy:studio -- --version-label v3.6.1");
    console.log("2. 同步後端:");
    console.log("   cd /Users/sotadic/Documents/dungeon-delvers-metadata-server");
    console.log("   更新 .env 文件");
    console.log("3. 同步前端:");
    console.log("   cd /Users/sotadic/Documents/GitHub/DungeonDelvers");
    console.log("   更新 src/config/contracts.ts");
    
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
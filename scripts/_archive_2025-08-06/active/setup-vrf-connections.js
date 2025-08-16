#!/usr/bin/env node

/**
 * 設置 VRF 合約連接
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// BSC 主網 RPC
const BSC_RPC = "https://bsc-dataseed1.binance.org/";

// 所有部署的合約
const DEPLOYED_CONTRACTS = {
  // 現有合約
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
  
  // 新部署的 VRF 合約
  DUNGEONCORE: "0x67fFb53Cc9aEd4aBd426B666950463c3927d23c4",
  DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  DUNGEONMASTER: "0x6Ed7c6e341600bC7D789AA2392B934E31F99D07D",
  HERO: "0xfA8D78A9245F19B42529f7C17DFaA7152860aB5A",
  RELIC: "0xAd276F8629f48045EACEbf0c2a80Da84669714c9",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  ALTAROFASCENSION: "0xd2C541F5ed07fD0ebC7F2300244E23F6e1a7b88a"
};

async function main() {
  console.log("🔗 設置 VRF 合約連接...\n");
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("執行賬戶:", wallet.address);
  console.log("Hero 合約:", DEPLOYED_CONTRACTS.HERO);
  console.log("VRFManager:", DEPLOYED_CONTRACTS.VRFMANAGER);
  console.log("");

  try {
    // 先設置 VRF 授權
    console.log("🔐 VRFManager 授權合約...\n");
    
    const vrfABI = [
      "function authorizeContract(address) external",
      "function authorizedContracts(address) view returns (bool)"
    ];
    
    const vrfManager = new ethers.Contract(DEPLOYED_CONTRACTS.VRFMANAGER, vrfABI, wallet);
    
    // 檢查並授權 Hero
    const heroAuthorized = await vrfManager.authorizedContracts(DEPLOYED_CONTRACTS.HERO);
    if (!heroAuthorized) {
      console.log("授權 Hero...");
      await (await vrfManager.authorizeContract(DEPLOYED_CONTRACTS.HERO)).wait();
      console.log("✅ Hero 已授權");
    } else {
      console.log("✅ Hero 已經授權");
    }
    
    // 檢查並授權 Relic
    const relicAuthorized = await vrfManager.authorizedContracts(DEPLOYED_CONTRACTS.RELIC);
    if (!relicAuthorized) {
      console.log("授權 Relic...");
      await (await vrfManager.authorizeContract(DEPLOYED_CONTRACTS.RELIC)).wait();
      console.log("✅ Relic 已授權");
    } else {
      console.log("✅ Relic 已經授權");
    }
    
    // 檢查並授權 DungeonMaster
    const dmAuthorized = await vrfManager.authorizedContracts(DEPLOYED_CONTRACTS.DUNGEONMASTER);
    if (!dmAuthorized) {
      console.log("授權 DungeonMaster...");
      await (await vrfManager.authorizeContract(DEPLOYED_CONTRACTS.DUNGEONMASTER)).wait();
      console.log("✅ DungeonMaster 已授權");
    } else {
      console.log("✅ DungeonMaster 已經授權");
    }
    
    // 檢查並授權 AltarOfAscension
    const altarAuthorized = await vrfManager.authorizedContracts(DEPLOYED_CONTRACTS.ALTAROFASCENSION);
    if (!altarAuthorized) {
      console.log("授權 AltarOfAscension...");
      await (await vrfManager.authorizeContract(DEPLOYED_CONTRACTS.ALTAROFASCENSION)).wait();
      console.log("✅ AltarOfAscension 已授權");
    } else {
      console.log("✅ AltarOfAscension 已經授權");
    }
    
    // 設置 VRF Manager 地址
    console.log("\n🔧 設置 VRF Manager 地址...\n");
    
    const setVrfABI = [
      "function setVRFManager(address) external",
      "function vrfManager() view returns (address)"
    ];
    
    // Hero
    const heroContract = new ethers.Contract(DEPLOYED_CONTRACTS.HERO, setVrfABI, wallet);
    const heroVrf = await heroContract.vrfManager();
    if (heroVrf === "0x0000000000000000000000000000000000000000") {
      console.log("設置 Hero VRFManager...");
      await (await heroContract.setVRFManager(DEPLOYED_CONTRACTS.VRFMANAGER)).wait();
      console.log("✅ Hero VRFManager 設置完成");
    } else {
      console.log("✅ Hero VRFManager 已設置:", heroVrf);
    }
    
    // Relic
    const relicContract = new ethers.Contract(DEPLOYED_CONTRACTS.RELIC, setVrfABI, wallet);
    const relicVrf = await relicContract.vrfManager();
    if (relicVrf === "0x0000000000000000000000000000000000000000") {
      console.log("設置 Relic VRFManager...");
      await (await relicContract.setVRFManager(DEPLOYED_CONTRACTS.VRFMANAGER)).wait();
      console.log("✅ Relic VRFManager 設置完成");
    } else {
      console.log("✅ Relic VRFManager 已設置:", relicVrf);
    }
    
    // DungeonMaster
    const dmContract = new ethers.Contract(DEPLOYED_CONTRACTS.DUNGEONMASTER, setVrfABI, wallet);
    const dmVrf = await dmContract.vrfManager();
    if (dmVrf === "0x0000000000000000000000000000000000000000") {
      console.log("設置 DungeonMaster VRFManager...");
      await (await dmContract.setVRFManager(DEPLOYED_CONTRACTS.VRFMANAGER)).wait();
      console.log("✅ DungeonMaster VRFManager 設置完成");
    } else {
      console.log("✅ DungeonMaster VRFManager 已設置:", dmVrf);
    }
    
    // AltarOfAscension
    const altarContract = new ethers.Contract(DEPLOYED_CONTRACTS.ALTAROFASCENSION, setVrfABI, wallet);
    const altarVrf = await altarContract.vrfManager();
    if (altarVrf === "0x0000000000000000000000000000000000000000") {
      console.log("設置 AltarOfAscension VRFManager...");
      await (await altarContract.setVRFManager(DEPLOYED_CONTRACTS.VRFMANAGER)).wait();
      console.log("✅ AltarOfAscension VRFManager 設置完成");
    } else {
      console.log("✅ AltarOfAscension VRFManager 已設置:", altarVrf);
    }
    
    console.log("\n✅ VRF 設置完成！");
    
  } catch (error) {
    console.error("\n❌ 設置失敗:", error.message);
    
    // 如果是權限錯誤，提示檢查合約所有者
    if (error.message.includes("0x118cdaa7")) {
      console.log("\n⚠️ 權限錯誤：請確認你是合約的所有者");
      console.log("當前賬戶:", wallet.address);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
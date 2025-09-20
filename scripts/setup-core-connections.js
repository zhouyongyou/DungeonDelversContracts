#!/usr/bin/env node
/**
 * 🎮 DungeonDelvers 核心連接設置腳本
 *
 * 功能：建立所有合約與 DungeonCore 的雙向連接
 * 執行：node scripts/setup-core-connections.js
 *
 * ⚠️  執行前請確認：
 * 1. 私鑰已設置在 .env 文件中
 * 2. RPC 連接正常
 * 3. 部署者有足夠的 BNB 支付 Gas
 */

const { ethers } = require("hardhat");
require('dotenv').config();

// 🎯 新部署的合約地址
const ADDRESSES = {
    // 核心系統
    DUNGEONCORE:        "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b",
    DUNGEONMASTER:      "0xa573ccf8332a5b1e830ea04a87856a28c99d9b53",
    DUNGEONSTORAGE:     "0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791",
    ALTAROFASCENSION:   "0x1357c546ce8cd529a1914e53f98405e1ebfbfc53",
    VRF_MANAGER_V2PLUS: "0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c",

    // NFT 系統
    HERO:               "0x52a0ba2a7efb9519b73e671d924f03575fa64269",
    RELIC:              "0x04c6bc2548b9f5c38be2be0902259d428f1fec2b",
    PARTY:              "0x73953a4dac5339b28e13c38294e758655e62dfde",

    // 玩家系統
    PLAYERPROFILE:      "0xea827e472937abd1117f0d4104a76e173724a061",
    VIPSTAKING:         "0xd82ef4be9e6d037140bd54afa04be983673637fb",
    PLAYERVAULT:        "0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0",

    // 重複使用的合約 (已配置)
    ORACLE:             "0x21928de992cb31ede864b62bc94002fb449c2738",
    SOULSHARD:          "0x1a98769b8034d400745cc658dc204cd079de36fa",
    USD1:               "0x916a2a1eb605e88561139c56af0698de241169f2",
};

async function main() {
    console.log("🎮 開始 DungeonDelvers 核心連接設置...");
    console.log("=" * 50);

    // 獲取部署者帳戶
    const [deployer] = await ethers.getSigners();
    console.log(`📝 部署者地址: ${deployer.address}`);

    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`💰 BNB 餘額: ${ethers.formatEther(balance)} BNB`);

    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
        console.log("⚠️  警告：BNB 餘額可能不足以支付 Gas 費用");
    }

    console.log("\n🔄 階段 1: 在 DungeonCore 中設置所有衛星合約...");

    try {
        // 連接 DungeonCore 合約
        const DungeonCore = await ethers.getContractFactory("DungeonCore");
        const dungeonCore = DungeonCore.attach(ADDRESSES.DUNGEONCORE);

        // 設置 NFT 系統地址
        console.log("📍 設置 NFT 系統合約...");
        await dungeonCore.setHeroContract(ADDRESSES.HERO);
        console.log(`✅ Hero 合約已設置: ${ADDRESSES.HERO}`);

        await dungeonCore.setRelicContract(ADDRESSES.RELIC);
        console.log(`✅ Relic 合約已設置: ${ADDRESSES.RELIC}`);

        await dungeonCore.setPartyContract(ADDRESSES.PARTY);
        console.log(`✅ Party 合約已設置: ${ADDRESSES.PARTY}`);

        // 設置玩家系統地址
        console.log("\n📍 設置玩家系統合約...");
        await dungeonCore.setPlayerProfile(ADDRESSES.PLAYERPROFILE);
        console.log(`✅ PlayerProfile 合約已設置: ${ADDRESSES.PLAYERPROFILE}`);

        await dungeonCore.setVipStaking(ADDRESSES.VIPSTAKING);
        console.log(`✅ VIPStaking 合約已設置: ${ADDRESSES.VIPSTAKING}`);

        await dungeonCore.setPlayerVault(ADDRESSES.PLAYERVAULT);
        console.log(`✅ PlayerVault 合約已設置: ${ADDRESSES.PLAYERVAULT}`);

        // 設置遊戲系統地址
        console.log("\n📍 設置遊戲系統合約...");
        await dungeonCore.setDungeonMaster(ADDRESSES.DUNGEONMASTER);
        console.log(`✅ DungeonMaster 合約已設置: ${ADDRESSES.DUNGEONMASTER}`);

        await dungeonCore.setAltarOfAscension(ADDRESSES.ALTAROFASCENSION);
        console.log(`✅ AltarOfAscension 合約已設置: ${ADDRESSES.ALTAROFASCENSION}`);

        await dungeonCore.setVRFManager(ADDRESSES.VRF_MANAGER_V2PLUS);
        console.log(`✅ VRFManager 合約已設置: ${ADDRESSES.VRF_MANAGER_V2PLUS}`);

        await dungeonCore.setDungeonStorage(ADDRESSES.DUNGEONSTORAGE);
        console.log(`✅ DungeonStorage 合約已設置: ${ADDRESSES.DUNGEONSTORAGE}`);

        console.log("\n🔄 階段 2: 在所有衛星合約中設置 DungeonCore 地址...");

        // NFT 系統
        console.log("📍 配置 NFT 系統合約...");
        const Hero = await ethers.getContractFactory("Hero");
        const heroContract = Hero.attach(ADDRESSES.HERO);
        await heroContract.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ Hero → DungeonCore 連接已建立`);

        const Relic = await ethers.getContractFactory("Relic");
        const relicContract = Relic.attach(ADDRESSES.RELIC);
        await relicContract.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ Relic → DungeonCore 連接已建立`);

        const Party = await ethers.getContractFactory("Party");
        const partyContract = Party.attach(ADDRESSES.PARTY);
        await partyContract.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ Party → DungeonCore 連接已建立`);

        // 玩家系統
        console.log("\n📍 配置玩家系統合約...");
        const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
        const playerProfile = PlayerProfile.attach(ADDRESSES.PLAYERPROFILE);
        await playerProfile.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ PlayerProfile → DungeonCore 連接已建立`);

        const VIPStaking = await ethers.getContractFactory("VIPStaking");
        const vipStaking = VIPStaking.attach(ADDRESSES.VIPSTAKING);
        await vipStaking.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ VIPStaking → DungeonCore 連接已建立`);

        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = PlayerVault.attach(ADDRESSES.PLAYERVAULT);
        await playerVault.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ PlayerVault → DungeonCore 連接已建立`);

        // 遊戲系統
        console.log("\n📍 配置遊戲系統合約...");
        const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = DungeonMaster.attach(ADDRESSES.DUNGEONMASTER);
        await dungeonMaster.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ DungeonMaster → DungeonCore 連接已建立`);

        const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
        const altarOfAscension = AltarOfAscension.attach(ADDRESSES.ALTAROFASCENSION);
        await altarOfAscension.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ AltarOfAscension → DungeonCore 連接已建立`);

        const VRFManager = await ethers.getContractFactory("VRFConsumerV2Plus");
        const vrfManager = VRFManager.attach(ADDRESSES.VRF_MANAGER_V2PLUS);
        await vrfManager.setDungeonCore(ADDRESSES.DUNGEONCORE);
        console.log(`✅ VRFManager → DungeonCore 連接已建立`);

        console.log("\n🔄 階段 3: 設置 VRF 授權...");

        // 授權需要隨機數的合約
        await vrfManager.setAuthorizedContract(ADDRESSES.DUNGEONMASTER, true);
        console.log(`✅ DungeonMaster 已獲得 VRF 授權`);

        await vrfManager.setAuthorizedContract(ADDRESSES.ALTAROFASCENSION, true);
        console.log(`✅ AltarOfAscension 已獲得 VRF 授權`);

        console.log("\n🎉 核心連接設置完成！");
        console.log("=" * 50);
        console.log("📊 設置摘要：");
        console.log(`  • DungeonCore 已連接 10 個衛星合約`);
        console.log(`  • 8 個衛星合約已連接回 DungeonCore`);
        console.log(`  • VRF 已授權 2 個遊戲合約`);
        console.log(`  • 總共執行 ${10 + 8 + 2} 個設置交易`);

        console.log("\n📝 後續步驟：");
        console.log("  1. 執行 'node scripts/verify-integrations.js' 驗證連接");
        console.log("  2. 測試基本功能 (鑄造 NFT、創建隊伍等)");
        console.log("  3. 更新前端和子圖配置");

    } catch (error) {
        console.error("\n❌ 設置過程中發生錯誤：", error.message);
        console.error("\n🔍 錯誤詳情：", error);
        process.exit(1);
    }
}

// 執行腳本
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 腳本執行失敗：", error);
            process.exit(1);
        });
}

module.exports = { main, ADDRESSES };
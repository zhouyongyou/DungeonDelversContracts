// scripts/deploy-v3-complete.ts
// V3 完整重新部署腳本 - 移除疲勞系統

import { ethers, run, network } from "hardhat";
import { BaseContract } from "ethers";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

// =================================================================
// Section: 輔助函式
// =================================================================

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);
const logWarning = (message: string) => console.log(`\x1b[33m${message}\x1b[0m`);

// 部署記錄
interface DeploymentRecord {
    timestamp: string;
    network: string;
    deployer: string;
    contracts: { [name: string]: string };
}

// =================================================================
// Section: 主部署函式
// =================================================================

async function main() {
    log("🚀 正在部署 Dungeon Delvers V3 完整合約套件...");
    log("📌 版本特性：已完全移除疲勞系統");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);
    logInfo(`鏈 ID: ${network.config.chainId}`);

    // 檢查餘額
    const balance = await ethers.provider.getBalance(deployer.address);
    logInfo(`部署者餘額: ${ethers.formatEther(balance)} BNB`);

    // --- 步驟 0: 驗證環境變數 ---
    log("步驟 0: 驗證環境變數...");

    const {
        FINAL_OWNER_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS,
        USD_TOKEN_ADDRESS,
        POOL_ADDRESS,
        METADATA_SERVER_BASE_URL,
        FRONTEND_BASE_URL,
        DUNGEONMASTERWALLET_ADDRESS
    } = process.env;

    if (!SOUL_SHARD_TOKEN_ADDRESS || !USD_TOKEN_ADDRESS || !POOL_ADDRESS || 
        !METADATA_SERVER_BASE_URL || !FRONTEND_BASE_URL || !DUNGEONMASTERWALLET_ADDRESS) {
        throw new Error("❌ 錯誤：請確保 .env 檔案中包含所有必要的環境變數");
    }
    
    const finalOwner = FINAL_OWNER_ADDRESS || deployer.address;
    
    logInfo(`最終擁有者: ${finalOwner}`);
    logInfo(`SoulShard 代幣: ${SOUL_SHARD_TOKEN_ADDRESS}`);
    logInfo(`USD 代幣: ${USD_TOKEN_ADDRESS}`);
    logInfo(`流動性池: ${POOL_ADDRESS}`);
    logInfo(`DungeonMaster 錢包: ${DUNGEONMASTERWALLET_ADDRESS}`);
    logInfo(`元數據 API: ${METADATA_SERVER_BASE_URL}`);
    logInfo(`前端網站: ${FRONTEND_BASE_URL}`);

    // 部署記錄
    const deployedContracts: { [name: string]: string } = {};
    const newEnvVars: string[] = [];

    // --- 步驟 1: 部署 Oracle ---
    log("步驟 1: 部署 Oracle...");
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(POOL_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS);
    await oracle.waitForDeployment();
    deployedContracts.Oracle = await oracle.getAddress();
    logSuccess(`✅ Oracle 已部署至: ${deployedContracts.Oracle}`);

    // --- 步驟 2: 部署存儲合約 ---
    log("步驟 2: 部署 DungeonStorage...");
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployer.address);
    await dungeonStorage.waitForDeployment();
    deployedContracts.DungeonStorage = await dungeonStorage.getAddress();
    logSuccess(`✅ DungeonStorage 已部署至: ${deployedContracts.DungeonStorage}`);

    // --- 步驟 3: 部署玩家金庫 ---
    log("步驟 3: 部署 PlayerVault...");
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployer.address);
    await playerVault.waitForDeployment();
    deployedContracts.PlayerVault = await playerVault.getAddress();
    logSuccess(`✅ PlayerVault 已部署至: ${deployedContracts.PlayerVault}`);

    // --- 步驟 4: 部署升星祭壇 ---
    log("步驟 4: 部署 AltarOfAscension...");
    const AltarOfAscension = await ethers.getContractFactory("contracts/AltarOfAscension.sol:AltarOfAscension");
    const altarOfAscension = await AltarOfAscension.deploy(deployer.address);
    await altarOfAscension.waitForDeployment();
    deployedContracts.AltarOfAscension = await altarOfAscension.getAddress();
    logSuccess(`✅ AltarOfAscension 已部署至: ${deployedContracts.AltarOfAscension}`);

    // --- 步驟 5: 部署 DungeonMaster (V3 版本) ---
    log("步驟 5: 部署 DungeonMaster V3...");
    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = await DungeonMaster.deploy(deployer.address);
    await dungeonMaster.waitForDeployment();
    deployedContracts.DungeonMaster = await dungeonMaster.getAddress();
    logSuccess(`✅ DungeonMaster V3 已部署至: ${deployedContracts.DungeonMaster}`);

    // --- 步驟 6: 部署 NFT 合約 ---
    log("步驟 6: 部署 Hero NFT...");
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    await hero.waitForDeployment();
    deployedContracts.Hero = await hero.getAddress();
    logSuccess(`✅ Hero 已部署至: ${deployedContracts.Hero}`);

    log("步驟 7: 部署 Relic NFT...");
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    await relic.waitForDeployment();
    deployedContracts.Relic = await relic.getAddress();
    logSuccess(`✅ Relic 已部署至: ${deployedContracts.Relic}`);

    log("步驟 8: 部署 Party NFT (V3 版本)...");
    const Party = await ethers.getContractFactory("Party");
    const party = await Party.deploy(deployer.address);
    await party.waitForDeployment();
    deployedContracts.Party = await party.getAddress();
    logSuccess(`✅ Party V3 已部署至: ${deployedContracts.Party}`);

    // --- 步驟 9: 部署 VIPStaking ---
    log("步驟 9: 部署 VIPStaking...");
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployer.address);
    await vipStaking.waitForDeployment();
    deployedContracts.VIPStaking = await vipStaking.getAddress();
    logSuccess(`✅ VIPStaking 已部署至: ${deployedContracts.VIPStaking}`);

    // --- 步驟 10: 部署 PlayerProfile ---
    log("步驟 10: 部署 PlayerProfile...");
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployer.address);
    await playerProfile.waitForDeployment();
    deployedContracts.PlayerProfile = await playerProfile.getAddress();
    logSuccess(`✅ PlayerProfile 已部署至: ${deployedContracts.PlayerProfile}`);

    // --- 步驟 11: 部署 DungeonCore ---
    log("步驟 11: 部署 DungeonCore...");
    const DungeonCore = await ethers.getContractFactory("DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployer.address, USD_TOKEN_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS);
    await dungeonCore.waitForDeployment();
    deployedContracts.DungeonCore = await dungeonCore.getAddress();
    logSuccess(`✅ DungeonCore 已部署至: ${deployedContracts.DungeonCore}`);

    // --- 步驟 12: 設定合約關聯 ---
    log("步驟 12: 設定合約間的關聯...");
    
    logInfo("12.1: 設定 DungeonCore 的所有模組...");
    await (await dungeonCore.setOracle(deployedContracts.Oracle)).wait();
    await (await dungeonCore.setPlayerVault(deployedContracts.PlayerVault)).wait();
    await (await dungeonCore.setDungeonMaster(deployedContracts.DungeonMaster)).wait();
    await (await dungeonCore.setAltarOfAscension(deployedContracts.AltarOfAscension)).wait();
    await (await dungeonCore.setHeroContract(deployedContracts.Hero)).wait();
    await (await dungeonCore.setRelicContract(deployedContracts.Relic)).wait();
    await (await dungeonCore.setPartyContract(deployedContracts.Party)).wait();
    await (await dungeonCore.setVipStaking(deployedContracts.VIPStaking)).wait();
    await (await dungeonCore.setPlayerProfile(deployedContracts.PlayerProfile)).wait();
    logSuccess("✅ DungeonCore 模組設定完成");

    logInfo("12.2: 設定各模組的依賴...");
    // DungeonStorage
    await (await dungeonStorage.setLogicContract(deployedContracts.DungeonMaster)).wait();
    
    // Hero
    await (await hero.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await hero.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await hero.setAscensionAltarAddress(deployedContracts.AltarOfAscension)).wait();
    
    // Relic
    await (await relic.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await relic.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await relic.setAscensionAltarAddress(deployedContracts.AltarOfAscension)).wait();
    
    // Party
    await (await party.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await party.setHeroContract(deployedContracts.Hero)).wait();
    await (await party.setRelicContract(deployedContracts.Relic)).wait();
    
    // PlayerVault
    await (await playerVault.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await playerVault.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    
    // AltarOfAscension
    await (await altarOfAscension.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await altarOfAscension.setHeroContract(deployedContracts.Hero)).wait();
    await (await altarOfAscension.setRelicContract(deployedContracts.Relic)).wait();
    
    // DungeonMaster
    await (await dungeonMaster.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await dungeonMaster.setDungeonStorage(deployedContracts.DungeonStorage)).wait();
    await (await dungeonMaster.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    
    // VIPStaking
    await (await vipStaking.setDungeonCore(deployedContracts.DungeonCore)).wait();
    await (await vipStaking.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    
    // PlayerProfile
    await (await playerProfile.setDungeonCore(deployedContracts.DungeonCore)).wait();
    
    logSuccess("✅ 所有模組依賴設定完成");

    // --- 步驟 13: 設定 BaseURI ---
    log("步驟 13: 設定 NFT 合約的 BaseURI...");
    const nftContracts = [
        { name: "Hero", contract: hero },
        { name: "Relic", contract: relic },
        { name: "Party", contract: party },
        { name: "VIPStaking", contract: vipStaking },
        { name: "PlayerProfile", contract: playerProfile }
    ];

    for (const { name, contract } of nftContracts) {
        const uri = `${METADATA_SERVER_BASE_URL}/api/${name.toLowerCase()}/`;
        logInfo(`設定 ${name} BaseURI: ${uri}`);
        await (await contract.setBaseURI(uri)).wait();
    }
    logSuccess("✅ 所有 BaseURI 設定完成");

    // --- 步驟 14: 設定 Collection URI ---
    log("步驟 14: 設定 Collection 元數據 URI...");
    const collectionMappings = {
        "Hero": "hero-collection.json",
        "Relic": "relic-collection.json",
        "Party": "party-collection.json",
        "VIPStaking": "vip-staking-collection.json",
        "PlayerProfile": "player-profile-collection.json"
    };

    for (const { name, contract } of nftContracts) {
        if (typeof contract.setContractURI === 'function') {
            const collectionFile = collectionMappings[name as keyof typeof collectionMappings];
            const collectionURI = `${FRONTEND_BASE_URL}/metadata/${collectionFile}`;
            logInfo(`設定 ${name} Collection URI: ${collectionURI}`);
            await (await contract.setContractURI(collectionURI)).wait();
        }
    }
    logSuccess("✅ 所有 Collection URI 設定完成");

    // --- 步驟 15: 設定初始遊戲參數 ---
    log("步驟 15: 設定初始遊戲參數...");
    
    // 設定平台費用
    await (await hero.setPlatformFee(ethers.parseEther("0.0003"))).wait();
    await (await relic.setPlatformFee(ethers.parseEther("0.0003"))).wait();
    await (await party.setPlatformFee(ethers.parseEther("0.001"))).wait();
    
    // VIP 質押參數
    await (await vipStaking.setUnstakeCooldown(15)).wait(); // 15 秒測試用
    logWarning("⚠️ VIP 解質押冷卻期設為 15 秒（測試用），正式環境請調整為 7-14 天");
    
    logSuccess("✅ 初始遊戲參數設定完成");

    // --- 步驟 16: 生成部署記錄 ---
    log("步驟 16: 生成部署記錄...");
    
    const deploymentRecord: DeploymentRecord = {
        timestamp: new Date().toISOString(),
        network: network.name,
        deployer: deployer.address,
        contracts: deployedContracts
    };
    
    const recordPath = path.join(__dirname, "..", "deployments", `deployment-v3-${network.name}-${Date.now()}.json`);
    const deploymentDir = path.dirname(recordPath);
    
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    logSuccess(`✅ 部署記錄已保存至: ${recordPath}`);

    // --- 步驟 17: 生成環境變數 ---
    log("步驟 17: 生成環境變數...");
    
    for (const [name, address] of Object.entries(deployedContracts)) {
        newEnvVars.push(`VITE_MAINNET_${name.toUpperCase()}_ADDRESS=${address}`);
    }

    // --- 步驟 18: 驗證合約 ---
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 18: 驗證合約（等待 30 秒）...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        const contractsToVerify = [
            { name: "Oracle", address: deployedContracts.Oracle, args: [POOL_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS] },
            { name: "DungeonStorage", address: deployedContracts.DungeonStorage, args: [deployer.address] },
            { name: "PlayerVault", address: deployedContracts.PlayerVault, args: [deployer.address] },
            { name: "AltarOfAscension", address: deployedContracts.AltarOfAscension, args: [deployer.address] },
            { name: "DungeonMaster", address: deployedContracts.DungeonMaster, args: [deployer.address] },
            { name: "Hero", address: deployedContracts.Hero, args: [deployer.address] },
            { name: "Relic", address: deployedContracts.Relic, args: [deployer.address] },
            { name: "Party", address: deployedContracts.Party, args: [deployer.address] },
            { name: "VIPStaking", address: deployedContracts.VIPStaking, args: [deployer.address] },
            { name: "PlayerProfile", address: deployedContracts.PlayerProfile, args: [deployer.address] },
            { name: "DungeonCore", address: deployedContracts.DungeonCore, args: [deployer.address, USD_TOKEN_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS] }
        ];

        for (const { name, address, args } of contractsToVerify) {
            try {
                logInfo(`驗證 ${name}...`);
                await run("verify:verify", {
                    address: address,
                    constructorArguments: args
                });
                logSuccess(`✅ ${name} 驗證成功`);
            } catch (e: any) {
                if (e.message.toLowerCase().includes("already verified")) {
                    logInfo(`${name} 已驗證`);
                } else {
                    logError(`❌ ${name} 驗證失敗: ${e.message}`);
                }
            }
        }
    }

    // --- 步驟 19: 轉移所有權 ---
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 19: 轉移合約所有權...");
        
        const contractsWithOwnership = [
            oracle, dungeonStorage, playerVault, altarOfAscension, 
            dungeonMaster, hero, relic, party, vipStaking, 
            playerProfile, dungeonCore
        ];
        
        for (let i = 0; i < contractsWithOwnership.length; i++) {
            const contract = contractsWithOwnership[i];
            const name = Object.keys(deployedContracts)[i];
            
            try {
                if (typeof contract.owner === 'function' && 
                    (await contract.owner()).toLowerCase() === deployer.address.toLowerCase()) {
                    logInfo(`轉移 ${name} 所有權至 ${finalOwner}...`);
                    await (await contract.transferOwnership(finalOwner)).wait();
                    logSuccess(`✅ ${name} 所有權已轉移`);
                }
            } catch (error: any) {
                logError(`❌ 轉移 ${name} 所有權失敗: ${error.message}`);
            }
        }
    }

    // --- 最終報告 ---
    log("🎉🎉🎉 Dungeon Delvers V3 部署完成！🎉🎉🎉");
    log("\n📋 部署總結：");
    logSuccess("✅ 已完全移除疲勞系統");
    logSuccess("✅ Party 合約已更新為正確的 getPartyComposition 實現");
    logSuccess("✅ DungeonMaster 已更新為直接讀取 partyCompositions");
    logSuccess("✅ 所有合約已完成關聯設定");
    
    log("\n📝 新部署的合約地址（請更新 .env）：\n");
    console.log(newEnvVars.join("\n"));
    
    log("\n📊 合約地址摘要：");
    console.log("┌─────────────────────────┬──────────────────────────────────────────────┐");
    console.log("│ 合約名稱                │ 地址                                         │");
    console.log("├─────────────────────────┼──────────────────────────────────────────────┤");
    for (const [name, address] of Object.entries(deployedContracts)) {
        console.log(`│ ${name.padEnd(23)} │ ${address} │`);
    }
    console.log("└─────────────────────────┴──────────────────────────────────────────────┘");
    
    log("\n⚠️ 下一步行動：");
    logWarning("1. 更新前端的 .env 和 contracts.ts");
    logWarning("2. 更新後端的 .env 和 contractReader.js");
    logWarning("3. 更新子圖的 subgraph.yaml 和 config.ts");
    logWarning("4. 重新部署子圖");
    logWarning("5. 更新 Vercel 和 Render 的環境變數");
}

// 執行部署
main().catch((error) => {
    console.error("❌ 部署過程中發生致命錯誤:", error);
    process.exitCode = 1;
});
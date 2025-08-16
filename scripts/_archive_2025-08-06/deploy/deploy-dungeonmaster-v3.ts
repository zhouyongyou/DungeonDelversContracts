// scripts/deploy-dungeonmaster-v3.ts
// 部署修復戰力讀取的 DungeonMasterV3

import { ethers } from "hardhat";
// 簡單的日誌函數
const logInfo = (msg: string) => console.log(`ℹ️  ${msg}`);
const logSuccess = (msg: string) => console.log(`✅ ${msg}`);
const logError = (msg: string) => console.error(`❌ ${msg}`);
const logWarning = (msg: string) => console.log(`⚠️  ${msg}`);

async function main() {
    logInfo("🚀 開始部署 DungeonMasterV3（修復戰力讀取）...");
    
    const [deployer] = await ethers.getSigners();
    logInfo(`部署帳號: ${deployer.address}`);
    
    // 現有合約地址
    const DUNGEON_CORE_ADDRESS = "0xd1F14243c42AF58E69ea7eA58570DC2d9A908D21";
    const DUNGEON_STORAGE_ADDRESS = "0x6FF605478fea3C3270f2eeD550129c58Dea81403";
    const SOUL_SHARD_TOKEN_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    const OLD_DUNGEON_MASTER_ADDRESS = "0x311730fa5459fa099976B139f7007d98C2F1E7A7";
    
    // 部署新的 DungeonMasterV3
    logInfo("部署 DungeonMasterV3 合約...");
    const DungeonMasterV3 = await ethers.getContractFactory("DungeonMasterV3");
    const dungeonMaster = await DungeonMasterV3.deploy(deployer.address);
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    logSuccess(`✅ DungeonMasterV3 部署成功: ${dungeonMasterAddress}`);
    
    // 設定合約連接
    logInfo("設定合約連接...");
    await (await dungeonMaster.setDungeonCore(DUNGEON_CORE_ADDRESS)).wait();
    await (await dungeonMaster.setDungeonStorage(DUNGEON_STORAGE_ADDRESS)).wait();
    await (await dungeonMaster.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    logSuccess("✅ 合約連接設定完成");
    
    // 在 DungeonCore 中更新 DungeonMaster 地址
    logInfo("更新 DungeonCore 中的 DungeonMaster 地址...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEON_CORE_ADDRESS);
    await (await dungeonCore.setDungeonMaster(dungeonMasterAddress)).wait();
    logSuccess("✅ DungeonCore 更新完成");
    
    // 注意：DungeonStorage 授權可能需要手動在管理後台設置
    
    // 設定探索費用
    logInfo("設定探索費用...");
    await (await dungeonMaster.setExplorationFee(ethers.parseEther("0.0015"))).wait();
    logSuccess("✅ 探索費用設定為 0.0015 BNB");
    
    // 測試戰力讀取
    logInfo("測試戰力讀取修復...");
    const party = await ethers.getContractAt("Party", "0xddCFa681Cee80D3a0F23834cC07D371792207C85");
    const composition = await party.partyCompositions(1);
    logInfo(`隊伍 #1 戰力（第一個返回值）: ${composition[0]}`);
    
    // 顯示部署結果
    console.log("\n");
    logSuccess("========== 部署完成 ==========");
    logSuccess(`DungeonMasterV3: ${dungeonMasterAddress}`);
    logSuccess("==============================");
    
    // 更新環境變數提示
    console.log("\n請更新以下環境變數:");
    console.log(`VITE_MAINNET_DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}`);
    
    // 更新提示
    console.log("\n請更新以下位置:");
    console.log("1. 前端 .env 文件");
    console.log("2. 前端 src/config/contracts.ts");
    console.log("3. 後端 .env 文件");
    console.log("4. 子圖 subgraph.yaml 和 config.ts");
    console.log("5. Vercel 和 Render 環境變數");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
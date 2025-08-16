import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 開始部署 DungeonMaster V4...");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署錢包地址:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
    
    // 讀取現有的合約地址
    const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
    if (!dungeonCoreAddress) {
        throw new Error("請在 .env 設定 DUNGEONCORE_ADDRESS");
    }
    
    console.log("使用 DungeonCore 地址:", dungeonCoreAddress);
    
    // 部署 DungeonMaster V4
    console.log("\n📄 部署 DungeonMaster V4...");
    const DungeonMasterV4 = await ethers.getContractFactory("DungeonMasterV4");
    const dungeonMasterV4 = await DungeonMasterV4.deploy(deployer.address);
    await dungeonMasterV4.waitForDeployment();
    
    const dungeonMasterV4Address = await dungeonMasterV4.getAddress();
    console.log("✅ DungeonMaster V4 部署成功:", dungeonMasterV4Address);
    
    // 等待區塊確認
    console.log("\n⏳ 等待 5 個區塊確認...");
    await dungeonMasterV4.deploymentTransaction().wait(5);
    
    // 設定必要的合約連接
    console.log("\n🔗 設定合約連接...");
    
    // 1. 設定 DungeonCore
    const tx1 = await dungeonMasterV4.setDungeonCore(dungeonCoreAddress);
    await tx1.wait();
    console.log("✅ 已設定 DungeonCore");
    
    // 2. 設定其他必要地址（從環境變數讀取）
    if (process.env.DUNGEONSTORAGE_ADDRESS) {
        const tx2 = await dungeonMasterV4.setDungeonStorage(process.env.DUNGEONSTORAGE_ADDRESS);
        await tx2.wait();
        console.log("✅ 已設定 DungeonStorage");
    }
    
    if (process.env.SOUL_SHARD_TOKEN_ADDRESS) {
        const tx3 = await dungeonMasterV4.setSoulShardToken(process.env.SOUL_SHARD_TOKEN_ADDRESS);
        await tx3.wait();
        console.log("✅ 已設定 SoulShard Token");
    }
    
    // 驗證合約
    console.log("\n🔍 驗證合約...");
    try {
        await run("verify:verify", {
            address: dungeonMasterV4Address,
            constructorArguments: [deployer.address],
        });
        console.log("✅ 合約驗證成功");
    } catch (error) {
        console.error("❌ 合約驗證失敗:", error);
    }
    
    // 更新 .env 檔案
    console.log("\n📝 更新 .env 檔案...");
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 備份舊的地址
    const oldDungeonMasterMatch = envContent.match(/DUNGEONMASTER_ADDRESS=(0x[a-fA-F0-9]{40})/);
    if (oldDungeonMasterMatch) {
        envContent = envContent.replace(
            /# DUNGEONMASTER_ADDRESS_V3.*\n/g, 
            ''
        );
        envContent = envContent.replace(
            /DUNGEONMASTER_ADDRESS=.*/,
            `# DUNGEONMASTER_ADDRESS_V3=${oldDungeonMasterMatch[1]}\nDUNGEONMASTER_ADDRESS=${dungeonMasterV4Address}`
        );
    } else {
        envContent += `\nDUNGEONMASTER_ADDRESS=${dungeonMasterV4Address}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env 檔案已更新");
    
    // 輸出部署摘要
    console.log("\n=== 部署摘要 ===");
    console.log("DungeonMaster V4:", dungeonMasterV4Address);
    console.log("\n⚠️  重要提醒:");
    console.log("1. 請在 DungeonCore 更新 DungeonMaster 地址");
    console.log("2. 請更新前端的合約地址");
    console.log("3. 請更新子圖的合約地址和 ABI");
    console.log("4. 請初始化地下城配置（執行 initialize-dungeons-v4.ts）");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
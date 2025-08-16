import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 開始部署 DungeonMaster V5...");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署錢包地址:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
    
    // 讀取現有的合約地址
    const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
    const dungeonStorageAddress = process.env.DUNGEONSTORAGE_ADDRESS;
    
    if (!dungeonCoreAddress) {
        throw new Error("請在 .env 設定 DUNGEONCORE_ADDRESS");
    }
    if (!dungeonStorageAddress) {
        throw new Error("請在 .env 設定 DUNGEONSTORAGE_ADDRESS");
    }
    
    console.log("使用 DungeonCore 地址:", dungeonCoreAddress);
    console.log("使用 DungeonStorage 地址:", dungeonStorageAddress);
    
    // 部署 DungeonMaster V5
    console.log("\n📄 部署 DungeonMaster V5...");
    const DungeonMasterV5 = await ethers.getContractFactory("DungeonMasterV5");
    const dungeonMasterV5 = await DungeonMasterV5.deploy(deployer.address);
    await dungeonMasterV5.waitForDeployment();
    
    const dungeonMasterV5Address = await dungeonMasterV5.getAddress();
    console.log("✅ DungeonMaster V5 部署成功:", dungeonMasterV5Address);
    
    // 等待區塊確認
    console.log("\n⏳ 等待 5 個區塊確認...");
    await dungeonMasterV5.deploymentTransaction().wait(5);
    
    // 設定必要的合約連接
    console.log("\n🔗 設定合約連接...");
    
    // 1. 設定 DungeonCore
    console.log("設定 DungeonCore...");
    const tx1 = await dungeonMasterV5.setDungeonCore(dungeonCoreAddress);
    await tx1.wait();
    console.log("✅ 已設定 DungeonCore");
    
    // 2. 設定 DungeonStorage
    console.log("設定 DungeonStorage...");
    const tx2 = await dungeonMasterV5.setDungeonStorage(dungeonStorageAddress);
    await tx2.wait();
    console.log("✅ 已設定 DungeonStorage");
    
    // 驗證設定
    const soulShardToken = await dungeonMasterV5.soulShardToken();
    console.log("✅ SoulShard Token 自動設定為:", soulShardToken);
    
    // 生成 ABI 檔案
    console.log("\n📁 生成 ABI 檔案...");
    const contractArtifact = await ethers.getContractFactory("DungeonMasterV5");
    const abi = contractArtifact.interface.formatJson();
    
    const abiDir = path.join(process.cwd(), 'abi');
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }
    
    const abiPath = path.join(abiDir, 'DungeonMasterV5.json');
    fs.writeFileSync(abiPath, abi);
    console.log("✅ ABI 已保存到:", abiPath);
    
    // 驗證合約
    console.log("\n🔍 驗證合約...");
    try {
        await run("verify:verify", {
            address: dungeonMasterV5Address,
            constructorArguments: [deployer.address],
        });
        console.log("✅ 合約驗證成功");
    } catch (error: any) {
        if (error.message.includes("already verified")) {
            console.log("ℹ️  合約已經驗證過了");
        } else {
            console.error("❌ 合約驗證失敗:", error);
        }
    }
    
    // 更新 .env 檔案
    console.log("\n📝 更新 .env 檔案...");
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 備份舊的地址
    const oldDungeonMasterMatch = envContent.match(/DUNGEONMASTER_ADDRESS=(0x[a-fA-F0-9]{40})/);
    if (oldDungeonMasterMatch) {
        // 添加 V4 備份
        envContent = envContent.replace(
            /# DUNGEONMASTER_ADDRESS_V4.*\n/g, 
            ''
        );
        envContent = envContent.replace(
            /DUNGEONMASTER_ADDRESS=.*/,
            `# DUNGEONMASTER_ADDRESS_V4=${oldDungeonMasterMatch[1]}\nDUNGEONMASTER_ADDRESS=${dungeonMasterV5Address}`
        );
    } else {
        envContent += `\nDUNGEONMASTER_ADDRESS=${dungeonMasterV5Address}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env 檔案已更新");
    
    // 創建部署記錄
    console.log("\n📝 創建部署記錄...");
    const deploymentRecord = {
        version: "DungeonMasterV5",
        deployedAt: new Date().toISOString(),
        network: "BSC Mainnet",
        deployer: deployer.address,
        addresses: {
            dungeonMasterV5: dungeonMasterV5Address,
            dungeonCore: dungeonCoreAddress,
            dungeonStorage: dungeonStorageAddress,
            soulShardToken: soulShardToken
        },
        gasUsed: (await dungeonMasterV5.deploymentTransaction().wait()).gasUsed.toString(),
        improvements: [
            "使用標準 getPartyComposition 函數讀取戰力",
            "新增 ExpeditionRequested 事件記錄戰力資訊",
            "新增 canEnterDungeon 預檢查函數",
            "新增 getPartyPower 便利函數",
            "改進錯誤訊息，顯示具體戰力數值"
        ]
    };
    
    const recordPath = path.join(
        process.cwd(), 
        'DEPLOYMENT_RECORDS', 
        `DungeonMasterV5_${new Date().toISOString().split('T')[0]}.json`
    );
    
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    console.log("✅ 部署記錄已保存到:", recordPath);
    
    // 輸出部署摘要
    console.log("\n");
    console.log("=".repeat(50));
    console.log("🎉 部署完成！");
    console.log("=".repeat(50));
    console.log("DungeonMaster V5:", dungeonMasterV5Address);
    console.log("ABI 位置:", abiPath);
    console.log("部署記錄:", recordPath);
    console.log("=".repeat(50));
    
    console.log("\n⚠️  接下來的步驟:");
    console.log("1. 在 DungeonCore 更新 DungeonMaster 地址");
    console.log("   - 執行: setDungeonMaster(" + dungeonMasterV5Address + ")");
    console.log("2. 初始化地下城配置");
    console.log("   - 執行: npx hardhat run scripts/active/initialize/initialize-dungeons-v5.ts --network bsc");
    console.log("3. 更新前端配置");
    console.log("   - 複製 ABI: cp abi/DungeonMasterV5.json ../GitHub/DungeonDelvers/src/config/abis/");
    console.log("   - 更新地址: VITE_MAINNET_DUNGEONMASTER_ADDRESS=" + dungeonMasterV5Address);
    console.log("4. 更新子圖");
    console.log("   - 更新 subgraph.yaml 中的地址和起始區塊");
    console.log("   - 重新部署子圖");
    console.log("5. 更新後端");
    console.log("   - 更新 .env: DUNGEONMASTER_ADDRESS=" + dungeonMasterV5Address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
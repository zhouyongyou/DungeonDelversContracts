import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🔄 更新 DungeonCore 的 DungeonMaster 地址...");
    
    const [deployer] = await ethers.getSigners();
    console.log("執行錢包地址:", deployer.address);
    
    // 獲取合約地址
    const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
    const newDungeonMasterAddress = process.env.DUNGEONMASTER_ADDRESS;
    
    if (!dungeonCoreAddress || !newDungeonMasterAddress) {
        throw new Error("請確保 .env 中設定了 DUNGEONCORE_ADDRESS 和 DUNGEONMASTER_ADDRESS");
    }
    
    console.log("DungeonCore 地址:", dungeonCoreAddress);
    console.log("新 DungeonMaster 地址:", newDungeonMasterAddress);
    
    // 連接到 DungeonCore 合約
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    
    // 更新 DungeonMaster 地址
    console.log("\n📝 更新 DungeonMaster 地址...");
    const tx = await dungeonCore.setDungeonMaster(newDungeonMasterAddress);
    console.log("交易已發送:", tx.hash);
    
    await tx.wait();
    console.log("✅ DungeonMaster 地址更新成功！");
    
    // 驗證更新
    const updatedAddress = await dungeonCore.dungeonMasterAddress();
    console.log("\n驗證結果:");
    console.log("當前 DungeonMaster 地址:", updatedAddress);
    console.log("更新是否成功:", updatedAddress === newDungeonMasterAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
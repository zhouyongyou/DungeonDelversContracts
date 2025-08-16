import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🔐 授權 DungeonMaster 到 DungeonStorage...");
    
    const [deployer] = await ethers.getSigners();
    console.log("執行錢包地址:", deployer.address);
    
    const DUNGEON_STORAGE_ADDRESS = process.env.DUNGEONSTORAGE_ADDRESS;
    const DUNGEON_MASTER_ADDRESS = process.env.DUNGEONMASTER_ADDRESS;
    
    if (!DUNGEON_STORAGE_ADDRESS || !DUNGEON_MASTER_ADDRESS) {
        throw new Error("請確保 .env 中設定了 DUNGEONSTORAGE_ADDRESS 和 DUNGEONMASTER_ADDRESS");
    }
    
    console.log("DungeonStorage 地址:", DUNGEON_STORAGE_ADDRESS);
    console.log("DungeonMaster 地址:", DUNGEON_MASTER_ADDRESS);
    
    // 連接到 DungeonStorage 合約
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", DUNGEON_STORAGE_ADDRESS);
    
    // 檢查當前的邏輯合約地址
    const currentLogicContract = await dungeonStorage.logicContract();
    console.log("\n當前邏輯合約地址:", currentLogicContract);
    
    if (currentLogicContract === DUNGEON_MASTER_ADDRESS) {
        console.log("✅ DungeonMaster 已經是授權的邏輯合約！");
        return;
    }
    
    // 設定新的邏輯合約
    console.log("\n📝 設定新的邏輯合約...");
    const tx = await dungeonStorage.setLogicContract(DUNGEON_MASTER_ADDRESS);
    console.log("交易已發送:", tx.hash);
    
    await tx.wait();
    console.log("✅ 授權成功！");
    
    // 驗證更新
    const updatedLogicContract = await dungeonStorage.logicContract();
    console.log("\n驗證結果:");
    console.log("新的邏輯合約地址:", updatedLogicContract);
    console.log("更新是否成功:", updatedLogicContract === DUNGEON_MASTER_ADDRESS);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
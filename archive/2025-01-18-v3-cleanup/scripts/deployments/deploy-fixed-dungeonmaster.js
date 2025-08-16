// 部署修復後的 DungeonMaster 合約

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 部署修復後的 DungeonMaster V4...\n");

    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);

    // 現有合約地址
    const dungeonCoreAddress = "0x942cde20A3ebA345e6A329B71362C383bC2cDa48";
    const dungeonStorageAddress = "0x43b9745063c488781bBE45373E1d539A4a00d52e";
    const soulShardAddress = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";

    // 部署新的 DungeonMaster
    console.log("部署 DungeonMasterV2...");
    const DungeonMasterV2 = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = await DungeonMasterV2.deploy(
        dungeonCoreAddress,
        soulShardAddress
    );
    await dungeonMaster.waitForDeployment();
    
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    console.log("✅ DungeonMasterV2 部署於:", dungeonMasterAddress);

    // 設置配置
    console.log("\n配置合約...");
    
    // 設置 DungeonStorage
    await dungeonMaster.setDungeonStorage(dungeonStorageAddress);
    console.log("✅ 設置 DungeonStorage");

    // 設置錢包地址
    await dungeonMaster.setWalletAddress(deployer.address);
    console.log("✅ 設置錢包地址");

    console.log("\n🎉 部署完成！");
    console.log("新的 DungeonMaster 地址:", dungeonMasterAddress);
    console.log("\n請更新前端、後端和子圖的合約地址！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 錯誤:", error);
        process.exit(1);
    });
// deploy-hero-simple.js - 簡化版部署 Hero 合約
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 簡化部署 Hero 合約...\n");
    
    try {
        // 使用原生 ethers v6 語法
        const [deployer] = await ethers.getSigners();
        console.log("部署者地址:", deployer.address);
        
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("部署者餘額:", ethers.formatEther(balance), "BNB");

        // 部署 Hero 合約 - 簡化版本
        console.log("\n📦 準備部署 Hero 合約...");
        const HeroFactory = await ethers.getContractFactory("Hero");
        console.log("✅ 合約工廠創建成功");
        
        console.log("🚀 開始部署...");
        const heroContract = await HeroFactory.deploy(deployer.address);
        console.log("⏳ 等待交易確認...");
        
        await heroContract.waitForDeployment();
        const heroAddress = await heroContract.getAddress();
        
        console.log("✅ Hero 部署成功!");
        console.log("📍 地址:", heroAddress);
        
        console.log("\n⚙️ 設置基本連接...");
        await heroContract.setDungeonCore('0x8a2D2b1961135127228EdD71Ff98d6B097915a13');
        console.log("✅ DungeonCore 連接已設置");
        
        await heroContract.setSoulShardToken('0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF');
        console.log("✅ SoulShard 連接已設置");
        
        await heroContract.setVRFManager('0xD062785C376560A392e1a5F1b25ffb35dB5b67bD');
        console.log("✅ VRFManager 連接已設置");

        console.log("\n🎉 Hero 合約部署和設置完成!");
        console.log(`HERO_ADDRESS=${heroAddress}`);

    } catch (error) {
        console.error("\n❌ 部署失敗:", error.message);
        if (error.reason) {
            console.error("原因:", error.reason);
        }
        if (error.code) {
            console.error("錯誤碼:", error.code);
        }
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("=== 部署修復版 Hero 合約 ===\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("部署者餘額:", ethers.formatEther(balance), "BNB\n");
    
    try {
        console.log("📦 部署新的 Hero 合約...");
        
        // 只部署 Hero 合約
        const HeroFactory = await ethers.getContractFactory("Hero");
        console.log("Factory 創建完成");
        
        const hero = await HeroFactory.deploy(deployer.address, {
            gasLimit: 8000000 // 增加 gas limit
        });
        
        console.log("部署交易已提交，等待確認...");
        await hero.waitForDeployment();
        
        const heroAddress = await hero.getAddress();
        console.log("✅ Hero 部署完成:", heroAddress);
        
        // 基本配置
        console.log("\n🔧 配置新的 Hero 合約...");
        
        const DUNGEONCORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
        const VRF_MANAGER = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
        
        let tx = await hero.setDungeonCore(DUNGEONCORE);
        await tx.wait();
        console.log("✅ DungeonCore 設定完成");
        
        tx = await hero.setVRFManager(VRF_MANAGER);
        await tx.wait();
        console.log("✅ VRF Manager 設定完成");
        
        tx = await hero.setPlatformFee(0);
        await tx.wait();
        console.log("✅ 平台費設為 0");
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ Hero 合約部署並配置完成！");
        console.log("─".repeat(60));
        console.log("新 Hero 地址:", heroAddress);
        console.log("舊 Hero 地址: 0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD");
        
        // 驗證修復
        const vrfManager = await ethers.getContractAt("IVRFManager", VRF_MANAGER);
        const vrfFee = await vrfManager.vrfRequestPrice();
        console.log("\nVRF 費用:", ethers.formatEther(vrfFee), "BNB");
        
        const platformFee = await hero.platformFee();
        console.log("平台費:", ethers.formatEther(platformFee), "BNB");
        
        console.log("\n⚠️ 接下來需要：");
        console.log("1. 更新前端 Hero 地址");
        console.log("2. 更新子圖 Hero 地址");
        console.log("3. 更新 DungeonCore 中的 Hero 地址");
        
    } catch (error) {
        console.error("❌ 部署失敗:", error.message);
        if (error.data) {
            console.error("錯誤數據:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
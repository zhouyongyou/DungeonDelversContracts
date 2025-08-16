// deploy-hero-only.js - 單獨部署 Hero 合約
const hre = require("hardhat");

async function main() {
    console.log("🚀 部署 Hero 合約...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");

    try {
        // 部署 Hero 合約
        console.log("📦 部署 Hero 合約...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = await Hero.deploy(deployer.address);
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        
        console.log("✅ Hero 部署成功:", heroAddress);
        
        // 設置基本連接
        console.log("⚙️ 設置基本連接...");
        await hero.setDungeonCore('0x8a2D2b1961135127228EdD71Ff98d6B097915a13');
        await hero.setSoulShardToken('0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF');
        await hero.setVRFManager('0xD062785C376560A392e1a5F1b25ffb35dB5b67bD');
        console.log("✅ Hero 連接設置完成");

        // 授權 VRF
        console.log("🔐 授權 VRF...");
        const vrfManager = await hre.ethers.getContractAt("VRFManager", '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD');
        await vrfManager.authorizeContract(heroAddress);
        console.log("✅ Hero 已授權使用 VRF");

        console.log(`\n🎉 Hero 合約部署完成: ${heroAddress}`);
        console.log(`HERO_ADDRESS=${heroAddress}`);

    } catch (error) {
        console.error("❌ 錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
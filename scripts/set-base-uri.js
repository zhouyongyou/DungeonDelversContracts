// scripts/set-base-uri.js - 設定 NFT 合約的 baseURI
const hre = require("hardhat");

async function main() {
    console.log("🔧 設定 NFT 合約的 baseURI...");
    
    // 獲取簽名者
    const [deployer] = await hre.ethers.getSigners();
    console.log("執行者地址:", deployer.address);
    
    // 從環境變數或 .env.v25 文件讀取地址
    const HERO_ADDRESS = process.env.VITE_HERO_ADDRESS || "0xe3DeF34622098B9dc7f042243Ce4f998Dfa3C662";
    const RELIC_ADDRESS = process.env.VITE_RELIC_ADDRESS || "0x9A682D761ef20377e46136a45f10C3B2a8A76CeF";
    
    // 元數據服務器 URL
    const METADATA_SERVER = "https://dungeon-delvers-metadata-server.onrender.com";
    const HERO_BASE_URI = `${METADATA_SERVER}/api/hero/`;
    const RELIC_BASE_URI = `${METADATA_SERVER}/api/relic/`;
    
    console.log("\n📍 合約地址:");
    console.log("英雄:", HERO_ADDRESS);
    console.log("聖物:", RELIC_ADDRESS);
    
    console.log("\n🔗 BaseURI 設定:");
    console.log("英雄:", HERO_BASE_URI);
    console.log("聖物:", RELIC_BASE_URI);
    
    try {
        // 連接英雄合約
        const Hero = await hre.ethers.getContractAt("Hero", HERO_ADDRESS);
        
        console.log("\n🦸 設定英雄 baseURI...");
        const heroTx = await Hero.setBaseURI(HERO_BASE_URI);
        await heroTx.wait();
        console.log("✅ 英雄 baseURI 設定成功！交易:", heroTx.hash);
        
        // 驗證設定
        const heroBaseURI = await Hero.baseURI();
        console.log("📋 驗證英雄 baseURI:", heroBaseURI);
        
        // 連接聖物合約
        const Relic = await hre.ethers.getContractAt("Relic", RELIC_ADDRESS);
        
        console.log("\n🏺 設定聖物 baseURI...");
        const relicTx = await Relic.setBaseURI(RELIC_BASE_URI);
        await relicTx.wait();
        console.log("✅ 聖物 baseURI 設定成功！交易:", relicTx.hash);
        
        // 驗證設定
        const relicBaseURI = await Relic.baseURI();
        console.log("📋 驗證聖物 baseURI:", relicBaseURI);
        
        console.log("\n🎉 BaseURI 設定完成！");
        console.log("\n📝 現在 NFT 市場應該能正確顯示:");
        console.log("• 名稱: 動態生成的英雄/聖物名稱");
        console.log("• 圖片: 基於稀有度的官方圖片");
        console.log("• 屬性: 完整的戰力、稀有度等資訊");
        
    } catch (error) {
        console.error("❌ 設定失敗:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💰 錢包餘額不足，需要 BNB 支付 gas 費用");
        } else if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("🔐 只有合約擁有者可以設定 baseURI");
        } else if (error.message.includes("contract call reverted")) {
            console.log("🔄 交易被回滾，請檢查合約狀態");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
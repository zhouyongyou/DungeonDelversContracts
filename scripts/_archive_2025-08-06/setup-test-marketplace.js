// 測試環境市場設置腳本
const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    
    console.log("🚀 設置測試環境市場合約...");
    console.log("👤 執行者:", owner.address);
    
    // 從環境變數讀取地址
    const MARKETPLACE_V2 = "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8";
    const OFFER_SYSTEM_V2 = "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF";
    const TUSD1_ADDRESS = process.env.USDT_ADDRESS || "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
    
    // 合約實例
    const marketplaceV2 = await ethers.getContractAt("DungeonMarketplaceV2", MARKETPLACE_V2);
    const offerSystemV2 = await ethers.getContractAt("OfferSystemV2", OFFER_SYSTEM_V2);
    
    console.log("📍 合約地址:");
    console.log("   Marketplace V2:", MARKETPLACE_V2);
    console.log("   Offer System V2:", OFFER_SYSTEM_V2);
    console.log("   TUSD1 (測試幣):", TUSD1_ADDRESS);
    
    // 1. 檢查當前狀態
    console.log("\n📊 檢查當前狀態...");
    
    try {
        const supportedTokens = await marketplaceV2.getSupportedTokens();
        console.log("當前支援的代幣數量:", supportedTokens.length);
        
        const isTusd1Supported = await marketplaceV2.supportedTokens(TUSD1_ADDRESS);
        console.log("TUSD1 是否已支援:", isTusd1Supported);
        
        if (!isTusd1Supported) {
            console.log("\n📝 添加 TUSD1 測試代幣...");
            
            // 添加到 Marketplace
            console.log("正在添加到 Marketplace...");
            const tx1 = await marketplaceV2.addPaymentToken(TUSD1_ADDRESS);
            console.log("交易已發送:", tx1.hash);
            await tx1.wait();
            console.log("✅ TUSD1 已添加到 Marketplace");
            
            // 添加到 OfferSystem
            console.log("正在添加到 OfferSystem...");
            const tx2 = await offerSystemV2.addPaymentToken(TUSD1_ADDRESS);
            console.log("交易已發送:", tx2.hash);
            await tx2.wait();
            console.log("✅ TUSD1 已添加到 OfferSystem");
        } else {
            console.log("✅ TUSD1 已經支援，跳過添加");
        }
        
    } catch (error) {
        console.error("❌ 添加 TUSD1 失敗:", error.message);
    }
    
    // 2. 確保 NFT 合約已批准
    console.log("\n📝 檢查 NFT 合約批准狀態...");
    
    const nftContracts = {
        hero: "0x162b0b673f38C11732b0bc0B4B026304e563e8e2",
        relic: "0x15c2454A31Abc0063ef4a71d0640057d71847a22",
        party: "0xab07E90d44c34FB62313C74F3C7b4b343E52a253"
    };
    
    for (const [name, address] of Object.entries(nftContracts)) {
        try {
            const isApproved = await marketplaceV2.approvedNFTContracts(address);
            console.log(`${name.toUpperCase()} 合約批准狀態:`, isApproved);
            
            if (!isApproved) {
                console.log(`正在批准 ${name.toUpperCase()} 合約...`);
                
                const tx1 = await marketplaceV2.approveNFTContract(address);
                await tx1.wait();
                console.log(`✅ ${name.toUpperCase()} 已批准 (Marketplace)`);
                
                const tx2 = await offerSystemV2.approveNFTContract(address);
                await tx2.wait();
                console.log(`✅ ${name.toUpperCase()} 已批准 (OfferSystem)`);
            }
        } catch (error) {
            console.error(`❌ 批准 ${name.toUpperCase()} 合約失敗:`, error.message);
        }
    }
    
    // 3. 檢查平台設定
    console.log("\n📊 當前平台設定:");
    
    try {
        const platformFee = await marketplaceV2.platformFee();
        console.log("平台手續費:", platformFee.toString(), "basis points (" + (platformFee / 100) + "%)");
        
        const feeRecipient = await marketplaceV2.feeRecipient();
        console.log("手續費接收地址:", feeRecipient);
        
        const currentListingId = await marketplaceV2.getCurrentListingId();
        console.log("當前列表 ID:", currentListingId.toString());
        
        const supportedTokensFinal = await marketplaceV2.getSupportedTokens();
        console.log("\n支援的代幣列表:");
        supportedTokensFinal.forEach((token, index) => {
            console.log(`  ${index + 1}. ${token}`);
        });
        
    } catch (error) {
        console.error("❌ 查詢平台設定失敗:", error.message);
    }
    
    // 4. 測試功能提示
    console.log("\n🎯 測試建議:");
    console.log("1. 確認 TUSD1 代幣合約有足夠的測試代幣");
    console.log("2. 測試創建列表功能");
    console.log("3. 測試購買功能");
    console.log("4. 檢查 Subgraph 是否正確索引新事件");
    console.log("\n查詢端點:");
    console.log("https://api.studio.thegraph.com/query/115633/dungeondelvers-p2p-marketplace/v0.0.1");
    
    console.log("\n🎉 測試環境設置完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
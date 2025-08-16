// 測試市場交易功能
const { ethers } = require("hardhat");

async function main() {
    const [owner, user1, user2] = await ethers.getSigners();
    
    console.log("🧪 測試市場交易功能...");
    console.log("👤 Owner:", owner.address);
    console.log("👤 User 1:", user1.address);
    console.log("👤 User 2:", user2.address);
    
    // 合約地址
    const MARKETPLACE_V2 = "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8";
    const HERO_CONTRACT = "0x162b0b673f38C11732b0bc0B4B026304e563e8e2";
    const TUSD1_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
    
    // 合約實例
    const marketplace = await ethers.getContractAt("DungeonMarketplaceV2", MARKETPLACE_V2);
    const heroContract = await ethers.getContractAt("Hero", HERO_CONTRACT);
    const tusd1Contract = await ethers.getContractAt("IERC20", TUSD1_ADDRESS);
    
    console.log("\n1️⃣ 檢查 User1 的 Hero NFT...");
    
    try {
        const heroBalance = await heroContract.balanceOf(user1.address);
        console.log("User1 的 Hero 數量:", heroBalance.toString());
        
        if (heroBalance.gt(0)) {
            const tokenId = await heroContract.tokenOfOwnerByIndex(user1.address, 0);
            console.log("第一個 Hero Token ID:", tokenId.toString());
            
            // 檢查是否已批准
            const approved = await heroContract.getApproved(tokenId);
            const isApprovedForAll = await heroContract.isApprovedForAll(user1.address, MARKETPLACE_V2);
            
            console.log("NFT 批准狀態:");
            console.log("  Approved address:", approved);
            console.log("  Approved for all:", isApprovedForAll);
            
            if (!isApprovedForAll && approved !== MARKETPLACE_V2) {
                console.log("正在批准 NFT 給市場合約...");
                const approveTx = await heroContract.connect(user1).setApprovalForAll(MARKETPLACE_V2, true);
                await approveTx.wait();
                console.log("✅ NFT 已批准");
            }
            
            console.log("\n2️⃣ 創建測試列表...");
            
            // 檢查是否已經列表
            const currentListingId = await marketplace.getCurrentListingId();
            console.log("當前列表 ID:", currentListingId.toString());
            
            // 創建列表
            const price = ethers.utils.parseEther("10"); // 10 USD
            const acceptedTokens = [TUSD1_ADDRESS];
            
            const createTx = await marketplace.connect(user1).createListing(
                0, // NFTType.HERO
                HERO_CONTRACT,
                tokenId,
                price,
                acceptedTokens
            );
            
            console.log("創建列表交易:", createTx.hash);
            const receipt = await createTx.wait();
            
            // 解析事件
            const event = receipt.events?.find(e => e.event === 'ListingCreated');
            if (event) {
                console.log("✅ 列表創建成功!");
                console.log("   列表 ID:", event.args.listingId.toString());
                console.log("   賣家:", event.args.seller);
                console.log("   價格:", ethers.utils.formatEther(event.args.price), "USD");
            }
            
            console.log("\n3️⃣ 檢查 User2 的 TUSD1 餘額...");
            
            const tusd1Balance = await tusd1Contract.balanceOf(user2.address);
            console.log("User2 的 TUSD1 餘額:", ethers.utils.formatEther(tusd1Balance));
            
            if (tusd1Balance.gte(price)) {
                console.log("\n4️⃣ 測試購買功能...");
                
                // 批准代幣
                const allowance = await tusd1Contract.allowance(user2.address, MARKETPLACE_V2);
                if (allowance.lt(price)) {
                    console.log("正在批准 TUSD1 給市場合約...");
                    const approveTx = await tusd1Contract.connect(user2).approve(MARKETPLACE_V2, price);
                    await approveTx.wait();
                    console.log("✅ TUSD1 已批准");
                }
                
                // 購買 NFT
                const newListingId = event ? event.args.listingId : currentListingId;
                const purchaseTx = await marketplace.connect(user2).purchaseNFT(
                    newListingId,
                    TUSD1_ADDRESS
                );
                
                console.log("購買交易:", purchaseTx.hash);
                const purchaseReceipt = await purchaseTx.wait();
                
                // 解析事件
                const soldEvent = purchaseReceipt.events?.find(e => e.event === 'ListingSold');
                if (soldEvent) {
                    console.log("✅ 購買成功!");
                    console.log("   買家:", soldEvent.args.buyer);
                    console.log("   支付代幣:", soldEvent.args.paymentToken);
                    console.log("   價格:", ethers.utils.formatEther(soldEvent.args.price));
                    console.log("   平台手續費:", ethers.utils.formatEther(soldEvent.args.platformFeeAmount));
                }
                
                console.log("\n5️⃣ 驗證所有權轉移...");
                const newOwner = await heroContract.ownerOf(tokenId);
                console.log("NFT 新擁有者:", newOwner);
                console.log("轉移成功:", newOwner === user2.address);
                
            } else {
                console.log("❌ User2 TUSD1 餘額不足，跳過購買測試");
                console.log("請先給 User2 轉入一些 TUSD1 測試代幣");
            }
            
        } else {
            console.log("❌ User1 沒有 Hero NFT，請先鑄造一些用於測試");
        }
        
    } catch (error) {
        console.error("❌ 測試失敗:", error.message);
        if (error.reason) {
            console.error("原因:", error.reason);
        }
    }
    
    console.log("\n📊 最終狀態檢查...");
    
    try {
        const stats = await marketplace.connect(owner).getCurrentListingId();
        console.log("總列表數:", stats.toString());
        
        const supportedTokens = await marketplace.getSupportedTokens();
        console.log("支援的代幣數:", supportedTokens.length);
        
    } catch (error) {
        console.error("狀態檢查失敗:", error.message);
    }
    
    console.log("\n🎯 建議接下來測試:");
    console.log("1. 檢查 Subgraph 是否索引了新的交易");
    console.log("2. 測試出價功能 (OfferSystemV2)");
    console.log("3. 測試價格更新功能");
    console.log("4. 測試取消列表功能");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
// 全面的市場合約自動化測試
const { ethers } = require("hardhat");
const axios = require('axios');

// 配置常量
const MARKETPLACE_V2 = "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8";
const OFFER_SYSTEM_V2 = "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF";
const HERO_CONTRACT = "0x162b0b673f38C11732b0bc0B4B026304e563e8e2";
const TUSD1_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/115633/dungeondelvers-p2p-marketplace/v0.0.1";

let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, success, details = "") {
    const status = success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${name}`);
    if (details) console.log(`   ${details}`);
    
    testResults.tests.push({ name, success, details });
    if (success) testResults.passed++;
    else testResults.failed++;
}

async function querySubgraph(query, description) {
    try {
        const response = await axios.post(SUBGRAPH_URL, { query });
        if (response.data.errors) {
            console.error(`Subgraph query failed: ${description}`, response.data.errors);
            return null;
        }
        return response.data.data;
    } catch (error) {
        console.error(`Subgraph request failed: ${description}`, error.message);
        return null;
    }
}

async function waitForTransaction(tx, description) {
    console.log(`📡 發送交易: ${description}`);
    console.log(`   Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`   ✅ 確認 (Gas Used: ${receipt.gasUsed.toString()})`);
    return receipt;
}

async function main() {
    console.log("🚀 開始市場合約全面自動化測試");
    console.log("📅", new Date().toLocaleString());
    console.log("=".repeat(50));
    
    const signers = await ethers.getSigners();
    const owner = signers[0];
    const user1 = signers[1] || signers[0]; // 如果沒有第二個簽名者，使用owner
    const user2 = signers[2] || signers[0]; // 如果沒有第三個簽名者，使用owner
    
    console.log("👥 測試帳戶:");
    console.log(`   Owner: ${owner.address}`);
    console.log(`   User1: ${user1.address} ${user1.address === owner.address ? '(same as owner)' : ''}`);
    console.log(`   User2: ${user2.address} ${user2.address === owner.address ? '(same as owner)' : ''}`);
    
    // 初始化合約實例
    const marketplace = await ethers.getContractAt("DungeonMarketplaceV2", MARKETPLACE_V2);
    const offerSystem = await ethers.getContractAt("OfferSystemV2", OFFER_SYSTEM_V2);
    const heroContract = await ethers.getContractAt("Hero", HERO_CONTRACT);
    const tusd1Contract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TUSD1_ADDRESS);
    
    console.log("\n📊 Phase 1: 合約狀態檢查");
    console.log("-".repeat(30));
    
    // Test 1: 檢查合約基本狀態
    try {
        const platformFee = await marketplace.platformFee();
        const feeRecipient = await marketplace.feeRecipient();
        const currentListingId = await marketplace.getCurrentListingId();
        
        logTest("合約基本狀態檢查", true, 
            `手續費: ${platformFee}bp, 接收者: ${feeRecipient.substring(0,8)}..., 列表ID: ${currentListingId}`);
    } catch (error) {
        logTest("合約基本狀態檢查", false, error.message);
    }
    
    // Test 2: 檢查TUSD1支持
    try {
        const isSupported = await marketplace.supportedTokens(TUSD1_ADDRESS);
        const supportedTokens = await marketplace.getSupportedTokens();
        
        logTest("TUSD1代幣支持檢查", isSupported, 
            `支持狀態: ${isSupported}, 總代幣數: ${supportedTokens.length}`);
    } catch (error) {
        logTest("TUSD1代幣支持檢查", false, error.message);
    }
    
    // Test 3: 檢查NFT合約批准
    try {
        const isApproved = await marketplace.approvedNFTContracts(HERO_CONTRACT);
        logTest("NFT合約批准檢查", isApproved, `Hero合約批准狀態: ${isApproved}`);
    } catch (error) {
        logTest("NFT合約批准檢查", false, error.message);
    }
    
    console.log("\n📊 Phase 2: 子圖連接測試");
    console.log("-".repeat(30));
    
    // Test 4: 子圖基本連接
    const metaData = await querySubgraph(`
        {
            _meta {
                block { number }
                hasIndexingErrors
            }
        }
    `, "基本連接測試");
    
    if (metaData && metaData._meta) {
        logTest("子圖連接測試", true, 
            `當前區塊: ${metaData._meta.block.number}, 錯誤: ${metaData._meta.hasIndexingErrors}`);
    } else {
        logTest("子圖連接測試", false, "無法連接到子圖");
    }
    
    // Test 5: 代幣數據查詢
    const tokenData = await querySubgraph(`
        {
            tokenSupports(where: { isSupported: true }) {
                id
                tokenAddress
                isSupported
            }
        }
    `, "代幣數據查詢");
    
    if (tokenData && tokenData.tokenSupports) {
        const tusd1Found = tokenData.tokenSupports.find(t => 
            t.tokenAddress.toLowerCase() === TUSD1_ADDRESS.toLowerCase()
        );
        logTest("子圖TUSD1數據查詢", !!tusd1Found, 
            `找到 ${tokenData.tokenSupports.length} 個代幣, TUSD1: ${!!tusd1Found}`);
    } else {
        logTest("子圖TUSD1數據查詢", false, "無法查詢代幣數據");
    }
    
    console.log("\n📊 Phase 3: 用戶資產檢查");
    console.log("-".repeat(30));
    
    // Test 6: 檢查User1的Hero NFT
    try {
        const heroBalance = await heroContract.balanceOf(user1.address);
        const hasHero = heroBalance > 0;
        
        if (hasHero) {
            const tokenId = await heroContract.tokenOfOwnerByIndex(user1.address, 0);
            logTest("User1 Hero NFT檢查", true, 
                `擁有 ${heroBalance} 個Hero, 第一個TokenID: ${tokenId}`);
        } else {
            logTest("User1 Hero NFT檢查", false, "User1沒有Hero NFT，需要先鑄造");
        }
    } catch (error) {
        logTest("User1 Hero NFT檢查", false, error.message);
    }
    
    // Test 7: 檢查User2的TUSD1餘額
    try {
        const tusd1Balance = await tusd1Contract.balanceOf(user2.address);
        const oneToken = ethers.parseEther("1");
        const hasBalance = tusd1Balance >= oneToken;
        
        logTest("User2 TUSD1餘額檢查", hasBalance, 
            `餘額: ${ethers.formatEther(tusd1Balance)} TUSD1`);
    } catch (error) {
        logTest("User2 TUSD1餘額檢查", false, error.message);
    }
    
    console.log("\n📊 Phase 4: 核心功能測試");
    console.log("-".repeat(30));
    
    // Test 8: 創建列表測試 (如果User1有NFT)
    try {
        const heroBalance = await heroContract.balanceOf(user1.address);
        
        if (heroBalance > 0) {
            const tokenId = await heroContract.tokenOfOwnerByIndex(user1.address, 0);
            
            // 檢查批准狀態
            const isApprovedForAll = await heroContract.isApprovedForAll(user1.address, MARKETPLACE_V2);
            
            if (!isApprovedForAll) {
                console.log("   正在批准NFT...");
                const approveTx = await heroContract.connect(user1).setApprovalForAll(MARKETPLACE_V2, true);
                await waitForTransaction(approveTx, "批准NFT給市場合約");
            }
            
            // 創建列表
            const price = ethers.parseEther("5"); // 5 USD
            const acceptedTokens = [TUSD1_ADDRESS];
            
            console.log("   正在創建列表...");
            const createTx = await marketplace.connect(user1).createListing(
                0, // NFTType.HERO
                HERO_CONTRACT,
                tokenId,
                price,
                acceptedTokens
            );
            
            const receipt = await waitForTransaction(createTx, "創建NFT列表");
            
            // 解析事件
            const event = receipt.events?.find(e => e.event === 'ListingCreated');
            if (event) {
                logTest("創建列表功能", true, 
                    `列表ID: ${event.args.listingId}, 價格: ${ethers.formatEther(event.args.price)} USD`);
                
                // 等待幾秒讓子圖處理
                console.log("   等待子圖索引...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Test 9: 驗證子圖是否捕獲了列表
                const listingData = await querySubgraph(`
                    {
                        marketListingV2S(
                            where: { listingId: "${event.args.listingId}" }
                        ) {
                            id
                            listingId
                            seller
                            price
                            isActive
                        }
                    }
                `, "驗證新列表在子圖中");
                
                if (listingData && listingData.marketListingV2S.length > 0) {
                    logTest("子圖列表索引驗證", true, 
                        `子圖成功索引列表 ${event.args.listingId}`);
                } else {
                    logTest("子圖列表索引驗證", false, "子圖未能索引新列表");
                }
            } else {
                logTest("創建列表功能", false, "未找到ListingCreated事件");
            }
            
        } else {
            logTest("創建列表功能", false, "User1沒有Hero NFT可供列表");
        }
        
    } catch (error) {
        logTest("創建列表功能", false, error.message);
    }
    
    console.log("\n📊 Phase 5: 統計數據驗證");
    console.log("-".repeat(30));
    
    // Test 10: 檢查全域統計
    const statsData = await querySubgraph(`
        {
            marketStatsV2(id: "global") {
                totalListings
                activeListings
                totalSales
                totalVolume
            }
        }
    `, "全域市場統計");
    
    if (statsData && statsData.marketStatsV2) {
        const stats = statsData.marketStatsV2;
        logTest("全域統計數據查詢", true, 
            `總列表: ${stats.totalListings}, 活躍: ${stats.activeListings}, 銷售: ${stats.totalSales}`);
    } else {
        logTest("全域統計數據查詢", false, "無法查詢統計數據");
    }
    
    console.log("\n"+"=".repeat(50));
    console.log("🎯 測試總結");
    console.log("=".repeat(50));
    
    console.log(`✅ 通過: ${testResults.passed} 項`);
    console.log(`❌ 失敗: ${testResults.failed} 項`);
    console.log(`📊 總計: ${testResults.tests.length} 項測試`);
    
    const successRate = (testResults.passed / testResults.tests.length * 100).toFixed(1);
    console.log(`📈 成功率: ${successRate}%`);
    
    if (testResults.failed > 0) {
        console.log("\n❌ 失敗的測試:");
        testResults.tests.filter(t => !t.success).forEach(test => {
            console.log(`   • ${test.name}: ${test.details}`);
        });
    }
    
    console.log("\n🔗 相關連結:");
    console.log(`📊 Subgraph Studio: https://thegraph.com/studio/subgraph/dungeondelvers-p2p-marketplace`);
    console.log(`🔍 查詢端點: ${SUBGRAPH_URL}`);
    console.log(`📜 Marketplace合約: https://bscscan.com/address/${MARKETPLACE_V2}`);
    
    if (successRate >= 80) {
        console.log("\n🎉 測試環境狀態良好，可以進行完整功能測試！");
    } else {
        console.log("\n⚠️ 測試環境需要一些調整才能進行完整測試");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n💥 測試執行失敗:", error);
        process.exit(1);
    });
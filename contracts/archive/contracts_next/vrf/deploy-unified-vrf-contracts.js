// deploy-unified-vrf-contracts.js - 部署統一 VRF 合約的腳本
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 開始部署統一 VRF 合約 (所有操作都使用 VRF，統一稀有度機率)...");

    // 獲取部署者帳戶
    const [deployer] = await ethers.getSigners();
    console.log("📝 部署者地址:", deployer.address);
    console.log("💰 部署者 BNB 餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

    // BSC 主網 VRF v2.5 配置
    const BSC_VRF_CONFIG = {
        wrapperAddress: "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94", // BSC 主網 VRF Wrapper
        linkToken: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",      // BSC 主網 LINK
        coordinatorAddress: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"  // VRF Coordinator
    };

    console.log("🔧 BSC 主網 VRF v2.5 統一配置:");
    console.log("  - VRF Wrapper:", BSC_VRF_CONFIG.wrapperAddress);
    console.log("  - LINK Token:", BSC_VRF_CONFIG.linkToken);
    console.log("  - VRF Coordinator:", BSC_VRF_CONFIG.coordinatorAddress);
    console.log("  - 策略: 統一使用 VRF，統一稀有度機率");
    console.log("  - 稀有度分布: 44% 1星, 35% 2星, 15% 3星, 5% 4星, 1% 5星");

    // 檢查 LINK 代幣餘額
    const linkTokenABI = [
        "function balanceOf(address owner) external view returns (uint256)"
    ];
    
    const linkToken = new ethers.Contract(BSC_VRF_CONFIG.linkToken, linkTokenABI, deployer);
    const linkBalance = await linkToken.balanceOf(deployer.address);
    console.log("🔗 部署者 LINK 餘額:", ethers.formatEther(linkBalance), "LINK");

    const deploymentResults = {
        network: "BSC Mainnet (Chain ID: 56)",
        deployer: deployer.address,
        vrfConfig: BSC_VRF_CONFIG,
        strategy: "Unified VRF with Consistent Rarity",
        rarityDistribution: {
            rarity1: "44%",
            rarity2: "35%", 
            rarity3: "15%",
            rarity4: "5%",
            rarity5: "1%"
        },
        deploymentTime: new Date().toISOString(),
        contracts: {}
    };

    try {
        // 1. 部署 AltarOfAscension_UnifiedVRF
        console.log("\n📦 部署 AltarOfAscension_UnifiedVRF...");
        const AltarUnifiedVRF = await ethers.getContractFactory("AltarOfAscension_UnifiedVRF");
        const altarUnifiedVRF = await AltarUnifiedVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await altarUnifiedVRF.waitForDeployment();
        const altarUnifiedVRFAddress = await altarUnifiedVRF.getAddress();
        
        deploymentResults.contracts.AltarOfAscension_UnifiedVRF = {
            address: altarUnifiedVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ AltarOfAscension_UnifiedVRF 部署成功:", altarUnifiedVRFAddress);

        // 2. 部署 Hero_UnifiedVRF
        console.log("\n📦 部署 Hero_UnifiedVRF...");
        const HeroUnifiedVRF = await ethers.getContractFactory("Hero_UnifiedVRF");
        const heroUnifiedVRF = await HeroUnifiedVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await heroUnifiedVRF.waitForDeployment();
        const heroUnifiedVRFAddress = await heroUnifiedVRF.getAddress();
        
        deploymentResults.contracts.Hero_UnifiedVRF = {
            address: heroUnifiedVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ Hero_UnifiedVRF 部署成功:", heroUnifiedVRFAddress);

        // 3. 部署 Relic_UnifiedVRF
        console.log("\n📦 部署 Relic_UnifiedVRF...");
        const RelicUnifiedVRF = await ethers.getContractFactory("Relic_UnifiedVRF");
        const relicUnifiedVRF = await RelicUnifiedVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await relicUnifiedVRF.waitForDeployment();
        const relicUnifiedVRFAddress = await relicUnifiedVRF.getAddress();
        
        deploymentResults.contracts.Relic_UnifiedVRF = {
            address: relicUnifiedVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ Relic_UnifiedVRF 部署成功:", relicUnifiedVRFAddress);

        // 4. 部署 DungeonMaster_UnifiedVRF
        console.log("\n📦 部署 DungeonMaster_UnifiedVRF...");
        const DungeonMasterUnifiedVRF = await ethers.getContractFactory("DungeonMaster_UnifiedVRF");
        const dungeonMasterUnifiedVRF = await DungeonMasterUnifiedVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await dungeonMasterUnifiedVRF.waitForDeployment();
        const dungeonMasterUnifiedVRFAddress = await dungeonMasterUnifiedVRF.getAddress();
        
        deploymentResults.contracts.DungeonMaster_UnifiedVRF = {
            address: dungeonMasterUnifiedVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ DungeonMaster_UnifiedVRF 部署成功:", dungeonMasterUnifiedVRFAddress);

        // 驗證合約
        console.log("\n🔍 驗證合約...");
        const contracts = [
            { name: "AltarOfAscension_UnifiedVRF", address: altarUnifiedVRFAddress },
            { name: "Hero_UnifiedVRF", address: heroUnifiedVRFAddress },
            { name: "Relic_UnifiedVRF", address: relicUnifiedVRFAddress },
            { name: "DungeonMaster_UnifiedVRF", address: dungeonMasterUnifiedVRFAddress }
        ];

        for (const contract of contracts) {
            try {
                await hre.run("verify:verify", {
                    address: contract.address,
                    constructorArguments: [
                        deployer.address,
                        BSC_VRF_CONFIG.wrapperAddress,
                        BSC_VRF_CONFIG.linkToken
                    ],
                });
                console.log(`✅ ${contract.name} 驗證成功`);
            } catch (error) {
                console.log(`⚠️ ${contract.name} 驗證失敗:`, error.message);
            }
        }

        // 保存部署信息
        console.log("\n📋 統一 VRF 部署信息:");
        console.log("==================");
        Object.entries(deploymentResults.contracts).forEach(([name, info]) => {
            console.log(`${name}: ${info.address}`);
        });
        console.log("部署者:", deploymentResults.deployer);
        console.log("網絡:", deploymentResults.network);
        console.log("策略:", deploymentResults.strategy);
        console.log("VRF Wrapper:", BSC_VRF_CONFIG.wrapperAddress);
        console.log("LINK Token:", BSC_VRF_CONFIG.linkToken);
        console.log("==================");

        // 保存到文件
        const fs = require('fs');
        const deploymentFile = `deployment-unified-vrf-${Date.now()}.json`;
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2));
        console.log(`💾 部署信息已保存到: ${deploymentFile}`);

        console.log("\n🎉 所有統一 VRF 合約部署完成!");
        
        console.log("\n🔧 後續配置步驟:");
        console.log("==================");
        console.log("1. 設置各合約的依賴地址:");
        console.log(`   await heroUnifiedVRF.setDungeonCore("${process.env.DUNGEONCORE_ADDRESS}");`);
        console.log(`   await heroUnifiedVRF.setSoulShardToken("${process.env.SOULSHARD_ADDRESS}");`);
        console.log(`   await relicUnifiedVRF.setDungeonCore("${process.env.DUNGEONCORE_ADDRESS}");`);
        console.log(`   await relicUnifiedVRF.setSoulShardToken("${process.env.SOULSHARD_ADDRESS}");`);
        console.log("");
        console.log("2. 設置升級系統權限:");
        console.log(`   await heroUnifiedVRF.setAscensionAltarAddress("${altarUnifiedVRFAddress}");`);
        console.log(`   await relicUnifiedVRF.setAscensionAltarAddress("${altarUnifiedVRFAddress}");`);
        console.log(`   await altarUnifiedVRF.setContracts("${process.env.DUNGEONCORE_ADDRESS}", "${heroUnifiedVRFAddress}", "${relicUnifiedVRFAddress}");`);
        console.log("");
        console.log("3. 設置地城系統:");
        console.log(`   await dungeonMasterUnifiedVRF.setDungeonCore("${process.env.DUNGEONCORE_ADDRESS}");`);
        console.log(`   await dungeonMasterUnifiedVRF.setDungeonStorage("${process.env.DUNGEONSTORAGE_ADDRESS}");`);
        console.log(`   await dungeonMasterUnifiedVRF.setSoulShardToken("${process.env.SOULSHARD_ADDRESS}");`);
        console.log("");
        console.log("4. 設置元數據 URI:");
        console.log(`   await heroUnifiedVRF.setBaseURI("https://api.dungeondelvers.com/heroes/");`);
        console.log(`   await relicUnifiedVRF.setBaseURI("https://api.dungeondelvers.com/relics/");`);

        console.log("\n💡 統一 VRF 策略優勢:");
        console.log("- 🔒 完全安全：所有隨機性都來自 Chainlink VRF");
        console.log("- 🎯 公平一致：1個和50個 NFT 都有相同的稀有度機率");
        console.log("- 💰 透明成本：用戶明確知道每次操作的 VRF 費用");
        console.log("- ⚡ 簡化邏輯：移除複雜的閾值判斷，專注於安全性");
        console.log("- 🛡️ 防攻擊：完全消除隨機數操控漏洞");

        console.log("\n📊 預期成本 (BSC 主網):");
        console.log("- 鑄造 1個 NFT: ~$0.65 (VRF $0.6 + Gas $0.05)");
        console.log("- 鑄造 10個 NFT: ~$0.90 (VRF $0.6 + Gas $0.30)");
        console.log("- 鑄造 50個 NFT: ~$2.10 (VRF $0.6 + Gas $1.50)");
        console.log("- 升級 NFT: ~$0.65 (VRF $0.6 + Gas $0.05)");
        console.log("- 地城探索: ~$0.62 (VRF $0.6 + Gas $0.02)");

        console.log("\n⚠️ 重要提醒:");
        console.log("- 所有操作都需要等待 30-60 秒 VRF 響應");
        console.log("- 確保合約有足夠的 BNB 支付 VRF 費用");
        console.log("- 前端需要顯示 VRF 等待狀態和進度");
        console.log("- 建議先在測試網充分測試所有功能");
        console.log("- 提供取消過期請求的機制給用戶");

        console.log("\n🎯 稀有度機率驗證:");
        console.log("- 1星 (44%): 普通裝備，大量產出");
        console.log("- 2星 (35%): 進階裝備，適中產出");
        console.log("- 3星 (15%): 稀有裝備，少量產出");
        console.log("- 4星 (5%): 史詩裝備，珍貴產出");
        console.log("- 5星 (1%): 傳說裝備，極其稀有");
        console.log("- 總計: 100% (所有鑄造數量都使用相同分布)");

        return deploymentResults;

    } catch (error) {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    }
}

// 錯誤處理
main().catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
});

module.exports = main;
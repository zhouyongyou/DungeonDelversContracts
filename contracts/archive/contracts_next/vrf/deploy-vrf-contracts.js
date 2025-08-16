// deploy-vrf-contracts.js - 部署 VRF 整合合約的腳本
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 開始部署 VRF 整合合約...");

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

    console.log("🔧 BSC 主網 VRF v2.5 配置:");
    console.log("  - VRF Wrapper:", BSC_VRF_CONFIG.wrapperAddress);
    console.log("  - LINK Token:", BSC_VRF_CONFIG.linkToken);
    console.log("  - VRF Coordinator:", BSC_VRF_CONFIG.coordinatorAddress);

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
        deploymentTime: new Date().toISOString(),
        contracts: {}
    };

    try {
        // 1. 部署 AltarOfAscension_VRF
        console.log("\n📦 部署 AltarOfAscension_VRF...");
        const AltarVRF = await ethers.getContractFactory("AltarOfAscension_VRF");
        const altarVRF = await AltarVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await altarVRF.waitForDeployment();
        const altarVRFAddress = await altarVRF.getAddress();
        
        deploymentResults.contracts.AltarOfAscension_VRF = {
            address: altarVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ AltarOfAscension_VRF 部署成功:", altarVRFAddress);

        // 2. 部署 Hero_VRF
        console.log("\n📦 部署 Hero_VRF...");
        const HeroVRF = await ethers.getContractFactory("Hero_VRF");
        const heroVRF = await HeroVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await heroVRF.waitForDeployment();
        const heroVRFAddress = await heroVRF.getAddress();
        
        deploymentResults.contracts.Hero_VRF = {
            address: heroVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ Hero_VRF 部署成功:", heroVRFAddress);

        // 3. 部署 Relic_VRF
        console.log("\n📦 部署 Relic_VRF...");
        const RelicVRF = await ethers.getContractFactory("Relic_VRF");
        const relicVRF = await RelicVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await relicVRF.waitForDeployment();
        const relicVRFAddress = await relicVRF.getAddress();
        
        deploymentResults.contracts.Relic_VRF = {
            address: relicVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ Relic_VRF 部署成功:", relicVRFAddress);

        // 4. 部署 DungeonMaster_VRF
        console.log("\n📦 部署 DungeonMaster_VRF...");
        const DungeonMasterVRF = await ethers.getContractFactory("DungeonMaster_VRF");
        const dungeonMasterVRF = await DungeonMasterVRF.deploy(
            deployer.address,                // initialOwner
            BSC_VRF_CONFIG.wrapperAddress,  // wrapperAddress
            BSC_VRF_CONFIG.linkToken        // linkToken
        );
        await dungeonMasterVRF.waitForDeployment();
        const dungeonMasterVRFAddress = await dungeonMasterVRF.getAddress();
        
        deploymentResults.contracts.DungeonMaster_VRF = {
            address: dungeonMasterVRFAddress,
            constructorArgs: [
                deployer.address,
                BSC_VRF_CONFIG.wrapperAddress,
                BSC_VRF_CONFIG.linkToken
            ]
        };
        
        console.log("✅ DungeonMaster_VRF 部署成功:", dungeonMasterVRFAddress);

        // 驗證合約
        console.log("\n🔍 驗證合約...");
        const contracts = [
            { name: "AltarOfAscension_VRF", address: altarVRFAddress },
            { name: "Hero_VRF", address: heroVRFAddress },
            { name: "Relic_VRF", address: relicVRFAddress },
            { name: "DungeonMaster_VRF", address: dungeonMasterVRFAddress }
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
        console.log("\n📋 部署信息:");
        console.log("==================");
        Object.entries(deploymentResults.contracts).forEach(([name, info]) => {
            console.log(`${name}: ${info.address}`);
        });
        console.log("部署者:", deploymentResults.deployer);
        console.log("網絡:", deploymentResults.network);
        console.log("VRF Wrapper:", BSC_VRF_CONFIG.wrapperAddress);
        console.log("LINK Token:", BSC_VRF_CONFIG.linkToken);
        console.log("==================");

        // 保存到文件
        const fs = require('fs');
        const deploymentFile = `deployment-vrf-contracts-${Date.now()}.json`;
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2));
        console.log(`💾 部署信息已保存到: ${deploymentFile}`);

        console.log("\n🎉 所有 VRF 合約部署完成!");
        
        console.log("\n🔧 後續配置步驟:");
        console.log("==================");
        console.log("1. 設置各合約的依賴地址 (DungeonCore, SoulShard 等)");
        console.log("2. 配置 VRF 參數 (閾值、費用等)");
        console.log("3. 設置權限 (如 ascensionAltarAddress)");
        console.log("4. 測試 VRF 功能");
        console.log("5. 考慮逐步遷移現有合約");

        console.log("\n💡 VRF 整合優勢:");
        console.log("- 🔒 真隨機性，防止操控");
        console.log("- 💰 玩家付費模式，無需預付 LINK");
        console.log("- ⚡ 自動切換，小量使用偽隨機節省成本");
        console.log("- 🛡️ 支援緊急備用模式");
        console.log("- 📊 完整的請求追蹤和取消機制");

        console.log("\n⚠️ 注意事項:");
        console.log("- VRF 請求需要等待 30-60 秒");
        console.log("- 確保合約有足夠的 BNB/LINK 支付 VRF 費用");
        console.log("- 測試網和主網使用不同的 VRF Wrapper 地址");
        console.log("- 建議先在測試網充分測試");

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
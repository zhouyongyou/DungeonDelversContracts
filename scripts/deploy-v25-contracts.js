// deploy-v25-contracts.js
// 部署腳本 - 8 個核心合約的完整部署流程
// 基於實際合約代碼分析，而非猜測

const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 開始 V25 合約完整部署流程");
    console.log("=" + "=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("🏭 部署者地址:", deployer.address);
    console.log("💰 部署者餘額:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
    
    // 網路驗證
    const network = await ethers.provider.getNetwork();
    console.log("🌐 部署網路:", network.name, "Chain ID:", network.chainId.toString());
    
    if (network.chainId !== 56n) {
        console.log("⚠️  警告：非 BSC 主網部署");
    }
    
    console.log("\n📋 部署計劃：8 個核心合約");
    console.log("1. DungeonCore (已存在，無需重新部署)");
    console.log("2. AltarOfAscension");
    console.log("3. DungeonMaster");
    console.log("4. VRFConsumerV2Plus");
    console.log("5. Relic");
    console.log("6. Hero");
    console.log("7. PlayerProfile");
    console.log("8. VIPStaking");
    console.log("9. Party");
    
    const deployedContracts = {};
    
    // === 依賴順序部署 ===
    
    // Step 1: DungeonCore 假設已存在
    const DUNGEONCORE_ADDRESS = process.env.DUNGEONCORE_ADDRESS;
    if (!DUNGEONCORE_ADDRESS) {
        throw new Error("❌ 需要設置 DUNGEONCORE_ADDRESS 環境變數");
    }
    deployedContracts.DungeonCore = DUNGEONCORE_ADDRESS;
    console.log("✅ DungeonCore 地址:", DUNGEONCORE_ADDRESS);
    
    // Step 2: VRFConsumerV2Plus - 獨立合約，可先部署
    console.log("\n🎲 部署 VRFConsumerV2Plus...");
    const VRFConsumerFactory = await ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfConsumer = await VRFConsumerFactory.deploy();
    await vrfConsumer.waitForDeployment();
    const vrfAddress = await vrfConsumer.getAddress();
    deployedContracts.VRFConsumerV2Plus = vrfAddress;
    console.log("✅ VRFConsumerV2Plus 已部署:", vrfAddress);
    
    // Step 3: AltarOfAscension - 需要 VRF，所以在 VRF 後部署
    console.log("\n⛪ 部署 AltarOfAscension...");
    const AltarFactory = await ethers.getContractFactory("AltarOfAscension");
    const altar = await AltarFactory.deploy();
    await altar.waitForDeployment();
    const altarAddress = await altar.getAddress();
    deployedContracts.AltarOfAscension = altarAddress;
    console.log("✅ AltarOfAscension 已部署:", altarAddress);
    
    // Step 4: DungeonMaster
    console.log("\n🏰 部署 DungeonMaster...");
    const DungeonMasterFactory = await ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = await DungeonMasterFactory.deploy();
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    deployedContracts.DungeonMaster = dungeonMasterAddress;
    console.log("✅ DungeonMaster 已部署:", dungeonMasterAddress);
    
    // Step 5: PlayerProfile
    console.log("\n👤 部署 PlayerProfile...");
    const PlayerProfileFactory = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfileFactory.deploy();
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    deployedContracts.PlayerProfile = playerProfileAddress;
    console.log("✅ PlayerProfile 已部署:", playerProfileAddress);
    
    // Step 6: VIPStaking
    console.log("\n💎 部署 VIPStaking...");
    const VIPStakingFactory = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStakingFactory.deploy();
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    deployedContracts.VIPStaking = vipStakingAddress;
    console.log("✅ VIPStaking 已部署:", vipStakingAddress);
    
    // Step 7: Hero NFT (需要檢查構造函數參數)
    console.log("\n⚔️ 部署 Hero...");
    try {
        const HeroFactory = await ethers.getContractFactory("Hero");
        const hero = await HeroFactory.deploy();
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        deployedContracts.Hero = heroAddress;
        console.log("✅ Hero 已部署:", heroAddress);
    } catch (error) {
        console.error("❌ Hero 部署失敗:", error.message);
        if (error.message.includes("constructor")) {
            console.log("💡 提示：Hero 合約可能需要構造函數參數");
        }
    }
    
    // Step 8: Relic NFT (需要檢查構造函數參數)
    console.log("\n🏺 部署 Relic...");
    try {
        const RelicFactory = await ethers.getContractFactory("Relic");
        const relic = await RelicFactory.deploy();
        await relic.waitForDeployment();
        const relicAddress = await relic.getAddress();
        deployedContracts.Relic = relicAddress;
        console.log("✅ Relic 已部署:", relicAddress);
    } catch (error) {
        console.error("❌ Relic 部署失敗:", error.message);
        if (error.message.includes("constructor")) {
            console.log("💡 提示：Relic 合約可能需要構造函數參數");
        }
    }
    
    // Step 9: Party NFT
    console.log("\n👥 部署 Party...");
    const PartyFactory = await ethers.getContractFactory("Party");
    const party = await PartyFactory.deploy();
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    deployedContracts.Party = partyAddress;
    console.log("✅ Party 已部署:", partyAddress);
    
    // === 部署總結 ===
    console.log("\n" + "=".repeat(60));
    console.log("📊 部署完成總結");
    console.log("=".repeat(60));
    
    const deploymentRecord = {
        network: {
            name: network.name,
            chainId: network.chainId.toString(),
            deployer: deployer.address
        },
        timestamp: new Date().toISOString(),
        contracts: deployedContracts,
        gasUsed: {
            // 可以在每個部署後記錄 gas 使用量
        }
    };
    
    // 按類別顯示
    console.log("\n🏛️ 核心合約:");
    console.log("  DungeonCore:", deployedContracts.DungeonCore || "❌ 未部署");
    
    console.log("\n🎮 遊戲邏輯合約:");
    console.log("  AltarOfAscension:", deployedContracts.AltarOfAscension || "❌ 未部署");
    console.log("  DungeonMaster:", deployedContracts.DungeonMaster || "❌ 未部署");
    console.log("  VRFConsumerV2Plus:", deployedContracts.VRFConsumerV2Plus || "❌ 未部署");
    
    console.log("\n🎨 NFT 合約:");
    console.log("  Hero:", deployedContracts.Hero || "❌ 未部署");
    console.log("  Relic:", deployedContracts.Relic || "❌ 未部署");
    console.log("  Party:", deployedContracts.Party || "❌ 未部署");
    
    console.log("\n🎯 用戶系統合約:");
    console.log("  PlayerProfile:", deployedContracts.PlayerProfile || "❌ 未部署");
    console.log("  VIPStaking:", deployedContracts.VIPStaking || "❌ 未部署");
    
    // 保存部署記錄
    const fs = require('fs');
    const recordPath = `deployments/v25-deployment-${Date.now()}.json`;
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    console.log("\n💾 部署記錄已保存:", recordPath);
    
    // 生成環境變數文件
    console.log("\n🔧 生成環境變數配置:");
    let envContent = "# V25 Deployment Environment Variables\n";
    envContent += `# Generated on ${new Date().toISOString()}\n\n`;
    
    Object.entries(deployedContracts).forEach(([name, address]) => {
        if (address) {
            const envName = name.toUpperCase() + "_ADDRESS";
            envContent += `${envName}=${address}\n`;
        }
    });
    
    fs.writeFileSync('.env.v25.deployment', envContent);
    console.log("✅ 環境變數文件已生成: .env.v25.deployment");
    
    console.log("\n🎯 下一步骤:");
    console.log("1. 執行驗證腳本: npm run verify-contracts");
    console.log("2. 執行互連設置腳本: npm run setup-interconnections");
    console.log("3. 測試合約功能");
    
    return deployedContracts;
}

// 錯誤處理和重試機制
main()
    .then((deployedContracts) => {
        console.log("\n🎉 部署流程完成!");
        
        // 檢查是否有失敗的合約
        const failedContracts = [];
        const expectedContracts = [
            'AltarOfAscension', 'DungeonMaster', 'VRFConsumerV2Plus', 
            'Relic', 'Hero', 'PlayerProfile', 'VIPStaking', 'Party'
        ];
        
        expectedContracts.forEach(name => {
            if (!deployedContracts[name]) {
                failedContracts.push(name);
            }
        });
        
        if (failedContracts.length > 0) {
            console.log("\n⚠️  部分合約部署失敗:");
            failedContracts.forEach(name => {
                console.log("  ❌", name);
            });
            console.log("\n💡 請檢查錯誤信息並手動重新部署失敗的合約");
        }
        
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 部署流程失敗:");
        console.error(error);
        
        // 提供問題排查指引
        console.log("\n🔧 問題排查指引:");
        console.log("1. 檢查 BSC 網路連接");
        console.log("2. 確認部署者帳戶有足夠的 BNB");
        console.log("3. 檢查合約編譯是否成功: npm run compile");
        console.log("4. 檢查環境變數 PRIVATE_KEY 是否正確設置");
        
        process.exit(1);
    });
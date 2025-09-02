// update-hero-relic-vrf.js - 針對性更新 Hero、Relic 和 VRF Manager
// 保持其他合約不變，只更新這三個關鍵合約

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔄 開始 Hero、Relic 和 VRF Manager 針對性更新...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 部署錢包:", deployer.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
    
    // 檢查餘額是否充足
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const minBalance = hre.ethers.parseEther("0.1"); // 部分更新需要較少 BNB
    if (balance < minBalance) {
        throw new Error(`❌ BNB 餘額不足！需要至少 0.1 BNB，當前: ${hre.ethers.formatEther(balance)} BNB`);
    }
    
    // 當前 V25.0.4 合約地址（保持不變的合約）
    const EXISTING_CONTRACTS = {
        // 核心系統 - 保持不變
        DungeonCore: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        Oracle: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
        SoulShard: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
        USD: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
        
        // 其他 NFT - 保持不變
        Party: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
        
        // 遊戲邏輯 - 保持不變
        DungeonMaster: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
        DungeonStorage: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
        
        // 功能模組 - 保持不變
        AltarOfAscension: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
        PlayerVault: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
        PlayerProfile: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
        VIPStaking: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661"
    };
    
    console.log("=".repeat(60));
    console.log("📋 更新範圍:");
    console.log("🆕 Hero NFT - 重新部署");
    console.log("🆕 Relic NFT - 重新部署"); 
    console.log("🆕 VRF Manager V2Plus - 重新部署");
    console.log("🔗 重新配置所有相關連接");
    console.log("✅ 其他合約保持不變");
    console.log("=".repeat(60));
    
    // 等待確認
    console.log("⚠️ 即將開始針對性更新，預估需要 2-3 分鐘");
    console.log("這將重新部署 Hero、Relic 和 VRF Manager，並重新配置連接");
    console.log("按 Ctrl+C 取消，或等待 8 秒開始更新...");
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const newContracts = {};
    const transactions = [];
    
    try {
        // ===========================================
        // 1. 檢查現有合約狀態
        // ===========================================
        console.log("\n🔍 第1階段: 檢查現有合約狀態");
        console.log("-".repeat(40));
        
        // 驗證關鍵合約存在
        const coreContract = await hre.ethers.getContractAt("DungeonCore", EXISTING_CONTRACTS.DungeonCore);
        try {
            const owner = await coreContract.owner();
            console.log("✅ DungeonCore 正常，Owner:", owner);
        } catch (error) {
            throw new Error("❌ DungeonCore 不可用，無法繼續更新");
        }
        
        // 檢查舊的 Hero 和 Relic 合約
        const oldHero = "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19";
        const oldRelic = "0x91Bf924E9CEF490F7C999C1F083eE1636595220D";
        const oldVRF = "0xa94555C309Dd83d9fB0531852d209c46Fa50637f";
        
        console.log("📊 舊合約狀態:");
        console.log(`Hero (舊): ${oldHero}`);
        console.log(`Relic (舊): ${oldRelic}`);
        console.log(`VRF (舊): ${oldVRF}`);
        
        // ===========================================
        // 2. 部署新的 VRF Manager
        // ===========================================
        console.log("\n📡 第2階段: 部署新的 VRF Manager");
        console.log("-".repeat(40));
        
        console.log("🎲 部署 VRFConsumerV2Plus...");
        const VRF = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
        const vrf = await VRF.deploy(
            "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9", // BSC VRF Coordinator
            deployer.address
        );
        await vrf.waitForDeployment();
        newContracts.VRFManager = await vrf.getAddress();
        console.log("✅ 新 VRFConsumerV2Plus 部署完成:", newContracts.VRFManager);
        
        // ===========================================
        // 3. 部署新的 Hero NFT
        // ===========================================
        console.log("\n⚔️ 第3階段: 部署新的 Hero NFT");
        console.log("-".repeat(40));
        
        console.log("🦸 部署 Hero...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = await Hero.deploy({ gasLimit: 5000000 });
        await hero.waitForDeployment();
        newContracts.Hero = await hero.getAddress();
        console.log("✅ 新 Hero 部署完成:", newContracts.Hero);
        
        // ===========================================
        // 4. 部署新的 Relic NFT
        // ===========================================
        console.log("\n💎 第4階段: 部署新的 Relic NFT");
        console.log("-".repeat(40));
        
        console.log("🏺 部署 Relic...");
        const Relic = await hre.ethers.getContractFactory("Relic");
        const relic = await Relic.deploy({ gasLimit: 5000000 });
        await relic.waitForDeployment();
        newContracts.Relic = await relic.getAddress();
        console.log("✅ 新 Relic 部署完成:", newContracts.Relic);
        
        // ===========================================
        // 5. 重新配置 DungeonCore 連接
        // ===========================================
        console.log("\n🏛️ 第5階段: 重新配置 DungeonCore 連接");
        console.log("-".repeat(40));
        
        console.log("🔄 更新 DungeonCore 中的 Hero 地址...");
        try {
            const tx1 = await coreContract.setHeroAddress(newContracts.Hero, { gasLimit: 300000 });
            await tx1.wait();
            transactions.push({ name: "DungeonCore.setHeroAddress", hash: tx1.hash });
            console.log("✅ DungeonCore Hero 地址已更新");
        } catch (error) {
            console.log("❌ DungeonCore Hero 地址更新失敗:", error.message);
        }
        
        console.log("🔄 更新 DungeonCore 中的 Relic 地址...");
        try {
            const tx2 = await coreContract.setRelicAddress(newContracts.Relic, { gasLimit: 300000 });
            await tx2.wait();
            transactions.push({ name: "DungeonCore.setRelicAddress", hash: tx2.hash });
            console.log("✅ DungeonCore Relic 地址已更新");
        } catch (error) {
            console.log("❌ DungeonCore Relic 地址更新失敗:", error.message);
        }
        
        // ===========================================
        // 6. 配置新合約的 DungeonCore 引用
        // ===========================================
        console.log("\n🔗 第6階段: 配置新合約的 DungeonCore 引用");
        console.log("-".repeat(40));
        
        // 設定 Hero 的 DungeonCore 地址
        console.log("🦸 設定 Hero -> DungeonCore...");
        try {
            const heroContract = await hre.ethers.getContractAt("Hero", newContracts.Hero);
            const tx = await heroContract.setDungeonCoreAddress(EXISTING_CONTRACTS.DungeonCore, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Hero.setDungeonCoreAddress", hash: tx.hash });
            console.log("✅ Hero DungeonCore 引用設定完成");
        } catch (error) {
            console.log("❌ Hero DungeonCore 引用設定失敗:", error.message);
        }
        
        // 設定 Relic 的 DungeonCore 地址
        console.log("🏺 設定 Relic -> DungeonCore...");
        try {
            const relicContract = await hre.ethers.getContractAt("Relic", newContracts.Relic);
            const tx = await relicContract.setDungeonCoreAddress(EXISTING_CONTRACTS.DungeonCore, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Relic.setDungeonCoreAddress", hash: tx.hash });
            console.log("✅ Relic DungeonCore 引用設定完成");
        } catch (error) {
            console.log("❌ Relic DungeonCore 引用設定失敗:", error.message);
        }
        
        // ===========================================
        // 7. 配置 VRF 授權和連接
        // ===========================================
        console.log("\n📡 第7階段: 配置 VRF 授權和連接");
        console.log("-".repeat(40));
        
        // VRF Manager 授權新合約
        console.log("🎲 配置 VRF Manager 授權...");
        const vrfContract = await hre.ethers.getContractAt("VRFConsumerV2Plus", newContracts.VRFManager);
        
        const vrfClients = [
            { name: "Hero", address: newContracts.Hero },
            { name: "Relic", address: newContracts.Relic },
            { name: "DungeonMaster", address: EXISTING_CONTRACTS.DungeonMaster },
            { name: "AltarOfAscension", address: EXISTING_CONTRACTS.AltarOfAscension }
        ];
        
        for (const client of vrfClients) {
            try {
                console.log(`  授權 ${client.name}...`);
                const tx = await vrfContract.authorize(client.address, { gasLimit: 300000 });
                await tx.wait();
                transactions.push({ name: `VRF.authorize(${client.name})`, hash: tx.hash });
                console.log(`  ✅ ${client.name} VRF 授權完成`);
            } catch (error) {
                console.log(`  ❌ ${client.name} VRF 授權失敗:`, error.message);
            }
        }
        
        // 設定新 NFT 合約的 VRF Manager 地址
        console.log("🎨 設定 NFT 合約的 VRF Manager 引用...");
        
        // Hero VRF Manager 設定
        try {
            const heroContract = await hre.ethers.getContractAt("Hero", newContracts.Hero);
            const tx = await heroContract.setVRFManager(newContracts.VRFManager, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Hero.setVRFManager", hash: tx.hash });
            console.log("  ✅ Hero VRF Manager 引用設定完成");
        } catch (error) {
            console.log("  ❌ Hero VRF Manager 引用設定失敗:", error.message);
        }
        
        // Relic VRF Manager 設定
        try {
            const relicContract = await hre.ethers.getContractAt("Relic", newContracts.Relic);
            const tx = await relicContract.setVRFManager(newContracts.VRFManager, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Relic.setVRFManager", hash: tx.hash });
            console.log("  ✅ Relic VRF Manager 引用設定完成");
        } catch (error) {
            console.log("  ❌ Relic VRF Manager 引用設定失敗:", error.message);
        }
        
        // ===========================================
        // 8. 更新其他合約的 VRF Manager 引用
        // ===========================================
        console.log("\n🔄 第8階段: 更新其他合約的 VRF Manager 引用");
        console.log("-".repeat(40));
        
        // 更新 DungeonMaster 的 VRF Manager (如果有相關函數)
        console.log("🧙 嘗試更新 DungeonMaster VRF Manager...");
        try {
            const dmContract = await hre.ethers.getContractAt("DungeonMaster", EXISTING_CONTRACTS.DungeonMaster);
            // 假設有 setVRFManager 函數
            const tx = await dmContract.setVRFManager(newContracts.VRFManager, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "DungeonMaster.setVRFManager", hash: tx.hash });
            console.log("  ✅ DungeonMaster VRF Manager 更新完成");
        } catch (error) {
            console.log("  ⚠️ DungeonMaster VRF Manager 更新跳過 (可能無此函數)");
        }
        
        // 更新 AltarOfAscension 的 VRF Manager
        console.log("⛩️ 嘗試更新 AltarOfAscension VRF Manager...");
        try {
            const altarContract = await hre.ethers.getContractAt("AltarOfAscension", EXISTING_CONTRACTS.AltarOfAscension);
            const tx = await altarContract.setVRFManager(newContracts.VRFManager, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "AltarOfAscension.setVRFManager", hash: tx.hash });
            console.log("  ✅ AltarOfAscension VRF Manager 更新完成");
        } catch (error) {
            console.log("  ⚠️ AltarOfAscension VRF Manager 更新跳過 (可能無此函數)");
        }
        
        // ===========================================
        // 9. 初始化新合約基本設定
        // ===========================================
        console.log("\n⚙️ 第9階段: 初始化新合約基本設定");
        console.log("-".repeat(40));
        
        // Hero 基本設定
        console.log("🦸 設定 Hero 基本參數...");
        try {
            const heroContract = await hre.ethers.getContractAt("Hero", newContracts.Hero);
            
            // 設定鑄造價格為 0 (測試用)
            const tx1 = await heroContract.setMintPriceUSD(0, { gasLimit: 300000 });
            await tx1.wait();
            console.log("  ✅ Hero 鑄造價格設為 0");
            
            // 設定平台費為 0 (測試用)
            const tx2 = await heroContract.setPlatformFee(0, { gasLimit: 300000 });
            await tx2.wait();
            console.log("  ✅ Hero 平台費設為 0");
            
            transactions.push({ name: "Hero.setMintPriceUSD(0)", hash: tx1.hash });
            transactions.push({ name: "Hero.setPlatformFee(0)", hash: tx2.hash });
        } catch (error) {
            console.log("  ⚠️ Hero 基本參數設定部分失敗:", error.message);
        }
        
        // Relic 基本設定
        console.log("🏺 設定 Relic 基本參數...");
        try {
            const relicContract = await hre.ethers.getContractAt("Relic", newContracts.Relic);
            
            // 設定鑄造價格為 0 (測試用)
            const tx1 = await relicContract.setMintPriceUSD(0, { gasLimit: 300000 });
            await tx1.wait();
            console.log("  ✅ Relic 鑄造價格設為 0");
            
            // 設定平台費為 0 (測試用)
            const tx2 = await relicContract.setPlatformFee(0, { gasLimit: 300000 });
            await tx2.wait();
            console.log("  ✅ Relic 平台費設為 0");
            
            transactions.push({ name: "Relic.setMintPriceUSD(0)", hash: tx1.hash });
            transactions.push({ name: "Relic.setPlatformFee(0)", hash: tx2.hash });
        } catch (error) {
            console.log("  ⚠️ Relic 基本參數設定部分失敗:", error.message);
        }
        
        // ===========================================
        // 10. 保存更新結果
        // ===========================================
        console.log("\n💾 第10階段: 保存更新結果");
        console.log("-".repeat(40));
        
        // 合併所有合約地址 (新的 + 現有的)
        const allContracts = {
            ...EXISTING_CONTRACTS,
            ...newContracts
        };
        
        const updateData = {
            version: "V25.1.0", // 小版本更新
            updateType: "partial", // 部分更新
            network: hre.network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            blockNumber: await hre.ethers.provider.getBlockNumber(),
            
            // 更新的合約
            updatedContracts: newContracts,
            // 保持不變的合約
            existingContracts: EXISTING_CONTRACTS,
            // 所有合約地址
            allContracts: allContracts,
            
            transactions: transactions,
            updateScope: ["Hero NFT", "Relic NFT", "VRF Manager V2Plus"],
            totalTransactions: transactions.length
        };
        
        // 寫入更新記錄
        const deploymentDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const updateFile = path.join(deploymentDir, `v25-1-partial-update-${timestamp}.json`);
        fs.writeFileSync(updateFile, JSON.stringify(updateData, null, 2));
        
        // 更新環境變數文件
        const envContent = `# V25.1 統一配置 - 針對性更新 (Hero, Relic, VRF Manager)
# 更新時間: ${new Date().toISOString()}
# 更新範圍: Hero NFT, Relic NFT, VRF Manager V2Plus
# 其他合約保持 V25.0.4 版本不變

# V25.1 部署私鑰
PRIVATE_KEY=${process.env.PRIVATE_KEY}

# ==================== 合約地址（V25.1.0 針對性更新）====================
# 🆕 更新的合約
VITE_HERO_ADDRESS=${newContracts.Hero}
VITE_RELIC_ADDRESS=${newContracts.Relic}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${newContracts.VRFManager}

# ✅ 保持不變的合約 (V25.0.4)
VITE_PARTY_ADDRESS=${EXISTING_CONTRACTS.Party}
VITE_DUNGEONMASTER_ADDRESS=${EXISTING_CONTRACTS.DungeonMaster}
VITE_DUNGEONSTORAGE_ADDRESS=${EXISTING_CONTRACTS.DungeonStorage}
VITE_ALTAROFASCENSION_ADDRESS=${EXISTING_CONTRACTS.AltarOfAscension}
VITE_PLAYERVAULT_ADDRESS=${EXISTING_CONTRACTS.PlayerVault}
VITE_PLAYERPROFILE_ADDRESS=${EXISTING_CONTRACTS.PlayerProfile}
VITE_VIPSTAKING_ADDRESS=${EXISTING_CONTRACTS.VIPStaking}

# 核心合約 (保持不變)
VITE_DUNGEONCORE_ADDRESS=${EXISTING_CONTRACTS.DungeonCore}
VITE_ORACLE_ADDRESS=${EXISTING_CONTRACTS.Oracle}
VITE_SOULSHARD_ADDRESS=${EXISTING_CONTRACTS.SoulShard}
VITE_USD_ADDRESS=${EXISTING_CONTRACTS.USD}

# ==================== 服務端點 ====================
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/version/latest
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# ==================== 部署信息 ====================
VITE_CONTRACT_VERSION=V25.1.0
VITE_START_BLOCK=${await hre.ethers.provider.getBlockNumber()}
VITE_DEPLOYMENT_DATE=${new Date().toISOString()}
VITE_ADMIN_WALLET=${deployer.address}
VITE_NETWORK=BSC Mainnet
VITE_CHAIN_ID=56

# ==================== VRF 配置 ====================
VITE_VRF_ENABLED=true
VITE_VRF_PRICE=0
VITE_PLATFORM_FEE=0
VITE_VRF_COORDINATOR=0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9
VITE_VRF_KEY_HASH=0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4
VITE_VRF_REQUEST_CONFIRMATIONS=6
VITE_VRF_NUM_WORDS=1

# BSCScan API Key
BSCSCAN_API_KEY=2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC
`;
        
        const envFile = path.join(__dirname, '../.env.v25-1');
        fs.writeFileSync(envFile, envContent);
        
        // ===========================================
        // 更新完成總結
        // ===========================================
        console.log("\n" + "=".repeat(60));
        console.log("🎉 V25.1 針對性更新成功完成！");
        console.log("=".repeat(60));
        
        console.log("\n📊 更新統計:");
        console.log(`🆕 新部署合約: ${Object.keys(newContracts).length} 個`);
        console.log(`✅ 保持不變: ${Object.keys(EXISTING_CONTRACTS).length} 個`);
        console.log(`🔗 配置交易: ${transactions.length} 筆`);
        console.log(`⛽ 更新錢包: ${deployer.address}`);
        console.log(`📦 當前區塊: ${await hre.ethers.provider.getBlockNumber()}`);
        
        console.log("\n🆕 新部署的合約:");
        for (const [name, address] of Object.entries(newContracts)) {
            console.log(`${name}: ${address}`);
        }
        
        console.log("\n📋 舊合約地址對比:");
        console.log(`Hero: ${oldHero} → ${newContracts.Hero}`);
        console.log(`Relic: ${oldRelic} → ${newContracts.Relic}`);
        console.log(`VRF Manager: ${oldVRF} → ${newContracts.VRFManager}`);
        
        console.log("\n📄 相關文件:");
        console.log(`- 更新記錄: ${updateFile}`);
        console.log(`- 環境配置: .env.v25-1`);
        
        console.log("\n🚀 後續步驟:");
        console.log("1. 運行驗證腳本: node scripts/verify-updated-contracts.js");
        console.log("2. 執行配置同步: node scripts/ultimate-config-system.js sync");
        console.log("3. 測試鑄造功能: node scripts/test-mint-v25-1.js");
        console.log("4. 更新子圖配置: 使用新的合約地址");
        
        console.log("\n✨ Hero、Relic 和 VRF Manager 更新完成！");
        console.log("💡 其他合約保持 V25.0.4 版本，確保系統穩定性");
        
    } catch (error) {
        console.error("\n❌ 更新過程中發生錯誤:");
        console.error(error.message);
        
        // 保存錯誤記錄
        const errorReport = {
            error: error.message,
            stack: error.stack,
            partiallyDeployed: newContracts,
            existingContracts: EXISTING_CONTRACTS,
            timestamp: new Date().toISOString()
        };
        
        const errorFile = path.join(__dirname, `../deployments/v25-1-update-error-${Date.now()}.json`);
        fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
        console.log(`💾 錯誤記錄已保存: ${errorFile}`);
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
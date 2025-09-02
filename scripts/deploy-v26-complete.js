// deploy-v26-complete.js - 全新 V26 完整部署腳本
// 包含所有合約的部署和完整互連設置

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 開始 V26 完整部署流程...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 部署錢包:", deployer.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
    
    // 檢查餘額是否充足
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const minBalance = hre.ethers.parseEther("0.5"); // 至少需要 0.5 BNB
    if (balance < minBalance) {
        throw new Error(`❌ BNB 餘額不足！需要至少 0.5 BNB，當前: ${hre.ethers.formatEther(balance)} BNB`);
    }
    
    console.log("=".repeat(60));
    console.log("📋 V26 部署清單:");
    console.log("1. 代幣合約 (SoulShard, USD)");
    console.log("2. 核心系統 (Oracle, DungeonCore)");
    console.log("3. VRF 系統 (VRFConsumerV2Plus)");
    console.log("4. NFT 合約 (Hero, Relic, Party)");
    console.log("5. 遊戲邏輯 (DungeonMaster, DungeonStorage)");
    console.log("6. 功能模組 (Altar, PlayerVault, PlayerProfile, VIPStaking)");
    console.log("7. 合約互連配置");
    console.log("8. 初始化設置");
    console.log("=".repeat(60));
    
    // 等待確認
    console.log("⚠️ 即將開始完整部署，預估需要 5-10 分鐘");
    console.log("按 Ctrl+C 取消，或等待 10 秒開始部署...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const deployedContracts = {};
    const transactions = [];
    
    try {
        // ===========================================
        // 1. 部署代幣合約
        // ===========================================
        console.log("\n📦 第1階段: 部署代幣合約");
        console.log("-".repeat(40));
        
        // SoulShard Token
        console.log("🪙 部署 SoulShard...");
        const SoulShard = await hre.ethers.getContractFactory("SoulShard");
        const soulShard = await SoulShard.deploy(deployer.address);
        await soulShard.waitForDeployment();
        deployedContracts.SoulShard = await soulShard.getAddress();
        console.log("✅ SoulShard 部署完成:", deployedContracts.SoulShard);
        
        // USD Token (Mock)
        console.log("💵 部署 USD Token...");
        const USD = await hre.ethers.getContractFactory("USD");
        const usd = await USD.deploy();
        await usd.waitForDeployment();
        deployedContracts.USD = await usd.getAddress();
        console.log("✅ USD Token 部署完成:", deployedContracts.USD);
        
        // ===========================================
        // 2. 部署核心系統
        // ===========================================
        console.log("\n🏛️ 第2階段: 部署核心系統");
        console.log("-".repeat(40));
        
        // Oracle
        console.log("🔮 部署 Oracle...");
        const Oracle = await hre.ethers.getContractFactory("Oracle");
        const oracle = await Oracle.deploy();
        await oracle.waitForDeployment();
        deployedContracts.Oracle = await oracle.getAddress();
        console.log("✅ Oracle 部署完成:", deployedContracts.Oracle);
        
        // DungeonCore
        console.log("🏰 部署 DungeonCore...");
        const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
        const dungeonCore = await DungeonCore.deploy(deployer.address);
        await dungeonCore.waitForDeployment();
        deployedContracts.DungeonCore = await dungeonCore.getAddress();
        console.log("✅ DungeonCore 部署完成:", deployedContracts.DungeonCore);
        
        // ===========================================
        // 3. 部署 VRF 系統
        // ===========================================
        console.log("\n📡 第3階段: 部署 VRF 系統");
        console.log("-".repeat(40));
        
        console.log("🎲 部署 VRFConsumerV2Plus...");
        const VRF = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
        const vrf = await VRF.deploy(
            "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9", // BSC VRF Coordinator
            deployer.address
        );
        await vrf.waitForDeployment();
        deployedContracts.VRFManager = await vrf.getAddress();
        console.log("✅ VRFConsumerV2Plus 部署完成:", deployedContracts.VRFManager);
        
        // ===========================================
        // 4. 部署 NFT 合約
        // ===========================================
        console.log("\n🎨 第4階段: 部署 NFT 合約");
        console.log("-".repeat(40));
        
        // Hero NFT
        console.log("⚔️ 部署 Hero...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = await Hero.deploy(deployer.address);
        await hero.waitForDeployment();
        deployedContracts.Hero = await hero.getAddress();
        console.log("✅ Hero 部署完成:", deployedContracts.Hero);
        
        // Relic NFT
        console.log("💎 部署 Relic...");
        const Relic = await hre.ethers.getContractFactory("Relic");
        const relic = await Relic.deploy(deployer.address);
        await relic.waitForDeployment();
        deployedContracts.Relic = await relic.getAddress();
        console.log("✅ Relic 部署完成:", deployedContracts.Relic);
        
        // Party NFT
        console.log("👥 部署 Party...");
        const Party = await hre.ethers.getContractFactory("Party");
        const party = await Party.deploy(deployer.address);
        await party.waitForDeployment();
        deployedContracts.Party = await party.getAddress();
        console.log("✅ Party 部署完成:", deployedContracts.Party);
        
        // ===========================================
        // 5. 部署遊戲邏輯合約
        // ===========================================
        console.log("\n🎮 第5階段: 部署遊戲邏輯");
        console.log("-".repeat(40));
        
        // DungeonStorage
        console.log("🗄️ 部署 DungeonStorage...");
        const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
        const dungeonStorage = await DungeonStorage.deploy(deployer.address);
        await dungeonStorage.waitForDeployment();
        deployedContracts.DungeonStorage = await dungeonStorage.getAddress();
        console.log("✅ DungeonStorage 部署完成:", deployedContracts.DungeonStorage);
        
        // DungeonMaster
        console.log("🧙 部署 DungeonMaster...");
        const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMaster.deploy(deployer.address);
        await dungeonMaster.waitForDeployment();
        deployedContracts.DungeonMaster = await dungeonMaster.getAddress();
        console.log("✅ DungeonMaster 部署完成:", deployedContracts.DungeonMaster);
        
        // ===========================================
        // 6. 部署功能模組
        // ===========================================
        console.log("\n⚙️ 第6階段: 部署功能模組");
        console.log("-".repeat(40));
        
        // AltarOfAscension
        console.log("⛩️ 部署 AltarOfAscension...");
        const Altar = await hre.ethers.getContractFactory("AltarOfAscension");
        const altar = await Altar.deploy(deployer.address);
        await altar.waitForDeployment();
        deployedContracts.AltarOfAscension = await altar.getAddress();
        console.log("✅ AltarOfAscension 部署完成:", deployedContracts.AltarOfAscension);
        
        // PlayerVault
        console.log("💰 部署 PlayerVault...");
        const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
        const playerVault = await PlayerVault.deploy(deployer.address);
        await playerVault.waitForDeployment();
        deployedContracts.PlayerVault = await playerVault.getAddress();
        console.log("✅ PlayerVault 部署完成:", deployedContracts.PlayerVault);
        
        // PlayerProfile
        console.log("👤 部署 PlayerProfile...");
        const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
        const playerProfile = await PlayerProfile.deploy(deployer.address);
        await playerProfile.waitForDeployment();
        deployedContracts.PlayerProfile = await playerProfile.getAddress();
        console.log("✅ PlayerProfile 部署完成:", deployedContracts.PlayerProfile);
        
        // VIPStaking
        console.log("💎 部署 VIPStaking...");
        const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
        const vipStaking = await VIPStaking.deploy(deployer.address);
        await vipStaking.waitForDeployment();
        deployedContracts.VIPStaking = await vipStaking.getAddress();
        console.log("✅ VIPStaking 部署完成:", deployedContracts.VIPStaking);
        
        // ===========================================
        // 7. 合約互連配置
        // ===========================================
        console.log("\n🔗 第7階段: 配置合約互連");
        console.log("-".repeat(40));
        
        // 設定 DungeonCore 的所有模組地址
        console.log("🏛️ 配置 DungeonCore 模組...");
        
        // 連接到已部署的合約
        const coreContract = await hre.ethers.getContractAt("DungeonCore", deployedContracts.DungeonCore);
        
        const coreSetups = [
            { func: "setHeroAddress", addr: deployedContracts.Hero, name: "Hero" },
            { func: "setRelicAddress", addr: deployedContracts.Relic, name: "Relic" },
            { func: "setPartyAddress", addr: deployedContracts.Party, name: "Party" },
            { func: "setDungeonMasterAddress", addr: deployedContracts.DungeonMaster, name: "DungeonMaster" },
            { func: "setAltarOfAscensionAddress", addr: deployedContracts.AltarOfAscension, name: "Altar" },
            { func: "setPlayerVaultAddress", addr: deployedContracts.PlayerVault, name: "PlayerVault" },
            { func: "setPlayerProfileAddress", addr: deployedContracts.PlayerProfile, name: "PlayerProfile" },
            { func: "setVipStakingAddress", addr: deployedContracts.VIPStaking, name: "VIPStaking" },
            { func: "setOracleAddress", addr: deployedContracts.Oracle, name: "Oracle" },
            { func: "setSoulShardTokenAddress", addr: deployedContracts.SoulShard, name: "SoulShard" }
        ];
        
        for (const setup of coreSetups) {
            try {
                console.log(`  設定 ${setup.name}...`);
                const tx = await coreContract[setup.func](setup.addr, { gasLimit: 300000 });
                await tx.wait();
                transactions.push({ name: `DungeonCore.${setup.func}`, hash: tx.hash });
                console.log(`  ✅ ${setup.name} 設定完成`);
            } catch (error) {
                console.log(`  ❌ ${setup.name} 設定失敗:`, error.message);
            }
        }
        
        // 設定各合約的 DungeonCore 地址
        console.log("🔄 設定各合約的 DungeonCore 引用...");
        const contractsNeedingCore = [
            { name: "Hero", address: deployedContracts.Hero },
            { name: "Relic", address: deployedContracts.Relic },
            { name: "Party", address: deployedContracts.Party },
            { name: "DungeonMaster", address: deployedContracts.DungeonMaster },
            { name: "PlayerVault", address: deployedContracts.PlayerVault },
            { name: "PlayerProfile", address: deployedContracts.PlayerProfile },
            { name: "VIPStaking", address: deployedContracts.VIPStaking }
        ];
        
        for (const contract of contractsNeedingCore) {
            try {
                console.log(`  設定 ${contract.name} -> DungeonCore...`);
                const contractInstance = await hre.ethers.getContractAt("Hero", contract.address); // 使用通用 ABI
                const tx = await contractInstance.setDungeonCoreAddress(deployedContracts.DungeonCore, { gasLimit: 300000 });
                await tx.wait();
                transactions.push({ name: `${contract.name}.setDungeonCoreAddress`, hash: tx.hash });
                console.log(`  ✅ ${contract.name} 設定完成`);
            } catch (error) {
                console.log(`  ❌ ${contract.name} 設定失敗:`, error.message);
            }
        }
        
        // 設定 Oracle 的代幣地址
        console.log("🔮 配置 Oracle 代幣地址...");
        const oracleContract = await hre.ethers.getContractAt("Oracle", deployedContracts.Oracle);
        
        try {
            console.log("  設定 SoulShard 地址...");
            const tx1 = await oracleContract.setSoulShardAddress(deployedContracts.SoulShard, { gasLimit: 300000 });
            await tx1.wait();
            transactions.push({ name: "Oracle.setSoulShardAddress", hash: tx1.hash });
            
            console.log("  設定 USD 地址...");
            const tx2 = await oracleContract.setUsdAddress(deployedContracts.USD, { gasLimit: 300000 });
            await tx2.wait();
            transactions.push({ name: "Oracle.setUsdAddress", hash: tx2.hash });
            
            console.log("  ✅ Oracle 代幣地址設定完成");
        } catch (error) {
            console.log("  ❌ Oracle 代幣地址設定失敗:", error.message);
        }
        
        // 設定 DungeonMaster 的 DungeonStorage 地址
        console.log("🧙 配置 DungeonMaster -> DungeonStorage...");
        try {
            const dmContract = await hre.ethers.getContractAt("DungeonMaster", deployedContracts.DungeonMaster);
            const tx = await dmContract.setDungeonStorageAddress(deployedContracts.DungeonStorage, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "DungeonMaster.setDungeonStorageAddress", hash: tx.hash });
            console.log("  ✅ DungeonMaster -> DungeonStorage 設定完成");
        } catch (error) {
            console.log("  ❌ DungeonMaster -> DungeonStorage 設定失敗:", error.message);
        }
        
        // 設定 VRF 授權
        console.log("📡 配置 VRF 授權...");
        const vrfContract = await hre.ethers.getContractAt("VRFConsumerV2Plus", deployedContracts.VRFManager);
        
        const vrfClients = [
            { name: "Hero", address: deployedContracts.Hero },
            { name: "Relic", address: deployedContracts.Relic },
            { name: "DungeonMaster", address: deployedContracts.DungeonMaster },
            { name: "AltarOfAscension", address: deployedContracts.AltarOfAscension }
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
        
        // 設定 NFT 合約的 VRF Manager 地址
        console.log("🎨 設定 NFT 合約的 VRF Manager...");
        const nftContracts = [
            { name: "Hero", address: deployedContracts.Hero },
            { name: "Relic", address: deployedContracts.Relic }
        ];
        
        for (const nft of nftContracts) {
            try {
                console.log(`  設定 ${nft.name} VRF Manager...`);
                const nftContract = await hre.ethers.getContractAt("Hero", nft.address);
                const tx = await nftContract.setVRFManager(deployedContracts.VRFManager, { gasLimit: 300000 });
                await tx.wait();
                transactions.push({ name: `${nft.name}.setVRFManager`, hash: tx.hash });
                console.log(`  ✅ ${nft.name} VRF Manager 設定完成`);
            } catch (error) {
                console.log(`  ❌ ${nft.name} VRF Manager 設定失敗:`, error.message);
            }
        }
        
        // ===========================================
        // 8. 初始化設置
        // ===========================================
        console.log("\n⚙️ 第8階段: 初始化設置");
        console.log("-".repeat(40));
        
        // 設定基本參數
        console.log("🔧 設定基本參數...");
        
        // 設定 Hero 鑄造價格為 0 (測試用)
        try {
            const heroContract = await hre.ethers.getContractAt("Hero", deployedContracts.Hero);
            const tx1 = await heroContract.setMintPriceUSD(0, { gasLimit: 300000 });
            await tx1.wait();
            console.log("  ✅ Hero 鑄造價格設為 0");
            
            const tx2 = await heroContract.setPlatformFee(0, { gasLimit: 300000 });
            await tx2.wait();
            console.log("  ✅ Hero 平台費設為 0");
        } catch (error) {
            console.log("  ⚠️ Hero 基本參數設定部分失敗");
        }
        
        // 設定 Relic 鑄造價格為 0 (測試用)
        try {
            const relicContract = await hre.ethers.getContractAt("Relic", deployedContracts.Relic);
            const tx1 = await relicContract.setMintPriceUSD(0, { gasLimit: 300000 });
            await tx1.wait();
            console.log("  ✅ Relic 鑄造價格設為 0");
            
            const tx2 = await relicContract.setPlatformFee(0, { gasLimit: 300000 });
            await tx2.wait();
            console.log("  ✅ Relic 平台費設為 0");
        } catch (error) {
            console.log("  ⚠️ Relic 基本參數設定部分失敗");
        }
        
        // 保存部署結果
        const deploymentData = {
            version: "V26.0.0",
            network: hre.network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            blockNumber: await hre.ethers.provider.getBlockNumber(),
            addresses: deployedContracts,
            transactions: transactions,
            gasUsed: "計算中...",
            totalContracts: Object.keys(deployedContracts).length
        };
        
        // 寫入部署文件
        const deploymentDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const deploymentFile = path.join(deploymentDir, `v26-complete-deployment-${timestamp}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
        
        // 更新環境變數文件
        const envContent = `# V26 統一配置 - 完整部署
# 部署時間: ${new Date().toISOString()}
# 子圖版本: v26-latest

# V26 部署私鑰
PRIVATE_KEY=${process.env.PRIVATE_KEY}

# ==================== 合約地址（V26.0.0 最新）====================
VITE_HERO_ADDRESS=${deployedContracts.Hero}
VITE_RELIC_ADDRESS=${deployedContracts.Relic}
VITE_PARTY_ADDRESS=${deployedContracts.Party}
VITE_DUNGEONMASTER_ADDRESS=${deployedContracts.DungeonMaster}
VITE_DUNGEONSTORAGE_ADDRESS=${deployedContracts.DungeonStorage}
VITE_ALTAROFASCENSION_ADDRESS=${deployedContracts.AltarOfAscension}
VITE_PLAYERVAULT_ADDRESS=${deployedContracts.PlayerVault}
VITE_PLAYERPROFILE_ADDRESS=${deployedContracts.PlayerProfile}
VITE_VIPSTAKING_ADDRESS=${deployedContracts.VIPStaking}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${deployedContracts.VRFManager}

# 核心合約
VITE_DUNGEONCORE_ADDRESS=${deployedContracts.DungeonCore}
VITE_ORACLE_ADDRESS=${deployedContracts.Oracle}
VITE_SOULSHARD_ADDRESS=${deployedContracts.SoulShard}
VITE_USD_ADDRESS=${deployedContracts.USD}

# ==================== 服務端點 ====================
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/version/latest
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# ==================== 部署信息 ====================
VITE_CONTRACT_VERSION=V26.0.0
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
        
        const envFile = path.join(__dirname, '../.env.v26');
        fs.writeFileSync(envFile, envContent);
        
        // ===========================================
        // 部署完成總結
        // ===========================================
        console.log("\n" + "=".repeat(60));
        console.log("🎉 V26 完整部署成功完成！");
        console.log("=".repeat(60));
        
        console.log("\n📊 部署統計:");
        console.log(`✅ 成功部署合約: ${Object.keys(deployedContracts).length} 個`);
        console.log(`🔗 配置交易: ${transactions.length} 筆`);
        console.log(`⛽ 部署錢包: ${deployer.address}`);
        console.log(`📦 當前區塊: ${await hre.ethers.provider.getBlockNumber()}`);
        
        console.log("\n📋 合約地址清單:");
        for (const [name, address] of Object.entries(deployedContracts)) {
            console.log(`${name}: ${address}`);
        }
        
        console.log("\n📄 相關文件:");
        console.log(`- 部署記錄: ${deploymentFile}`);
        console.log(`- 環境配置: .env.v26`);
        
        console.log("\n🚀 後續步驟:");
        console.log("1. 運行驗證腳本: npm run verify:v26");
        console.log("2. 執行配置同步: node scripts/sync-v26-config.js");
        console.log("3. 初始化地城數據: node scripts/initialize-dungeons-v26.js");
        console.log("4. 測試基本功能: node scripts/test-v26-basic.js");
        
        console.log("\n✨ V26 完整部署流程完成！");
        
    } catch (error) {
        console.error("\n❌ 部署過程中發生錯誤:");
        console.error(error.message);
        
        // 保存錯誤記錄
        const errorReport = {
            error: error.message,
            stack: error.stack,
            deployedContracts: deployedContracts,
            timestamp: new Date().toISOString()
        };
        
        const errorFile = path.join(__dirname, `../deployments/v26-deployment-error-${Date.now()}.json`);
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
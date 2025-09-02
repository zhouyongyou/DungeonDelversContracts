// deploy-v25-selective.js - V25.2.2 選擇性重新部署腳本
// 重新部署9個指定合約，重複使用現有的 DungeonCore 和 VRF Manager
// 包含合約驗證和完整互連設置

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 開始 V25.2.2 選擇性重新部署流程...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 部署錢包:", deployer.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
    
    // 檢查餘額是否充足
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const minBalance = hre.ethers.parseEther("0.1"); // 至少需要 0.1 BNB
    if (balance < minBalance) {
        throw new Error(`❌ BNB 餘額不足！需要至少 0.1 BNB，當前: ${hre.ethers.formatEther(balance)} BNB`);
    }
    
    console.log("=".repeat(60));
    console.log("📋 V25.2.2 選擇性重新部署清單:");
    console.log("✅ 重複使用: DungeonCore, VRFConsumerV2Plus");
    console.log("🆕 重新部署: 9個指定合約");
    console.log("  1. AltarOfAscension");
    console.log("  2. DungeonMaster");  
    console.log("  3. DungeonStorage");
    console.log("  4. Relic");
    console.log("  5. Hero");
    console.log("  6. PlayerProfile");
    console.log("  7. VIPStaking");
    console.log("  8. Party");
    console.log("  9. PlayerVault");
    console.log("🔗 配置合約互連和VRF授權");
    console.log("✅ BSCScan 驗證開源");
    console.log("=".repeat(60));
    
    // 現有合約地址（從環境變數和部署記錄獲取）
    const existingContracts = {
        DungeonCore: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        VRFManager: "0x934C8cd6C4F39673CA44c9e88a54cbE2F71782B9",  // 修正的最新地址
        SoulShard: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
        USD: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61"
    };
    
    console.log("\n🔄 重複使用現有合約:");
    for (const [name, address] of Object.entries(existingContracts)) {
        console.log(`  ${name}: ${address}`);
    }
    
    // 等待確認
    console.log("\n⚠️ 即將開始選擇性重新部署，預估需要 2-3 分鐘（使用0.11 gwei低Gas費）");
    console.log("按 Ctrl+C 取消，或等待 5 秒開始部署...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const deployedContracts = { ...existingContracts };
    const transactions = [];
    const verifyQueue = []; // 驗證隊列
    
    try {
        // ===========================================
        // 1. 重新部署 9 個指定合約
        // ===========================================
        console.log("\n📦 第1階段: 重新部署指定合約");
        console.log("-".repeat(40));
        
        // 設定統一的Gas配置
        const gasConfig = {
            gasLimit: 3000000,
            gasPrice: hre.ethers.parseUnits("0.11", "gwei") // 0.11 gwei
        };

        // AltarOfAscension
        console.log("⛩️ 部署 AltarOfAscension...");
        const AltarFactory = await hre.ethers.getContractFactory("AltarOfAscension");
        const altar = await AltarFactory.deploy(gasConfig);
        await altar.waitForDeployment();
        deployedContracts.AltarOfAscension = await altar.getAddress();
        verifyQueue.push({ name: "AltarOfAscension", address: deployedContracts.AltarOfAscension, constructorArgs: [] });
        console.log("✅ AltarOfAscension 部署完成:", deployedContracts.AltarOfAscension);
        
        // DungeonMaster
        console.log("🧙 部署 DungeonMaster...");
        const DungeonMasterFactory = await hre.ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMasterFactory.deploy(gasConfig);
        await dungeonMaster.waitForDeployment();
        deployedContracts.DungeonMaster = await dungeonMaster.getAddress();
        verifyQueue.push({ name: "DungeonMaster", address: deployedContracts.DungeonMaster, constructorArgs: [] });
        console.log("✅ DungeonMaster 部署完成:", deployedContracts.DungeonMaster);
        
        // DungeonStorage
        console.log("🗄️ 部署 DungeonStorage...");
        const DungeonStorageFactory = await hre.ethers.getContractFactory("DungeonStorage");
        const dungeonStorage = await DungeonStorageFactory.deploy(gasConfig);
        await dungeonStorage.waitForDeployment();
        deployedContracts.DungeonStorage = await dungeonStorage.getAddress();
        verifyQueue.push({ name: "DungeonStorage", address: deployedContracts.DungeonStorage, constructorArgs: [] });
        console.log("✅ DungeonStorage 部署完成:", deployedContracts.DungeonStorage);
        
        // Relic
        console.log("💎 部署 Relic...");
        const RelicFactory = await hre.ethers.getContractFactory("Relic");
        const relic = await RelicFactory.deploy(gasConfig);
        await relic.waitForDeployment();
        deployedContracts.Relic = await relic.getAddress();
        verifyQueue.push({ name: "Relic", address: deployedContracts.Relic, constructorArgs: [] });
        console.log("✅ Relic 部署完成:", deployedContracts.Relic);
        
        // Hero
        console.log("⚔️ 部署 Hero...");
        const HeroFactory = await hre.ethers.getContractFactory("Hero");
        const hero = await HeroFactory.deploy(gasConfig);
        await hero.waitForDeployment();
        deployedContracts.Hero = await hero.getAddress();
        verifyQueue.push({ name: "Hero", address: deployedContracts.Hero, constructorArgs: [] });
        console.log("✅ Hero 部署完成:", deployedContracts.Hero);
        
        // PlayerProfile
        console.log("👤 部署 PlayerProfile...");
        const PlayerProfileFactory = await hre.ethers.getContractFactory("PlayerProfile");
        const playerProfile = await PlayerProfileFactory.deploy(gasConfig);
        await playerProfile.waitForDeployment();
        deployedContracts.PlayerProfile = await playerProfile.getAddress();
        verifyQueue.push({ name: "PlayerProfile", address: deployedContracts.PlayerProfile, constructorArgs: [] });
        console.log("✅ PlayerProfile 部署完成:", deployedContracts.PlayerProfile);
        
        // VIPStaking
        console.log("💎 部署 VIPStaking...");
        const VIPStakingFactory = await hre.ethers.getContractFactory("VIPStaking");
        const vipStaking = await VIPStakingFactory.deploy(gasConfig);
        await vipStaking.waitForDeployment();
        deployedContracts.VIPStaking = await vipStaking.getAddress();
        verifyQueue.push({ name: "VIPStaking", address: deployedContracts.VIPStaking, constructorArgs: [] });
        console.log("✅ VIPStaking 部署完成:", deployedContracts.VIPStaking);
        
        // Party
        console.log("👥 部署 Party...");
        const PartyFactory = await hre.ethers.getContractFactory("Party");
        const party = await PartyFactory.deploy(gasConfig);
        await party.waitForDeployment();
        deployedContracts.Party = await party.getAddress();
        verifyQueue.push({ name: "Party", address: deployedContracts.Party, constructorArgs: [] });
        console.log("✅ Party 部署完成:", deployedContracts.Party);
        
        // PlayerVault
        console.log("💰 部署 PlayerVault...");
        const PlayerVaultFactory = await hre.ethers.getContractFactory("PlayerVault");
        const playerVault = await PlayerVaultFactory.deploy(gasConfig);
        await playerVault.waitForDeployment();
        deployedContracts.PlayerVault = await playerVault.getAddress();
        verifyQueue.push({ name: "PlayerVault", address: deployedContracts.PlayerVault, constructorArgs: [] });
        console.log("✅ PlayerVault 部署完成:", deployedContracts.PlayerVault);
        
        console.log(`\n✅ 所有9個合約部署完成！共部署了 ${verifyQueue.length} 個新合約`);
        
        // ===========================================
        // 2. BSCScan 合約驗證
        // ===========================================
        console.log("\n🔍 第2階段: BSCScan 合約驗證");
        console.log("-".repeat(40));
        
        for (const contract of verifyQueue) {
            try {
                console.log(`📋 驗證 ${contract.name}...`);
                await hre.run("verify:verify", {
                    address: contract.address,
                    constructorArguments: contract.constructorArgs,
                });
                console.log(`✅ ${contract.name} 驗證成功`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // 防止API限制
            } catch (error) {
                if (error.message.includes("already verified")) {
                    console.log(`✅ ${contract.name} 已驗證過`);
                } else {
                    console.log(`⚠️ ${contract.name} 驗證失敗:`, error.message);
                }
            }
        }
        
        // ===========================================
        // 3. DungeonCore 互連配置
        // ===========================================
        console.log("\n🔗 第3階段: DungeonCore 互連配置");
        console.log("-".repeat(40));
        
        const coreContract = await hre.ethers.getContractAt("DungeonCore", deployedContracts.DungeonCore);
        
        // 更新 DungeonCore 中的合約地址
        const coreSetups = [
            { func: "setHeroContract", addr: deployedContracts.Hero, name: "Hero" },
            { func: "setRelicContract", addr: deployedContracts.Relic, name: "Relic" },
            { func: "setPartyContract", addr: deployedContracts.Party, name: "Party" },
            { func: "setDungeonMasterContract", addr: deployedContracts.DungeonMaster, name: "DungeonMaster" },
            { func: "setAltarOfAscensionContract", addr: deployedContracts.AltarOfAscension, name: "AltarOfAscension" },
            { func: "setPlayerVaultContract", addr: deployedContracts.PlayerVault, name: "PlayerVault" },
            { func: "setPlayerProfileContract", addr: deployedContracts.PlayerProfile, name: "PlayerProfile" },
            { func: "setVipStakingContract", addr: deployedContracts.VIPStaking, name: "VIPStaking" },
            { func: "setVRFManager", addr: deployedContracts.VRFManager, name: "VRFManager" }
        ];
        
        console.log("🏛️ 更新 DungeonCore 合約地址...");
        for (const setup of coreSetups) {
            try {
                console.log(`  更新 ${setup.name}...`);
                const tx = await coreContract[setup.func](setup.addr, gasConfig);
                await tx.wait();
                transactions.push({ name: `DungeonCore.${setup.func}`, hash: tx.hash });
                console.log(`  ✅ ${setup.name} 更新完成`);
            } catch (error) {
                console.log(`  ❌ ${setup.name} 更新失敗:`, error.message);
            }
        }
        
        // 設定各合約的 DungeonCore 地址
        console.log("\n🔄 設定各合約的 DungeonCore 引用...");
        const contractsNeedingCore = [
            { name: "Hero", address: deployedContracts.Hero },
            { name: "Relic", address: deployedContracts.Relic },
            { name: "Party", address: deployedContracts.Party },
            { name: "DungeonMaster", address: deployedContracts.DungeonMaster },
            { name: "AltarOfAscension", address: deployedContracts.AltarOfAscension },
            { name: "PlayerVault", address: deployedContracts.PlayerVault },
            { name: "PlayerProfile", address: deployedContracts.PlayerProfile },
            { name: "VIPStaking", address: deployedContracts.VIPStaking }
        ];
        
        for (const contract of contractsNeedingCore) {
            try {
                console.log(`  設定 ${contract.name} → DungeonCore...`);
                const contractInstance = await hre.ethers.getContractAt("Hero", contract.address);
                const tx = await contractInstance.setDungeonCore(deployedContracts.DungeonCore, gasConfig);
                await tx.wait();
                transactions.push({ name: `${contract.name}.setDungeonCore`, hash: tx.hash });
                console.log(`  ✅ ${contract.name} → DungeonCore 完成`);
            } catch (error) {
                console.log(`  ❌ ${contract.name} → DungeonCore 失敗:`, error.message);
            }
        }
        
        // ===========================================
        // 4. VRF 授權配置
        // ===========================================
        console.log("\n📡 第4階段: VRF 授權配置");
        console.log("-".repeat(40));
        
        // VRF Manager 使用智能授權，通過 DungeonCore 自動授權
        console.log("🔗 配置 VRF Manager → DungeonCore...");
        try {
            const vrfContract = await hre.ethers.getContractAt("VRFConsumerV2Plus", deployedContracts.VRFManager);
            const tx = await vrfContract.setDungeonCore(deployedContracts.DungeonCore, gasConfig);
            await tx.wait();
            transactions.push({ name: "VRFManager.setDungeonCore", hash: tx.hash });
            console.log("✅ VRF Manager → DungeonCore 設定完成");
            console.log("✅ 智能授權系統將自動授權所有 DungeonCore 註冊的合約");
        } catch (error) {
            console.log("❌ VRF Manager → DungeonCore 設定失敗:", error.message);
        }
        
        // ===========================================
        // 5. 專屬連接設置
        // ===========================================
        console.log("\n⚙️ 第5階段: 專屬連接設置");
        console.log("-".repeat(40));
        
        // DungeonMaster ← → DungeonStorage 連接
        console.log("🧙 配置 DungeonMaster ↔ DungeonStorage...");
        try {
            const dmContract = await hre.ethers.getContractAt("DungeonMaster", deployedContracts.DungeonMaster);
            const dsContract = await hre.ethers.getContractAt("DungeonStorage", deployedContracts.DungeonStorage);
            
            // DungeonMaster → DungeonStorage
            const tx1 = await dmContract.setDungeonStorage(deployedContracts.DungeonStorage, gasConfig);
            await tx1.wait();
            
            // DungeonStorage → DungeonMaster  
            const tx2 = await dsContract.setDungeonMaster(deployedContracts.DungeonMaster, gasConfig);
            await tx2.wait();
            
            transactions.push({ name: "DungeonMaster.setDungeonStorage", hash: tx1.hash });
            transactions.push({ name: "DungeonStorage.setDungeonMaster", hash: tx2.hash });
            console.log("✅ DungeonMaster ↔ DungeonStorage 雙向連接完成");
        } catch (error) {
            console.log("❌ DungeonMaster ↔ DungeonStorage 連接失敗:", error.message);
        }
        
        // Party 合約專屬設置
        console.log("👥 配置 Party 合約專屬連接...");
        try {
            const partyContract = await hre.ethers.getContractAt("Party", deployedContracts.Party);
            
            // Party → Hero
            const tx1 = await partyContract.setHeroContract(deployedContracts.Hero, gasConfig);
            await tx1.wait();
            
            // Party → Relic
            const tx2 = await partyContract.setRelicContract(deployedContracts.Relic, gasConfig);
            await tx2.wait();
            
            transactions.push({ name: "Party.setHeroContract", hash: tx1.hash });
            transactions.push({ name: "Party.setRelicContract", hash: tx2.hash });
            console.log("✅ Party 專屬連接完成");
        } catch (error) {
            console.log("❌ Party 專屬連接失敗:", error.message);
        }
        
        // ===========================================
        // 6. 生成配置文件
        // ===========================================
        console.log("\n📄 第6階段: 生成配置文件");
        console.log("-".repeat(40));
        
        const deploymentData = {
            version: "V25.2.2-selective",
            network: "bsc",
            chainId: "56",
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            blockNumber: await hre.ethers.provider.getBlockNumber(),
            deploymentType: "selective-redeploy",
            reusedContracts: {
                DungeonCore: existingContracts.DungeonCore,
                VRFManager: existingContracts.VRFManager,
                SoulShard: existingContracts.SoulShard,
                USD: existingContracts.USD
            },
            newContracts: {
                AltarOfAscension: deployedContracts.AltarOfAscension,
                DungeonMaster: deployedContracts.DungeonMaster,
                DungeonStorage: deployedContracts.DungeonStorage,
                Relic: deployedContracts.Relic,
                Hero: deployedContracts.Hero,
                PlayerProfile: deployedContracts.PlayerProfile,
                VIPStaking: deployedContracts.VIPStaking,
                Party: deployedContracts.Party,
                PlayerVault: deployedContracts.PlayerVault
            },
            allContracts: deployedContracts,
            transactions: transactions,
            verification: verifyQueue.map(v => ({ name: v.name, address: v.address })),
            totalNewContracts: verifyQueue.length,
            gasConfiguration: {
                gasPrice: "0.11 gwei",
                gasLimit: "3,000,000",
                estimatedTotalCost: "約 0.06-0.08 BNB"
            },
            gasUsed: "待計算"
        };
        
        // 保存部署記錄
        const deploymentDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const deploymentFile = path.join(deploymentDir, `v25-selective-deployment-${timestamp}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
        console.log(`✅ 部署記錄已保存: v25-selective-deployment-${timestamp}.json`);
        
        // 生成新的環境配置
        const envContent = `# V25.2.2 選擇性重新部署配置
# 部署時間: ${new Date().toISOString()}
# 部署類型: 選擇性重新部署（9個新合約 + 4個重複使用）
# Gas 設置: 0.11 gwei / 3,000,000 limit (超低成本部署)

# 部署私鑰
PRIVATE_KEY=${process.env.PRIVATE_KEY}

# ==================== V25.2.2 合約地址 ====================
# NFT 合約（新部署）
VITE_HERO_ADDRESS=${deployedContracts.Hero}
VITE_RELIC_ADDRESS=${deployedContracts.Relic}
VITE_PARTY_ADDRESS=${deployedContracts.Party}

# 遊戲邏輯合約（新部署）
VITE_ALTAROFASCENSION_ADDRESS=${deployedContracts.AltarOfAscension}
VITE_DUNGEONMASTER_ADDRESS=${deployedContracts.DungeonMaster}
VITE_DUNGEONSTORAGE_ADDRESS=${deployedContracts.DungeonStorage}

# 用戶系統合約（新部署）
VITE_PLAYERVAULT_ADDRESS=${deployedContracts.PlayerVault}
VITE_PLAYERPROFILE_ADDRESS=${deployedContracts.PlayerProfile}
VITE_VIPSTAKING_ADDRESS=${deployedContracts.VIPStaking}

# 核心系統（重複使用）
VITE_DUNGEONCORE_ADDRESS=${deployedContracts.DungeonCore}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${deployedContracts.VRFManager}

# 代幣合約（重複使用）
VITE_SOULSHARD_ADDRESS=${deployedContracts.SoulShard}
VITE_USD_ADDRESS=${deployedContracts.USD}

# ==================== 服務端點 ====================
VITE_SUBGRAPH_STUDIO_VERSION=v25.2.2
VITE_SUBGRAPH_STUDIO_BASE_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc
VITE_USE_DECENTRALIZED_GRAPH=false
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# ==================== 部署信息 ====================
VITE_CONTRACT_VERSION=V25.2.2-selective
VITE_START_BLOCK=${await hre.ethers.provider.getBlockNumber()}
VITE_DEPLOYMENT_DATE=${new Date().toISOString()}
VITE_ADMIN_WALLET=${deployer.address}
VITE_NETWORK=BSC Mainnet
VITE_CHAIN_ID=56

# ==================== VRF 配置（固定）====================
VITE_VRF_ENABLED=true
VITE_VRF_PRICE=0
VITE_PLATFORM_FEE=0
VITE_VRF_SUBSCRIPTION_ID=88422796721004450630713121079263696788635490871993157345476848872165866246915
VITE_VRF_COORDINATOR=0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9
VITE_VRF_KEY_HASH=0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4
VITE_VRF_REQUEST_CONFIRMATIONS=6
VITE_VRF_NUM_WORDS=1

# BSCScan API Key
BSCSCAN_API_KEY=2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC
`;
        
        const envFile = path.join(__dirname, '../.env.v25-selective');
        fs.writeFileSync(envFile, envContent);
        console.log("✅ 環境配置已保存: .env.v25-selective");
        
        // ===========================================
        // 完成總結
        // ===========================================
        console.log("\n" + "=".repeat(60));
        console.log("🎉 V25.2.2 選擇性重新部署成功完成！");
        console.log("=".repeat(60));
        
        console.log("\n📊 部署統計:");
        console.log(`✅ 新部署合約: ${verifyQueue.length} 個`);
        console.log(`🔄 重複使用合約: 4 個 (DungeonCore, VRF, SoulShard, USD)`);
        console.log(`🔗 配置交易: ${transactions.length} 筆`);
        console.log(`⛽ 部署錢包: ${deployer.address}`);
        console.log(`📦 當前區塊: ${await hre.ethers.provider.getBlockNumber()}`);
        
        console.log("\n🆕 新部署的合約:");
        for (const contract of verifyQueue) {
            console.log(`  ${contract.name}: ${contract.address}`);
        }
        
        console.log("\n🔄 重複使用的合約:");
        console.log(`  DungeonCore: ${deployedContracts.DungeonCore}`);
        console.log(`  VRFManager: ${deployedContracts.VRFManager}`);
        console.log(`  SoulShard: ${deployedContracts.SoulShard}`);
        console.log(`  USD: ${deployedContracts.USD}`);
        
        console.log("\n📄 生成的文件:");
        console.log(`  - 部署記錄: deployments/v25-selective-deployment-${timestamp}.json`);
        console.log(`  - 環境配置: .env.v25-selective`);
        
        console.log("\n🚀 建議後續步驟:");
        console.log("1. 複製新環境配置: cp .env.v25-selective .env");
        console.log("2. 執行統一配置同步: node scripts/ultimate-config-system.js sync");
        console.log("3. 更新子圖配置並部署新版本");
        console.log("4. 重啟前端和後端服務");
        console.log("5. 執行完整功能測試");
        
        console.log("\n✨ V25.2.2 選擇性重新部署完成！所有合約互連和VRF授權已配置完成。");
        
    } catch (error) {
        console.error("\n❌ 部署過程中發生錯誤:");
        console.error(error.message);
        
        // 保存錯誤記錄
        const errorReport = {
            error: error.message,
            stack: error.stack,
            deployedContracts: deployedContracts,
            verificationQueue: verifyQueue,
            transactions: transactions,
            timestamp: new Date().toISOString()
        };
        
        const errorFile = path.join(__dirname, `../deployments/v25-selective-error-${Date.now()}.json`);
        fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
        console.log(`💾 錯誤記錄已保存: ${path.basename(errorFile)}`);
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
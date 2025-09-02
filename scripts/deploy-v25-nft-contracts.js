const hre = require("hardhat");

/**
 * V25 NFT 合約部署和互連腳本
 * 部署 6 個核心合約並完成所有互連設置
 */

async function main() {
    console.log("🚀 開始 V25 NFT 合約部署流程...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB\n");
    
    // 讀取現有的 DungeonCore 地址
    const DUNGEON_CORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722"; // V25.1.3
    const DUNGEON_STORAGE_ADDRESS = "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec"; // V25.1.3
    
    console.log("📍 使用現有合約地址:");
    console.log("DungeonCore:", DUNGEON_CORE_ADDRESS);
    console.log("DungeonStorage:", DUNGEON_STORAGE_ADDRESS);
    console.log();
    
    const deployedContracts = {};
    
    // ========== 第 1 步：部署 NFT 合約 ==========
    console.log("📦 第 1 步：部署 NFT 合約\n");
    
    // 1. 部署 Hero (無參數構造函數)
    console.log("🔄 部署 Hero 合約...");
    const Hero = await hre.ethers.getContractFactory("Hero");
    const hero = await Hero.deploy();
    await hero.waitForDeployment();
    deployedContracts.Hero = await hero.getAddress();
    console.log("✅ Hero 合約地址:", deployedContracts.Hero);
    
    // 2. 部署 Relic (無參數構造函數)
    console.log("🔄 部署 Relic 合約...");
    const Relic = await hre.ethers.getContractFactory("Relic");
    const relic = await Relic.deploy();
    await relic.waitForDeployment();
    deployedContracts.Relic = await relic.getAddress();
    console.log("✅ Relic 合約地址:", deployedContracts.Relic);
    
    // 3. 部署 Party (無參數構造函數)
    console.log("🔄 部署 Party 合約...");
    const Party = await hre.ethers.getContractFactory("Party");
    const party = await Party.deploy();
    await party.waitForDeployment();
    deployedContracts.Party = await party.getAddress();
    console.log("✅ Party 合約地址:", deployedContracts.Party);
    
    // 4. 部署 PlayerProfile (無參數構造函數)
    console.log("🔄 部署 PlayerProfile 合約...");
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy();
    await playerProfile.waitForDeployment();
    deployedContracts.PlayerProfile = await playerProfile.getAddress();
    console.log("✅ PlayerProfile 合約地址:", deployedContracts.PlayerProfile);
    
    // 5. 部署 VIPStaking (無參數構造函數)
    console.log("🔄 部署 VIPStaking 合約...");
    const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy();
    await vipStaking.waitForDeployment();
    deployedContracts.VIPStaking = await vipStaking.getAddress();
    console.log("✅ VIPStaking 合約地址:", deployedContracts.VIPStaking);
    
    // 6. 部署 DungeonMaster (無參數構造函數)
    console.log("🔄 部署 DungeonMaster 合約...");
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = await DungeonMaster.deploy();
    await dungeonMaster.waitForDeployment();
    deployedContracts.DungeonMaster = await dungeonMaster.getAddress();
    console.log("✅ DungeonMaster 合約地址:", deployedContracts.DungeonMaster);
    
    console.log("\n📋 所有合約部署完成:");
    Object.entries(deployedContracts).forEach(([name, address]) => {
        console.log(`${name}: ${address}`);
    });
    
    // ========== 第 2 步：設置 DungeonCore 中的合約地址 ==========
    console.log("\n🔗 第 2 步：在 DungeonCore 中設置合約地址\n");
    
    const dungeonCore = await hre.ethers.getContractAt("IDungeonCore", DUNGEON_CORE_ADDRESS);
    
    // 設置 Hero 合約
    console.log("🔄 在 DungeonCore 中設置 Hero 地址...");
    let tx = await dungeonCore.setHeroContract(deployedContracts.Hero);
    await tx.wait();
    console.log("✅ DungeonCore.setHeroContract 完成");
    
    // 設置 Relic 合約
    console.log("🔄 在 DungeonCore 中設置 Relic 地址...");
    tx = await dungeonCore.setRelicContract(deployedContracts.Relic);
    await tx.wait();
    console.log("✅ DungeonCore.setRelicContract 完成");
    
    // 設置 Party 合約
    console.log("🔄 在 DungeonCore 中設置 Party 地址...");
    tx = await dungeonCore.setPartyContract(deployedContracts.Party);
    await tx.wait();
    console.log("✅ DungeonCore.setPartyContract 完成");
    
    // 設置 PlayerProfile 合約
    console.log("🔄 在 DungeonCore 中設置 PlayerProfile 地址...");
    tx = await dungeonCore.setPlayerProfile(deployedContracts.PlayerProfile);
    await tx.wait();
    console.log("✅ DungeonCore.setPlayerProfile 完成");
    
    // 設置 VIPStaking 合約
    console.log("🔄 在 DungeonCore 中設置 VIPStaking 地址...");
    tx = await dungeonCore.setVipStaking(deployedContracts.VIPStaking);
    await tx.wait();
    console.log("✅ DungeonCore.setVipStaking 完成");
    
    // 設置 DungeonMaster 合約
    console.log("🔄 在 DungeonCore 中設置 DungeonMaster 地址...");
    tx = await dungeonCore.setDungeonMaster(deployedContracts.DungeonMaster);
    await tx.wait();
    console.log("✅ DungeonCore.setDungeonMaster 完成");
    
    // ========== 第 3 步：設置每個 NFT 合約的 DungeonCore 地址 ==========
    console.log("\n🔄 第 3 步：為每個 NFT 合約設置 DungeonCore 地址\n");
    
    // Hero 設置 DungeonCore
    console.log("🔄 設置 Hero.setDungeonCore...");
    const heroContract = await hre.ethers.getContractAt("Hero", deployedContracts.Hero);
    tx = await heroContract.setDungeonCore(DUNGEON_CORE_ADDRESS);
    await tx.wait();
    console.log("✅ Hero.setDungeonCore 完成");
    
    // Relic 設置 DungeonCore
    console.log("🔄 設置 Relic.setDungeonCore...");
    const relicContract = await hre.ethers.getContractAt("Relic", deployedContracts.Relic);
    tx = await relicContract.setDungeonCore(DUNGEON_CORE_ADDRESS);
    await tx.wait();
    console.log("✅ Relic.setDungeonCore 完成");
    
    // Party 設置 DungeonCore
    console.log("🔄 設置 Party.setDungeonCore...");
    const partyContract = await hre.ethers.getContractAt("Party", deployedContracts.Party);
    tx = await partyContract.setDungeonCore(DUNGEON_CORE_ADDRESS);
    await tx.wait();
    console.log("✅ Party.setDungeonCore 完成");
    
    // PlayerProfile 設置 DungeonCore
    console.log("🔄 設置 PlayerProfile.setDungeonCore...");
    const playerProfileContract = await hre.ethers.getContractAt("PlayerProfile", deployedContracts.PlayerProfile);
    tx = await playerProfileContract.setDungeonCore(DUNGEON_CORE_ADDRESS);
    await tx.wait();
    console.log("✅ PlayerProfile.setDungeonCore 完成");
    
    // VIPStaking 設置 DungeonCore
    console.log("🔄 設置 VIPStaking.setDungeonCore...");
    const vipStakingContract = await hre.ethers.getContractAt("VIPStaking", deployedContracts.VIPStaking);
    tx = await vipStakingContract.setDungeonCore(DUNGEON_CORE_ADDRESS);
    await tx.wait();
    console.log("✅ VIPStaking.setDungeonCore 完成");
    
    // ========== 第 4 步：設置 DungeonMaster 的額外依賴 ==========
    console.log("\n🔄 第 4 步：設置 DungeonMaster 的額外依賴\n");
    
    const dungeonMasterContract = await hre.ethers.getContractAt("DungeonMaster", deployedContracts.DungeonMaster);
    
    // 設置 DungeonStorage
    console.log("🔄 設置 DungeonMaster.setDungeonStorage...");
    tx = await dungeonMasterContract.setDungeonStorage(DUNGEON_STORAGE_ADDRESS);
    await tx.wait();
    console.log("✅ DungeonMaster.setDungeonStorage 完成");
    
    // ========== 第 5 步：驗證所有連接 ==========
    console.log("\n🔍 第 5 步：驗證所有連接\n");
    
    try {
        // 驗證 DungeonCore 設置
        const heroAddr = await dungeonCore.heroContractAddress();
        const relicAddr = await dungeonCore.relicContractAddress();
        const partyAddr = await dungeonCore.partyContractAddress();
        const profileAddr = await dungeonCore.playerProfileAddress();
        const vipAddr = await dungeonCore.vipStakingAddress();
        const dmAddr = await dungeonCore.dungeonMasterAddress();
        
        console.log("✅ DungeonCore 連接驗證:");
        console.log(`  Hero: ${heroAddr} ${heroAddr === deployedContracts.Hero ? '✓' : '✗'}`);
        console.log(`  Relic: ${relicAddr} ${relicAddr === deployedContracts.Relic ? '✓' : '✗'}`);
        console.log(`  Party: ${partyAddr} ${partyAddr === deployedContracts.Party ? '✓' : '✗'}`);
        console.log(`  PlayerProfile: ${profileAddr} ${profileAddr === deployedContracts.PlayerProfile ? '✓' : '✗'}`);
        console.log(`  VIPStaking: ${vipAddr} ${vipAddr === deployedContracts.VIPStaking ? '✓' : '✗'}`);
        console.log(`  DungeonMaster: ${dmAddr} ${dmAddr === deployedContracts.DungeonMaster ? '✓' : '✗'}`);
        
        // 驗證各 NFT 合約的 DungeonCore 設置
        const heroCore = await heroContract.dungeonCore();
        const relicCore = await relicContract.dungeonCore();
        const partyCore = await partyContract.dungeonCoreContract();
        const profileCore = await playerProfileContract.dungeonCore();
        const vipCore = await vipStakingContract.dungeonCore();
        const dmCore = await dungeonMasterContract.dungeonCore();
        
        console.log("\n✅ 反向連接驗證:");
        console.log(`  Hero -> DungeonCore: ${heroCore} ${heroCore === DUNGEON_CORE_ADDRESS ? '✓' : '✗'}`);
        console.log(`  Relic -> DungeonCore: ${relicCore} ${relicCore === DUNGEON_CORE_ADDRESS ? '✓' : '✗'}`);
        console.log(`  Party -> DungeonCore: ${partyCore} ${partyCore === DUNGEON_CORE_ADDRESS ? '✓' : '✗'}`);
        console.log(`  PlayerProfile -> DungeonCore: ${profileCore} ${profileCore === DUNGEON_CORE_ADDRESS ? '✓' : '✗'}`);
        console.log(`  VIPStaking -> DungeonCore: ${vipCore} ${vipCore === DUNGEON_CORE_ADDRESS ? '✓' : '✗'}`);
        console.log(`  DungeonMaster -> DungeonCore: ${dmCore} ${dmCore === DUNGEON_CORE_ADDRESS ? '✓' : '✗'}`);
        
        // 驗證 DungeonMaster 的額外設置
        const dmStorage = await dungeonMasterContract.dungeonStorage();
        console.log(`  DungeonMaster -> DungeonStorage: ${dmStorage} ${dmStorage === DUNGEON_STORAGE_ADDRESS ? '✓' : '✗'}`);
        
    } catch (error) {
        console.error("❌ 連接驗證失敗:", error.message);
    }
    
    // ========== 生成配置文件 ==========
    console.log("\n📄 生成部署配置文件...");
    
    const deploymentConfig = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            DungeonCore: DUNGEON_CORE_ADDRESS,
            DungeonStorage: DUNGEON_STORAGE_ADDRESS,
            ...deployedContracts
        },
        startBlock: (await hre.ethers.provider.getBlockNumber()) - 100 // 估算起始區塊
    };
    
    const fs = require('fs');
    const configPath = `./deployments/v25-nft-contracts-${Date.now()}.json`;
    fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));
    console.log("✅ 配置文件已保存:", configPath);
    
    // ========== 總結 ==========
    console.log("\n🎉 V25 NFT 合約部署和互連完成！");
    console.log("\n📋 後續步驟:");
    console.log("1. 使用 BSCScan API 驗證合約開源");
    console.log("2. 更新前端/後端/子圖配置");
    console.log("3. 重新部署子圖");
    console.log("4. 測試所有功能");
    
    console.log("\n🔧 驗證命令:");
    Object.entries(deployedContracts).forEach(([name, address]) => {
        console.log(`npx hardhat verify --network bsc ${address} ${name === 'DungeonMaster' ? `${deployer.address} ${DUNGEON_CORE_ADDRESS}` : name === 'Party' ? '' : deployer.address}`);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });
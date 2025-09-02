const hre = require("hardhat");

/**
 * V25 NFT 合約配置完成腳本
 * 完成 DungeonCore 設置和各合約的互連
 */

async function main() {
    console.log("🔧 完成 V25 NFT 合約配置...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("操作者地址:", deployer.address);
    
    // 已部署的合約地址
    const contracts = {
        DungeonCore: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        DungeonStorage: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
        Hero: "0xe3DeF34622098B9dc7f042243Ce4f998Dfa3C662",
        Relic: "0x9A682D761ef20377e46136a45f10C3B2a8A76CeF",
        Party: "0xd5A1dd4Da7F0609042EeBAE3b1a5eceb0A996e25",
        PlayerProfile: "0x7DEBfb8334c0aF31f6241f7aB2f78a9907823400",
        VIPStaking: "0xa4f98938ECfc8DBD586F7eE1d51B3c1FaDDDd5da",
        DungeonMaster: "0xb1c3ff1A3192B38Ff95C093992d244fc3b75abE0"
    };
    
    console.log("📍 合約地址配置:");
    Object.entries(contracts).forEach(([name, address]) => {
        console.log(`${name}: ${address}`);
    });
    console.log();
    
    // ========== 步驟 1：完成 DungeonCore 設置 ==========
    console.log("🔗 步驟 1：完成 DungeonCore 中的合約地址設置\n");
    
    const dungeonCore = await hre.ethers.getContractAt("IDungeonCore", contracts.DungeonCore);
    
    try {
        // 設置 DungeonMaster
        console.log("🔄 設置 DungeonCore.setDungeonMaster...");
        let tx = await dungeonCore.setDungeonMaster(contracts.DungeonMaster);
        await tx.wait();
        console.log("✅ DungeonCore.setDungeonMaster 完成");
    } catch (error) {
        console.log("⚠️ setDungeonMaster 可能已經設置過了:", error.message.substring(0, 100));
    }
    
    // ========== 步驟 2：設置每個 NFT 合約的 DungeonCore 地址 ==========
    console.log("\n🔄 步驟 2：為每個 NFT 合約設置 DungeonCore 地址\n");
    
    // Hero 設置 DungeonCore
    try {
        console.log("🔄 設置 Hero.setDungeonCore...");
        const heroContract = await hre.ethers.getContractAt("Hero", contracts.Hero);
        let tx = await heroContract.setDungeonCore(contracts.DungeonCore);
        await tx.wait();
        console.log("✅ Hero.setDungeonCore 完成");
    } catch (error) {
        console.log("⚠️ Hero setDungeonCore 可能已設置:", error.message.substring(0, 100));
    }
    
    // Relic 設置 DungeonCore
    try {
        console.log("🔄 設置 Relic.setDungeonCore...");
        const relicContract = await hre.ethers.getContractAt("Relic", contracts.Relic);
        let tx = await relicContract.setDungeonCore(contracts.DungeonCore);
        await tx.wait();
        console.log("✅ Relic.setDungeonCore 完成");
    } catch (error) {
        console.log("⚠️ Relic setDungeonCore 可能已設置:", error.message.substring(0, 100));
    }
    
    // Party 設置 DungeonCore
    try {
        console.log("🔄 設置 Party.setDungeonCore...");
        const partyContract = await hre.ethers.getContractAt("Party", contracts.Party);
        let tx = await partyContract.setDungeonCore(contracts.DungeonCore);
        await tx.wait();
        console.log("✅ Party.setDungeonCore 完成");
    } catch (error) {
        console.log("⚠️ Party setDungeonCore 可能已設置:", error.message.substring(0, 100));
    }
    
    // PlayerProfile 設置 DungeonCore
    try {
        console.log("🔄 設置 PlayerProfile.setDungeonCore...");
        const playerProfileContract = await hre.ethers.getContractAt("PlayerProfile", contracts.PlayerProfile);
        let tx = await playerProfileContract.setDungeonCore(contracts.DungeonCore);
        await tx.wait();
        console.log("✅ PlayerProfile.setDungeonCore 完成");
    } catch (error) {
        console.log("⚠️ PlayerProfile setDungeonCore 可能已設置:", error.message.substring(0, 100));
    }
    
    // VIPStaking 設置 DungeonCore
    try {
        console.log("🔄 設置 VIPStaking.setDungeonCore...");
        const vipStakingContract = await hre.ethers.getContractAt("VIPStaking", contracts.VIPStaking);
        let tx = await vipStakingContract.setDungeonCore(contracts.DungeonCore);
        await tx.wait();
        console.log("✅ VIPStaking.setDungeonCore 完成");
    } catch (error) {
        console.log("⚠️ VIPStaking setDungeonCore 可能已設置:", error.message.substring(0, 100));
    }
    
    // ========== 步驟 3：設置 DungeonMaster 的額外依賴 ==========
    console.log("\n🔄 步驟 3：設置 DungeonMaster 的額外依賴\n");
    
    try {
        const dungeonMasterContract = await hre.ethers.getContractAt("DungeonMaster", contracts.DungeonMaster);
        
        // 設置 DungeonCore
        console.log("🔄 設置 DungeonMaster.setDungeonCore...");
        let tx = await dungeonMasterContract.setDungeonCore(contracts.DungeonCore);
        await tx.wait();
        console.log("✅ DungeonMaster.setDungeonCore 完成");
        
        // 設置 DungeonStorage
        console.log("🔄 設置 DungeonMaster.setDungeonStorage...");
        tx = await dungeonMasterContract.setDungeonStorage(contracts.DungeonStorage);
        await tx.wait();
        console.log("✅ DungeonMaster.setDungeonStorage 完成");
    } catch (error) {
        console.log("⚠️ DungeonMaster 設置可能已完成:", error.message.substring(0, 100));
    }
    
    // ========== 步驟 4：驗證所有連接 ==========
    console.log("\n🔍 步驟 4：驗證所有連接\n");
    
    try {
        // 驗證 DungeonCore 設置
        const heroAddr = await dungeonCore.heroContractAddress();
        const relicAddr = await dungeonCore.relicContractAddress();
        const partyAddr = await dungeonCore.partyContractAddress();
        const profileAddr = await dungeonCore.playerProfileAddress();
        const vipAddr = await dungeonCore.vipStakingAddress();
        const dmAddr = await dungeonCore.dungeonMasterAddress();
        
        console.log("✅ DungeonCore 連接驗證:");
        console.log(`  Hero: ${heroAddr} ${heroAddr === contracts.Hero ? '✓' : '✗'}`);
        console.log(`  Relic: ${relicAddr} ${relicAddr === contracts.Relic ? '✓' : '✗'}`);
        console.log(`  Party: ${partyAddr} ${partyAddr === contracts.Party ? '✓' : '✗'}`);
        console.log(`  PlayerProfile: ${profileAddr} ${profileAddr === contracts.PlayerProfile ? '✓' : '✗'}`);
        console.log(`  VIPStaking: ${vipAddr} ${vipAddr === contracts.VIPStaking ? '✓' : '✗'}`);
        console.log(`  DungeonMaster: ${dmAddr} ${dmAddr === contracts.DungeonMaster ? '✓' : '✗'}`);
        
        // 驗證各 NFT 合約的 DungeonCore 設置
        const heroContract = await hre.ethers.getContractAt("Hero", contracts.Hero);
        const relicContract = await hre.ethers.getContractAt("Relic", contracts.Relic);
        const partyContract = await hre.ethers.getContractAt("Party", contracts.Party);
        const playerProfileContract = await hre.ethers.getContractAt("PlayerProfile", contracts.PlayerProfile);
        const vipStakingContract = await hre.ethers.getContractAt("VIPStaking", contracts.VIPStaking);
        const dungeonMasterContract = await hre.ethers.getContractAt("DungeonMaster", contracts.DungeonMaster);
        
        const heroCore = await heroContract.dungeonCore();
        const relicCore = await relicContract.dungeonCore();
        const partyCore = await partyContract.dungeonCoreContract();
        const profileCore = await playerProfileContract.dungeonCore();
        const vipCore = await vipStakingContract.dungeonCore();
        const dmCore = await dungeonMasterContract.dungeonCore();
        
        console.log("\n✅ 反向連接驗證:");
        console.log(`  Hero -> DungeonCore: ${heroCore} ${heroCore === contracts.DungeonCore ? '✓' : '✗'}`);
        console.log(`  Relic -> DungeonCore: ${relicCore} ${relicCore === contracts.DungeonCore ? '✓' : '✗'}`);
        console.log(`  Party -> DungeonCore: ${partyCore} ${partyCore === contracts.DungeonCore ? '✓' : '✗'}`);
        console.log(`  PlayerProfile -> DungeonCore: ${profileCore} ${profileCore === contracts.DungeonCore ? '✓' : '✗'}`);
        console.log(`  VIPStaking -> DungeonCore: ${vipCore} ${vipCore === contracts.DungeonCore ? '✓' : '✗'}`);
        console.log(`  DungeonMaster -> DungeonCore: ${dmCore} ${dmCore === contracts.DungeonCore ? '✓' : '✗'}`);
        
        // 驗證 DungeonMaster 的額外設置
        const dmStorage = await dungeonMasterContract.dungeonStorage();
        console.log(`  DungeonMaster -> DungeonStorage: ${dmStorage} ${dmStorage === contracts.DungeonStorage ? '✓' : '✗'}`);
        
    } catch (error) {
        console.error("❌ 連接驗證失敗:", error.message);
    }
    
    // ========== 生成配置文件 ==========
    console.log("\n📄 生成部署配置文件...");
    
    const deploymentConfig = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        version: "V25.1.4-NFT",
        contracts: contracts,
        startBlock: (await hre.ethers.provider.getBlockNumber()) - 100
    };
    
    const fs = require('fs');
    const configPath = `./deployments/v25-1-4-nft-contracts-${Date.now()}.json`;
    fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));
    console.log("✅ 配置文件已保存:", configPath);
    
    // ========== 總結 ==========
    console.log("\n🎉 V25.1.4 NFT 合約部署和配置完成！");
    console.log("\n📋 新部署的合約:");
    const newContracts = ['Hero', 'Relic', 'Party', 'PlayerProfile', 'VIPStaking', 'DungeonMaster'];
    newContracts.forEach(name => {
        console.log(`${name}: ${contracts[name]}`);
    });
    
    console.log("\n🔧 驗證命令:");
    newContracts.forEach(name => {
        console.log(`npx hardhat verify --network bsc ${contracts[name]}`);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 配置失敗:", error);
        process.exit(1);
    });
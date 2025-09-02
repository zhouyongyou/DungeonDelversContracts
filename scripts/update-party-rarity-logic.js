// Update Party Contract with Power-based Rarity Calculation
// 2025-08-23: Change rarity calculation from capacity to total power

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 部署新的 Party 合約（使用戰力計算稀有度）...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("部署者餘額:", hre.ethers.formatEther(balance), "BNB\n");
    
    // 載入當前配置
    const configPath = path.join(__dirname, '../.env.v25');
    require('dotenv').config({ path: configPath });
    
    const DUNGEONCORE_ADDRESS = process.env.DUNGEONCORE_ADDRESS;
    console.log("DungeonCore 地址:", DUNGEONCORE_ADDRESS);
    
    // 部署新的 Party 合約
    console.log("\n📦 部署新的 Party 合約...");
    const Party = await hre.ethers.getContractFactory("Party");
    const party = await Party.deploy(DUNGEONCORE_ADDRESS);
    await party.waitForDeployment();
    
    const partyAddress = await party.getAddress();
    console.log("✅ Party 部署成功:", partyAddress);
    
    // 更新 DungeonCore 中的 Party 地址
    console.log("\n🔧 更新 DungeonCore 中的 Party 地址...");
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
    
    const tx = await dungeonCore.setPartyContractAddress(partyAddress);
    await tx.wait();
    console.log("✅ DungeonCore 已更新 Party 地址");
    
    // 更新配置文件
    console.log("\n📝 更新配置文件...");
    let envContent = fs.readFileSync(configPath, 'utf8');
    envContent = envContent.replace(/PARTY_ADDRESS=.*/g, `PARTY_ADDRESS=${partyAddress}`);
    fs.writeFileSync(configPath, envContent);
    console.log("✅ 配置文件已更新");
    
    // 保存部署記錄
    const deploymentRecord = {
        contract: "Party",
        address: partyAddress,
        previousAddress: process.env.PARTY_ADDRESS,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        network: hre.network.name,
        changes: "Changed rarity calculation from capacity-based to power-based",
        thresholds: {
            5: "2700+ power",
            4: "2100-2699 power", 
            3: "1500-2099 power",
            2: "900-1499 power",
            1: "0-899 power"
        }
    };
    
    const recordPath = path.join(__dirname, '../deployments', `party-update-${Date.now()}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    console.log("✅ 部署記錄已保存:", recordPath);
    
    // 同步配置到其他項目
    console.log("\n🔄 同步配置到所有項目...");
    const { execSync } = require('child_process');
    execSync('node scripts/ultimate-config-system.js sync', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    
    console.log("\n✨ Party 合約更新完成！");
    console.log("\n📊 新的稀有度計算規則：");
    console.log("  UR  (Ultra Rare)        : 2700+ 戰力");
    console.log("  SSR (Super Super Rare)  : 2100-2699 戰力");
    console.log("  SR  (Super Rare)        : 1500-2099 戰力");
    console.log("  R   (Rare)              : 900-1499 戰力");
    console.log("  N   (Normal)            : 0-899 戰力");
    
    console.log("\n⚠️  注意事項：");
    console.log("1. 新創建的隊伍將使用新的計算規則");
    console.log("2. 現有隊伍的稀有度不會自動更新");
    console.log("3. 需要重新部署 subgraph 以反映變更");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
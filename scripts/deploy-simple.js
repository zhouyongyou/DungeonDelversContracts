const { ethers, network } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log(`=== 部署修復版合約 ===`);
    console.log(`網路: ${network.name}`);
    console.log(`部署者地址: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`部署者餘額: ${ethers.formatEther(balance)} BNB`);
    
    // 部署 Hero 合約
    console.log(`📦 部署新的 Hero 合約...`);
    const HeroFactory = await ethers.getContractFactory("Hero");
    const heroContract = await HeroFactory.deploy(deployer.address);
    await heroContract.waitForDeployment();
    const heroAddress = await heroContract.getAddress();
    console.log(`✅ Hero 合約已部署: ${heroAddress}`);
    
    // 部署 Relic 合約
    console.log(`📦 部署新的 Relic 合約...`);
    const RelicFactory = await ethers.getContractFactory("Relic");
    const relicContract = await RelicFactory.deploy(deployer.address);
    await relicContract.waitForDeployment();
    const relicAddress = await relicContract.getAddress();
    console.log(`✅ Relic 合約已部署: ${relicAddress}`);
    
    // 部署 AltarOfAscension 合約
    console.log(`📦 部署新的 AltarOfAscension 合約...`);
    const AltarFactory = await ethers.getContractFactory("AltarOfAscension");
    const altarContract = await AltarFactory.deploy(deployer.address);
    await altarContract.waitForDeployment();
    const altarAddress = await altarContract.getAddress();
    console.log(`✅ AltarOfAscension 合約已部署: ${altarAddress}`);
    
    console.log(`\n=== 部署完成 ===`);
    console.log(`新 Hero 合約地址: ${heroAddress}`);
    console.log(`新 Relic 合約地址: ${relicAddress}`);
    console.log(`新 AltarOfAscension 合約地址: ${altarAddress}`);
    
    // 儲存地址到檔案
    const fs = require('fs');
    const addresses = {
        network: network.name,
        deployedAt: new Date().toISOString(),
        contracts: {
            Hero: heroAddress,
            Relic: relicAddress,
            AltarOfAscension: altarAddress
        }
    };
    
    fs.writeFileSync('./deployed-addresses.json', JSON.stringify(addresses, null, 2));
    console.log(`\n📋 地址已儲存至 deployed-addresses.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
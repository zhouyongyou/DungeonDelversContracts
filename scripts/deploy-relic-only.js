const { ethers, network } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log(`=== 部署修復版 Relic 合約 ===`);
    console.log(`網路: ${network.name}`);
    console.log(`部署者地址: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`部署者餘額: ${ethers.formatEther(balance)} BNB`);
    
    // 部署 Relic 合約
    console.log(`📦 部署新的 Relic 合約...`);
    const RelicFactory = await ethers.getContractFactory("Relic");
    const relicContract = await RelicFactory.deploy(deployer.address);
    await relicContract.waitForDeployment();
    const relicAddress = await relicContract.getAddress();
    
    console.log(`✅ Relic 合約已部署: ${relicAddress}`);
    
    // 儲存到檔案
    const fs = require('fs');
    const deployData = {
        network: network.name,
        deployedAt: new Date().toISOString(),
        Relic: relicAddress,
        txHash: relicContract.deploymentTransaction().hash
    };
    
    fs.writeFileSync('./relic-address.json', JSON.stringify(deployData, null, 2));
    console.log(`📋 地址已儲存至 relic-address.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
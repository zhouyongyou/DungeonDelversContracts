const { ethers, network } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log(`=== 部署修復版 AltarOfAscension 合約 ===`);
    console.log(`網路: ${network.name}`);
    console.log(`部署者地址: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`部署者餘額: ${ethers.formatEther(balance)} BNB`);
    
    // 部署 AltarOfAscension 合約
    console.log(`📦 部署新的 AltarOfAscension 合約...`);
    const AltarFactory = await ethers.getContractFactory("AltarOfAscension");
    const altarContract = await AltarFactory.deploy(deployer.address);
    await altarContract.waitForDeployment();
    const altarAddress = await altarContract.getAddress();
    
    console.log(`✅ AltarOfAscension 合約已部署: ${altarAddress}`);
    
    // 儲存到檔案
    const fs = require('fs');
    const deployData = {
        network: network.name,
        deployedAt: new Date().toISOString(),
        AltarOfAscension: altarAddress,
        txHash: altarContract.deploymentTransaction().hash
    };
    
    fs.writeFileSync('./altar-address.json', JSON.stringify(deployData, null, 2));
    console.log(`📋 地址已儲存至 altar-address.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
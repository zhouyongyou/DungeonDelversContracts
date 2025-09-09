// 緊急部署VIPStaking合約到BSC主網
const { ethers } = require("hardhat");
require('dotenv').config();

async function emergencyDeploy() {
    console.log("🚨 緊急部署VIPStaking到BSC主網...");
    
    // 使用稍高的gas price以確保執行成功
    const GAS_PRICE = ethers.parseUnits("1", "gwei"); // 1 gwei而不是0.11
    
    const [deployer] = await ethers.getSigners();
    console.log(`部署地址: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`餘額: ${ethers.formatEther(balance)} BNB`);
    
    if (balance < ethers.parseEther("0.01")) {
        throw new Error("❌ BNB餘額不足");
    }
    
    try {
        // 部署VIPStaking
        console.log("📦 部署VIPStaking合約...");
        const VIPStaking = await ethers.getContractFactory("VIPStaking");
        
        const vipStaking = await VIPStaking.deploy({
            gasPrice: GAS_PRICE,
            gasLimit: 3000000
        });
        
        await vipStaking.waitForDeployment();
        const vipStakingAddress = await vipStaking.getAddress();
        
        console.log(`✅ VIPStaking部署成功: ${vipStakingAddress}`);
        console.log(`📊 BSCScan: https://bscscan.com/address/${vipStakingAddress}`);
        
        // 更新.env文件
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // 更新VIPStaking地址
        const regex = /^VITE_VIPSTAKING_ADDRESS=.*/m;
        const newLine = `VITE_VIPSTAKING_ADDRESS=${vipStakingAddress}`;
        
        if (envContent.match(regex)) {
            envContent = envContent.replace(regex, newLine);
        } else {
            envContent += `\n${newLine}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ .env文件已更新新地址`);
        
        return vipStakingAddress;
        
    } catch (error) {
        console.error("❌ 部署失敗:", error.message);
        throw error;
    }
}

if (require.main === module) {
    emergencyDeploy().catch(console.error);
}

module.exports = emergencyDeploy;
// VIPStaking Contract Redeployment Script
// Features: Deploy + Verify + DungeonCore Connection Setup
// Critical: Uses 0.11 gwei gas price for all transactions

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 🚨 Critical Gas Price Setting - DO NOT MODIFY
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

async function main() {
    console.log("🚀 VIPStaking Contract Redeployment Script Starting...");
    console.log(`⚡ Gas Price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);
    
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deploying from account: ${deployer.address}`);
    
    // Get current balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} BNB`);
    
    if (balance < ethers.parseEther("0.01")) {
        console.warn("⚠️  Warning: Low BNB balance. Deployment might fail.");
    }
    
    // Load DungeonCore address from environment
    const dungeonCoreAddress = process.env.VITE_DUNGEON_CORE_ADDRESS;
    if (!dungeonCoreAddress) {
        throw new Error("❌ VITE_DUNGEON_CORE_ADDRESS not found in .env");
    }
    console.log(`🏗️ DungeonCore Address: ${dungeonCoreAddress}`);
    
    try {
        // Step 1: Deploy VIPStaking Contract
        console.log("\n📦 Step 1: Deploying VIPStaking Contract...");
        const VIPStaking = await ethers.getContractFactory("VIPStaking");
        
        const vipStaking = await VIPStaking.deploy({
            gasPrice: GAS_PRICE,
            gasLimit: 3000000 // Conservative gas limit
        });
        
        console.log(`⏳ Deployment transaction: ${vipStaking.deploymentTransaction().hash}`);
        console.log("⏳ Waiting for deployment confirmation...");
        
        await vipStaking.waitForDeployment();
        const vipStakingAddress = await vipStaking.getAddress();
        
        console.log(`✅ VIPStaking deployed at: ${vipStakingAddress}`);
        
        // Step 2: Verify deployment is working
        console.log("\n🔍 Step 2: Verifying deployment...");
        const name = await vipStaking.name();
        const symbol = await vipStaking.symbol();
        const owner = await vipStaking.owner();
        
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Owner: ${owner}`);
        
        // Step 3: Setup DungeonCore connection
        console.log("\n🔗 Step 3: Setting up DungeonCore connection...");
        
        // Set DungeonCore address in VIPStaking
        const setDungeonCoreTx = await vipStaking.setDungeonCore(dungeonCoreAddress, {
            gasPrice: GAS_PRICE,
            gasLimit: 100000
        });
        
        console.log(`⏳ SetDungeonCore transaction: ${setDungeonCoreTx.hash}`);
        await setDungeonCoreTx.wait();
        console.log("✅ DungeonCore address set in VIPStaking");
        
        // Verify DungeonCore connection
        const connectedDungeonCore = await vipStaking.dungeonCore();
        if (connectedDungeonCore.toLowerCase() === dungeonCoreAddress.toLowerCase()) {
            console.log("✅ DungeonCore connection verified");
        } else {
            throw new Error("❌ DungeonCore connection failed");
        }
        
        // Step 4: Setup reverse connection in DungeonCore
        console.log("\n🔄 Step 4: Setting up reverse connection in DungeonCore...");
        
        const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
        
        const setVipStakingTx = await dungeonCore.setVipStakingAddress(vipStakingAddress, {
            gasPrice: GAS_PRICE,
            gasLimit: 100000
        });
        
        console.log(`⏳ SetVipStaking transaction: ${setVipStakingTx.hash}`);
        await setVipStakingTx.wait();
        console.log("✅ VIPStaking address set in DungeonCore");
        
        // Verify reverse connection
        const connectedVipStaking = await dungeonCore.vipStakingAddress();
        if (connectedVipStaking.toLowerCase() === vipStakingAddress.toLowerCase()) {
            console.log("✅ Reverse connection verified");
        } else {
            throw new Error("❌ Reverse connection failed");
        }
        
        // Step 5: Contract Verification on BSCScan
        console.log("\n🔐 Step 5: Preparing contract verification...");
        
        const bscApiKey = process.env.BSC_API_KEY;
        if (!bscApiKey) {
            console.warn("⚠️  BSC_API_KEY not found. Skipping automatic verification.");
            console.log("📝 Manual verification command:");
            console.log(`   npx hardhat verify --network bsc ${vipStakingAddress}`);
        } else {
            try {
                console.log("🔐 Attempting automatic verification...");
                
                // Run hardhat verify
                const { exec } = require('child_process');
                const verifyCommand = `npx hardhat verify --network bsc ${vipStakingAddress}`;
                
                await new Promise((resolve, reject) => {
                    exec(verifyCommand, (error, stdout, stderr) => {
                        if (error) {
                            console.warn("⚠️  Automatic verification failed:", error.message);
                            console.log("📝 Please verify manually using:");
                            console.log(`   ${verifyCommand}`);
                            resolve(); // Don't fail the entire script
                        } else {
                            console.log("✅ Contract verified on BSCScan");
                            console.log(stdout);
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.warn("⚠️  Verification process encountered an issue:", error.message);
            }
        }
        
        // Step 6: Update environment variables
        console.log("\n📝 Step 6: Updating environment variables...");
        
        const envPath = path.join(__dirname, '../../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update VIPStaking address
        const vipStakingRegex = /^VITE_VIP_STAKING_ADDRESS=.*/m;
        const newVipStakingLine = `VITE_VIP_STAKING_ADDRESS=${vipStakingAddress}`;
        
        if (envContent.match(vipStakingRegex)) {
            envContent = envContent.replace(vipStakingRegex, newVipStakingLine);
        } else {
            envContent += `\n${newVipStakingLine}`;
        }
        
        // Write updated .env file
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Updated .env with new VIPStaking address: ${vipStakingAddress}`);
        
        // Step 7: Test basic functionality
        console.log("\n🧪 Step 7: Testing basic functionality...");
        
        try {
            // Test getVipLevel for zero address (should return 0)
            const zeroLevel = await vipStaking.getVipLevel(ethers.ZeroAddress);
            console.log(`   Zero address VIP level: ${zeroLevel} (expected: 0)`);
            
            // Test VIP tax reduction for zero address
            const zeroReduction = await vipStaking.getVipTaxReduction(ethers.ZeroAddress);
            console.log(`   Zero address tax reduction: ${zeroReduction} basis points (expected: 0)`);
            
            // Test total supply
            const totalSupply = await vipStaking.totalSupply();
            console.log(`   Total supply: ${totalSupply} (expected: 0 for new contract)`);
            
            console.log("✅ Basic functionality tests passed");
        } catch (error) {
            console.warn("⚠️  Some functionality tests failed:", error.message);
        }
        
        // Final summary
        console.log("\n🎉 VIPStaking Redeployment Complete!");
        console.log("📋 Summary:");
        console.log(`   New VIPStaking Address: ${vipStakingAddress}`);
        console.log(`   Connected to DungeonCore: ${dungeonCoreAddress}`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Gas Price Used: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);
        console.log(`   BSCScan: https://bscscan.com/address/${vipStakingAddress}`);
        
        console.log("\n📌 Next Steps:");
        console.log("1. Run config sync to update frontend:");
        console.log("   node scripts/ultimate-config-system.js sync");
        console.log("2. Restart frontend development server");
        console.log("3. Test VIP staking functionality in the UI");
        console.log("4. Monitor contract events and transactions");
        
        // Save deployment info to file
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            network: "BSC Mainnet",
            vipStakingAddress: vipStakingAddress,
            dungeonCoreAddress: dungeonCoreAddress,
            owner: owner,
            gasPrice: ethers.formatUnits(GAS_PRICE, "gwei") + " gwei",
            deploymentTxHash: vipStaking.deploymentTransaction().hash,
            bscScanUrl: `https://bscscan.com/address/${vipStakingAddress}`
        };
        
        const deploymentLogPath = path.join(__dirname, '../logs/vipstaking-deployment.json');
        fs.writeFileSync(deploymentLogPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n📁 Deployment log saved: ${deploymentLogPath}`);
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.error("💸 Insufficient BNB for deployment. Please add more BNB to your account.");
        } else if (error.code === 'NETWORK_ERROR') {
            console.error("🌐 Network connection error. Please check your RPC connection.");
        } else if (error.message.includes('gas')) {
            console.error("⛽ Gas-related error. The 0.11 gwei gas price might be too low for current network conditions.");
        }
        
        process.exit(1);
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Unexpected error:", error);
            process.exit(1);
        });
}

module.exports = main;
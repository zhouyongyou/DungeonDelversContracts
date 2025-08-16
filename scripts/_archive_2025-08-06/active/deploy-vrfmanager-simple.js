#!/usr/bin/env node

const hre = require("hardhat");

async function main() {
    console.log("🚀 部署 VRFManager 到 BSC 主網...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署賬戶:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("賬戶餘額:", hre.ethers.formatEther(balance), "BNB\n");
    
    // VRF V2.5 Coordinator 地址
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    
    try {
        console.log("部署 VRFManager...");
        const VRFManager = await hre.ethers.getContractFactory("VRFManager");
        const vrfManager = await VRFManager.deploy(VRF_COORDINATOR);
        
        // 獲取部署地址
        const address = await vrfManager.getAddress();
        console.log("VRFManager 合約地址:", address);
        
        // 等待部署
        console.log("等待區塊確認...");
        await vrfManager.waitForDeployment();
        
        console.log("\n✅ VRFManager 部署成功!");
        console.log("地址:", address);
        console.log("VRF Coordinator:", VRF_COORDINATOR);
        
        // 設置 VRF 配置
        console.log("\n設置 VRF 配置...");
        const tx = await vrfManager.updateVRFConfig(
            "0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c", // 500 gwei key hash
            500000, // callback gas limit
            3, // confirmations
            hre.ethers.parseEther("0.005") // VRF price
        );
        
        console.log("配置交易:", tx.hash);
        await tx.wait();
        console.log("✅ VRF 配置完成!");
        
        // 充值
        console.log("\n充值 0.05 BNB...");
        const fundTx = await deployer.sendTransaction({
            to: address,
            value: hre.ethers.parseEther("0.05")
        });
        await fundTx.wait();
        console.log("✅ 充值成功!");
        
        console.log("\n=== 部署完成 ===");
        console.log("VRFManager:", address);
        console.log("\n請將此地址保存到 .env:");
        console.log(`VRFMANAGER_ADDRESS=${address}`);
        
    } catch (error) {
        console.error("❌ 錯誤:", error.message);
        if (error.data) {
            console.error("錯誤數據:", error.data);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
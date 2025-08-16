#!/usr/bin/env node

/**
 * 單獨部署 VRFManager 腳本
 * BSC 主網 - 使用 Chainlink VRF V2.5 Direct Funding 模式
 * 
 * VRF V2.5 配置：
 * - Coordinator: 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9
 * - Wrapper: 0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94
 * - Key Hash (500 gwei): 0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// BSC Mainnet VRF V2.5 Coordinator 地址 (Direct Funding)
const VRF_COORDINATOR_BSC = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";

// BSC 主網 VRF V2.5 配置
const VRF_CONFIG = {
    // BSC 主網 Key Hash (500 gwei) - VRF V2.5
    keyHash: "0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c",
    
    // 回調 Gas 限制
    callbackGasLimit: 500000,
    
    // 確認區塊數（BSC 建議 3）
    requestConfirmations: 3,
    
    // VRF 請求價格（Direct Funding 模式）
    // 約 0.005 BNB ≈ $1.5 USD (根據 BNB 價格調整)
    vrfRequestPrice: hre.ethers.parseEther("0.005")
};

async function main() {
    console.log("🚀 開始部署 VRFManager (BSC 主網 VRF V2.5 Direct Funding)...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署賬戶:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("賬戶餘額:", hre.ethers.formatEther(balance), "BNB");
    
    // 檢查餘額是否足夠
    const minBalance = hre.ethers.parseEther("0.02"); // 最少 0.02 BNB
    if (balance < minBalance) {
        console.error("❌ 餘額不足，至少需要 0.02 BNB");
        process.exit(1);
    }
    
    console.log("\n📋 VRF 配置:");
    console.log("VRF Coordinator:", VRF_COORDINATOR_BSC);
    console.log("Key Hash:", VRF_CONFIG.keyHash);
    console.log("Callback Gas Limit:", VRF_CONFIG.callbackGasLimit);
    console.log("Request Confirmations:", VRF_CONFIG.requestConfirmations);
    console.log("VRF Request Price:", hre.ethers.formatEther(VRF_CONFIG.vrfRequestPrice), "BNB");
    console.log("");
    
    try {
        // 1. 部署 VRFManager
        console.log("1️⃣ 部署 VRFManager...");
        const VRFManager = await hre.ethers.getContractFactory("VRFManager");
        const vrfManager = await VRFManager.deploy(VRF_COORDINATOR_BSC);
        
        console.log("📝 交易已發送，等待確認...");
        const deployTx = vrfManager.deploymentTransaction();
        if (deployTx) {
            console.log("交易哈希:", deployTx.hash);
            console.log("⏳ 等待部署確認（可能需要幾分鐘）...");
            await deployTx.wait(2); // 等待2個區塊確認
        }
        
        await vrfManager.waitForDeployment();
        
        const vrfManagerAddress = await vrfManager.getAddress();
        console.log("✅ VRFManager 部署於:", vrfManagerAddress);
        
        // 2. 配置 VRF 參數
        console.log("\n2️⃣ 配置 VRF 參數...");
        const tx = await vrfManager.updateVRFConfig(
            VRF_CONFIG.keyHash,
            VRF_CONFIG.callbackGasLimit,
            VRF_CONFIG.requestConfirmations,
            VRF_CONFIG.vrfRequestPrice
        );
        
        console.log("⏳ 等待配置交易確認...");
        await tx.wait();
        console.log("✅ VRF 參數配置完成");
        
        // 3. 為 VRFManager 充值（Direct Funding 需要）
        console.log("\n3️⃣ 為 VRFManager 充值...");
        const fundingAmount = hre.ethers.parseEther("0.05"); // 充值 0.05 BNB
        
        const fundTx = await deployer.sendTransaction({
            to: vrfManagerAddress,
            value: fundingAmount
        });
        
        console.log("⏳ 等待充值交易確認...");
        await fundTx.wait();
        console.log(`✅ 已向 VRFManager 充值 ${hre.ethers.formatEther(fundingAmount)} BNB`);
        
        // 4. 驗證部署
        console.log("\n4️⃣ 驗證部署...");
        const coordinator = await vrfManager.vrfCoordinator();
        const keyHash = await vrfManager.keyHash();
        const requestPrice = await vrfManager.vrfRequestPrice();
        const contractBalance = await hre.ethers.provider.getBalance(vrfManagerAddress);
        
        console.log("VRF Coordinator:", coordinator);
        console.log("Key Hash:", keyHash);
        console.log("Request Price:", hre.ethers.formatEther(requestPrice), "BNB");
        console.log("Contract Balance:", hre.ethers.formatEther(contractBalance), "BNB");
        
        // 驗證配置是否正確
        if (coordinator.toLowerCase() !== VRF_COORDINATOR_BSC.toLowerCase()) {
            console.error("❌ VRF Coordinator 地址不匹配");
            process.exit(1);
        }
        
        if (keyHash !== VRF_CONFIG.keyHash) {
            console.error("❌ Key Hash 不匹配");
            process.exit(1);
        }
        
        console.log("✅ 部署驗證通過");
        
        // 5. 保存部署信息
        const deploymentInfo = {
            network: hre.network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            blockNumber: await hre.ethers.provider.getBlockNumber(),
            contracts: {
                VRFMANAGER: vrfManagerAddress
            },
            vrfConfig: {
                coordinator: VRF_COORDINATOR_BSC,
                keyHash: VRF_CONFIG.keyHash,
                callbackGasLimit: VRF_CONFIG.callbackGasLimit,
                requestConfirmations: VRF_CONFIG.requestConfirmations,
                vrfRequestPrice: VRF_CONFIG.vrfRequestPrice.toString()
            },
            funding: {
                amount: fundingAmount.toString(),
                balance: contractBalance.toString()
            }
        };
        
        // 創建 deployments 目錄（如果不存在）
        const deploymentDir = path.join(__dirname, '../../deployments');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const deploymentPath = path.join(deploymentDir, `vrfmanager-only-${Date.now()}.json`);
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n✅ 部署信息已保存到:", deploymentPath);
        
        // 6. 更新環境變數提示
        console.log("\n📝 請將以下地址添加到 .env 文件:");
        console.log(`VRFMANAGER_ADDRESS=${vrfManagerAddress}`);
        
        // 7. 更新 master-config.json（如果存在）
        const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
        if (fs.existsSync(masterConfigPath)) {
            const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
            masterConfig.VRFMANAGER = vrfManagerAddress;
            masterConfig.VRF_ENABLED = true;
            masterConfig.VRF_COORDINATOR = VRF_COORDINATOR_BSC;
            masterConfig.VRF_REQUEST_PRICE = VRF_CONFIG.vrfRequestPrice.toString();
            
            fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
            console.log("✅ master-config.json 已更新");
        }
        
        console.log("\n🎉 VRFManager 部署完成！");
        console.log("\n📋 部署摘要:");
        console.log("================");
        console.log("VRFManager 地址:", vrfManagerAddress);
        console.log("VRF Coordinator:", VRF_COORDINATOR_BSC);
        console.log("充值金額:", hre.ethers.formatEther(fundingAmount), "BNB");
        console.log("合約餘額:", hre.ethers.formatEther(contractBalance), "BNB");
        
        console.log("\n⚠️ 後續步驟:");
        console.log("1. 複製 VRFManager 地址到 .env 文件");
        console.log("2. 在其他合約中設置 VRFManager 地址");
        console.log("3. 授權需要使用 VRF 的合約");
        console.log("4. 測試 VRF 功能");
        
        console.log("\n🔧 測試命令:");
        console.log(`node scripts/active/test-vrf.js ${vrfManagerAddress}`);
        
    } catch (error) {
        console.error("\n❌ 部署失敗:", error);
        console.error("Error details:", error.message);
        if (error.transaction) {
            console.error("Transaction hash:", error.transaction.hash);
        }
        process.exit(1);
    }
}

// 主函數執行
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
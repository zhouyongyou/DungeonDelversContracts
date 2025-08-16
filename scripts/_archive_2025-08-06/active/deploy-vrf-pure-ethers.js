#!/usr/bin/env node

/**
 * 使用純 ethers.js 部署 VRFManager
 * 避開 Hardhat ethers 包裝器的問題
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// BSC 主網 RPC
const BSC_RPC = "https://bsc-dataseed1.binance.org/";

// VRF V2.5 配置
const VRF_COORDINATOR_BSC = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
const KEY_HASH_500_GWEI = "0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c";

async function main() {
    console.log("🚀 使用純 ethers.js 部署 VRFManager 到 BSC 主網...\n");
    
    // 1. 設置 Provider 和 Wallet
    const provider = new ethers.JsonRpcProvider(BSC_RPC);
    
    // 從環境變數獲取私鑰
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ 錯誤: PRIVATE_KEY 環境變數未設置");
        process.exit(1);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("部署賬戶:", wallet.address);
    
    // 檢查餘額
    const balance = await provider.getBalance(wallet.address);
    console.log("賬戶餘額:", ethers.formatEther(balance), "BNB");
    
    if (balance < ethers.parseEther("0.1")) {
        console.error("❌ 餘額不足，至少需要 0.1 BNB");
        process.exit(1);
    }
    
    // 2. 讀取合約 ABI 和 Bytecode
    const contractPath = path.join(__dirname, "../../artifacts/contracts/current/core/VRFManager.sol/VRFManager.json");
    if (!fs.existsSync(contractPath)) {
        console.error("❌ 找不到合約 artifact，請先執行: npx hardhat compile");
        process.exit(1);
    }
    
    const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const abi = contractJson.abi;
    const bytecode = contractJson.bytecode;
    
    console.log("\n📋 VRF V2.5 配置:");
    console.log("VRF Coordinator:", VRF_COORDINATOR_BSC);
    console.log("Key Hash (500 gwei):", KEY_HASH_500_GWEI);
    console.log("");
    
    try {
        // 3. 部署合約
        console.log("1️⃣ 部署 VRFManager...");
        
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        
        // 估算 Gas
        const deploymentData = factory.interface.encodeDeploy([VRF_COORDINATOR_BSC]);
        const estimatedGas = await provider.estimateGas({
            from: wallet.address,
            data: bytecode + deploymentData.slice(2)
        });
        
        console.log("預估 Gas:", estimatedGas.toString());
        
        // 獲取 Gas 價格
        const feeData = await provider.getFeeData();
        console.log("Gas 價格:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
        
        // 部署合約
        const contract = await factory.deploy(VRF_COORDINATOR_BSC, {
            gasLimit: estimatedGas * 120n / 100n, // 增加 20% 的 buffer
            gasPrice: feeData.gasPrice
        });
        
        console.log("📝 交易已發送！");
        console.log("交易哈希:", contract.deploymentTransaction().hash);
        console.log("合約地址:", await contract.getAddress());
        
        // 等待部署確認
        console.log("\n⏳ 等待交易確認（可能需要 1-2 分鐘）...");
        const receipt = await contract.deploymentTransaction().wait(3); // 等待 3 個區塊確認
        
        console.log("✅ VRFManager 部署成功！");
        console.log("區塊號:", receipt.blockNumber);
        console.log("Gas 使用:", receipt.gasUsed.toString());
        
        const vrfManagerAddress = await contract.getAddress();
        
        // 4. 配置 VRF 參數
        console.log("\n2️⃣ 配置 VRF 參數...");
        
        const vrfManager = new ethers.Contract(vrfManagerAddress, abi, wallet);
        
        const configTx = await vrfManager.updateVRFConfig(
            KEY_HASH_500_GWEI,
            500000, // callbackGasLimit
            3, // requestConfirmations
            ethers.parseEther("0.005"), // vrfRequestPrice
            {
                gasLimit: 200000
            }
        );
        
        console.log("配置交易:", configTx.hash);
        await configTx.wait(2);
        console.log("✅ VRF 配置完成！");
        
        // 5. 充值 BNB
        console.log("\n3️⃣ 為 VRFManager 充值...");
        
        const fundAmount = ethers.parseEther("0.05");
        const fundTx = await wallet.sendTransaction({
            to: vrfManagerAddress,
            value: fundAmount,
            gasLimit: 50000
        });
        
        console.log("充值交易:", fundTx.hash);
        await fundTx.wait(2);
        console.log(`✅ 已充值 ${ethers.formatEther(fundAmount)} BNB`);
        
        // 6. 驗證部署
        console.log("\n4️⃣ 驗證部署...");
        
        const contractBalance = await provider.getBalance(vrfManagerAddress);
        const coordinator = await vrfManager.vrfCoordinator();
        const keyHash = await vrfManager.keyHash();
        const requestPrice = await vrfManager.vrfRequestPrice();
        
        console.log("合約餘額:", ethers.formatEther(contractBalance), "BNB");
        console.log("VRF Coordinator:", coordinator);
        console.log("Key Hash:", keyHash);
        console.log("Request Price:", ethers.formatEther(requestPrice), "BNB");
        
        // 7. 保存部署信息
        const deploymentInfo = {
            network: "bsc",
            deployer: wallet.address,
            timestamp: new Date().toISOString(),
            blockNumber: receipt.blockNumber,
            contracts: {
                VRFMANAGER: vrfManagerAddress
            },
            vrfConfig: {
                coordinator: VRF_COORDINATOR_BSC,
                keyHash: KEY_HASH_500_GWEI,
                callbackGasLimit: 500000,
                requestConfirmations: 3,
                vrfRequestPrice: "0.005"
            },
            transactionHashes: {
                deployment: contract.deploymentTransaction().hash,
                configuration: configTx.hash,
                funding: fundTx.hash
            }
        };
        
        const deploymentPath = path.join(__dirname, "../../deployments", `vrfmanager-${Date.now()}.json`);
        
        // 確保目錄存在
        const deploymentDir = path.dirname(deploymentPath);
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n✅ 部署信息已保存到:", deploymentPath);
        
        // 8. 更新 .env
        console.log("\n📝 請將以下地址添加到 .env 文件:");
        console.log(`VRFMANAGER_ADDRESS=${vrfManagerAddress}`);
        
        console.log("\n🎉 VRFManager 部署完成！");
        console.log("================");
        console.log("VRFManager 地址:", vrfManagerAddress);
        console.log("BSCScan:", `https://bscscan.com/address/${vrfManagerAddress}`);
        
        console.log("\n⚠️ 後續步驟:");
        console.log("1. 在其他合約中設置 VRFManager 地址");
        console.log("2. 授權需要使用 VRF 的合約");
        console.log("3. 測試 VRF 功能");
        
    } catch (error) {
        console.error("\n❌ 部署失敗:", error.message);
        if (error.transaction) {
            console.error("交易數據:", error.transaction);
        }
        if (error.receipt) {
            console.error("交易收據:", error.receipt);
        }
        process.exit(1);
    }
}

// 執行
main()
    .then(() => {
        console.log("\n✅ 腳本執行完成");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ 腳本執行失敗:", error);
        process.exit(1);
    });
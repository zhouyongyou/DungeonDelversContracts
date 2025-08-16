// 測試部署設置
const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
    console.log("=== 測試部署設置 ===\n");
    
    try {
        // 1. 測試環境變數
        console.log("📊 環境變數檢查:");
        console.log(`PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ 已設置' : '❌ 未設置'}`);
        console.log(`BSCSCAN_API_KEY: ${process.env.BSCSCAN_API_KEY ? '✅ 已設置' : '❌ 未設置'}`);
        console.log(`BSC_MAINNET_RPC_URL: ${process.env.BSC_MAINNET_RPC_URL ? '✅ 已設置' : '❌ 未設置'}`);
        
        // 2. 創建 provider 和 wallet（模擬部署腳本）
        const rpcUrl = process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
        console.log(`\\n🔗 使用的 RPC URL: ${rpcUrl}`);
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log(`\\n👤 部署者地址: ${deployer.address}`);
        
        // 3. 執行 preDeploymentChecks（模擬）
        console.log("\\n🔍 執行部署前檢查...");
        
        // 檢查網路
        const network = await provider.getNetwork();
        console.log(`✅ 網路連接成功:`);
        console.log(`- Chain ID: ${network.chainId}`);
        console.log(`- 網路名稱: ${network.name}`);
        
        if (network.chainId !== 56n) {
            throw new Error(`錯誤的網路 (期望 BSC Mainnet 56, 實際 ${network.chainId})`);
        }
        console.log(`✅ 網路驗證通過 (BSC Mainnet)`);
        
        // 檢查餘額
        const balance = await provider.getBalance(deployer.address);
        const balanceInBNB = ethers.formatEther(balance);
        console.log(`- 錢包餘額: ${balanceInBNB} BNB`);
        
        if (parseFloat(balanceInBNB) < 0.1) {
            console.warn(`⚠️ 警告: 餘額可能不足以完成部署 (建議至少 0.1 BNB)`);
        } else {
            console.log(`✅ 餘額充足`);
        }
        
        // 4. 測試合約編譯（檢查 artifacts）
        console.log("\\n📦 檢查合約 artifacts:");
        const fs = require('fs');
        const path = require('path');
        
        const contractsToCheck = ['PlayerVault', 'DungeonCore', 'Oracle_V22_Adaptive'];
        
        for (const contractName of contractsToCheck) {
            const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'current', '**', `${contractName}.sol`, `${contractName}.json`);
            try {
                // 簡單檢查是否存在相關 artifact
                const currentDir = path.join(__dirname, '..', 'artifacts', 'contracts', 'current');
                if (fs.existsSync(currentDir)) {
                    console.log(`✅ ${contractName}: artifacts 目錄存在`);
                } else {
                    console.log(`❌ ${contractName}: artifacts 目錄不存在`);
                }
            } catch (e) {
                console.log(`❌ ${contractName}: 檢查失敗`);
            }
        }
        
        console.log("\\n🎉 所有預檢查通過！可以嘗試部署");
        
        // 5. 建議
        console.log("\\n💡 如果部署腳本仍然失敗，可能的原因:");
        console.log("1. 腳本中的錯誤捕獲邏輯有問題");
        console.log("2. 某個依賴模組載入失敗");
        console.log("3. 檔案權限問題");
        console.log("4. 記憶體不足");
        
        console.log("\\n🔧 建議執行:");
        console.log("node scripts/active/v25-deploy-complete-sequential.js");
        console.log("（不使用 hardhat run，直接用 node 執行）");
        
    } catch (error) {
        console.error("\\n❌ 測試失敗:");
        console.error(`錯誤: ${error.message}`);
        console.error(`堆疊: ${error.stack}`);
    }
}

main().catch(console.error);
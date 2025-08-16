// 測試 RPC 連接
const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
    console.log("=== 測試 RPC 連接 ===\n");
    
    // 測試環境變數
    console.log("📊 環境變數檢查:");
    console.log(`BSC_MAINNET_RPC_URL: ${process.env.BSC_MAINNET_RPC_URL ? '✅ 已設置' : '❌ 未設置'}`);
    console.log(`PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ 已設置' : '❌ 未設置'}`);
    
    const rpcUrl = process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
    console.log(`\n🔗 使用的 RPC URL: ${rpcUrl}`);
    
    try {
        console.log("\n🔍 測試連接...");
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // 測試 1: 獲取網路信息
        const network = await provider.getNetwork();
        console.log(`✅ 網路連接成功`);
        console.log(`- Chain ID: ${network.chainId}`);
        console.log(`- 網路名稱: ${network.name}`);
        
        // 測試 2: 獲取最新區塊
        const blockNumber = await provider.getBlockNumber();
        console.log(`- 最新區塊: ${blockNumber}`);
        
        // 測試 3: 測試錢包
        if (process.env.PRIVATE_KEY) {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            console.log(`- 錢包地址: ${wallet.address}`);
            
            const balance = await provider.getBalance(wallet.address);
            console.log(`- 錢包餘額: ${ethers.formatEther(balance)} BNB`);
        }
        
        console.log("\n🎉 所有測試通過！RPC 連接正常");
        
    } catch (error) {
        console.error("\n❌ RPC 連接失敗:");
        console.error(`錯誤: ${error.message}`);
        
        if (error.code === 'NETWORK_ERROR') {
            console.error("\n可能的解決方案:");
            console.error("1. 檢查網路連接");
            console.error("2. 檢查 Alchemy API 金鑰是否有效");
            console.error("3. 嘗試使用其他 RPC 節點");
        }
    }
}

main().catch(console.error);
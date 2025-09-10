// 診斷VIP質押失敗問題
const { ethers } = require("ethers");
require('dotenv').config();

async function diagnoseVipIssue() {
    console.log("🔍 診斷VIP質押問題...");
    
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    // 🚀 從 .env 動態讀取地址
    const vipAddr = process.env.VIPSTAKING_ADDRESS;
    const coreAddr = process.env.DUNGEONCORE_ADDRESS;
    
    // 測試地址（從環境變數讀取）
    const testAddress = process.env.VITE_ADMIN_WALLET;
    
    try {
        console.log("1. 檢查VIPStaking基本狀態...");
        
        const vipAbi = [
            "function userStakes(address) view returns (uint256 amount, uint256 tokenId)",
            "function unstakeQueue(address) view returns (uint256 amount, uint256 availableAt)",
            "function getVipLevel(address) view returns (uint8)",
            "function dungeonCore() view returns (address)",
            "function unstakeCooldown() view returns (uint256)",
            "function totalSupply() view returns (uint256)"
        ];
        
        const vipContract = new ethers.Contract(vipAddr, vipAbi, provider);
        
        // 檢查用戶當前狀態
        const userStake = await vipContract.userStakes(testAddress);
        console.log(`用戶質押狀態: 數量=${userStake.amount}, TokenId=${userStake.tokenId}`);
        
        const unstakeRequest = await vipContract.unstakeQueue(testAddress);
        console.log(`取消質押請求: 數量=${unstakeRequest.amount}, 可用時間=${new Date(Number(unstakeRequest.availableAt) * 1000)}`);
        
        const vipLevel = await vipContract.getVipLevel(testAddress);
        console.log(`當前VIP等級: ${vipLevel}`);
        
        // 檢查合約連接
        const connectedCore = await vipContract.dungeonCore();
        console.log(`連接的DungeonCore: ${connectedCore}`);
        console.log(`預期DungeonCore: ${coreAddr}`);
        console.log(`Core連接正常: ${connectedCore.toLowerCase() === coreAddr.toLowerCase()}`);
        
        console.log("\n2. 檢查DungeonCore狀態...");
        
        const coreAbi = [
            "function vipStakingAddress() view returns (address)",
            "function getSoulShardToken() view returns (address)",
            "function owner() view returns (address)"
        ];
        
        const coreContract = new ethers.Contract(coreAddr, coreAbi, provider);
        
        const connectedVip = await coreContract.vipStakingAddress();
        console.log(`Core中的VIP地址: ${connectedVip}`);
        console.log(`VIP連接正常: ${connectedVip.toLowerCase() === vipAddr.toLowerCase()}`);
        
        const soulToken = await coreContract.getSoulShardToken();
        console.log(`SOUL代幣地址: ${soulToken}`);
        
        console.log("\n3. 檢查SOUL代幣餘額...");
        
        if (soulToken !== ethers.ZeroAddress) {
            const tokenAbi = [
                "function balanceOf(address) view returns (uint256)",
                "function allowance(address,address) view returns (uint256)",
                "function symbol() view returns (string)"
            ];
            
            const tokenContract = new ethers.Contract(soulToken, tokenAbi, provider);
            
            const balance = await tokenContract.balanceOf(testAddress);
            const allowance = await tokenContract.allowance(testAddress, vipAddr);
            const symbol = await tokenContract.symbol();
            
            console.log(`${symbol} 餘額: ${ethers.formatEther(balance)}`);
            console.log(`${symbol} 授權額度: ${ethers.formatEther(allowance)}`);
            
            if (balance === 0n) {
                console.log("❌ 問題發現：用戶沒有SOUL代幣餘額");
            }
            
            if (allowance === 0n) {
                console.log("❌ 問題發現：用戶沒有授權SOUL代幣給VIPStaking合約");
            }
        } else {
            console.log("❌ 問題發現：DungeonCore中的SOUL代幣地址未設定");
        }
        
        console.log("\n4. 檢查合約權限和狀態...");
        
        const vipOwner = await vipContract.totalSupply();
        console.log(`VIP總供應量: ${vipOwner}`);
        
    } catch (error) {
        console.error("❌ 診斷過程出錯:", error.message);
    }
}

diagnoseVipIssue().catch(console.error);
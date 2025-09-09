// 直接檢查BSC上的VIPStaking合約
const { ethers } = require("ethers");
require('dotenv').config();

async function checkRealVip() {
    console.log("🔍 檢查BSC上的VIPStaking合約...");
    
    // 直接連接BSC網路
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const vipStakingAddr = "0x33664da450b069012b28f90183c76b9c85382ffe";
    
    console.log(`檢查地址: ${vipStakingAddr}`);
    
    try {
        // 檢查合約代碼
        const code = await provider.getCode(vipStakingAddr);
        console.log(`合約代碼存在: ${code !== "0x"}`);
        console.log(`代碼長度: ${code.length} 字符`);
        
        if (code === "0x") {
            console.log("❌ 該地址沒有合約代碼");
            return;
        }
        
        // 檢查餘額
        const balance = await provider.getBalance(vipStakingAddr);
        console.log(`合約餘額: ${ethers.formatEther(balance)} BNB`);
        
        // 嘗試調用基本ERC721函數
        try {
            // 創建最小ERC721接口
            const erc721Abi = [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function owner() view returns (address)",
                "function totalSupply() view returns (uint256)"
            ];
            
            const contract = new ethers.Contract(vipStakingAddr, erc721Abi, provider);
            
            const name = await contract.name();
            console.log(`合約名稱: ${name}`);
            
            const symbol = await contract.symbol();
            console.log(`合約符號: ${symbol}`);
            
            const totalSupply = await contract.totalSupply();
            console.log(`總供應量: ${totalSupply}`);
            
        } catch (e) {
            console.log("❌ ERC721函數調用失敗:", e.message);
        }
        
        // 嘗試VIP特定函數
        try {
            const vipAbi = [
                "function getVipLevel(address user) view returns (uint8)"
            ];
            
            const vipContract = new ethers.Contract(vipStakingAddr, vipAbi, provider);
            const testLevel = await vipContract.getVipLevel(ethers.ZeroAddress);
            console.log(`VIP功能測試: ${testLevel}`);
            
        } catch (e) {
            console.log("❌ VIP函數調用失敗:", e.message);
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

checkRealVip().catch(console.error);
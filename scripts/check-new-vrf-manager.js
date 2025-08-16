const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 檢查新 VRF Manager 費用設定...\n");
    
    const newVrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    
    // VRF Manager ABI - 基於前端使用的接口
    const vrfManagerABI = [
        "function getVrfRequestPrice() external view returns (uint256)",
        "function getTotalFee() external view returns (uint256)",
        "function authorizeContract(address contract_) external",
        "function requests(uint256) external view returns (tuple(address requester, uint8 requestType, bytes data, bool fulfilled, uint256[] randomWords))"
    ];
    
    const vrfManager = new ethers.Contract(newVrfManagerAddress, vrfManagerABI, ethers.provider);
    
    try {
        console.log("📊 新 VRF Manager 費用設定:");
        console.log("- VRF Manager 地址:", newVrfManagerAddress);
        
        // 檢查費用
        const vrfRequestPrice = await vrfManager.getVrfRequestPrice();
        const totalFee = await vrfManager.getTotalFee();
        
        console.log("- VRF 請求價格:", ethers.formatEther(vrfRequestPrice), "BNB (~$" + (parseFloat(ethers.formatEther(vrfRequestPrice)) * 600).toFixed(2) + ")");
        console.log("- 總費用:", ethers.formatEther(totalFee), "BNB (~$" + (parseFloat(ethers.formatEther(totalFee)) * 600).toFixed(2) + ")");
        
        // 計算不同數量的費用
        console.log("\n💰 不同鑄造數量的費用:");
        for (let qty of [1, 5, 10, 50]) {
            const cost = totalFee * BigInt(qty);
            const costUSD = parseFloat(ethers.formatEther(cost)) * 600;
            console.log(`- ${qty} 個 NFT: ${ethers.formatEther(cost)} BNB (~$${costUSD.toFixed(2)})`);
        }
        
        // 分析用戶的失敗交易
        console.log("\n🔴 用戶失敗交易分析:");
        console.log("- 用戶支付: 0.005 BNB (~$3.00)");
        console.log("- 需要費用 (1個NFT):", ethers.formatEther(totalFee), "BNB");
        
        const userPayment = ethers.parseEther("0.005");
        if (userPayment >= totalFee) {
            console.log("✅ 用戶支付金額足夠");
        } else {
            const shortfall = totalFee - userPayment;
            console.log("❌ 用戶支付不足，缺少:", ethers.formatEther(shortfall), "BNB");
            console.log("💡 建議修復:");
            console.log("   1. 降低 VRF 費用到 0.005 BNB 以下");
            console.log("   2. 或者前端計算正確的費用並要求用戶支付");
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
        
        if (error.message.includes("call revert exception")) {
            console.log("💡 可能的原因: VRF Manager 合約接口不匹配");
            console.log("💡 建議: 檢查合約是否實現了這些函數");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🧪 模擬完全相同的 mint 調用\n");
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    // 失敗交易的確切參數
    const userAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    const heroAddress = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
    const quantity = 50;
    const value = ethers.parseEther("0.0001"); // 用戶支付的金額
    
    console.log("📋 模擬參數:");
    console.log("用戶:", userAddress);
    console.log("數量:", quantity);
    console.log("支付:", ethers.formatEther(value), "BNB");
    
    // Hero 合約 ABI
    const heroAbi = [
        "function mintFromWallet(uint256 _quantity) external payable",
        "function platformFee() external view returns (uint256)",
        "function getRequiredSoulShardAmount(uint256) external view returns (uint256)",
        "function paused() external view returns (bool)"
    ];
    
    const hero = new ethers.Contract(heroAddress, heroAbi, provider);
    
    try {
        console.log("\n🔍 預檢查:");
        
        // 檢查平台費
        const platformFee = await hero.platformFee();
        const requiredBnb = platformFee * BigInt(quantity);
        console.log("需要 BNB:", ethers.formatEther(requiredBnb));
        console.log("用戶支付:", ethers.formatEther(value));
        console.log("支付檢查通過:", value >= requiredBnb);
        
        // 檢查 SOUL 需求
        const requiredSoul = await hero.getRequiredSoulShardAmount(quantity);
        console.log("需要 SOUL:", ethers.formatEther(requiredSoul));
        
        // 檢查暫停狀態
        const isPaused = await hero.paused();
        console.log("合約暫停:", isPaused);
        
        console.log("\n🎯 模擬調用:");
        
        // 模擬調用 (不實際執行)
        const result = await provider.call({
            to: heroAddress,
            from: userAddress,
            value: value.toString(),
            data: hero.interface.encodeFunctionData("mintFromWallet", [quantity])
        });
        
        console.log("✅ 模擬調用成功！");
        console.log("結果:", result);
        
    } catch (error) {
        console.log("❌ 模擬調用失敗:", error.message);
        console.log("錯誤詳情:", error);
        
        // 分析錯誤
        if (error.message.includes("revert")) {
            console.log("\n🔍 Revert 原因分析:");
            if (error.message.includes("ERC20: insufficient allowance")) {
                console.log("❌ SOUL 授權不足");
            } else if (error.message.includes("ERC20: transfer amount exceeds balance")) {
                console.log("❌ SOUL 餘額不足");
            } else if (error.message.includes("Previous mint pending")) {
                console.log("❌ 有未完成的 mint");
            } else if (error.message.includes("Insufficient payment")) {
                console.log("❌ BNB 支付不足");
            } else {
                console.log("❓ 其他原因:", error.message);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔧 最終修復 VRF 費用...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("🔑 執行者:", deployer.address);
    console.log("💰 餘額:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");
    
    const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    
    // 根據實際測試，使用工作的 ABI
    const vrfManagerABI = [
        "function setVrfRequestPrice(uint256 _price) external",
        "function setPlatformFee(uint256 _fee) external",
        "function vrfRequestPrice() external view returns (uint256)",
        "function platformFee() external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    const vrfManager = new ethers.Contract(vrfManagerAddress, vrfManagerABI, deployer);
    
    try {
        // 檢查當前設定
        console.log("📊 當前 VRF Manager 設定:");
        const owner = await vrfManager.owner();
        const currentVrfPrice = await vrfManager.vrfRequestPrice();
        const currentPlatformFee = await vrfManager.platformFee();
        
        console.log("- 擁有者:", owner);
        console.log("- 當前 VRF 價格:", ethers.formatEther(currentVrfPrice), "BNB");
        console.log("- 當前平台費:", ethers.formatEther(currentPlatformFee), "BNB");
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("❌ 錯誤：您不是 VRF Manager 的擁有者");
            return;
        }
        
        // 設定新的費用 - 0.0005 BNB (~$0.3)
        const newVrfPrice = ethers.parseEther("0.0005");
        const newPlatformFee = ethers.parseEther("0");
        
        console.log("\n🎯 設定新費用:");
        console.log("- 新 VRF 價格:", ethers.formatEther(newVrfPrice), "BNB (~$0.3)");
        console.log("- 新平台費:", ethers.formatEther(newPlatformFee), "BNB (免費)");
        
        // 先檢查是否需要更新
        if (currentVrfPrice.toString() === newVrfPrice.toString() && 
            currentPlatformFee.toString() === newPlatformFee.toString()) {
            console.log("✅ 費用已經是正確的，無需更新");
        } else {
            // 更新 VRF 價格
            if (currentVrfPrice.toString() !== newVrfPrice.toString()) {
                console.log("\n📝 更新 VRF 價格...");
                const tx1 = await vrfManager.setVrfRequestPrice(newVrfPrice, {
                    gasLimit: 100000
                });
                console.log("⏳ 等待確認...", tx1.hash);
                await tx1.wait();
                console.log("✅ VRF 價格更新完成");
            }
            
            // 更新平台費
            if (currentPlatformFee.toString() !== newPlatformFee.toString()) {
                console.log("\n📝 更新平台費...");
                const tx2 = await vrfManager.setPlatformFee(newPlatformFee, {
                    gasLimit: 100000
                });
                console.log("⏳ 等待確認...", tx2.hash);
                await tx2.wait();
                console.log("✅ 平台費更新完成");
            }
        }
        
        // 驗證更新結果
        console.log("\n✅ 驗證最終設定:");
        const finalVrfPrice = await vrfManager.vrfRequestPrice();
        const finalPlatformFee = await vrfManager.platformFee();
        
        console.log("- 最終 VRF 價格:", ethers.formatEther(finalVrfPrice), "BNB");
        console.log("- 最終平台費:", ethers.formatEther(finalPlatformFee), "BNB");
        
        // 計算不同數量的總費用
        console.log("\n💰 鑄造費用計算 (新費用結構):");
        for (const qty of [1, 5, 10, 50]) {
            // VRF 費用是固定的，平台費是按數量計算的
            const vrfCost = finalVrfPrice;
            const platformCost = finalPlatformFee * BigInt(qty);
            const totalCost = vrfCost + platformCost;
            
            console.log(`- 鑄造 ${qty.toString().padStart(2)} 個 NFT: ${ethers.formatEther(totalCost)} BNB (~$${(parseFloat(ethers.formatEther(totalCost)) * 600).toFixed(2)})`);
        }
        
        console.log("\n🎉 VRF Manager 費用修復完成！");
        console.log("💡 現在前端應該讀取到正確的費用了");
        console.log("🚀 請重新測試鑄造功能");
        
    } catch (error) {
        console.error("❌ 修復失敗:", error.message);
        
        // 檢查是否是函數不存在的問題
        if (error.message.includes("execution reverted") || error.message.includes("call revert")) {
            console.log("💡 可能的原因:");
            console.log("1. VRF Manager 合約的函數名稱不匹配");
            console.log("2. 合約可能是唯讀的或有其他限制");
            console.log("3. 建議直接在前端使用固定的合理費用");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
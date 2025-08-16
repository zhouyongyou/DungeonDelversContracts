const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔧 修復 VRF 費用設定...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("🔑 執行者:", deployer.address);
    console.log("💰 餘額:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");
    
    // VRF Manager 合約地址
    const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    
    // 簡化的 ABI - 只包含需要的函數
    const vrfManagerABI = [
        "function setVrfRequestPrice(uint256 _vrfRequestPrice) external",
        "function setPlatformFee(uint256 _platformFee) external", 
        "function vrfRequestPrice() external view returns (uint256)",
        "function platformFee() external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    const vrfManager = new ethers.Contract(vrfManagerAddress, vrfManagerABI, deployer);
    
    try {
        // 檢查當前設定
        console.log("📊 當前費用設定:");
        const currentVrfFee = await vrfManager.vrfRequestPrice();
        const currentPlatformFee = await vrfManager.platformFee();
        const owner = await vrfManager.owner();
        
        console.log("- VRF 費用:", ethers.formatEther(currentVrfFee), "BNB");
        console.log("- 平台費:", ethers.formatEther(currentPlatformFee), "BNB");
        console.log("- 合約擁有者:", owner);
        console.log("- 當前執行者:", deployer.address);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("❌ 錯誤：您不是合約擁有者，無法修改費用");
            return;
        }
        
        console.log("\n🎯 設定新的費用...");
        
        // 設定合理的費用
        const newVrfFee = ethers.parseEther("0.0005"); // 0.0005 BNB (~$0.3)
        const newPlatformFee = ethers.parseEther("0");   // 0 BNB (依用戶要求)
        
        console.log("- 新 VRF 費用:", ethers.formatEther(newVrfFee), "BNB (~$0.3)");
        console.log("- 新平台費:", ethers.formatEther(newPlatformFee), "BNB (免費)");
        
        // 設定 VRF 費用
        console.log("\n📝 設定 VRF 費用...");
        const tx1 = await vrfManager.setVrfRequestPrice(newVrfFee, {
            gasLimit: 100000
        });
        console.log("⏳ 等待確認...", tx1.hash);
        await tx1.wait();
        console.log("✅ VRF 費用設定完成");
        
        // 設定平台費
        console.log("\n📝 設定平台費...");
        const tx2 = await vrfManager.setPlatformFee(newPlatformFee, {
            gasLimit: 100000  
        });
        console.log("⏳ 等待確認...", tx2.hash);
        await tx2.wait();
        console.log("✅ 平台費設定完成");
        
        // 驗證設定
        console.log("\n✅ 驗證新設定:");
        const newCurrentVrfFee = await vrfManager.vrfRequestPrice();
        const newCurrentPlatformFee = await vrfManager.platformFee();
        
        console.log("- VRF 費用:", ethers.formatEther(newCurrentVrfFee), "BNB");
        console.log("- 平台費:", ethers.formatEther(newCurrentPlatformFee), "BNB");
        
        // 計算不同數量的總費用
        console.log("\n💰 新費用結構下的鑄造成本:");
        console.log("- 鑄造 1 個 NFT:", ethers.formatEther(newCurrentVrfFee.add(newCurrentPlatformFee)), "BNB");
        console.log("- 鑄造 5 個 NFT:", ethers.formatEther(newCurrentVrfFee.add(newCurrentPlatformFee.mul(5))), "BNB");
        console.log("- 鑄造 10 個 NFT:", ethers.formatEther(newCurrentVrfFee.add(newCurrentPlatformFee.mul(10))), "BNB");
        
        console.log("\n🎉 VRF 費用修復完成！");
        console.log("💡 前端現在應該能正確計算費用了");
        
    } catch (error) {
        console.error("❌ 設定費用失敗:", error.message);
        
        // 常見錯誤處理
        if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("💡 解決方案: 請使用合約擁有者地址執行此腳本");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 解決方案: 請確保錢包有足夠的 BNB");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
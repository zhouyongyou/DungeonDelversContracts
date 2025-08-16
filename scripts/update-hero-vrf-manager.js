const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔧 更新 HERO 合約的 VRF Manager 地址...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("🔑 執行者:", deployer.address);
    console.log("💰 餘額:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");
    
    // 合約地址
    const heroAddress = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD"; // V25 新 HERO 地址
    const newVrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"; // V25 新 VRF Manager
    
    // 簡化的 HERO ABI - 只包含需要的函數
    const heroABI = [
        "function setVrfManager(address _vrfManager) external",
        "function vrfManager() external view returns (address)",
        "function owner() external view returns (address)"
    ];
    
    const hero = new ethers.Contract(heroAddress, heroABI, deployer);
    
    try {
        // 檢查當前設定
        console.log("📊 當前 HERO 合約設定:");
        const currentVrfManager = await hero.vrfManager();
        const owner = await hero.owner();
        
        console.log("- HERO 地址:", heroAddress);
        console.log("- 當前 VRF Manager:", currentVrfManager);
        console.log("- 新 VRF Manager:", newVrfManagerAddress);
        console.log("- 合約擁有者:", owner);
        console.log("- 當前執行者:", deployer.address);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("❌ 錯誤：您不是合約擁有者，無法修改設定");
            return;
        }
        
        if (currentVrfManager.toLowerCase() === newVrfManagerAddress.toLowerCase()) {
            console.log("✅ VRF Manager 地址已經是最新的，無需更新");
            return;
        }
        
        console.log("\n🎯 更新 VRF Manager 地址...");
        
        // 更新 VRF Manager 地址
        const tx = await hero.setVrfManager(newVrfManagerAddress, {
            gasLimit: 100000
        });
        console.log("⏳ 等待確認...", tx.hash);
        await tx.wait();
        console.log("✅ VRF Manager 地址更新完成");
        
        // 驗證設定
        console.log("\n✅ 驗證新設定:");
        const updatedVrfManager = await hero.vrfManager();
        console.log("- 新 VRF Manager 地址:", updatedVrfManager);
        
        if (updatedVrfManager.toLowerCase() === newVrfManagerAddress.toLowerCase()) {
            console.log("🎉 VRF Manager 地址更新成功！");
            
            // 建議接下來的步驟
            console.log("\n💡 接下來的步驟:");
            console.log("1. 檢查新 VRF Manager 的費用設定");
            console.log("2. 確保新 VRF Manager 授權了 HERO 合約");
            console.log("3. 測試前端鑄造功能");
        } else {
            console.log("❌ VRF Manager 地址更新失敗");
        }
        
    } catch (error) {
        console.error("❌ 更新失敗:", error.message);
        
        // 常見錯誤處理
        if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("💡 解決方案: 請使用合約擁有者地址執行此腳本");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 解決方案: 請確保錢包有足夠的 BNB");
        } else if (error.message.includes("execution reverted")) {
            console.log("💡 可能的原因: 函數名稱不正確或合約不支援此功能");
            console.log("💡 建議: 檢查 HERO 合約是否有 setVrfManager 函數");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
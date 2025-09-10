const { ethers } = require("hardhat");

async function fixVRFDungeonCoreConnection() {
  console.log("🔧 修復 VRF Manager → DungeonCore 連接");
  
  try {
    // 檢查我們連接的是哪個網路
    const [deployer] = await ethers.getSigners();
    const provider = deployer.provider;
    const network = await provider.getNetwork();
    console.log("🌍 當前網路:", network.name, "ChainID:", network.chainId);
    
    // 使用 0.11 gwei gas price
    const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
    
    // Get addresses
    const VRF_MANAGER = process.env.VITE_VRF_MANAGER_V2PLUS_ADDRESS;
    const DUNGEON_CORE = process.env.VITE_DUNGEONCORE_ADDRESS;
    
    console.log("📍 VRF Manager:", VRF_MANAGER);
    console.log("📍 DungeonCore:", DUNGEON_CORE);
    
    console.log("👤 使用帳戶:", deployer.address);
    
    const vrfManager = await ethers.getContractAt("VRFConsumerV2Plus", VRF_MANAGER);
    
    // 1. Check current dungeonCore in VRF Manager
    console.log("\n🔍 檢查當前 VRF Manager 配置:");
    try {
      const currentDungeonCore = await vrfManager.dungeonCore();
      console.log("🔄 當前 DungeonCore:", currentDungeonCore);
      
      if (currentDungeonCore.toLowerCase() === DUNGEON_CORE.toLowerCase()) {
        console.log("✅ VRF Manager 已經正確設定 DungeonCore 地址");
        return;
      }
      
      if (currentDungeonCore === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️ DungeonCore 是零地址，需要設定");
      }
    } catch (error) {
      console.log("⚠️ 無法讀取當前 dungeonCore:", error.message);
      console.log("⚡ 繼續嘗試設定...");
    }
    
    // 2. Set DungeonCore in VRF Manager
    console.log("\n🔧 設定 VRF Manager 的 DungeonCore 地址:");
    const setDungeonCoreTx = await vrfManager.setDungeonCore(DUNGEON_CORE, 
      { gasPrice: GAS_PRICE }
    );
    
    console.log("📤 交易已提交:", setDungeonCoreTx.hash);
    console.log("⏳ 等待交易確認...");
    
    const receipt = await setDungeonCoreTx.wait();
    console.log("✅ 交易已確認! Block:", receipt.blockNumber);
    
    // 3. Verify the setting
    console.log("\n✅ 驗證設定結果:");
    const newDungeonCore = await vrfManager.dungeonCore();
    console.log("🎯 新的 DungeonCore 地址:", newDungeonCore);
    
    if (newDungeonCore.toLowerCase() === DUNGEON_CORE.toLowerCase()) {
      console.log("🎉 成功! VRF Manager → DungeonCore 連接已建立");
    } else {
      console.log("❌ 設定失敗，地址不匹配");
    }
    
    // 4. Check if DungeonCore also needs to be configured
    console.log("\n🔍 檢查 DungeonCore → VRF Manager 反向連接:");
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEON_CORE);
    
    try {
      const currentVRFManager = await dungeonCore.vrfManager();
      console.log("🔄 DungeonCore 中的 VRF Manager:", currentVRFManager);
      
      if (currentVRFManager.toLowerCase() !== VRF_MANAGER.toLowerCase()) {
        console.log("🔧 也需要設定 DungeonCore → VRF Manager 連接");
        
        const setVRFManagerTx = await dungeonCore.setVRFManager(VRF_MANAGER, 
          { gasPrice: GAS_PRICE }
        );
        
        console.log("📤 反向連接交易:", setVRFManagerTx.hash);
        await setVRFManagerTx.wait();
        console.log("✅ 雙向連接完成!");
      } else {
        console.log("✅ DungeonCore → VRF Manager 連接正常");
      }
    } catch (error) {
      console.log("⚠️ 無法檢查 DungeonCore 配置:", error.message);
    }
    
    console.log("\n🎯 VRF 配置修復完成!");
    
  } catch (error) {
    console.error("❌ 修復失敗:", error.message);
    process.exit(1);
  }
}

// Run the fix
fixVRFDungeonCoreConnection()
  .then(() => {
    console.log("\n🏁 VRF 連接修復完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 修復錯誤:", error);
    process.exit(1);
  });
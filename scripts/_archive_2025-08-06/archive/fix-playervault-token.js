// scripts/fix-playervault-token.js
// 修復 PlayerVault 合約缺少的 SoulShardToken 設置

const hre = require("hardhat");

async function main() {
  console.log("🔧 Fixing PlayerVault SoulShardToken configuration...\n");

  // 合約地址
  const PLAYERVAULT_ADDRESS = "0xA5BA5EE03d452eA5e57c72657c8EC03C6F388E1f";
  const SOULSHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";

  // 獲取簽名者
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Using account:", deployer.address);

  // 獲取 PlayerVault 合約實例
  const PlayerVault = await ethers.getContractFactory("PlayerVault");
  const playerVault = PlayerVault.attach(PLAYERVAULT_ADDRESS);

  try {
    // 檢查當前設置
    console.log("\n📊 Checking current configuration...");
    const currentToken = await playerVault.soulShardToken();
    console.log("Current SoulShardToken:", currentToken);

    if (currentToken === "0x0000000000000000000000000000000000000000") {
      console.log("❌ SoulShardToken is not set (zero address)");
      
      // 設置 SoulShardToken
      console.log("\n🔄 Setting SoulShardToken...");
      const tx = await playerVault.setSoulShardToken(SOULSHARD_ADDRESS);
      console.log("Transaction hash:", tx.hash);
      
      // 等待交易確認
      console.log("⏳ Waiting for confirmation...");
      await tx.wait(2); // 等待 2 個區塊確認
      
      // 驗證設置
      const newToken = await playerVault.soulShardToken();
      if (newToken.toLowerCase() === SOULSHARD_ADDRESS.toLowerCase()) {
        console.log("✅ SoulShardToken successfully set to:", newToken);
      } else {
        console.log("❌ Failed to set SoulShardToken");
      }
    } else {
      console.log("✅ SoulShardToken is already set to:", currentToken);
    }

    // 檢查初始化狀態
    console.log("\n📊 Checking initialization status...");
    try {
      const { isReady, tokenAddress, coreAddress } = await playerVault.isInitialized();
      console.log("Initialization status:");
      console.log("  - isReady:", isReady);
      console.log("  - tokenAddress:", tokenAddress);
      console.log("  - coreAddress:", coreAddress);
    } catch (error) {
      console.log("⚠️  isInitialized function not available (old contract version)");
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
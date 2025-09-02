const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🎯 測試 V25 NFT 鑄造功能\n");

  // V25.1 合約地址
  const addresses = {
    hero: "0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8",
    relic: "0x0B030a01682b2871950C9994a1f4274da96edBB1",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };

  // 獲取簽名者
  const [signer] = await ethers.getSigners();
  console.log("📍 使用錢包:", signer.address);

  // 檢查餘額
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("💰 BNB 餘額:", ethers.formatEther(balance), "BNB");

  // 獲取合約實例
  const Hero = await ethers.getContractAt("Hero", addresses.hero);
  const SoulShard = await ethers.getContractAt("SoulShard", addresses.soulShard);

  // 檢查 NFT 總供應量
  console.log("\n📊 當前供應量:");
  try {
    const heroSupply = await Hero.totalSupply();
    console.log("  Hero NFT:", heroSupply.toString());
  } catch (error) {
    console.log("  Hero NFT: 無法讀取 (合約可能尚未初始化)");
  }

  // 檢查鑄造價格
  console.log("\n💎 鑄造價格:");
  try {
    const mintPriceUSD = await Hero.mintPriceUSD();
    console.log("  USD 價格:", ethers.formatUnits(mintPriceUSD, 18), "USD");
    
    // 獲取 BNB 價格
    const mintPriceBNB = await Hero.getMintPrice();
    console.log("  BNB 價格:", ethers.formatEther(mintPriceBNB), "BNB");
  } catch (error) {
    console.log("  ❌ 無法獲取價格:", error.message);
  }

  // 檢查 SoulShard 餘額
  console.log("\n🪙 SoulShard 代幣:");
  try {
    const soulBalance = await SoulShard.balanceOf(signer.address);
    console.log("  餘額:", ethers.formatUnits(soulBalance, 18), "SOUL");
    
    // 檢查授權
    const allowance = await SoulShard.allowance(signer.address, addresses.hero);
    console.log("  授權給 Hero:", ethers.formatUnits(allowance, 18), "SOUL");
  } catch (error) {
    console.log("  ❌ 無法讀取 SoulShard:", error.message);
  }

  // 詢問是否要嘗試鑄造
  console.log("\n⚠️ 要嘗試鑄造 1 個 Hero NFT 嗎？");
  console.log("這將消耗 BNB 作為 gas 費用和鑄造費用");
  console.log("輸入 'yes' 繼續，或按 Ctrl+C 退出");

  // 等待用戶輸入
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('繼續? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log("❌ 取消鑄造");
    return;
  }

  // 嘗試鑄造
  console.log("\n🚀 開始鑄造 Hero NFT...");
  try {
    const mintPriceBNB = await Hero.getMintPrice();
    console.log("支付:", ethers.formatEther(mintPriceBNB), "BNB");
    
    const tx = await Hero.mintHero(1, { value: mintPriceBNB });
    console.log("📤 交易已發送:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ 交易確認!");
    console.log("  區塊:", receipt.blockNumber);
    console.log("  Gas 使用:", receipt.gasUsed.toString());
    
    // 檢查事件
    if (receipt.logs && receipt.logs.length > 0) {
      console.log("  事件數量:", receipt.logs.length);
    }
    
    // 檢查新的總供應量
    const newSupply = await Hero.totalSupply();
    console.log("\n🎉 鑄造成功! 新的總供應量:", newSupply.toString());
    
  } catch (error) {
    console.error("❌ 鑄造失敗:", error.message);
    
    // 嘗試解析錯誤
    if (error.data) {
      try {
        const reason = Hero.interface.parseError(error.data);
        console.log("錯誤原因:", reason);
      } catch (e) {
        // 無法解析
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
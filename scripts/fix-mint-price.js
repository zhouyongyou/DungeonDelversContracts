const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 修正 NFT 鑄造價格 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const heroAddress = "0x575e7407C06ADeb47067AD19663af50DdAe460CF";
  
  // 讀取 ABI
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  const hero = new ethers.Contract(heroAddress, heroJson.abi, wallet);
  
  console.log("📊 當前價格");
  console.log("─".repeat(50));
  
  const currentPrice = await hero.mintPriceUSD();
  console.log("當前價格 (raw):", currentPrice.toString());
  console.log("當前價格 (USD):", ethers.formatUnits(currentPrice, 6), "USD");
  
  // 問題：價格太高了，應該是 0.5 USD
  const correctPrice = ethers.parseUnits("0.5", 6); // 0.5 USD = 500000 (6 decimals)
  
  console.log("\n🔧 修正價格");
  console.log("─".repeat(50));
  console.log("新價格 (raw):", correctPrice.toString());
  console.log("新價格 (USD):", ethers.formatUnits(correctPrice, 6), "USD");
  
  try {
    const tx = await hero.setMintPriceUSD(correctPrice);
    console.log("交易哈希:", tx.hash);
    await tx.wait();
    console.log("✅ 價格已更新");
    
    // 驗證
    const newPrice = await hero.mintPriceUSD();
    console.log("\n驗證新價格:");
    console.log("新價格 (USD):", ethers.formatUnits(newPrice, 6), "USD");
    
    if (newPrice === correctPrice) {
      console.log("✅ 價格設置成功");
    }
    
  } catch (error) {
    console.log("❌ 更新失敗:", error.message);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("完成！現在可以測試鑄造了");
  console.log("NFT 價格: 0.5 USD");
  console.log("VRF 費用: 0.0001 BNB");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
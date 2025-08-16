// 修復 mintPriceUSD 設置
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 修復 mintPriceUSD ===\n");
  
  const [signer] = await ethers.getSigners();
  console.log("執行帳號:", signer.address);
  
  // 合約地址
  const addresses = {
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    relic: "0x40e001D24aD6a28FC40870901DbF843D921fe56C"
  };
  
  // 正確的價格：2 USD
  const correctPrice = ethers.parseEther("2"); // 2e18
  
  console.log("正確的 mintPriceUSD:", correctPrice.toString());
  console.log("格式化:", ethers.formatEther(correctPrice), "USD");
  
  // 連接合約
  const hero = await ethers.getContractAt("Hero", addresses.hero);
  const relic = await ethers.getContractAt("Relic", addresses.relic);
  
  // 檢查當前價格
  console.log("\n=== 當前價格 ===");
  const currentHeroPrice = await hero.mintPriceUSD();
  const currentRelicPrice = await relic.mintPriceUSD();
  
  console.log("Hero mintPriceUSD:", currentHeroPrice.toString());
  console.log("Hero 格式化:", ethers.formatEther(currentHeroPrice), "USD");
  console.log("Relic mintPriceUSD:", currentRelicPrice.toString());
  console.log("Relic 格式化:", ethers.formatEther(currentRelicPrice), "USD");
  
  // 修復 Hero 價格
  if (currentHeroPrice !== correctPrice) {
    console.log("\n=== 修復 Hero mintPriceUSD ===");
    try {
      const tx = await hero.setMintPriceUSD(correctPrice);
      console.log("交易已發送:", tx.hash);
      await tx.wait();
      console.log("✅ Hero mintPriceUSD 已修復為 2 USD");
    } catch (error) {
      console.error("❌ 修復 Hero 失敗:", error.message);
    }
  } else {
    console.log("✅ Hero mintPriceUSD 已經是正確值");
  }
  
  // 修復 Relic 價格
  if (currentRelicPrice !== correctPrice) {
    console.log("\n=== 修復 Relic mintPriceUSD ===");
    try {
      const tx = await relic.setMintPriceUSD(correctPrice);
      console.log("交易已發送:", tx.hash);
      await tx.wait();
      console.log("✅ Relic mintPriceUSD 已修復為 2 USD");
    } catch (error) {
      console.error("❌ 修復 Relic 失敗:", error.message);
    }
  } else {
    console.log("✅ Relic mintPriceUSD 已經是正確值");
  }
  
  // 驗證修復
  console.log("\n=== 驗證修復結果 ===");
  const newHeroPrice = await hero.mintPriceUSD();
  const newRelicPrice = await relic.mintPriceUSD();
  
  console.log("新 Hero mintPriceUSD:", ethers.formatEther(newHeroPrice), "USD");
  console.log("新 Relic mintPriceUSD:", ethers.formatEther(newRelicPrice), "USD");
  
  // 測試計算
  console.log("\n=== 測試價格計算 ===");
  const testQty = 1;
  const heroRequired = await hero.getRequiredSoulShardAmount(testQty);
  const relicRequired = await relic.getRequiredSoulShardAmount(testQty);
  
  console.log(`Hero 1個需要: ${ethers.formatEther(heroRequired)} SOUL`);
  console.log(`Relic 1個需要: ${ethers.formatEther(relicRequired)} SOUL`);
  
  // 根據 Oracle 價格計算預期值
  // 如果 1 USD = 1 SOUL（測試環境），那麼 2 USD = 2 SOUL
  // 如果 1 USD = 16500 SOUL（真實環境），那麼 2 USD = 33000 SOUL
  console.log("\n注意：實際 SOUL 數量取決於 Oracle 價格");
  console.log("測試環境：1 USD = 1 SOUL，所以 2 USD = 2 SOUL");
  console.log("真實環境：1 USD ≈ 16500 SOUL，所以 2 USD ≈ 33000 SOUL");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
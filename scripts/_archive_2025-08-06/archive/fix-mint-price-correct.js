// 修復 mintPriceUSD 設置（正確版本）
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 修復 mintPriceUSD（正確版本）===\n");
  
  const [signer] = await ethers.getSigners();
  console.log("執行帳號:", signer.address);
  
  // 合約地址
  const addresses = {
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    relic: "0x40e001D24aD6a28FC40870901DbF843D921fe56C"
  };
  
  // 因為 setMintPriceUSD 會自動乘以 1e18，所以我們只需要傳入 2
  const correctPrice = BigInt(2); // 只傳入 2，不是 2e18
  
  console.log("要設置的值:", correctPrice.toString());
  console.log("合約內部會計算為:", correctPrice * BigInt(10**18), "=", ethers.formatEther(correctPrice * BigInt(10**18)), "USD");
  
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
  console.log("\n=== 修復 Hero mintPriceUSD ===");
  try {
    const tx = await hero.setMintPriceUSD(correctPrice);
    console.log("交易已發送:", tx.hash);
    await tx.wait();
    console.log("✅ Hero setMintPriceUSD(2) 執行成功");
  } catch (error) {
    console.error("❌ 修復 Hero 失敗:", error.message);
  }
  
  // 修復 Relic 價格
  console.log("\n=== 修復 Relic mintPriceUSD ===");
  try {
    const tx = await relic.setMintPriceUSD(correctPrice);
    console.log("交易已發送:", tx.hash);
    await tx.wait();
    console.log("✅ Relic setMintPriceUSD(2) 執行成功");
  } catch (error) {
    console.error("❌ 修復 Relic 失敗:", error.message);
  }
  
  // 驗證修復
  console.log("\n=== 驗證修復結果 ===");
  const newHeroPrice = await hero.mintPriceUSD();
  const newRelicPrice = await relic.mintPriceUSD();
  
  console.log("新 Hero mintPriceUSD:", newHeroPrice.toString());
  console.log("新 Hero 格式化:", ethers.formatEther(newHeroPrice), "USD");
  console.log("新 Relic mintPriceUSD:", newRelicPrice.toString());
  console.log("新 Relic 格式化:", ethers.formatEther(newRelicPrice), "USD");
  
  if (newHeroPrice.toString() === ethers.parseEther("2").toString()) {
    console.log("✅ Hero mintPriceUSD 已正確設置為 2 USD");
  } else {
    console.log("❌ Hero mintPriceUSD 設置失敗");
  }
  
  if (newRelicPrice.toString() === ethers.parseEther("2").toString()) {
    console.log("✅ Relic mintPriceUSD 已正確設置為 2 USD");
  } else {
    console.log("❌ Relic mintPriceUSD 設置失敗");
  }
  
  // 測試計算
  console.log("\n=== 測試價格計算 ===");
  const testQty = 1;
  const heroRequired = await hero.getRequiredSoulShardAmount(testQty);
  const relicRequired = await relic.getRequiredSoulShardAmount(testQty);
  
  console.log(`Hero 1個需要: ${ethers.formatEther(heroRequired)} SOUL`);
  console.log(`Relic 1個需要: ${ethers.formatEther(relicRequired)} SOUL`);
  
  // 預期值說明
  console.log("\n=== 預期值說明 ===");
  console.log("根據 Admin 頁面顯示：1 USD = 10 SOUL");
  console.log("所以 2 USD 應該 = 20 SOUL");
  console.log("但實際 Oracle 可能使用不同的價格");
  console.log("\n注意：如果 Oracle 使用真實價格（1 USD ≈ 16500 SOUL）");
  console.log("那麼 2 USD ≈ 33000 SOUL");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
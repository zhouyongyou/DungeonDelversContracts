const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 測試優化版 NFT 批量鑄造 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("測試者:", wallet.address);
  
  // 合約地址（從部署結果讀取）
  const HERO_ADDRESS = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
  const RELIC_ADDRESS = "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4";
  const VRF_MANAGER = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  const SOUL_TOKEN = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  
  console.log("📊 合約地址");
  console.log("─".repeat(60));
  console.log("Hero:", HERO_ADDRESS);
  console.log("Relic:", RELIC_ADDRESS);
  console.log("VRF Manager:", VRF_MANAGER);
  console.log("SOUL Token:", SOUL_TOKEN);
  
  // 載入合約 ABI
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const relicPath = 'artifacts/contracts/current/nft/Relic.sol/Relic.json';
  const vrfPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  const relicJson = JSON.parse(fs.readFileSync(relicPath, 'utf8'));
  const vrfJson = JSON.parse(fs.readFileSync(vrfPath, 'utf8'));
  
  const hero = new ethers.Contract(HERO_ADDRESS, heroJson.abi, wallet);
  const relic = new ethers.Contract(RELIC_ADDRESS, relicJson.abi, wallet);
  const vrfManager = new ethers.Contract(VRF_MANAGER, vrfJson.abi, wallet);
  const soulToken = new ethers.Contract(SOUL_TOKEN, [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ], wallet);
  
  console.log("\n💰 檢查餘額和費用");
  console.log("─".repeat(60));
  
  // 檢查 BNB 餘額
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log("BNB 餘額:", ethers.formatEther(bnbBalance), "BNB");
  
  // 檢查 SOUL 餘額
  const soulBalance = await soulToken.balanceOf(wallet.address);
  const soulDecimals = await soulToken.decimals();
  console.log("SOUL 餘額:", ethers.formatUnits(soulBalance, soulDecimals), "SOUL");
  
  // 測試費用計算
  const testQuantity = 10; // 測試 10 個 NFT
  
  try {
    const heroRequiredSoul = await hero.getRequiredSoulShardAmount(testQuantity);
    console.log(`Hero ${testQuantity} 個需要 SOUL:`, ethers.formatUnits(heroRequiredSoul, soulDecimals));
    
    const vrfFee = await vrfManager.vrfRequestPrice();
    console.log("VRF 費用:", ethers.formatEther(vrfFee), "BNB");
    
    console.log("\n✅ 優化效果對比：");
    console.log("─".repeat(60));
    console.log(`優化前（${testQuantity} 個隨機數）:`, ethers.formatEther(vrfFee * BigInt(testQuantity)), "BNB");
    console.log(`優化後（1 個隨機數）:`, ethers.formatEther(vrfFee), "BNB");
    const savings = (vrfFee * BigInt(testQuantity - 1));
    console.log("節省費用:", ethers.formatEther(savings), "BNB");
    console.log("節省百分比:", Math.round((Number(testQuantity - 1) / testQuantity) * 100) + "%");
    
    console.log("\n🎯 測試準備");
    console.log("─".repeat(60));
    
    // 檢查是否有足夠餘額
    if (soulBalance < heroRequiredSoul) {
      console.log("❌ SOUL 餘額不足，需要", ethers.formatUnits(heroRequiredSoul - soulBalance, soulDecimals), "更多 SOUL");
      return;
    }
    
    if (bnbBalance < vrfFee) {
      console.log("❌ BNB 餘額不足，需要", ethers.formatEther(vrfFee - bnbBalance), "更多 BNB");
      return;
    }
    
    console.log("✅ 餘額充足，可以進行測試");
    
    // 檢查授權
    console.log("\n🔐 檢查 SOUL 代幣授權");
    console.log("─".repeat(60));
    
    console.log("授權 SOUL 代幣給 Hero 合約...");
    const approveTx = await soulToken.approve(HERO_ADDRESS, heroRequiredSoul);
    await approveTx.wait();
    console.log("✅ SOUL 代幣已授權");
    
    // 測試鑄造（小量測試）
    console.log(`\n🚀 測試 Hero 批量鑄造（${testQuantity} 個）`);
    console.log("─".repeat(60));
    
    const mintTx = await hero.mintFromWallet(testQuantity, {
      value: vrfFee,
      gasLimit: 500000
    });
    
    console.log("鑄造交易哈希:", mintTx.hash);
    await mintTx.wait();
    console.log("✅ 鑄造交易已確認");
    
    // 檢查 commitment
    const commitment = await hero.getUserCommitment(wallet.address);
    console.log("Commitment 區塊:", commitment.blockNumber.toString());
    console.log("數量:", commitment.quantity.toString());
    console.log("已完成:", commitment.fulfilled);
    
    console.log("\n⏳ 等待 VRF 響應...");
    
    // 輪詢 VRF 結果
    let vrfFulfilled = false;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!vrfFulfilled && attempts < maxAttempts) {
      const [fulfilled, randomWords] = await vrfManager.getRandomForUser(wallet.address);
      
      if (fulfilled && randomWords.length > 0) {
        console.log("✅ VRF 已完成！");
        console.log("隨機數:", randomWords[0].toString());
        vrfFulfilled = true;
        
        // 檢查是否可以揭示
        const canReveal = await hero.canReveal(wallet.address);
        console.log("可以揭示:", canReveal);
        
        if (canReveal) {
          console.log("\n🎉 執行揭示...");
          const revealTx = await hero.revealMint({ gasLimit: 800000 });
          await revealTx.wait();
          console.log("✅ 揭示完成！");
          
          // 檢查結果
          const updatedCommitment = await hero.getUserCommitment(wallet.address);
          console.log("Commitment 已完成:", updatedCommitment.fulfilled);
          
          console.log("\n🏆 測試總結");
          console.log("─".repeat(60));
          console.log(`✅ 成功鑄造 ${testQuantity} 個 Hero NFT`);
          console.log("✅ 只使用 1 個 VRF 隨機數");
          console.log(`✅ 節省 ${testQuantity - 1} 次 VRF 費用`);
          console.log("✅ 優化效果驗證成功！");
        }
      } else {
        attempts++;
        console.log(`等待中... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 等待 10 秒
      }
    }
    
    if (!vrfFulfilled) {
      console.log("⏰ VRF 響應超時，但鑄造交易已提交");
      console.log("可以稍後手動執行 revealMint()");
    }
    
  } catch (error) {
    console.log("❌ 測試失敗:", error.shortMessage || error.message);
    console.log("詳細錯誤:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
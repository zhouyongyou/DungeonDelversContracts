// 簡單修復 NFT 鑄造問題
const { ethers } = require("hardhat");

async function fixNFTMint() {
  console.log('\n🔧 修復 NFT 鑄造設置...\n');

  // V12 合約地址
  const HERO_ADDRESS = "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E";
  const RELIC_ADDRESS = "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1";
  const SOULSHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";

  const [signer] = await ethers.getSigners();
  console.log(`操作者: ${signer.address}\n`);

  // 簡化的設置：直接在 Hero/Relic 設置固定價格
  const Hero = await ethers.getContractAt([
    "function mintPriceUSD() external view returns (uint256)",
    "function setMintPriceUSD(uint256) external",
    "function setSoulShardToken(address) external",
    "function soulShardToken() external view returns (address)",
    "function owner() external view returns (address)"
  ], HERO_ADDRESS);

  const Relic = await ethers.getContractAt([
    "function mintPriceUSD() external view returns (uint256)",
    "function setMintPriceUSD(uint256) external",
    "function setSoulShardToken(address) external",
    "function soulShardToken() external view returns (address)",
    "function owner() external view returns (address)"
  ], RELIC_ADDRESS);

  console.log('📍 檢查 Hero 合約:');
  try {
    const heroOwner = await Hero.owner();
    console.log(`  擁有者: ${heroOwner}`);
    
    // 設置 SoulShard 代幣
    const currentSoulShard = await Hero.soulShardToken();
    console.log(`  SoulShard 代幣: ${currentSoulShard}`);
    if (currentSoulShard === ethers.ZeroAddress) {
      console.log('  設置 SoulShard 代幣...');
      const tx = await Hero.setSoulShardToken(SOULSHARD_ADDRESS);
      await tx.wait();
      console.log('  ✅ SoulShard 代幣已設置');
    }
    
    // 設置鑄造價格（10 USD = 10e18，因為 mintPriceUSD 使用 18 位小數）
    const currentPrice = await Hero.mintPriceUSD();
    console.log(`  當前價格: ${ethers.formatEther(currentPrice)} USD`);
    if (currentPrice === 0n) {
      console.log('  設置價格為 10 USD...');
      const tx = await Hero.setMintPriceUSD(10); // 函數內部會乘以 1e18
      await tx.wait();
      console.log('  ✅ 價格已設置');
    }
  } catch (error) {
    console.error('  ❌ Hero 設置失敗:', error.message);
  }

  console.log('\n📍 檢查 Relic 合約:');
  try {
    const relicOwner = await Relic.owner();
    console.log(`  擁有者: ${relicOwner}`);
    
    // 設置 SoulShard 代幣
    const currentSoulShard = await Relic.soulShardToken();
    console.log(`  SoulShard 代幣: ${currentSoulShard}`);
    if (currentSoulShard === ethers.ZeroAddress) {
      console.log('  設置 SoulShard 代幣...');
      const tx = await Relic.setSoulShardToken(SOULSHARD_ADDRESS);
      await tx.wait();
      console.log('  ✅ SoulShard 代幣已設置');
    }
    
    // 設置鑄造價格（5 USD）
    const currentPrice = await Relic.mintPriceUSD();
    console.log(`  當前價格: ${ethers.formatEther(currentPrice)} USD`);
    if (currentPrice === 0n) {
      console.log('  設置價格為 5 USD...');
      const tx = await Relic.setMintPriceUSD(5); // 函數內部會乘以 1e18
      await tx.wait();
      console.log('  ✅ 價格已設置');
    }
  } catch (error) {
    console.error('  ❌ Relic 設置失敗:', error.message);
  }

  console.log('\n💡 總結:');
  console.log('  NFT 鑄造需要的條件：');
  console.log('  1. Hero/Relic 合約設置了 SoulShard 代幣地址');
  console.log('  2. Hero/Relic 合約設置了鑄造價格');
  console.log('  3. 用戶有足夠的 SoulShard 餘額');
  console.log('  4. 用戶授權 Hero/Relic 合約使用 SoulShard');
  console.log('\n  問題根源：Hero 合約調用了 DungeonCore.getSoulShardAmountForUSD()');
  console.log('  但 DungeonCore 沒有這個函數，所以交易失敗。');
  console.log('  臨時解決方案：直接設置固定的 SoulShard 價格。');
}

fixNFTMint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
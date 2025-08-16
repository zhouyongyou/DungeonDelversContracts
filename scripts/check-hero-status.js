const hre = require('hardhat');

async function main() {
  const heroAddress = '0x575e7407C06ADeb47067AD19663af50DdAe460CF';
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  const userAddress = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';
  
  console.log('=== Hero 合約狀態檢查 ===');
  console.log('Hero 地址:', heroAddress);
  console.log('用戶地址:', userAddress);
  console.log('');
  
  // 檢查 Hero 合約狀態
  const Hero = await hre.ethers.getContractFactory('Hero');
  const hero = Hero.attach(heroAddress);
  
  try {
    const isPaused = await hero.paused();
    console.log('✓ 合約是否暫停:', isPaused);
  } catch (e) {
    console.log('✗ 無法讀取 paused 狀態:', e.message);
  }
  
  try {
    const mintPrice = await hero.getMintPriceUSD();
    console.log('✓ 鑄造價格 (USD):', hre.ethers.formatEther(mintPrice));
  } catch (e) {
    console.log('✗ 無法讀取鑄造價格:', e.message);
  }
  
  try {
    const dungeonCore = await hero.dungeonCore();
    console.log('✓ DungeonCore 地址:', dungeonCore);
    
    // 驗證是否正確
    const expectedCore = '0x8a2D2b1961135127228EdD71Ff98d6B097915a13';
    if (dungeonCore.toLowerCase() !== expectedCore.toLowerCase()) {
      console.log('  ⚠️ DungeonCore 地址不匹配！');
      console.log('  期望:', expectedCore);
    }
  } catch (e) {
    console.log('✗ 無法讀取 DungeonCore:', e.message);
  }
  
  try {
    const vrfManager = await hero.vrfManager();
    console.log('✓ VRF Manager 地址:', vrfManager);
    
    // 驗證是否正確
    const expectedVrf = '0xD95d0A29055E810e9f8c64073998832d66538176';
    if (vrfManager.toLowerCase() !== expectedVrf.toLowerCase()) {
      console.log('  ⚠️ VRF Manager 地址不匹配！');
      console.log('  期望:', expectedVrf);
    }
  } catch (e) {
    console.log('✗ 無法讀取 VRF Manager:', e.message);
  }
  
  console.log('\n=== SOUL 代幣狀態 ===');
  
  // 檢查 SOUL 授權
  const SoulShard = await hre.ethers.getContractFactory('SoulShard');
  const soulShard = SoulShard.attach(soulShardAddress);
  
  try {
    const allowance = await soulShard.allowance(userAddress, heroAddress);
    console.log('✓ SOUL 授權額度:', hre.ethers.formatEther(allowance), 'SOUL');
    
    // 計算需要的數量（50個 * 2 USD）
    const requiredAmount = hre.ethers.parseEther('1703649.1009');
    if (allowance < requiredAmount) {
      console.log('  ⚠️ 授權不足！需要:', hre.ethers.formatEther(requiredAmount), 'SOUL');
    }
  } catch (e) {
    console.log('✗ 無法讀取授權:', e.message);
  }
  
  try {
    const balance = await soulShard.balanceOf(userAddress);
    console.log('✓ SOUL 餘額:', hre.ethers.formatEther(balance), 'SOUL');
  } catch (e) {
    console.log('✗ 無法讀取餘額:', e.message);
  }
  
  console.log('\n=== 可能的問題 ===');
  console.log('1. 檢查 SOUL 授權是否充足');
  console.log('2. 檢查合約是否已暫停');
  console.log('3. 檢查 DungeonCore 和 VRF Manager 設置是否正確');
  console.log('4. 檢查合約是否已初始化');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
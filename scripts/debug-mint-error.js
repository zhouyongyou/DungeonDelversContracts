const { ethers } = require('hardhat');

async function main() {
  console.log('=== 調試鑄造錯誤 ===\n');
  
  const heroAddress = '0x575e7407C06ADeb47067AD19663af50DdAe460CF';
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  const vrfManagerAddress = '0xD95d0A29055E810e9f8c64073998832d66538176';
  
  const [signer] = await ethers.getSigners();
  console.log('測試帳號:', signer.address);
  
  // 使用 ABI 獲取合約實例
  const heroAbi = [
    'function mintFromWallet(uint256 quantity) payable',
    'function dungeonCore() view returns (address)',
    'function soulShardToken() view returns (address)', 
    'function vrfManager() view returns (address)',
    'function platformFee() view returns (uint256)',
    'function paused() view returns (bool)',
    'function getRequiredSoulShardAmount(uint256) view returns (uint256)',
    'function getMaxRarityForQuantity(uint256) view returns (uint8, string)',
    'function userCommitments(address) view returns (uint256 blockNumber, uint256 quantity, uint256 payment, bytes32 commitment, bool fulfilled, uint8 maxRarity, bool fromVault)'
  ];
  
  const soulAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];
  
  const vrfAbi = [
    'function authorizedContracts(address) view returns (bool)',
    'function vrfRequestPrice() view returns (uint256)',
    'function platformFee() view returns (uint256)',
    'function getTotalFee() view returns (uint256)'
  ];
  
  const hero = new ethers.Contract(heroAddress, heroAbi, signer);
  const soulShard = new ethers.Contract(soulShardAddress, soulAbi, signer);
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, signer);
  
  // 1. 檢查 Hero 合約配置
  console.log('\n1. Hero 合約配置:');
  const dungeonCore = await hero.dungeonCore();
  const soulShardToken = await hero.soulShardToken();
  const vrfManagerInHero = await hero.vrfManager();
  const platformFee = await hero.platformFee();
  const isPaused = await hero.paused();
  
  console.log('   DungeonCore:', dungeonCore);
  console.log('   SoulShard:', soulShardToken);
  console.log('   VRFManager:', vrfManagerInHero);
  console.log('   平台費:', ethers.formatEther(platformFee), 'BNB');
  console.log('   是否暫停:', isPaused);
  
  // 2. 檢查 VRF Manager 配置
  console.log('\n2. VRF Manager 配置:');
  const isAuthorized = await vrfManager.authorizedContracts(heroAddress);
  const vrfPrice = await vrfManager.vrfRequestPrice();
  const vrfPlatformFee = await vrfManager.platformFee();
  const totalFee = await vrfManager.getTotalFee();
  
  console.log('   Hero 授權狀態:', isAuthorized);
  console.log('   VRF 請求價格:', ethers.formatEther(vrfPrice), 'BNB');
  console.log('   VRF 平台費:', ethers.formatEther(vrfPlatformFee), 'BNB');
  console.log('   總費用:', ethers.formatEther(totalFee), 'BNB');
  
  // 3. 檢查餘額
  console.log('\n3. 餘額檢查:');
  const soulBalance = await soulShard.balanceOf(signer.address);
  const soulAllowance = await soulShard.allowance(signer.address, heroAddress);
  const bnbBalance = await ethers.provider.getBalance(signer.address);
  const requiredSoul = await hero.getRequiredSoulShardAmount(1);
  
  console.log('   SOUL 餘額:', ethers.formatEther(soulBalance));
  console.log('   SOUL 授權:', ethers.formatEther(soulAllowance));
  console.log('   SOUL 需求:', ethers.formatEther(requiredSoul));
  console.log('   BNB 餘額:', ethers.formatEther(bnbBalance));
  console.log('   BNB 需求:', ethers.formatEther(totalFee));
  
  // 4. 檢查用戶承諾
  console.log('\n4. 用戶承諾狀態:');
  const commitment = await hero.userCommitments(signer.address);
  console.log('   區塊號:', commitment.blockNumber.toString());
  console.log('   數量:', commitment.quantity.toString());
  console.log('   已完成:', commitment.fulfilled);
  console.log('   來自金庫:', commitment.fromVault);
  
  // 5. 嘗試模擬交易
  console.log('\n5. 模擬鑄造交易:');
  try {
    // 計算需要的 BNB
    const requiredBnb = totalFee;
    console.log('   發送 BNB:', ethers.formatEther(requiredBnb));
    
    // 使用 call 來模擬交易
    const mintData = hero.interface.encodeFunctionData('mintFromWallet', [1]);
    console.log('   調用數據:', mintData);
    
    const result = await signer.call({
      to: heroAddress,
      data: mintData,
      value: requiredBnb
    });
    
    console.log('   ✅ 模擬成功，返回:', result);
  } catch (error) {
    console.log('   ❌ 模擬失敗');
    console.log('   錯誤:', error.message);
    
    if (error.data) {
      try {
        // 嘗試解碼錯誤
        const decodedError = hero.interface.parseError(error.data);
        console.log('   解碼錯誤:', decodedError);
      } catch (e) {
        console.log('   原始錯誤數據:', error.data);
      }
    }
    
    if (error.reason) {
      console.log('   錯誤原因:', error.reason);
    }
  }
  
  // 6. 檢查 LINK 餘額（VRF Manager）
  console.log('\n6. VRF Manager LINK 餘額:');
  const linkAddress = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75'; // BSC LINK
  const linkAbi = ['function balanceOf(address) view returns (uint256)'];
  const link = new ethers.Contract(linkAddress, linkAbi, signer);
  
  try {
    const vrfLinkBalance = await link.balanceOf(vrfManagerAddress);
    console.log('   LINK 餘額:', ethers.formatEther(vrfLinkBalance));
    
    if (vrfLinkBalance == 0n) {
      console.log('   ⚠️ VRF Manager 沒有 LINK！這可能導致 VRF 請求失敗');
    }
  } catch (e) {
    console.log('   無法讀取 LINK 餘額');
  }
  
  // 7. 直接調用檢查
  console.log('\n7. 直接函數調用檢查:');
  try {
    // 檢查 getRequiredSoulShardAmount
    const amount = await hero.getRequiredSoulShardAmount(1);
    console.log('   ✅ getRequiredSoulShardAmount(1):', ethers.formatEther(amount));
  } catch (e) {
    console.log('   ❌ getRequiredSoulShardAmount 失敗:', e.message);
  }
  
  try {
    // 檢查 getMaxRarityForQuantity
    const [maxRarity, tierName] = await hero.getMaxRarityForQuantity(1);
    console.log('   ✅ getMaxRarityForQuantity(1):', maxRarity, tierName);
  } catch (e) {
    console.log('   ❌ getMaxRarityForQuantity 失敗:', e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
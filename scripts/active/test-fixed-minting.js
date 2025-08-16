const hre = require("hardhat");

async function main() {
  console.log('🧪 測試修復後的 NFT 鑄造功能');
  console.log('===========================\n');
  
  const userAddress = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';
  
  const contracts = {
    hero: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    relic: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
    vrfManager: '0xD95d0A29055E810e9f8c64073998832d66538176',
    soulShard: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'
  };
  
  console.log('測試用戶:', userAddress);
  console.log('合約地址:');
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  try {
    // 獲取合約實例
    const hero = await hre.ethers.getContractAt('Hero', contracts.hero);
    const relic = await hre.ethers.getContractAt('Relic', contracts.relic);
    const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', contracts.vrfManager);
    const soulShard = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', contracts.soulShard);
    
    console.log('\n📊 1. 檢查費用配置...');
    
    // VRF Manager 費用
    const vrfRequestPrice = await vrfManager.vrfRequestPrice();
    const vrfPlatformFee = await vrfManager.platformFee();
    const vrfTotalFee = await vrfManager.getTotalFee();
    
    console.log(`   VRF Request Price: ${hre.ethers.formatEther(vrfRequestPrice)} BNB`);
    console.log(`   VRF Platform Fee: ${hre.ethers.formatEther(vrfPlatformFee)} BNB`);
    console.log(`   VRF Total Fee: ${hre.ethers.formatEther(vrfTotalFee)} BNB`);
    
    // Hero 合約費用
    const heroPlatformFee = await hero.platformFee();
    const heroMintPriceUSD = await hero.mintPriceUSD();
    
    console.log(`   Hero Platform Fee: ${hre.ethers.formatEther(heroPlatformFee)} BNB`);
    console.log(`   Hero Mint Price USD: ${hre.ethers.formatEther(heroMintPriceUSD)} USD`);
    
    // 計算 Hero 50 NFTs 的總費用
    const quantity = 50;
    const heroRequiredSoulShard = await hero.getRequiredSoulShardAmount(quantity);
    const heroTotalBNBFee = heroPlatformFee * BigInt(quantity) + vrfTotalFee;
    
    console.log('\n📊 2. Hero 鑄造費用計算 (50 NFTs):');
    console.log(`   需要 SoulShard: ${hre.ethers.formatEther(heroRequiredSoulShard)} SOUL`);
    console.log(`   平台費總計: ${hre.ethers.formatEther(heroPlatformFee * BigInt(quantity))} BNB`);
    console.log(`   VRF 費用: ${hre.ethers.formatEther(vrfTotalFee)} BNB`);
    console.log(`   總 BNB 需求: ${hre.ethers.formatEther(heroTotalBNBFee)} BNB`);
    
    // 檢查用戶狀態
    console.log('\n📊 3. 檢查用戶狀態...');
    const userBNBBalance = await hre.ethers.provider.getBalance(userAddress);
    const userSoulBalance = await soulShard.balanceOf(userAddress);
    const userSoulAllowance = await soulShard.allowance(userAddress, contracts.hero);
    
    console.log(`   用戶 BNB 餘額: ${hre.ethers.formatEther(userBNBBalance)} BNB`);
    console.log(`   用戶 SOUL 餘額: ${hre.ethers.formatEther(userSoulBalance)} SOUL`);
    console.log(`   用戶 SOUL 授權: ${hre.ethers.formatEther(userSoulAllowance)} SOUL`);
    
    // 檢查授權狀態
    console.log('\n📊 4. 檢查授權狀態...');
    const heroAuthorized = await vrfManager.authorizedContracts(contracts.hero);
    const relicAuthorized = await vrfManager.authorizedContracts(contracts.relic);
    
    console.log(`   Hero 授權: ${heroAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
    console.log(`   Relic 授權: ${relicAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
    
    // 檢查連接配置
    console.log('\n📊 5. 檢查合約連接...');
    const heroVrfManager = await hero.vrfManager();
    const relicVrfManager = await relic.vrfManager();
    
    console.log(`   Hero VRF Manager: ${heroVrfManager === contracts.vrfManager ? '✅ 正確' : '❌ 錯誤'}`);
    console.log(`   Relic VRF Manager: ${relicVrfManager === contracts.vrfManager ? '✅ 正確' : '❌ 錯誤'}`);
    
    // 檢查是否有待處理的鑄造
    console.log('\n📊 6. 檢查待處理狀態...');
    const heroCommitment = await hero.userCommitments(userAddress);
    const relicCommitment = await relic.userCommitments(userAddress);
    
    const heroHasPending = heroCommitment.blockNumber > 0n && !heroCommitment.fulfilled;
    const relicHasPending = relicCommitment.blockNumber > 0n && !relicCommitment.fulfilled;
    
    console.log(`   Hero 有待處理鑄造: ${heroHasPending ? '⚠️ 是' : '✅ 無'}`);
    console.log(`   Relic 有待處理鑄造: ${relicHasPending ? '⚠️ 是' : '✅ 無'}`);
    
    if (heroHasPending) {
      console.log(`   Hero 待處理詳情: 區塊 ${heroCommitment.blockNumber}, 數量 ${heroCommitment.quantity}`);
    }
    
    if (relicHasPending) {
      console.log(`   Relic 待處理詳情: 區塊 ${relicCommitment.blockNumber}, 數量 ${relicCommitment.quantity}`);
    }
    
    // 總結診斷
    console.log('\n🎯 診斷結果:');
    
    const bnbSufficient = userBNBBalance >= heroTotalBNBFee;
    const soulSufficient = userSoulBalance >= heroRequiredSoulShard;
    const soulAuthorized = userSoulAllowance >= heroRequiredSoulShard;
    
    console.log(`   BNB 餘額足夠: ${bnbSufficient ? '✅' : '❌'}`);
    console.log(`   SOUL 餘額足夠: ${soulSufficient ? '✅' : '❌'}`);
    console.log(`   SOUL 授權足夠: ${soulAuthorized ? '✅' : '❌'}`);
    console.log(`   合約授權正確: ${heroAuthorized && relicAuthorized ? '✅' : '❌'}`);
    console.log(`   VRF 連接正確: ${heroVrfManager === contracts.vrfManager && relicVrfManager === contracts.vrfManager ? '✅' : '❌'}`);
    console.log(`   無待處理鑄造: ${!heroHasPending && !relicHasPending ? '✅' : '❌'}`);
    
    const allGood = bnbSufficient && soulSufficient && soulAuthorized && 
                   heroAuthorized && relicAuthorized && 
                   (heroVrfManager === contracts.vrfManager) && 
                   (relicVrfManager === contracts.vrfManager) && 
                   !heroHasPending && !relicHasPending;
    
    if (allGood) {
      console.log('\n🎉 **所有檢查通過！修復已成功！**');
      console.log('💡 用戶現在可以正常鑄造 NFT，不會再出現 #1002 錯誤');
      console.log('🔗 用戶可以在前端嘗試鑄造 Hero 或 Relic NFT');
    } else {
      console.log('\n⚠️ 發現問題，需要進一步處理');
      if (!bnbSufficient) console.log('   - 需要更多 BNB');
      if (!soulSufficient) console.log('   - 需要更多 SOUL');  
      if (!soulAuthorized) console.log('   - 需要授權更多 SOUL');
      if (!heroAuthorized || !relicAuthorized) console.log('   - VRF 授權問題');
      if (heroVrfManager !== contracts.vrfManager || relicVrfManager !== contracts.vrfManager) {
        console.log('   - VRF Manager 連接問題');
      }
      if (heroHasPending || relicHasPending) console.log('   - 有待處理的鑄造');
    }
    
  } catch (error) {
    console.error('\n❌ 測試失敗:', error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
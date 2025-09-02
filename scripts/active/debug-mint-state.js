const hre = require("hardhat");

async function main() {
  console.log('🔍 調試鑄造狀態');
  console.log('================\n');
  
  const userAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  
  console.log('1️⃣ 檢查合約狀態:');
  
  // 檢查合約是否暫停
  try {
    const isPaused = await hero.paused();
    console.log('合約是否暫停:', isPaused ? '是' : '否');
  } catch (e) {
    console.log('無法檢查 paused 狀態');
  }
  
  // 檢查用戶是否有待處理的鑄造
  console.log('\n2️⃣ 檢查用戶鑄造狀態:');
  try {
    const commitment = await hero.userCommitments(userAddress);
    console.log('用戶承諾:', {
      blockNumber: commitment.blockNumber?.toString(),
      quantity: commitment.quantity?.toString(),
      fulfilled: commitment.fulfilled
    });
    
    if (commitment.blockNumber > 0 && !commitment.fulfilled) {
      console.log('🚨 用戶有待處理的鑄造！這會導致鑄造失敗');
    }
  } catch (e) {
    console.log('檢查用戶承諾失敗:', e.message);
  }
  
  // 檢查 SoulShard 授權和餘額
  console.log('\n3️⃣ 檢查 SoulShard 狀態:');
  try {
    const soulShardToken = await hre.ethers.getContractAt('SoulShardToken', '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF');
    
    const balance = await soulShardToken.balanceOf(userAddress);
    const allowance = await soulShardToken.allowance(userAddress, hero.target);
    const requiredAmount = await hero.getRequiredSoulShardAmount(50);
    
    console.log('SoulShard 餘額:', hre.ethers.formatEther(balance));
    console.log('授權額度:', hre.ethers.formatEther(allowance));
    console.log('需要數量 (50個):', hre.ethers.formatEther(requiredAmount));
    
    if (balance < requiredAmount) {
      console.log('🚨 SoulShard 餘額不足！');
    }
    if (allowance < requiredAmount) {
      console.log('🚨 SoulShard 授權不足！');
    }
  } catch (e) {
    console.log('檢查 SoulShard 失敗:', e.message);
  }
  
  // 檢查 BNB 餘額
  console.log('\n4️⃣ 檢查 BNB 餘額:');
  try {
    const balance = await hre.ethers.provider.getBalance(userAddress);
    console.log('BNB 餘額:', hre.ethers.formatEther(balance));
    
    if (balance < hre.ethers.parseEther('0.01')) {
      console.log('⚠️ BNB 餘額較低，可能影響交易');
    }
  } catch (e) {
    console.log('檢查 BNB 餘額失敗:', e.message);
  }
  
  // 模擬費用計算
  console.log('\n5️⃣ 模擬合約費用計算:');
  try {
    const platformFee = await hero.platformFee();
    const vrfManager = await hero.vrfManager();
    
    let requiredPayment = platformFee * 50n;
    
    if (vrfManager !== '0x0000000000000000000000000000000000000000') {
      const vrfContract = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManager);
      const vrfFee = await vrfContract.getVrfRequestPrice();
      requiredPayment += vrfFee;
    }
    
    console.log('合約內部計算的所需費用:', hre.ethers.formatEther(requiredPayment), 'BNB');
    
    // 解析失敗交易的實際支付金額
    console.log('失敗交易支付的金額: 0.005 BNB');
    
    if (requiredPayment > hre.ethers.parseEther('0.005')) {
      console.log('🚨 確認：費用不足');
      console.log('差額:', hre.ethers.formatEther(requiredPayment - hre.ethers.parseEther('0.005')), 'BNB');
    }
    
  } catch (e) {
    console.log('模擬計算失敗:', e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
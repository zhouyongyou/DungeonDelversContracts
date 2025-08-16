const hre = require("hardhat");

async function main() {
  console.log('🔐 調試 VRF Manager 授權狀態');
  console.log('=============================\n');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  
  console.log('Hero 合約:', heroAddress);
  console.log('VRF Manager:', vrfManagerAddress);
  console.log('');
  
  try {
    const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
    
    // 檢查授權狀態
    const isAuthorized = await vrfManager.authorizedContracts(heroAddress);
    console.log('📊 Hero 授權狀態:', isAuthorized ? '已授權' : '未授權');
    
    if (!isAuthorized) {
      console.log('\n🔧 授權 Hero 合約...');
      const tx = await vrfManager.setAuthorizedContract(heroAddress, true);
      console.log('交易哈希:', tx.hash);
      await tx.wait();
      
      const newStatus = await vrfManager.authorizedContracts(heroAddress);
      console.log('✅ 新授權狀態:', newStatus ? '已授權' : '未授權');
    }
    
    // 檢查 VRF 費用狀態
    console.log('\n💰 VRF Manager 費用檢查:');
    const vrfPrice = await vrfManager.vrfRequestPrice();
    const platformFee = await vrfManager.platformFee();
    const totalFee = await vrfManager.getTotalFee();
    
    console.log('VRF Request Price:', hre.ethers.formatEther(vrfPrice), 'BNB');
    console.log('Platform Fee:', hre.ethers.formatEther(platformFee), 'BNB');
    console.log('Total Fee:', hre.ethers.formatEther(totalFee), 'BNB');
    
    // 測試 VRF Manager 的 requestRandomForUser 函數
    console.log('\n🧪 測試 VRF Manager 直接調用:');
    
    const testUser = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';
    const testQuantity = 1;
    const testMaxRarity = 5;
    const testCommitment = hre.ethers.keccak256(hre.ethers.toUtf8Bytes('test'));
    
    try {
      // 使用 staticCall 測試
      const result = await vrfManager.requestRandomForUser.staticCall(
        testUser,
        testQuantity,
        testMaxRarity,
        testCommitment,
        {
          value: totalFee
        }
      );
      
      console.log('✅ VRF Manager 直接調用測試成功，返回 requestId:', result.toString());
      
    } catch (vrfError) {
      console.log('❌ VRF Manager 直接調用失敗:');
      console.log('錯誤:', vrfError.message);
      
      if (vrfError.message.includes('Not authorized')) {
        console.log('💡 授權問題');
      } else if (vrfError.message.includes('Insufficient fee')) {
        console.log('💡 費用不足');
      }
    }
    
  } catch (error) {
    console.error('❌ 調試失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
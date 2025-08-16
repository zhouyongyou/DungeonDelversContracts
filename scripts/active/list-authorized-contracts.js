const hre = require("hardhat");

async function main() {
  console.log('📋 檢查 VRF Manager 授權列表');
  console.log('============================\n');
  
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const relicAddress = '0x50C37A1d8d8A5b7A59b2bdBfC3d5C91A6e07D7B3'; // 如果有的話
  
  const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
  const [signer] = await hre.ethers.getSigners();
  
  console.log('VRF Manager:', vrfManagerAddress);
  console.log('檢查賬戶:', signer.address);
  console.log('');
  
  // 檢查各個地址的授權狀態
  const addressesToCheck = [
    { name: 'Hero 合約', address: heroAddress },
    { name: 'Relic 合約', address: relicAddress },
    { name: '你的 EOA', address: signer.address },
    { name: '零地址', address: '0x0000000000000000000000000000000000000000' }
  ];
  
  console.log('🔍 授權狀態檢查:');
  for (const item of addressesToCheck) {
    try {
      const isAuthorized = await vrfManager.authorizedContracts(item.address);
      console.log(`   ${item.name}: ${isAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
      console.log(`      地址: ${item.address}`);
    } catch (error) {
      console.log(`   ${item.name}: ❌ 檢查失敗 - ${error.message}`);
    }
  }
  
  console.log('\n🔧 確保 Hero 合約有授權...');
  
  try {
    const currentStatus = await vrfManager.authorizedContracts(heroAddress);
    if (!currentStatus) {
      console.log('Hero 合約未授權，正在授權...');
      const tx = await vrfManager.setAuthorizedContract(heroAddress, true);
      console.log('交易哈希:', tx.hash);
      await tx.wait();
      console.log('✅ Hero 合約已授權');
    } else {
      console.log('✅ Hero 合約已經有授權');
    }
    
    // 再次確認
    const finalStatus = await vrfManager.authorizedContracts(heroAddress);
    console.log('最終確認 Hero 授權狀態:', finalStatus ? '已授權' : '未授權');
    
  } catch (error) {
    console.error('❌ 授權過程失敗:', error.message);
  }
  
  console.log('\n💡 提示：');
  console.log('當 Hero 合約調用 VRF Manager 時，msg.sender 會是 Hero 合約地址');
  console.log('所以需要確保 Hero 合約地址在 authorizedContracts 映射中為 true');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
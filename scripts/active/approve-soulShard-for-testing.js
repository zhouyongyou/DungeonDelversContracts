const hre = require("hardhat");

async function main() {
  console.log('🔧 為測試授權 SoulShard');
  console.log('========================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('測試賬戶:', signer.address);
  
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  
  console.log('SoulShard 合約:', soulShardAddress);
  console.log('Hero 合約:', heroAddress);
  console.log('');
  
  try {
    const soulShard = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', soulShardAddress);
    
    // 檢查當前狀態
    const balance = await soulShard.balanceOf(signer.address);
    const currentAllowance = await soulShard.allowance(signer.address, heroAddress);
    
    console.log('📊 當前狀態:');
    console.log('   SoulShard 餘額:', hre.ethers.formatEther(balance));
    console.log('   當前授權額度:', hre.ethers.formatEther(currentAllowance));
    console.log('');
    
    if (currentAllowance === 0n) {
      console.log('🔧 授權 Hero 合約使用 SoulShard...');
      
      // 授權一個很大的數量，避免未來需要重複授權
      const maxApproval = hre.ethers.parseEther('1000000'); // 1M SoulShard
      
      const tx = await soulShard.approve(heroAddress, maxApproval);
      console.log('   交易哈希:', tx.hash);
      await tx.wait();
      
      const newAllowance = await soulShard.allowance(signer.address, heroAddress);
      console.log('   ✅ 新授權額度:', hre.ethers.formatEther(newAllowance));
      
    } else {
      console.log('✅ 已經有授權額度');
    }
    
    console.log('\n🚀 現在可以測試鑄造了！');
    console.log('💡 即使 SoulShard 需求為 0，合約也需要授權才能執行轉移操作');
    
  } catch (error) {
    console.error('❌ 授權失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
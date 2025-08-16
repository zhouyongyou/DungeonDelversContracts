const hre = require("hardhat");

// V25 合約地址配置
const V25_CONTRACTS = {
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13'
};

async function main() {
  console.log('🔧 修復 Party 合約連接');
  console.log('=======================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('Party 地址:', V25_CONTRACTS.PARTY);
  console.log('DungeonCore 地址:', V25_CONTRACTS.DUNGEONCORE);
  console.log('');
  
  try {
    // 連接到 Party 合約
    const party = await hre.ethers.getContractAt('Party', V25_CONTRACTS.PARTY);
    
    // 檢查當前 DungeonCore 地址
    console.log('🔍 檢查當前 DungeonCore 連接...');
    const currentCore = await party.dungeonCoreContract();
    console.log('當前 DungeonCore:', currentCore);
    console.log('目標 DungeonCore:', V25_CONTRACTS.DUNGEONCORE);
    
    if (currentCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
      console.log('\n📝 設定 DungeonCore...');
      const tx = await party.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
      console.log('交易哈希:', tx.hash);
      
      console.log('⏳ 等待交易確認...');
      await tx.wait();
      
      console.log('✅ Party DungeonCore 設定完成');
      
      // 驗證設定結果
      const newCore = await party.dungeonCoreContract();
      console.log('新的 DungeonCore:', newCore);
      
      if (newCore.toLowerCase() === V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('🎉 驗證成功！Party 已正確連接到 DungeonCore');
      } else {
        console.log('❌ 驗證失敗！設定可能沒有生效');
      }
    } else {
      console.log('✅ Party DungeonCore 已正確設定，無需更改');
    }
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    
    if (error.message.includes('OwnableUnauthorizedAccount')) {
      console.error('\n⚠️ 權限錯誤：請確認你是合約的所有者');
      console.error('當前賬戶:', signer.address);
    }
    
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n🎯 Party 合約連接修復完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
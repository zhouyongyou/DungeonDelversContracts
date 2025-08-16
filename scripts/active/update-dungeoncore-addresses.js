const hre = require("hardhat");

async function main() {
  console.log('🔄 更新 DungeonCore 的合約地址');
  console.log('=============================\n');
  
  const dungeonCoreAddress = '0x8a2D2b1961135127228EdD71Ff98d6B097915a13';
  
  const newAddresses = {
    hero: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    relic: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739'
  };
  
  console.log('DungeonCore 地址:', dungeonCoreAddress);
  console.log('新 Hero 地址:', newAddresses.hero);
  console.log('新 Relic 地址:', newAddresses.relic);
  
  const dungeonCore = await hre.ethers.getContractAt('DungeonCore', dungeonCoreAddress);
  
  try {
    console.log('\n📝 更新 Hero 合約地址...');
    let tx = await dungeonCore.setHeroContract(newAddresses.hero);
    await tx.wait();
    console.log('✅ Hero 地址更新成功');
    
    console.log('\n📝 更新 Relic 合約地址...');
    tx = await dungeonCore.setRelicContract(newAddresses.relic);
    await tx.wait();
    console.log('✅ Relic 地址更新成功');
    
    // 驗證更新
    console.log('\n🔍 驗證地址更新...');
    const heroAddress = await dungeonCore.heroContractAddress();
    const relicAddress = await dungeonCore.relicContractAddress();
    
    console.log(`DungeonCore 中的 Hero 地址: ${heroAddress}`);
    console.log(`DungeonCore 中的 Relic 地址: ${relicAddress}`);
    
    console.log(`Hero 地址正確: ${heroAddress === newAddresses.hero ? '✅' : '❌'}`);
    console.log(`Relic 地址正確: ${relicAddress === newAddresses.relic ? '✅' : '❌'}`);
    
    console.log('\n✅ DungeonCore 地址更新完成！');
    
  } catch (error) {
    console.error('❌ 更新失敗:', error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
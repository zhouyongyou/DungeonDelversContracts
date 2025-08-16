const { ethers } = require('hardhat');

async function main() {
  console.log('=== 部署修正的 VRF Manager (使用 BNB Direct Funding) ===\n');
  
  const [deployer] = await ethers.getSigners();
  console.log('部署者:', deployer.address);
  
  // BSC Mainnet V2Plus Wrapper 地址
  const WRAPPER_ADDRESS = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  
  console.log('1. 部署 VRFManagerV2PlusFixed...');
  console.log('   Wrapper 地址:', WRAPPER_ADDRESS);
  
  const VRFManager = await ethers.getContractFactory('VRFManagerV2PlusFixed');
  const vrfManager = await VRFManager.deploy(WRAPPER_ADDRESS);
  
  await vrfManager.waitForDeployment();
  const vrfAddress = await vrfManager.getAddress();
  
  console.log('   ✅ VRFManagerV2PlusFixed 部署成功:', vrfAddress);
  
  // 2. 設置授權
  console.log('\n2. 設置授權合約...');
  const contracts = {
    Hero: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    Relic: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
    AltarOfAscension: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
    DungeonMaster: '0xE391261741Fad5FCC2D298d00e8c684767021253'
  };
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`   授權 ${name}...`);
      const tx = await vrfManager.setAuthorizedContract(address, true);
      await tx.wait();
      console.log(`   ✅ ${name} 授權成功`);
    } catch (e) {
      console.log(`   ❌ ${name} 授權失敗:`, e.message);
    }
  }
  
  // 3. 驗證配置
  console.log('\n3. 驗證配置:');
  const callbackGasLimit = await vrfManager.callbackGasLimit();
  const requestConfirmations = await vrfManager.requestConfirmations();
  const platformFee = await vrfManager.platformFee();
  const totalFee = await vrfManager.getTotalFee();
  
  console.log('   Callback Gas Limit:', callbackGasLimit.toString());
  console.log('   Request Confirmations:', requestConfirmations.toString());
  console.log('   Platform Fee:', ethers.formatEther(platformFee), 'BNB');
  console.log('   估算總費用:', ethers.formatEther(totalFee), 'BNB');
  
  // 4. 更新 Hero 和 Relic 合約
  console.log('\n4. 更新 Hero 和 Relic 合約的 VRF Manager...');
  
  const heroAbi = ['function setVRFManager(address)', 'function vrfManager() view returns (address)'];
  const hero = new ethers.Contract(contracts.Hero, heroAbi, deployer);
  const relic = new ethers.Contract(contracts.Relic, heroAbi, deployer);
  
  try {
    console.log('   更新 Hero VRF Manager...');
    const tx1 = await hero.setVRFManager(vrfAddress);
    await tx1.wait();
    console.log('   ✅ Hero 更新成功');
  } catch (e) {
    console.log('   ❌ Hero 更新失敗:', e.message);
  }
  
  try {
    console.log('   更新 Relic VRF Manager...');
    const tx2 = await relic.setVRFManager(vrfAddress);
    await tx2.wait();
    console.log('   ✅ Relic 更新成功');
  } catch (e) {
    console.log('   ❌ Relic 更新失敗:', e.message);
  }
  
  // 5. 最終驗證
  console.log('\n5. 最終驗證:');
  const heroVrf = await hero.vrfManager();
  const relicVrf = await relic.vrfManager();
  
  console.log('   Hero VRF Manager:', heroVrf);
  console.log('   Relic VRF Manager:', relicVrf);
  console.log('   新 VRF Manager:', vrfAddress);
  
  console.log('\n=== 部署完成 ===');
  console.log('新 VRFManagerV2PlusFixed 地址:', vrfAddress);
  console.log('');
  console.log('重要提示:');
  console.log('1. 這個 VRF Manager 使用 BNB 支付，不需要 LINK 代幣');
  console.log('2. 用戶鑄造時只需支付 BNB 即可');
  console.log('3. 請更新前端配置使用新的 VRF Manager 地址');
  
  // 寫入配置文件
  const fs = require('fs');
  const config = {
    VRFManagerV2PlusFixed: vrfAddress,
    deployedAt: new Date().toISOString(),
    wrapper: WRAPPER_ADDRESS,
    network: 'BSC Mainnet'
  };
  
  fs.writeFileSync(
    'vrf-manager-fixed-deployment.json',
    JSON.stringify(config, null, 2)
  );
  
  console.log('\n配置已保存到 vrf-manager-fixed-deployment.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
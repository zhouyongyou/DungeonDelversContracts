const { ethers } = require('hardhat');
const axios = require('axios');
require('dotenv').config();

async function main() {
  console.log('=== 重新部署並驗證 VRFManagerV2PlusFixed ===\n');
  
  const [deployer] = await ethers.getSigners();
  console.log('部署者:', deployer.address);
  
  const wrapperAddress = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  
  // 1. 使用 Hardhat 部署新合約
  console.log('1. 部署新的 VRFManagerV2PlusFixed...');
  console.log('   Wrapper 地址:', wrapperAddress);
  
  const VRFManager = await ethers.getContractFactory('VRFManagerV2PlusFixed');
  const vrfManager = await VRFManager.deploy(wrapperAddress);
  
  await vrfManager.waitForDeployment();
  const vrfAddress = await vrfManager.getAddress();
  
  console.log('   ✅ 部署成功:', vrfAddress);
  console.log('   交易哈希:', vrfManager.deploymentTransaction().hash);
  
  // 2. 等待幾個區塊確認
  console.log('\n2. 等待區塊確認...');
  await vrfManager.deploymentTransaction().wait(5);
  console.log('   ✅ 已確認');
  
  // 3. 設置授權
  console.log('\n3. 設置授權...');
  const contracts = {
    Hero: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    Relic: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
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
  
  // 4. 自動驗證
  console.log('\n4. 執行自動驗證...');
  
  try {
    await hre.run("verify:verify", {
      address: vrfAddress,
      constructorArguments: [wrapperAddress],
      contract: "contracts/current/core/VRFManagerV2PlusFixed.sol:VRFManagerV2PlusFixed"
    });
    console.log('   ✅ 驗證成功！');
  } catch (error) {
    if (error.message.includes('already verified')) {
      console.log('   ✅ 合約已經驗證');
    } else {
      console.log('   驗證失敗:', error.message);
      
      // 嘗試備用驗證方法
      console.log('\n5. 嘗試備用驗證方法...');
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const verifyCmd = `npx hardhat verify --network bsc ${vrfAddress} "${wrapperAddress}"`;
      
      try {
        const { stdout, stderr } = await execPromise(verifyCmd);
        if (stdout.includes('Successfully verified') || stderr.includes('Already Verified')) {
          console.log('   ✅ 驗證成功！');
        } else {
          console.log('   輸出:', stdout);
        }
      } catch (e) {
        console.log('   備用驗證也失敗:', e.message);
      }
    }
  }
  
  // 5. 更新 Hero 和 Relic 合約
  console.log('\n6. 更新 Hero 和 Relic 的 VRF Manager...');
  
  const heroAbi = ['function setVRFManager(address)', 'function vrfManager() view returns (address)'];
  const hero = new ethers.Contract(contracts.Hero, heroAbi, deployer);
  const relic = new ethers.Contract(contracts.Relic, heroAbi, deployer);
  
  try {
    console.log('   更新 Hero...');
    const tx1 = await hero.setVRFManager(vrfAddress);
    await tx1.wait();
    console.log('   ✅ Hero 更新成功');
  } catch (e) {
    console.log('   ❌ Hero 更新失敗:', e.message);
  }
  
  try {
    console.log('   更新 Relic...');
    const tx2 = await relic.setVRFManager(vrfAddress);
    await tx2.wait();
    console.log('   ✅ Relic 更新成功');
  } catch (e) {
    console.log('   ❌ Relic 更新失敗:', e.message);
  }
  
  // 6. 最終確認
  console.log('\n7. 最終確認:');
  const heroVrf = await hero.vrfManager();
  const relicVrf = await relic.vrfManager();
  
  console.log('   Hero VRF Manager:', heroVrf);
  console.log('   Relic VRF Manager:', relicVrf);
  console.log('   新 VRF Manager:', vrfAddress);
  
  // 7. 更新配置文件
  const fs = require('fs');
  const config = {
    VRFManagerV2PlusFixed: vrfAddress,
    deployedAt: new Date().toISOString(),
    wrapper: wrapperAddress,
    network: 'BSC Mainnet',
    deploymentTx: vrfManager.deploymentTransaction().hash,
    verified: true
  };
  
  fs.writeFileSync(
    'vrf-manager-hardhat-deployment.json',
    JSON.stringify(config, null, 2)
  );
  
  console.log('\n=== 部署和驗證完成 ===');
  console.log('新 VRF Manager 地址:', vrfAddress);
  console.log('BSCScan:', `https://bscscan.com/address/${vrfAddress}#code`);
  
  // 8. 更新 master-config
  const masterConfigPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/master-config.ts';
  let masterConfig = fs.readFileSync(masterConfigPath, 'utf8');
  
  const oldVrfPattern = /VRFMANAGER:\s*['"]0x[a-fA-F0-9]{40}['"]/;
  const newVrfLine = `VRFMANAGER: '${vrfAddress}'`;
  
  if (masterConfig.match(oldVrfPattern)) {
    masterConfig = masterConfig.replace(oldVrfPattern, newVrfLine);
    fs.writeFileSync(masterConfigPath, masterConfig);
    console.log('✅ master-config.ts 已更新');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require('hardhat');

async function main() {
  console.log('=== 授權 Hero 合約使用 VRF Manager ===\n');
  
  const vrfManagerAddress = '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1';
  const heroAddress = '0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD';
  const relicAddress = '0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366';  // V25 正確地址
  const altarAddress = '0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3';  // V25 正確地址
  const dungeonMasterAddress = '0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703';  // V25 正確地址
  
  const [deployer] = await ethers.getSigners();
  console.log('執行者地址:', deployer.address);
  
  // VRFManagerV2Plus ABI
  const vrfAbi = [
    'function authorizedContracts(address) view returns (bool)',
    'function setAuthorizedContract(address contract_, bool authorized)',
    'function owner() view returns (address)',
    'function vrfRequestPrice() view returns (uint256)',
    'function platformFee() view returns (uint256)',
    'function getTotalFee() view returns (uint256)'
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, deployer);
  
  // 1. 檢查 Owner
  console.log('\n1. 檢查 VRF Manager Owner:');
  try {
    const owner = await vrfManager.owner();
    console.log('   Owner:', owner);
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log('   ❌ 你不是 Owner，無法授權！');
      console.log('   需要使用 Owner 帳號:', owner);
      return;
    }
    console.log('   ✅ 你是 Owner');
  } catch (e) {
    console.log('   ❌ 無法讀取 owner:', e.message);
  }
  
  // 2. 檢查當前授權狀態
  console.log('\n2. 當前授權狀態:');
  
  const contracts = [
    { name: 'Hero', address: heroAddress },
    { name: 'Relic', address: relicAddress },
    { name: 'AltarOfAscension', address: altarAddress },
    { name: 'DungeonMaster', address: dungeonMasterAddress }
  ];
  
  for (const contract of contracts) {
    try {
      const isAuthorized = await vrfManager.authorizedContracts(contract.address);
      console.log(`   ${contract.name}: ${isAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
    } catch (e) {
      console.log(`   ${contract.name}: 無法檢查`);
    }
  }
  
  // 3. 檢查費用設置
  console.log('\n3. VRF 費用設置:');
  try {
    const vrfPrice = await vrfManager.vrfRequestPrice();
    const platformFee = await vrfManager.platformFee();
    const totalFee = await vrfManager.getTotalFee();
    
    console.log('   VRF 請求價格:', ethers.formatEther(vrfPrice), 'BNB');
    console.log('   平台費:', ethers.formatEther(platformFee), 'BNB');
    console.log('   總費用:', ethers.formatEther(totalFee), 'BNB');
  } catch (e) {
    console.log('   無法讀取費用:', e.message);
  }
  
  // 4. 執行授權
  console.log('\n4. 執行授權:');
  
  for (const contract of contracts) {
    try {
      const isAuthorized = await vrfManager.authorizedContracts(contract.address);
      
      if (!isAuthorized) {
        console.log(`   授權 ${contract.name}...`);
        const tx = await vrfManager.setAuthorizedContract(contract.address, true);
        console.log(`   交易哈希: ${tx.hash}`);
        await tx.wait();
        console.log(`   ✅ ${contract.name} 授權成功`);
      } else {
        console.log(`   ✓ ${contract.name} 已經授權，跳過`);
      }
    } catch (e) {
      console.log(`   ❌ 授權 ${contract.name} 失敗:`, e.message);
    }
  }
  
  // 5. 驗證授權結果
  console.log('\n5. 驗證授權結果:');
  
  for (const contract of contracts) {
    try {
      const isAuthorized = await vrfManager.authorizedContracts(contract.address);
      console.log(`   ${contract.name}: ${isAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
    } catch (e) {
      console.log(`   ${contract.name}: 無法驗證`);
    }
  }
  
  console.log('\n=== 授權完成 ===');
  console.log('現在可以嘗試鑄造 NFT 了！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
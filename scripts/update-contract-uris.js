// 更新所有 NFT 合約的 contractURI 指向正確的後端 API
const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 更新所有 NFT 合約的 contractURI...');
  
  const contracts = {
    hero: '0x428486A4860E54e5ACAFEfdD07FF8E23E18877Cc',
    relic: '0xbA7e324c92F81C42E9F639602B1766765E93002d',
    party: '0xE2609F06E4937816A64Ee8ba53FEC41D1Fa2C468',
    vipstaking: '0x7e3a738c14159093b0b39Da6e9b210C27Bf0068b',
    playerprofile: '0x9Dd96B36e38C1e332616Be3Ba9Ff03B90Db4047A'
  };
  
  const baseServerUrl = 'https://dungeon-delvers-metadata-server.onrender.com';
  
  // 合約 URI 映射
  const contractURIs = {
    hero: `${baseServerUrl}/metadata/collection/hero`,
    relic: `${baseServerUrl}/metadata/collection/relic`,
    party: `${baseServerUrl}/metadata/collection/party`,
    vipstaking: `${baseServerUrl}/metadata/collection/vipstaking`,
    playerprofile: `${baseServerUrl}/metadata/collection/playerprofile`
  };
  
  // 通用 ABI（假設所有合約都有這個函數）
  const contractABI = [
    'function contractURI() view returns (string)',
    'function setContractURI(string memory newContractURI)',
    'function owner() view returns (address)'
  ];
  
  const [signer] = await ethers.getSigners();
  console.log('使用錢包:', signer.address);
  
  for (const [type, address] of Object.entries(contracts)) {
    try {
      console.log(`\n📋 處理 ${type.toUpperCase()} 合約: ${address}`);
      
      const contract = new ethers.Contract(address, contractABI, signer);
      
      // 檢查當前 contractURI
      const currentURI = await contract.contractURI();
      const newURI = contractURIs[type];
      
      console.log(`當前 URI: ${currentURI}`);
      console.log(`新 URI: ${newURI}`);
      
      if (currentURI === newURI) {
        console.log('✅ URI 已是最新，無需更新');
        continue;
      }
      
      // 檢查權限
      try {
        const owner = await contract.owner();
        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
          console.log(`⚠️ 錢包 ${signer.address} 不是合約 owner (${owner})，跳過`);
          continue;
        }
      } catch (e) {
        console.log('⚠️ 無法檢查 owner，嘗試直接更新...');
      }
      
      // 更新 contractURI
      console.log('🔄 更新 contractURI...');
      const tx = await contract.setContractURI(newURI);
      console.log(`交易已發送: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ ${type.toUpperCase()} contractURI 更新成功！`);
      console.log(`Gas 使用: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.error(`❌ ${type.toUpperCase()} 更新失敗:`, error.message);
    }
  }
  
  console.log('\n🎉 contractURI 更新完成！');
  console.log('\n📋 更新後的 Collection API 端點：');
  Object.entries(contractURIs).forEach(([type, uri]) => {
    console.log(`${type.toUpperCase()}: ${uri}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 腳本執行失敗:', error);
    process.exit(1);
  });
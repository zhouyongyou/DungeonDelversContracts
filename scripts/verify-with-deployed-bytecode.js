const { ethers } = require('ethers');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

async function main() {
  console.log('=== 使用已部署 Bytecode 驗證合約 ===\n');
  
  const contractAddress = '0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1';
  const wrapperAddress = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 缺少 BSCSCAN_API_KEY');
    return;
  }
  
  // 1. 獲取已部署的 bytecode
  console.log('1. 獲取已部署的 bytecode...');
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const deployedBytecode = await provider.getCode(contractAddress);
  console.log('   Bytecode 長度:', deployedBytecode.length);
  
  // 2. 讀取 flatten 源碼
  console.log('\n2. 讀取 flatten 源碼...');
  let flattenSource = fs.readFileSync('VRFManagerV2PlusFixed_flat.sol', 'utf8');
  
  // 清理源碼中的多餘 pragma 和 license
  flattenSource = flattenSource
    .replace(/\/\/ Original license: SPDX_License_Identifier: MIT\n/g, '')
    .replace(/pragma solidity \^0\.8\.0;\n/g, '')
    .replace(/pragma solidity \^0\.8\.4;\n/g, '');
  
  // 確保只有一個主 pragma
  if (!flattenSource.includes('pragma solidity ^0.8.20;')) {
    flattenSource = flattenSource.replace(
      '// SPDX-License-Identifier: MIT',
      '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;'
    );
  }
  
  // 保存清理後的版本
  fs.writeFileSync('VRFManagerV2PlusFixed_clean.sol', flattenSource);
  console.log('   ✅ 清理後的源碼已保存');
  
  // 3. 嘗試多種編譯器版本
  const compilerVersions = [
    'v0.8.20+commit.a1b79de6',
    'v0.8.20+commit.a1b79de6',
    'v0.8.20+commit.a1b79de6'
  ];
  
  for (const compilerVersion of compilerVersions) {
    console.log(`\n3. 嘗試編譯器版本: ${compilerVersion}`);
    
    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('module', 'contract');
    form.append('action', 'verifysourcecode');
    form.append('contractaddress', contractAddress);
    form.append('sourceCode', flattenSource);
    form.append('codeformat', 'solidity-single-file');
    form.append('contractname', 'VRFManagerV2PlusFixed');
    form.append('compilerversion', compilerVersion);
    form.append('optimizationUsed', '1');
    form.append('runs', '200');
    form.append('constructorArguements', '000000000000000000000000471506e6aded0b9811d05b8cac8db25ee839ac94');
    form.append('licenseType', '3'); // MIT
    
    try {
      console.log('   發送驗證請求...');
      const response = await axios.post('https://api.bscscan.com/api', form, {
        headers: form.getHeaders()
      });
      
      if (response.data.status === '1') {
        console.log('   ✅ 驗證請求已提交');
        console.log('   GUID:', response.data.result);
        
        // 等待並檢查結果
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const checkResponse = await axios.get('https://api.bscscan.com/api', {
          params: {
            apikey: apiKey,
            module: 'contract',
            action: 'checkverifystatus',
            guid: response.data.result
          }
        });
        
        console.log('   狀態:', checkResponse.data.result);
        
        if (checkResponse.data.result.includes('Verified')) {
          console.log('\n🎉 合約驗證成功！');
          console.log(`查看: https://bscscan.com/address/${contractAddress}#code`);
          return;
        }
      }
    } catch (error) {
      console.log('   失敗:', error.message.slice(0, 50));
    }
  }
  
  // 4. 如果自動驗證失敗，提供手動指引
  console.log('\n4. 自動驗證未成功，請手動驗證：');
  console.log('   1. 訪問: https://bscscan.com/verifyContract');
  console.log('   2. 輸入合約地址:', contractAddress);
  console.log('   3. 選擇 Compiler Type: Solidity (Single file)');
  console.log('   4. Compiler Version: v0.8.20+commit.a1b79de6');
  console.log('   5. License: MIT');
  console.log('   6. 開啟優化: Yes, 200 runs');
  console.log('   7. 上傳文件: VRFManagerV2PlusFixed_clean.sol');
  console.log('   8. Constructor Arguments:');
  console.log('      000000000000000000000000471506e6aded0b9811d05b8cac8db25ee839ac94');
  
  // 5. 生成更詳細的構造參數信息
  console.log('\n5. 構造參數詳情:');
  const abiCoder = new ethers.AbiCoder();
  const encoded = abiCoder.encode(['address'], [wrapperAddress]);
  console.log('   Wrapper 地址:', wrapperAddress);
  console.log('   ABI 編碼 (含 0x):', encoded);
  console.log('   ABI 編碼 (無 0x):', encoded.slice(2));
  
  // 6. 檢查其他相關合約
  console.log('\n6. 其他相關合約驗證狀態:');
  const contracts = [
    { name: 'Hero', address: '0x575e7407C06ADeb47067AD19663af50DdAe460CF' },
    { name: 'Relic', address: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739' },
    { name: 'DungeonMaster', address: '0xE391261741Fad5FCC2D298d00e8c684767021253' },
    { name: 'AltarOfAscension', address: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33' }
  ];
  
  for (const contract of contracts) {
    try {
      const response = await axios.get('https://api.bscscan.com/api', {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: contract.address,
          apikey: apiKey
        }
      });
      
      if (response.data.result[0].SourceCode) {
        console.log(`   ${contract.name}: ✅ 已驗證`);
      } else {
        console.log(`   ${contract.name}: ❌ 未驗證`);
      }
    } catch (e) {
      console.log(`   ${contract.name}: 檢查失敗`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
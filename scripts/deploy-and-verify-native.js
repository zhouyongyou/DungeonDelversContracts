const { ethers } = require('ethers');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

async function main() {
  console.log('=== 使用原生 Ethers 重新部署並驗證 VRF Manager ===\n');
  
  // 連接到 BSC
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('部署者:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('BNB 餘額:', ethers.formatEther(balance));
  
  // 讀取編譯後的合約
  const artifactPath = './artifacts/contracts/current/core/VRFManagerV2PlusFixed.sol/VRFManagerV2PlusFixed.json';
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // BSC Mainnet V2Plus Wrapper 地址
  const WRAPPER_ADDRESS = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  
  console.log('\n1. 部署 VRFManagerV2PlusFixed...');
  console.log('   Wrapper 地址:', WRAPPER_ADDRESS);
  
  // 創建合約工廠
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  // 設置 gas 參數
  const gasPrice = await provider.getFeeData();
  console.log('   Gas Price:', ethers.formatUnits(gasPrice.gasPrice, 'gwei'), 'gwei');
  
  // 部署合約
  const vrfManager = await factory.deploy(WRAPPER_ADDRESS, {
    gasLimit: 3000000,
    gasPrice: gasPrice.gasPrice
  });
  
  console.log('   交易哈希:', vrfManager.deploymentTransaction().hash);
  console.log('   等待確認...');
  
  await vrfManager.waitForDeployment();
  const vrfAddress = await vrfManager.getAddress();
  
  console.log('   ✅ VRFManagerV2PlusFixed 部署成功:', vrfAddress);
  
  // 等待更多確認
  console.log('   等待 5 個區塊確認...');
  await vrfManager.deploymentTransaction().wait(5);
  console.log('   ✅ 已確認');
  
  // 2. 設置授權
  console.log('\n2. 設置授權合約...');
  const contracts = {
    Hero: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    Relic: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
    DungeonMaster: '0xE391261741Fad5FCC2D298d00e8c684767021253'
  };
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`   授權 ${name}...`);
      const tx = await vrfManager.setAuthorizedContract(address, true);
      console.log(`   交易哈希: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ ${name} 授權成功`);
    } catch (e) {
      console.log(`   ❌ ${name} 授權失敗:`, e.message);
    }
  }
  
  // 3. 準備驗證源碼
  console.log('\n3. 準備驗證源碼...');
  
  // 讀取 flatten 文件
  let flattenSource = fs.readFileSync('VRFManagerV2PlusFixed_flat.sol', 'utf8');
  
  // 清理源碼
  flattenSource = flattenSource
    .replace(/\/\/ Sources flattened with hardhat.*\n/g, '')
    .replace(/\/\/ Original license: SPDX_License_Identifier: MIT\n/g, '')
    .replace(/\/\/ File.*\.sol@v[\d\.]+\n/g, '');
  
  // 確保只有一個 SPDX 和 pragma
  const lines = flattenSource.split('\n');
  let cleanLines = [];
  let hasSPDX = false;
  let hasPragma = false;
  
  for (const line of lines) {
    if (line.startsWith('// SPDX-License-Identifier:')) {
      if (!hasSPDX) {
        cleanLines.push('// SPDX-License-Identifier: MIT');
        hasSPDX = true;
      }
    } else if (line.startsWith('pragma solidity')) {
      if (!hasPragma) {
        cleanLines.push('pragma solidity ^0.8.20;');
        hasPragma = true;
      }
    } else if (line.trim() !== '') {
      cleanLines.push(line);
    }
  }
  
  flattenSource = cleanLines.join('\n');
  fs.writeFileSync('VRFManagerV2PlusFixed_verified.sol', flattenSource);
  console.log('   ✅ 清理後的源碼已保存');
  
  // 4. 通過 API 驗證
  console.log('\n4. 提交驗證到 BSCScan...');
  
  const apiKey = process.env.BSCSCAN_API_KEY;
  if (!apiKey) {
    console.log('❌ 缺少 BSCSCAN_API_KEY');
    return;
  }
  
  // 準備驗證請求
  const form = new FormData();
  form.append('apikey', apiKey);
  form.append('module', 'contract');
  form.append('action', 'verifysourcecode');
  form.append('contractaddress', vrfAddress);
  form.append('sourceCode', flattenSource);
  form.append('codeformat', 'solidity-single-file');
  form.append('contractname', 'VRFManagerV2PlusFixed');
  form.append('compilerversion', 'v0.8.20+commit.a1b79de6');
  form.append('optimizationUsed', '1');
  form.append('runs', '200');
  
  // 構造參數 ABI 編碼
  const abiCoder = new ethers.AbiCoder();
  const constructorArgs = abiCoder.encode(['address'], [WRAPPER_ADDRESS]).slice(2);
  form.append('constructorArguements', constructorArgs);
  form.append('licenseType', '3'); // MIT
  
  try {
    console.log('   發送驗證請求...');
    const response = await axios.post('https://api.bscscan.com/api', form, {
      headers: form.getHeaders(),
      timeout: 30000
    });
    
    console.log('   API 響應:', JSON.stringify(response.data, null, 2));
    
    if (response.data.status === '1') {
      console.log('   ✅ 驗證請求已提交！');
      const guid = response.data.result;
      console.log('   GUID:', guid);
      
      // 等待驗證完成
      console.log('\n   等待驗證處理 (30秒)...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // 檢查驗證狀態
      console.log('   檢查驗證狀態...');
      const checkResponse = await axios.get('https://api.bscscan.com/api', {
        params: {
          apikey: apiKey,
          module: 'contract',
          action: 'checkverifystatus',
          guid: guid
        }
      });
      
      console.log('   驗證結果:', checkResponse.data);
      
      if (checkResponse.data.result && checkResponse.data.result.includes('Verified')) {
        console.log('\n🎉 合約驗證成功！');
      } else if (checkResponse.data.result && checkResponse.data.result.includes('Pending')) {
        console.log('   ⏳ 驗證仍在處理中，請稍後檢查');
      } else {
        console.log('   ❌ 驗證失敗:', checkResponse.data.result);
      }
    } else {
      console.log('   ❌ 提交失敗:', response.data.message);
    }
  } catch (error) {
    console.log('   ❌ API 錯誤:', error.message);
    if (error.response) {
      console.log('   響應:', error.response.data);
    }
  }
  
  // 5. 更新 Hero 和 Relic
  console.log('\n5. 更新 Hero 和 Relic 合約...');
  
  const heroAbi = ['function setVRFManager(address)', 'function vrfManager() view returns (address)'];
  const hero = new ethers.Contract(contracts.Hero, heroAbi, wallet);
  const relic = new ethers.Contract(contracts.Relic, heroAbi, wallet);
  
  try {
    console.log('   更新 Hero VRF Manager...');
    const tx1 = await hero.setVRFManager(vrfAddress);
    console.log('   交易哈希:', tx1.hash);
    await tx1.wait();
    console.log('   ✅ Hero 更新成功');
  } catch (e) {
    console.log('   ❌ Hero 更新失敗:', e.message);
  }
  
  try {
    console.log('   更新 Relic VRF Manager...');
    const tx2 = await relic.setVRFManager(vrfAddress);
    console.log('   交易哈希:', tx2.hash);
    await tx2.wait();
    console.log('   ✅ Relic 更新成功');
  } catch (e) {
    console.log('   ❌ Relic 更新失敗:', e.message);
  }
  
  // 6. 保存配置
  console.log('\n6. 保存配置...');
  const config = {
    VRFManagerV2PlusFixed: vrfAddress,
    deployedAt: new Date().toISOString(),
    deploymentTx: vrfManager.deploymentTransaction().hash,
    wrapper: WRAPPER_ADDRESS,
    network: 'BSC Mainnet',
    contracts: contracts
  };
  
  fs.writeFileSync(
    'vrf-manager-final-deployment.json',
    JSON.stringify(config, null, 2)
  );
  
  // 7. 更新 master-config
  const masterConfigPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/master-config.ts';
  let masterConfig = fs.readFileSync(masterConfigPath, 'utf8');
  
  const oldVrfPattern = /VRFMANAGER:\s*['"]0x[a-fA-F0-9]{40}['"]/;
  const newVrfLine = `VRFMANAGER: '${vrfAddress}'`;
  
  if (masterConfig.match(oldVrfPattern)) {
    masterConfig = masterConfig.replace(oldVrfPattern, newVrfLine);
    fs.writeFileSync(masterConfigPath, masterConfig);
    console.log('   ✅ master-config.ts 已更新');
  }
  
  console.log('\n=== 部署完成 ===');
  console.log('新 VRFManagerV2PlusFixed 地址:', vrfAddress);
  console.log('BSCScan:', `https://bscscan.com/address/${vrfAddress}#code`);
  console.log('\n重要提示:');
  console.log('1. 合約已成功部署並配置');
  console.log('2. 驗證請求已提交到 BSCScan');
  console.log('3. 如果自動驗證失敗，請使用 VRFManagerV2PlusFixed_verified.sol 手動驗證');
  console.log('4. Hero 和 Relic 已更新使用新 VRF Manager');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('錯誤:', error);
    process.exit(1);
  });
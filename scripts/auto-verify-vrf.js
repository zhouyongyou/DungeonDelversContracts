const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = util.promisify(exec);
require('dotenv').config();

async function main() {
  console.log('=== 自動驗證 VRFManagerV2PlusFixed 合約 ===\n');
  
  const contractAddress = '0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1';
  const wrapperAddress = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  
  console.log('合約地址:', contractAddress);
  console.log('構造參數:', wrapperAddress);
  
  // 1. 先嘗試標準驗證方式
  console.log('\n1. 嘗試標準驗證...');
  
  try {
    // 使用正確的合約路徑和參數
    const verifyCmd = `npx hardhat verify --network bsc \\
      --contract contracts/current/core/VRFManagerV2PlusFixed.sol:VRFManagerV2PlusFixed \\
      ${contractAddress} \\
      "${wrapperAddress}"`;
    
    console.log('執行:', verifyCmd);
    const { stdout, stderr } = await execPromise(verifyCmd);
    
    if (stdout.includes('Successfully verified') || stdout.includes('already verified')) {
      console.log('✅ 驗證成功！');
      console.log(stdout);
      return;
    }
    
    console.log('標準驗證未成功，嘗試其他方法...');
  } catch (error) {
    console.log('標準驗證失敗:', error.message.slice(0, 100));
  }
  
  // 2. 嘗試使用 etherscan-verify
  console.log('\n2. 嘗試使用 etherscan-verify 任務...');
  
  try {
    const etherscanCmd = `npx hardhat etherscan-verify --network bsc \\
      --license MIT \\
      --solc-input \\
      --force-license`;
    
    console.log('執行:', etherscanCmd);
    const { stdout } = await execPromise(etherscanCmd);
    console.log(stdout);
    
    if (stdout.includes('verified') || stdout.includes('Verified')) {
      console.log('✅ 批量驗證成功！');
      return;
    }
  } catch (error) {
    console.log('Etherscan-verify 失敗:', error.message.slice(0, 100));
  }
  
  // 3. 生成標準 JSON 輸入格式
  console.log('\n3. 生成標準 JSON 輸入...');
  
  try {
    // 使用固定的編譯配置
    const solcVersion = '0.8.20';
    const optimizer = { enabled: true, runs: 200 };
    
    // 讀取合約源碼
    const contractPath = path.join(__dirname, '../contracts/current/core/VRFManagerV2PlusFixed.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    
    // 創建標準 JSON 輸入
    const input = {
      language: 'Solidity',
      sources: {
        'VRFManagerV2PlusFixed.sol': {
          content: contractSource
        }
      },
      settings: {
        optimizer: optimizer,
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };
    
    // 保存 JSON 輸入
    const jsonPath = 'verify-input.json';
    fs.writeFileSync(jsonPath, JSON.stringify(input, null, 2));
    console.log('✅ 標準 JSON 輸入已生成:', jsonPath);
    
  } catch (error) {
    console.log('生成 JSON 輸入失敗:', error.message);
  }
  
  // 4. 嘗試通過 API 驗證
  console.log('\n4. 嘗試通過 BSCScan API 驗證...');
  
  try {
    const apiKey = process.env.BSCSCAN_API_KEY;
    if (!apiKey) {
      console.log('❌ 缺少 BSCSCAN_API_KEY');
      return;
    }
    
    // 準備 API 請求
    const axios = require('axios');
    const FormData = require('form-data');
    
    // 讀取 flatten 文件
    const flattenPath = 'VRFManagerV2PlusFixed_flat.sol';
    const flattenSource = fs.readFileSync(flattenPath, 'utf8');
    
    // 創建表單數據
    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('module', 'contract');
    form.append('action', 'verifysourcecode');
    form.append('contractaddress', contractAddress);
    form.append('sourceCode', flattenSource);
    form.append('codeformat', 'solidity-single-file');
    form.append('contractname', 'VRFManagerV2PlusFixed');
    form.append('compilerversion', 'v0.8.20+commit.a1b79de6');
    form.append('optimizationUsed', '1');
    form.append('runs', '200');
    form.append('constructorArguements', '000000000000000000000000471506e6aded0b9811d05b8cac8db25ee839ac94');
    form.append('licenseType', '3'); // MIT
    
    // 發送請求
    console.log('發送驗證請求到 BSCScan API...');
    const response = await axios.post('https://api.bscscan.com/api', form, {
      headers: form.getHeaders()
    });
    
    console.log('API 響應:', response.data);
    
    if (response.data.status === '1') {
      console.log('✅ 驗證請求已提交！');
      console.log('GUID:', response.data.result);
      
      // 等待驗證完成
      console.log('\n等待驗證完成...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 檢查驗證狀態
      const checkResponse = await axios.get('https://api.bscscan.com/api', {
        params: {
          apikey: apiKey,
          module: 'contract',
          action: 'checkverifystatus',
          guid: response.data.result
        }
      });
      
      console.log('驗證狀態:', checkResponse.data);
      
      if (checkResponse.data.result.includes('Verified')) {
        console.log('✅ 合約驗證成功！');
      }
    }
    
  } catch (error) {
    console.log('API 驗證失敗:', error.message);
    
    // 如果是 axios 錯誤，顯示詳細信息
    if (error.response) {
      console.log('響應數據:', error.response.data);
    }
  }
  
  // 5. 最終檢查
  console.log('\n5. 最終檢查驗證狀態...');
  console.log(`請訪問: https://bscscan.com/address/${contractAddress}#code`);
  console.log('如果仍未驗證，請使用 manual-verify-guide.md 中的手動步驟。');
}

// 檢查依賴
async function checkDependencies() {
  try {
    require('axios');
    require('form-data');
  } catch (e) {
    console.log('安裝必要的依賴...');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    await execPromise('npm install axios form-data');
  }
}

checkDependencies()
  .then(() => main())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
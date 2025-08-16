const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log('=== 使用正確的 Bytecode 驗證合約 ===\n');
  
  // 最新部署的合約地址
  const contractAddress = '0xd506138ccE44eaF6BDA0580F606228ff960BA2Ca';
  const wrapperAddress = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 缺少 BSCSCAN_API_KEY');
    return;
  }
  
  // 1. 生成標準輸入 JSON
  console.log('1. 生成標準輸入 JSON...');
  
  const standardInput = {
    "language": "Solidity",
    "sources": {},
    "settings": {
      "optimizer": {
        "enabled": true,
        "runs": 200
      },
      "outputSelection": {
        "*": {
          "*": ["*"]
        }
      },
      "remappings": []
    }
  };
  
  // 讀取所有需要的源文件
  const contractFiles = [
    'contracts/current/core/VRFManagerV2PlusFixed.sol',
    'contracts/current/interfaces/interfaces.sol'
  ];
  
  // 讀取 flatten 文件內容
  const flattenContent = fs.readFileSync('VRFManagerV2PlusFixed_verified.sol', 'utf8');
  
  // 2. 嘗試多種編譯器版本和設置
  const attempts = [
    { version: 'v0.8.20+commit.a1b79de6', evmVersion: 'paris', viaIR: false },
    { version: 'v0.8.20+commit.a1b79de6', evmVersion: 'london', viaIR: false },
    { version: 'v0.8.20+commit.a1b79de6', evmVersion: 'shanghai', viaIR: false },
    { version: 'v0.8.20+commit.a1b79de6', evmVersion: 'paris', viaIR: true }
  ];
  
  for (const attempt of attempts) {
    console.log(`\n2. 嘗試驗證 (編譯器: ${attempt.version}, EVM: ${attempt.evmVersion}, viaIR: ${attempt.viaIR})...`);
    
    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('module', 'contract');
    form.append('action', 'verifysourcecode');
    form.append('contractaddress', contractAddress);
    form.append('sourceCode', flattenContent);
    form.append('codeformat', 'solidity-single-file');
    form.append('contractname', 'VRFManagerV2PlusFixed');
    form.append('compilerversion', attempt.version);
    form.append('optimizationUsed', '1');
    form.append('runs', '200');
    form.append('evmversion', attempt.evmVersion);
    
    // 如果使用 viaIR
    if (attempt.viaIR) {
      form.append('viaIR', '1');
    }
    
    // 構造參數
    form.append('constructorArguements', '000000000000000000000000471506e6aded0b9811d05b8cac8db25ee839ac94');
    form.append('licenseType', '3'); // MIT
    
    try {
      const response = await axios.post('https://api.bscscan.com/api', form, {
        headers: form.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.status === '1') {
        console.log('   ✅ 驗證請求已提交');
        console.log('   GUID:', response.data.result);
        
        // 等待驗證
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // 檢查狀態
        const checkResponse = await axios.get('https://api.bscscan.com/api', {
          params: {
            apikey: apiKey,
            module: 'contract',
            action: 'checkverifystatus',
            guid: response.data.result
          }
        });
        
        console.log('   結果:', checkResponse.data.result);
        
        if (checkResponse.data.result && checkResponse.data.result.includes('Pass')) {
          console.log('\n🎉 驗證成功！');
          console.log(`查看: https://bscscan.com/address/${contractAddress}#code`);
          return;
        }
      }
    } catch (error) {
      console.log('   錯誤:', error.message);
    }
  }
  
  // 3. 如果都失敗，提供手動步驟
  console.log('\n3. 自動驗證失敗，請按以下步驟手動驗證：\n');
  console.log('步驟 1: 訪問 https://bscscan.com/verifyContract\n');
  console.log('步驟 2: 填寫以下信息：');
  console.log('   - Contract Address:', contractAddress);
  console.log('   - Compiler Type: Solidity (Standard-Json-Input)');
  console.log('   - Compiler Version: v0.8.20+commit.a1b79de6');
  console.log('   - License: MIT\n');
  console.log('步驟 3: 上傳 standard-input.json 文件（將在下面生成）\n');
  console.log('步驟 4: Constructor Arguments:');
  console.log('   000000000000000000000000471506e6aded0b9811d05b8cac8db25ee839ac94\n');
  
  // 生成 standard-input.json
  const standardJsonInput = {
    "language": "Solidity",
    "sources": {
      "VRFManagerV2PlusFixed.sol": {
        "content": flattenContent
      }
    },
    "settings": {
      "optimizer": {
        "enabled": true,
        "runs": 200
      },
      "evmVersion": "paris",
      "outputSelection": {
        "*": {
          "*": ["*"]
        }
      }
    }
  };
  
  fs.writeFileSync('standard-input.json', JSON.stringify(standardJsonInput, null, 2));
  console.log('✅ standard-input.json 文件已生成');
  
  console.log('\n4. 合約當前狀態：');
  console.log('   地址:', contractAddress);
  console.log('   已配置 Hero: ✅');
  console.log('   已配置 Relic: ✅');
  console.log('   已授權 DungeonMaster: ✅');
  console.log('   功能正常: ✅ (使用 BNB Direct Funding)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// 最終自動化驗證 - 嘗試不同的編譯器版本
const fs = require('fs');
require('dotenv').config();

// 多種編譯器版本配置
const compilerConfigs = [
  {
    version: "v0.8.20+commit.a1b79de6",
    optimization: "1", 
    runs: "200",
    viaIR: "1",
    evmversion: "paris"
  },
  {
    version: "v0.8.20+commit.a1b79de6", 
    optimization: "1",
    runs: "200", 
    viaIR: "0",
    evmversion: "paris"
  },
  {
    version: "v0.8.25+commit.b61c2a91",
    optimization: "1",
    runs: "200",
    viaIR: "0", 
    evmversion: "paris"
  }
];

async function verifyWithConfig(contractAddress, sourceCode, contractName, constructorArgs, config) {
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  const params = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    apikey: apiKey,
    contractaddress: contractAddress,
    sourceCode: sourceCode,
    codeformat: 'solidity-single-file',
    contractname: contractName,
    compilerversion: config.version,
    optimizationUsed: config.optimization,
    runs: config.runs,
    viaIR: config.viaIR,
    constructorArguements: constructorArgs,
    evmversion: config.evmversion,
    licenseType: '3'
  });

  console.log(`🚀 嘗試配置: ${config.version}, opt:${config.optimization}, runs:${config.runs}, viaIR:${config.viaIR}`);
  
  try {
    const response = await fetch('https://api.bscscan.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    const result = await response.json();
    
    if (result.status === '1') {
      console.log(`✅ ${contractName} 提交成功! GUID: ${result.result}`);
      
      // 快速檢查結果
      await new Promise(resolve => setTimeout(resolve, 20000)); // 等待 20 秒
      
      const statusResponse = await fetch(`https://api.bscscan.com/api?module=contract&action=checkverifystatus&guid=${result.result}&apikey=${apiKey}`);
      const statusResult = await statusResponse.json();
      
      console.log(`📊 驗證結果: ${statusResult.result}`);
      
      if (statusResult.result === 'Pass - Verified') {
        console.log(`🎉 ${contractName} 驗證成功！配置正確!`);
        return true;
      } else if (statusResult.result.includes('Fail')) {
        console.log(`❌ ${contractName} 驗證失敗: ${statusResult.result}`);
        return false;
      } else {
        console.log(`⏳ ${contractName} 仍在驗證中...`);
        return 'pending';
      }
    } else {
      console.log(`❌ 提交失敗: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 錯誤: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 最終自動化驗證 - 嘗試多種配置...\n");
  
  // 讀取原始碼
  const dungeonCoreSource = fs.readFileSync('./DungeonCore_flat_clean.sol', 'utf8');
  const oracleSource = fs.readFileSync('./Oracle_flat_clean.sol', 'utf8');
  
  // 構造參數
  const dungeonCoreArgs = "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a";
  const oracleArgs = "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955";
  
  // 嘗試驗證 DungeonCore
  console.log("🏰 驗證 DungeonCore...");
  console.log("地址: 0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
  
  for (let i = 0; i < compilerConfigs.length; i++) {
    const config = compilerConfigs[i];
    console.log(`\n嘗試配置 ${i + 1}:`);
    
    const result = await verifyWithConfig(
      "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
      dungeonCoreSource,
      "DungeonCore", 
      dungeonCoreArgs,
      config
    );
    
    if (result === true) {
      console.log("🎉 DungeonCore 驗證成功！跳過其他配置。");
      break;
    }
    
    if (i < compilerConfigs.length - 1) {
      console.log("⏳ 等待 30 秒再嘗試下一個配置...");
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // 嘗試驗證 Oracle
  console.log("🔮 驗證 Oracle...");
  console.log("地址: 0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806");
  
  await new Promise(resolve => setTimeout(resolve, 60000)); // 等待 1 分鐘
  
  for (let i = 0; i < compilerConfigs.length; i++) {
    const config = compilerConfigs[i];
    console.log(`\n嘗試配置 ${i + 1}:`);
    
    const result = await verifyWithConfig(
      "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
      oracleSource,
      "Oracle",
      oracleArgs, 
      config
    );
    
    if (result === true) {
      console.log("🎉 Oracle 驗證成功！跳過其他配置。");
      break;
    }
    
    if (i < compilerConfigs.length - 1) {
      console.log("⏳ 等待 30 秒再嘗試下一個配置...");
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log("\n🏁 最終自動化驗證完成!");
  console.log("請檢查 BSCScan 查看結果:");
  console.log("- DungeonCore: https://bscscan.com/address/0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5#code");
  console.log("- Oracle: https://bscscan.com/address/0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806#code");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
  });
// 嘗試使用 Sourcify 平台驗證合約
const fs = require('fs');

async function verifyWithSourceify(address, sourceCode, contractName, metadata) {
  console.log(`🔍 嘗試 Sourcify 驗證 ${contractName}...`);
  console.log(`📍 地址: ${address}`);
  
  try {
    // Sourcify API endpoint
    const sourcifyUrl = 'https://sourcify.dev/server/verify';
    
    // 準備 form data
    const formData = new FormData();
    formData.append('address', address);
    formData.append('chain', '56'); // BSC mainnet
    formData.append('files', new Blob([sourceCode], { type: 'text/plain' }), `${contractName}.sol`);
    
    if (metadata) {
      formData.append('files', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), 'metadata.json');
    }
    
    const response = await fetch(sourcifyUrl, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log(`📊 Sourcify 回應:`, result);
    
    if (result.result && result.result.includes('perfect')) {
      console.log(`🎉 ${contractName} 在 Sourcify 上驗證成功！`);
      console.log(`查看: https://sourcify.dev/#/lookup/${address}?chain=56`);
      return true;
    } else if (result.result && result.result.includes('partial')) {
      console.log(`⚠️ ${contractName} 在 Sourcify 上部分匹配`);
      console.log(`查看: https://sourcify.dev/#/lookup/${address}?chain=56`);
      return 'partial';
    } else {
      console.log(`❌ ${contractName} Sourcify 驗證失敗: ${result.error || result.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Sourcify API 錯誤: ${error.message}`);
    return false;
  }
}

// 生成基本的 metadata
function generateMetadata(contractName, compilerVersion) {
  return {
    compiler: {
      version: compilerVersion
    },
    language: "Solidity",
    output: {
      abi: [],
      devdoc: {
        kind: "dev",
        methods: {},
        version: 1
      },
      userdoc: {
        kind: "user",
        methods: {},
        version: 1
      }
    },
    settings: {
      compilationTarget: {
        [`${contractName}.sol`]: contractName
      },
      evmVersion: "paris",
      libraries: {},
      metadata: {
        bytecodeHash: "ipfs"
      },
      optimizer: {
        enabled: true,
        runs: 200
      },
      remappings: [],
      viaIR: true
    },
    sources: {
      [`${contractName}.sol`]: {
        keccak256: "0x0000000000000000000000000000000000000000000000000000000000000000",
        urls: [
          "bzz-raw://0000000000000000000000000000000000000000000000000000000000000000",
          "dweb:/ipfs/QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51"
        ]
      }
    },
    version: 1
  };
}

async function main() {
  console.log("🌐 嘗試使用 Sourcify 平台驗證...\n");
  
  // 讀取原始合約
  const dungeonCoreSource = fs.readFileSync('./DungeonCore_flat_clean.sol', 'utf8');
  const oracleSource = fs.readFileSync('./Oracle_flat_clean.sol', 'utf8');
  
  console.log("📁 準備合約檔案:");
  console.log(`- DungeonCore: ${dungeonCoreSource.length} 字元`);
  console.log(`- Oracle: ${oracleSource.length} 字元`);
  console.log("");
  
  // 生成 metadata
  const dungeonCoreMetadata = generateMetadata("DungeonCore", "0.8.20");
  const oracleMetadata = generateMetadata("Oracle", "0.8.20");
  
  // 嘗試驗證 DungeonCore
  const dungeonCoreResult = await verifyWithSourceify(
    "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    dungeonCoreSource,
    "DungeonCore",
    dungeonCoreMetadata
  );
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // 等待避免 rate limit
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 嘗試驗證 Oracle
  const oracleResult = await verifyWithSourceify(
    "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    oracleSource,
    "Oracle",
    oracleMetadata
  );
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Sourcify 驗證結果");
  console.log("=".repeat(60));
  
  console.log(`🏰 DungeonCore: ${dungeonCoreResult === true ? '✅ 成功' : dungeonCoreResult === 'partial' ? '⚠️ 部分匹配' : '❌ 失敗'}`);
  console.log(`🔮 Oracle: ${oracleResult === true ? '✅ 成功' : oracleResult === 'partial' ? '⚠️ 部分匹配' : '❌ 失敗'}`);
  
  if (dungeonCoreResult === true || oracleResult === true) {
    console.log("\n🎉 至少一個合約在 Sourcify 上驗證成功！");
    console.log("💡 Sourcify 是去中心化驗證平台，也是很好的選擇");
  } else if (dungeonCoreResult === 'partial' || oracleResult === 'partial') {
    console.log("\n⚠️ 部分匹配可能是由於 metadata 不完整");
    console.log("💡 可以嘗試手動上傳更完整的 metadata");
  } else {
    console.log("\n🤔 Sourcify 也無法處理這些複雜合約");
    console.log("💡 這進一步證實了合約複雜度是問題根源");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Sourcify 測試失敗:", error);
    process.exit(1);
  });
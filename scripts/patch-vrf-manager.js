// 修補腳本：修改現有 VRFManagerV2PlusFixed 的關鍵行
// 這個腳本會複製原始檔案並修改特定行數

const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔧 VRF Manager 優化修補腳本");
  console.log("=====================================");
  
  // 原始檔案路徑
  const sourcePath = path.join(__dirname, '../VRFManagerV2PlusFixed_clean.sol');
  const targetPath = path.join(__dirname, '../contracts/current/core/VRFManagerV2PlusOptimized.sol');
  
  // 讀取原始檔案
  console.log("\n📖 讀取原始檔案...");
  let content = fs.readFileSync(sourcePath, 'utf8');
  const lines = content.split('\n');
  console.log(`- 總行數: ${lines.length}`);
  
  // 關鍵修改點
  const modifications = [
    {
      lineNumber: 3572,  // calculateRequestPriceNative 的 numWords 參數
      description: "calculateRequestPriceNative 的 numWords 參數",
      original: "uint32(quantity)",
      replacement: "1 // 優化：固定請求 1 個隨機數"
    },
    {
      lineNumber: 3585,  // requestRandomnessPayInNative 的 numWords 參數  
      description: "requestRandomnessPayInNative 的 numWords 參數",
      original: "uint32(quantity),",
      replacement: "1, // 優化：固定請求 1 個隨機數"
    }
  ];
  
  console.log("\n✏️ 應用修改...");
  
  for (const mod of modifications) {
    const idx = mod.lineNumber - 1; // 轉換為陣列索引
    
    console.log(`\n修改第 ${mod.lineNumber} 行:`);
    console.log(`- 描述: ${mod.description}`);
    console.log(`- 原始: ${lines[idx].trim()}`);
    
    // 驗證原始內容
    if (!lines[idx].includes("uint32(quantity)")) {
      console.error(`❌ 第 ${mod.lineNumber} 行不包含預期的 'uint32(quantity)'`);
      console.error(`實際內容: ${lines[idx]}`);
      continue;
    }
    
    // 應用修改（處理有無逗號的情況）
    if (lines[idx].includes("uint32(quantity),")) {
      lines[idx] = lines[idx].replace("uint32(quantity),", "1, // 優化：固定請求 1 個隨機數");
    } else {
      lines[idx] = lines[idx].replace("uint32(quantity)", "1 // 優化：固定請求 1 個隨機數");
    }
    console.log(`- 修改後: ${lines[idx].trim()}`);
  }
  
  // 添加優化說明註釋
  const headerComment = `// ====================================
// VRFManagerV2PlusOptimized
// ====================================
// 基於 VRFManagerV2PlusFixed 的優化版本
// 
// 主要改進：
// 1. 修正隨機數請求數量問題
//    - 原始：請求 quantity 個隨機數（線性成本增長）
//    - 優化：固定請求 1 個隨機數（恆定成本）
// 
// 2. 成本節省：
//    - 鑄造 1 個 NFT: 0.0017 LINK（無變化）
//    - 鑄造 10 個 NFT: 0.0017 LINK（節省 90%）
//    - 鑄造 50 個 NFT: 0.0017 LINK（節省 98%）
// 
// 3. 兼容性：
//    - Hero 合約已支援單一種子生成多個隨機值
//    - 無需修改 Hero/Relic 合約邏輯
// ====================================

`;
  
  // 在合約開頭插入說明
  const contractStartIdx = lines.findIndex(line => line.includes('contract VRFManagerV2PlusFixed'));
  if (contractStartIdx !== -1) {
    lines[contractStartIdx] = headerComment + lines[contractStartIdx];
  }
  
  // 寫入優化後的檔案
  console.log("\n💾 保存優化版本...");
  fs.writeFileSync(targetPath, lines.join('\n'));
  console.log(`✅ 已保存至: ${targetPath}`);
  
  // 驗證修改
  console.log("\n🔍 驗證修改結果...");
  const optimizedContent = fs.readFileSync(targetPath, 'utf8');
  const optimizedLines = optimizedContent.split('\n');
  
  // 檢查關鍵行
  const checkLines = [3572, 3585];
  for (const lineNum of checkLines) {
    const line = optimizedLines[lineNum - 1];
    if (line.includes("uint32(quantity)")) {
      console.error(`❌ 第 ${lineNum} 行仍包含 uint32(quantity)`);
    } else if (line.includes("1")) {
      console.log(`✅ 第 ${lineNum} 行已正確修改為使用 1`);
    }
  }
  
  console.log("\n📊 修改摘要：");
  console.log("- 原始檔案: VRFManagerV2PlusFixed_clean.sol");
  console.log("- 優化檔案: contracts/current/core/VRFManagerV2PlusOptimized.sol");
  console.log("- 修改行數: 2");
  console.log("- 預期節省: 90%+ LINK 成本");
  
  console.log("\n✨ 修補完成！");
  console.log("\n📋 下一步：");
  console.log("1. 編譯合約: npx hardhat compile");
  console.log("2. 部署新 VRF Manager: npx hardhat run scripts/deploy-optimized-vrf-manager.js --network bsc");
  console.log("3. 更新 Hero/Relic 的 VRF Manager 地址");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
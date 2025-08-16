#!/usr/bin/env node

/**
 * 修復 Party 合約的 DungeonCore 連接
 * 
 * 問題：Party.dungeonCoreContract() getter 在未初始化時會 revert
 * 解決：直接調用 setDungeonCore 設置正確的地址
 * 
 * 使用方式：
 * npx hardhat run scripts/fix-party-dungeoncore.js --network bsc
 */

const hre = require("hardhat");
const { ethers } = require("ethers");

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// V25 合約地址
const CONTRACTS = {
  PARTY: '0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69',
  DUNGEONCORE: '0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a'
};

async function main() {
  console.log(`${colors.bright}
==================================================
🔧 修復 Party 合約的 DungeonCore 連接
==================================================
${colors.reset}`);

  // 創建 provider 和 signer
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/"
  );
  
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`${colors.blue}[INFO]${colors.reset} 使用錢包: ${deployer.address}`);

  // 獲取 Party 合約實例
  const PartyArtifact = await hre.artifacts.readArtifact("PartyV3");
  const party = new ethers.Contract(
    CONTRACTS.PARTY,
    PartyArtifact.abi,
    deployer
  );

  console.log(`${colors.blue}[INFO]${colors.reset} Party 合約: ${CONTRACTS.PARTY}`);
  console.log(`${colors.blue}[INFO]${colors.reset} DungeonCore 地址: ${CONTRACTS.DUNGEONCORE}`);

  // 嘗試讀取當前的 dungeonCoreContract（可能會失敗）
  console.log(`\n${colors.yellow}[檢查]${colors.reset} 嘗試讀取當前 dungeonCoreContract...`);
  try {
    const currentDungeonCore = await party.dungeonCoreContract();
    console.log(`${colors.green}[成功]${colors.reset} 當前值: ${currentDungeonCore}`);
    
    if (currentDungeonCore.toLowerCase() === CONTRACTS.DUNGEONCORE.toLowerCase()) {
      console.log(`${colors.green}✅ DungeonCore 已正確設置，無需修復${colors.reset}`);
      return;
    } else {
      console.log(`${colors.yellow}⚠️ DungeonCore 地址不正確，需要更新${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}[預期]${colors.reset} getter 函數 revert（未初始化），需要設置`);
  }

  // 設置 DungeonCore
  console.log(`\n${colors.blue}[執行]${colors.reset} 調用 party.setDungeonCore...`);
  try {
    const tx = await party.setDungeonCore(CONTRACTS.DUNGEONCORE, {
      gasLimit: 100000,
      gasPrice: ethers.parseUnits("3", "gwei")
    });
    
    console.log(`${colors.blue}[INFO]${colors.reset} 交易 hash: ${tx.hash}`);
    console.log(`${colors.blue}[INFO]${colors.reset} 等待交易確認...`);
    
    const receipt = await tx.wait();
    console.log(`${colors.green}✅ 交易已確認${colors.reset}`);
    console.log(`   區塊: ${receipt.blockNumber}`);
    console.log(`   Gas 使用: ${receipt.gasUsed.toString()}`);
    
  } catch (error) {
    console.log(`${colors.red}❌ 設置失敗: ${error.message}${colors.reset}`);
    throw error;
  }

  // 驗證設置
  console.log(`\n${colors.blue}[驗證]${colors.reset} 檢查設置是否成功...`);
  try {
    const newDungeonCore = await party.dungeonCoreContract();
    console.log(`${colors.green}✅ 驗證成功！${colors.reset}`);
    console.log(`   Party.dungeonCoreContract = ${newDungeonCore}`);
    
    if (newDungeonCore.toLowerCase() !== CONTRACTS.DUNGEONCORE.toLowerCase()) {
      console.log(`${colors.red}❌ 警告：設置後的地址不匹配！${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ 驗證時 getter 仍然 revert${colors.reset}`);
    console.log(`   這可能表示合約實現有問題，建議手動檢查`);
    console.log(`   錯誤: ${error.message}`);
  }

  // 額外檢查：Party 的其他依賴
  console.log(`\n${colors.blue}[額外檢查]${colors.reset} 檢查 Party 的其他設置...`);
  try {
    const heroContract = await party.heroContract();
    const relicContract = await party.relicContract();
    console.log(`   Hero 合約: ${heroContract}`);
    console.log(`   Relic 合約: ${relicContract}`);
    
    if (heroContract === '0x0000000000000000000000000000000000000000') {
      console.log(`${colors.yellow}⚠️ Hero 合約未設置${colors.reset}`);
    }
    if (relicContract === '0x0000000000000000000000000000000000000000') {
      console.log(`${colors.yellow}⚠️ Relic 合約未設置${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ 無法檢查其他依賴: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.green}
==================================================
✅ 修復腳本執行完成
==================================================
${colors.reset}`);

  // 建議後續步驟
  console.log(`
${colors.cyan}建議後續步驟：${colors.reset}
1. 在 BSCScan 上驗證交易：https://bscscan.com/address/${CONTRACTS.PARTY}
2. 在前端測試 Party 相關功能
3. 如果 getter 仍然失敗，可能需要檢查合約實現
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
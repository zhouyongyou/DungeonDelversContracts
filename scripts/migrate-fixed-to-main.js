const fs = require('fs');
const path = require('path');

/**
 * 將 fixed 版本的合約遷移到主路徑
 * 備份原文件，然後覆蓋
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║         遷移 Fixed 版本合約到主路徑                                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  const fixedPath = './contracts/current/fixed';
  const mainPath = './contracts/current';
  const backupPath = './contracts/backup-' + Date.now();

  // 需要遷移的合約列表
  const contractsToMigrate = [
    'DungeonStorage.sol',
    'DungeonMaster.sol', 
    'Hero.sol',
    'Relic.sol',
    'Party.sol',
    'AltarOfAscension.sol',
    'PlayerVault.sol',
    'PlayerProfile.sol',
    'VIPStaking.sol'
  ];

  console.log(`\n📋 準備遷移的合約 (${contractsToMigrate.length} 個):`);
  contractsToMigrate.forEach((contract, index) => {
    console.log(`  ${index + 1}. ${contract}`);
  });

  // 1. 創建備份目錄
  console.log(`\n📦 創建備份目錄: ${backupPath}`);
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  let migratedCount = 0;
  let backupCount = 0;

  for (const contractFile of contractsToMigrate) {
    const fixedFilePath = path.join(fixedPath, contractFile);
    const mainFilePath = path.join(mainPath, contractFile);
    const backupFilePath = path.join(backupPath, contractFile);

    console.log(`\n${colors.yellow}🔄 處理 ${contractFile}...${colors.reset}`);

    try {
      // 2. 檢查 fixed 版本是否存在
      if (!fs.existsSync(fixedFilePath)) {
        console.log(`  ${colors.red}❌ Fixed 版本不存在: ${fixedFilePath}${colors.reset}`);
        continue;
      }

      // 3. 備份原文件（如果存在）
      if (fs.existsSync(mainFilePath)) {
        console.log(`  📤 備份原文件到: ${backupFilePath}`);
        fs.copyFileSync(mainFilePath, backupFilePath);
        backupCount++;
      }

      // 4. 複製 fixed 版本到主路徑
      console.log(`  📥 複製 fixed 版本到主路徑`);
      fs.copyFileSync(fixedFilePath, mainFilePath);
      
      console.log(`  ${colors.green}✅ ${contractFile} 遷移成功${colors.reset}`);
      migratedCount++;

    } catch (error) {
      console.log(`  ${colors.red}❌ ${contractFile} 遷移失敗: ${error.message}${colors.reset}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}遷移結果總結${colors.reset}`);
  console.log('='.repeat(70));

  console.log(`\n📊 統計結果:`);
  console.log(`  ✅ 成功遷移: ${migratedCount} 個合約`);
  console.log(`  📦 備份文件: ${backupCount} 個`);
  console.log(`  📂 備份目錄: ${backupPath}`);

  if (migratedCount === contractsToMigrate.length) {
    console.log(`\n${colors.green}🎉 所有合約遷移成功！${colors.reset}`);
    
    console.log(`\n📝 接下來需要做的:`);
    console.log(`  1. 重新編譯合約: npx hardhat compile`);
    console.log(`  2. 更新腳本中的合約路徑引用`);
    console.log(`  3. 可以刪除 contracts/current/fixed/ 目錄`);
    console.log(`  4. 執行配置同步: node scripts/ultimate-config-system.js sync`);
    
  } else {
    console.log(`\n${colors.yellow}⚠️ 有部分合約遷移失敗，請檢查錯誤信息${colors.reset}`);
  }

  console.log(`\n💡 如需還原，請從 ${backupPath} 目錄還原文件`);
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 遷移過程完成！${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 遷移過程失敗:${colors.reset}`, error);
    process.exit(1);
  });
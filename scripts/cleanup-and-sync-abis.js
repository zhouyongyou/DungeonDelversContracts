#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 開始清理和重新同步 ABI 文件...\n');

// 項目路徑
const CONTRACTS_ROOT = '/Users/sotadic/Documents/DungeonDelversContracts';
const FRONTEND_ROOT = '/Users/sotadic/Documents/GitHub/SoulboundSaga';
const SUBGRAPH_ROOT = '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers';

const CONTRACTS_ABI_DIR = path.join(CONTRACTS_ROOT, 'abis');
const FRONTEND_ABI_DIR = path.join(FRONTEND_ROOT, 'src/abis');
const SUBGRAPH_ABI_DIR = path.join(SUBGRAPH_ROOT, 'abis');

// V25 標準 ABI 列表 (只保留真正需要的)
const REQUIRED_ABIS = [
  'Hero.json',
  'Relic.json',
  'Party.json',
  'DungeonCore.json',
  'DungeonMasterV8.json',  // V25 使用 V8 版本
  'DungeonStorage.json',
  'Oracle.json',
  'PlayerVault.json',
  'PlayerProfile.json',
  'VIPStaking.json',
  'AltarOfAscension.json',
  'VRFManagerV2PlusFixed.json'  // V25 使用 Fixed 版本
];

// 需要清理的過期文件模式
const CLEANUP_PATTERNS = [
  /^DungeonMaster\.json$/,       // 舊版本，應該用 V8
  /^VRFManager\.json$/,          // 舊版本
  /^VRFManagerV2Plus\.json$/,    // 應該用 Fixed 版本
  /^Party\.json$/,               // 舊版本，應該用 V3
  /^AltarOfAscension\.json$/, // 可能是舊版本
  /^VRFConsumerV2Plus\.json$/,   // 可能不需要
  /^ERC20\.json$/,               // 通用合約，可能不需要
  /^ERC721\.json$/,              // 通用合約，可能不需要
  /^StandardERC20\.json$/,       // 通用合約，可能不需要
  /^SoulShardToken\.json$/       // 可能已包含在其他合約中
];

function createBackup(dir, backupSuffix) {
  const backupDir = path.join(dir, `backup-${backupSuffix}`);
  if (fs.existsSync(backupDir)) {
    console.log(`⚠️  備份目錄已存在: ${backupDir}`);
    return false;
  }
  
  fs.mkdirSync(backupDir, { recursive: true });
  
  // 複製所有 JSON 文件到備份目錄
  const files = fs.readdirSync(dir).filter(file => 
    file.endsWith('.json') && !file.includes('backup')
  );
  
  files.forEach(file => {
    fs.copyFileSync(
      path.join(dir, file),
      path.join(backupDir, file)
    );
  });
  
  console.log(`✅ 創建備份: ${backupDir}`);
  return true;
}

function cleanupDirectory(dir, dirName) {
  console.log(`\n🧹 清理 ${dirName}...`);
  
  if (!fs.existsSync(dir)) {
    console.log(`❌ 目錄不存在: ${dir}`);
    return;
  }
  
  // 創建備份
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  createBackup(dir, `cleanup-${timestamp}`);
  
  // 清理重複的子目錄 (如 Hero/Hero.json)
  const subdirs = fs.readdirSync(dir).filter(item => {
    const fullPath = path.join(dir, item);
    return fs.statSync(fullPath).isDirectory() && !item.includes('backup');
  });
  
  subdirs.forEach(subdir => {
    const subdirPath = path.join(dir, subdir);
    console.log(`🗂️  刪除重複子目錄: ${subdir}/`);
    fs.rmSync(subdirPath, { recursive: true, force: true });
  });
  
  // 清理過期文件
  const files = fs.readdirSync(dir).filter(file => 
    file.endsWith('.json') && !file.includes('backup')
  );
  
  files.forEach(file => {
    const shouldCleanup = CLEANUP_PATTERNS.some(pattern => pattern.test(file));
    if (shouldCleanup) {
      console.log(`🗑️  刪除過期文件: ${file}`);
      fs.unlinkSync(path.join(dir, file));
    }
  });
  
  console.log(`✅ ${dirName} 清理完成`);
}

function syncABIs() {
  console.log(`\n📋 從合約項目同步 ABI 文件...`);
  
  // 檢查合約源頭的 ABI 是否齊全
  const missingABIs = [];
  REQUIRED_ABIS.forEach(abiFile => {
    const sourcePath = path.join(CONTRACTS_ABI_DIR, abiFile);
    if (!fs.existsSync(sourcePath)) {
      missingABIs.push(abiFile);
    }
  });
  
  if (missingABIs.length > 0) {
    console.log(`❌ 合約項目缺少以下 ABI 文件:`);
    missingABIs.forEach(file => console.log(`   - ${file}`));
    console.log(`\n請先在合約項目中生成這些 ABI 文件`);
    return false;
  }
  
  // 同步到前端
  console.log(`\n📄 同步到前端...`);
  REQUIRED_ABIS.forEach(abiFile => {
    const sourcePath = path.join(CONTRACTS_ABI_DIR, abiFile);
    const targetPath = path.join(FRONTEND_ABI_DIR, abiFile);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ ${abiFile}`);
    } else {
      console.log(`  ❌ ${abiFile} (源文件不存在)`);
    }
  });
  
  // 同步到子圖
  console.log(`\n📊 同步到子圖...`);
  REQUIRED_ABIS.forEach(abiFile => {
    const sourcePath = path.join(CONTRACTS_ABI_DIR, abiFile);
    const targetPath = path.join(SUBGRAPH_ABI_DIR, abiFile);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ ${abiFile}`);
    } else {
      console.log(`  ❌ ${abiFile} (源文件不存在)`);
    }
  });
  
  return true;
}

function verifySync() {
  console.log(`\n🔍 驗證同步結果...`);
  
  let allSynced = true;
  
  REQUIRED_ABIS.forEach(abiFile => {
    const contractsPath = path.join(CONTRACTS_ABI_DIR, abiFile);
    const frontendPath = path.join(FRONTEND_ABI_DIR, abiFile);
    const subgraphPath = path.join(SUBGRAPH_ABI_DIR, abiFile);
    
    if (!fs.existsSync(contractsPath)) {
      console.log(`❌ 合約項目缺少: ${abiFile}`);
      allSynced = false;
      return;
    }
    
    const contractsContent = fs.readFileSync(contractsPath, 'utf8');
    
    // 檢查前端
    if (fs.existsSync(frontendPath)) {
      const frontendContent = fs.readFileSync(frontendPath, 'utf8');
      if (contractsContent === frontendContent) {
        console.log(`✅ ${abiFile} - 前端同步`);
      } else {
        console.log(`❌ ${abiFile} - 前端內容不匹配`);
        allSynced = false;
      }
    } else {
      console.log(`❌ ${abiFile} - 前端文件缺失`);
      allSynced = false;
    }
    
    // 檢查子圖
    if (fs.existsSync(subgraphPath)) {
      const subgraphContent = fs.readFileSync(subgraphPath, 'utf8');
      if (contractsContent === subgraphContent) {
        console.log(`✅ ${abiFile} - 子圖同步`);
      } else {
        console.log(`❌ ${abiFile} - 子圖內容不匹配`);
        allSynced = false;
      }
    } else {
      console.log(`❌ ${abiFile} - 子圖文件缺失`);
      allSynced = false;
    }
  });
  
  return allSynced;
}

// 主流程
async function main() {
  try {
    // 1. 清理各項目的 ABI 目錄
    cleanupDirectory(FRONTEND_ABI_DIR, '前端');
    cleanupDirectory(SUBGRAPH_ABI_DIR, '子圖');
    
    // 2. 重新同步 ABI
    const syncSuccess = syncABIs();
    
    if (!syncSuccess) {
      console.log('\n❌ ABI 同步失敗，請檢查合約項目');
      process.exit(1);
    }
    
    // 3. 驗證同步結果
    const verifySuccess = verifySync();
    
    if (verifySuccess) {
      console.log('\n🎉 ABI 清理和同步完成！');
      console.log('\n📝 下一步：');
      console.log('1. 檢查子圖的 subgraph.yaml 是否使用正確的 ABI 文件名');
      console.log('2. 重新構建子圖: npm run codegen && npm run build');
      console.log('3. 檢查前端是否正確導入 ABI 文件');
      console.log('4. 測試各項目功能');
    } else {
      console.log('\n❌ 同步驗證失敗，請檢查以上錯誤');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 執行過程中發生錯誤:', error.message);
    process.exit(1);
  }
}

// 執行腳本
if (require.main === module) {
  main();
}

module.exports = { main, REQUIRED_ABIS, CLEANUP_PATTERNS };
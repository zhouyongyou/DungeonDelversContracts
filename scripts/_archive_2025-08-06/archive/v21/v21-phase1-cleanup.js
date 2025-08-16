#!/usr/bin/env node

// V21 Phase 1: 清理與整理腳本

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// 需要保留的核心文件
const KEEP_FILES = [
  'contracts/defi/Oracle_Final.sol',
  'contracts/defi/PlayerVault.sol',
  // 添加其他需要保留的文件
];

// 需要歸檔的 Oracle 文件模式
const ARCHIVE_PATTERNS = [
  /Oracle.*\.sol$/,
  /Oracle.*_flat.*\.sol$/,
  /Oracle.*_VerificationFix.*\.sol$/,
  /Oracle.*_Clean.*\.sol$/
];

async function analyzeOracleFiles() {
  console.log('🔍 V21 Phase 1: 分析 Oracle 文件...\n');
  
  const allOracleFiles = [];
  const toKeep = [];
  const toArchive = [];
  
  // 遞歸查找所有 Oracle 相關文件
  function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        findFiles(filePath, fileList);
      } else if (file.includes('Oracle') && file.endsWith('.sol')) {
        const relativePath = path.relative(BASE_DIR, filePath);
        fileList.push(relativePath);
      }
    });
    
    return fileList;
  }
  
  // 查找所有 Oracle 文件
  const oracleFiles = findFiles(path.join(BASE_DIR, 'contracts'));
  const archiveFiles = findFiles(path.join(BASE_DIR, 'archive'));
  
  console.log(`📊 找到 ${oracleFiles.length} 個 Oracle 文件在 contracts/`);
  console.log(`📊 找到 ${archiveFiles.length} 個 Oracle 文件在 archive/\n`);
  
  // 分類文件
  oracleFiles.forEach(file => {
    if (file === 'contracts/defi/Oracle_Final.sol') {
      toKeep.push(file);
    } else {
      toArchive.push(file);
    }
  });
  
  console.log('✅ 需要保留的文件:');
  toKeep.forEach(file => console.log(`   - ${file}`));
  
  console.log('\n📦 需要歸檔的文件:');
  toArchive.forEach(file => console.log(`   - ${file}`));
  
  console.log('\n📁 已經在 archive/ 的文件:');
  archiveFiles.forEach(file => console.log(`   - ${file}`));
  
  // 生成清理計劃
  const cleanupPlan = {
    timestamp: new Date().toISOString(),
    analysis: {
      totalOracleFiles: oracleFiles.length + archiveFiles.length,
      inContracts: oracleFiles.length,
      inArchive: archiveFiles.length,
      toKeep: toKeep.length,
      toArchive: toArchive.length
    },
    files: {
      keep: toKeep,
      archive: toArchive,
      alreadyArchived: archiveFiles
    }
  };
  
  // 保存分析結果
  const planPath = path.join(BASE_DIR, 'v21-cleanup-plan.json');
  fs.writeFileSync(planPath, JSON.stringify(cleanupPlan, null, 2));
  console.log(`\n📄 清理計劃已保存到: ${planPath}`);
  
  // 顯示建議的目錄結構
  console.log('\n📋 建議的 V21 目錄結構:');
  console.log(`
contracts/
├── current/              # V20 生產版本
│   ├── defi/
│   │   └── Oracle.sol   # 從 Oracle_Final.sol 重命名
│   ├── nft/
│   ├── core/
│   └── interfaces/
├── next/                # V21 開發版本
│   └── README.md
└── archive/             # 歷史版本
    ├── v19/
    ├── v20-pre/         # V20 之前的所有 Oracle 版本
    └── old_oracles/     # 其他舊版本
`);
  
  console.log('📌 下一步:');
  console.log('1. 執行 node scripts/v21-phase1-execute.js 來執行清理');
  console.log('2. 或手動按照計劃移動文件');
}

// 執行分析
analyzeOracleFiles().catch(console.error);
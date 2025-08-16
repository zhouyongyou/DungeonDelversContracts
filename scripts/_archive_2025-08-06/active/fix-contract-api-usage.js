#!/usr/bin/env node

/**
 * 修復前端 getContract() 與 getContractWithABI() 混用問題
 * 
 * 問題：
 * - getContract() 只返回地址字串
 * - getContractWithABI() 返回 {address, abi} 對象
 * - 混用會導致執行階段錯誤
 * 
 * 解決策略：
 * 1. 分析代碼使用模式
 * 2. 替換為正確的 API
 * 3. 移除硬編碼地址引用
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const FRONTEND_PATH = '/Users/sotadic/Documents/GitHub/DungeonDelvers';

class ContractAPIFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const colorMap = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red
    };
    const color = colorMap[type] || colors.reset;
    console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${timestamp} ${message}`);
  }

  async run() {
    console.log(`${colors.cyan}🔧 修復合約 API 使用問題${colors.reset}\n`);
    
    try {
      // 1. 分析問題文件
      await this.analyzeProblematicFiles();
      
      // 2. 執行修復
      await this.performFixes();
      
      // 3. 清理硬編碼引用
      await this.removeHardcodedReferences();
      
      // 4. 生成報告
      this.generateReport();
      
    } catch (error) {
      this.log(`修復過程中發生錯誤: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async analyzeProblematicFiles() {
    this.log('分析問題文件...', 'info');
    
    // 主要問題文件列表（來自同步腳本的警告）
    const problematicFiles = [
      'src/pages/AdminPageFixed.tsx',
      'src/pages/DungeonPage.tsx',
      'src/pages/archived/replaced-pages/DashboardPage.tsx',
      'src/pages/archived/replaced-pages/ExplorerPage.tsx',
      'src/pages/archived/replaced-pages/MyAssetsPage.tsx',
      'src/pages/archived/replaced-pages/ProfilePage.tsx',
      'src/pages/archived/test-pages/TestBatchRead.tsx',
      'src/components/marketplace/CreateListingModal.tsx',
      'src/hooks/useCommitReveal.ts'
    ];

    for (const file of problematicFiles) {
      const filePath = path.join(FRONTEND_PATH, file);
      if (fs.existsSync(filePath)) {
        await this.analyzeFile(filePath, file);
      }
    }
  }

  async analyzeFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 檢查 getContract() 使用
    const getContractMatches = content.match(/getContract\s*\(\s*['"`](\w+)['"`]\s*\)/g);
    if (getContractMatches) {
      for (const match of getContractMatches) {
        const contractName = match.match(/['"`](\w+)['"`]/)[1];
        
        // 分析使用上下文
        const lines = content.split('\n');
        let contextLine = '';
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(match)) {
            contextLine = lines[i].trim();
            break;
          }
        }
        
        // 判斷是否需要 ABI
        const needsABI = this.determineIfNeedsABI(contextLine, content);
        
        this.fixes.push({
          file: relativePath,
          type: needsABI ? 'replace-with-abi' : 'use-address-only',
          original: match,
          contractName,
          contextLine,
          needsABI
        });
      }
    }

    // 檢查直接地址引用
    const directAddressMatches = content.match(/CONTRACT_ADDRESSES\[\s*['"`](\w+)['"`]\s*\]/g);
    if (directAddressMatches) {
      for (const match of directAddressMatches) {
        const contractName = match.match(/['"`](\w+)['"`]/)[1];
        this.fixes.push({
          file: relativePath,
          type: 'replace-direct-address',
          original: match,
          contractName
        });
      }
    }
  }

  determineIfNeedsABI(contextLine, fileContent) {
    // 檢查是否用於合約調用
    const needsABIPatterns = [
      /\.write/,
      /\.read/,
      /\.simulate/,
      /writeContract/,
      /readContract/,
      /simulateContract/,
      /useContractWrite/,
      /useContractRead/,
      /usePrepareContractWrite/
    ];

    return needsABIPatterns.some(pattern => 
      pattern.test(contextLine) || pattern.test(fileContent)
    );
  }

  async performFixes() {
    this.log('執行修復...', 'info');
    
    const fileGroups = {};
    this.fixes.forEach(fix => {
      if (!fileGroups[fix.file]) {
        fileGroups[fix.file] = [];
      }
      fileGroups[fix.file].push(fix);
    });

    for (const [file, fixes] of Object.entries(fileGroups)) {
      await this.fixFile(file, fixes);
    }
  }

  async fixFile(relativePath, fixes) {
    const filePath = path.join(FRONTEND_PATH, relativePath);
    
    // 跳過已歸檔的文件
    if (relativePath.includes('/archived/')) {
      this.log(`跳過已歸檔文件: ${relativePath}`, 'warning');
      return;
    }

    this.log(`修復文件: ${relativePath}`, 'info');
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 備份原文件
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);

    for (const fix of fixes) {
      switch (fix.type) {
        case 'replace-with-abi':
          // 需要 ABI 的情況，替換為 getContractWithABI
          const newCall = `getContractWithABI('${fix.contractName}')`;
          content = content.replace(fix.original, newCall);
          hasChanges = true;
          this.log(`  ✓ ${fix.original} → ${newCall}`, 'success');
          break;
          
        case 'use-address-only':
          // 只需要地址的情況，使用 getContractAddress
          const addressCall = `getContractAddress('${fix.contractName}')`;
          content = content.replace(fix.original, addressCall);
          hasChanges = true;
          this.log(`  ✓ ${fix.original} → ${addressCall}`, 'success');
          break;
          
        case 'replace-direct-address':
          // 替換直接地址引用
          const directFix = `getContractAddress('${fix.contractName}')`;
          content = content.replace(fix.original, directFix);
          hasChanges = true;
          this.log(`  ✓ ${fix.original} → ${directFix}`, 'success');
          break;
      }
    }

    // 確保導入正確的函數
    if (hasChanges) {
      content = this.ensureCorrectImports(content, fixes);
      fs.writeFileSync(filePath, content);
      this.log(`✅ 已修復: ${relativePath}`, 'success');
    }
  }

  ensureCorrectImports(content, fixes) {
    const needsWithABI = fixes.some(f => f.type === 'replace-with-abi');
    const needsAddress = fixes.some(f => 
      f.type === 'use-address-only' || f.type === 'replace-direct-address'
    );

    // 檢查現有導入
    const hasConfigImport = /from\s+['"`][^'"`]*config[^'"`]*['"`]/.test(content);
    
    if (!hasConfigImport) {
      // 添加導入
      let importStatement = "import { ";
      const imports = [];
      
      if (needsWithABI) imports.push('getContractWithABI');
      if (needsAddress) imports.push('getContractAddress');
      
      importStatement += imports.join(', ');
      importStatement += " } from '@/config/contractsWithABI';\\n";
      
      // 在其他導入後添加
      const importRegex = /(import\s+.*?;\\n)/g;
      const matches = content.match(importRegex);
      if (matches) {
        const lastImport = matches[matches.length - 1];
        content = content.replace(lastImport, lastImport + importStatement);
      }
    }
    
    return content;
  }

  async removeHardcodedReferences() {
    this.log('清理硬編碼引用...', 'info');
    
    // 移除不必要的市場相關代碼
    const marketplaceFile = path.join(FRONTEND_PATH, 'src/components/marketplace/CreateListingModal.tsx');
    if (fs.existsSync(marketplaceFile)) {
      this.log('已找到市場組件，但用戶表示不再使用市場功能', 'warning');
      this.log('建議手動檢查並移除 src/components/marketplace/ 目錄', 'warning');
    }
  }

  generateReport() {
    this.log('\\n生成修復報告...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: [...new Set(this.fixes.map(f => f.file))].length,
      totalFixes: this.fixes.length,
      fixesByType: {
        'replace-with-abi': this.fixes.filter(f => f.type === 'replace-with-abi').length,
        'use-address-only': this.fixes.filter(f => f.type === 'use-address-only').length,
        'replace-direct-address': this.fixes.filter(f => f.type === 'replace-direct-address').length
      },
      files: this.fixes.reduce((acc, fix) => {
        if (!acc[fix.file]) acc[fix.file] = [];
        acc[fix.file].push({
          type: fix.type,
          original: fix.original,
          contractName: fix.contractName
        });
        return acc;
      }, {})
    };

    const reportPath = path.join(__dirname, '../deployments', `contract-api-fix-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\\n${colors.green}✅ 修復完成！${colors.reset}`);
    console.log(`📊 修復統計:`);
    console.log(`  - 處理文件: ${report.totalFiles} 個`);
    console.log(`  - 總修復數: ${report.totalFixes} 處`);
    console.log(`  - 需要 ABI: ${report.fixesByType['replace-with-abi']} 處`);
    console.log(`  - 僅需地址: ${report.fixesByType['use-address-only']} 處`);
    console.log(`  - 直接引用: ${report.fixesByType['replace-direct-address']} 處`);
    console.log(`\\n📋 詳細報告: ${reportPath}`);
    
    console.log(`\\n${colors.cyan}下一步建議:${colors.reset}`);
    console.log('1. 執行類型檢查: npm run type-check');
    console.log('2. 執行代碼檢查: npm run lint');
    console.log('3. 測試關鍵頁面功能');
  }
}

// 運行修復腳本
if (require.main === module) {
  const fixer = new ContractAPIFixer();
  fixer.run().catch(console.error);
}

module.exports = ContractAPIFixer;
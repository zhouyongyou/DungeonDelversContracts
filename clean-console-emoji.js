#!/usr/bin/env node

/**
 * 合約項目 Console Emoji 清理工具
 * 專門清理 JavaScript 腳本中 console 語句的表情符號
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 目標目錄（排除 node_modules 和 lib）
const TARGET_DIRS = ['scripts', '.'];
const EXCLUDE_DIRS = ['node_modules', 'lib', 'cache', 'out', 'artifacts'];
const FILE_EXTENSIONS = ['.js'];

// 需要清理的 Console Emoji
const CONSOLE_EMOJIS = ['🔄', '🎯', '⚡', '🚀', '🔧', '💡', '🎉', '🔥', '✅', '❌', '⚠️', '📊', '🌟'];

// 保留的關鍵狀態指示符（在特定上下文中）
const PRESERVE_STATUS = {
  '✅': ['成功', '完成', '正確', '通過'],
  '❌': ['失敗', '錯誤', '無效'],
  '⚠️': ['警告', '注意', '提醒']
};

let processedFiles = 0;
let modifiedFiles = 0;
let totalChanges = 0;

async function getAllJSFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        !EXCLUDE_DIRS.includes(entry.name)) {
      const subFiles = await getAllJSFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && FILE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldPreserveEmoji(line, emoji) {
  if (PRESERVE_STATUS[emoji]) {
    return PRESERVE_STATUS[emoji].some(context => line.includes(context));
  }
  return false;
}

function cleanConsoleStatements(content) {
  const lines = content.split('\n');
  const changes = [];

  const cleanedLines = lines.map((line, index) => {
    let modifiedLine = line;
    let lineChanged = false;

    // 檢查是否為 console 語句
    const isConsoleStatement = /console\.(log|warn|error|info|debug)/.test(line);

    if (isConsoleStatement) {
      // 清理 CONSOLE_EMOJIS 中的表情符號
      for (const emoji of CONSOLE_EMOJIS) {
        if (modifiedLine.includes(emoji)) {
          // 檢查是否應該保留
          if (!shouldPreserveEmoji(line, emoji)) {
            // 移除 emoji，保持字符串完整性
            modifiedLine = modifiedLine.replace(new RegExp(`${emoji}\\s*`, 'g'), '');
            lineChanged = true;
          }
        }
      }

      // 清理可能造成語法錯誤的多餘空格
      if (lineChanged) {
        modifiedLine = modifiedLine.replace(/\s{2,}/g, ' ');
        modifiedLine = modifiedLine.replace(/'(\s+)/g, "'");
        modifiedLine = modifiedLine.replace(/(\s+)'/g, "'");
        modifiedLine = modifiedLine.replace(/`(\s+)/g, "`");
        modifiedLine = modifiedLine.replace(/(\s+)`/g, "`");
      }
    }

    if (lineChanged) {
      changes.push({
        line: index + 1,
        original: line.trim(),
        modified: modifiedLine.trim()
      });
    }

    return modifiedLine;
  });

  return {
    content: cleanedLines.join('\n'),
    changes
  };
}

async function processFile(filePath) {
  try {
    const originalContent = await fs.readFile(filePath, 'utf8');
    const { content: cleanedContent, changes } = cleanConsoleStatements(originalContent);

    processedFiles++;

    if (changes.length > 0) {
      await fs.writeFile(filePath, cleanedContent, 'utf8');
      modifiedFiles++;
      totalChanges += changes.length;

      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`\n📝 ${relativePath}`);

      changes.slice(0, 3).forEach(change => { // 只顯示前3個變更，避免輸出過長
        console.log(`  Line ${change.line}:`);
        console.log(`    - ${change.original.substring(0, 80)}${change.original.length > 80 ? '...' : ''}`);
        console.log(`    + ${change.modified.substring(0, 80)}${change.modified.length > 80 ? '...' : ''}`);
      });

      if (changes.length > 3) {
        console.log(`    ... 還有 ${changes.length - 3} 項變更`);
      }
    }

  } catch (error) {
    console.error(`❌ 處理檔案失敗: ${filePath}`, error.message);
  }
}

async function main() {
  console.log('🧹 合約項目 Console Emoji 清理工具');
  console.log('================================');
  console.log('目標：清理 JavaScript 腳本中 console 語句的裝飾性 emoji\n');

  try {
    // 收集所有需要處理的 JS 檔案
    const allFiles = [];
    for (const dir of TARGET_DIRS) {
      const dirPath = path.join(__dirname, dir);
      try {
        const files = await getAllJSFiles(dirPath);
        allFiles.push(...files);
      } catch (error) {
        console.log(`⚠️ 跳過目錄 ${dir}: ${error.message}`);
      }
    }

    // 過濾掉當前清理腳本本身
    const filteredFiles = allFiles.filter(file =>
      !file.includes('clean-console-emoji.js')
    );

    console.log(`🔍 找到 ${filteredFiles.length} 個 JS 檔案待處理...\n`);

    // 處理每個檔案
    for (const filePath of filteredFiles) {
      await processFile(filePath);
    }

    // 輸出統計
    console.log('\n' + '='.repeat(50));
    console.log('📊 清理統計報告');
    console.log('='.repeat(50));
    console.log(`✅ 處理檔案: ${processedFiles} 個`);
    console.log(`📝 修改檔案: ${modifiedFiles} 個`);
    console.log(`🔧 總變更數: ${totalChanges} 項`);

    if (modifiedFiles > 0) {
      console.log('\n🎯 清理重點:');
      console.log('- 移除 console 語句中的裝飾性 emoji');
      console.log('- 保留有語義意義的狀態指示符');
      console.log('- 提高腳本執行的穩定性');
      console.log('\n💡 建議：請測試修改後的腳本是否正常運行');
    } else {
      console.log('\n✨ 沒有找到需要清理的 Console Emoji');
    }

  } catch (error) {
    console.error('❌ 清理過程出錯:', error);
    process.exit(1);
  }
}

// 執行清理
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
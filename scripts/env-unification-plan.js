#!/usr/bin/env node

/**
 * ENV 統一化計劃
 * 徹底解決多格式同步問題的終極方案
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ENV 統一化架構規劃
const UNIFICATION_PLAN = {
    principle: "Single Source of Truth - 單一事實來源",
    
    // 第一階段：創建主 .env 文件
    phase1: {
        name: "創建統一 .env",
        description: "所有項目共用的單一環境變數文件",
        location: "/Users/sotadic/.env.dungeondelvers",
        format: "REACT_APP_CONTRACTNAME_CONTRACT=0x...",
        benefits: [
            "零同步錯誤",
            "版本控制簡單",
            "IDE 自動補全",
            "符合 12-factor 原則"
        ]
    },
    
    // 第二階段：前端重構
    phase2: {
        name: "前端 ENV 化",
        description: "移除 contracts.ts，直接使用 process.env",
        changes: [
            "刪除 src/config/contracts.ts",
            "創建 src/utils/env-contracts.ts",
            "更新所有引用點",
            "保留類型安全檢查"
        ]
    },
    
    // 第三階段：後端統一
    phase3: {
        name: "後端 ENV 統一",
        description: "後端也使用同一套 ENV",
        changes: [
            "移除 config/contracts.json", 
            "創建 utils/env-loader.js",
            "支援大小寫兼容",
            "保留向後兼容"
        ]
    },
    
    // 第四階段：合約腳本統一
    phase4: {
        name: "合約腳本 ENV 化",
        description: "所有部署和更新腳本使用 ENV",
        changes: [
            "統一使用 process.env",
            "移除硬編碼地址",
            "自動從 ENV 載入"
        ]
    }
};

// 實施步驟
const IMPLEMENTATION_STEPS = [
    {
        step: 1,
        title: "創建主 ENV 文件",
        action: "創建 ~/.env.dungeondelvers",
        code: `
# DungeonDelvers 主配置 - V25
# 所有項目的單一事實來源

# === Core Contracts ===
REACT_APP_DUNGEONCORE_CONTRACT=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
REACT_APP_ORACLE_CONTRACT=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a

# === NFT Contracts ===
REACT_APP_HERO_CONTRACT=0x671d937b171e2ba2c4dc23c133b07e4449f283ef
REACT_APP_RELIC_CONTRACT=0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da
REACT_APP_PARTY_CONTRACT=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3

# === Game Contracts ===
REACT_APP_DUNGEONMASTER_CONTRACT=0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a
REACT_APP_DUNGEONSTORAGE_CONTRACT=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
REACT_APP_ALTAROFASCENSION_CONTRACT=0xa86749237d4631ad92ba859d0b0df4770f6147ba

# === Support Contracts ===
REACT_APP_PLAYERVAULT_CONTRACT=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
REACT_APP_PLAYERPROFILE_CONTRACT=0x0f5932e89908400a5AfDC306899A2987b67a3155
REACT_APP_VIPSTAKING_CONTRACT=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C

# === Tokens ===
REACT_APP_SOULSHARD_CONTRACT=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
REACT_APP_USD_CONTRACT=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE

# === VRF ===
REACT_APP_VRFMANAGER_CONTRACT=0x980d224ec4d198d94f34a8af76a19c00dabe2436

# === Network Config ===
REACT_APP_CHAIN_ID=56
REACT_APP_SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.0
`
    },
    {
        step: 2,
        title: "創建前端 ENV 工具",
        action: "創建 src/utils/env-contracts.ts",
        code: `
// ENV 合約載入器 - 類型安全的環境變數讀取
interface ContractAddresses {
  DUNGEONCORE: string;
  ORACLE: string;
  HERO: string;
  RELIC: string;
  PARTY: string;
  DUNGEONMASTER: string;
  DUNGEONSTORAGE: string;
  ALTAROFASCENSION: string;
  PLAYERVAULT: string;
  PLAYERPROFILE: string;
  VIPSTAKING: string;
  SOULSHARD: string;
  USD: string;
  VRFMANAGER: string;
}

const getEnvContract = (name: string): string => {
  const address = process.env[\`REACT_APP_\${name}_CONTRACT\`];
  if (!address) {
    throw new Error(\`Missing environment variable: REACT_APP_\${name}_CONTRACT\`);
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(\`Invalid address format for \${name}: \${address}\`);
  }
  return address;
};

export const CONTRACTS: ContractAddresses = {
  DUNGEONCORE: getEnvContract('DUNGEONCORE'),
  ORACLE: getEnvContract('ORACLE'),
  HERO: getEnvContract('HERO'),
  RELIC: getEnvContract('RELIC'),
  PARTY: getEnvContract('PARTY'),
  DUNGEONMASTER: getEnvContract('DUNGEONMASTER'),
  DUNGEONSTORAGE: getEnvContract('DUNGEONSTORAGE'),
  ALTAROFASCENSION: getEnvContract('ALTAROFASCENSION'),
  PLAYERVAULT: getEnvContract('PLAYERVAULT'),
  PLAYERPROFILE: getEnvContract('PLAYERPROFILE'),
  VIPSTAKING: getEnvContract('VIPSTAKING'),
  SOULSHARD: getEnvContract('SOULSHARD'),
  USD: getEnvContract('USD'),
  VRFMANAGER: getEnvContract('VRFMANAGER'),
};

export const NETWORK_CONFIG = {
  chainId: Number(process.env.REACT_APP_CHAIN_ID) || 56,
  subgraphUrl: process.env.REACT_APP_SUBGRAPH_URL || '',
};
`
    },
    {
        step: 3,
        title: "更新項目配置",
        action: "更新各項目的 .env 符號連結",
        commands: [
            "cd /Users/sotadic/Documents/GitHub/DungeonDelvers",
            "rm .env.local",
            "ln -s ~/.env.dungeondelvers .env.local",
            "",
            "cd /Users/sotadic/Documents/dungeon-delvers-metadata-server",
            "rm .env",
            "ln -s ~/.env.dungeondelvers .env"
        ]
    }
];

function showPlan() {
    log('🎯 ENV 統一化計劃', 'bright');
    log('=====================================', 'cyan');
    
    log(`\\n原則: ${UNIFICATION_PLAN.principle}`, 'yellow');
    
    log('\\n📊 現狀問題分析:', 'red');
    log('  ❌ 多種格式文件 (.ts, .json, .env)');
    log('  ❌ 手動同步容易出錯'); 
    log('  ❌ 版本不一致風險高');
    log('  ❌ 維護成本高');
    
    log('\\n✅ ENV 統一化優勢:', 'green');
    for (const benefit of UNIFICATION_PLAN.phase1.benefits) {
        log(`  ✅ ${benefit}`, 'green');
    }
    
    log('\\n📋 實施步驟:', 'cyan');
    for (const step of IMPLEMENTATION_STEPS) {
        log(`\\n${step.step}. ${step.title}`, 'blue');
        log(`   ${step.action}`, 'dim');
    }
    
    log('\\n🔥 立即效果:', 'yellow');
    log('  - 永遠不會再有地址同步問題');
    log('  - 修改一次，全部項目自動更新');  
    log('  - IDE 自動提示所有合約地址');
    log('  - 符合現代 Web 開發最佳實踐');
    
    log('\\n❓ 要開始實施嗎？ (Y/n)', 'bright');
}

// 執行計劃
function implementPhase1() {
    log('\\n🚀 開始實施階段 1...', 'green');
    
    const envContent = IMPLEMENTATION_STEPS[0].code.trim();
    const envPath = '/Users/sotadic/.env.dungeondelvers';
    
    try {
        fs.writeFileSync(envPath, envContent);
        log(`✅ 創建主 ENV 文件: ${envPath}`, 'green');
        
        log('\\n📝 下一步操作:', 'yellow');
        log('1. 執行: source ~/.env.dungeondelvers');
        log('2. 在前端項目創建符號連結:');
        log('   cd /Users/sotadic/Documents/GitHub/DungeonDelvers');
        log('   ln -sf ~/.env.dungeondelvers .env.local');
        log('3. 在後端項目創建符號連結:');  
        log('   cd /Users/sotadic/Documents/dungeon-delvers-metadata-server');
        log('   ln -sf ~/.env.dungeondelvers .env');
        
    } catch (error) {
        log(`❌ 創建失敗: ${error.message}`, 'red');
    }
}

// 主執行
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'implement') {
        implementPhase1();
    } else {
        showPlan();
    }
}

main();
#!/usr/bin/env node

/**
 * Marketplace V2 地址審計腳本
 * 
 * 檢查當前白名單狀態，分析現有掛單使用的合約地址
 * 為地址管理決策提供數據支持
 * 
 * 使用方式：
 * node scripts/active/marketplace-address-audit.js
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

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

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red
  };
  
  console.log(`${levelColors[level]}[${level}]${colors.reset} ${colors.bright}${timestamp}${colors.reset} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

class MarketplaceAddressAuditor {
  constructor() {
    this.marketplaceAddress = "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8";
    this.offerSystemAddress = "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF";
    
    // V25 最新地址 (2025-08-03 部署)
    this.v25Addresses = {
      HERO: "0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db",
      RELIC: "0xcfB83d8545D68b796a236290b3C1bc7e4A140B11",
      PARTY: "0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69"
    };
    
    // 舊版地址（從配置文件獲取）
    this.oldAddresses = {
      HERO: "0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22",
      RELIC: "0xe66036839c7E5F8372ADC36da8f0357429a96A34",
      PARTY: "0x22Ac9b248716FA64eD97025c77112c4c3e0169ab"
    };
  }

  async checkWhitelistStatus() {
    log('INFO', '檢查 Marketplace V2 白名單狀態...');
    
    try {
      const marketplace = await ethers.getContractAt("DungeonMarketplaceV2", this.marketplaceAddress);
      const offerSystem = await ethers.getContractAt("OfferSystemV2", this.offerSystemAddress);
      
      const whitelist = {
        marketplace: {},
        offerSystem: {}
      };
      
      // 檢查所有地址
      const allAddresses = {...this.v25Addresses, ...this.oldAddresses};
      
      for (const [type, address] of Object.entries(allAddresses)) {
        // 檢查 Marketplace
        const marketplaceApproved = await marketplace.approvedNFTContracts(address);
        whitelist.marketplace[`${type}_${address.substring(0, 10)}...`] = marketplaceApproved;
        
        // 檢查 OfferSystem  
        const offerSystemApproved = await offerSystem.approvedNFTContracts(address);
        whitelist.offerSystem[`${type}_${address.substring(0, 10)}...`] = offerSystemApproved;
      }
      
      log('SUCCESS', '✅ 白名單狀態檢查完成', whitelist);
      return whitelist;
      
    } catch (error) {
      log('ERROR', '❌ 檢查白名單狀態失敗', { error: error.message });
      return null;
    }
  }

  async checkActiveListings() {
    log('INFO', '檢查活躍掛單使用的合約地址...');
    
    try {
      const marketplace = await ethers.getContractAt("DungeonMarketplaceV2", this.marketplaceAddress);
      
      // 獲取總掛單數量
      const totalListings = await marketplace._listingIds ? await marketplace._listingIds() : 0;
      log('INFO', `總掛單數量: ${totalListings}`);
      
      const activeListings = {
        byContract: {},
        total: 0,
        active: 0
      };
      
      // 檢查前 100 個掛單（避免 gas 過高）
      const checkLimit = Math.min(Number(totalListings), 100);
      
      for (let i = 1; i <= checkLimit; i++) {
        try {
          const listing = await marketplace.listings(i);
          activeListings.total++;
          
          // 檢查是否為活躍狀態 (ListingStatus.ACTIVE = 0)
          if (listing.status === 0) {
            activeListings.active++;
            const contractAddr = listing.nftContract;
            
            if (!activeListings.byContract[contractAddr]) {
              activeListings.byContract[contractAddr] = 0;
            }
            activeListings.byContract[contractAddr]++;
          }
        } catch (error) {
          // 掛單可能不存在，繼續檢查下一個
          continue;
        }
      }
      
      log('SUCCESS', '✅ 活躍掛單檢查完成', activeListings);
      return activeListings;
      
    } catch (error) {
      log('ERROR', '❌ 檢查活躍掛單失敗', { error: error.message });
      return null;
    }
  }

  generateAddressReport(whitelist, activeListings) {
    console.log(`${colors.bright}\\n📊 地址管理建議報告${colors.reset}`);
    console.log('='.repeat(80));
    
    // 白名單狀態表格
    console.log(`\\n${colors.cyan}🔍 當前白名單狀態:${colors.reset}`);
    console.log('┌─────────────────────────────────────────────┬─────────────┬─────────────┐');
    console.log('│                   地址                      │ Marketplace │ OfferSystem │');
    console.log('├─────────────────────────────────────────────┼─────────────┼─────────────┤');
    
    const allAddresses = {...this.v25Addresses, ...this.oldAddresses};
    for (const [type, address] of Object.entries(allAddresses)) {
      const shortAddr = `${type} ${address.substring(0, 20)}...`;
      const marketplaceStatus = whitelist?.marketplace[`${type}_${address.substring(0, 10)}...`] ? '✅ 已批准' : '❌ 未批准';
      const offerSystemStatus = whitelist?.offerSystem[`${type}_${address.substring(0, 10)}...`] ? '✅ 已批准' : '❌ 未批准';
      
      console.log(`│ ${shortAddr.padEnd(43)} │ ${marketplaceStatus.padEnd(11)} │ ${offerSystemStatus.padEnd(11)} │`);
    }
    console.log('└─────────────────────────────────────────────┴─────────────┴─────────────┘');
    
    // 活躍掛單分析
    if (activeListings) {
      console.log(`\\n${colors.cyan}📈 活躍掛單分析:${colors.reset}`);
      console.log(`總檢查掛單: ${activeListings.total}`);
      console.log(`活躍掛單數: ${activeListings.active}`);
      
      if (Object.keys(activeListings.byContract).length > 0) {
        console.log('\\n按合約地址分佈:');
        for (const [contract, count] of Object.entries(activeListings.byContract)) {
          const shortContract = `${contract.substring(0, 20)}...`;
          console.log(`  ${shortContract}: ${count} 個掛單`);
        }
      } else {
        console.log('  ℹ️  沒有找到活躍掛單');
      }
    }
    
    // 管理建議
    console.log(`\\n${colors.yellow}💡 地址管理建議:${colors.reset}`);
    
    const v25NotApproved = [];
    const oldApproved = [];
    
    if (whitelist) {
      // 檢查 V25 地址是否已批准
      for (const [type, address] of Object.entries(this.v25Addresses)) {
        const key = `${type}_${address.substring(0, 10)}...`;
        if (!whitelist.marketplace[key]) {
          v25NotApproved.push(`${type}: ${address}`);
        }
      }
      
      // 檢查舊地址是否仍被批准
      for (const [type, address] of Object.entries(this.oldAddresses)) {
        const key = `${type}_${address.substring(0, 10)}...`;
        if (whitelist.marketplace[key]) {
          oldApproved.push(`${type}: ${address}`);
        }
      }
    }
    
    if (v25NotApproved.length > 0) {
      console.log(`\\n${colors.red}🚨 需要立即添加的 V25 地址:${colors.reset}`);
      v25NotApproved.forEach(addr => console.log(`  - ${addr}`));
      
      console.log(`\\n${colors.green}📝 執行命令:${colors.reset}`);
      for (const [type, address] of Object.entries(this.v25Addresses)) {
        const key = `${type}_${address.substring(0, 10)}...`;
        if (whitelist && !whitelist.marketplace[key]) {
          console.log(`  marketplace.approveNFTContract("${address}"); // ${type} V25`);
          console.log(`  offerSystem.approveNFTContract("${address}");  // ${type} V25`);
        }
      }
    }
    
    if (oldApproved.length > 0) {
      console.log(`\\n${colors.yellow}⚠️  仍在白名單中的舊地址:${colors.reset}`);
      oldApproved.forEach(addr => console.log(`  - ${addr}`));
      
      console.log(`\\n${colors.blue}🤔 清理建議:${colors.reset}`);
      console.log('  - 方案 A (保守): 保留舊地址，避免影響現有交易');
      console.log('  - 方案 B (清理): 移除舊地址，但需先確認無活躍掛單');
      
      if (activeListings && Object.keys(activeListings.byContract).length > 0) {
        console.log(`\\n${colors.red}⚠️  注意: 發現活躍掛單，建議採用保守方案${colors.reset}`);
      } else {
        console.log(`\\n${colors.green}✅ 沒有發現活躍掛單，可考慮清理舊地址${colors.reset}`);
      }
    }
    
    if (v25NotApproved.length === 0 && oldApproved.length === 0) {
      console.log(`\\n${colors.green}🎉 所有地址狀態正常，無需額外操作！${colors.reset}`);
    }
  }

  async generateFullReport() {
    const reportPath = `marketplace-address-audit-${Date.now()}.json`;
    
    const whitelist = await this.checkWhitelistStatus();
    const activeListings = await this.checkActiveListings();
    
    const report = {
      timestamp: new Date().toISOString(),
      contracts: {
        marketplace: this.marketplaceAddress,
        offerSystem: this.offerSystemAddress
      },
      addresses: {
        v25: this.v25Addresses,
        old: this.oldAddresses
      },
      whitelist: whitelist,
      activeListings: activeListings,
      recommendations: []
    };
    
    // 生成建議
    if (whitelist) {
      for (const [type, address] of Object.entries(this.v25Addresses)) {
        const key = `${type}_${address.substring(0, 10)}...`;
        if (!whitelist.marketplace[key]) {
          report.recommendations.push({
            action: 'approve',
            contract: 'marketplace',
            address: address,
            type: type,
            reason: 'V25 address not in whitelist'
          });
        }
      }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('SUCCESS', `📋 詳細報告已生成: ${reportPath}`);
    
    return report;
  }

  async run() {
    console.log(`${colors.bright}
==================================================
🔍 Marketplace V2 地址審計工具
==================================================
${colors.reset}`);
    
    const whitelist = await this.checkWhitelistStatus();
    const activeListings = await this.checkActiveListings();
    
    this.generateAddressReport(whitelist, activeListings);
    await this.generateFullReport();
    
    console.log(`\\n${colors.bright}📋 審計完成！${colors.reset}`);
  }
}

// 執行審計
if (require.main === module) {
  const auditor = new MarketplaceAddressAuditor();
  auditor.run().catch(console.error);
}

module.exports = MarketplaceAddressAuditor;
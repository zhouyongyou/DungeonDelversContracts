#!/usr/bin/env node

/**
 * Marketplace V2 NFT 白名單批准腳本（直接執行版）
 * 
 * 使用方式：
 * node scripts/active/marketplace-approve-nfts-direct.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

async function main() {
  console.log(`${colors.bright}
==================================================
🎯 Marketplace V2 NFT 白名單批准（直接執行）
==================================================
${colors.reset}`);

  // 檢查環境變數
  if (!process.env.PRIVATE_KEY) {
    log('ERROR', 'PRIVATE_KEY 環境變數未設置');
    process.exit(1);
  }

  // 合約地址
  const MARKETPLACE_V2 = "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8";
  const OFFER_SYSTEM_V2 = "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF";
  
  // V25 NFT 地址
  const V25_NFT_ADDRESSES = {
    HERO: "0x785a8b7d7b2E64c5971D8f548a45B7db3CcA5797",
    RELIC: "0xaa7434e77343cd4AaE7dDea2f19Cb86232727D0d",
    PARTY: "0x2890F2bFe5ff4655d3096eC5521be58Eba6fAE50"
  };

  try {
    // 連接到 BSC
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    log('INFO', `執行者地址: ${signer.address}`);
    
    // 檢查餘額
    const balance = await provider.getBalance(signer.address);
    log('INFO', `餘額: ${ethers.formatEther(balance)} BNB`);
    
    if (balance < ethers.parseEther("0.01")) {
      throw new Error("BNB 餘額不足，至少需要 0.01 BNB");
    }

    // 載入 ABI
    const marketplaceABI = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../marketplace/abis/DungeonMarketplaceV2.json'), 
      'utf8'
    ));
    const offerSystemABI = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../marketplace/abis/OfferSystemV2.json'), 
      'utf8'
    ));

    // 連接合約
    const marketplace = new ethers.Contract(MARKETPLACE_V2, marketplaceABI, signer);
    const offerSystem = new ethers.Contract(OFFER_SYSTEM_V2, offerSystemABI, signer);

    log('INFO', '已連接到合約:');
    log('INFO', `- DungeonMarketplaceV2: ${MARKETPLACE_V2}`);
    log('INFO', `- OfferSystemV2: ${OFFER_SYSTEM_V2}`);

    // 檢查 Owner
    const marketplaceOwner = await marketplace.owner();
    const offerSystemOwner = await offerSystem.owner();
    
    log('INFO', `Marketplace Owner: ${marketplaceOwner}`);
    log('INFO', `OfferSystem Owner: ${offerSystemOwner}`);
    
    if (marketplaceOwner.toLowerCase() !== signer.address.toLowerCase()) {
      throw new Error(`您不是 Marketplace 的 Owner。Owner 是: ${marketplaceOwner}`);
    }
    
    if (offerSystemOwner.toLowerCase() !== signer.address.toLowerCase()) {
      throw new Error(`您不是 OfferSystem 的 Owner。Owner 是: ${offerSystemOwner}`);
    }

    // 檢查當前白名單狀態
    console.log(`\n${colors.cyan}📋 檢查當前白名單狀態...${colors.reset}`);
    
    const needApproval = {
      marketplace: [],
      offerSystem: []
    };
    
    for (const [nftType, address] of Object.entries(V25_NFT_ADDRESSES)) {
      const marketplaceApproved = await marketplace.approvedNFTContracts(address);
      const offerSystemApproved = await offerSystem.approvedNFTContracts(address);
      
      console.log(`\n${nftType} (${address}):`);
      console.log(`  Marketplace: ${marketplaceApproved ? '✅ 已批准' : '❌ 未批准'}`);
      console.log(`  OfferSystem: ${offerSystemApproved ? '✅ 已批准' : '❌ 未批准'}`);
      
      if (!marketplaceApproved) {
        needApproval.marketplace.push({ type: nftType, address });
      }
      if (!offerSystemApproved) {
        needApproval.offerSystem.push({ type: nftType, address });
      }
    }

    // 如果沒有需要批准的，直接結束
    if (needApproval.marketplace.length === 0 && needApproval.offerSystem.length === 0) {
      console.log(`\n${colors.green}✅ 所有 NFT 合約都已在白名單中！${colors.reset}`);
      return;
    }

    // 詢問確認
    console.log(`\n${colors.yellow}需要批准的合約:${colors.reset}`);
    console.log(`Marketplace: ${needApproval.marketplace.length} 個`);
    console.log(`OfferSystem: ${needApproval.offerSystem.length} 個`);
    
    // 設置 gas 價格
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice * 110n / 100n; // 增加 10% 確保成功
    log('INFO', `Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);

    // 執行批准
    console.log(`\n${colors.yellow}🚀 開始批准 NFT 合約...${colors.reset}`);
    
    // 批准 Marketplace NFT
    for (const { type, address } of needApproval.marketplace) {
      log('INFO', `批准 ${type} 到 Marketplace...`);
      
      const tx = await marketplace.approveNFTContract(address, {
        gasPrice: gasPrice,
        gasLimit: 100000
      });
      
      log('INFO', `交易已發送: ${tx.hash}`);
      
      const receipt = await tx.wait();
      log('SUCCESS', `✅ ${type} 已批准到 Marketplace`);
      log('INFO', `- 區塊: ${receipt.blockNumber}`);
      log('INFO', `- Gas 使用: ${receipt.gasUsed.toString()}`);
    }
    
    // 批准 OfferSystem NFT
    for (const { type, address } of needApproval.offerSystem) {
      log('INFO', `批准 ${type} 到 OfferSystem...`);
      
      const tx = await offerSystem.approveNFTContract(address, {
        gasPrice: gasPrice,
        gasLimit: 100000
      });
      
      log('INFO', `交易已發送: ${tx.hash}`);
      
      const receipt = await tx.wait();
      log('SUCCESS', `✅ ${type} 已批准到 OfferSystem`);
      log('INFO', `- 區塊: ${receipt.blockNumber}`);
      log('INFO', `- Gas 使用: ${receipt.gasUsed.toString()}`);
    }

    // 最終驗證
    console.log(`\n${colors.cyan}📋 驗證最終狀態...${colors.reset}`);
    
    let allApproved = true;
    for (const [nftType, address] of Object.entries(V25_NFT_ADDRESSES)) {
      const marketplaceApproved = await marketplace.approvedNFTContracts(address);
      const offerSystemApproved = await offerSystem.approvedNFTContracts(address);
      
      console.log(`\n${nftType}:`);
      console.log(`  Marketplace: ${marketplaceApproved ? '✅ 已批准' : '❌ 未批准'}`);
      console.log(`  OfferSystem: ${offerSystemApproved ? '✅ 已批准' : '❌ 未批准'}`);
      
      if (!marketplaceApproved || !offerSystemApproved) {
        allApproved = false;
      }
    }

    if (allApproved) {
      console.log(`\n${colors.green}🎉 所有 V25 NFT 合約已成功批准！${colors.reset}`);
      console.log('\n下一步:');
      console.log('1. 執行 marketplace-sync.js 同步配置文件');
      console.log('2. 測試 NFT 在 Marketplace 的交易功能');
    } else {
      console.log(`\n${colors.red}❌ 部分 NFT 合約批准失敗，請檢查日誌${colors.reset}`);
    }

    // 生成報告
    const report = {
      timestamp: new Date().toISOString(),
      executor: signer.address,
      network: 'BSC Mainnet',
      contracts: {
        marketplace: MARKETPLACE_V2,
        offerSystem: OFFER_SYSTEM_V2
      },
      nftAddresses: V25_NFT_ADDRESSES,
      approvalResults: {
        marketplace: {},
        offerSystem: {}
      }
    };
    
    for (const [nftType, address] of Object.entries(V25_NFT_ADDRESSES)) {
      report.approvalResults.marketplace[nftType] = await marketplace.approvedNFTContracts(address);
      report.approvalResults.offerSystem[nftType] = await offerSystem.approvedNFTContracts(address);
    }
    
    const reportPath = path.join(__dirname, `../../marketplace-approval-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('SUCCESS', `📄 批准報告已保存: ${path.basename(reportPath)}`);

  } catch (error) {
    log('ERROR', `❌ 執行失敗: ${error.message}`);
    if (error.data) {
      log('ERROR', '錯誤詳情:', error.data);
    }
    process.exit(1);
  }
}

// 執行
main().catch(console.error);
/**
 * V25 市場合約部署模塊
 * 
 * 可以獨立部署或整合到主部署流程中
 */

const hre = require("hardhat");
// 注意：v25-unified-sync 已被 v25-sync-all.js 取代
// 如果需要 readMasterConfig 和 updateMasterConfig，請從其他地方引入
// const { readMasterConfig, updateMasterConfig } = require('./v25-unified-sync');

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

/**
 * 部署市場合約
 * @param {Object} deployedContracts - 已部署的合約地址
 * @param {Object} options - 部署選項
 * @returns {Object} 部署的市場合約地址
 */
async function deployMarketplaceContracts(deployedContracts, options = {}) {
  console.log(`\n${colors.bright}${colors.blue}========== 部署市場合約 ==========${colors.reset}`);
  
  const [deployer] = await hre.ethers.getSigners();
  const config = readMasterConfig();
  
  // 獲取必要的合約地址
  const SOUL_TOKEN = deployedContracts.SOULSHARD || config.contracts.mainnet.SOULSHARD_ADDRESS;
  const HERO_CONTRACT = deployedContracts.HERO || config.contracts.mainnet.HERO_ADDRESS;
  const RELIC_CONTRACT = deployedContracts.RELIC || config.contracts.mainnet.RELIC_ADDRESS;
  const PARTY_CONTRACT = deployedContracts.PARTY || config.contracts.mainnet.PARTY_ADDRESS;
  const FEE_RECIPIENT = config.contracts.mainnet.DUNGEONMASTERWALLET_ADDRESS;
  
  const APPROVED_NFTS = [HERO_CONTRACT, RELIC_CONTRACT, PARTY_CONTRACT];
  
  const marketplaceAddresses = {};
  
  try {
    // 1. 部署 DungeonMarketplace
    console.log(`\n${colors.bright}1. 部署 DungeonMarketplace...${colors.reset}`);
    const DungeonMarketplace = await hre.ethers.getContractFactory("DungeonMarketplace");
    const marketplace = await DungeonMarketplace.deploy(
      SOUL_TOKEN,
      FEE_RECIPIENT,
      APPROVED_NFTS
    );
    
    await marketplace.deployed();
    console.log(`${colors.green}✅ DungeonMarketplace 部署到: ${marketplace.address}${colors.reset}`);
    marketplaceAddresses.DUNGEONMARKETPLACE = marketplace.address;
    
    // 2. 部署 OfferSystem
    console.log(`\n${colors.bright}2. 部署 OfferSystem...${colors.reset}`);
    const OfferSystem = await hre.ethers.getContractFactory("OfferSystem");
    const offerSystem = await OfferSystem.deploy(
      SOUL_TOKEN,
      FEE_RECIPIENT,
      APPROVED_NFTS
    );
    
    await offerSystem.deployed();
    console.log(`${colors.green}✅ OfferSystem 部署到: ${offerSystem.address}${colors.reset}`);
    marketplaceAddresses.OFFERSYSTEM = offerSystem.address;
    
    // 3. 等待區塊確認
    if (options.waitConfirmations) {
      console.log(`\n${colors.yellow}⏳ 等待 ${options.waitConfirmations} 個區塊確認...${colors.reset}`);
      await marketplace.deployTransaction.wait(options.waitConfirmations);
      await offerSystem.deployTransaction.wait(options.waitConfirmations);
    }
    
    // 4. 驗證部署
    console.log(`\n${colors.bright}3. 驗證部署...${colors.reset}`);
    
    // 檢查 marketplace 配置
    const marketplaceFee = await marketplace.platformFee();
    const marketplaceFeeRecipient = await marketplace.feeRecipient();
    console.log(`${colors.cyan}Marketplace 平台費用: ${marketplaceFee.toString()} 基點 (${marketplaceFee.toNumber() / 100}%)${colors.reset}`);
    console.log(`${colors.cyan}Marketplace 費用接收方: ${marketplaceFeeRecipient}${colors.reset}`);
    
    // 檢查 offer system 配置
    const offerSystemFee = await offerSystem.platformFee();
    const offerSystemFeeRecipient = await offerSystem.feeRecipient();
    console.log(`${colors.cyan}OfferSystem 平台費用: ${offerSystemFee.toString()} 基點 (${offerSystemFee.toNumber() / 100}%)${colors.reset}`);
    console.log(`${colors.cyan}OfferSystem 費用接收方: ${offerSystemFeeRecipient}${colors.reset}`);
    
    // 5. 自動驗證合約
    if (options.autoVerify && hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
      console.log(`\n${colors.bright}4. 驗證合約...${colors.reset}`);
      
      try {
        // 驗證 DungeonMarketplace
        console.log(`${colors.yellow}驗證 DungeonMarketplace...${colors.reset}`);
        await hre.run("verify:verify", {
          address: marketplace.address,
          constructorArguments: [SOUL_TOKEN, FEE_RECIPIENT, APPROVED_NFTS],
        });
        console.log(`${colors.green}✅ DungeonMarketplace 驗證成功${colors.reset}`);
      } catch (error) {
        console.log(`${colors.yellow}⚠️ DungeonMarketplace 驗證失敗: ${error.message}${colors.reset}`);
      }
      
      try {
        // 驗證 OfferSystem
        console.log(`${colors.yellow}驗證 OfferSystem...${colors.reset}`);
        await hre.run("verify:verify", {
          address: offerSystem.address,
          constructorArguments: [SOUL_TOKEN, FEE_RECIPIENT, APPROVED_NFTS],
        });
        console.log(`${colors.green}✅ OfferSystem 驗證成功${colors.reset}`);
      } catch (error) {
        console.log(`${colors.yellow}⚠️ OfferSystem 驗證失敗: ${error.message}${colors.reset}`);
      }
    }
    
    // 6. 更新 master-config.json
    if (options.updateConfig) {
      console.log(`\n${colors.bright}5. 更新 master-config.json...${colors.reset}`);
      
      const updatedConfig = {
        ...config,
        contracts: {
          ...config.contracts,
          mainnet: {
            ...config.contracts.mainnet,
            DUNGEONMARKETPLACE_ADDRESS: marketplace.address,
            OFFERSYSTEM_ADDRESS: offerSystem.address
          }
        },
        lastUpdated: new Date().toISOString()
      };
      
      updateMasterConfig(updatedConfig);
      console.log(`${colors.green}✅ master-config.json 已更新${colors.reset}`);
    }
    
    // 7. 顯示部署摘要
    console.log(`\n${colors.bright}${colors.green}========== 市場合約部署完成 ==========${colors.reset}`);
    console.log(`${colors.cyan}DungeonMarketplace: ${marketplace.address}${colors.reset}`);
    console.log(`${colors.cyan}OfferSystem: ${offerSystem.address}${colors.reset}`);
    console.log(`${colors.cyan}部署區塊: ${await hre.ethers.provider.getBlockNumber()}${colors.reset}`);
    
    return marketplaceAddresses;
    
  } catch (error) {
    console.error(`${colors.red}❌ 市場合約部署失敗: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * 設置市場合約權限
 * @param {Object} marketplaceAddresses - 市場合約地址
 * @param {Object} deployedContracts - 所有已部署的合約地址
 */
async function setupMarketplacePermissions(marketplaceAddresses, deployedContracts) {
  console.log(`\n${colors.bright}${colors.blue}========== 設置市場合約權限 ==========${colors.reset}`);
  
  const config = readMasterConfig();
  const DUNGEONCORE = deployedContracts.DUNGEONCORE || config.contracts.mainnet.DUNGEONCORE_ADDRESS;
  
  try {
    // 如果需要在 DungeonCore 中註冊市場合約
    // 這裡可以添加權限設置邏輯
    
    console.log(`${colors.green}✅ 市場合約權限設置完成${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ 權限設置失敗: ${error.message}${colors.reset}`);
    throw error;
  }
}

// 獨立執行模式
async function main() {
  console.log(`${colors.bright}${colors.cyan}開始部署 DungeonDelvers 市場合約...${colors.reset}`);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`${colors.yellow}部署者地址: ${deployer.address}${colors.reset}`);
  console.log(`${colors.yellow}餘額: ${hre.ethers.utils.formatEther(await deployer.getBalance())} BNB${colors.reset}`);
  
  // 部署選項
  const options = {
    waitConfirmations: 5,
    autoVerify: true,
    updateConfig: true
  };
  
  // 從 master-config 讀取已部署的合約地址
  const config = readMasterConfig();
  const deployedContracts = {
    SOULSHARD: config.contracts.mainnet.SOULSHARD_ADDRESS,
    HERO: config.contracts.mainnet.HERO_ADDRESS,
    RELIC: config.contracts.mainnet.RELIC_ADDRESS,
    PARTY: config.contracts.mainnet.PARTY_ADDRESS,
    DUNGEONCORE: config.contracts.mainnet.DUNGEONCORE_ADDRESS
  };
  
  // 部署市場合約
  const marketplaceAddresses = await deployMarketplaceContracts(deployedContracts, options);
  
  // 設置權限（如果需要）
  await setupMarketplacePermissions(marketplaceAddresses, deployedContracts);
  
  console.log(`\n${colors.bright}${colors.green}🎉 所有市場合約部署和設置完成！${colors.reset}`);
  
  // 提醒後續步驟
  console.log(`\n${colors.bright}${colors.yellow}後續步驟：${colors.reset}`);
  console.log(`${colors.yellow}1. 執行 npm run sync:config 同步所有專案配置${colors.reset}`);
  console.log(`${colors.yellow}2. 更新子圖配置中的合約地址${colors.reset}`);
  console.log(`${colors.yellow}3. 重新部署子圖${colors.reset}`);
  console.log(`${colors.yellow}4. 在前端切換到合約模式${colors.reset}`);
}

// 導出模塊
module.exports = {
  deployMarketplaceContracts,
  setupMarketplacePermissions
};

// 如果直接執行
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
#!/usr/bin/env node

/**
 * 市場合約獨立部署腳本
 * 
 * 完全獨立於主遊戲合約的部署流程
 * 
 * 使用方式：
 * npx hardhat run marketplace/deploy-standalone.js --network bsc
 */

const hre = require("hardhat");
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

// 市場配置文件路徑
const MARKETPLACE_CONFIG_PATH = path.join(__dirname, 'marketplace-config.json');

// 市場部署配置
const MARKETPLACE_CONFIG = {
  // 依賴的外部合約
  dependencies: {
    SOUL_TOKEN: process.env.SOUL_TOKEN || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    HERO_CONTRACT: process.env.HERO_CONTRACT || '0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22',
    RELIC_CONTRACT: process.env.RELIC_CONTRACT || '0xe66036839c7E5F8372ADC36da8f0357429a96A34',
    PARTY_CONTRACT: process.env.PARTY_CONTRACT || '0x22Ac9b248716FA64eD97025c77112c4c3e0169ab',
    FEE_RECIPIENT: process.env.FEE_RECIPIENT || '0x10925A7138649C7E1794CE646182eeb5BF8ba647'
  },
  
  // 部署選項
  options: {
    platformFee: 250, // 2.5%
    maxFee: 1000,     // 10% max
    waitConfirmations: 5,
    autoVerify: true,
    generateABI: true
  }
};

class MarketplaceDeployer {
  constructor() {
    this.deployedContracts = {};
    this.deploymentBlock = 0;
  }

  async deploy() {
    console.log(`${colors.bright}${colors.blue}
==================================================
🛒 DungeonDelvers 市場合約獨立部署
==================================================
${colors.reset}`);

    try {
      // 1. 前置檢查
      await this.preDeploymentChecks();
      
      // 2. 部署合約
      await this.deployContracts();
      
      // 3. 配置合約
      await this.configureContracts();
      
      // 4. 驗證合約
      if (MARKETPLACE_CONFIG.options.autoVerify) {
        await this.verifyContracts();
      }
      
      // 5. 生成配置文件
      await this.generateConfigs();
      
      // 6. 生成 ABI
      if (MARKETPLACE_CONFIG.options.generateABI) {
        await this.generateABIs();
      }
      
      // 7. 顯示部署摘要
      await this.showSummary();
      
      console.log(`\n${colors.bright}${colors.green}✅ 市場合約部署完成！${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ 部署失敗: ${error.message}${colors.reset}`);
      throw error;
    }
  }

  async preDeploymentChecks() {
    console.log(`\n${colors.cyan}執行前置檢查...${colors.reset}`);
    
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    
    console.log(`部署者地址: ${deployer.address}`);
    console.log(`餘額: ${hre.ethers.formatEther(balance)} BNB`);
    
    if (balance < hre.ethers.parseEther("0.1")) {
      throw new Error("餘額不足，至少需要 0.1 BNB");
    }
    
    // 檢查依賴合約
    console.log(`\n${colors.cyan}檢查依賴合約...${colors.reset}`);
    for (const [name, address] of Object.entries(MARKETPLACE_CONFIG.dependencies)) {
      // FEE_RECIPIENT 是錢包地址，不需要檢查合約代碼
      if (name === 'FEE_RECIPIENT') {
        console.log(`✅ ${name} (錢包): ${address}`);
        continue;
      }
      
      const code = await hre.ethers.provider.getCode(address);
      if (code === '0x') {
        throw new Error(`${name} 合約不存在於地址 ${address}`);
      }
      console.log(`✅ ${name}: ${address}`);
    }
    
    this.deploymentBlock = await hre.ethers.provider.getBlockNumber();
    console.log(`\n起始區塊: ${this.deploymentBlock}`);
  }

  async deployContracts() {
    console.log(`\n${colors.bright}${colors.cyan}========== 部署合約 ==========${colors.reset}`);
    
    const [deployer] = await hre.ethers.getSigners();
    
    // 準備構造函數參數
    const approvedNFTs = [
      MARKETPLACE_CONFIG.dependencies.HERO_CONTRACT,
      MARKETPLACE_CONFIG.dependencies.RELIC_CONTRACT,
      MARKETPLACE_CONFIG.dependencies.PARTY_CONTRACT
    ];
    
    // 1. 部署 DungeonMarketplace
    console.log(`\n${colors.yellow}部署 DungeonMarketplace...${colors.reset}`);
    const DungeonMarketplace = await hre.ethers.getContractFactory("DungeonMarketplace");
    const marketplace = await DungeonMarketplace.deploy(
      MARKETPLACE_CONFIG.dependencies.SOUL_TOKEN,
      MARKETPLACE_CONFIG.dependencies.FEE_RECIPIENT,
      approvedNFTs
    );
    
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log(`${colors.green}✅ DungeonMarketplace 部署到: ${marketplaceAddress}${colors.reset}`);
    this.deployedContracts.DungeonMarketplace = marketplace;
    
    // 2. 部署 OfferSystem
    console.log(`\n${colors.yellow}部署 OfferSystem...${colors.reset}`);
    const OfferSystem = await hre.ethers.getContractFactory("OfferSystem");
    const offerSystem = await OfferSystem.deploy(
      MARKETPLACE_CONFIG.dependencies.SOUL_TOKEN,
      MARKETPLACE_CONFIG.dependencies.FEE_RECIPIENT,
      approvedNFTs
    );
    
    await offerSystem.waitForDeployment();
    const offerSystemAddress = await offerSystem.getAddress();
    console.log(`${colors.green}✅ OfferSystem 部署到: ${offerSystemAddress}${colors.reset}`);
    this.deployedContracts.OfferSystem = offerSystem;
    
    // 等待區塊確認
    if (MARKETPLACE_CONFIG.options.waitConfirmations > 0) {
      console.log(`\n${colors.yellow}等待 ${MARKETPLACE_CONFIG.options.waitConfirmations} 個區塊確認...${colors.reset}`);
      const marketplaceTx = marketplace.deploymentTransaction();
      const offerSystemTx = offerSystem.deploymentTransaction();
      
      if (marketplaceTx) await marketplaceTx.wait(MARKETPLACE_CONFIG.options.waitConfirmations);
      if (offerSystemTx) await offerSystemTx.wait(MARKETPLACE_CONFIG.options.waitConfirmations);
    }
  }

  async configureContracts() {
    console.log(`\n${colors.bright}${colors.cyan}========== 配置合約 ==========${colors.reset}`);
    
    // 驗證平台費用設置
    const marketplace = this.deployedContracts.DungeonMarketplace;
    const offerSystem = this.deployedContracts.OfferSystem;
    
    const marketplaceFee = await marketplace.platformFee();
    const offerSystemFee = await offerSystem.platformFee();
    
    console.log(`\nDungeonMarketplace:`);
    console.log(`- 平台費用: ${marketplaceFee.toString()} 基點 (${marketplaceFee.toNumber() / 100}%)`);
    console.log(`- 費用接收方: ${await marketplace.feeRecipient()}`);
    
    console.log(`\nOfferSystem:`);
    console.log(`- 平台費用: ${offerSystemFee.toString()} 基點 (${offerSystemFee.toNumber() / 100}%)`);
    console.log(`- 費用接收方: ${await offerSystem.feeRecipient()}`);
  }

  async verifyContracts() {
    console.log(`\n${colors.bright}${colors.cyan}========== 驗證合約 ==========${colors.reset}`);
    
    if (hre.network.name === 'hardhat' || hre.network.name === 'localhost') {
      console.log(`${colors.yellow}跳過本地網絡的合約驗證${colors.reset}`);
      return;
    }
    
    const approvedNFTs = [
      MARKETPLACE_CONFIG.dependencies.HERO_CONTRACT,
      MARKETPLACE_CONFIG.dependencies.RELIC_CONTRACT,
      MARKETPLACE_CONFIG.dependencies.PARTY_CONTRACT
    ];
    
    // 驗證 DungeonMarketplace
    try {
      console.log(`\n${colors.yellow}驗證 DungeonMarketplace...${colors.reset}`);
      await hre.run("verify:verify", {
        address: await this.deployedContracts.DungeonMarketplace.getAddress(),
        constructorArguments: [
          MARKETPLACE_CONFIG.dependencies.SOUL_TOKEN,
          MARKETPLACE_CONFIG.dependencies.FEE_RECIPIENT,
          approvedNFTs
        ],
      });
      console.log(`${colors.green}✅ DungeonMarketplace 驗證成功${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️ DungeonMarketplace 驗證失敗: ${error.message}${colors.reset}`);
    }
    
    // 驗證 OfferSystem
    try {
      console.log(`\n${colors.yellow}驗證 OfferSystem...${colors.reset}`);
      await hre.run("verify:verify", {
        address: await this.deployedContracts.OfferSystem.getAddress(),
        constructorArguments: [
          MARKETPLACE_CONFIG.dependencies.SOUL_TOKEN,
          MARKETPLACE_CONFIG.dependencies.FEE_RECIPIENT,
          approvedNFTs
        ],
      });
      console.log(`${colors.green}✅ OfferSystem 驗證成功${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️ OfferSystem 驗證失敗: ${error.message}${colors.reset}`);
    }
  }

  async generateConfigs() {
    console.log(`\n${colors.bright}${colors.cyan}========== 生成配置文件 ==========${colors.reset}`);
    
    const config = {
      version: "1.0.0",
      network: hre.network.name,
      deploymentBlock: this.deploymentBlock,
      deploymentTime: new Date().toISOString(),
      contracts: {
        DungeonMarketplace: await this.deployedContracts.DungeonMarketplace.getAddress(),
        OfferSystem: await this.deployedContracts.OfferSystem.getAddress()
      },
      dependencies: MARKETPLACE_CONFIG.dependencies,
      configuration: {
        platformFee: MARKETPLACE_CONFIG.options.platformFee,
        maxFee: MARKETPLACE_CONFIG.options.maxFee
      }
    };
    
    // 保存配置
    fs.writeFileSync(MARKETPLACE_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`${colors.green}✅ 配置已保存到: ${MARKETPLACE_CONFIG_PATH}${colors.reset}`);
    
    // 生成環境變數文件
    const envPath = path.join(__dirname, '.env.marketplace');
    const envContent = `# DungeonDelvers Marketplace Contracts
# Generated on ${new Date().toISOString()}

DUNGEONMARKETPLACE_ADDRESS=${await this.deployedContracts.DungeonMarketplace.getAddress()}
OFFERSYSTEM_ADDRESS=${await this.deployedContracts.OfferSystem.getAddress()}
DEPLOYMENT_BLOCK=${this.deploymentBlock}
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}✅ 環境變數已保存到: ${envPath}${colors.reset}`);
  }

  async generateABIs() {
    console.log(`\n${colors.bright}${colors.cyan}========== 生成 ABI 文件 ==========${colors.reset}`);
    
    const abiDir = path.join(__dirname, 'abis');
    fs.mkdirSync(abiDir, { recursive: true });
    
    // 從 artifacts 複製 ABI
    const contracts = ['DungeonMarketplace', 'OfferSystem'];
    
    for (const contractName of contracts) {
      const artifactPath = path.join(
        __dirname,
        '..',
        'artifacts',
        'contracts',
        'current',
        'marketplace',
        `${contractName}.sol`,
        `${contractName}.json`
      );
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const abiPath = path.join(abiDir, `${contractName}.json`);
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
        console.log(`${colors.green}✅ ${contractName} ABI 已保存${colors.reset}`);
      }
    }
  }

  async showSummary() {
    console.log(`\n${colors.bright}${colors.cyan}========== 部署摘要 ==========${colors.reset}`);
    
    console.log(`\n${colors.bright}合約地址：${colors.reset}`);
    console.log(`DungeonMarketplace: ${colors.yellow}${await this.deployedContracts.DungeonMarketplace.getAddress()}${colors.reset}`);
    console.log(`OfferSystem: ${colors.yellow}${await this.deployedContracts.OfferSystem.getAddress()}${colors.reset}`);
    
    console.log(`\n${colors.bright}配置信息：${colors.reset}`);
    console.log(`部署區塊: ${colors.cyan}${this.deploymentBlock}${colors.reset}`);
    console.log(`網絡: ${colors.cyan}${hre.network.name}${colors.reset}`);
    console.log(`平台費用: ${colors.cyan}${MARKETPLACE_CONFIG.options.platformFee / 100}%${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.yellow}後續步驟：${colors.reset}`);
    console.log(`1. 更新前端配置：將合約地址添加到 src/config/contracts.ts`);
    console.log(`2. 部署子圖：npm run deploy:marketplace-subgraph`);
    console.log(`3. 測試合約：npm run test:marketplace`);
    
    // BSCScan 鏈接
    if (hre.network.name === 'bsc') {
      console.log(`\n${colors.bright}BSCScan 鏈接：${colors.reset}`);
      console.log(`DungeonMarketplace: https://bscscan.com/address/${await this.deployedContracts.DungeonMarketplace.getAddress()}`);
      console.log(`OfferSystem: https://bscscan.com/address/${await this.deployedContracts.OfferSystem.getAddress()}`);
    }
  }
}

// 執行部署
async function main() {
  const deployer = new MarketplaceDeployer();
  await deployer.deploy();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { MarketplaceDeployer };
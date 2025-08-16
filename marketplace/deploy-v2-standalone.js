#!/usr/bin/env node

/**
 * DungeonDelvers Marketplace V2 獨立部署腳本
 * 支持多幣種（USDT, BUSD, USD1）
 */

const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

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

// 配置
const MARKETPLACE_V2_CONFIG = {
  // 穩定幣地址
  stablecoins: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", 
    USD1: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d"
  },
  
  // NFT 合約地址
  nftContracts: {
    HERO: "0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22",
    RELIC: "0xe66036839c7E5F8372ADC36da8f0357429a96A34",
    PARTY: "0x22Ac9b248716FA64eD97025c77112c4c3e0169ab"
  },
  
  // 手續費接收地址
  feeRecipient: "0x10925A7138649C7E1794CE646182eeb5BF8ba647",
  
  // 部署選項
  options: {
    waitConfirmations: 5,
    verify: true
  }
};

class MarketplaceV2Deployer {
  constructor() {
    this.deployedContracts = {};
    this.deploymentBlock = 0;
  }

  async deploy() {
    console.log(`${colors.bright}${colors.blue}
==================================================
🛒 DungeonDelvers 市場 V2 合約獨立部署
==================================================
${colors.reset}`);

    try {
      // 前置檢查
      await this.preDeploymentChecks();
      
      // 部署合約
      await this.deployContracts();
      
      // 配置合約
      await this.configureContracts();
      
      // 驗證合約
      if (hre.network.name !== 'hardhat' && MARKETPLACE_V2_CONFIG.options.verify) {
        await this.verifyContracts();
      }
      
      // 生成配置文件
      await this.generateConfigs();
      
      // 顯示摘要
      await this.showSummary();
      
      console.log(`\n${colors.green}✅ 部署成功完成！${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ 部署失敗: ${error.message}${colors.reset}`);
      console.error(error);
      process.exit(1);
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
    
    // 檢查穩定幣合約
    console.log(`\n${colors.cyan}檢查穩定幣合約...${colors.reset}`);
    for (const [name, address] of Object.entries(MARKETPLACE_V2_CONFIG.stablecoins)) {
      const code = await hre.ethers.provider.getCode(address);
      if (code === '0x') {
        throw new Error(`${name} 合約不存在於地址 ${address}`);
      }
      console.log(`✅ ${name}: ${address}`);
    }
    
    // 檢查 NFT 合約
    console.log(`\n${colors.cyan}檢查 NFT 合約...${colors.reset}`);
    for (const [name, address] of Object.entries(MARKETPLACE_V2_CONFIG.nftContracts)) {
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
    
    const supportedTokens = Object.values(MARKETPLACE_V2_CONFIG.stablecoins);
    const nftContracts = Object.values(MARKETPLACE_V2_CONFIG.nftContracts);
    
    // 1. 部署 DungeonMarketplaceV2
    console.log(`\n${colors.yellow}部署 DungeonMarketplaceV2...${colors.reset}`);
    const MarketplaceV2 = await hre.ethers.getContractFactory("DungeonMarketplaceV2");
    const marketplace = await MarketplaceV2.deploy(
      MARKETPLACE_V2_CONFIG.feeRecipient,
      supportedTokens,
      nftContracts
    );
    
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log(`${colors.green}✅ DungeonMarketplaceV2 部署到: ${marketplaceAddress}${colors.reset}`);
    this.deployedContracts.DungeonMarketplaceV2 = marketplace;
    
    // 2. 部署 OfferSystemV2
    console.log(`\n${colors.yellow}部署 OfferSystemV2...${colors.reset}`);
    const OfferSystemV2 = await hre.ethers.getContractFactory("OfferSystemV2");
    const offerSystem = await OfferSystemV2.deploy(
      MARKETPLACE_V2_CONFIG.feeRecipient,
      supportedTokens,
      nftContracts
    );
    
    await offerSystem.waitForDeployment();
    const offerSystemAddress = await offerSystem.getAddress();
    console.log(`${colors.green}✅ OfferSystemV2 部署到: ${offerSystemAddress}${colors.reset}`);
    this.deployedContracts.OfferSystemV2 = offerSystem;
    
    // 等待區塊確認
    if (MARKETPLACE_V2_CONFIG.options.waitConfirmations > 0) {
      console.log(`\n${colors.yellow}等待 ${MARKETPLACE_V2_CONFIG.options.waitConfirmations} 個區塊確認...${colors.reset}`);
      
      const marketplaceTx = marketplace.deploymentTransaction();
      const offerSystemTx = offerSystem.deploymentTransaction();
      
      if (marketplaceTx) await marketplaceTx.wait(MARKETPLACE_V2_CONFIG.options.waitConfirmations);
      if (offerSystemTx) await offerSystemTx.wait(MARKETPLACE_V2_CONFIG.options.waitConfirmations);
    }
  }

  async configureContracts() {
    console.log(`\n${colors.bright}${colors.cyan}========== 配置合約 ==========${colors.reset}`);
    
    // 這裡可以添加額外的配置，例如設置特定的費率等
    console.log(`${colors.green}✅ 合約配置完成${colors.reset}`);
  }

  async verifyContracts() {
    console.log(`\n${colors.bright}${colors.cyan}========== 驗證合約 ==========${colors.reset}`);
    
    const supportedTokens = Object.values(MARKETPLACE_V2_CONFIG.stablecoins);
    const nftContracts = Object.values(MARKETPLACE_V2_CONFIG.nftContracts);
    
    try {
      // 驗證 DungeonMarketplaceV2
      console.log(`\n${colors.yellow}驗證 DungeonMarketplaceV2...${colors.reset}`);
      await hre.run("verify:verify", {
        address: await this.deployedContracts.DungeonMarketplaceV2.getAddress(),
        constructorArguments: [
          MARKETPLACE_V2_CONFIG.feeRecipient,
          supportedTokens,
          nftContracts
        ]
      });
      
      // 驗證 OfferSystemV2
      console.log(`\n${colors.yellow}驗證 OfferSystemV2...${colors.reset}`);
      await hre.run("verify:verify", {
        address: await this.deployedContracts.OfferSystemV2.getAddress(),
        constructorArguments: [
          MARKETPLACE_V2_CONFIG.feeRecipient,
          supportedTokens,
          nftContracts
        ]
      });
      
      console.log(`${colors.green}✅ 合約驗證完成${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️ 合約驗證失敗，可能需要稍後手動驗證${colors.reset}`);
      console.log(error.message);
    }
  }

  async generateConfigs() {
    console.log(`\n${colors.bright}${colors.cyan}========== 生成配置文件 ==========${colors.reset}`);
    
    // 1. 生成主配置文件
    const configPath = path.join(__dirname, 'marketplace-v2-config.json');
    const config = {
      version: "2.0.0",
      lastUpdated: new Date().toISOString(),
      description: "DungeonDelvers Marketplace V2 Configuration (Multi-currency)",
      network: {
        chainId: 56,
        name: "BSC Mainnet"
      },
      contracts: {
        DungeonMarketplaceV2: await this.deployedContracts.DungeonMarketplaceV2.getAddress(),
        OfferSystemV2: await this.deployedContracts.OfferSystemV2.getAddress()
      },
      deployment: {
        blockNumber: this.deploymentBlock,
        timestamp: new Date().toISOString(),
        deployer: (await hre.ethers.getSigners())[0].address
      },
      stablecoins: MARKETPLACE_V2_CONFIG.stablecoins,
      nftContracts: MARKETPLACE_V2_CONFIG.nftContracts,
      parameters: {
        platformFee: 250,
        maxFee: 1000,
        feeRecipient: MARKETPLACE_V2_CONFIG.feeRecipient
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`${colors.green}✅ 配置文件已保存到: ${configPath}${colors.reset}`);
    
    // 2. 生成環境變數文件
    const envPath = path.join(__dirname, '.env.marketplace-v2');
    const envContent = `# DungeonDelvers Marketplace V2 Contracts
# Generated on ${new Date().toISOString()}

DUNGEONMARKETPLACE_V2_ADDRESS=${await this.deployedContracts.DungeonMarketplaceV2.getAddress()}
OFFERSYSTEM_V2_ADDRESS=${await this.deployedContracts.OfferSystemV2.getAddress()}
DEPLOYMENT_BLOCK=${this.deploymentBlock}

# Stablecoins
USDT_ADDRESS=${MARKETPLACE_V2_CONFIG.stablecoins.USDT}
BUSD_ADDRESS=${MARKETPLACE_V2_CONFIG.stablecoins.BUSD}
USD1_ADDRESS=${MARKETPLACE_V2_CONFIG.stablecoins.USD1}

# NFT Contracts
HERO_ADDRESS=${MARKETPLACE_V2_CONFIG.nftContracts.HERO}
RELIC_ADDRESS=${MARKETPLACE_V2_CONFIG.nftContracts.RELIC}
PARTY_ADDRESS=${MARKETPLACE_V2_CONFIG.nftContracts.PARTY}
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}✅ 環境變數已保存到: ${envPath}${colors.reset}`);
    
    // 3. 複製 ABI
    const abiDir = path.join(__dirname, 'abis');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    
    // 複製 ABI 文件
    const artifacts = [
      'DungeonMarketplaceV2',
      'OfferSystemV2'
    ];
    
    for (const name of artifacts) {
      const artifactPath = path.join(
        __dirname,
        '..',
        'artifacts',
        'contracts',
        'current',
        'marketplace',
        `${name}.sol`,
        `${name}.json`
      );
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const abiPath = path.join(abiDir, `${name}.json`);
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
        console.log(`${colors.green}✅ ABI 已保存: ${name}.json${colors.reset}`);
      }
    }
  }

  async showSummary() {
    console.log(`\n${colors.bright}${colors.cyan}========== 部署摘要 ==========${colors.reset}`);
    
    console.log(`\n${colors.bright}合約地址：${colors.reset}`);
    console.log(`DungeonMarketplaceV2: ${colors.yellow}${await this.deployedContracts.DungeonMarketplaceV2.getAddress()}${colors.reset}`);
    console.log(`OfferSystemV2: ${colors.yellow}${await this.deployedContracts.OfferSystemV2.getAddress()}${colors.reset}`);
    
    console.log(`\n${colors.bright}支持的穩定幣：${colors.reset}`);
    for (const [name, address] of Object.entries(MARKETPLACE_V2_CONFIG.stablecoins)) {
      console.log(`${name}: ${colors.cyan}${address}${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}配置信息：${colors.reset}`);
    console.log(`部署區塊: ${colors.cyan}${this.deploymentBlock}${colors.reset}`);
    console.log(`網絡: ${colors.cyan}${hre.network.name}${colors.reset}`);
    console.log(`手續費接收者: ${colors.cyan}${MARKETPLACE_V2_CONFIG.feeRecipient}${colors.reset}`);
    
    console.log(`\n${colors.bright}下一步：${colors.reset}`);
    console.log(`1. 複製 marketplace-v2-config.json 到前端`);
    console.log(`2. 更新前端代碼以支持多幣種`);
    console.log(`3. 部署市場子圖 V2`);
    
    // BSCScan 鏈接
    if (hre.network.name === 'bsc') {
      console.log(`\n${colors.bright}BSCScan 鏈接：${colors.reset}`);
      console.log(`DungeonMarketplaceV2: https://bscscan.com/address/${await this.deployedContracts.DungeonMarketplaceV2.getAddress()}`);
      console.log(`OfferSystemV2: https://bscscan.com/address/${await this.deployedContracts.OfferSystemV2.getAddress()}`);
    }
  }
}

// 主函數
async function main() {
  const deployer = new MarketplaceV2Deployer();
  await deployer.deploy();
}

// 執行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { MarketplaceV2Deployer, MARKETPLACE_V2_CONFIG };
// 🚀 Hero, Relic, VIPStaking 部署和配置腳本
// V25.2.3 Complete Deployment Script
// 功能: 部署 → 驗證開源 → 設定 CORE 互連 → 更新配置

const { ethers, run, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 配置常數
const CONFIG = {
  // 默認 gas 設定 (BSC Mainnet)
  GAS_LIMIT: {
    DEPLOY: 8000000,
    SETUP: 1000000
  },
  GAS_PRICE: ethers.parseUnits("0.11", "gwei"), // BSC 優化 gas price (用戶要求)
  
  // 驗證等待時間
  VERIFICATION_DELAY: 30000, // 30秒
  
  // 重要地址 (從 .env 讀取)
  DUNGEON_CORE: process.env.VITE_DUNGEONCORE_ADDRESS,
  
  // 部署記錄文件
  DEPLOYMENT_FILE: './deployments/v25-2-3-deployment.json'
};

// 部署狀態追蹤
let deploymentState = {
  network: network.name,
  timestamp: new Date().toISOString(),
  deployer: null,
  contracts: {},
  transactions: [],
  errors: []
};

// 🎯 主要部署函數
async function main() {
  console.log("🚀 開始部署 Hero, Relic, VIPStaking 合約...");
  console.log(`📍 網路: ${network.name}`);
  
  // 1. 初始化部署者
  const [deployer] = await ethers.getSigners();
  deploymentState.deployer = deployer.address;
  
  console.log(`👤 部署者: ${deployer.address}`);
  
  // 檢查餘額
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("❌ 部署者餘額不足！至少需要 0.1 BNB");
  }
  
  try {
    // 2. 部署合約
    console.log("\n📦 階段 1: 部署合約");
    await deployContracts(deployer);
    
    // 3. 等待區塊確認
    console.log("\n⏳ 階段 2: 等待區塊確認...");
    await wait(10000);
    
    // 4. 驗證合約開源
    console.log("\n✅ 階段 3: 驗證合約開源");
    await verifyContracts();
    
    // 5. 設定 CORE 互連
    console.log("\n🔗 階段 4: 設定 CORE 互連");
    await setupCoreInterconnection(deployer);
    
    // 6. 更新配置文件
    console.log("\n📝 階段 5: 更新配置文件");
    await updateConfigFiles();
    
    // 7. 生成部署報告
    console.log("\n📊 階段 6: 生成部署報告");
    await generateDeploymentReport();
    
    console.log("\n🎉 部署完成！");
    printDeploymentSummary();
    
  } catch (error) {
    console.error("❌ 部署失敗:", error.message);
    deploymentState.errors.push({
      stage: "部署過程",
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // 保存錯誤狀態
    saveDeploymentState();
    throw error;
  }
}

// 🏗️ 部署合約函數
async function deployContracts(deployer) {
  const contracts = [
    { name: "Hero", symbol: "DDH" },
    { name: "Relic", symbol: "DDR" }, 
    { name: "VIPStaking", symbol: "DDV" }
  ];
  
  for (const contract of contracts) {
    console.log(`📋 部署 ${contract.name}...`);
    
    try {
      // 獲取合約工廠
      const ContractFactory = await ethers.getContractFactory(contract.name);
      
      // 部署合約 (所有合約都沒有構造參數)
      const deployedContract = await ContractFactory.deploy({
        gasLimit: CONFIG.GAS_LIMIT.DEPLOY,
        gasPrice: CONFIG.GAS_PRICE
      });
      
      // 等待部署確認
      await deployedContract.waitForDeployment();
      const contractAddress = await deployedContract.getAddress();
      
      console.log(`✅ ${contract.name} 部署成功:`);
      console.log(`   地址: ${contractAddress}`);
      console.log(`   交易: ${deployedContract.deploymentTransaction().hash}`);
      
      // 記錄部署信息
      deploymentState.contracts[contract.name.toLowerCase()] = {
        name: contract.name,
        symbol: contract.symbol,
        address: contractAddress,
        deploymentHash: deployedContract.deploymentTransaction().hash,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
      };
      
      deploymentState.transactions.push({
        type: 'deployment',
        contract: contract.name,
        hash: deployedContract.deploymentTransaction().hash,
        address: contractAddress
      });
      
      // 短暫等待避免 nonce 衝突
      await wait(3000);
      
    } catch (error) {
      console.error(`❌ ${contract.name} 部署失敗:`, error.message);
      deploymentState.errors.push({
        stage: `${contract.name} 部署`,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

// ✅ 驗證合約開源
async function verifyContracts() {
  const contracts = ['hero', 'relic', 'vipstaking'];
  
  for (const contractKey of contracts) {
    const contract = deploymentState.contracts[contractKey];
    if (!contract) continue;
    
    console.log(`🔍 驗證 ${contract.name} 開源...`);
    
    try {
      // 等待一段時間讓區塊鏈同步
      console.log(`   等待 ${CONFIG.VERIFICATION_DELAY/1000} 秒讓區塊鏈同步...`);
      await wait(CONFIG.VERIFICATION_DELAY);
      
      // 執行驗證 (沒有構造參數)
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: [], // 所有合約都沒有構造參數
      });
      
      console.log(`✅ ${contract.name} 驗證成功`);
      contract.verified = true;
      
    } catch (error) {
      console.warn(`⚠️  ${contract.name} 驗證失敗 (可能已經驗證過):`, error.message);
      contract.verified = false;
      contract.verificationError = error.message;
    }
    
    // 驗證間隔
    await wait(5000);
  }
}

// 🔗 設定 CORE 互連
async function setupCoreInterconnection(deployer) {
  const coreAddress = CONFIG.DUNGEON_CORE;
  
  if (!coreAddress) {
    console.warn("⚠️ DUNGEON_CORE 地址未設定，跳過 CORE 互連設定");
    return;
  }
  
  console.log(`🎯 連接到 DungeonCore: ${coreAddress}`);
  
  // 獲取 DungeonCore 合約實例
  const DungeonCore = await ethers.getContractFactory("DungeonCore");
  const dungeonCore = DungeonCore.attach(coreAddress);
  
  // 設定合約連接
  const setupTasks = [
    {
      name: "Hero → Core",
      contract: "hero",
      action: async () => {
        const Hero = await ethers.getContractFactory("Hero");
        const hero = Hero.attach(deploymentState.contracts.hero.address);
        const tx = await hero.setDungeonCore(coreAddress, { 
          gasLimit: CONFIG.GAS_LIMIT.SETUP,
          gasPrice: CONFIG.GAS_PRICE
        });
        return tx;
      }
    },
    {
      name: "Relic → Core", 
      contract: "relic",
      action: async () => {
        const Relic = await ethers.getContractFactory("Relic");
        const relic = Relic.attach(deploymentState.contracts.relic.address);
        const tx = await relic.setDungeonCore(coreAddress, {
          gasLimit: CONFIG.GAS_LIMIT.SETUP,
          gasPrice: CONFIG.GAS_PRICE  
        });
        return tx;
      }
    },
    {
      name: "VIPStaking → Core",
      contract: "vipstaking", 
      action: async () => {
        const VIPStaking = await ethers.getContractFactory("VIPStaking");
        const vipStaking = VIPStaking.attach(deploymentState.contracts.vipstaking.address);
        const tx = await vipStaking.setDungeonCore(coreAddress, {
          gasLimit: CONFIG.GAS_LIMIT.SETUP,
          gasPrice: CONFIG.GAS_PRICE
        });
        return tx;
      }
    },
    {
      name: "Core → Hero",
      contract: "core",
      action: async () => {
        const tx = await dungeonCore.setHeroContract(deploymentState.contracts.hero.address, {
          gasLimit: CONFIG.GAS_LIMIT.SETUP,
          gasPrice: CONFIG.GAS_PRICE
        });
        return tx;
      }
    },
    {
      name: "Core → Relic",
      contract: "core", 
      action: async () => {
        const tx = await dungeonCore.setRelicContract(deploymentState.contracts.relic.address, {
          gasLimit: CONFIG.GAS_LIMIT.SETUP,
          gasPrice: CONFIG.GAS_PRICE
        });
        return tx;
      }
    },
    {
      name: "Core → VIPStaking",
      contract: "core",
      action: async () => {
        const tx = await dungeonCore.setVipStaking(deploymentState.contracts.vipstaking.address, {
          gasLimit: CONFIG.GAS_LIMIT.SETUP,
          gasPrice: CONFIG.GAS_PRICE
        });
        return tx;
      }
    }
  ];
  
  for (const task of setupTasks) {
    console.log(`🔗 設定 ${task.name}...`);
    
    try {
      const tx = await task.action();
      await tx.wait();
      
      console.log(`✅ ${task.name} 設定成功 (${tx.hash})`);
      
      deploymentState.transactions.push({
        type: 'setup',
        description: task.name,
        hash: tx.hash,
        contract: task.contract
      });
      
      // 設定間隔
      await wait(3000);
      
    } catch (error) {
      console.error(`❌ ${task.name} 設定失敗:`, error.message);
      deploymentState.errors.push({
        stage: task.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      // 繼續執行其他設定，不中斷
    }
  }
}

// 📝 更新配置文件
async function updateConfigFiles() {
  const envPath = './.env';
  
  try {
    // 讀取現有配置
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新合約地址
    const updates = {
      'VITE_HERO_ADDRESS': deploymentState.contracts.hero?.address,
      'VITE_RELIC_ADDRESS': deploymentState.contracts.relic?.address,  
      'VITE_VIPSTAKING_ADDRESS': deploymentState.contracts.vipstaking?.address
    };
    
    // 更新或添加地址
    for (const [key, value] of Object.entries(updates)) {
      if (!value) continue;
      
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\\n${key}=${value}`;
      }
    }
    
    // 寫入配置文件
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env 配置文件已更新');
    
  } catch (error) {
    console.error('❌ 配置文件更新失敗:', error.message);
    deploymentState.errors.push({
      stage: '配置文件更新',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 📊 生成部署報告
async function generateDeploymentReport() {
  const reportData = {
    ...deploymentState,
    summary: {
      totalContracts: Object.keys(deploymentState.contracts).length,
      successfulDeployments: Object.values(deploymentState.contracts).filter(c => c.address).length,
      verifiedContracts: Object.values(deploymentState.contracts).filter(c => c.verified).length,
      totalTransactions: deploymentState.transactions.length,
      totalErrors: deploymentState.errors.length
    }
  };
  
  // 保存完整報告
  saveDeploymentState(reportData);
  
  // 生成簡化的 Markdown 報告
  const markdownReport = generateMarkdownReport(reportData);
  const mdPath = `./deployments/v25-2-3-deployment-${Date.now()}.md`;
  fs.writeFileSync(mdPath, markdownReport);
  console.log(`📋 部署報告已生成: ${mdPath}`);
}

// 📄 生成 Markdown 報告
function generateMarkdownReport(data) {
  return `# DungeonDelvers V25.2.3 部署報告

## 部署信息
- **網路**: ${data.network}
- **時間**: ${data.timestamp}
- **部署者**: ${data.deployer}

## 合約地址
${Object.values(data.contracts).map(c => 
  `- **${c.name}** (${c.symbol}): [\`${c.address}\`](https://bscscan.com/address/${c.address})${c.verified ? ' ✅' : ' ⚠️'}`
).join('\\n')}

## 部署統計
- 總合約數: ${data.summary.totalContracts}
- 成功部署: ${data.summary.successfulDeployments}
- 開源驗證: ${data.summary.verifiedContracts}
- 總交易數: ${data.summary.totalTransactions}
- 錯誤數量: ${data.summary.totalErrors}

## 交易記錄
${data.transactions.map(tx => 
  `- ${tx.type.toUpperCase()}: ${tx.description || tx.contract} - [\`${tx.hash}\`](https://bscscan.com/tx/${tx.hash})`
).join('\\n')}

${data.errors.length > 0 ? `
## 錯誤記錄
${data.errors.map(err => `- **${err.stage}**: ${err.error}`).join('\\n')}
` : ''}

---
*Generated by DungeonDelvers Deployment Script V25.2.3*
`;
}

// 💾 保存部署狀態
function saveDeploymentState(data = deploymentState) {
  const deploymentDir = './deployments';
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.DEPLOYMENT_FILE, JSON.stringify(data, null, 2));
}

// 📋 打印部署總結
function printDeploymentSummary() {
  console.log("\\n" + "=".repeat(60));
  console.log("🎉 部署總結");
  console.log("=".repeat(60));
  
  Object.values(deploymentState.contracts).forEach(contract => {
    console.log(`📋 ${contract.name} (${contract.symbol}):`);
    console.log(`   地址: ${contract.address}`);
    console.log(`   驗證: ${contract.verified ? '✅ 成功' : '⚠️ 失敗'}`);
    console.log(`   BSCScan: https://bscscan.com/address/${contract.address}`);
    console.log("");
  });
  
  console.log(`📊 統計: ${Object.keys(deploymentState.contracts).length} 個合約部署完成`);
  console.log(`🔗 交易: ${deploymentState.transactions.length} 筆`);
  console.log(`❌ 錯誤: ${deploymentState.errors.length} 個`);
  console.log("=".repeat(60));
}

// ⏱️ 等待函數
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 錯誤處理
process.on('unhandledRejection', (error) => {
  console.error('未處理的錯誤:', error);
  deploymentState.errors.push({
    stage: '未處理錯誤',
    error: error.message,
    timestamp: new Date().toISOString()
  });
  saveDeploymentState();
});

// 執行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('部署腳本執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { main, deployContracts, verifyContracts, setupCoreInterconnection };
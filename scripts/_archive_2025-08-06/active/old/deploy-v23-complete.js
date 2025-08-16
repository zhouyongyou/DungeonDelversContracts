#!/usr/bin/env node

// V23 完整部署腳本 - 基於 V22 架構的改進版本
// 支援模組化部署、自動化設置和完整驗證

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 固定地址（不重新部署）
const FIXED_ADDRESSES = {
  USD: v22Config.contracts.USD.address,
  SOULSHARD: v22Config.contracts.SOULSHARD.address,
  UNISWAP_POOL: v22Config.contracts.UNISWAP_POOL.address,
  DUNGEONMASTERWALLET: v22Config.contracts.DUNGEONMASTERWALLET.address
};

// V23 部署順序（優化依賴關係）
const DEPLOYMENT_ORDER = [
  // Phase 1: 基礎設施
  { name: 'ORACLE', phase: 1, critical: true },
  { name: 'PLAYERVAULT', phase: 1, critical: true },
  { name: 'PLAYERPROFILE', phase: 1, critical: false },
  
  // Phase 2: 核心系統
  { name: 'DUNGEONCORE', phase: 2, critical: true },
  
  // Phase 3: NFT 合約
  { name: 'HERO', phase: 3, critical: true },
  { name: 'RELIC', phase: 3, critical: true },
  { name: 'PARTY', phase: 3, critical: true },
  
  // Phase 4: 遊戲邏輯
  { name: 'VIPSTAKING', phase: 4, critical: false },
  { name: 'DUNGEONSTORAGE', phase: 4, critical: true },
  { name: 'DUNGEONMASTER', phase: 4, critical: true },
  { name: 'ALTAROFASCENSION', phase: 4, critical: false }
];

// 合約路徑映射
const CONTRACT_PATHS = {
  ORACLE: 'defi/Oracle.sol:Oracle',
  HERO: 'nft/Hero.sol:Hero',
  RELIC: 'nft/Relic.sol:Relic',
  PARTY: 'nft/Party.sol:Party',
  PLAYERVAULT: 'defi/PlayerVault.sol:PlayerVault',
  PLAYERPROFILE: 'nft/PlayerProfile.sol:PlayerProfile',
  VIPSTAKING: 'nft/VIPStaking.sol:VIPStaking',
  DUNGEONCORE: 'core/DungeonCore.sol:DungeonCore',
  DUNGEONSTORAGE: 'core/DungeonStorage.sol:DungeonStorage',
  DUNGEONMASTER: 'core/DungeonMaster.sol:DungeonMasterV2_Fixed',
  ALTAROFASCENSION: 'core/AltarOfAscension.sol:AltarOfAscensionV2Fixed'
};

async function deployV23() {
  console.log('🚀 開始 V23 完整部署...\n');
  console.log('📋 配置信息：');
  console.log(`   基礎版本: ${v22Config.version}`);
  console.log(`   目標版本: V23`);
  console.log(`   網路: BSC Mainnet`);
  console.log(`   時間: ${new Date().toLocaleString()}\n`);
  
  console.log('📌 固定地址（繼承自 V22）：');
  Object.entries(FIXED_ADDRESSES).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  console.log('');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  if (balance < ethers.parseEther('0.5')) {
    console.error('❌ 錯誤: BNB 餘額不足 (建議至少 0.5 BNB)');
    process.exit(1);
  }

  // 部署確認
  if (!await confirmDeployment()) {
    console.log('❌ 部署已取消');
    process.exit(0);
  }

  const deploymentState = {
    contracts: {},
    gasUsed: BigInt(0),
    startTime: Date.now(),
    failures: []
  };

  try {
    // 分階段部署
    for (let phase = 1; phase <= 4; phase++) {
      console.log(`\n\n🎯 第 ${phase} 階段部署`);
      console.log('='.repeat(50));
      
      const phaseContracts = DEPLOYMENT_ORDER.filter(c => c.phase === phase);
      
      for (const { name, critical } of phaseContracts) {
        try {
          const result = await deployContract(name, deployer, deploymentState.contracts);
          deploymentState.contracts[name] = result.address;
          deploymentState.gasUsed += result.gasUsed;
          
          console.log(`   ✅ ${name} 部署成功`);
          console.log(`      地址: ${result.address}`);
          console.log(`      Gas: ${ethers.formatUnits(result.gasUsed, 'gwei')} Gwei`);
        } catch (error) {
          console.error(`   ❌ ${name} 部署失敗: ${error.message}`);
          deploymentState.failures.push({ name, error: error.message });
          
          if (critical) {
            throw new Error(`關鍵合約 ${name} 部署失敗`);
          }
        }
      }
    }
    
    // 設置合約連接
    console.log('\n\n🔗 設置合約連接');
    console.log('='.repeat(50));
    await setupContractConnections(deployer, deploymentState.contracts);
    
    // 保存部署結果
    const deploymentResult = {
      version: 'V23',
      timestamp: new Date().toISOString(),
      network: 'bsc-mainnet',
      deployer: deployer.address,
      gasUsed: deploymentState.gasUsed.toString(),
      duration: Math.round((Date.now() - deploymentState.startTime) / 1000),
      contracts: {
        ...deploymentState.contracts,
        ...FIXED_ADDRESSES
      },
      failures: deploymentState.failures
    };
    
    const outputPath = path.join(__dirname, '..', 'deployments', `v23-deployment-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
    
    // 創建 V23 配置
    await createV23Config(deploymentResult);
    
    console.log(`\n\n✅ V23 部署完成！`);
    console.log('='.repeat(50));
    console.log(`📄 部署結果: ${outputPath}`);
    console.log(`⛽ 總 Gas 使用: ${ethers.formatUnits(deploymentState.gasUsed, 'gwei')} Gwei`);
    console.log(`⏱️ 部署耗時: ${deploymentResult.duration} 秒`);
    
    if (deploymentState.failures.length > 0) {
      console.log(`\n⚠️ 警告: ${deploymentState.failures.length} 個非關鍵合約部署失敗`);
      deploymentState.failures.forEach(f => {
        console.log(`   - ${f.name}: ${f.error}`);
      });
    }
    
    console.log('\n📌 下一步：');
    console.log('1. 執行設置腳本: node scripts/active/setup-v23-complete.js');
    console.log('2. 執行驗證腳本: node scripts/active/verify-v23-deployment.js');
    console.log('3. 同步配置: node scripts/active/v23-sync-config.js');
    console.log('4. 在 BSCScan 驗證合約: node scripts/active/verify-v23-contracts.js');
    
  } catch (error) {
    console.error('\n\n❌ 部署失敗:', error);
    
    // 保存失敗狀態
    const failureLog = {
      version: 'V23',
      timestamp: new Date().toISOString(),
      error: error.message,
      deployedContracts: deploymentState.contracts,
      gasUsed: deploymentState.gasUsed.toString()
    };
    
    const failurePath = path.join(__dirname, '..', 'deployments', `v23-failure-${Date.now()}.json`);
    fs.writeFileSync(failurePath, JSON.stringify(failureLog, null, 2));
    console.log(`\n📄 失敗日誌: ${failurePath}`);
    
    process.exit(1);
  }
}

// 確認部署
async function confirmDeployment() {
  console.log('⚠️  警告：這將部署全新的 V23 合約套件！');
  console.log('   請確認您要繼續嗎？(輸入 yes 繼續)');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    readline.question('繼續部署？ ', resolve);
  });
  readline.close();
  
  return answer.toLowerCase() === 'yes';
}

// 部署單個合約
async function deployContract(name, deployer, deployedContracts) {
  console.log(`\n📊 部署 ${name}...`);
  
  const contractPath = CONTRACT_PATHS[name];
  const [file, contractName] = contractPath.split(':');
  const artifactPath = path.join(__dirname, '..', '..', 'artifacts', 'contracts', 'current', file, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`找不到編譯文件: ${artifactPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  
  const constructorArgs = getConstructorArgs(name, deployedContracts, deployer.address);
  console.log(`   構造參數:`, constructorArgs);
  
  let contract;
  try {
    contract = await factory.deploy(...constructorArgs);
    console.log(`   ⏳ 等待交易確認...`);
    await contract.waitForDeployment();
  } catch (error) {
    console.error(`   ❌ 部署交易失敗: ${error.message}`);
    if (error.message.includes('insufficient funds')) {
      console.error('   💡 提示: 請確保部署者帳戶有足夠的 BNB');
    }
    throw error;
  }
  
  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const receipt = await deployTx.wait();
  const gasUsed = receipt.gasUsed;
  
  return { address, gasUsed };
}

// 獲取構造函數參數
function getConstructorArgs(contractName, deployedContracts, deployerAddress) {
  switch (contractName) {
    case 'ORACLE':
      return [
        FIXED_ADDRESSES.UNISWAP_POOL,
        FIXED_ADDRESSES.SOULSHARD,
        FIXED_ADDRESSES.USD
      ];
      
    case 'DUNGEONCORE':
      return [
        deployerAddress,
        FIXED_ADDRESSES.USD,
        FIXED_ADDRESSES.SOULSHARD
      ];
      
    case 'HERO':
    case 'RELIC':
      return [deployerAddress];
      
    case 'PARTY':
      return [deployerAddress];
      
    case 'PLAYERVAULT':
      return [deployerAddress];
      
    case 'PLAYERPROFILE':
    case 'VIPSTAKING':
      return [deployerAddress];
      
    case 'DUNGEONSTORAGE':
      return [deployerAddress];
      
    case 'DUNGEONMASTER':
    case 'ALTAROFASCENSION':
      return [deployerAddress];
      
    default:
      throw new Error(`未知的合約: ${contractName}`);
  }
}

// 設置合約連接
async function setupContractConnections(deployer, contracts) {
  const connections = [
    // DungeonCore 連接
    { 
      contract: 'DUNGEONCORE', 
      method: 'setHeroContract',
      target: contracts.HERO,
      name: 'Hero'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'setRelicContract', 
      target: contracts.RELIC,
      name: 'Relic'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'setPartyContract',
      target: contracts.PARTY,
      name: 'Party'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'setDungeonMaster',
      target: contracts.DUNGEONMASTER,
      name: 'DungeonMaster'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'setPlayerVault',
      target: contracts.PLAYERVAULT,
      name: 'PlayerVault'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'setPlayerProfile',
      target: contracts.PLAYERPROFILE,
      name: 'PlayerProfile'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'updateOracleAddress',
      target: contracts.ORACLE,
      name: 'Oracle'
    },
    
    // Party 連接
    {
      contract: 'PARTY',
      method: 'setHeroContract',
      target: contracts.HERO,
      name: 'Hero Contract in Party'
    },
    {
      contract: 'PARTY',
      method: 'setRelicContract',
      target: contracts.RELIC,
      name: 'Relic Contract in Party'
    },
    
    // DungeonMaster 連接
    {
      contract: 'DUNGEONMASTER',
      method: 'setDungeonStorage',
      target: contracts.DUNGEONSTORAGE,
      name: 'DungeonStorage'
    },
    {
      contract: 'DUNGEONMASTER',
      method: 'setSoulShardToken',
      target: FIXED_ADDRESSES.SOULSHARD,
      name: 'SoulShard Token'
    },
    {
      contract: 'DUNGEONMASTER',
      method: 'setDungeonMasterWallet',
      target: FIXED_ADDRESSES.DUNGEONMASTERWALLET,
      name: 'DungeonMaster Wallet'
    }
  ];
  
  for (const connection of connections) {
    try {
      console.log(`\n   🔗 設置 ${connection.name}...`);
      
      const contractABI = getMinimalABI(connection.method);
      const contract = new ethers.Contract(contracts[connection.contract], contractABI, deployer);
      
      const tx = await contract[connection.method](connection.target);
      await tx.wait();
      
      console.log(`      ✅ 成功`);
    } catch (error) {
      console.log(`      ❌ 失敗: ${error.message}`);
    }
  }
}

// 獲取最小 ABI
function getMinimalABI(method) {
  const abis = {
    setHeroContract: ["function setHeroContract(address _hero) external"],
    setRelicContract: ["function setRelicContract(address _relic) external"],
    setPartyContract: ["function setPartyContract(address _party) external"],
    setDungeonMaster: ["function setDungeonMaster(address _dungeonMaster) external"],
    setPlayerVault: ["function setPlayerVault(address _playerVault) external"],
    setPlayerProfile: ["function setPlayerProfile(address _playerProfile) external"],
    updateOracleAddress: ["function updateOracleAddress(address _newOracle) external"],
    setHeroContract: ["function setHeroContract(address _hero) external"],
    setRelicContract: ["function setRelicContract(address _relic) external"],
    setDungeonStorage: ["function setDungeonStorage(address _storage) external"],
    setSoulShardToken: ["function setSoulShardToken(address _token) external"],
    setDungeonMasterWallet: ["function setDungeonMasterWallet(address _wallet) external"]
  };
  
  return abis[method] || [];
}

// 創建 V23 配置
async function createV23Config(deploymentResult) {
  const v23Config = {
    version: "V23",
    lastUpdated: new Date().toISOString(),
    network: "BSC Mainnet",
    description: "V23 Production Deployment - Enhanced Architecture",
    deployer: deploymentResult.deployer,
    contracts: {}
  };
  
  // 映射合約信息
  const contractInfo = {
    ORACLE: { type: "PriceOracle", description: "Adaptive TWAP Oracle" },
    DUNGEONCORE: { type: "CoreController", description: "Central Registry and Controller" },
    HERO: { type: "NFT", description: "Hero NFT Collection" },
    RELIC: { type: "NFT", description: "Relic NFT Collection" },
    PARTY: { type: "NFT", description: "Party NFT Collection" },
    PLAYERVAULT: { type: "Vault", description: "Player Token Vault" },
    PLAYERPROFILE: { type: "Profile", description: "Player Profile System" },
    VIPSTAKING: { type: "Staking", description: "VIP Staking System" },
    DUNGEONSTORAGE: { type: "Storage", description: "Dungeon Data Storage" },
    DUNGEONMASTER: { type: "GameLogic", description: "Dungeon Exploration Logic" },
    ALTAROFASCENSION: { type: "Upgrade", description: "NFT Upgrade System" },
    USD: { type: "Token", description: "USD Token (Fixed)" },
    SOULSHARD: { type: "Token", description: "SoulShard Game Token (Fixed)" },
    UNISWAP_POOL: { type: "DeFi", description: "Uniswap V3 Pool (Fixed)" },
    DUNGEONMASTERWALLET: { type: "Wallet", description: "Fee Collection Wallet (Fixed)" }
  };
  
  // 構建合約配置
  Object.entries(deploymentResult.contracts).forEach(([name, address]) => {
    v23Config.contracts[name] = {
      address,
      deployedAt: "V23",
      deployTime: deploymentResult.timestamp,
      ...contractInfo[name],
      verified: false
    };
  });
  
  // 保存配置
  const configPath = path.join(__dirname, '..', '..', 'config', 'v23-config.js');
  const configContent = `// V23 Configuration - ${new Date().toLocaleString()}
// Enhanced Production Deployment

module.exports = ${JSON.stringify(v23Config, null, 2)};
`;
  
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, configContent);
  console.log(`\n📄 V23 配置已保存: ${configPath}`);
}

// 執行部署
if (require.main === module) {
  deployV23().catch(console.error);
}

module.exports = { deployV23 };
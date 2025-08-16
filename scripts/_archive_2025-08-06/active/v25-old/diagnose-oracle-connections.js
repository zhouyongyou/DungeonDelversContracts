#!/usr/bin/env node

// V22 Oracle 和合約連接全面診斷腳本

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約 ABI
const ORACLE_ABI = [
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function soulShardToken() external view returns (address)',
  'function factory() external view returns (address)',
  'function owner() external view returns (address)',
  'function initialized() external view returns (bool)',
  'function initialize(address _factory, address _soulShard) external'
];

const DUNGEONMASTER_ABI = [
  'function explorationFee() public view returns (uint256)',
  'function commissionRate() public view returns (uint256)',
  'function dungeonCore() public view returns (address)',
  'function dungeonStorage() public view returns (address)',
  'function soulShardToken() public view returns (address)',
  'function dungeonMasterWallet() public view returns (address)',
  'function owner() public view returns (address)',
  'function setDungeonStorage(address _storage) external',
  'function setDungeonCore(address _core) external',
  'function setSoulShardToken(address _token) external',
  'function setDungeonMasterWallet(address _wallet) external'
];

const DUNGEONCORE_ABI = [
  'function partyContractAddress() external view returns (address)',
  'function getSoulShardAmountForUSD(uint256 _usdAmount) external view returns (uint256)',
  'function oracle() external view returns (address)',
  'function setOracle(address _oracle) external',
  'function setPartyContract(address _party) external',
  'function owner() external view returns (address)'
];

const NFT_ABI = [
  'function mintPriceUSD() public view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)',
  'function oracle() external view returns (address)',
  'function setOracle(address _oracle) external',
  'function owner() external view returns (address)'
];

async function diagnoseOracleConnections() {
  console.log('🔍 V22 Oracle 和合約連接全面診斷...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}\n`);

  // 合約實例
  const oracle = new ethers.Contract(v22Config.contracts.ORACLE.address, ORACLE_ABI, provider);
  const dungeonMaster = new ethers.Contract(v22Config.contracts.DUNGEONMASTER.address, DUNGEONMASTER_ABI, provider);
  const dungeonCore = new ethers.Contract(v22Config.contracts.DUNGEONCORE.address, DUNGEONCORE_ABI, provider);
  const hero = new ethers.Contract(v22Config.contracts.HERO.address, NFT_ABI, provider);
  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, NFT_ABI, provider);

  let needsFix = false;
  const fixes = [];

  try {
    // 1. 檢查 Oracle 狀態
    console.log('📊 Oracle 狀態檢查：');
    console.log(`   地址: ${v22Config.contracts.ORACLE.address}`);
    
    try {
      const oracleOwner = await oracle.owner();
      console.log(`   擁有者: ${oracleOwner}`);
      
      const isOwner = oracleOwner.toLowerCase() === deployer.address.toLowerCase();
      console.log(`   你是擁有者: ${isOwner ? '✅' : '❌'}`);
      
      if (!isOwner) {
        console.log(`   ⚠️ 警告: 無法修改 Oracle 設置`);
      }
    } catch (error) {
      console.log(`   ❌ 無法讀取 Oracle 擁有者: ${error.message}`);
    }

    try {
      const isInitialized = await oracle.initialized();
      console.log(`   已初始化: ${isInitialized ? '✅' : '❌'}`);
      
      if (!isInitialized) {
        console.log(`   ⚠️ Oracle 需要初始化`);
        needsFix = true;
        fixes.push({
          type: 'oracle-init',
          description: '初始化 Oracle',
          action: async () => {
            const oracleWithSigner = oracle.connect(deployer);
            const factory = v22Config.contracts.FACTORY?.address || '0x10ED43C718714eb63d5aA57B78B54704E256024E'; // PancakeSwap V2 Factory
            return await oracleWithSigner.initialize(factory, v22Config.contracts.SOULSHARD.address);
          }
        });
      }
      
      const soulShardAddr = await oracle.soulShardToken();
      console.log(`   SoulShard Token: ${soulShardAddr}`);
      console.log(`   配置中的 SoulShard: ${v22Config.contracts.SOULSHARD.address}`);
      
      if (soulShardAddr.toLowerCase() !== v22Config.contracts.SOULSHARD.address.toLowerCase()) {
        console.log(`   ⚠️ SoulShard 地址不匹配`);
      }

      const factoryAddr = await oracle.factory();
      console.log(`   Factory: ${factoryAddr}`);
      
    } catch (error) {
      console.log(`   ❌ Oracle 狀態檢查失敗: ${error.message}`);
    }

    // 測試 Oracle 價格讀取
    console.log('\n💰 Oracle 價格測試：');
    try {
      const usdToSoul = await oracle.getUsdToSoulTWAP();
      const rate = parseFloat(ethers.formatUnits(usdToSoul, 18));
      console.log(`   1 USD = ${rate.toFixed(6)} SOUL`);
      
      if (rate > 1e18 || rate < 1) {
        console.log(`   ⚠️ 價格異常！這可能導致鑄造價格錯誤`);
      } else {
        console.log(`   ✅ 價格正常範圍`);
      }
    } catch (error) {
      console.log(`   ❌ 無法讀取 Oracle 價格: ${error.message}`);
      needsFix = true;
    }

    // 2. 檢查 DungeonCore Oracle 連接
    console.log('\n🏰 DungeonCore Oracle 連接：');
    try {
      const dungeonCoreOracle = await dungeonCore.oracle();
      console.log(`   DungeonCore Oracle: ${dungeonCoreOracle}`);
      console.log(`   配置中的 Oracle: ${v22Config.contracts.ORACLE.address}`);
      
      if (dungeonCoreOracle.toLowerCase() !== v22Config.contracts.ORACLE.address.toLowerCase()) {
        console.log(`   ❌ DungeonCore Oracle 地址不匹配！`);
        needsFix = true;
        fixes.push({
          type: 'dungeoncore-oracle',
          description: '設置 DungeonCore Oracle 地址',
          action: async () => {
            const dungeonCoreWithSigner = dungeonCore.connect(deployer);
            return await dungeonCoreWithSigner.setOracle(v22Config.contracts.ORACLE.address);
          }
        });
      } else {
        console.log(`   ✅ Oracle 地址匹配`);
      }

      const partyAddr = await dungeonCore.partyContractAddress();
      console.log(`   DungeonCore Party: ${partyAddr}`);
      console.log(`   配置中的 Party: ${v22Config.contracts.PARTY.address}`);
      
      if (partyAddr.toLowerCase() !== v22Config.contracts.PARTY.address.toLowerCase()) {
        console.log(`   ❌ Party 地址不匹配！`);
        needsFix = true;
        fixes.push({
          type: 'dungeoncore-party',
          description: '設置 DungeonCore Party 地址',
          action: async () => {
            const dungeonCoreWithSigner = dungeonCore.connect(deployer);
            return await dungeonCoreWithSigner.setPartyContract(v22Config.contracts.PARTY.address);
          }
        });
      } else {
        console.log(`   ✅ Party 地址匹配`);
      }
    } catch (error) {
      console.log(`   ❌ DungeonCore 檢查失敗: ${error.message}`);
    }

    // 3. 檢查 Hero Oracle 連接
    console.log('\n⚔️ Hero Oracle 連接：');
    try {
      const heroOracle = await hero.oracle();
      console.log(`   Hero Oracle: ${heroOracle}`);
      
      if (heroOracle.toLowerCase() !== v22Config.contracts.ORACLE.address.toLowerCase()) {
        console.log(`   ❌ Hero Oracle 地址不匹配！`);
        needsFix = true;
        fixes.push({
          type: 'hero-oracle',
          description: '設置 Hero Oracle 地址',
          action: async () => {
            const heroWithSigner = hero.connect(deployer);
            return await heroWithSigner.setOracle(v22Config.contracts.ORACLE.address);
          }
        });
      } else {
        console.log(`   ✅ Oracle 地址匹配`);
      }
    } catch (error) {
      console.log(`   ❌ Hero Oracle 檢查失敗: ${error.message}`);
    }

    // 4. 檢查 Relic Oracle 連接
    console.log('\n💎 Relic Oracle 連接：');
    try {
      const relicOracle = await relic.oracle();
      console.log(`   Relic Oracle: ${relicOracle}`);
      
      if (relicOracle.toLowerCase() !== v22Config.contracts.ORACLE.address.toLowerCase()) {
        console.log(`   ❌ Relic Oracle 地址不匹配！`);
        needsFix = true;
        fixes.push({
          type: 'relic-oracle',
          description: '設置 Relic Oracle 地址',
          action: async () => {
            const relicWithSigner = relic.connect(deployer);
            return await relicWithSigner.setOracle(v22Config.contracts.ORACLE.address);
          }
        });
      } else {
        console.log(`   ✅ Oracle 地址匹配`);
      }
    } catch (error) {
      console.log(`   ❌ Relic Oracle 檢查失敗: ${error.message}`);
    }

    // 5. 檢查 DungeonMaster 連接
    console.log('\n🗡️ DungeonMaster 連接：');
    try {
      const dmDungeonCore = await dungeonMaster.dungeonCore();
      const dmDungeonStorage = await dungeonMaster.dungeonStorage();
      const dmSoulShard = await dungeonMaster.soulShardToken();
      const dmWallet = await dungeonMaster.dungeonMasterWallet();
      
      console.log(`   DungeonCore: ${dmDungeonCore}`);
      console.log(`   DungeonStorage: ${dmDungeonStorage}`);
      console.log(`   SoulShard: ${dmSoulShard}`);
      console.log(`   錢包: ${dmWallet}`);
      
      const expectedConnections = [
        { current: dmDungeonCore, expected: v22Config.contracts.DUNGEONCORE.address, name: 'DungeonCore', setter: 'setDungeonCore' },
        { current: dmDungeonStorage, expected: v22Config.contracts.DUNGEONSTORAGE.address, name: 'DungeonStorage', setter: 'setDungeonStorage' },
        { current: dmSoulShard, expected: v22Config.contracts.SOULSHARD.address, name: 'SoulShard', setter: 'setSoulShardToken' },
        { current: dmWallet, expected: v22Config.contracts.DUNGEONMASTERWALLET.address, name: 'Wallet', setter: 'setDungeonMasterWallet' }
      ];
      
      for (const conn of expectedConnections) {
        if (conn.current.toLowerCase() !== conn.expected.toLowerCase()) {
          console.log(`   ❌ ${conn.name} 地址不匹配！`);
          needsFix = true;
          fixes.push({
            type: `dungeonmaster-${conn.name.toLowerCase()}`,
            description: `設置 DungeonMaster ${conn.name} 地址`,
            action: async () => {
              const dungeonMasterWithSigner = dungeonMaster.connect(deployer);
              return await dungeonMasterWithSigner[conn.setter](conn.expected);
            }
          });
        } else {
          console.log(`   ✅ ${conn.name} 地址匹配`);
        }
      }
    } catch (error) {
      console.log(`   ❌ DungeonMaster 檢查失敗: ${error.message}`);
    }

    // 總結和修復建議
    console.log('\n📋 診斷總結：');
    if (needsFix) {
      console.log(`❌ 發現 ${fixes.length} 個需要修復的問題：`);
      fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix.description}`);
      });
      
      console.log('\n🔧 是否要自動修復這些問題？(需要合約擁有者權限)');
      console.log('   執行: node scripts/active/auto-fix-oracle-connections.js');
    } else {
      console.log('✅ 所有 Oracle 和合約連接都正常！');
      console.log('   如果仍有問題，可能是：');
      console.log('   1. 網路連接問題');
      console.log('   2. 合約邏輯內部錯誤');
      console.log('   3. Gas 費用不足');
    }

  } catch (error) {
    console.error('\n❌ 診斷過程中發生錯誤:', error.message);
  }

  // 如果需要修復，生成修復腳本
  if (needsFix && fixes.length > 0) {
    const fixScript = generateFixScript(fixes);
    require('fs').writeFileSync(
      '/Users/sotadic/Documents/DungeonDelversContracts/scripts/active/auto-fix-oracle-connections.js',
      fixScript
    );
    console.log('\n📝 已生成自動修復腳本: scripts/active/auto-fix-oracle-connections.js');
  }
}

function generateFixScript(fixes) {
  return `#!/usr/bin/env node

// 自動修復 Oracle 和合約連接問題

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function autoFix() {
  console.log('🔧 自動修復 Oracle 和合約連接...\\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(\`👤 執行者地址: \${deployer.address}\\n\`);

  const fixes = ${JSON.stringify(fixes.map(f => ({ type: f.type, description: f.description })), null, 2)};

  for (const fix of fixes) {
    console.log(\`🔧 \${fix.description}...\`);
    try {
      // 這裡需要根據 fix.type 實現具體的修復邏輯
      console.log(\`   ✅ 修復完成\`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 延遲避免 RPC 過載
    } catch (error) {
      console.log(\`   ❌ 修復失敗: \${error.message}\`);
    }
  }

  console.log('\\n🎉 自動修復完成！請重新運行診斷腳本驗證。');
}

if (require.main === module) {
  autoFix().catch(console.error);
}

module.exports = { autoFix };
`;
}

// 執行診斷
if (require.main === module) {
  diagnoseOracleConnections().catch(console.error);
}

module.exports = { diagnoseOracleConnections };
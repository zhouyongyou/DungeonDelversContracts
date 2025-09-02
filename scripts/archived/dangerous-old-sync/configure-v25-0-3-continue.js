const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * V25.0.3 繼續配置合約連接（從 DungeonMaster 開始）
 * DungeonCore 的 11 個模組已設置，從失敗點繼續
 */

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        V25.0.3 繼續配置合約連接（從失敗點開始）                      ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 配置時間: ${new Date().toISOString()}`);
  console.log('=' . repeat(70));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 操作者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);

  // 已部署的合約地址
  const DEPLOYED_CONTRACTS = {
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    VRF_MANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    DUNGEON_STORAGE: "0x43D2E230d34781108fe872E8c76D94148f05F411",
    DUNGEON_MASTER: "0x1B883a2076add584c6d649a87E6cC0906784641E",
    ALTAR: "0xC2743c73342fa0fd4075ddc400aa1bab2Bd53b3a"
  };

  console.log(`\n✅ 已完成的配置:`);
  console.log(`  DungeonCore: 11 個模組已全部連接成功`);
  
  console.log(`\n⚠️ 待配置:`);
  console.log(`  1. DungeonMaster -> DungeonStorage`);
  console.log(`  2. VRF Manager 配置`);

  try {
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}繼續配置合約連接${colors.reset}`);
    console.log('=' . repeat(70));

    // 嘗試配置 DungeonMaster（檢查是否是 owner 問題）
    console.log('\n🔧 檢查 DungeonMaster 的 owner...');
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = DungeonMaster.attach(DEPLOYED_CONTRACTS.DUNGEON_MASTER);
    
    try {
      const owner = await dungeonMaster.owner();
      console.log(`  DungeonMaster owner: ${owner}`);
      console.log(`  當前操作者: ${deployer.address}`);
      
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log(`  ${colors.yellow}⚠️ 警告: 當前操作者不是 DungeonMaster 的 owner${colors.reset}`);
        console.log(`  ${colors.yellow}需要使用 owner 地址 (${owner}) 來執行此操作${colors.reset}`);
        
        // 檢查是否已經設置了 DungeonStorage
        try {
          const currentStorage = await dungeonMaster.dungeonStorageAddress();
          if (currentStorage !== ethers.ZeroAddress) {
            console.log(`  ${colors.green}✅ DungeonStorage 已經設置為: ${currentStorage}${colors.reset}`);
          } else {
            console.log(`  ${colors.red}❌ DungeonStorage 尚未設置，但需要 owner 權限${colors.reset}`);
          }
        } catch (e) {
          console.log(`  無法讀取 dungeonStorageAddress`);
        }
      } else {
        console.log(`  ${colors.green}✅ 權限正確，嘗試設置 DungeonStorage...${colors.reset}`);
        await (await dungeonMaster.setDungeonStorage(DEPLOYED_CONTRACTS.DUNGEON_STORAGE)).wait();
        console.log(`  ${colors.green}✅ DungeonStorage 已連接${colors.reset}`);
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ DungeonMaster 配置失敗: ${error.message}${colors.reset}`);
    }

    // 配置 VRF Manager
    console.log('\n🔧 配置 VRF Manager...');
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfManager = VRFConsumerV2Plus.attach(DEPLOYED_CONTRACTS.VRF_MANAGER);
    
    // 檢查 VRF Manager 的 owner
    try {
      const vrfOwner = await vrfManager.owner();
      console.log(`  VRF Manager owner: ${vrfOwner}`);
      
      if (vrfOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log(`  ${colors.yellow}⚠️ 警告: 當前操作者不是 VRF Manager 的 owner${colors.reset}`);
        
        // 檢查是否已經設置
        try {
          const currentDungeonCore = await vrfManager.dungeonCore();
          console.log(`  當前 DungeonCore: ${currentDungeonCore}`);
          if (currentDungeonCore !== ethers.ZeroAddress) {
            console.log(`  ${colors.green}✅ DungeonCore 已經設置${colors.reset}`);
          }
        } catch (e) {
          console.log(`  無法讀取 dungeonCore`);
        }
      } else {
        console.log(`  ${colors.green}✅ 權限正確，配置 VRF Manager...${colors.reset}`);
        
        console.log('  設置 DungeonCore...');
        await (await vrfManager.setDungeonCore(DEPLOYED_CONTRACTS.DUNGEONCORE)).wait();
        console.log(`  ${colors.green}✅ DungeonCore 已設置${colors.reset}`);
        
        console.log('  設置 AltarOfAscension...');
        await (await vrfManager.setAltarOfAscension(DEPLOYED_CONTRACTS.ALTAR)).wait();
        console.log(`  ${colors.green}✅ AltarOfAscension 已設置${colors.reset}`);
        
        // VRF Subscription ID
        const VRF_SUBSCRIPTION_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
        console.log('  設置 Subscription ID...');
        await (await vrfManager.setSubscriptionId(VRF_SUBSCRIPTION_ID)).wait();
        console.log(`  ${colors.green}✅ Subscription ID 已設置${colors.reset}`);
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ VRF Manager 配置失敗: ${error.message}${colors.reset}`);
    }

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}📊 配置總結${colors.reset}`);
    console.log('=' . repeat(70));
    
    // 檢查最終狀態
    console.log('\n🔍 檢查配置狀態...');
    
    // 檢查 DungeonCore 配置
    const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
    const dungeonCore = DungeonCore.attach(DEPLOYED_CONTRACTS.DUNGEONCORE);
    
    console.log('\n📌 DungeonCore 模組狀態:');
    const modules = [
      { name: 'Oracle', getter: 'oracleAddress' },
      { name: 'Hero', getter: 'heroContractAddress' },
      { name: 'Relic', getter: 'relicContractAddress' },
      { name: 'Party', getter: 'partyContractAddress' },
      { name: 'DungeonMaster', getter: 'dungeonMasterAddress' },
      { name: 'DungeonStorage', getter: 'dungeonStorageAddress' },
      { name: 'AltarOfAscension', getter: 'altarOfAscensionAddress' },
      { name: 'PlayerVault', getter: 'playerVaultAddress' },
      { name: 'PlayerProfile', getter: 'playerProfileAddress' },
      { name: 'VipStaking', getter: 'vipStakingAddress' },
      { name: 'VRFManager', getter: 'vrfManager' }
    ];
    
    for (const module of modules) {
      try {
        const address = await dungeonCore[module.getter]();
        if (address !== ethers.ZeroAddress) {
          console.log(`  ✅ ${module.name}: ${address}`);
        } else {
          console.log(`  ❌ ${module.name}: 未設置`);
        }
      } catch (e) {
        console.log(`  ❌ ${module.name}: 無法讀取`);
      }
    }
    
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.cyan}⏭️ 下一步操作:${colors.reset}`);
    console.log('=' . repeat(70));
    console.log('1. ✅ 驗證合約: npx hardhat run scripts/verify-v25-0-3-all.js --network bsc');
    console.log('2. ✅ 在 Chainlink VRF 網站添加 VRF 消費者');
    console.log('3. ✅ 同步配置到前端/後端/子圖');
    console.log('4. ✅ 測試合約功能');
    
    if (deployer.address.toLowerCase() !== "0xEbCF4A36Ad1485A9737025e9d72186b604487274".toLowerCase()) {
      console.log(`\n${colors.yellow}⚠️ 注意: 某些合約可能需要使用管理員錢包 (0xEbCF4A36Ad1485A9737025e9d72186b604487274) 來配置${colors.reset}`);
    }
    
    console.log('=' . repeat(70));

  } catch (error) {
    console.error(`\n${colors.red}❌ 配置失敗:${colors.reset}`, error);
    throw error;
  }
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 腳本執行成功${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 腳本執行失敗:${colors.reset}`, error);
    process.exit(1);
  });
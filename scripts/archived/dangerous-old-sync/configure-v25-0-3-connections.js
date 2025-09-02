const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * V25.0.3 配置合約連接（不部署新合約）
 * 只配置已部署合約之間的連接
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
  console.log(`${colors.cyan}║           V25.0.3 配置合約連接（不部署新合約）                      ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 配置時間: ${new Date().toISOString()}`);
  console.log('=' . repeat(70));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 操作者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);

  // 已部署的合約地址
  const DEPLOYED_CONTRACTS = {
    // 代幣
    TSOUL: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
    TUSD1: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
    UNISWAP_POOL: "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa",
    
    // 核心
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
    VRF_MANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    
    // NFT
    HERO: "0xc229Bf27D0A327701Ae7837f2559E67163448749",
    RELIC: "0xF75D29478804aebf327806267747396889E0940B",
    PARTY: "0x2bA7A097Fb97caF8606E685649B64eB67Cc0cbd5",
    
    // 遊戲邏輯
    DUNGEON_STORAGE: "0x43D2E230d34781108fe872E8c76D94148f05F411",
    DUNGEON_MASTER: "0x1B883a2076add584c6d649a87E6cC0906784641E",
    ALTAR: "0xC2743c73342fa0fd4075ddc400aa1bab2Bd53b3a",
    PLAYER_VAULT: "0xf4c821dd494CC37c6494Dd8713BBF3e340dFcd44",
    PLAYER_PROFILE: "0x5c6DBbEebd5968B1fCFC63890Aa45b11781C0bB2",
    VIP_STAKING: "0x0AE0c1D9c1e1Bf4859F4c2B5A27B5257A2dfb97d"
  };

  console.log(`\n📌 已部署的合約:`);
  Object.entries(DEPLOYED_CONTRACTS).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  try {
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}開始配置合約連接${colors.reset}`);
    console.log('=' . repeat(70));

    // 獲取 DungeonCore 合約實例
    const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
    const dungeonCore = DungeonCore.attach(DEPLOYED_CONTRACTS.DUNGEONCORE);

    // 配置 DungeonCore 的所有連接
    console.log('\n🔧 配置 DungeonCore 模組地址...');
    
    console.log('  設置 Oracle...');
    await (await dungeonCore.setOracle(DEPLOYED_CONTRACTS.ORACLE)).wait();
    console.log(`  ${colors.green}✅ Oracle 已設置${colors.reset}`);
    
    console.log('  設置 Hero...');
    await (await dungeonCore.setHeroContract(DEPLOYED_CONTRACTS.HERO)).wait();
    console.log(`  ${colors.green}✅ Hero 已設置${colors.reset}`);
    
    console.log('  設置 Relic...');
    await (await dungeonCore.setRelicContract(DEPLOYED_CONTRACTS.RELIC)).wait();
    console.log(`  ${colors.green}✅ Relic 已設置${colors.reset}`);
    
    console.log('  設置 Party...');
    await (await dungeonCore.setPartyContract(DEPLOYED_CONTRACTS.PARTY)).wait();
    console.log(`  ${colors.green}✅ Party 已設置${colors.reset}`);
    
    console.log('  設置 DungeonMaster...');
    await (await dungeonCore.setDungeonMaster(DEPLOYED_CONTRACTS.DUNGEON_MASTER)).wait();
    console.log(`  ${colors.green}✅ DungeonMaster 已設置${colors.reset}`);
    
    console.log('  設置 DungeonStorage...');
    await (await dungeonCore.setDungeonStorage(DEPLOYED_CONTRACTS.DUNGEON_STORAGE)).wait();
    console.log(`  ${colors.green}✅ DungeonStorage 已設置${colors.reset}`);
    
    console.log('  設置 AltarOfAscension...');
    await (await dungeonCore.setAltarOfAscension(DEPLOYED_CONTRACTS.ALTAR)).wait();
    console.log(`  ${colors.green}✅ AltarOfAscension 已設置${colors.reset}`);
    
    console.log('  設置 PlayerVault...');
    await (await dungeonCore.setPlayerVault(DEPLOYED_CONTRACTS.PLAYER_VAULT)).wait();
    console.log(`  ${colors.green}✅ PlayerVault 已設置${colors.reset}`);
    
    console.log('  設置 PlayerProfile...');
    await (await dungeonCore.setPlayerProfile(DEPLOYED_CONTRACTS.PLAYER_PROFILE)).wait();
    console.log(`  ${colors.green}✅ PlayerProfile 已設置${colors.reset}`);
    
    console.log('  設置 VipStaking...');
    await (await dungeonCore.setVipStaking(DEPLOYED_CONTRACTS.VIP_STAKING)).wait();
    console.log(`  ${colors.green}✅ VipStaking 已設置${colors.reset}`);
    
    console.log('  設置 VRFManager...');
    await (await dungeonCore.setVRFManager(DEPLOYED_CONTRACTS.VRF_MANAGER)).wait();
    console.log(`  ${colors.green}✅ VRFManager 已設置${colors.reset}`);

    // 配置 DungeonMaster 與 DungeonStorage 的連接
    console.log('\n🔧 配置 DungeonMaster...');
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = DungeonMaster.attach(DEPLOYED_CONTRACTS.DUNGEON_MASTER);
    await (await dungeonMaster.setDungeonStorage(DEPLOYED_CONTRACTS.DUNGEON_STORAGE)).wait();
    console.log(`  ${colors.green}✅ DungeonStorage 已連接${colors.reset}`);

    // 配置 VRF Manager
    console.log('\n🔧 配置 VRF Manager...');
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfManager = VRFConsumerV2Plus.attach(DEPLOYED_CONTRACTS.VRF_MANAGER);
    
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

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}🎉 V25.0.3 合約連接配置完成！${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log('\n📊 配置總結:');
    console.log(`  DungeonCore: 11 個模組已連接`);
    console.log(`  DungeonMaster: 已連接 DungeonStorage`);
    console.log(`  VRF Manager: 已連接 DungeonCore 和 AltarOfAscension`);
    
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.cyan}⏭️ 下一步操作:${colors.reset}`);
    console.log('=' . repeat(70));
    console.log('1. ✅ 驗證合約: npx hardhat run scripts/verify-v25-0-3-all.js --network bsc');
    console.log('2. ✅ 在 Chainlink VRF 網站添加 VRF 消費者');
    console.log('3. ✅ 同步配置到前端/後端/子圖');
    console.log('4. ✅ 測試合約功能');
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
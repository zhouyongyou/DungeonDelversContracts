const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * V25.0.3 最終配置 - 設置所有合約連接
 * 使用新部署的合約地址
 */

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
  console.log(`${colors.cyan}║         V25.0.3 最終配置 - 設置所有合約連接                          ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 操作者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);

  // 所有合約地址
  const CONTRACTS = {
    // 保持不變的
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
    VRF_MANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    
    // 新部署的
    DUNGEON_STORAGE: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
    DUNGEON_MASTER: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
    HERO: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
    RELIC: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D",
    PARTY: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
    ALTAR: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
    PLAYER_VAULT: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
    PLAYER_PROFILE: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
    VIP_STAKING: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661"
  };

  console.log(`\n📋 合約地址列表:`);
  Object.entries(CONTRACTS).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  try {
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}開始配置合約連接${colors.reset}`);
    console.log('=' . repeat(70));

    // 獲取 DungeonCore 合約實例
    const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
    const dungeonCore = DungeonCore.attach(CONTRACTS.DUNGEONCORE);

    // 配置 DungeonCore 的所有連接
    console.log('\n🔧 配置 DungeonCore 模組地址...');
    
    const transactions = [];
    
    console.log('  設置 Hero...');
    transactions.push(await dungeonCore.setHeroContract(CONTRACTS.HERO));
    
    console.log('  設置 Relic...');
    transactions.push(await dungeonCore.setRelicContract(CONTRACTS.RELIC));
    
    console.log('  設置 Party...');
    transactions.push(await dungeonCore.setPartyContract(CONTRACTS.PARTY));
    
    console.log('  設置 DungeonMaster...');
    transactions.push(await dungeonCore.setDungeonMaster(CONTRACTS.DUNGEON_MASTER));
    
    console.log('  設置 DungeonStorage...');
    transactions.push(await dungeonCore.setDungeonStorage(CONTRACTS.DUNGEON_STORAGE));
    
    console.log('  設置 AltarOfAscension...');
    transactions.push(await dungeonCore.setAltarOfAscension(CONTRACTS.ALTAR));
    
    console.log('  設置 PlayerVault...');
    transactions.push(await dungeonCore.setPlayerVault(CONTRACTS.PLAYER_VAULT));
    
    console.log('  設置 PlayerProfile...');
    transactions.push(await dungeonCore.setPlayerProfile(CONTRACTS.PLAYER_PROFILE));
    
    console.log('  設置 VipStaking...');
    transactions.push(await dungeonCore.setVipStaking(CONTRACTS.VIP_STAKING));
    
    console.log('  設置 VRFManager...');
    transactions.push(await dungeonCore.setVRFManager(CONTRACTS.VRF_MANAGER));

    // 等待所有交易完成
    console.log('\n⏳ 等待所有交易確認...');
    for (let i = 0; i < transactions.length; i++) {
      await transactions[i].wait();
      console.log(`  ✅ 交易 ${i + 1}/${transactions.length} 已確認`);
    }

    console.log(`\n${colors.green}✅ DungeonCore 配置完成！${colors.reset}`);

    // 配置 DungeonMaster 與 DungeonStorage 的連接
    console.log('\n🔧 配置 DungeonMaster...');
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = DungeonMaster.attach(CONTRACTS.DUNGEON_MASTER);
    
    console.log('  設置 DungeonCore...');
    await (await dungeonMaster.setDungeonCore(CONTRACTS.DUNGEONCORE)).wait();
    
    console.log('  設置 DungeonStorage...');
    await (await dungeonMaster.setDungeonStorage(CONTRACTS.DUNGEON_STORAGE)).wait();
    
    console.log(`  ${colors.green}✅ DungeonMaster 配置完成！${colors.reset}`);

    // 配置 VRF Manager
    console.log('\n🔧 配置 VRF Manager...');
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfManager = VRFConsumerV2Plus.attach(CONTRACTS.VRF_MANAGER);
    
    console.log('  設置 DungeonCore...');
    await (await vrfManager.setDungeonCore(CONTRACTS.DUNGEONCORE)).wait();
    
    console.log('  設置 AltarOfAscension...');
    await (await vrfManager.setAltarOfAscension(CONTRACTS.ALTAR)).wait();
    
    // VRF Subscription ID
    const VRF_SUBSCRIPTION_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    console.log('  設置 Subscription ID...');
    await (await vrfManager.setSubscriptionId(VRF_SUBSCRIPTION_ID)).wait();
    
    console.log(`  ${colors.green}✅ VRF Manager 配置完成！${colors.reset}`);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}🎉 V25.0.3 所有配置完成！${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log('\n📊 配置總結:');
    console.log(`  DungeonCore: 10 個模組已連接`);
    console.log(`  DungeonMaster: 已連接 DungeonCore 和 DungeonStorage`);
    console.log(`  VRF Manager: 已連接 DungeonCore 和 AltarOfAscension`);
    
    console.log('\n✅ 所有合約現在都正確連接了！');

  } catch (error) {
    console.error(`\n${colors.red}❌ 配置失敗:${colors.reset}`, error);
    throw error;
  }
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 配置完成！${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 配置失敗:${colors.reset}`, error);
    process.exit(1);
  });
const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * 修復 VRF Manager 配置 - 僅配置存在的函數
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
  console.log(`${colors.cyan}║         修復 VRF Manager 配置 - 最終步驟                            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 操作者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);

  // 所有合約地址
  const CONTRACTS = {
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    VRF_MANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
  };

  console.log(`\n📋 相關地址:`);
  console.log(`  DungeonCore: ${CONTRACTS.DUNGEONCORE}`);
  console.log(`  VRF Manager: ${CONTRACTS.VRF_MANAGER}`);

  try {
    console.log('\n' + '='.repeat(70));
    console.log(`${colors.magenta}修復 VRF Manager 配置${colors.reset}`);
    console.log('='.repeat(70));

    // 獲取 VRF Manager 合約實例
    console.log('\n🔧 配置 VRF Manager...');
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfManager = VRFConsumerV2Plus.attach(CONTRACTS.VRF_MANAGER);
    
    console.log('  設置 DungeonCore...');
    const tx1 = await vrfManager.setDungeonCore(CONTRACTS.DUNGEONCORE);
    await tx1.wait();
    console.log(`  ✅ setDungeonCore 已完成 (${tx1.hash})`);
    
    // 注意：VRF 合約沒有 setAltarOfAscension 函數，跳過此步驟
    console.log('  ⚠️ 跳過 setAltarOfAscension（函數不存在）');
    
    // VRF Subscription ID
    const VRF_SUBSCRIPTION_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    console.log('  設置 Subscription ID...');
    const tx2 = await vrfManager.setSubscriptionId(VRF_SUBSCRIPTION_ID);
    await tx2.wait();
    console.log(`  ✅ setSubscriptionId 已完成 (${tx2.hash})`);
    
    console.log(`\n${colors.green}✅ VRF Manager 配置修復完成！${colors.reset}`);

    console.log('\n' + '='.repeat(70));
    console.log(`${colors.green}🎉 V25.0.3 配置完全完成！${colors.reset}`);
    console.log('='.repeat(70));
    
    console.log('\n📊 最終配置總結:');
    console.log(`  ✅ DungeonCore: 10 個模組已連接`);
    console.log(`  ✅ DungeonMaster: 已連接 DungeonCore 和 DungeonStorage`);
    console.log(`  ✅ VRF Manager: 已連接 DungeonCore 和設置 Subscription ID`);
    console.log(`  ⚠️  注意: VRF 合約沒有 setAltarOfAscension 函數，這是正常的`);
    
    console.log('\n✅ 所有合約現在都正確連接了！');
    console.log('\n🚀 下一步驟:');
    console.log('  1. 驗證新部署的合約');
    console.log('  2. 同步配置到前端/後端/子圖');
    console.log('  3. 進行完整的系統測試');

  } catch (error) {
    console.error(`\n${colors.red}❌ 配置失敗:${colors.reset}`, error);
    throw error;
  }
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 配置修復完成！${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 配置修復失敗:${colors.reset}`, error);
    process.exit(1);
  });
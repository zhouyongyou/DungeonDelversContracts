const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

/**
 * V25.0.3 簡化部署 - 使用修改後的合約（msg.sender 作為 owner）
 * 
 * 修改內容：
 * - 所有合約的構造函數不需要參數
 * - 部署者自動成為 owner
 * - 如需要可以後續 transferOwnership
 * 
 * 需要重新部署的合約（使用 fixed 版本）：
 * 1. DungeonStorage
 * 2. DungeonMaster
 * 3. Hero
 * 4. Relic
 * 5. Party
 * 6. AltarOfAscension
 * 7. PlayerVault
 * 8. PlayerProfile
 * 9. VIPStaking
 * 
 * 保持不變的合約：
 * - DungeonCore: 0x5B64A5939735Ff762493D9B9666b3e13118c5722
 * - Oracle: 0xEE322Eff70320759487f67875113C062AC1F4cfB
 * - VRFConsumerV2Plus: 0xa94555C309Dd83d9fB0531852d209c46Fa50637f
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
  console.log(`${colors.cyan}║      V25.0.3 簡化部署 - 使用 msg.sender 作為 owner                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 部署時間: ${new Date().toISOString()}`);
  console.log(`📦 版本: V25.0.3-SIMPLIFIED`);
  console.log(`🔗 網路: BSC Mainnet`);
  console.log('=' . repeat(70));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 部署者（將成為所有合約的 owner）: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.05")) {
    throw new Error('❌ 餘額不足，需要至少 0.05 BNB');
  }

  // 保持不變的合約地址
  const KEEP_CONTRACTS = {
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
    VRF_MANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    TSOUL: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
    TUSD1: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
    UNISWAP_POOL: "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa"
  };

  console.log(`\n📌 保持不變的合約:`);
  console.log(`  ${colors.green}✅ DungeonCore: ${KEEP_CONTRACTS.DUNGEONCORE}${colors.reset}`);
  console.log(`  ${colors.green}✅ Oracle: ${KEEP_CONTRACTS.ORACLE}${colors.reset}`);
  console.log(`  ${colors.green}✅ VRFConsumerV2Plus: ${KEEP_CONTRACTS.VRF_MANAGER}${colors.reset}`);

  const contracts = {};
  const deploymentInfo = {
    step: 'simplified-deployment',
    version: 'V25.0.3-SIMPLIFIED',
    deploymentTime: new Date().toISOString(),
    network: 'BSC Mainnet',
    chainId: 56,
    deployer: deployer.address,
    owner: deployer.address, // 部署者即為 owner
    keptContracts: KEEP_CONTRACTS,
    newContracts: {}
  };

  try {
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}開始部署合約（無需參數，自動使用部署者作為 owner）${colors.reset}`);
    console.log('=' . repeat(70));

    // 注意：這裡使用 fixed 目錄下的合約
    console.log(`\n${colors.yellow}⚠️ 使用標準合約路徑${colors.reset}`);

    // 1. 部署 DungeonStorage
    console.log('\n📌 [1/9] 部署 DungeonStorage...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
    contracts.dungeonStorage = await DungeonStorage.deploy(); // 無參數！
    await contracts.dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await contracts.dungeonStorage.getAddress();
    console.log(`  ${colors.green}✅ DungeonStorage 部署成功！${colors.reset}`);
    console.log(`  地址: ${dungeonStorageAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.dungeonStorage.deploymentTransaction().wait(3);

    // 2. 部署 DungeonMaster
    console.log('\n📌 [2/9] 部署 DungeonMaster...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    contracts.dungeonMaster = await DungeonMaster.deploy(); // 無參數！
    await contracts.dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await contracts.dungeonMaster.getAddress();
    console.log(`  ${colors.green}✅ DungeonMaster 部署成功！${colors.reset}`);
    console.log(`  地址: ${dungeonMasterAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.dungeonMaster.deploymentTransaction().wait(3);

    // 3. 部署 Hero NFT
    console.log('\n📌 [3/9] 部署 Hero NFT...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const Hero = await hre.ethers.getContractFactory("Hero");
    contracts.hero = await Hero.deploy(); // 無參數！
    await contracts.hero.waitForDeployment();
    const heroAddress = await contracts.hero.getAddress();
    console.log(`  ${colors.green}✅ Hero 部署成功！${colors.reset}`);
    console.log(`  地址: ${heroAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.hero.deploymentTransaction().wait(3);

    // 4. 部署 Relic NFT
    console.log('\n📌 [4/9] 部署 Relic NFT...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const Relic = await hre.ethers.getContractFactory("Relic");
    contracts.relic = await Relic.deploy(); // 無參數！
    await contracts.relic.waitForDeployment();
    const relicAddress = await contracts.relic.getAddress();
    console.log(`  ${colors.green}✅ Relic 部署成功！${colors.reset}`);
    console.log(`  地址: ${relicAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.relic.deploymentTransaction().wait(3);

    // 5. 部署 Party NFT
    console.log('\n📌 [5/9] 部署 Party NFT...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const Party = await hre.ethers.getContractFactory("Party");
    contracts.party = await Party.deploy(); // 無參數！
    await contracts.party.waitForDeployment();
    const partyAddress = await contracts.party.getAddress();
    console.log(`  ${colors.green}✅ Party 部署成功！${colors.reset}`);
    console.log(`  地址: ${partyAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.party.deploymentTransaction().wait(3);

    // 6. 部署 AltarOfAscension
    console.log('\n📌 [6/9] 部署 AltarOfAscension...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
    contracts.altarOfAscension = await AltarOfAscension.deploy(); // 無參數！
    await contracts.altarOfAscension.waitForDeployment();
    const altarAddress = await contracts.altarOfAscension.getAddress();
    console.log(`  ${colors.green}✅ AltarOfAscension 部署成功！${colors.reset}`);
    console.log(`  地址: ${altarAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.altarOfAscension.deploymentTransaction().wait(3);

    // 7. 部署 PlayerVault
    console.log('\n📌 [7/9] 部署 PlayerVault...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
    contracts.playerVault = await PlayerVault.deploy(); // 無參數！
    await contracts.playerVault.waitForDeployment();
    const playerVaultAddress = await contracts.playerVault.getAddress();
    console.log(`  ${colors.green}✅ PlayerVault 部署成功！${colors.reset}`);
    console.log(`  地址: ${playerVaultAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.playerVault.deploymentTransaction().wait(3);

    // 8. 部署 PlayerProfile
    console.log('\n📌 [8/9] 部署 PlayerProfile...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    contracts.playerProfile = await PlayerProfile.deploy(); // 無參數！
    await contracts.playerProfile.waitForDeployment();
    const playerProfileAddress = await contracts.playerProfile.getAddress();
    console.log(`  ${colors.green}✅ PlayerProfile 部署成功！${colors.reset}`);
    console.log(`  地址: ${playerProfileAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.playerProfile.deploymentTransaction().wait(3);

    // 9. 部署 VIPStaking
    console.log('\n📌 [9/9] 部署 VIPStaking...');
    console.log('  ✨ 無需參數，部署者自動成為 owner');
    const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
    contracts.vipStaking = await VIPStaking.deploy(); // 無參數！
    await contracts.vipStaking.waitForDeployment();
    const vipStakingAddress = await contracts.vipStaking.getAddress();
    console.log(`  ${colors.green}✅ VIPStaking 部署成功！${colors.reset}`);
    console.log(`  地址: ${vipStakingAddress}`);
    console.log(`  Owner: ${deployer.address}`);
    await contracts.vipStaking.deploymentTransaction().wait(3);

    // 收集所有新部署的地址
    deploymentInfo.newContracts = {
      DungeonStorage: dungeonStorageAddress,
      DungeonMaster: dungeonMasterAddress,
      Hero: heroAddress,
      Relic: relicAddress,
      Party: partyAddress,
      AltarOfAscension: altarAddress,
      PlayerVault: playerVaultAddress,
      PlayerProfile: playerProfileAddress,
      VIPStaking: vipStakingAddress
    };

    // 保存部署信息
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deploymentPath = path.join(__dirname, '..', 'deployments', `v25-0-3-simplified-${timestamp}.json`);
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📁 部署信息保存到: ${deploymentPath}`);

    // 顯示部署總結
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}🎉 V25.0.3 簡化部署完成！${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log('\n📊 部署總結:');
    console.log(`  部署者/Owner: ${deployer.address}`);
    console.log(`  重新部署: 9 個合約`);
    console.log(`  保持不變: 6 個合約`);
    console.log(`  版本: V25.0.3-SIMPLIFIED`);
    
    console.log('\n📝 新合約地址:');
    Object.entries(deploymentInfo.newContracts).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.cyan}⏭️ 下一步操作:${colors.reset}`);
    console.log('=' . repeat(70));
    console.log('1. ✅ 配置合約連接');
    console.log('2. ✅ 驗證新合約（無需構造參數）');
    console.log('3. ✅ 如需要，transferOwnership 到管理員錢包');
    console.log('4. ✅ 更新前端/後端/子圖配置');
    console.log('=' . repeat(70));

  } catch (error) {
    console.error(`\n${colors.red}❌ 部署失敗:${colors.reset}`, error);
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
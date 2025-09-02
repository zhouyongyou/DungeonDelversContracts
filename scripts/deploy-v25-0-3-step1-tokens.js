const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

/**
 * V25.0.3 步驟 1: 部署代幣合約
 * 
 * 只部署 TSOUL 和 TUSD1
 * 部署後需要手動創建 Uniswap V3 池子
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
  console.log(`${colors.cyan}║           V25.0.3 步驟 1 - 部署 TSOUL 和 TUSD1 代幣                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 部署時間: ${new Date().toISOString()}`);
  console.log(`📦 版本: V25.0.3`);
  console.log(`🔗 網路: BSC Mainnet`);
  console.log('=' . repeat(70));

  // 檢查私鑰
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('❌ Missing PRIVATE_KEY in .env file');
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 部署者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error('❌ 餘額不足，需要至少 0.1 BNB 來部署代幣合約');
  }

  const contracts = {};
  const deploymentInfo = {
    step: 1,
    version: 'V25.0.3',
    deploymentTime: new Date().toISOString(),
    network: 'BSC Mainnet',
    chainId: 56,
    deployer: deployer.address,
    contracts: {}
  };

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.magenta}開始部署代幣合約${colors.reset}`);
  console.log('=' . repeat(70));

  try {
    // 1. 部署 TSOUL 代幣 (合約名稱: SoulShard)
    console.log('\n📌 部署 TSOUL Token (SoulShard)...');
    console.log('  合約路徑: contracts/current/defi/TSOUL.sol');
    
    const SoulShard = await hre.ethers.getContractFactory("SoulShard");
    contracts.tsoul = await SoulShard.deploy();
    await contracts.tsoul.waitForDeployment();
    const tsoulAddress = await contracts.tsoul.getAddress();
    
    console.log(`  ${colors.green}✅ TSOUL 部署成功！${colors.reset}`);
    console.log(`  ${colors.blue}地址: ${tsoulAddress}${colors.reset}`);
    console.log(`  BSCScan: https://bscscan.com/address/${tsoulAddress}`);

    // 等待區塊確認
    console.log('  等待區塊確認...');
    await contracts.tsoul.deploymentTransaction().wait(5);
    console.log('  ✅ 已確認 5 個區塊');

    // 2. 部署 TUSD1 代幣 (合約名稱: TestUSD1)
    console.log('\n📌 部署 TUSD1 Token (TestUSD1)...');
    console.log('  合約路徑: contracts/current/defi/TUSD1.sol');
    
    const TestUSD1 = await hre.ethers.getContractFactory("TestUSD1");
    contracts.tusd1 = await TestUSD1.deploy();
    await contracts.tusd1.waitForDeployment();
    const tusd1Address = await contracts.tusd1.getAddress();
    
    console.log(`  ${colors.green}✅ TUSD1 部署成功！${colors.reset}`);
    console.log(`  ${colors.blue}地址: ${tusd1Address}${colors.reset}`);
    console.log(`  BSCScan: https://bscscan.com/address/${tusd1Address}`);

    // 等待區塊確認
    console.log('  等待區塊確認...');
    await contracts.tusd1.deploymentTransaction().wait(5);
    console.log('  ✅ 已確認 5 個區塊');

    // 保存部署信息
    deploymentInfo.contracts = {
      TSOUL: tsoulAddress,
      TUSD1: tusd1Address
    };

    // 創建部署記錄文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deploymentPath = path.join(__dirname, '..', 'deployments', `v25-0-3-step1-tokens-${timestamp}.json`);
    
    // 確保 deployments 目錄存在
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📁 部署信息保存到: ${deploymentPath}`);

    // 保存到臨時配置文件供第二步使用
    const tempConfig = `# V25.0.3 Step 1 - Token Addresses
# Generated: ${deploymentInfo.deploymentTime}

TSOUL_ADDRESS=${tsoulAddress}
TUSD1_ADDRESS=${tusd1Address}
`;

    fs.writeFileSync('.env.v25.0.3.step1', tempConfig);
    console.log(`📁 臨時配置保存到: .env.v25.0.3.step1`);

    // 顯示部署總結
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}🎉 步驟 1 完成！${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log('\n📊 部署總結:');
    console.log(`  ${colors.yellow}TSOUL Token:${colors.reset}`);
    console.log(`    地址: ${tsoulAddress}`);
    console.log(`    BSCScan: https://bscscan.com/address/${tsoulAddress}`);
    
    console.log(`\n  ${colors.yellow}TUSD1 Token:${colors.reset}`);
    console.log(`    地址: ${tusd1Address}`);
    console.log(`    BSCScan: https://bscscan.com/address/${tusd1Address}`);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.cyan}⏭️ 下一步操作:${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log(`\n${colors.yellow}1. 創建 Uniswap V3 池子${colors.reset}`);
    console.log('   請前往 Uniswap V3 創建池子:');
    console.log('   https://app.uniswap.org/#/add/');
    console.log(`\n   ${colors.blue}Token A (TSOUL): ${tsoulAddress}${colors.reset}`);
    console.log(`   ${colors.blue}Token B (TUSD1): ${tusd1Address}${colors.reset}`);
    console.log('   Fee Tier: 0.3% (3000)');
    console.log('   初始價格: 根據您的需求設定');
    
    console.log(`\n${colors.yellow}2. 記錄池子地址${colors.reset}`);
    console.log('   創建池子後，請記錄池子地址供後續使用');
    
    console.log(`\n${colors.yellow}3. 執行步驟 2${colors.reset}`);
    console.log('   創建池子後，執行第二步部署剩餘合約:');
    console.log(`   ${colors.blue}npx hardhat run scripts/deploy-v25-0-3-step2-contracts.js --network bsc${colors.reset}`);
    
    console.log('\n' + '=' . repeat(70));

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
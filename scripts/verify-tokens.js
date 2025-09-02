const hre = require("hardhat");

/**
 * 驗證 TSOUL 和 TUSD1 代幣合約
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    驗證 TSOUL 和 TUSD1 代幣合約                      ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('=' . repeat(70));

  // 部署的合約地址
  const contracts = [
    {
      name: 'SoulShard (TSOUL)',
      address: '0xB73FE158689EAB3396B64794b573D4BEc7113412',
      contract: 'contracts/current/defi/TSOUL.sol:SoulShard',
      constructorArgs: []
    },
    {
      name: 'TestUSD1 (TUSD1)',
      address: '0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61',
      contract: 'contracts/current/defi/TUSD1.sol:TestUSD1',
      constructorArgs: []
    }
  ];

  // 確保有 BSCScan API Key
  const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || process.env.VITE_BSCSCAN_API_KEY || '2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC';
  
  console.log(`🔑 使用 BSCScan API Key: ${BSCSCAN_API_KEY.substring(0, 10)}...`);
  console.log('');

  for (const contract of contracts) {
    console.log(`\n🔍 驗證 ${contract.name}...`);
    console.log(`  地址: ${contract.address}`);
    console.log(`  合約路徑: ${contract.contract}`);
    
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        contract: contract.contract,
        constructorArguments: contract.constructorArgs,
      });
      console.log(`  ${colors.green}✅ 驗證成功！${colors.reset}`);
      console.log(`  BSCScan: https://bscscan.com/address/${contract.address}#code`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`  ${colors.green}✅ 合約已經驗證${colors.reset}`);
        console.log(`  BSCScan: https://bscscan.com/address/${contract.address}#code`);
      } else if (error.message.includes("Contract source code already verified")) {
        console.log(`  ${colors.green}✅ 源碼已驗證${colors.reset}`);
        console.log(`  BSCScan: https://bscscan.com/address/${contract.address}#code`);
      } else {
        console.log(`  ${colors.red}❌ 驗證失敗: ${error.message}${colors.reset}`);
      }
    }

    // 添加延遲避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}🎉 驗證完成！${colors.reset}`);
  console.log('=' . repeat(70));
  
  console.log('\n📊 驗證結果:');
  console.log(`  TSOUL: https://bscscan.com/address/0xB73FE158689EAB3396B64794b573D4BEc7113412#code`);
  console.log(`  TUSD1: https://bscscan.com/address/0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61#code`);
  
  console.log('\n⏭️ 下一步:');
  console.log('1. 前往 Uniswap V3 創建池子');
  console.log('2. 記錄池子地址');
  console.log('3. 執行步驟 2 部署剩餘合約');
  console.log('=' . repeat(70));
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 驗證腳本執行成功${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 驗證腳本失敗:${colors.reset}`, error);
    process.exit(1);
  });
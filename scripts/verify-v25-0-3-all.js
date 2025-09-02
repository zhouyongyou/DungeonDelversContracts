const hre = require("hardhat");

/**
 * V25.0.3 驗證所有合約
 * 在 BSCScan 上驗證已部署的合約原始碼
 */

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function verifyContract(name, address, constructorArgs = []) {
  console.log(`\n📌 驗證 ${name}...`);
  console.log(`  地址: ${address}`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`  ${colors.green}✅ ${name} 驗證成功！${colors.reset}`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`  ${colors.yellow}⚠️ ${name} 已經驗證過了${colors.reset}`);
      return true;
    } else {
      console.log(`  ${colors.red}❌ ${name} 驗證失敗: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║               V25.0.3 合約驗證 - BSCScan                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 驗證時間: ${new Date().toISOString()}`);
  console.log('=' . repeat(70));

  // 合約地址和構造參數
  const contracts = [
    // 代幣合約（已驗證，跳過）
    // { name: "SoulShard (TSOUL)", address: "0xB73FE158689EAB3396B64794b573D4BEc7113412", args: [] },
    // { name: "TestUSD1 (TUSD1)", address: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61", args: [] },
    
    // 核心合約
    {
      name: "DungeonCore",
      address: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
      args: [
        "0xEbCF4A36Ad1485A9737025e9d72186b604487274", // _initialOwner
        "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61", // _usdToken (TUSD1)
        "0xB73FE158689EAB3396B64794b573D4BEc7113412"  // _soulShardToken (TSOUL)
      ]
    },
    
    // Oracle
    {
      name: "Oracle",
      address: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
      args: [
        "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa", // _poolAddress
        "0xB73FE158689EAB3396B64794b573D4BEc7113412", // _soulShardTokenAddress
        "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61"  // _usdTokenAddress
      ]
    },
    
    // VRF Manager
    {
      name: "VRFConsumerV2Plus",
      address: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
      args: [
        "88422796721004450630713121079263696788635490871993157345476848872165866246915", // subscriptionId
        "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9" // vrfCoordinator
      ]
    },
    
    // NFT 合約
    {
      name: "Hero",
      address: "0xc229Bf27D0A327701Ae7837f2559E67163448749",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "Relic",
      address: "0xF75D29478804aebf327806267747396889E0940B",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "Party",
      address: "0x2bA7A097Fb97caF8606E685649B64eB67Cc0cbd5",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    // 遊戲邏輯合約
    {
      name: "DungeonStorage",
      address: "0x43D2E230d34781108fe872E8c76D94148f05F411",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "DungeonMaster",
      address: "0x1B883a2076add584c6d649a87E6cC0906784641E",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "AltarOfAscension",
      address: "0xC2743c73342fa0fd4075ddc400aa1bab2Bd53b3a",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "PlayerVault",
      address: "0xf4c821dd494CC37c6494Dd8713BBF3e340dFcd44",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "PlayerProfile",
      address: "0x5c6DBbEebd5968B1fCFC63890Aa45b11781C0bB2",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    },
    
    {
      name: "VIPStaking",
      address: "0x0AE0c1D9c1e1Bf4859F4c2B5A27B5257A2dfb97d",
      args: ["0x5B64A5939735Ff762493D9B9666b3e13118c5722"] // dungeonCoreAddress
    }
  ];

  console.log(`\n📊 總共需要驗證 ${contracts.length} 個合約`);
  console.log('=' . repeat(70));

  let successCount = 0;
  let failedCount = 0;
  const failedContracts = [];

  for (const contract of contracts) {
    const success = await verifyContract(contract.name, contract.address, contract.args);
    if (success) {
      successCount++;
    } else {
      failedCount++;
      failedContracts.push(contract.name);
    }
    
    // 延遲一下避免 API 速率限制
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}📊 驗證總結${colors.reset}`);
  console.log('=' . repeat(70));
  console.log(`  ✅ 成功: ${successCount} 個合約`);
  console.log(`  ❌ 失敗: ${failedCount} 個合約`);
  
  if (failedContracts.length > 0) {
    console.log(`\n${colors.yellow}失敗的合約:${colors.reset}`);
    failedContracts.forEach(name => {
      console.log(`  - ${name}`);
    });
  }

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.cyan}💡 提示:${colors.reset}`);
  console.log('=' . repeat(70));
  console.log('1. 如果驗證失敗，可能需要檢查:');
  console.log('   - BSCSCAN_API_KEY 是否正確設置');
  console.log('   - 構造參數是否正確');
  console.log('   - 合約原始碼是否與部署時一致');
  console.log('2. 可以單獨驗證失敗的合約:');
  console.log('   npx hardhat verify --network bsc <address> <constructor args>');
  console.log('=' . repeat(70));
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 驗證腳本執行完成${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 腳本執行失敗:${colors.reset}`, error);
    process.exit(1);
  });
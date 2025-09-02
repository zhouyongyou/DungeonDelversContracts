const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

/**
 * V25.0.3 Contract Verification Script
 * 
 * 自動驗證所有部署的合約
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.blue}🔍 V25.0.3 Contract Verification${colors.reset}`);
  console.log('=' . repeat(70));

  // 讀取部署配置
  const envPath = path.join(__dirname, '..', '.env.v25.0.3');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ Error: .env.v25.0.3 not found. Please run deployment first.${colors.reset}`);
    process.exit(1);
  }

  // 解析配置
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim();
    }
  });

  // 複用的合約（已經驗證過）
  const REUSED_CONTRACTS = {
    DUNGEONCORE: "0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826",
    ORACLE: "0x3ED2f384C95c465428276a8C9Dcb7Ef5Af443c6d",
    PLAYERVAULT: "0x69f011AF03A7C98EFd244b813dC3F8F89D0BAB65",
    PLAYERPROFILE: "0x7E1E437cC88C581ca41698b345bE8aeCA8084559",
    VIPSTAKING: "0x2A758Fb08A80E49a3164BC217fe822c06c726752",
    VRF_MANAGER_V2PLUS: "0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5"
  };

  // 需要驗證的合約
  const contractsToVerify = [
    {
      name: 'TSOUL',
      address: config.VITE_SOULSHARD_ADDRESS,
      contract: 'contracts/current/defi/TSOUL.sol:TSOUL',
      constructorArgs: []
    },
    {
      name: 'TUSD1',
      address: config.VITE_USD_ADDRESS,
      contract: 'contracts/current/defi/TUSD1.sol:TUSD1',
      constructorArgs: []
    },
    {
      name: 'DungeonStorage',
      address: config.VITE_DUNGEONSTORAGE_ADDRESS,
      contract: 'contracts/current/game/DungeonStorage.sol:DungeonStorage',
      constructorArgs: [REUSED_CONTRACTS.DUNGEONCORE]
    },
    {
      name: 'DungeonMaster',
      address: config.VITE_DUNGEONMASTER_ADDRESS,
      contract: 'contracts/current/game/DungeonMaster.sol:DungeonMaster',
      constructorArgs: [REUSED_CONTRACTS.DUNGEONCORE]
    },
    {
      name: 'Hero',
      address: config.VITE_HERO_ADDRESS,
      contract: 'contracts/current/nft/Hero.sol:Hero',
      constructorArgs: [REUSED_CONTRACTS.DUNGEONCORE]
    },
    {
      name: 'Relic',
      address: config.VITE_RELIC_ADDRESS,
      contract: 'contracts/current/nft/Relic.sol:Relic',
      constructorArgs: [REUSED_CONTRACTS.DUNGEONCORE]
    },
    {
      name: 'AltarOfAscension',
      address: config.VITE_ALTAROFASCENSION_ADDRESS,
      contract: 'contracts/current/altar/AltarOfAscension.sol:AltarOfAscension',
      constructorArgs: [REUSED_CONTRACTS.DUNGEONCORE]
    },
    {
      name: 'Party',
      address: config.VITE_PARTY_ADDRESS,
      contract: 'contracts/current/nft/Party.sol:Party',
      constructorArgs: [REUSED_CONTRACTS.DUNGEONCORE]
    }
  ];

  console.log(`\n📋 Contracts to verify: ${contractsToVerify.length}`);
  console.log('=' . repeat(70));

  // 確保有 BSCScan API Key
  const BSCSCAN_API_KEY = process.env.VITE_BSCSCAN_API_KEY || process.env.BSCSCAN_API_KEY;
  if (!BSCSCAN_API_KEY) {
    console.error(`${colors.red}❌ Error: BSCSCAN_API_KEY not found in environment${colors.reset}`);
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const contract of contractsToVerify) {
    console.log(`\n🔍 Verifying ${contract.name}...`);
    console.log(`  Address: ${contract.address}`);
    console.log(`  Contract: ${contract.contract}`);
    
    if (!contract.address) {
      console.log(`  ${colors.yellow}⚠️  Skipped: No address found${colors.reset}`);
      continue;
    }

    try {
      await hre.run("verify:verify", {
        address: contract.address,
        contract: contract.contract,
        constructorArguments: contract.constructorArgs,
      });
      console.log(`  ${colors.green}✅ Verified successfully${colors.reset}`);
      successCount++;
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`  ${colors.green}✅ Already verified${colors.reset}`);
        successCount++;
      } else {
        console.log(`  ${colors.red}❌ Failed: ${error.message}${colors.reset}`);
        failCount++;
      }
    }
  }

  // 驗證總結
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}🎉 VERIFICATION COMPLETE${colors.reset}`);
  console.log('=' . repeat(70));
  console.log('\n📊 Verification Summary:');
  console.log(`  ${colors.green}✅ Success: ${successCount}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${failCount}${colors.reset}`);
  console.log(`  ${colors.yellow}♻️  Reused (already verified): ${Object.keys(REUSED_CONTRACTS).length}${colors.reset}`);

  if (failCount > 0) {
    console.log(`\n${colors.yellow}⚠️  Some contracts failed verification.${colors.reset}`);
    console.log('You can manually verify them on BSCScan:');
    console.log('https://bscscan.com/verifyContract');
  }

  console.log('\n' + '=' . repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n${colors.red}❌ Verification script failed:${colors.reset}`, error);
    process.exit(1);
  });
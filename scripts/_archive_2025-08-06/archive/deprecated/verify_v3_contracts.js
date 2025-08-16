// scripts/verify_v3_contracts.js
// 驗證所有 V3 合約

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyContract(contractName, address, constructorArgs = []) {
  try {
    log(`\n🔍 Verifying ${contractName} at ${address}...`, 'cyan');
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    
    log(`✅ ${contractName} verified successfully!`, 'green');
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`⚠️  ${contractName} is already verified`, 'yellow');
      return true;
    } else {
      log(`❌ Failed to verify ${contractName}: ${error.message}`, 'red');
      return false;
    }
  }
}

async function main() {
  log('\n🔍 Starting Contract Verification', 'bright');
  log('=================================\n', 'bright');
  
  const network = hre.network.name;
  log(`📍 Network: ${network}`, 'cyan');
  
  // 讀取部署地址
  const addressesFile = path.join(__dirname, '..', 'deployments', `${network}_all_addresses.json`);
  
  if (!fs.existsSync(addressesFile)) {
    log(`\n❌ Deployment file not found: ${addressesFile}`, 'red');
    log('Please run deployment script first!', 'red');
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
  const addresses = deployment.addresses;
  const [deployer] = await ethers.getSigners();
  
  log(`\n📋 Found ${Object.keys(addresses).length} contracts to verify`, 'yellow');
  
  const verificationTasks = [
    { name: 'Oracle', address: addresses.ORACLE_ADDRESS, args: [deployer.address] },
    { name: 'SoulShard', address: addresses.SOULSHARD_ADDRESS, args: [deployer.address] },
    { name: 'DungeonStorage', address: addresses.DUNGEONSTORAGE_ADDRESS, args: [deployer.address] },
    { name: 'Hero', address: addresses.HERO_ADDRESS, args: [deployer.address] },
    { name: 'Relic', address: addresses.RELIC_ADDRESS, args: [deployer.address] },
    { name: 'PartyV3', address: addresses.PARTY_ADDRESS, args: [deployer.address] },
    { name: 'PlayerVault', address: addresses.PLAYERVAULT_ADDRESS, args: [deployer.address] },
    { name: 'PlayerProfile', address: addresses.PLAYERPROFILE_ADDRESS, args: [deployer.address] },
    { name: 'AltarOfAscension', address: addresses.ALTAROFASCENSION_ADDRESS, args: [deployer.address] },
    { name: 'VIPStaking', address: addresses.VIPSTAKING_ADDRESS, args: [deployer.address] },
    { name: 'DungeonCore', address: addresses.DUNGEONCORE_ADDRESS, args: [deployer.address] },
    { name: 'DungeonMasterV7', address: addresses.DUNGEONMASTER_ADDRESS, args: [deployer.address] }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const task of verificationTasks) {
    if (task.address) {
      const success = await verifyContract(task.name, task.address, task.args);
      if (success) successCount++;
      else failCount++;
      
      // 等待一下避免 API 限制
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  log('\n' + '='.repeat(50), 'bright');
  log('📊 Verification Summary', 'bright');
  log('='.repeat(50), 'bright');
  log(`✅ Successfully verified: ${successCount}`, 'green');
  log(`❌ Failed to verify: ${failCount}`, 'red');
  
  if (failCount === 0) {
    log('\n🎉 All contracts verified successfully! 🎉', 'green');
  } else {
    log('\n⚠️  Some contracts failed verification. Check the errors above.', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
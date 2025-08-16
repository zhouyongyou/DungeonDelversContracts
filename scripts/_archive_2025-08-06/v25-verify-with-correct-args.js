const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

// The deployer address (owner) for all contracts
const DEPLOYER_ADDRESS = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';

// VRF Manager V2Plus constructor arguments
const VRF_WRAPPER = '0xEcA584828452209c7022772edEFd03C5C0FE3A6c'; // BSC Mainnet VRF V2.5 Wrapper
const LINK_TOKEN = '0xcb8fc4e083d01fde3efaf959d3bf72a758b7f04f'; // BSC Mainnet LINK token
const SOUL_SHARD = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'; // SoulShard token

// Unverified V25 contracts with correct constructor arguments
const contractsToVerify = [
  {
    name: 'DUNGEONMASTER',
    address: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    contractPath: 'contracts/current/core/DungeonMaster.sol:DungeonMaster',
    constructorArgs: DEPLOYER_ADDRESS
  },
  {
    name: 'HERO',
    address: '0xD48867dbac5f1c1351421726B6544f847D9486af',
    contractPath: 'contracts/current/nft/Hero.sol:Hero',
    constructorArgs: DEPLOYER_ADDRESS
  },
  {
    name: 'RELIC',
    address: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
    contractPath: 'contracts/current/nft/Relic.sol:Relic',
    constructorArgs: DEPLOYER_ADDRESS
  },
  {
    name: 'ALTAROFASCENSION',
    address: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
    contractPath: 'contracts/current/core/AltarOfAscension.sol:AltarOfAscensionVRF',
    constructorArgs: DEPLOYER_ADDRESS
  },
  {
    name: 'VRF_MANAGER_V2PLUS',
    address: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038',
    contractPath: 'contracts/current/core/VRFManagerV2Plus.sol:VRFManagerV2Plus',
    constructorArgs: `${VRF_WRAPPER} ${LINK_TOKEN}` // Two arguments: wrapper and LINK token
  }
];

async function verifyContract(contract) {
  console.log(`\n🔍 Verifying ${contract.name}...`);
  console.log(`   Address: ${contract.address}`);
  console.log(`   Contract: ${contract.contractPath}`);
  console.log(`   Constructor Args: ${contract.constructorArgs}`);
  
  try {
    // Build the verification command
    let command = `npx hardhat verify --network bsc ${contract.address}`;
    
    // Add constructor arguments
    if (contract.constructorArgs) {
      command += ` ${contract.constructorArgs}`;
    }
    
    console.log(`   Running verification...`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout.includes('Successfully verified') || stdout.includes('Already Verified')) {
      console.log(`   ✅ ${contract.name} verified successfully!`);
      console.log(`   BSCScan: https://bscscan.com/address/${contract.address}#code`);
      return { success: true, contract: contract.name };
    } else if (stdout.includes('already verified')) {
      console.log(`   ✅ ${contract.name} already verified!`);
      console.log(`   BSCScan: https://bscscan.com/address/${contract.address}#code`);
      return { success: true, contract: contract.name, alreadyVerified: true };
    } else if (stderr || stdout.includes('Error')) {
      console.log(`   ❌ Failed to verify ${contract.name}`);
      const errorMsg = stderr || stdout;
      // Only print short error messages
      if (errorMsg.length < 300) {
        console.log(`   Error: ${errorMsg}`);
      }
      return { success: false, contract: contract.name, error: errorMsg };
    }
    
  } catch (error) {
    console.log(`   ❌ Error verifying ${contract.name}`);
    
    // Extract meaningful error message
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('already verified')) {
      console.log(`   ✅ ${contract.name} already verified!`);
      return { success: true, contract: contract.name, alreadyVerified: true };
    }
    
    // Print error details for debugging
    if (errorMessage.includes('constructor')) {
      console.log(`   Constructor argument mismatch`);
    } else if (errorMessage.includes('does not match')) {
      console.log(`   Source code mismatch`);
    } else if (errorMessage.length < 300) {
      console.log(`   Error: ${errorMessage.split('\n')[0]}`);
    }
    
    return { success: false, contract: contract.name, error: errorMessage };
  }
}

async function main() {
  console.log('========================================');
  console.log('    V25 CONTRACT VERIFICATION SCRIPT    ');
  console.log('========================================');
  console.log(`\nDeployer Address: ${DEPLOYER_ADDRESS}`);
  console.log(`VRF Wrapper: ${VRF_WRAPPER}`);
  console.log(`LINK Token: ${LINK_TOKEN}`);
  console.log(`\nVerifying ${contractsToVerify.length} contracts...\n`);
  
  const results = [];
  
  for (const contract of contractsToVerify) {
    const result = await verifyContract(contract);
    results.push(result);
    
    // Add delay between verifications to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\n========================================');
  console.log('         VERIFICATION RESULTS           ');
  console.log('========================================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const alreadyVerified = results.filter(r => r.alreadyVerified);
  
  if (successful.length > 0) {
    console.log('✅ Successfully Verified:');
    successful.forEach(r => {
      const contract = contractsToVerify.find(c => c.name === r.contract);
      if (r.alreadyVerified) {
        console.log(`   - ${r.contract} (Already Verified)`);
      } else {
        console.log(`   - ${r.contract}`);
      }
      console.log(`     https://bscscan.com/address/${contract.address}#code`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to Verify:');
    failed.forEach(r => {
      const contract = contractsToVerify.find(c => c.name === r.contract);
      console.log(`   - ${r.contract}`);
      console.log(`     Address: ${contract.address}`);
    });
    
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. Ensure contracts were deployed with these exact constructor arguments');
    console.log('   2. Check that the source code matches the deployed bytecode');
    console.log('   3. Verify compiler settings match: v0.8.20, optimization 200 runs');
    console.log('   4. Try manual verification on BSCScan if automated verification fails');
  }
  
  console.log('\n========================================');
  console.log('              SUMMARY                   ');
  console.log('========================================');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Already Verified: ${alreadyVerified.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (successful.length === contractsToVerify.length) {
    console.log('\n🎉 All contracts verified successfully!');
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}
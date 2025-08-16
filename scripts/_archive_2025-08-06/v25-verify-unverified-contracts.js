const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

// Unverified V25 contracts that need verification
const contractsToVerify = [
  {
    name: 'DUNGEONMASTER',
    address: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    contractPath: 'contracts/DungeonMaster.sol:DungeonMaster',
    constructorArgs: '' // No constructor arguments
  },
  {
    name: 'HERO',
    address: '0xD48867dbac5f1c1351421726B6544f847D9486af',
    contractPath: 'contracts/Hero.sol:Hero',
    constructorArgs: '' // No constructor arguments
  },
  {
    name: 'RELIC',
    address: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
    contractPath: 'contracts/Relic.sol:Relic',
    constructorArgs: '' // No constructor arguments
  },
  {
    name: 'ALTAROFASCENSION',
    address: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
    contractPath: 'contracts/AltarOfAscension.sol:AltarOfAscension',
    constructorArgs: '' // No constructor arguments
  },
  {
    name: 'VRF_MANAGER_V2PLUS',
    address: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038',
    contractPath: 'contracts/VRFManagerV2Plus.sol:VRFManagerV2Plus',
    constructorArgs: '0x000000000000000000000000EcA584828452209c7022772edEFd03C5C0FE3A6c000000000000000000000000cb8fc4e083d01fde3efaf959d3bf72a758b7f04f00000000000000000000000097b2c2a9a11c7b6a020b4baead349865ead0bcf' // Constructor arguments for VRFManagerV2Plus
  }
];

async function verifyContract(contract) {
  console.log(`\n🔍 Verifying ${contract.name}...`);
  console.log(`   Address: ${contract.address}`);
  console.log(`   Contract: ${contract.contractPath}`);
  
  try {
    // Build the verification command
    let command = `npx hardhat verify --network bsc ${contract.address}`;
    
    // Add constructor arguments if present
    if (contract.constructorArgs) {
      command += ` ${contract.constructorArgs}`;
    }
    
    console.log(`   Running: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout.includes('Successfully verified') || stdout.includes('Already Verified')) {
      console.log(`   ✅ ${contract.name} verified successfully!`);
      console.log(`   BSCScan: https://bscscan.com/address/${contract.address}#code`);
      return { success: true, contract: contract.name };
    } else if (stderr || stdout.includes('Error')) {
      console.log(`   ❌ Failed to verify ${contract.name}`);
      console.log(`   Error: ${stderr || stdout}`);
      return { success: false, contract: contract.name, error: stderr || stdout };
    }
    
  } catch (error) {
    console.log(`   ❌ Error verifying ${contract.name}: ${error.message}`);
    
    // Try alternative verification approach if first attempt fails
    if (error.message.includes('constructor')) {
      console.log('   Retrying without constructor arguments...');
      try {
        const command = `npx hardhat verify --network bsc ${contract.address}`;
        const { stdout } = await execAsync(command);
        
        if (stdout.includes('Successfully verified') || stdout.includes('Already Verified')) {
          console.log(`   ✅ ${contract.name} verified successfully!`);
          return { success: true, contract: contract.name };
        }
      } catch (retryError) {
        console.log(`   ❌ Retry failed: ${retryError.message}`);
      }
    }
    
    return { success: false, contract: contract.name, error: error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('    V25 CONTRACT VERIFICATION SCRIPT    ');
  console.log('========================================');
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
  
  if (successful.length > 0) {
    console.log('✅ Successfully Verified:');
    successful.forEach(r => {
      const contract = contractsToVerify.find(c => c.name === r.contract);
      console.log(`   - ${r.contract}`);
      console.log(`     https://bscscan.com/address/${contract.address}#code`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to Verify:');
    failed.forEach(r => {
      console.log(`   - ${r.contract}`);
      if (r.error && r.error.length < 200) {
        console.log(`     Error: ${r.error}`);
      }
    });
    
    console.log('\n💡 Manual Verification Instructions:');
    console.log('   For failed contracts, you can verify manually on BSCScan:');
    failed.forEach(r => {
      const contract = contractsToVerify.find(c => c.name === r.contract);
      console.log(`\n   ${r.contract}:`);
      console.log(`   1. Go to: https://bscscan.com/address/${contract.address}#code`);
      console.log(`   2. Click "Verify and Publish"`);
      console.log(`   3. Select Compiler: v0.8.20+commit.a1b79de6`);
      console.log(`   4. Optimization: Yes, 200 runs`);
      console.log(`   5. Contract name: ${contract.contractPath.split(':')[1]}`);
      if (contract.constructorArgs) {
        console.log(`   6. Constructor Arguments: ${contract.constructorArgs}`);
      }
    });
  }
  
  console.log('\n========================================');
  console.log('              SUMMARY                   ');
  console.log('========================================');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}
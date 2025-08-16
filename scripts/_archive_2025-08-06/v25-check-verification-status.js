const axios = require('axios');
require('dotenv').config();

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const BSCSCAN_API_URL = 'https://api.bscscan.com/api';

// V25 Contract Addresses
const contracts = {
  // NEW V25 Contracts
  DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
  DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
  HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
  RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
  ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  
  // Reused Contracts
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  
  // VRF Manager
  VRF_MANAGER_V2PLUS: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038'
};

async function checkContractVerification(address, name) {
  try {
    const response = await axios.get(BSCSCAN_API_URL, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: address,
        apikey: BSCSCAN_API_KEY
      }
    });
    
    if (response.data.status === '1' && response.data.result[0]) {
      const result = response.data.result[0];
      const isVerified = result.SourceCode !== '';
      
      return {
        name,
        address,
        isVerified,
        contractName: result.ContractName || 'N/A',
        compiler: result.CompilerVersion || 'N/A',
        optimized: result.OptimizationUsed === '1',
        runs: result.Runs || 'N/A'
      };
    }
    
    return {
      name,
      address,
      isVerified: false,
      contractName: 'Not Verified',
      compiler: 'N/A',
      optimized: false,
      runs: 'N/A'
    };
    
  } catch (error) {
    console.error(`Error checking ${name}:`, error.message);
    return {
      name,
      address,
      isVerified: 'Error',
      error: error.message
    };
  }
}

async function main() {
  console.log('========================================');
  console.log('     V25 CONTRACT VERIFICATION STATUS   ');
  console.log('========================================\n');
  
  const results = [];
  const unverified = [];
  
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`Checking ${name}...`);
    const result = await checkContractVerification(address, name);
    results.push(result);
    
    if (!result.isVerified && result.isVerified !== 'Error') {
      unverified.push(name);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n========================================');
  console.log('            VERIFICATION REPORT         ');
  console.log('========================================\n');
  
  console.log('✅ VERIFIED CONTRACTS:');
  results.filter(r => r.isVerified === true).forEach(r => {
    console.log(`  - ${r.name}: ${r.contractName}`);
    console.log(`    Address: ${r.address}`);
    console.log(`    Compiler: ${r.compiler}`);
    console.log(`    Optimized: ${r.optimized} (Runs: ${r.runs})`);
    console.log(`    BSCScan: https://bscscan.com/address/${r.address}#code\n`);
  });
  
  console.log('\n❌ UNVERIFIED CONTRACTS:');
  results.filter(r => r.isVerified === false).forEach(r => {
    console.log(`  - ${r.name}: ${r.address}`);
    console.log(`    BSCScan: https://bscscan.com/address/${r.address}`);
  });
  
  if (results.some(r => r.isVerified === 'Error')) {
    console.log('\n⚠️ ERRORS:');
    results.filter(r => r.isVerified === 'Error').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n========================================');
  console.log('              SUMMARY                   ');
  console.log('========================================');
  console.log(`Total Contracts: ${results.length}`);
  console.log(`Verified: ${results.filter(r => r.isVerified === true).length}`);
  console.log(`Unverified: ${results.filter(r => r.isVerified === false).length}`);
  console.log(`Errors: ${results.filter(r => r.isVerified === 'Error').length}`);
  
  if (unverified.length > 0) {
    console.log('\n📋 Contracts needing verification:');
    unverified.forEach(name => {
      console.log(`  - ${name}`);
    });
  }
  
  return { results, unverified };
}

if (require.main === module) {
  main()
    .then(({ unverified }) => {
      if (unverified.length > 0) {
        console.log('\n💡 Run v25-verify-unverified-contracts.js to verify these contracts');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { checkContractVerification, main };
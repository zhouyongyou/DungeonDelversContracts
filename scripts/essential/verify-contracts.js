// verify-contracts.js - Unified contract verification for BSCScan
// Requires axios for BSCScan API calls

const { ethers, run } = require("hardhat");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// BSCScan API configuration
const BSCSCAN_API_URL = "https://api.bscscan.com/api";
const API_KEY = process.env.BSCSCAN_API_KEY;

async function main() {
  console.log("🔍 DungeonDelvers Contract Verification");
  console.log("🌐 Target: BSCScan (Binance Smart Chain)");
  console.log("=" .repeat(60));

  if (!API_KEY) {
    throw new Error("❌ BSCSCAN_API_KEY not found in environment variables");
  }

  // Find the latest deployment record
  const deploymentsDir = path.join(__dirname, "../../deployments");
  
  let deploymentRecord;
  try {
    const files = await fs.readdir(deploymentsDir);
    const deploymentFiles = files.filter(f => f.startsWith("v25-complete-") && f.endsWith(".json"));
    
    if (deploymentFiles.length === 0) {
      throw new Error("No deployment record found. Run 'npm run deploy' first.");
    }
    
    // Get the most recent deployment
    const latestFile = deploymentFiles.sort().pop();
    const recordPath = path.join(deploymentsDir, latestFile);
    const recordContent = await fs.readFile(recordPath, "utf8");
    deploymentRecord = JSON.parse(recordContent);
    
    console.log(`📋 Using deployment record: ${latestFile}`);
  } catch (error) {
    throw new Error(`Failed to load deployment record: ${error.message}`);
  }

  const contracts = deploymentRecord.contracts;
  console.log(`\n🎯 Found ${Object.keys(contracts).length} contracts to verify`);

  // Contract verification function with retry logic
  async function verifyContract(contractName, contractAddress, constructorArgs = []) {
    console.log(`\n🔍 Verifying ${contractName} at ${contractAddress}...`);
    
    try {
      // First check if already verified
      const isVerified = await checkIfVerified(contractAddress);
      if (isVerified) {
        console.log(`✅ ${contractName} already verified on BSCScan`);
        return true;
      }

      // Use Hardhat's built-in verification
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: constructorArgs,
      });
      
      console.log(`✅ ${contractName} verified successfully`);
      return true;
      
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contractName} already verified on BSCScan`);
        return true;
      }
      
      console.error(`❌ Failed to verify ${contractName}: ${error.message}`);
      return false;
    }
  }

  // Check if contract is already verified using BSCScan API
  async function checkIfVerified(contractAddress) {
    try {
      const response = await axios.get(BSCSCAN_API_URL, {
        params: {
          module: "contract",
          action: "getsourcecode", 
          address: contractAddress,
          apikey: API_KEY
        },
        timeout: 10000
      });

      if (response.data && response.data.status === "1") {
        const result = response.data.result[0];
        return result.SourceCode && result.SourceCode !== "";
      }
      return false;
    } catch (error) {
      console.warn(`⚠️  Could not check verification status for ${contractAddress}`);
      return false;
    }
  }

  // Define verification order (dependencies first)
  const verificationOrder = [
    "TSOUL",
    "TUSD1", 
    "DungeonCore",
    "DungeonStorage",
    "Oracle",
    "PlayerVault",
    "PlayerProfile",
    "Hero",
    "Relic", 
    "Party",
    "VIPStaking",
    "DungeonMaster",
    "AltarOfAscension",
    "VRFConsumerV2Plus"
  ];

  console.log("\n🚀 Starting verification process...");
  
  const verificationResults = {};
  let successCount = 0;
  let failureCount = 0;

  for (const contractName of verificationOrder) {
    if (!contracts[contractName]) {
      console.log(`⚠️  Skipping ${contractName} - not found in deployment record`);
      continue;
    }

    const contractInfo = contracts[contractName];
    const success = await verifyContract(
      contractName,
      contractInfo.address,
      contractInfo.constructorArgs || []
    );

    verificationResults[contractName] = {
      address: contractInfo.address,
      verified: success,
      timestamp: new Date().toISOString()
    };

    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Rate limiting: Wait 2 seconds between verifications
    if (verificationOrder.indexOf(contractName) < verificationOrder.length - 1) {
      console.log("⏳ Waiting 2 seconds for rate limiting...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save verification results
  const verificationRecord = {
    timestamp: Date.now(),
    network: "bsc",
    deploymentTimestamp: deploymentRecord.timestamp,
    totalContracts: Object.keys(contracts).length,
    successfulVerifications: successCount,
    failedVerifications: failureCount,
    results: verificationResults
  };

  const verificationPath = path.join(
    __dirname, 
    `../../deployments/verification-${Date.now()}.json`
  );
  await fs.writeFile(verificationPath, JSON.stringify(verificationRecord, null, 2));

  console.log("\n📊 Verification Summary");
  console.log("=" .repeat(60));
  console.log(`✅ Successfully verified: ${successCount} contracts`);
  console.log(`❌ Failed to verify: ${failureCount} contracts`);
  console.log(`📋 Results saved: ${path.basename(verificationPath)}`);

  if (failureCount === 0) {
    console.log("\n🎉 All contracts verified successfully!");
    console.log("🌐 View on BSCScan: https://bscscan.com/");
  } else {
    console.log(`\n⚠️  ${failureCount} contracts need manual verification`);
    console.log("💡 Check the error messages above and retry if needed");
  }

  console.log("\n⚡ Next step: npm run setup (configure contract connections)");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Verification failed:", error.message);
      process.exit(1);
    });
}

module.exports = { main };
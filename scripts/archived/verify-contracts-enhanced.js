// verify-contracts-enhanced.js - Enhanced contract verification with proper paths
// 🚨 Gas Price 核心原則：0.11 gwei (驗證不需要 gas，但保持一致性)
const { execSync } = require("child_process");

// Contract addresses with their corresponding source files
const contractsToVerify = [
  {
    name: "TestUSD1",
    address: "0x916a2a1eb605e88561139c56af0698de241169f2",
    contractPath: "contracts/current/defi/TUSD1.sol:TestUSD1",
    constructorArgs: []
  },
  {
    name: "SoulShard", 
    address: "0x1a98769b8034d400745cc658dc204cd079de36fa",
    contractPath: "contracts/current/defi/TSOUL.sol:SoulShard",
    constructorArgs: []
  },
  {
    name: "Oracle",
    address: "0x21928de992cb31ede864b62bc94002fb449c2738",
    contractPath: "contracts/current/defi/Oracle.sol:Oracle",
    constructorArgs: [
      "0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba", // V3 Pool
      "0x1a98769b8034d400745cc658dc204cd079de36fa", // SoulShard
      "0x916a2a1eb605e88561139c56af0698de241169f2"  // TestUSD1
    ]
  },
  {
    name: "DungeonCore",
    address: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
    contractPath: "contracts/current/core/DungeonCore.sol:DungeonCore",
    constructorArgs: [
      "0x84Cd63a840274d267aCb19e708d7f6298c315E75", // Owner
      "0x916a2a1eb605e88561139c56af0698de241169f2", // TestUSD1
      "0x1a98769b8034d400745cc658dc204cd079de36fa"  // SoulShard
    ]
  },
  {
    name: "PlayerVault",
    address: "0xe3c03d3e270d7eb3f8e27017790135f5a885a66f", 
    contractPath: "contracts/current/defi/PlayerVault.sol:PlayerVault",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "Hero",
    address: "0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e",
    contractPath: "contracts/current/nft/Hero.sol:Hero", 
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "Relic",
    address: "0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd",
    contractPath: "contracts/current/nft/Relic.sol:Relic",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "Party",
    address: "0xb393e482495bacde5aaf08d25323146cc5b9567f",
    contractPath: "contracts/current/nft/Party.sol:Party",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "PlayerProfile",
    address: "0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b",
    contractPath: "contracts/current/nft/PlayerProfile.sol:PlayerProfile",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "VIPStaking",
    address: "0x409d964675235a5a00f375053535fce9f6e79882",
    contractPath: "contracts/current/nft/VIPStaking.sol:VIPStaking",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f", // DungeonCore
      "0x1a98769b8034d400745cc658dc204cd079de36fa"  // SoulShard
    ]
  },
  {
    name: "VRFConsumerV2Plus",
    address: "0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40",
    contractPath: "contracts/current/vrf/VRFConsumerV2Plus.sol:VRFConsumerV2Plus",
    constructorArgs: []
  },
  {
    name: "AltarOfAscension",
    address: "0x7f4b3d0ff2994182200fc3b306fb5b035680de3c",
    contractPath: "contracts/current/game/AltarOfAscension.sol:AltarOfAscension",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "DungeonMaster",
    address: "0xdbee76d1c6e94f93ceecf743a0a0132c57371254",
    contractPath: "contracts/current/game/DungeonMaster.sol:DungeonMaster",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  },
  {
    name: "DungeonStorage", 
    address: "0x30dcbe703b258fa1e421d22c8ada643da51ceb4c",
    contractPath: "contracts/current/storage/DungeonStorage.sol:DungeonStorage",
    constructorArgs: [
      "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
    ]
  }
];

async function verifyContract(contract) {
  const { name, address, contractPath, constructorArgs } = contract;
  
  console.log(`\n🔍 Verifying ${name} at ${address}...`);
  console.log(`📄 Contract: ${contractPath}`);
  
  try {
    let command = `npx hardhat verify --contract "${contractPath}" --network bsc ${address}`;
    
    if (constructorArgs.length > 0) {
      const argsString = constructorArgs.map(arg => `"${arg}"`).join(" ");
      command += ` ${argsString}`;
    }
    
    console.log(`💻 Command: ${command}`);
    
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000  // 60 second timeout per contract
    });
    
    console.log(`✅ ${name} verified successfully!`);
    if (result.includes("Successfully")) {
      console.log("📋 BSCScan verification completed");
    }
    
    return { success: true, contract: name };
    
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || error.message;
    
    if (errorOutput.includes("Already Verified") || errorOutput.includes("already verified")) {
      console.log(`ℹ️  ${name} already verified`);
      return { success: true, contract: name, alreadyVerified: true };
    } else if (errorOutput.includes("Invalid API Key")) {
      console.error(`❌ Invalid BSCScan API Key - Please check your .env file`);
      return { success: false, contract: name, error: "Invalid API Key" };
    } else {
      console.error(`❌ Failed to verify ${name}:`);
      console.error(errorOutput);
      return { success: false, contract: name, error: errorOutput };
    }
  }
}

async function checkApiKey() {
  const apiKey = process.env.BSCSCAN_API_KEY;
  if (!apiKey || apiKey === "YOUR_BSCSCAN_API_KEY_HERE") {
    console.error("🚨 BSCScan API Key not found or not set!");
    console.log("\n📋 To fix this:");
    console.log("1. Visit: https://bscscan.com/apis");
    console.log("2. Get your free API key");
    console.log("3. Add it to .env file: BSCSCAN_API_KEY=your_key_here");
    process.exit(1);
  }
  console.log("✅ BSCScan API Key found");
}

async function main() {
  console.log("🔍 Enhanced Contract Verification on BSCScan");
  console.log("=".repeat(60));
  
  // Check API key first
  checkApiKey();
  
  const results = [];
  let successCount = 0;
  let alreadyVerifiedCount = 0;
  let failedCount = 0;
  
  for (const contract of contractsToVerify) {
    const result = await verifyContract(contract);
    results.push(result);
    
    if (result.success) {
      if (result.alreadyVerified) {
        alreadyVerifiedCount++;
      } else {
        successCount++;
      }
    } else {
      failedCount++;
    }
    
    // Add delay between verifications to avoid rate limiting
    if (contractsToVerify.indexOf(contract) < contractsToVerify.length - 1) {
      console.log("⏳ Waiting 3 seconds to avoid rate limit...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Verification Summary");
  console.log("=".repeat(60));
  console.log(`✅ Newly verified: ${successCount}`);
  console.log(`ℹ️  Already verified: ${alreadyVerifiedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📦 Total contracts: ${contractsToVerify.length}`);
  
  if (failedCount > 0) {
    console.log("\n❌ Failed contracts:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.contract}: ${r.error}`);
    });
  }
  
  console.log("\n🔗 All contract links:");
  contractsToVerify.forEach(contract => {
    console.log(`${contract.name}: https://bscscan.com/address/${contract.address}#code`);
  });
  
  if (failedCount === 0) {
    console.log("\n🎉 All contracts verification completed successfully!");
  } else {
    console.log("\n⚠️  Some contracts failed verification. Please check the errors above.");
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Verification process failed:", error);
      process.exit(1);
    });
}

module.exports = { main, contractsToVerify };
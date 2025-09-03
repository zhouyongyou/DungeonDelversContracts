// verify-all-contracts.js - Verify all deployed contracts on BSCScan
// 🚨 Gas Price 核心原則：所有操作使用 0.11 gwei
const { execSync } = require("child_process");

// All deployed contract addresses (lowercase)
const contracts = {
  // Phase 1: Tokens
  TestUSD1: "0x916a2a1eb605e88561139c56af0698de241169f2",
  SoulShard: "0x1a98769b8034d400745cc658dc204cd079de36fa",
  
  // Phase 2: Oracle
  Oracle: "0x21928de992cb31ede864b62bc94002fb449c2738",
  
  // Phase 3: Core
  DungeonCore: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
  
  // Phase 4: Remaining
  PlayerVault: "0xe3c03d3e270d7eb3f8e27017790135f5a885a66f",
  Hero: "0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e",
  Relic: "0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd",
  Party: "0xb393e482495bacde5aaf08d25323146cc5b9567f",
  PlayerProfile: "0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b",
  VIPStaking: "0x409d964675235a5a00f375053535fce9f6e79882",
  VRFConsumerV2Plus: "0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40",
  AltarOfAscension: "0x7f4b3d0ff2994182200fc3b306fb5b035680de3c",
  DungeonMaster: "0xdbee76d1c6e94f93ceecf743a0a0132c57371254",
  DungeonStorage: "0x30dcbe703b258fa1e421d22c8ada643da51ceb4c"
};

// Constructor arguments for contracts that need them
const constructorArgs = {
  Oracle: [
    "0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba", // V3 Pool
    "0x1a98769b8034d400745cc658dc204cd079de36fa", // SoulShard
    "0x916a2a1eb605e88561139c56af0698de241169f2"  // TestUSD1
  ],
  DungeonCore: [
    "0x84Cd63a840274d267aCb19e708d7f6298c315E75", // Deployer (owner)
    "0x916a2a1eb605e88561139c56af0698de241169f2", // TestUSD1
    "0x1a98769b8034d400745cc658dc204cd079de36fa"  // SoulShard
  ],
  PlayerVault: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  Hero: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  Relic: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  Party: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  PlayerProfile: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  VIPStaking: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f", // DungeonCore
    "0x1a98769b8034d400745cc658dc204cd079de36fa"  // SoulShard
  ],
  AltarOfAscension: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  DungeonMaster: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ],
  DungeonStorage: [
    "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f"  // DungeonCore
  ]
};

async function verifyContract(contractName, address, args = []) {
  console.log(`🔍 Verifying ${contractName} at ${address}...`);
  
  try {
    let command = `npx hardhat verify --network bsc ${address}`;
    
    if (args.length > 0) {
      const argsString = args.map(arg => `"${arg}"`).join(" ");
      command += ` ${argsString}`;
    }
    
    console.log(`Command: ${command}`);
    
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(`✅ ${contractName} verified successfully!`);
    console.log(result);
    
  } catch (error) {
    if (error.stdout && error.stdout.includes("Already Verified")) {
      console.log(`ℹ️  ${contractName} already verified`);
    } else {
      console.error(`❌ Failed to verify ${contractName}:`);
      console.error(error.stdout || error.message);
    }
  }
  
  console.log("-".repeat(60));
}

async function main() {
  console.log("🔍 Starting contract verification on BSCScan");
  console.log("=".repeat(60));
  
  // Verify contracts in logical order
  const verificationOrder = [
    // Phase 1: Tokens (no constructor args)
    "TestUSD1",
    "SoulShard",
    
    // Phase 2: Oracle (needs pool + token addresses)
    "Oracle",
    
    // Phase 3: Core (needs owner + tokens)
    "DungeonCore",
    
    // Phase 4: Everything else (most need DungeonCore)
    "PlayerVault",
    "Hero",
    "Relic", 
    "Party",
    "PlayerProfile",
    "VIPStaking",
    "VRFConsumerV2Plus",
    "AltarOfAscension",
    "DungeonMaster",
    "DungeonStorage"
  ];
  
  for (const contractName of verificationOrder) {
    const address = contracts[contractName];
    const args = constructorArgs[contractName] || [];
    
    await verifyContract(contractName, address, args);
    
    // Add delay between verifications to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n🎉 Contract verification process completed!");
  console.log("\n📊 Summary:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name}: https://bscscan.com/address/${address}`);
  });
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, contracts, constructorArgs };
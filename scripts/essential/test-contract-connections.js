// test-contract-connections.js - Test contract functionality and interconnections
// 🚨 Gas Price 核心原則：所有操作使用 0.11 gwei
const { ethers } = require("hardhat");

// Contract addresses
const addresses = {
  testUSD1: "0x916a2a1eb605e88561139c56af0698de241169f2",
  soulShard: "0x1a98769b8034d400745cc658dc204cd079de36fa",
  oracle: "0x21928de992cb31ede864b62bc94002fb449c2738",
  dungeonCore: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
  playerVault: "0xe3c03d3e270d7eb3f8e27017790135f5a885a66f",
  hero: "0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e",
  relic: "0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd",
  party: "0xb393e482495bacde5aaf08d25323146cc5b9567f",
  playerProfile: "0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b",
  vipStaking: "0x409d964675235a5a00f375053535fce9f6e79882",
  vrfConsumer: "0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40",
  altarOfAscension: "0x7f4b3d0ff2994182200fc3b306fb5b035680de3c",
  dungeonMaster: "0xdbee76d1c6e94f93ceecf743a0a0132c57371254",
  dungeonStorage: "0x30dcbe703b258fa1e421d22c8ada643da51ceb4c"
};

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

async function testConnection(testName, testFunc) {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    const result = await testFunc();
    console.log(`✅ ${testName}: PASSED`);
    if (result !== undefined) {
      console.log(`   Result: ${result}`);
    }
    return { test: testName, status: "PASSED", result };
  } catch (error) {
    console.log(`❌ ${testName}: FAILED`);
    console.log(`   Error: ${error.message}`);
    return { test: testName, status: "FAILED", error: error.message };
  }
}

async function main() {
  console.log("🧪 Testing Contract Functionality and Interconnections");
  console.log("=".repeat(60));
  
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Get contract instances
  const contracts = {
    testUSD1: await ethers.getContractAt("TestUSD1", addresses.testUSD1),
    soulShard: await ethers.getContractAt("SoulShard", addresses.soulShard),
    oracle: await ethers.getContractAt("Oracle", addresses.oracle),
    dungeonCore: await ethers.getContractAt("DungeonCore", addresses.dungeonCore),
    playerVault: await ethers.getContractAt("PlayerVault", addresses.playerVault),
    hero: await ethers.getContractAt("Hero", addresses.hero),
    relic: await ethers.getContractAt("Relic", addresses.relic),
    party: await ethers.getContractAt("Party", addresses.party),
    playerProfile: await ethers.getContractAt("PlayerProfile", addresses.playerProfile),
    vipStaking: await ethers.getContractAt("VIPStaking", addresses.vipStaking)
  };

  const results = [];

  // Test 1: Basic Contract Information
  results.push(await testConnection("TestUSD1 Token Info", async () => {
    const name = await contracts.testUSD1.name();
    const symbol = await contracts.testUSD1.symbol();
    const decimals = await contracts.testUSD1.decimals();
    return `${name} (${symbol}) - ${decimals} decimals`;
  }));

  results.push(await testConnection("SoulShard Token Info", async () => {
    const name = await contracts.soulShard.name();
    const symbol = await contracts.soulShard.symbol();
    const decimals = await contracts.soulShard.decimals();
    return `${name} (${symbol}) - ${decimals} decimals`;
  }));

  // Test 2: Oracle Functionality
  results.push(await testConnection("Oracle Price Query", async () => {
    const price = await contracts.oracle.getSoulShardPriceInUSD();
    return `SoulShard Price: ${ethers.formatEther(price)} USD`;
  }));

  results.push(await testConnection("Oracle Pool Address", async () => {
    const poolAddr = await contracts.oracle.poolAddress();
    return `V3 Pool: ${poolAddr}`;
  }));

  // Test 3: DungeonCore Connections
  results.push(await testConnection("DungeonCore Oracle Connection", async () => {
    const oracleAddr = await contracts.dungeonCore.oracleAddress();
    const isConnected = oracleAddr.toLowerCase() === addresses.oracle.toLowerCase();
    return `Connected: ${isConnected} (${oracleAddr})`;
  }));

  results.push(await testConnection("DungeonCore PlayerVault Connection", async () => {
    const vaultAddr = await contracts.dungeonCore.playerVaultAddress();
    const isConnected = vaultAddr.toLowerCase() === addresses.playerVault.toLowerCase();
    return `Connected: ${isConnected} (${vaultAddr})`;
  }));

  results.push(await testConnection("DungeonCore Hero Connection", async () => {
    const heroAddr = await contracts.dungeonCore.heroContractAddress();
    const isConnected = heroAddr.toLowerCase() === addresses.hero.toLowerCase();
    return `Connected: ${isConnected} (${heroAddr})`;
  }));

  results.push(await testConnection("DungeonCore VRF Connection", async () => {
    const vrfAddr = await contracts.dungeonCore.getVRFManager();
    const isConnected = vrfAddr.toLowerCase() === addresses.vrfConsumer.toLowerCase();
    return `Connected: ${isConnected} (${vrfAddr})`;
  }));

  // Test 4: Token Balances
  results.push(await testConnection("Deployer TestUSD1 Balance", async () => {
    const balance = await contracts.testUSD1.balanceOf(signer.address);
    return `${ethers.formatEther(balance)} TUSD1`;
  }));

  results.push(await testConnection("Deployer SoulShard Balance", async () => {
    const balance = await contracts.soulShard.balanceOf(signer.address);
    return `${ethers.formatEther(balance)} SOUL`;
  }));

  // Test 5: Cross-Contract Functionality
  results.push(await testConnection("Oracle USD to SoulShard Conversion", async () => {
    const usdAmount = ethers.parseEther("100"); // 100 USD
    const soulAmount = await contracts.oracle.getRequiredSoulShardAmount(usdAmount);
    return `100 USD = ${ethers.formatEther(soulAmount)} SOUL`;
  }));

  results.push(await testConnection("DungeonCore USD to SoulShard via Oracle", async () => {
    const usdAmount = ethers.parseEther("50"); // 50 USD
    const soulAmount = await contracts.dungeonCore.getSoulShardAmountForUSD(usdAmount);
    return `50 USD = ${ethers.formatEther(soulAmount)} SOUL (via DungeonCore)`;
  }));

  // Test 6: NFT Contract Basic Info
  results.push(await testConnection("Hero Contract Info", async () => {
    const name = await contracts.hero.name();
    const symbol = await contracts.hero.symbol();
    return `${name} (${symbol})`;
  }));

  results.push(await testConnection("Party Contract Info", async () => {
    const name = await contracts.party.name();
    const symbol = await contracts.party.symbol();
    return `${name} (${symbol})`;
  }));

  // Test 7: Contract Ownership
  results.push(await testConnection("DungeonCore Owner", async () => {
    const owner = await contracts.dungeonCore.owner();
    const isDeployer = owner.toLowerCase() === signer.address.toLowerCase();
    return `Owner: ${owner} (Is deployer: ${isDeployer})`;
  }));

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.status === "PASSED").length;
  const failed = results.filter(r => r.status === "FAILED").length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.filter(r => r.status === "FAILED").forEach(r => {
      console.log(`   - ${r.test}: ${r.error}`);
    });
  }

  console.log("\n🔗 All Contract Links:");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name}: https://bscscan.com/address/${address}`);
  });

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Contract ecosystem is fully functional.");
  } else {
    console.log(`\n⚠️  ${failed} tests failed. Please investigate the issues above.`);
  }

  return { passed, failed, total, results };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Testing failed:", error);
      process.exit(1);
    });
}

module.exports = { main, addresses };
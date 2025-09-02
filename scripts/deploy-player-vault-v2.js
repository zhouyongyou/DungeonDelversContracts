// scripts/deploy-player-vault-v2.js
// Deploy PlayerVaultV2 with username support

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PlayerVaultV2 with Username Support...");

  // Get the contract factory
  const PlayerVaultV2 = await hre.ethers.getContractFactory("PlayerVaultV2");

  // Deploy the contract
  const playerVaultV2 = await PlayerVaultV2.deploy();
  await playerVaultV2.waitForDeployment();

  const address = await playerVaultV2.getAddress();
  console.log("✅ PlayerVaultV2 deployed to:", address);

  // Wait for a few blocks before verification
  console.log("⏳ Waiting for blocks to be mined...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Verify the contract on BSCScan
  if (hre.network.name !== "hardhat") {
    console.log("🔍 Verifying contract on BSCScan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  // Display useful information
  console.log("\n📋 Deployment Summary:");
  console.log("====================================");
  console.log("Contract Address:", address);
  console.log("Network:", hre.network.name);
  console.log("Block Number:", await hre.ethers.provider.getBlockNumber());
  
  console.log("\n🔧 Next Steps:");
  console.log("1. Set DungeonCore address: setDungeonCore()");
  console.log("2. Transfer ownership if needed");
  console.log("3. Configure username registration fee");
  console.log("4. Test username registration functionality");

  console.log("\n🎮 New Features Available:");
  console.log("• registerUsername(string) - Register custom username");
  console.log("• setReferrerByUsername(string) - Set referrer by username");
  console.log("• resolveUsername(string) - Get address from username");
  console.log("• isUsernameAvailable(string) - Check availability");

  return address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = main;
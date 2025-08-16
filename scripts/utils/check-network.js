const hre = require("hardhat");

async function main() {
  try {
    const network = await hre.ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Current block: ${blockNumber}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Network check failed:", error.message);
    process.exit(1);
  }
}

main();
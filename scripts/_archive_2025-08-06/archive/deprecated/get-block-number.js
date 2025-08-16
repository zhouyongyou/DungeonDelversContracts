const hre = require("hardhat");

async function main() {
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  console.log("Current block number:", blockNumber);
}

main().catch(console.error);
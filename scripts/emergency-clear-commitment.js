// Emergency script to clear stuck commitment
// Usage: PRIVATE_KEY=0x... npx hardhat run scripts/emergency-clear-commitment.js --network bsc

const hre = require("hardhat");

async function main() {
  const HERO_ADDRESS = "0x671d937b171e2ba2c4dc23c133b07e4449f283ef";
  const USER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647"; // Your address
  
  console.log("🚨 Emergency Commitment Clear Script");
  console.log("=====================================");
  
  // Check current commitment status
  const heroContract = await hre.ethers.getContractAt(
    ["function userCommitments(address) view returns (uint256 blockNumber, uint256 quantity, uint256 payment, bytes32 commitment, bool fulfilled, uint8 maxRarity, bool fromVault)",
     "function forceRevealExpired(address user)"],
    HERO_ADDRESS
  );
  
  const commitment = await heroContract.userCommitments(USER_ADDRESS);
  console.log("\n📊 Current Commitment Status:");
  console.log("- Block Number:", commitment.blockNumber.toString());
  console.log("- Quantity:", commitment.quantity.toString());
  console.log("- Fulfilled:", commitment.fulfilled);
  
  if (commitment.blockNumber == 0) {
    console.log("\n✅ No pending commitment found!");
    return;
  }
  
  if (commitment.fulfilled) {
    console.log("\n✅ Commitment already fulfilled!");
    return;
  }
  
  // Calculate expiry
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  const REVEAL_BLOCK_DELAY = 3;
  const MAX_REVEAL_WINDOW = 255;
  const expiryBlock = Number(commitment.blockNumber) + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
  
  console.log("\n⏰ Expiry Status:");
  console.log("- Current Block:", currentBlock);
  console.log("- Expiry Block:", expiryBlock);
  console.log("- Blocks Until Expiry:", expiryBlock - currentBlock);
  
  if (currentBlock > expiryBlock) {
    console.log("\n🔓 Commitment has expired! Can force reveal now.");
    
    // Execute force reveal
    console.log("\n🚀 Executing forceRevealExpired...");
    const tx = await heroContract.forceRevealExpired(USER_ADDRESS);
    console.log("- Transaction Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("- Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
    console.log("- Gas Used:", receipt.gasUsed.toString());
    
    // Check new status
    const newCommitment = await heroContract.userCommitments(USER_ADDRESS);
    console.log("\n📊 New Commitment Status:");
    console.log("- Fulfilled:", newCommitment.fulfilled);
    
  } else {
    const minutesLeft = Math.ceil((expiryBlock - currentBlock) * 3 / 60);
    console.log(`\n⏳ Need to wait ${minutesLeft} minutes before force reveal is possible.`);
    console.log("\n💡 Alternative Solutions:");
    console.log("1. Wait for expiry then run this script again");
    console.log("2. Contact contract owner to add emergency clear function");
    console.log("3. Deploy new Hero contract with admin functions");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
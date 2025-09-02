const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking NFT Total Supply on BSC Mainnet...\n");

  // Contract addresses from V25 deployment
  const addresses = {
    hero: "0xe90d442458931690C057D5ad819EBF94A4eD7c8c",
    relic: "0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B",
    party: "0x629B386D8CfdD13F27164a01fCaE83CB07628FB9"
  };

  try {
    // Get Hero contract
    const Hero = await hre.ethers.getContractAt("IHero", addresses.hero);
    const heroSupply = await Hero.totalSupply();
    console.log(`📊 Hero NFT Total Supply: ${heroSupply.toString()}`);

    // Get Relic contract
    const Relic = await hre.ethers.getContractAt("IRelic", addresses.relic);
    const relicSupply = await Relic.totalSupply();
    console.log(`📊 Relic NFT Total Supply: ${relicSupply.toString()}`);

    // Get Party contract
    const Party = await hre.ethers.getContractAt("IParty", addresses.party);
    const partySupply = await Party.totalSupply();
    console.log(`📊 Party NFT Total Supply: ${partySupply.toString()}`);

    console.log("\n✅ Supply check complete!");
    
    if (heroSupply == 0 && relicSupply == 0) {
      console.log("\n⚠️ No NFTs have been minted yet on V25 contracts!");
      console.log("💡 This explains why the metadata server returns placeholder data.");
      console.log("🎯 You need to mint some NFTs first using the minting scripts.");
    }

  } catch (error) {
    console.error("❌ Error checking supply:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
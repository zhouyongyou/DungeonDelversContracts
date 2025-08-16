// 直接測試 Party 合約
const { ethers } = require("hardhat");

async function testParty() {
  console.log('\n🔍 測試 Party 合約...\n');

  const PARTY_ADDRESS = "0x847DceaE26aF1CFc09beC195CE87a9b5701863A7";
  
  // 嘗試獲取 Party 合約
  try {
    // 先用最基本的函數測試
    const party = await ethers.getContractAt([
      "function name() external view returns (string memory)",
      "function symbol() external view returns (string memory)",
      "function owner() external view returns (address)",
      "function totalSupply() external view returns (uint256)"
    ], PARTY_ADDRESS);

    console.log("基本函數測試：");
    console.log("  名稱:", await party.name());
    console.log("  符號:", await party.symbol());
    console.log("  擁有者:", await party.owner());
    console.log("  總供應量:", await party.totalSupply());
    
    // 測試 Party 特有的函數
    const partyV3 = await ethers.getContractAt([
      "function dungeonCore() external view returns (address)",
      "function heroContract() external view returns (address)",
      "function relicContract() external view returns (address)",
      "function baseURI() external view returns (string memory)",
      "function getPartyCapacityQuick(uint256[] calldata heroTokenIds, uint256[] calldata relicTokenIds) external view returns (uint256)",
      "function getPartyPowerQuick(uint256[] calldata heroTokenIds) external view returns (uint256)"
    ], PARTY_ADDRESS);

    console.log("\nParty 函數測試：");
    console.log("  DungeonCore:", await partyV3.dungeonCore());
    console.log("  Hero 合約:", await partyV3.heroContract());
    console.log("  Relic 合約:", await partyV3.relicContract());
    console.log("  BaseURI:", await partyV3.baseURI());
    
    // 測試快速計算函數
    const testPower = await partyV3.getPartyPowerQuick([]);
    console.log("  空隊伍戰力:", testPower.toString());
    
    const testCapacity = await partyV3.getPartyCapacityQuick([], []);
    console.log("  空隊伍容量:", testCapacity.toString());
    
  } catch (error) {
    console.error("❌ 錯誤:", error.message);
    
    // 嘗試用舊版 Party 介面
    console.log("\n嘗試舊版 Party 介面...");
    try {
      const partyOld = await ethers.getContractAt([
        "function dungeonCore() external view returns (address)",
        "function baseURI() external view returns (string memory)",
        "function platformFee() external view returns (uint256)"
      ], PARTY_ADDRESS);
      
      console.log("  DungeonCore:", await partyOld.dungeonCore());
      console.log("  BaseURI:", await partyOld.baseURI());
      console.log("  平台費用:", await partyOld.platformFee());
    } catch (error2) {
      console.error("❌ 舊版介面也失敗:", error2.message);
    }
  }
}

testParty()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
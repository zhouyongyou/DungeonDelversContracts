const { ethers } = require("ethers");

async function checkVRFSupport() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  
  const contracts = {
    HERO: "0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db",
    RELIC: "0xcfB83d8545D68b796a236290b3C1bc7e4A140B11",
    DUNGEONMASTER: "0xd06470d4C6F62F6747cf02bD2b2De0981489034F",
    ALTAROFASCENSION: "0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686"
  };
  
  // 檢查是否有 setVRFManager 函數
  const vrfABI = ["function setVRFManager(address) external", "function vrfManager() view returns (address)"];
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      const contract = new ethers.Contract(address, vrfABI, provider);
      const vrfManager = await contract.vrfManager();
      console.log(`${name}: VRF Manager = ${vrfManager}`);
    } catch (e) {
      console.log(`${name}: 沒有 vrfManager 函數（可能不支援 VRF）`);
    }
  }
}

checkVRFSupport().catch(console.error);

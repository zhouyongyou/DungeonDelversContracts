// 設置 VIP Staking 合約的代幣地址
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 設置 VIP Staking 代幣地址...\n");

  // V12 合約地址
  const VIP_STAKING_ADDRESS = "0x738eA7A2408F56D47EF127954Db42D37aE6339D5";
  const SOUL_SHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"; // SoulShard 代幣
  
  // 獲取合約實例
  const VIPStaking = await ethers.getContractAt(
    [
      "function setSoulShardToken(address _soulShardToken) external",
      "function soulShardToken() external view returns (address)",
      "function owner() external view returns (address)"
    ],
    VIP_STAKING_ADDRESS
  );

  // 檢查當前設置
  try {
    const currentToken = await VIPStaking.soulShardToken();
    console.log(`當前代幣地址: ${currentToken}`);
    
    if (currentToken !== ethers.ZeroAddress) {
      console.log("⚠️  代幣地址已設置，跳過...");
      return;
    }
  } catch (error) {
    console.log("代幣地址尚未設置");
  }

  // 檢查擁有者
  const owner = await VIPStaking.owner();
  const [signer] = await ethers.getSigners();
  console.log(`合約擁有者: ${owner}`);
  console.log(`當前簽名者: ${signer.address}`);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("❌ 錯誤：只有合約擁有者可以設置代幣地址");
    return;
  }

  // 設置代幣地址
  console.log(`\n設置代幣地址為: ${SOUL_SHARD_ADDRESS}`);
  const tx = await VIPStaking.setSoulShardToken(SOUL_SHARD_ADDRESS);
  console.log(`交易哈希: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ 代幣地址設置成功！");

  // 驗證設置
  const newToken = await VIPStaking.soulShardToken();
  console.log(`\n驗證：新代幣地址 = ${newToken}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
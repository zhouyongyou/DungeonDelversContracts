// 創建最小化版本的合約來測試驗證
const fs = require('fs');

// 創建簡化的 DungeonCore（僅保留構造函數和基本結構）
const minimalDungeonCore = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DungeonCore is Ownable {
    address public usdToken;
    address public soulShardToken;
    
    event ContractInitialized(address indexed owner, address usdToken, address soulShardToken);
    
    constructor(
        address _initialOwner,
        address _usdToken,
        address _soulShardToken
    ) Ownable(_initialOwner) {
        require(_usdToken != address(0) && _soulShardToken != address(0), "Token addresses cannot be zero");
        
        usdToken = _usdToken;
        soulShardToken = _soulShardToken;
        
        emit ContractInitialized(_initialOwner, _usdToken, _soulShardToken);
    }
    
    function getTokenAddresses() external view returns (address, address) {
        return (usdToken, soulShardToken);
    }
}
`;

// 創建簡化的 Oracle（僅保留構造函數和基本結構）
const minimalOracle = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Oracle is Ownable {
    address public poolAddress;
    address public soulShardTokenAddress;
    address public usdTokenAddress;
    
    event OracleInitialized(address indexed poolAddress, address soulShardToken, address usdToken);
    
    constructor(
        address _poolAddress,
        address _soulShardTokenAddress,
        address _usdTokenAddress
    ) Ownable(msg.sender) {
        require(_poolAddress != address(0) && _soulShardTokenAddress != address(0) && _usdTokenAddress != address(0), "Oracle: Zero address");
        
        poolAddress = _poolAddress;
        soulShardTokenAddress = _soulShardTokenAddress;
        usdTokenAddress = _usdTokenAddress;
        
        emit OracleInitialized(_poolAddress, _soulShardTokenAddress, _usdTokenAddress);
    }
    
    function getAddresses() external view returns (address, address, address) {
        return (poolAddress, soulShardTokenAddress, usdTokenAddress);
    }
}
`;

async function main() {
  console.log("🔧 創建最小化合約進行驗證測試...\n");
  
  // 寫入簡化合約
  fs.writeFileSync('./contracts/test/MinimalDungeonCore.sol', minimalDungeonCore);
  fs.writeFileSync('./contracts/test/MinimalOracle.sol', minimalOracle);
  
  console.log("✅ 已創建簡化合約:");
  console.log("- ./contracts/test/MinimalDungeonCore.sol");
  console.log("- ./contracts/test/MinimalOracle.sol");
  
  console.log("\n📋 這些合約特點:");
  console.log("1. 保持相同的構造函數簽名");
  console.log("2. 移除所有複雜依賴");
  console.log("3. 只保留基本的 OpenZeppelin Ownable");
  console.log("4. 保持相同的初始化邏輯");
  
  console.log("\n🎯 如果這些簡化版本能夠驗證成功，");
  console.log("   就證明問題確實出在合約複雜度上！");
  
  console.log("\n💡 下一步:");
  console.log("1. 編譯這些簡化合約");
  console.log("2. 生成 flatten 檔案");
  console.log("3. 使用相同的 ABI 參數測試驗證");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;

async function main() {
  console.log("🔧 創建最小化合約進行驗證測試...\n");
  
  // 寫入簡化合約
  fs.writeFileSync('./contracts/test/MinimalDungeonCore.sol', minimalDungeonCore);
  fs.writeFileSync('./contracts/test/MinimalOracle.sol', minimalOracle);
  
  console.log("✅ 已創建簡化合約:");
  console.log("- ./contracts/test/MinimalDungeonCore.sol");
  console.log("- ./contracts/test/MinimalOracle.sol");
  
  console.log("\n📋 這些合約特點:");
  console.log("1. 保持相同的構造函數簽名");
  console.log("2. 移除所有複雜依賴");
  console.log("3. 只保留基本的 OpenZeppelin Ownable");
  console.log("4. 保持相同的初始化邏輯");
  
  console.log("\n🎯 如果這些簡化版本能夠驗證成功，");
  console.log("   就證明問題確實出在合約複雜度上！");
  
  console.log("\n💡 下一步:");
  console.log("1. 編譯這些簡化合約");
  console.log("2. 生成 flatten 檔案");
  console.log("3. 使用相同的 ABI 參數測試驗證");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
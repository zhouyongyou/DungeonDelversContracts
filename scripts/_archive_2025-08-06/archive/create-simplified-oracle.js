// 創建簡化版本的 Oracle 合約，移除複雜的數學函式庫
const fs = require('fs');

// 讀取原始 Oracle flatten 檔案
const originalOracle = fs.readFileSync('./Oracle_flat_clean.sol', 'utf8');

// 簡化版本的 Oracle - 移除 MulDiv 和 TickMath 函式庫，保持基本結構
const simplifiedOracle = `// Sources flattened with hardhat v2.25.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File @openzeppelin/contracts/access/Ownable.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

abstract contract Ownable is Context {
    address private _owner;

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// 簡化的數學函式庫 - 移除複雜的 assembly 代碼
library SimpleMath {
    function mulDiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256) {
        require(denominator > 0, "Division by zero");
        return (a * b) / denominator;
    }
}

// 簡化的 Oracle 合約
contract Oracle is Ownable {
    address public poolAddress;
    address public soulShardTokenAddress;
    address public usdTokenAddress;
    
    uint256 public lastUpdateTime;
    uint256 public cachedPrice;
    
    event PriceUpdated(uint256 price, uint256 timestamp);
    event OracleConfigured(address poolAddress, address soulShardToken, address usdToken);

    constructor(
        address _poolAddress,
        address _soulShardTokenAddress,
        address _usdTokenAddress
    ) Ownable(msg.sender) {
        require(_poolAddress != address(0) && _soulShardTokenAddress != address(0) && _usdTokenAddress != address(0), "Oracle: Zero address");
        
        poolAddress = _poolAddress;
        soulShardTokenAddress = _soulShardTokenAddress;
        usdTokenAddress = _usdTokenAddress;
        lastUpdateTime = block.timestamp;
        cachedPrice = 1e18; // 預設價格 1 USD
        
        emit OracleConfigured(_poolAddress, _soulShardTokenAddress, _usdTokenAddress);
    }

    function getPrice() external view returns (uint256) {
        return cachedPrice;
    }
    
    function updatePrice(uint256 _newPrice) external onlyOwner {
        cachedPrice = _newPrice;
        lastUpdateTime = block.timestamp;
        emit PriceUpdated(_newPrice, block.timestamp);
    }
    
    function getLastUpdateTime() external view returns (uint256) {
        return lastUpdateTime;
    }
    
    function calculateUSDValue(uint256 _amount) external view returns (uint256) {
        return SimpleMath.mulDiv(_amount, cachedPrice, 1e18);
    }
    
    function getConfiguration() external view returns (address, address, address) {
        return (poolAddress, soulShardTokenAddress, usdTokenAddress);
    }
}`;

async function main() {
  console.log("🔧 創建簡化版 Oracle 合約...\n");
  
  // 寫入簡化的 Oracle
  fs.writeFileSync('./SimplifiedOracle_flat.sol', simplifiedOracle);
  
  console.log("✅ 已創建簡化 Oracle:");
  console.log("- ./SimplifiedOracle_flat.sol");
  
  console.log("\n📋 簡化內容:");
  console.log("1. 移除複雜的 MulDiv 函式庫");
  console.log("2. 移除 TickMath 函式庫");
  console.log("3. 移除所有 assembly 內聯彙編代碼");
  console.log("4. 保持相同的構造函數簽名");
  console.log("5. 保持基本的業務邏輯");
  
  console.log(`\n📊 檔案大小比較:`);
  console.log(`- 原始 Oracle: ${originalOracle.length} 字元`);
  console.log(`- 簡化 Oracle: ${simplifiedOracle.length} 字元`);
  console.log(`- 減少了: ${((originalOracle.length - simplifiedOracle.length) / originalOracle.length * 100).toFixed(1)}%`);
  
  console.log("\n🎯 如果這個簡化版本能通過驗證，");
  console.log("   就可以證明複雜數學函式庫是問題根源！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
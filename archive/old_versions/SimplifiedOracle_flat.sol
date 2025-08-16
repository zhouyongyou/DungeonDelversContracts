// Sources flattened with hardhat v2.25.0 https://hardhat.org

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
}
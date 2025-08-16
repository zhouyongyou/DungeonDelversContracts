// SoulShard_Secured.sol - 安全加固版本
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SoulShard_Secured
 * @notice 遊戲代幣合約 - 使用 OpenZeppelin 標準實現
 * @dev 安全改進：
 * 1. 使用 OpenZeppelin 標準 ERC20 實現
 * 2. 添加 ReentrancyGuard 防護
 * 3. 支援燃燒功能
 * 4. 添加鑄造上限保護
 */
contract SoulShard_Secured is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    // 總供應量上限 (10億代幣)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // 鑄造權限映射
    mapping(address => bool) public minters;
    
    // 事件
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    // 修飾符
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "SoulShard: caller is not a minter");
        _;
    }
    
    /**
     * @notice 構造函數
     * @param initialOwner 初始擁有者地址
     */
    constructor(address initialOwner) 
        ERC20("SoulShard", "SOUL") 
        Ownable(initialOwner) 
    {
        // 鑄造初始供應量給擁有者
        _mint(initialOwner, 100_000_000 * 10**18); // 1億初始供應
    }
    
    /**
     * @notice 鑄造新代幣
     * @param to 接收地址
     * @param amount 鑄造數量
     */
    function mint(address to, uint256 amount) external onlyMinter nonReentrant {
        require(to != address(0), "SoulShard: mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "SoulShard: max supply exceeded");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @notice 批量鑄造
     * @param recipients 接收地址數組
     * @param amounts 對應的數量數組
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyMinter 
        nonReentrant 
    {
        require(recipients.length == amounts.length, "SoulShard: arrays length mismatch");
        require(recipients.length <= 100, "SoulShard: too many recipients");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "SoulShard: max supply exceeded");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "SoulShard: mint to zero address");
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @notice 燃燒代幣（覆寫以添加事件）
     * @param amount 燃燒數量
     */
    function burn(uint256 amount) public override nonReentrant {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @notice 從指定地址燃燒代幣（覆寫以添加事件）
     * @param account 燃燒地址
     * @param amount 燃燒數量
     */
    function burnFrom(address account, uint256 amount) public override nonReentrant {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
    
    // --- 權限管理 ---
    
    /**
     * @notice 添加鑄造者
     * @param account 要添加的地址
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "SoulShard: zero address");
        require(!minters[account], "SoulShard: already a minter");
        
        minters[account] = true;
        emit MinterAdded(account);
    }
    
    /**
     * @notice 移除鑄造者
     * @param account 要移除的地址
     */
    function removeMinter(address account) external onlyOwner {
        require(minters[account], "SoulShard: not a minter");
        
        minters[account] = false;
        emit MinterRemoved(account);
    }
    
    /**
     * @notice 批量設置鑄造者
     * @param accounts 地址數組
     * @param status 是否為鑄造者
     */
    function batchSetMinters(address[] calldata accounts, bool status) external onlyOwner {
        require(accounts.length <= 50, "SoulShard: too many accounts");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "SoulShard: zero address");
            
            if (status && !minters[accounts[i]]) {
                minters[accounts[i]] = true;
                emit MinterAdded(accounts[i]);
            } else if (!status && minters[accounts[i]]) {
                minters[accounts[i]] = false;
                emit MinterRemoved(accounts[i]);
            }
        }
    }
    
    // --- 查詢函數 ---
    
    /**
     * @notice 檢查地址是否為鑄造者
     * @param account 要檢查的地址
     * @return 是否為鑄造者
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account] || account == owner();
    }
    
    /**
     * @notice 獲取剩餘可鑄造數量
     * @return 剩餘可鑄造數量
     */
    function remainingMintableSupply() external view returns (uint256) {
        uint256 currentSupply = totalSupply();
        return currentSupply < MAX_SUPPLY ? MAX_SUPPLY - currentSupply : 0;
    }
    
    // --- 緊急功能 ---
    
    /**
     * @notice 緊急提取誤發送的代幣
     * @param token 代幣地址
     * @param to 接收地址
     * @param amount 提取數量
     */
    function emergencyWithdrawToken(
        address token, 
        address to, 
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(token != address(this), "SoulShard: cannot withdraw SOUL");
        require(to != address(0), "SoulShard: withdraw to zero address");
        
        IERC20(token).transfer(to, amount);
    }
    
    /**
     * @notice 緊急提取誤發送的原生代幣
     * @param to 接收地址
     */
    function emergencyWithdrawNative(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "SoulShard: withdraw to zero address");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "SoulShard: no balance");
        
        (bool success, ) = to.call{value: balance}("");
        require(success, "SoulShard: withdraw failed");
    }
    
    // 接收原生代幣
    receive() external payable {}
}
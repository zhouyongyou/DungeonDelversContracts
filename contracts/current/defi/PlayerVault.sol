// PlayerVault.sol (With Custom Referral Username Support)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/interfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PlayerVault (With Custom Referral Username Support)
 * @notice Extended PlayerVault with custom referral username functionality
 * @dev New features:
 * 1. Custom username registration with BNB fee
 * 2. Username to address mapping for referrals
 * 3. Enhanced referral system supporting both addresses and usernames
 */
contract PlayerVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IDungeonCore public dungeonCore;

    struct PlayerInfo {
        uint256 withdrawableBalance;
        uint256 lastWithdrawTimestamp;
        uint256 lastFreeWithdrawTimestamp;
    }
    mapping(address => PlayerInfo) public playerInfo;
    mapping(address => address) public referrers;
    mapping(address => uint256) public totalCommissionPaid;
    mapping(address => uint256) public virtualCommissionBalance;
    uint256 public virtualTaxBalance;

    // ============ NEW: Custom Username Features ============
    mapping(string => address) public usernameToAddress;    // "john" → 0x123...
    mapping(address => string) public addressToUsername;    // 0x123... → "john"
    mapping(string => bool) public usernameExists;          // Check if username is taken
    
    uint256 public usernameRegistrationFee = 0.01 ether;    // BNB fee for registration
    uint256 public constant MIN_USERNAME_LENGTH = 1;
    uint256 public constant MAX_USERNAME_LENGTH = 15;
    // ======================================================

    uint256 public constant PERCENT_DIVISOR = 10000;
    uint256 public constant USD_DECIMALS = 1e18;
    
    uint256 public smallWithdrawThresholdUSD = 20 * USD_DECIMALS;
    uint256 public largeWithdrawThresholdUSD = 1000 * USD_DECIMALS;

    uint256 public standardInitialRate = 2500;
    uint256 public largeWithdrawInitialRate = 4000;
    uint256 public decreaseRatePerPeriod = 500;
    uint256 public periodDuration = 1 days;

    uint256 public commissionRate = 500; // 5%

    // Original events
    event Deposited(address indexed player, uint256 amount);
    event Withdrawn(address indexed player, uint256 amount, uint256 taxAmount);
    event GameSpending(address indexed player, address indexed spender, uint256 amount);
    event ReferralSet(address indexed user, address indexed referrer);
    event CommissionPaid(address indexed user, address indexed referrer, uint256 amount);
    event VirtualCommissionAdded(address indexed referrer, uint256 amount);
    
    // Commission-specific withdrawal event
    event CommissionWithdrawn(address indexed player, uint256 amount);
    event VirtualTaxCollected(uint256 amount);
    event DungeonCoreSet(address indexed newAddress);
    event TaxParametersUpdated(uint256 standardRate, uint256 largeRate, uint256 decreaseRate, uint256 period);
    event WithdrawThresholdsUpdated(uint256 smallAmount, uint256 largeAmount);

    // ============ NEW: Username Events ============
    event UsernameRegistered(address indexed user, string username);
    event UsernameUpdated(address indexed user, string oldUsername, string newUsername);
    event UsernameRegistrationFeeUpdated(uint256 newFee);
    event ReferralSetByUsername(address indexed user, address indexed referrer, string username);
    // =============================================

    modifier onlyAuthorizedGameContracts() {
        require(address(dungeonCore) != address(0), "Vault: DungeonCore not set");
        address sender = msg.sender;
        require(
            sender == dungeonCore.dungeonMasterAddress() ||
            sender == dungeonCore.altarOfAscensionAddress() ||
            sender == dungeonCore.heroContractAddress() ||
            sender == dungeonCore.relicContractAddress(),
            "Vault: Caller not an authorized game contract"
        );
        _;
    }
    
    modifier onlyDungeonMaster() {
        require(address(dungeonCore) != address(0), "Vault: DungeonCore not set");
        require(msg.sender == dungeonCore.dungeonMasterAddress(), "Vault: Caller is not the DungeonMaster");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ============ NEW: Username Functions ============
    
    /**
     * @notice Register a custom username for referrals
     * @param username The desired username (3-20 characters, alphanumeric + underscore only)
     */
    function registerUsername(string memory username) external payable nonReentrant {
        require(msg.value >= usernameRegistrationFee, "Vault: Insufficient registration fee");
        require(_isValidUsername(username), "Vault: Invalid username format");
        require(!usernameExists[username], "Vault: Username already taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Vault: User already has a username. Use updateUsername instead");
        
        // Register the username
        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;
        usernameExists[username] = true;
        
        emit UsernameRegistered(msg.sender, username);
    }
    
    /**
     * @notice Update existing username
     * @param newUsername The new desired username (1-15 characters, alphanumeric + underscore only)
     */
    function updateUsername(string memory newUsername) external payable nonReentrant {
        require(msg.value >= usernameRegistrationFee, "Vault: Insufficient update fee");
        require(_isValidUsername(newUsername), "Vault: Invalid username format");
        require(!usernameExists[newUsername], "Vault: Username already taken");
        
        string memory oldUsername = addressToUsername[msg.sender];
        require(bytes(oldUsername).length > 0, "Vault: No existing username. Use registerUsername instead");
        
        // Remove old mapping
        usernameExists[oldUsername] = false;
        delete usernameToAddress[oldUsername];
        
        // Set new mapping
        usernameToAddress[newUsername] = msg.sender;
        addressToUsername[msg.sender] = newUsername;
        usernameExists[newUsername] = true;
        
        emit UsernameUpdated(msg.sender, oldUsername, newUsername);
    }
    
    /**
     * @notice Set referrer using username or address
     * @param referrerInput Either a username (string) or will be processed by frontend
     */
    function setReferrerByUsername(string memory referrerInput) external nonReentrant {
        address referrerAddr = usernameToAddress[referrerInput];
        require(referrerAddr != address(0), "Vault: Username not found");
        require(referrers[msg.sender] == address(0), "Vault: Referrer already set");
        require(referrerAddr != msg.sender, "Vault: Cannot refer yourself");
        
        referrers[msg.sender] = referrerAddr;
        emit ReferralSetByUsername(msg.sender, referrerAddr, referrerInput);
        emit ReferralSet(msg.sender, referrerAddr);
    }
    
    /**
     * @notice Get address from username
     * @param username The username to resolve
     * @return The address associated with the username, or zero address if not found
     */
    function resolveUsername(string memory username) external view returns (address) {
        return usernameToAddress[username];
    }
    
    /**
     * @notice Get username from address  
     * @param user The address to lookup
     * @return The username associated with the address, empty string if none
     */
    function getUserUsername(address user) external view returns (string memory) {
        return addressToUsername[user];
    }
    
    /**
     * @notice Check if username is available
     * @param username The username to check
     * @return true if available, false if taken
     */
    function isUsernameAvailable(string memory username) external view returns (bool) {
        return _isValidUsername(username) && !usernameExists[username];
    }
    
    /**
     * @notice Validate username format (internal)
     */
    function _isValidUsername(string memory username) internal pure returns (bool) {
        bytes memory usernameBytes = bytes(username);
        uint256 length = usernameBytes.length;
        
        // Check length
        if (length < MIN_USERNAME_LENGTH || length > MAX_USERNAME_LENGTH) {
            return false;
        }
        
        // Check characters: only a-z, A-Z, 0-9, _
        for (uint256 i = 0; i < length; i++) {
            bytes1 char = usernameBytes[i];
            if (!(char >= 0x30 && char <= 0x39) &&  // 0-9
                !(char >= 0x41 && char <= 0x5A) &&  // A-Z
                !(char >= 0x61 && char <= 0x7A) &&  // a-z
                char != 0x5F) {                      // _
                return false;
            }
        }
        
        // Prevent addresses as usernames (0x prefix)
        if (length >= 2 && usernameBytes[0] == '0' && (usernameBytes[1] == 'x' || usernameBytes[1] == 'X')) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Owner can update registration fee
     */
    function setUsernameRegistrationFee(uint256 newFee) external onlyOwner {
        usernameRegistrationFee = newFee;
        emit UsernameRegistrationFeeUpdated(newFee);
    }
    
    /**
     * @notice Owner can withdraw BNB from username registrations
     */
    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Vault: No BNB to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Vault: BNB withdrawal failed");
    }
    
    // =============================================
    
    // Original functions remain unchanged
    function setReferrer(address _referrer) external nonReentrant {
        require(referrers[msg.sender] == address(0), "Vault: Referrer already set");
        require(_referrer != msg.sender, "Vault: Cannot refer yourself");
        require(_referrer != address(0), "Vault: Referrer cannot be zero address");
        referrers[msg.sender] = _referrer;
        emit ReferralSet(msg.sender, _referrer);
    }

    function withdraw(uint256 _amount) external nonReentrant {
        address soulShardAddr = _getSoulShardToken();
        require(soulShardAddr != address(0), "Vault: SoulShard token not set");
        PlayerInfo storage player = playerInfo[msg.sender];
        require(_amount > 0, "Vault: Amount must be > 0");
        require(player.withdrawableBalance >= _amount, "Vault: Insufficient balance");

        uint256 amountUSD = dungeonCore.getUSDValueForSoulShard(_amount);

        if (amountUSD <= smallWithdrawThresholdUSD && player.lastFreeWithdrawTimestamp + 1 days <= block.timestamp) {
            player.lastFreeWithdrawTimestamp = block.timestamp;
            _processWithdrawal(player, msg.sender, _amount, 0);
            return;
        }

        uint256 taxRate = _calculateTaxRate(msg.sender, amountUSD);
        
        _processWithdrawal(player, msg.sender, _amount, taxRate);
    }

    function withdrawCommission() external nonReentrant {
        uint256 commission = virtualCommissionBalance[msg.sender];
        require(commission > 0, "Vault: No commission to withdraw");
        
        virtualCommissionBalance[msg.sender] = 0;
        IERC20(_getSoulShardToken()).safeTransfer(msg.sender, commission);
        
        emit CommissionWithdrawn(msg.sender, commission);
        // Note: Removed duplicate Withdrawn event for cleaner event distinction
    }

    function deposit(address _player, uint256 _amount) external onlyDungeonMaster {
        require(_player != address(0), "Vault: Cannot deposit to zero address");
        playerInfo[_player].withdrawableBalance += _amount;
        emit Deposited(_player, _amount);
    }

    function spendForGame(address _player, uint256 _amount) external onlyAuthorizedGameContracts {
        PlayerInfo storage player = playerInfo[_player];
        require(player.withdrawableBalance >= _amount, "Vault: Insufficient balance for game spending");
        
        player.withdrawableBalance -= _amount;
        emit GameSpending(_player, msg.sender, _amount);
    }

    function _processWithdrawal(PlayerInfo storage player, address _withdrawer, uint256 _amount, uint256 _taxRate) private {
        player.withdrawableBalance -= _amount;
        player.lastWithdrawTimestamp = block.timestamp;

        uint256 taxAmount = (_amount * _taxRate) / PERCENT_DIVISOR;
        uint256 amountAfterTaxes = _amount - taxAmount;

        address referrer = referrers[_withdrawer];
        uint256 commissionAmount = 0;
        
        if (referrer != address(0)) {
            commissionAmount = (amountAfterTaxes * commissionRate) / PERCENT_DIVISOR;
            if (commissionAmount > 0) {
                virtualCommissionBalance[referrer] += commissionAmount;
                totalCommissionPaid[referrer] += commissionAmount;
                emit VirtualCommissionAdded(referrer, commissionAmount);
                emit CommissionPaid(_withdrawer, referrer, commissionAmount);
            }
        }
        
        uint256 finalAmountToPlayer = amountAfterTaxes - commissionAmount;

        if (taxAmount > 0) {
            virtualTaxBalance += taxAmount;
            emit VirtualTaxCollected(taxAmount);
        }

        if (finalAmountToPlayer > 0) {
            IERC20(_getSoulShardToken()).safeTransfer(_withdrawer, finalAmountToPlayer);
        }
        
        emit Withdrawn(_withdrawer, finalAmountToPlayer, taxAmount);
    }

    function _calculateTaxRate(address _player, uint256 _amountUSD) internal view returns (uint256) {
        PlayerInfo storage player = playerInfo[_player];
        
        uint256 initialRate = (_amountUSD > largeWithdrawThresholdUSD) 
            ? largeWithdrawInitialRate 
            : standardInitialRate;

        uint256 periodsPassed = (block.timestamp - player.lastWithdrawTimestamp) / periodDuration;
        uint256 timeDecay = periodsPassed * decreaseRatePerPeriod;
        
        uint256 vipLevel = IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_player);
        uint256 vipReduction = vipLevel * 50;

        uint256 playerLevel = IPlayerProfile(dungeonCore.playerProfileAddress()).getLevel(_player);
        uint256 levelReduction = (playerLevel / 10) * 100;

        uint256 totalReduction = timeDecay + vipReduction + levelReduction;

        if (totalReduction >= initialRate) {
            return 0;
        }

        return initialRate - totalReduction;
    }

    function setTaxParameters(
        uint256 _standardRate,
        uint256 _largeRate,
        uint256 _decreaseRate,
        uint256 _period
    ) external onlyOwner {
        require(_standardRate <= PERCENT_DIVISOR && _largeRate <= PERCENT_DIVISOR && _decreaseRate <= PERCENT_DIVISOR, "Rate cannot exceed 100%");
        standardInitialRate = _standardRate;
        largeWithdrawInitialRate = _largeRate;
        decreaseRatePerPeriod = _decreaseRate;
        periodDuration = _period;
        emit TaxParametersUpdated(_standardRate, _largeRate, _decreaseRate, _period);
    }

    function setWithdrawThresholds(uint256 _smallUSD, uint256 _largeUSD) external onlyOwner {
        smallWithdrawThresholdUSD = _smallUSD;
        largeWithdrawThresholdUSD = _largeUSD;
        emit WithdrawThresholdsUpdated(_smallUSD, _largeUSD);
    }
    
    function setDungeonCore(address _newAddress) external onlyOwner {
        dungeonCore = IDungeonCore(_newAddress);
        emit DungeonCoreSet(_newAddress);
    }
    
    function _getSoulShardToken() internal view returns (address) {
        return dungeonCore.soulShardTokenAddress();
    }

    function setCommissionRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 2000, "Vault: Commission rate > 20%");
        commissionRate = _newRate;
    }

    function withdrawTax() external onlyOwner {
        uint256 tax = virtualTaxBalance;
        require(tax > 0, "Vault: No tax to withdraw");
        
        virtualTaxBalance = 0;
        IERC20(_getSoulShardToken()).safeTransfer(owner(), tax);
    }

    function withdrawGameRevenue(uint256 amount) external onlyOwner {
        IERC20 token = IERC20(_getSoulShardToken());
        uint256 contractBalance = token.balanceOf(address(this));
        
        if (amount == 0 || amount > contractBalance) {
            amount = contractBalance;
        }
        
        if (amount == 0) {
            return;
        }
        
        token.safeTransfer(owner(), amount);
    }

    function emergencyWithdrawSoulShard(uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_getSoulShardToken());
        uint256 contractBalance = token.balanceOf(address(this));
        
        if (_amount == 0 || _amount > contractBalance) {
            _amount = contractBalance;
        }
        
        if (_amount == 0) {
            return;
        }
        
        token.safeTransfer(owner(), _amount);
    }

    function getPlayerInfo(address _player) external view returns (
        uint256 withdrawableBalance,
        uint256 lastWithdrawTimestamp,
        uint256 lastFreeWithdrawTimestamp,
        address referrer
    ) {
        PlayerInfo storage player = playerInfo[_player];
        return (
            player.withdrawableBalance,
            player.lastWithdrawTimestamp,
            player.lastFreeWithdrawTimestamp,
            referrers[_player]
        );
    }

    function getTotalCommissionPaid(address _user) external view returns (uint256) {
        return totalCommissionPaid[_user];
    }

    function getCommissionBalance(address _user) external view returns (uint256) {
        return virtualCommissionBalance[_user];
    }

    function getTaxBalance() external view returns (uint256) {
        return virtualTaxBalance;
    }

    function getTaxRateForAmount(address _player, uint256 _amount) external view returns (uint256) {
        uint256 amountUSD = dungeonCore.getUSDValueForSoulShard(_amount);
        return _calculateTaxRate(_player, amountUSD);
    }
    
    function isInitialized() external view returns (bool isReady, address tokenAddress, address coreAddress) {
        tokenAddress = _getSoulShardToken();
        coreAddress = address(dungeonCore);
        isReady = tokenAddress != address(0) && coreAddress != address(0);
    }

    // Allow contract to receive BNB for username registration fees
    receive() external payable {}
}
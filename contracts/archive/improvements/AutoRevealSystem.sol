// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title AutoRevealHero
 * @notice 使用 Chainlink Automation 實現自動揭示
 * @dev 完全消除用戶需要手動揭示的負擔
 */
contract AutoRevealHero is AutomationCompatibleInterface {
    
    // ========== 核心改變：單步驟鑄造 ==========
    
    struct Commitment {
        uint256 blockNumber;
        uint256 quantity;
        uint256 payment;
        bytes32 seed;
        uint8 maxRarity;
        bool revealed;      // 新增：是否已揭示
        uint256[] tokenIds; // 新增：預分配的 tokenId
    }
    
    mapping(address => Commitment) public commitments;
    address[] public pendingReveals; // 待揭示隊列
    mapping(address => uint256) public revealIndex; // 隊列索引
    
    uint256 constant REVEAL_DELAY = 3; // 3 區塊延遲足夠
    uint256 constant BATCH_SIZE = 50;  // 每次最多處理 50 個
    
    // ========== 用戶交互：只需一步 ==========
    
    function mintHeroes(uint256 quantity, uint8 maxRarity) external payable {
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        require(commitments[msg.sender].blockNumber == 0, "Pending reveal");
        
        uint256 totalPrice = calculatePrice(quantity, maxRarity);
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // 預分配 tokenId（但不實際鑄造）
        uint256[] memory preAllocatedIds = new uint256[](quantity);
        for (uint i = 0; i < quantity; i++) {
            preAllocatedIds[i] = nextTokenId + i;
        }
        nextTokenId += quantity;
        
        // 創建承諾
        commitments[msg.sender] = Commitment({
            blockNumber: block.number,
            quantity: quantity,
            payment: msg.value,
            seed: keccak256(abi.encodePacked(
                msg.sender,
                block.number,
                block.prevrandao,
                quantity,
                maxRarity
            )),
            maxRarity: maxRarity,
            revealed: false,
            tokenIds: preAllocatedIds
        });
        
        // 加入自動揭示隊列
        if (revealIndex[msg.sender] == 0) {
            pendingReveals.push(msg.sender);
            revealIndex[msg.sender] = pendingReveals.length;
        }
        
        emit CommitmentCreated(msg.sender, quantity, maxRarity, preAllocatedIds);
    }
    
    // ========== Chainlink Automation 接口 ==========
    
    /**
     * @notice Chainlink 節點調用此函數檢查是否需要執行
     * @return upkeepNeeded 是否需要執行
     * @return performData 要處理的地址列表
     */
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        address[] memory readyToReveal = new address[](BATCH_SIZE);
        uint256 count = 0;
        
        for (uint256 i = 0; i < pendingReveals.length && count < BATCH_SIZE; i++) {
            address user = pendingReveals[i];
            if (user == address(0)) continue;
            
            Commitment memory c = commitments[user];
            if (c.blockNumber > 0 && 
                !c.revealed && 
                block.number >= c.blockNumber + REVEAL_DELAY) {
                readyToReveal[count] = user;
                count++;
            }
        }
        
        if (count > 0) {
            // 只編碼實際需要處理的地址
            address[] memory toProcess = new address[](count);
            for (uint256 i = 0; i < count; i++) {
                toProcess[i] = readyToReveal[i];
            }
            return (true, abi.encode(toProcess));
        }
        
        return (false, "");
    }
    
    /**
     * @notice Chainlink 節點執行自動揭示
     * @param performData 包含要揭示的地址列表
     */
    function performUpkeep(bytes calldata performData) external override {
        address[] memory users = abi.decode(performData, (address[]));
        
        for (uint256 i = 0; i < users.length; i++) {
            _autoReveal(users[i]);
        }
    }
    
    // ========== 核心揭示邏輯 ==========
    
    function _autoReveal(address user) internal {
        Commitment storage c = commitments[user];
        
        // 安全檢查
        if (c.blockNumber == 0 || c.revealed) return;
        if (block.number < c.blockNumber + REVEAL_DELAY) return;
        
        // 生成隨機屬性
        bytes32 randomSeed = keccak256(abi.encodePacked(
            c.seed,
            block.prevrandao,
            block.timestamp
        ));
        
        // 鑄造 NFT
        for (uint256 i = 0; i < c.quantity; i++) {
            uint256 tokenId = c.tokenIds[i];
            
            // 生成屬性
            HeroAttributes memory attrs = _generateAttributes(
                randomSeed,
                i,
                c.maxRarity
            );
            
            // 實際鑄造
            _safeMint(user, tokenId);
            heroAttributes[tokenId] = attrs;
            
            emit HeroRevealed(user, tokenId, attrs);
        }
        
        // 標記已揭示
        c.revealed = true;
        
        // 從隊列移除
        _removeFromQueue(user);
        
        emit AutoRevealCompleted(user, c.quantity);
    }
    
    // ========== 備用手動揭示 ==========
    
    /**
     * @notice 用戶仍可選擇手動揭示（如果等不及）
     */
    function manualReveal() external {
        Commitment storage c = commitments[msg.sender];
        require(c.blockNumber > 0, "No commitment");
        require(!c.revealed, "Already revealed");
        require(
            block.number >= c.blockNumber + REVEAL_DELAY,
            "Too early"
        );
        
        _autoReveal(msg.sender);
    }
    
    // ========== 極簡用戶體驗 ==========
    
    /**
     * @notice 查詢用戶的 NFT 狀態
     * @return status 當前狀態："none" / "pending" / "ready" / "completed"
     * @return tokenIds 分配的 tokenId（即使未揭示）
     * @return estimatedRevealTime 預計揭示時間
     */
    function getUserStatus(address user) 
        external 
        view 
        returns (
            string memory status,
            uint256[] memory tokenIds,
            uint256 estimatedRevealTime
        ) 
    {
        Commitment memory c = commitments[user];
        
        if (c.blockNumber == 0) {
            return ("none", new uint256[](0), 0);
        }
        
        if (c.revealed) {
            return ("completed", c.tokenIds, 0);
        }
        
        uint256 revealBlock = c.blockNumber + REVEAL_DELAY;
        if (block.number >= revealBlock) {
            return ("ready", c.tokenIds, 0);
        }
        
        // BSC: 0.75 秒/區塊
        uint256 blocksRemaining = revealBlock - block.number;
        uint256 secondsRemaining = blocksRemaining * 750 / 1000;
        
        return (
            "pending", 
            c.tokenIds,
            block.timestamp + secondsRemaining
        );
    }
    
    // ========== Gas 優化 ==========
    
    function _removeFromQueue(address user) internal {
        uint256 index = revealIndex[user];
        if (index > 0) {
            delete pendingReveals[index - 1];
            delete revealIndex[user];
        }
    }
    
    // 定期清理隊列（管理員功能）
    function cleanupQueue() external onlyOwner {
        uint256 writeIndex = 0;
        for (uint256 readIndex = 0; readIndex < pendingReveals.length; readIndex++) {
            address user = pendingReveals[readIndex];
            if (user != address(0) && !commitments[user].revealed) {
                if (writeIndex != readIndex) {
                    pendingReveals[writeIndex] = user;
                    revealIndex[user] = writeIndex + 1;
                }
                writeIndex++;
            }
        }
        
        // 縮減數組
        for (uint256 i = writeIndex; i < pendingReveals.length; i++) {
            delete pendingReveals[i];
        }
    }
}

/**
 * @title 完全無需擔心的實現
 * @dev 用戶體驗：
 * 1. 用戶點擊鑄造，支付費用
 * 2. 立即獲得 tokenId（可以展示 loading 狀態）
 * 3. 2-3 秒後自動揭示屬性
 * 4. 用戶完全不需要做任何事
 */
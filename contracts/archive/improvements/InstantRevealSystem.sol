// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InstantRevealHero
 * @notice 瞬時揭示系統 - 使用未來區塊哈希
 * @dev 完全消除等待時間
 */
contract InstantRevealHero {
    
    // ========== 方案1：預提交 + 即時揭示 ==========
    
    mapping(uint256 => bytes32) public futureBlockCommitments;
    uint256 public currentRevealBlock;
    
    /**
     * @notice 一步到位的鑄造
     * @dev 使用下一個區塊的哈希作為隨機源
     */
    function instantMint(uint256 quantity, uint8 maxRarity) 
        external 
        payable 
        returns (uint256[] memory tokenIds) 
    {
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        uint256 totalPrice = calculatePrice(quantity, maxRarity);
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // 分配 tokenId
        tokenIds = new uint256[](quantity);
        uint256 startId = nextTokenId;
        
        for (uint256 i = 0; i < quantity; i++) {
            tokenIds[i] = startId + i;
            
            // 預鑄造（稍後填充屬性）
            _safeMint(msg.sender, tokenIds[i]);
            
            // 暫存鑄造信息
            pendingTokens[tokenIds[i]] = TokenInfo({
                owner: msg.sender,
                maxRarity: maxRarity,
                revealBlock: block.number + 1,
                revealed: false
            });
        }
        
        nextTokenId = startId + quantity;
        
        // 在下一個區塊自動揭示
        if (futureBlockCommitments[block.number + 1] == 0) {
            futureBlockCommitments[block.number + 1] = keccak256(
                abi.encodePacked(block.timestamp, msg.sender, quantity)
            );
        }
        
        emit TokensMinted(msg.sender, tokenIds);
        return tokenIds;
    }
    
    /**
     * @notice 任何人都可以觸發揭示（包括合約自己）
     * @dev 獎勵觸發者少量 gas 補償
     */
    function revealPendingTokens(uint256[] calldata tokenIds) external {
        uint256 gasStart = gasleft();
        uint256 revealed = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            TokenInfo storage info = pendingTokens[tokenIds[i]];
            
            if (info.revealBlock <= block.number && !info.revealed) {
                // 使用區塊哈希生成隨機數
                bytes32 randomSeed = keccak256(abi.encodePacked(
                    blockhash(info.revealBlock),
                    tokenIds[i]
                ));
                
                // 生成並設置屬性
                HeroAttributes memory attrs = _generateAttributes(
                    randomSeed,
                    info.maxRarity
                );
                
                heroAttributes[tokenIds[i]] = attrs;
                info.revealed = true;
                revealed++;
                
                emit HeroRevealed(info.owner, tokenIds[i], attrs);
            }
        }
        
        // 獎勵揭示者（補償 gas）
        if (revealed > 0 && msg.sender != address(this)) {
            uint256 gasUsed = gasStart - gasleft();
            uint256 reward = gasUsed * tx.gasprice * 110 / 100; // 110% gas 補償
            payable(msg.sender).transfer(Math.min(reward, address(this).balance));
        }
    }
    
    // ========== 方案2：VRF 預言機（Chainlink VRF） ==========
    
    /**
     * @notice 使用 Chainlink VRF 的真隨機數
     * @dev 更安全但需要 LINK 代幣
     */
    function mintWithVRF(uint256 quantity, uint8 maxRarity) 
        external 
        payable 
        returns (uint256 requestId) 
    {
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        uint256 totalPrice = calculatePrice(quantity, maxRarity);
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // 請求隨機數
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations, // 3 個區塊確認
            callbackGasLimit,
            quantity // 請求 quantity 個隨機數
        );
        
        // 記錄請求
        vrfRequests[requestId] = VRFRequest({
            user: msg.sender,
            quantity: quantity,
            maxRarity: maxRarity,
            fulfilled: false
        });
        
        return requestId;
    }
    
    /**
     * @notice VRF 回調 - 自動執行
     * @dev Chainlink 節點自動調用
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        VRFRequest storage request = vrfRequests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        
        for (uint256 i = 0; i < request.quantity; i++) {
            uint256 tokenId = nextTokenId++;
            
            // 使用 VRF 隨機數生成屬性
            HeroAttributes memory attrs = _generateAttributes(
                bytes32(randomWords[i]),
                request.maxRarity
            );
            
            // 鑄造並設置屬性
            _safeMint(request.user, tokenId);
            heroAttributes[tokenId] = attrs;
            
            emit HeroRevealed(request.user, tokenId, attrs);
        }
        
        request.fulfilled = true;
    }
    
    // ========== 方案3：樂觀揭示 ==========
    
    /**
     * @notice 先給予臨時屬性，後續確認
     * @dev 最佳用戶體驗
     */
    function optimisticMint(uint256 quantity, uint8 maxRarity) 
        external 
        payable 
        returns (uint256[] memory tokenIds) 
    {
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        uint256 totalPrice = calculatePrice(quantity, maxRarity);
        require(msg.value >= totalPrice, "Insufficient payment");
        
        tokenIds = new uint256[](quantity);
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = nextTokenId++;
            tokenIds[i] = tokenId;
            
            // 立即鑄造並給予臨時屬性
            _safeMint(msg.sender, tokenId);
            
            // 使用偽隨機生成臨時屬性
            bytes32 tempSeed = keccak256(abi.encodePacked(
                block.timestamp,
                msg.sender,
                tokenId,
                i
            ));
            
            HeroAttributes memory tempAttrs = _generateAttributes(
                tempSeed,
                maxRarity
            );
            
            // 設置臨時屬性
            heroAttributes[tokenId] = tempAttrs;
            isTemporary[tokenId] = true;
            
            // 3 個區塊後最終確認
            finalizeQueue[block.number + 3].push(tokenId);
            
            emit HeroMintedOptimistically(msg.sender, tokenId, tempAttrs);
        }
        
        return tokenIds;
    }
    
    /**
     * @notice 最終確認屬性
     * @dev 任何人都可以調用
     */
    function finalizeBatch(uint256 blockNumber) external {
        require(block.number > blockNumber, "Too early");
        uint256[] storage batch = finalizeQueue[blockNumber];
        
        bytes32 finalSeed = blockhash(blockNumber);
        if (finalSeed == 0) {
            // 如果區塊哈希不可用，使用當前區塊
            finalSeed = blockhash(block.number - 1);
        }
        
        for (uint256 i = 0; i < batch.length; i++) {
            uint256 tokenId = batch[i];
            if (isTemporary[tokenId]) {
                // 生成最終屬性
                HeroAttributes memory finalAttrs = _generateAttributes(
                    keccak256(abi.encodePacked(finalSeed, tokenId)),
                    getMaxRarity(tokenId)
                );
                
                // 更新屬性
                heroAttributes[tokenId] = finalAttrs;
                isTemporary[tokenId] = false;
                
                emit HeroFinalized(ownerOf(tokenId), tokenId, finalAttrs);
            }
        }
        
        delete finalizeQueue[blockNumber];
    }
}

/**
 * @title 用戶體驗對比
 * 
 * 傳統方式：
 * 1. 用戶鑄造（交易1）
 * 2. 等待 3 分鐘
 * 3. 用戶揭示（交易2）
 * 4. 可能錯過導致損失
 * 
 * 自動揭示：
 * 1. 用戶鑄造
 * 2. 系統自動揭示（無需操作）
 * 
 * 即時揭示：
 * 1. 用戶鑄造
 * 2. 立即獲得 NFT（1-3 秒）
 * 
 * 樂觀揭示：
 * 1. 用戶鑄造
 * 2. 立即看到 NFT（臨時屬性）
 * 3. 幾秒後自動最終確認
 */
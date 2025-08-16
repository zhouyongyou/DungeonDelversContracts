// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockDungeonMaster
 * @notice 模擬 DungeonMaster 合約，用於測試向後兼容性
 * @dev 使用舊的 payable 調用方式測試 VRF 兼容性
 */

interface IVRFManager {
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external payable returns (uint256);
}

contract MockDungeonMaster {
    IVRFManager public vrfManager;
    
    event ExpeditionRequested(address indexed user, uint256 indexed partyId, uint256 vrfRequestId);
    
    constructor(address _vrfManager) {
        vrfManager = IVRFManager(_vrfManager);
    }
    
    /**
     * @notice 模擬探索請求（使用舊的 payable 方式）
     * @dev 這模擬了原本 DungeonMaster 的調用模式
     */
    function requestExpedition(address user, uint256 partyId) external payable {
        // 模擬 DungeonMaster 的舊調用方式 - 傳遞 VRF 費用
        uint256 requestId = vrfManager.requestRandomForUser{value: msg.value}(
            user,
            1, // quantity
            1, // maxRarity (對探索無意義)
            keccak256(abi.encodePacked(user, partyId, block.timestamp))
        );
        
        emit ExpeditionRequested(user, partyId, requestId);
    }
    
    /**
     * @notice 模擬 AltarOfAscension 的調用模式
     */
    function requestUpgrade(address user, uint256[] memory tokenIds) external payable {
        // 模擬升級請求
        uint256 requestId = vrfManager.requestRandomForUser{value: msg.value}(
            user,
            tokenIds.length,
            5, // maxRarity
            keccak256(abi.encodePacked(user, tokenIds, block.timestamp))
        );
        
        emit ExpeditionRequested(user, tokenIds[0], requestId);
    }
    
    /**
     * @notice 測試無 ETH 的調用（新模式）
     */
    function requestWithoutEth(address user, uint256 partyId) external {
        uint256 requestId = vrfManager.requestRandomForUser(
            user,
            1,
            1,
            keccak256(abi.encodePacked(user, partyId, block.timestamp))
        );
        
        emit ExpeditionRequested(user, partyId, requestId);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/interfaces.sol";

contract DungeonMaster_DelayedReveal is Ownable, Pausable, ReentrancyGuard {
    
    // --- 延遲揭示結構 ---
    struct ExpeditionCommit {
        uint256 blockNumber;
        uint256 partyId;
        uint256 dungeonId;
        bytes32 commitment;
        bool revealed;
        address player;
    }
    
    // --- 狀態變數 ---
    IDungeonCore public dungeonCore;
    IDungeonStorage public dungeonStorage;
    IParty public partyContract;
    IOracle public oracle;
    IERC20 public soulShardToken;
    
    uint256 public dynamicSeed;
    
    // 延遲揭示參數
    uint256 public constant REVEAL_BLOCK_DELAY = 3;
    uint256 public constant MAX_REVEAL_WINDOW = 255; // 約 12.75 分鐘的揭示窗口

    // 遊戲設定
    uint256 public expeditionFee = 0.01 ether;
    uint256 public treasurePriceUSD = 5 * 10**18; // $5 USD
    uint256 public soulShardRewardPerTreasure = 10**18; // 1 SoulShard per treasure
    
    // 地城基礎成功率
    mapping(uint256 => uint256) public dungeonBaseSuccessRates;
    
    // 延遲揭示映射
    mapping(bytes32 => ExpeditionCommit) public expeditionCommitments;
    mapping(address => bytes32[]) public userPendingExpeditions;
    
    // 事件
    event ExpeditionCommitted(
        address indexed player,
        bytes32 indexed commitmentId,
        uint256 partyId,
        uint256 dungeonId,
        uint256 blockNumber
    );
    
    event ExpeditionRevealed(
        address indexed player,
        bytes32 indexed commitmentId,
        uint256 partyId,
        uint256 dungeonId,
        bool success,
        uint256 reward,
        uint256 expGained
    );
    
    event DynamicSeedUpdated(uint256 newSeed);
    event ContractsSet(address core, address storage, address party, address oracle, address token);
    event DungeonBaseSuccessRateSet(uint256 dungeonId, uint256 rate);
    event ExpeditionFeeSet(uint256 fee);
    event TreasurePriceSet(uint256 price);
    event SoulShardRewardSet(uint256 reward);
    event DungeonWalletAddressSet(address newAddress);
    
    // 戰利品錢包地址
    address public dungeonWalletAddress;
    
    constructor(address _initialOwner) Ownable(_initialOwner) {
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    }
    
    // --- 延遲揭示地城探索 ---
    
    // 步驟 1: 提交探索請求
    function commitExpedition(uint256 _partyId, uint256 _dungeonId, bytes32 _commitment) external payable whenNotPaused nonReentrant {
        require(msg.value >= expeditionFee, "DungeonMaster: Insufficient fee");
        require(partyContract.ownerOf(_partyId) == msg.sender, "DungeonMaster: Not party owner");
        
        // 驗證地城
        (uint256 requiredLevel, , , ) = dungeonStorage.getDungeonInfo(_dungeonId);
        require(requiredLevel > 0, "DungeonMaster: Invalid dungeon");
        
        // 驗證隊伍等級
        uint256 partyLevel = partyContract.getPartyLevel(_partyId);
        require(partyLevel >= requiredLevel, "DungeonMaster: Party level too low");
        
        // 檢查隊伍冷卻
        require(!dungeonStorage.isPartyCoolingDown(_partyId), "DungeonMaster: Party is cooling down");
        
        // 生成唯一的承諾ID
        bytes32 commitmentId = keccak256(abi.encodePacked(
            msg.sender,
            block.number,
            _commitment,
            _partyId,
            _dungeonId
        ));
        
        // 存儲承諾
        expeditionCommitments[commitmentId] = ExpeditionCommit({
            blockNumber: block.number,
            partyId: _partyId,
            dungeonId: _dungeonId,
            commitment: _commitment,
            revealed: false,
            player: msg.sender
        });
        
        userPendingExpeditions[msg.sender].push(commitmentId);
        
        // 設置隊伍冷卻（立即生效，防止重複使用）
        dungeonStorage.setPartyCooldown(_partyId);
        
        emit ExpeditionCommitted(
            msg.sender,
            commitmentId,
            _partyId,
            _dungeonId,
            block.number
        );
    }
    
    // 步驟 2: 揭示探索結果
    function revealExpedition(bytes32 _commitmentId, uint256 _nonce) external whenNotPaused nonReentrant {
        ExpeditionCommit storage commitment = expeditionCommitments[_commitmentId];
        require(commitment.player == msg.sender, "DungeonMaster: Not your commitment");
        require(!commitment.revealed, "DungeonMaster: Already revealed");
        require(block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY, "DungeonMaster: Too early to reveal");
        require(block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "DungeonMaster: Reveal window expired");
        
        // 驗證 commitment
        bytes32 calculatedCommitment = keccak256(abi.encodePacked(msg.sender, _nonce));
        require(calculatedCommitment == commitment.commitment, "DungeonMaster: Invalid reveal");
        
        commitment.revealed = true;
        
        // 使用未來區塊哈希生成隨機數
        uint256 revealBlockNumber = commitment.blockNumber + REVEAL_BLOCK_DELAY;
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            blockhash(revealBlockNumber),
            _nonce,
            dynamicSeed,
            commitment.player,
            commitment.partyId,
            commitment.dungeonId
        )));
        
        // 計算成功率
        uint256 partyPower = partyContract.getPartyPower(commitment.partyId);
        uint256 baseSuccessRate = dungeonBaseSuccessRates[commitment.dungeonId];
        
        // 加成計算
        uint256 powerBonus = (partyPower > 100) ? ((partyPower - 100) / 10) : 0;
        if (powerBonus > 30) powerBonus = 30;
        
        uint256 relicBonus = _calculateRelicBonus(commitment.partyId);
        
        uint256 finalSuccessRate = baseSuccessRate + powerBonus + relicBonus;
        if (finalSuccessRate > 100) finalSuccessRate = 100;
        
        // 判定結果
        bool success = (randomValue % 100) < finalSuccessRate;
        
        // 處理結果
        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(
            commitment.player,
            commitment.dungeonId,
            success
        );
        
        // 更新隊伍經驗
        if (expGained > 0) {
            dungeonStorage.addPartyExperience(commitment.partyId, expGained);
        }
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, randomValue, block.timestamp)));
        emit DynamicSeedUpdated(dynamicSeed);
        
        // 從待處理列表中移除
        _removePendingExpedition(msg.sender, _commitmentId);
        
        emit ExpeditionRevealed(
            msg.sender,
            _commitmentId,
            commitment.partyId,
            commitment.dungeonId,
            success,
            reward,
            expGained
        );
    }
    
    // 緊急取消函數（如果超過揭示窗口）
    function emergencyCancel(bytes32 _commitmentId) external nonReentrant {
        ExpeditionCommit storage commitment = expeditionCommitments[_commitmentId];
        require(commitment.player == msg.sender, "DungeonMaster: Not your commitment");
        require(!commitment.revealed, "DungeonMaster: Already revealed");
        require(block.number > commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "DungeonMaster: Still in reveal window");
        
        // 清除隊伍冷卻
        dungeonStorage.clearPartyCooldown(commitment.partyId);
        
        // 退還費用
        if (expeditionFee > 0) {
            payable(msg.sender).transfer(expeditionFee);
        }
        
        commitment.revealed = true; // 標記為已處理
        _removePendingExpedition(msg.sender, _commitmentId);
    }
    
    // 計算聖物加成
    function _calculateRelicBonus(uint256 _partyId) private view returns (uint256) {
        uint256[] memory relics = partyContract.getPartyRelics(_partyId);
        uint256 totalBonus = 0;
        
        for (uint256 i = 0; i < relics.length; i++) {
            if (relics[i] > 0) {
                (, uint256 effect, ) = IRelic(dungeonCore.relicAddress()).getRelicData(relics[i]);
                totalBonus += effect / 10;
            }
        }
        
        return totalBonus;
    }
    
    // 處理探索結果
    function _handleExpeditionOutcome(
        address _player,
        uint256 _dungeonId,
        bool _success
    ) private returns (uint256 reward, uint256 expGained) {
        if (_success) {
            // 成功：獲得獎勵
            (, uint256 treasureMin, uint256 treasureMax, uint256 expReward) = dungeonStorage.getDungeonInfo(_dungeonId);
            
            // 計算寶藏數量（簡化的隨機）
            uint256 treasures = treasureMin;
            if (treasureMax > treasureMin) {
                uint256 range = treasureMax - treasureMin + 1;
                treasures = treasureMin + (uint256(keccak256(abi.encodePacked(block.timestamp, _player))) % range);
            }
            
            // 計算 SoulShard 獎勵
            reward = treasures * soulShardRewardPerTreasure;
            
            // 發放獎勵
            if (reward > 0) {
                require(address(soulShardToken) != address(0), "DungeonMaster: SoulShard not set");
                require(soulShardToken.balanceOf(dungeonWalletAddress) >= reward, "DungeonMaster: Insufficient treasury");
                
                soulShardToken.transferFrom(dungeonWalletAddress, _player, reward);
            }
            
            expGained = expReward;
        } else {
            // 失敗：只獲得一半經驗
            (, , , uint256 expReward) = dungeonStorage.getDungeonInfo(_dungeonId);
            expGained = expReward / 2;
            reward = 0;
        }
    }
    
    // 從待處理列表中移除
    function _removePendingExpedition(address user, bytes32 commitmentId) private {
        bytes32[] storage pending = userPendingExpeditions[user];
        for (uint256 i = 0; i < pending.length; i++) {
            if (pending[i] == commitmentId) {
                pending[i] = pending[pending.length - 1];
                pending.pop();
                break;
            }
        }
    }
    
    // --- 查詢函數 ---
    
    function getUserPendingExpeditions(address _user) external view returns (bytes32[] memory) {
        return userPendingExpeditions[_user];
    }
    
    function getCommitmentDetails(bytes32 _commitmentId) external view returns (
        uint256 blockNumber,
        uint256 partyId,
        uint256 dungeonId,
        bool revealed,
        bool canReveal,
        uint256 blocksRemaining
    ) {
        ExpeditionCommit memory commitment = expeditionCommitments[_commitmentId];
        
        canReveal = !commitment.revealed && 
                    block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY &&
                    block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
        
        if (block.number < commitment.blockNumber + REVEAL_BLOCK_DELAY) {
            blocksRemaining = (commitment.blockNumber + REVEAL_BLOCK_DELAY) - block.number;
        } else {
            blocksRemaining = 0;
        }
        
        return (
            commitment.blockNumber,
            commitment.partyId,
            commitment.dungeonId,
            commitment.revealed,
            canReveal,
            blocksRemaining
        );
    }
    
    function calculateExpeditionSuccess(uint256 _partyId, uint256 _dungeonId) external view returns (
        uint256 baseRate,
        uint256 powerBonus,
        uint256 relicBonus,
        uint256 finalRate
    ) {
        uint256 partyPower = partyContract.getPartyPower(_partyId);
        baseRate = dungeonBaseSuccessRates[_dungeonId];
        
        powerBonus = (partyPower > 100) ? ((partyPower - 100) / 10) : 0;
        if (powerBonus > 30) powerBonus = 30;
        
        relicBonus = _calculateRelicBonus(_partyId);
        
        finalRate = baseRate + powerBonus + relicBonus;
        if (finalRate > 100) finalRate = 100;
    }
    
    // --- Owner 管理函式 ---
    
    function setContracts(
        address _dungeonCore,
        address _dungeonStorage,
        address _party,
        address _oracle,
        address _soulShard
    ) external onlyOwner {
        dungeonCore = IDungeonCore(_dungeonCore);
        dungeonStorage = IDungeonStorage(_dungeonStorage);
        partyContract = IParty(_party);
        oracle = IOracle(_oracle);
        soulShardToken = IERC20(_soulShard);
        
        emit ContractsSet(_dungeonCore, _dungeonStorage, _party, _oracle, _soulShard);
    }
    
    function setDungeonBaseSuccessRate(uint256 _dungeonId, uint256 _rate) external onlyOwner {
        require(_rate <= 100, "DungeonMaster: Rate too high");
        dungeonBaseSuccessRates[_dungeonId] = _rate;
        emit DungeonBaseSuccessRateSet(_dungeonId, _rate);
    }
    
    function setExpeditionFee(uint256 _fee) external onlyOwner {
        expeditionFee = _fee;
        emit ExpeditionFeeSet(_fee);
    }
    
    function setTreasurePriceUSD(uint256 _price) external onlyOwner {
        treasurePriceUSD = _price;
        emit TreasurePriceSet(_price);
    }
    
    function setSoulShardRewardPerTreasure(uint256 _reward) external onlyOwner {
        soulShardRewardPerTreasure = _reward;
        emit SoulShardRewardSet(_reward);
    }
    
    function setDungeonWalletAddress(address _address) external onlyOwner {
        require(_address != address(0), "DungeonMaster: Invalid address");
        dungeonWalletAddress = _address;
        emit DungeonWalletAddressSet(_address);
    }
    
    function updateDynamicSeed(uint256 _newSeed) external onlyOwner {
        dynamicSeed = _newSeed;
        emit DynamicSeedUpdated(_newSeed);
    }
    
    function withdrawBNB() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
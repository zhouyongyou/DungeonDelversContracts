// Relic_ForcedReveal.sol - 過期強制揭示版本（移除退款機制）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract Relic is ERC721, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    string public baseURI;
    string private _contractURI;
    
    struct RelicData {
        uint8 rarity;
        uint8 capacity;
        bool isRevealed;  // 新增：標記是否已揭示
    }
    mapping(uint256 => RelicData) public relicData;
    
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    address public ascensionAltarAddress;

    uint256 public dynamicSeed;
    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    
    // 移除獎勵池機制，簡化實現
    
    // 批量鑄造配置（保持不變）
    struct BatchTier {
        uint256 minQuantity;
        uint8 maxRarity;
        string tierName;
    }
    
    mapping(uint256 => BatchTier) public batchTiers;
    uint256 public tierCount;

    // === 新增：延遲揭示相關 ===
    uint256 public constant REVEAL_BLOCK_DELAY = 3;
    uint256 public constant MAX_REVEAL_WINDOW = 255;
    // 移除緩衝期，過期後任何人都可以觸發
    string public unrevealedURI = "https://dungeon-delvers-metadata-server.onrender.com/api/relic/unrevealed";
    
    struct MintCommitment {
        uint256 blockNumber;
        uint256 quantity;
        uint256 payment;
        bytes32 commitment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
    }
    
    mapping(address => MintCommitment) public userCommitments;
    mapping(address => uint256[]) public userPendingTokens;
    // === 結束新增 ===

    // --- 事件（保持原有順序，新增必要事件） ---
    event RelicMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds);
    event DynamicSeedUpdated(uint256 newSeed);
    event BatchTierSet(uint256 tierId, uint256 minQuantity, uint8 maxRarity, string tierName);
    event ContractsSet(address indexed core, address indexed token);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event AscensionAltarSet(address indexed newAddress);
    event RelicBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    // 新增事件
    event MintCommitted(address indexed player, uint256 quantity, uint256 blockNumber, bool fromVault);
    event RelicRevealed(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    event ForcedRevealExecuted(address indexed user, address indexed executor, uint256 quantity);
    event RevealedByProxy(address indexed user, address indexed proxy);
    
    modifier onlyAltar() {
        require(msg.sender == ascensionAltarAddress, "Relic: Caller is not the Altar");
        _;
    }
    
    constructor(
        address initialOwner
    ) ERC721("Dungeon Delvers Relic", "DDR") Ownable(initialOwner) {
        _nextTokenId = 1;
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.chainid)));
        
        _setupDefaultBatchTiers();
    }

    function _setupDefaultBatchTiers() private {
        // Tier 0: 1個 - 只有1-2星 (防撞庫限制)
        batchTiers[0] = BatchTier({
            minQuantity: 1,
            maxRarity: 2,
            tierName: "Single Mint"
        });
        
        // Tier 1: 5個 - 只有1-2星
        batchTiers[1] = BatchTier({
            minQuantity: 5,
            maxRarity: 2,
            tierName: "Bronze Pack"
        });
        
        // Tier 2: 10個 - 只有1-3星
        batchTiers[2] = BatchTier({
            minQuantity: 10,
            maxRarity: 3,
            tierName: "Silver Pack"
        });
        
        // Tier 3: 20個 - 只有1-4星
        batchTiers[3] = BatchTier({
            minQuantity: 20,
            maxRarity: 4,
            tierName: "Gold Pack"
        });
        
        // Tier 4: 50個 - 完整1-5星
        batchTiers[4] = BatchTier({
            minQuantity: 50,
            maxRarity: 5,
            tierName: "Platinum Pack"
        });
        
        tierCount = 5;
    }

    // 根據數量獲取對應的最大稀有度（保持不變）
    function getMaxRarityForQuantity(uint256 _quantity) public view returns (uint8 maxRarity, string memory tierName) {
        // 從高到低檢查階層
        for (uint256 i = tierCount; i > 0; i--) {
            uint256 tierId = i - 1;
            if (_quantity >= batchTiers[tierId].minQuantity) {
                return (batchTiers[tierId].maxRarity, batchTiers[tierId].tierName);
            }
        }
        
        // 如果沒有匹配到任何階層，返回默認的單個鑄造設定
        return (2, "Single Mint"); // 最高2星
    }

    // === 修改：mintFromWallet 改為兩步驟 ===
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Relic: Invalid quantity");
        require(msg.value >= platformFee * _quantity, "Relic: Platform fee not met");
        require(userCommitments[msg.sender].blockNumber == 0 || userCommitments[msg.sender].fulfilled, "Relic: Previous mint pending");
        
        (uint8 maxRarity, ) = getMaxRarityForQuantity(_quantity);
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        // 移除獎勵池貢獻機制
        
        // 生成承諾
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, block.number, _quantity));
        
        userCommitments[msg.sender] = MintCommitment({
            blockNumber: block.number,
            quantity: _quantity,
            payment: msg.value,
            commitment: commitment,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: false
        });
        
        emit MintCommitted(msg.sender, _quantity, block.number, false);
    }

    // === 修改：mintFromVault 改為兩步驟 ===
    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Relic: Invalid quantity");
        require(msg.value >= platformFee * _quantity, "Relic: Platform fee not met");
        require(userCommitments[msg.sender].blockNumber == 0 || userCommitments[msg.sender].fulfilled, "Relic: Previous mint pending");
        
        (uint8 maxRarity, ) = getMaxRarityForQuantity(_quantity);
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);
        
        // 移除獎勵池貢獻機制
        
        // 生成承諾
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, block.number, _quantity));
        
        userCommitments[msg.sender] = MintCommitment({
            blockNumber: block.number,
            quantity: _quantity,
            payment: msg.value,
            commitment: commitment,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: true
        });
        
        emit MintCommitted(msg.sender, _quantity, block.number, true);
    }

    // === 新增：揭示函數 ===
    function revealMint() external nonReentrant whenNotPaused {
        _revealMintFor(msg.sender);
    }
    
    // === 新增：代理揭示函數（允許任何人幫助揭示）===
    function revealMintFor(address user) external nonReentrant whenNotPaused {
        _revealMintFor(user);
        
        // 如果是代理揭示，發出特殊事件
        if (msg.sender != user) {
            emit RevealedByProxy(user, msg.sender);
        }
    }
    
    // 內部揭示邏輯
    function _revealMintFor(address user) private {
        MintCommitment storage commitment = userCommitments[user];
        require(commitment.blockNumber > 0, "Relic: No pending mint");
        require(!commitment.fulfilled, "Relic: Already revealed");
        require(block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY, "Relic: Too early to reveal");
        require(block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "Relic: Reveal window expired");
        
        _executeReveal(user, false);
    }

    // === 新增：過期強制揭示函數 ===
    function forceRevealExpired(address user) external nonReentrant whenNotPaused {
        MintCommitment storage commitment = userCommitments[user];
        require(commitment.blockNumber > 0, "Relic: No pending mint");
        require(!commitment.fulfilled, "Relic: Already revealed");
        
        uint256 expiredBlock = commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
        require(block.number > expiredBlock, "Relic: Not expired yet");
        
        _executeReveal(user, true);
        
        emit ForcedRevealExecuted(user, msg.sender, commitment.quantity);
    }

    // === 新增：統一的揭示執行邏輯 ===
    function _executeReveal(address user, bool isForced) private {
        MintCommitment storage commitment = userCommitments[user];
        commitment.fulfilled = true;
        
        // 使用未來區塊哈希生成隨機數
        uint256 revealBlockNumber = commitment.blockNumber + REVEAL_BLOCK_DELAY;
        bytes32 blockHash = blockhash(revealBlockNumber);
        if (blockHash == bytes32(0)) {
            blockHash = blockhash(block.number - 1);
        }
        
        uint256[] memory tokenIds = new uint256[](commitment.quantity);
        
        // 先鑄造為未揭示狀態
        for (uint256 i = 0; i < commitment.quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            
            relicData[tokenId] = RelicData({
                rarity: 0,
                capacity: 0,
                isRevealed: false
            });
            
            _safeMint(user, tokenId);
            userPendingTokens[user].push(tokenId);
        }
        
        // 立即揭示屬性
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isForced) {
                // 強制揭示：固定給最低稀有度作為懲罰
                _revealRelicForced(tokenIds[i], user);
            } else {
                // 正常揭示：使用完整隨機邏輯
                _revealRelic(tokenIds[i], i, commitment.maxRarity, blockHash, user);
            }
        }
        
        emit BatchMintCompleted(user, commitment.quantity, commitment.maxRarity, tokenIds);
        
        // 清理數據
        delete userCommitments[user];
        delete userPendingTokens[user];
    }

    // === 新增：正常揭示邏輯 ===
    function _revealRelic(uint256 _tokenId, uint256 _salt, uint8 _maxRarity, bytes32 _blockHash, address _owner) private {
        uint256 pseudoRandom = uint256(keccak256(abi.encodePacked(
            dynamicSeed,
            _blockHash,
            _owner,
            _salt,
            _tokenId
        )));
        
        (uint8 rarity, uint8 capacity) = _calculateAttributes(pseudoRandom, 0, _maxRarity);
        
        relicData[_tokenId].rarity = rarity;
        relicData[_tokenId].capacity = capacity;
        relicData[_tokenId].isRevealed = true;
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, pseudoRandom, uint256(capacity))));
        emit DynamicSeedUpdated(dynamicSeed);
        
        emit RelicMinted(_tokenId, _owner, rarity, capacity);
        emit RelicRevealed(_tokenId, _owner, rarity, capacity);
    }

    // === 新增：強制揭示邏輯（懲罰性結果）===
    function _revealRelicForced(uint256 _tokenId, address _owner) private {
        // 懲罰性結果：固定稀有度 1，容量也是最低
        uint8 rarity = 1;
        uint8 capacity = 1;
        
        relicData[_tokenId].rarity = rarity;
        relicData[_tokenId].capacity = capacity;
        relicData[_tokenId].isRevealed = true;
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, _tokenId, capacity)));
        emit DynamicSeedUpdated(dynamicSeed);
        
        emit RelicMinted(_tokenId, _owner, rarity, capacity);
        emit RelicRevealed(_tokenId, _owner, rarity, capacity);
    }

    // 以下保持原有函數不變...

    function _generateAndMintOnChain(address _to, uint256 _salt, uint8 _maxRarity) private returns (uint256) {
        // 此函數在新版本中不再使用，但為了保持向後兼容性保留
        return 0;
    }

    function _mintRelic(address _to, uint8 _rarity, uint8 _capacity) private returns (uint256) {
        uint256 tokenId = _nextTokenId;
        relicData[tokenId] = RelicData({
            rarity: _rarity,
            capacity: _capacity,
            isRevealed: true  // 直接鑄造的標記為已揭示
        });
        _safeMint(_to, tokenId);
        _nextTokenId++;
        emit RelicMinted(tokenId, _to, _rarity, _capacity);
        return tokenId;
    }

    // 來自祭壇的鑄造（不受批量限制，保持不變）
    function mintFromAltar(address _to, uint8 _rarity, uint8 _capacity) external onlyAltar returns (uint256) {
        return _mintRelic(_to, _rarity, _capacity);
    }

    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        address owner = ownerOf(_tokenId);
        RelicData memory data = relicData[_tokenId];
        require(data.isRevealed, "Relic: Cannot burn unrevealed relic");
        emit RelicBurned(_tokenId, owner, data.rarity, data.capacity);
        _burn(_tokenId);
    }

    function _calculateAttributes(uint256 _randomNumber, uint8 _fixedRarity, uint8 _maxRarity) private pure returns (uint8 rarity, uint8 capacity) {
        if (_fixedRarity > 0) {
            rarity = _fixedRarity;
        } else {
            rarity = _calculateRarityWithCap(_randomNumber, _maxRarity);
        }
        capacity = rarity; // 聖物的容量等於稀有度
    }

    function _calculateRarityWithCap(uint256 _randomNumber, uint8 _maxRarity) private pure returns (uint8) {
        uint256 rarityRoll = _randomNumber % 100;
        
        if (_maxRarity == 2) {
            if (rarityRoll < 65) return 1;
            else return 2;
        } else if (_maxRarity == 3) {
            if (rarityRoll < 50) return 1;
            else if (rarityRoll < 85) return 2;
            else return 3;
        } else if (_maxRarity == 4) {
            if (rarityRoll < 45) return 1;
            else if (rarityRoll < 80) return 2;
            else if (rarityRoll < 95) return 3;
            else return 4;
        } else if (_maxRarity == 5) {
            if (rarityRoll < 44) return 1;
            else if (rarityRoll < 79) return 2;
            else if (rarityRoll < 94) return 3;
            else if (rarityRoll < 99) return 4;
            else return 5;
        } else {
            revert("Relic: Invalid max rarity");
        }
    }

    // 查詢函數供前端使用（保持不變）
    function getBatchTierInfo(uint256 _quantity) external view returns (
        uint8 maxRarity,
        string memory tierName,
        uint256 exactTierQuantity,
        uint256 totalCost
    ) {
        (maxRarity, tierName) = getMaxRarityForQuantity(_quantity);
        
        // 找到確切的階層數量
        for (uint256 i = 0; i < tierCount; i++) {
            if (batchTiers[i].maxRarity == maxRarity) {
                exactTierQuantity = batchTiers[i].minQuantity;
                break;
            }
        }
        
        totalCost = getRequiredSoulShardAmount(_quantity);
    }

    // 獲取所有階層信息（保持不變）
    function getAllBatchTiers() external view returns (BatchTier[] memory) {
        BatchTier[] memory tiers = new BatchTier[](tierCount);
        for (uint256 i = 0; i < tierCount; i++) {
            tiers[i] = batchTiers[i];
        }
        return tiers;
    }

    // --- 元數據和查詢函數（修改 tokenURI） ---
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // 如果尚未揭示，直接返回未揭示的 URI（不拼接 tokenId）
        if (!relicData[tokenId].isRevealed) {
            return unrevealedURI;
        }
        
        require(bytes(baseURI).length > 0, "Relic: baseURI not set");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "DungeonCore address not set");
        if (_quantity == 0) return 0;
        uint256 priceForOne = dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
        return priceForOne * _quantity;
    }

    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint8 capacity) {
        _requireOwned(tokenId);
        RelicData memory data = relicData[tokenId];
        require(data.isRevealed, "Relic: Not yet revealed");
        return (data.rarity, data.capacity);
    }

    // === 新增：查詢函數 ===
    function getUserCommitment(address _user) external view returns (MintCommitment memory) {
        return userCommitments[_user];
    }
    
    function getUserPendingTokens(address _user) external view returns (uint256[] memory) {
        return userPendingTokens[_user];
    }
    
    function canReveal(address _user) external view returns (bool) {
        MintCommitment memory commitment = userCommitments[_user];
        return commitment.blockNumber > 0 && 
               !commitment.fulfilled && 
               block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY &&
               block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
    }
    
    function canForceReveal(address _user) external view returns (bool) {
        MintCommitment memory commitment = userCommitments[_user];
        return commitment.blockNumber > 0 && 
               !commitment.fulfilled && 
               block.number > commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
    }
    
    // 移除緩衝期查詢函數
    
    function getRevealBlocksRemaining(address _user) external view returns (uint256) {
        MintCommitment memory commitment = userCommitments[_user];
        if (commitment.blockNumber == 0 || commitment.fulfilled) return 0;
        if (block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY) return 0;
        return (commitment.blockNumber + REVEAL_BLOCK_DELAY) - block.number;
    }

    // --- Owner 管理函式（保持不變） ---
    
    function setBatchTier(uint256 _tierId, uint256 _minQuantity, uint8 _maxRarity, string memory _tierName) external onlyOwner {
        require(_tierId < 10, "Relic: Tier ID too large");
        require(_maxRarity >= 1 && _maxRarity <= 5, "Relic: Invalid max rarity");
        
        batchTiers[_tierId] = BatchTier({
            minQuantity: _minQuantity,
            maxRarity: _maxRarity,
            tierName: _tierName
        });
        
        // 更新階層數量
        if (_tierId >= tierCount) {
            tierCount = _tierId + 1;
        }
        
        emit BatchTierSet(_tierId, _minQuantity, _maxRarity, _tierName);
    }

    function setDungeonCore(address _address) public onlyOwner {
        dungeonCore = IDungeonCore(_address);
        emit ContractsSet(_address, address(soulShardToken));
    }

    function setSoulShardToken(address _address) public onlyOwner {
        soulShardToken = IERC20(_address);
        emit ContractsSet(address(dungeonCore), _address);
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    // === 新增：設置未揭示 URI（寫死，移除設置函數）===
    // unrevealedURI 已寫死，如需修改請重新部署合約

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    function setAscensionAltarAddress(address _address) public onlyOwner {
        ascensionAltarAddress = _address;
        emit AscensionAltarSet(_address);
    }

    function setMintPriceUSD(uint256 _newPrice) external onlyOwner {
        mintPriceUSD = _newPrice * 1e18;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdrawSoulShard() public onlyOwner {
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) soulShardToken.safeTransfer(owner(), balance);
    }

    function withdrawNativeFunding() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Native withdraw failed");
    }
    
    // 移除獎勵池提取函數

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }

    receive() external payable {}
}
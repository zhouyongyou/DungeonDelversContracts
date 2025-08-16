// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/interfaces.sol";

contract Hero_DelayedReveal is ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- 延遲揭示結構 ---
    struct CommitData {
        uint256 blockNumber;
        uint256 quantity;
        uint256 payment;
        bytes32 commitment;
        bool revealed;
        uint8 maxRarity;
    }

    struct HeroData {
        uint8 rarity;
        uint256 power;
        bool isRevealed;
    }

    // --- 狀態變數 ---
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    
    uint256 private _nextTokenId = 1;
    uint256 public dynamicSeed;
    address public ascensionAltarAddress;
    
    string public baseURI;
    string public contractURI;
    string public unrevealedURI = "ipfs://QmUnrevealedHero/";
    
    uint256 public mintPriceUSD = 2 * 10**18; // $2 USD
    uint256 public platformFee = 0.01 ether;
    
    // 延遲揭示參數
    uint256 public constant REVEAL_BLOCK_DELAY = 3;
    uint256 public constant MAX_REVEAL_WINDOW = 255; // 約 12.75 分鐘的揭示窗口

    // --- 映射 ---
    mapping(uint256 => HeroData) public heroData;
    mapping(address => CommitData) public userCommitments;
    mapping(address => uint256[]) public userUnrevealedTokens;

    // 批量鑄造配置
    struct BatchTier {
        uint256 minQuantity;
        uint8 maxRarity;
        string tierName;
    }
    
    mapping(uint256 => BatchTier) public batchTiers;
    uint256 public tierCount;

    // --- 事件 ---
    event HeroCommitted(address indexed player, uint256 quantity, uint256 blockNumber, bytes32 commitment);
    event HeroMinted(uint256 indexed tokenId, address indexed owner, uint256 blockNumber);
    event HeroRevealed(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event BatchRevealCompleted(address indexed player, uint256[] tokenIds);
    event DynamicSeedUpdated(uint256 newSeed);
    event BatchTierSet(uint256 tierId, uint256 minQuantity, uint8 maxRarity, string tierName);
    event ContractsSet(address indexed core, address indexed token);
    event AscensionAltarSet(address indexed newAddress);
    event BaseURISet(string newBaseURI);
    event UnrevealedURISet(string newURI);
    event ContractURIUpdated(string newContractURI);
    event HeroBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);

    modifier onlyAltar() {
        require(msg.sender == ascensionAltarAddress, "Hero: Caller is not the Altar");
        _;
    }

    constructor(address _initialOwner) Ownable(_initialOwner) ERC721("Dungeon Delvers Hero", "HERO") {
        contractURI = "https://api.dungeondelvers.com/metadata/herocontract.json";
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

    // 根據數量獲取對應的最大稀有度
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

    // --- 延遲揭示鑄造函數 ---
    
    // 步驟 1: 提交鑄造請求
    function commitMintFromWallet(uint256 _quantity, bytes32 _commitment) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Hero: Invalid quantity");
        require(msg.value >= platformFee * _quantity, "Hero: Platform fee not met");
        require(userCommitments[msg.sender].blockNumber == 0 || userCommitments[msg.sender].revealed, "Hero: Previous mint pending");
        
        (uint8 maxRarity, ) = getMaxRarityForQuantity(_quantity);
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        userCommitments[msg.sender] = CommitData({
            blockNumber: block.number,
            quantity: _quantity,
            payment: msg.value,
            commitment: _commitment,
            revealed: false,
            maxRarity: maxRarity
        });
        
        emit HeroCommitted(msg.sender, _quantity, block.number, _commitment);
    }

    function commitMintFromVault(uint256 _quantity, bytes32 _commitment) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Hero: Invalid quantity");
        require(msg.value >= platformFee * _quantity, "Hero: Platform fee not met");
        require(userCommitments[msg.sender].blockNumber == 0 || userCommitments[msg.sender].revealed, "Hero: Previous mint pending");
        
        (uint8 maxRarity, ) = getMaxRarityForQuantity(_quantity);
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);
        
        userCommitments[msg.sender] = CommitData({
            blockNumber: block.number,
            quantity: _quantity,
            payment: msg.value,
            commitment: _commitment,
            revealed: false,
            maxRarity: maxRarity
        });
        
        emit HeroCommitted(msg.sender, _quantity, block.number, _commitment);
    }

    // 步驟 2: 揭示並鑄造
    function revealMint(uint256 _nonce) external nonReentrant whenNotPaused {
        CommitData storage commitment = userCommitments[msg.sender];
        require(commitment.blockNumber > 0, "Hero: No pending mint");
        require(!commitment.revealed, "Hero: Already revealed");
        require(block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY, "Hero: Too early to reveal");
        require(block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "Hero: Reveal window expired");
        
        // 驗證 commitment
        bytes32 calculatedCommitment = keccak256(abi.encodePacked(msg.sender, _nonce));
        require(calculatedCommitment == commitment.commitment, "Hero: Invalid reveal");
        
        commitment.revealed = true;
        
        // 使用未來區塊哈希生成隨機數
        uint256 revealBlockNumber = commitment.blockNumber + REVEAL_BLOCK_DELAY;
        uint256 baseRandom = uint256(keccak256(abi.encodePacked(
            blockhash(revealBlockNumber),
            _nonce,
            dynamicSeed
        )));
        
        uint256[] memory tokenIds = new uint256[](commitment.quantity);
        
        // 鑄造所有 NFT（但尚未揭示屬性）
        for (uint256 i = 0; i < commitment.quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            
            // 先鑄造為未揭示狀態
            heroData[tokenId] = HeroData({
                rarity: 0,
                power: 0,
                isRevealed: false
            });
            
            _safeMint(msg.sender, tokenId);
            userUnrevealedTokens[msg.sender].push(tokenId);
            
            emit HeroMinted(tokenId, msg.sender, block.number);
        }
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, baseRandom, commitment.quantity)));
        emit DynamicSeedUpdated(dynamicSeed);
        
        // 立即為這批 NFT 生成屬性
        _revealBatch(tokenIds, baseRandom, commitment.maxRarity);
        
        // 清理 commitment
        delete userCommitments[msg.sender];
    }

    // 內部函數：批量揭示屬性
    function _revealBatch(uint256[] memory tokenIds, uint256 baseRandom, uint8 maxRarity) private {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 tokenRandom = uint256(keccak256(abi.encodePacked(baseRandom, i, tokenId)));
            
            (uint8 rarity, uint256 power) = _calculateAttributes(tokenRandom, 0, maxRarity);
            
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power,
                isRevealed: true
            });
            
            // 從未揭示列表中移除
            _removeFromUnrevealed(ownerOf(tokenId), tokenId);
            
            emit HeroRevealed(tokenId, ownerOf(tokenId), rarity, power);
        }
        
        emit BatchRevealCompleted(msg.sender, tokenIds);
    }

    // 緊急退款函數（如果超過揭示窗口）
    function emergencyRefund() external nonReentrant {
        CommitData storage commitment = userCommitments[msg.sender];
        require(commitment.blockNumber > 0, "Hero: No pending mint");
        require(!commitment.revealed, "Hero: Already revealed");
        require(block.number > commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "Hero: Still in reveal window");
        
        // 退還 SoulShard
        uint256 refundAmount = getRequiredSoulShardAmount(commitment.quantity);
        soulShardToken.safeTransfer(msg.sender, refundAmount);
        
        // 退還 BNB
        if (commitment.payment > 0) {
            payable(msg.sender).transfer(commitment.payment);
        }
        
        // 清理 commitment
        delete userCommitments[msg.sender];
    }

    // 從未揭示列表中移除
    function _removeFromUnrevealed(address owner, uint256 tokenId) private {
        uint256[] storage unrevealedList = userUnrevealedTokens[owner];
        for (uint256 i = 0; i < unrevealedList.length; i++) {
            if (unrevealedList[i] == tokenId) {
                unrevealedList[i] = unrevealedList[unrevealedList.length - 1];
                unrevealedList.pop();
                break;
            }
        }
    }

    // 祭壇鑄造（立即揭示）
    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external onlyAltar returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        heroData[tokenId] = HeroData({
            rarity: _rarity,
            power: _power,
            isRevealed: true
        });
        _safeMint(_to, tokenId);
        emit HeroMinted(tokenId, _to, block.number);
        emit HeroRevealed(tokenId, _to, _rarity, _power);
        return tokenId;
    }

    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        address owner = ownerOf(_tokenId);
        HeroData memory data = heroData[_tokenId];
        require(data.isRevealed, "Hero: Cannot burn unrevealed hero");
        emit HeroBurned(_tokenId, owner, data.rarity, data.power);
        _burn(_tokenId);
    }

    function _calculateAttributes(uint256 _randomNumber, uint8 _fixedRarity, uint8 _maxRarity) private pure returns (uint8 rarity, uint256 power) {
        if (_fixedRarity > 0) {
            rarity = _fixedRarity;
        } else {
            rarity = _calculateRarityWithCap(_randomNumber, _maxRarity);
        }
        power = _generateHeroPowerByRarity(rarity, _randomNumber >> 8);
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
            revert("Hero: Invalid max rarity");
        }
    }

    function _generateHeroPowerByRarity(uint8 _rarity, uint256 _randomNumber) private pure returns (uint256 power) {
        if (_rarity == 1) { power = 15 + (_randomNumber % (50 - 15 + 1)); }
        else if (_rarity == 2) { power = 50 + (_randomNumber % (100 - 50 + 1)); }
        else if (_rarity == 3) { power = 100 + (_randomNumber % (150 - 100 + 1)); }
        else if (_rarity == 4) { power = 150 + (_randomNumber % (200 - 150 + 1)); }
        else if (_rarity == 5) { power = 200 + (_randomNumber % (255 - 200 + 1)); }
        else { revert("Hero: Invalid rarity"); }
    }

    // --- 查詢函數 ---
    
    function getUserCommitment(address _user) external view returns (CommitData memory) {
        return userCommitments[_user];
    }
    
    function getUserUnrevealedTokens(address _user) external view returns (uint256[] memory) {
        return userUnrevealedTokens[_user];
    }
    
    function canReveal(address _user) external view returns (bool) {
        CommitData memory commitment = userCommitments[_user];
        return commitment.blockNumber > 0 && 
               !commitment.revealed && 
               block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY &&
               block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
    }
    
    function getRevealBlocksRemaining(address _user) external view returns (uint256) {
        CommitData memory commitment = userCommitments[_user];
        if (commitment.blockNumber == 0 || commitment.revealed) return 0;
        if (block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY) return 0;
        return (commitment.blockNumber + REVEAL_BLOCK_DELAY) - block.number;
    }

    // --- 元數據函數 ---
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // 如果尚未揭示，返回未揭示的 URI
        if (!heroData[tokenId].isRevealed) {
            return string(abi.encodePacked(unrevealedURI, Strings.toString(tokenId)));
        }
        
        require(bytes(baseURI).length > 0, "Hero: baseURI not set");
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
    }

    function getHeroData(uint256 _tokenId) external view returns (uint8 rarity, uint256 power, bool isRevealed) {
        HeroData memory data = heroData[_tokenId];
        return (data.rarity, data.power, data.isRevealed);
    }

    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "Hero: Dungeon Core not set");
        address oracleAddress = dungeonCore.oracleAddress();
        require(oracleAddress != address(0), "Hero: Oracle not set in Dungeon Core");
        
        uint256 totalMintPriceUSD = mintPriceUSD * _quantity;
        return IOracle(oracleAddress).getTokenAmountFromUSD(address(soulShardToken), totalMintPriceUSD);
    }

    // --- Owner 管理函式 ---
    
    function setBatchTier(uint256 _tierId, uint256 _minQuantity, uint8 _maxRarity, string memory _tierName) external onlyOwner {
        require(_tierId < 10, "Hero: Tier ID too large");
        require(_maxRarity >= 1 && _maxRarity <= 5, "Hero: Invalid max rarity");
        
        batchTiers[_tierId] = BatchTier({
            minQuantity: _minQuantity,
            maxRarity: _maxRarity,
            tierName: _tierName
        });
        
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

    function setAscensionAltarAddress(address _address) public onlyOwner {
        ascensionAltarAddress = _address;
        emit AscensionAltarSet(_address);
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    function setUnrevealedURI(string memory _newURI) public onlyOwner {
        unrevealedURI = _newURI;
        emit UnrevealedURISet(_newURI);
    }

    function setContractURI(string memory _newContractURI) public onlyOwner {
        contractURI = _newContractURI;
        emit ContractURIUpdated(_newContractURI);
    }

    function setMintPriceUSD(uint256 _price) public onlyOwner {
        mintPriceUSD = _price;
    }

    function setPlatformFee(uint256 _fee) public onlyOwner {
        platformFee = _fee;
    }

    function updateDynamicSeed(uint256 _newSeed) external onlyOwner {
        dynamicSeed = _newSeed;
        emit DynamicSeedUpdated(_newSeed);
    }

    function withdrawBNB() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawSoulShard() external onlyOwner {
        uint256 balance = soulShardToken.balanceOf(address(this));
        soulShardToken.safeTransfer(owner(), balance);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // --- 必須的覆寫函數 ---
    
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
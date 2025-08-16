// BatchMintComponent.tsx - 批量鑄造防撞庫前端組件
import React, { useState, useEffect } from 'react';
import { useReadContracts, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

interface BatchTier {
  minQuantity: number;
  maxRarity: number;
  tierName: string;
  probability: string[];
}

interface BatchMintComponentProps {
  contractAddress: `0x${string}`;
  contractAbi: any;
  nftType: 'hero' | 'relic';
}

const BatchMintComponent: React.FC<BatchMintComponentProps> = ({
  contractAddress,
  contractAbi,
  nftType
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(50);
  const [customQuantity, setCustomQuantity] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [batchTiers, setBatchTiers] = useState<BatchTier[]>([]);
  
  const { writeContractAsync } = useWriteContract();

  // 預設的批量選項，對應不同的稀有度上限
  const quickSelectOptions = [
    { quantity: 50, label: '50個 - 鉑金包', emoji: '💎', description: '解鎖所有稀有度(1-5★)' },
    { quantity: 20, label: '20個 - 黃金包', emoji: '🥇', description: '最高4★稀有度' },
    { quantity: 10, label: '10個 - 白銀包', emoji: '🥈', description: '最高3★稀有度' },
    { quantity: 5, label: '5個 - 青銅包', emoji: '🥉', description: '最高2★稀有度' }
  ];

  // 讀取合約的批量階層信息
  const { data: tierData } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getAllBatchTiers'
      }
    ]
  });

  // 讀取當前選中數量的詳細信息
  const { data: batchInfo } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getBatchTierInfo',
        args: [selectedQuantity]
      }
    ]
  });

  useEffect(() => {
    if (tierData?.[0]?.result) {
      const tiers = tierData[0].result as any[];
      const formattedTiers = tiers.map(tier => ({
        minQuantity: Number(tier.minQuantity),
        maxRarity: Number(tier.maxRarity),
        tierName: tier.tierName,
        probability: getProbabilityForRarity(Number(tier.maxRarity))
      }));
      setBatchTiers(formattedTiers);
    }
  }, [tierData]);

  // 根據最大稀有度返回機率分布
  const getProbabilityForRarity = (maxRarity: number): string[] => {
    switch (maxRarity) {
      case 2:
        return ['60%', '40%', '0%', '0%', '0%'];
      case 3:
        return ['50%', '35%', '15%', '0%', '0%'];
      case 4:
        return ['45%', '35%', '15%', '5%', '0%'];
      case 5:
        return ['44%', '35%', '15%', '5%', '1%'];
      default:
        return ['0%', '0%', '0%', '0%', '0%'];
    }
  };

  const getCurrentTierInfo = () => {
    if (!batchInfo?.[0]?.result) return null;
    
    const [maxRarity, tierName, exactTierQuantity, totalCost] = batchInfo[0].result as [number, string, bigint, bigint];
    
    return {
      maxRarity,
      tierName,
      exactTierQuantity: Number(exactTierQuantity),
      totalCost: formatEther(totalCost),
      probability: getProbabilityForRarity(maxRarity)
    };
  };

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    setIsCustom(false);
    setCustomQuantity('');
  };

  const handleCustomQuantityChange = (value: string) => {
    setCustomQuantity(value);
    setIsCustom(true);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 5) {
      setSelectedQuantity(numValue);
    }
  };

  const handleMint = async (useVault: boolean = false) => {
    try {
      const functionName = useVault ? 'mintFromVault' : 'mintFromWallet';
      const platformFee = parseEther('0.0003') * BigInt(selectedQuantity);
      
      await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName,
        args: [selectedQuantity],
        value: platformFee
      });
    } catch (error) {
      console.error('Mint failed:', error);
    }
  };

  const currentTier = getCurrentTierInfo();
  const rarityLabels = ['1★', '2★', '3★', '4★', '5★'];
  const rarityColors = ['text-gray-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-yellow-400'];

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {nftType === 'hero' ? '英雄' : '聖物'} NFT 批量鑄造
        </h2>
        <p className="text-gray-400">
          🛡️ 防撞庫機制：更大的批量 = 更高的稀有度上限
        </p>
      </div>

      {/* 快速選擇 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {quickSelectOptions.map((option) => (
          <button
            key={option.quantity}
            onClick={() => handleQuantitySelect(option.quantity)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedQuantity === option.quantity && !isCustom
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">{option.emoji}</div>
            <div className="text-white font-semibold">{option.label}</div>
            <div className="text-xs text-gray-400 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {/* 自定義數量 */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">自定義數量 (最少5個):</label>
        <input
          type="number"
          min="5"
          value={customQuantity}
          onChange={(e) => handleCustomQuantityChange(e.target.value)}
          placeholder="輸入數量..."
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white"
        />
      </div>

      {/* 當前階層信息 */}
      {currentTier && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              {currentTier.tierName} - 數量: {selectedQuantity}
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {currentTier.totalCost} $SOUL
              </div>
              <div className="text-sm text-gray-400">
                約 ${(parseFloat(currentTier.totalCost) * 2).toFixed(0)} USD
              </div>
            </div>
          </div>

          {/* 稀有度機率顯示 */}
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-white mb-3">稀有度機率分布:</h4>
            <div className="grid grid-cols-5 gap-2">
              {currentTier.probability.map((prob, index) => (
                <div
                  key={index}
                  className={`text-center p-3 rounded-lg ${
                    prob === '0%' ? 'bg-gray-700 opacity-50' : 'bg-gray-700'
                  }`}
                >
                  <div className={`text-lg font-bold ${rarityColors[index]}`}>
                    {rarityLabels[index]}
                  </div>
                  <div className={`text-sm ${prob === '0%' ? 'text-gray-500' : 'text-white'}`}>
                    {prob}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 期望收益計算 */}
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">期望收益:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">最高稀有度:</span>
                <span className={`ml-2 font-bold ${rarityColors[currentTier.maxRarity - 1]}`}>
                  {currentTier.maxRarity}★
                </span>
              </div>
              <div>
                <span className="text-gray-400">保證獲得:</span>
                <span className="ml-2 text-white font-bold">
                  {selectedQuantity} 個 NFT
                </span>
              </div>
            </div>
          </div>

          {/* 鑄造按鈕 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleMint(false)}
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              從錢包鑄造
              <div className="text-xs opacity-80">需要 $SOUL 代幣</div>
            </button>
            <button
              onClick={() => handleMint(true)}
              className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              從金庫鑄造
              <div className="text-xs opacity-80">免稅鑄造</div>
            </button>
          </div>
        </div>
      )}

      {/* 防撞庫機制說明 */}
      <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
        <h4 className="text-yellow-400 font-bold mb-2">🛡️ 防撞庫機制說明:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• 小額鑄造 (5-10個) 無法獲得高稀有度NFT</li>
          <li>• 科學家必須投入更大成本才能撞庫稀有NFT</li>
          <li>• 批量越大，機率越透明，期望收益越高</li>
          <li>• 推薦選擇50個批量享受完整遊戲體驗</li>
        </ul>
      </div>
    </div>
  );
};

export default BatchMintComponent;
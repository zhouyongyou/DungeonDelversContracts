// PlayerProfile 前端更新指南

// ===== 1. 更新錯誤處理 =====

// utils/playerProfile.ts
export const handleProfileError = (error: any): string => {
  const message = error?.message || error?.data?.message || '';
  
  // 新增 SBT 和暫停相關錯誤
  if (message.includes('PlayerProfile: SBT cannot be approved')) {
    return '玩家檔案無法授權給其他地址';
  }
  if (message.includes('PlayerProfile: SBT cannot be transferred')) {
    return '玩家檔案無法轉移';
  }
  if (message.includes('PlayerProfile: This SBT is non-transferable')) {
    return '玩家檔案為靈魂綁定，無法操作';
  }
  if (message.includes('Pausable: paused')) {
    return '系統維護中，請稍後再試';
  }
  
  // 原有錯誤
  if (message.includes('Profile already exists')) {
    return '您已經擁有玩家檔案';
  }
  if (message.includes('DungeonCore not set')) {
    return '系統配置錯誤，請聯繫管理員';
  }
  
  return '操作失敗，請重試';
};

// ===== 2. 玩家檔案組件更新 =====

// components/PlayerProfile.tsx
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

export const PlayerProfileCard = ({ address }: { address: string }) => {
  const { profile, isLoading } = usePlayerProfile(address);
  const isPaused = useContractPaused(PLAYER_PROFILE_ADDRESS);
  
  if (isLoading) return <Skeleton />;
  
  if (!profile?.tokenId) {
    return (
      <div className="no-profile">
        <h3>尚未創建玩家檔案</h3>
        <p>玩家檔案將永久綁定到您的地址</p>
        {isPaused ? (
          <Alert variant="warning">系統維護中</Alert>
        ) : (
          <Button onClick={handleCreateProfile}>
            創建檔案
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="profile-card">
      <div className="profile-header">
        <h3>玩家檔案 #{profile.tokenId}</h3>
        <Badge variant="info">靈魂綁定 NFT</Badge>
      </div>
      
      <div className="profile-stats">
        <div className="stat">
          <span>等級</span>
          <strong>{calculateLevel(profile.experience)}</strong>
        </div>
        <div className="stat">
          <span>經驗值</span>
          <strong>{profile.experience.toString()}</strong>
        </div>
      </div>
      
      <div className="profile-info">
        <InfoIcon />
        <small>此檔案永久綁定，無法轉移或銷毀</small>
      </div>
    </div>
  );
};

// ===== 3. 經驗值顯示組件 =====

// components/ExperienceBar.tsx
export const ExperienceBar = ({ experience }: { experience: bigint }) => {
  const level = calculateLevel(experience);
  const currentLevelExp = getLevelRequirement(level);
  const nextLevelExp = getLevelRequirement(level + 1);
  const progress = calculateProgress(experience, currentLevelExp, nextLevelExp);
  
  return (
    <div className="experience-bar">
      <div className="level-info">
        <span>Lv. {level}</span>
        <span>{experience.toString()} / {nextLevelExp.toString()} EXP</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
};

// ===== 4. SBT 說明模態框 =====

// components/SBTInfoModal.tsx
export const SBTInfoModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sbt-info">
        <h2>什麼是靈魂綁定代幣 (SBT)?</h2>
        
        <div className="info-section">
          <h3>🔒 永久綁定</h3>
          <p>玩家檔案一旦創建，將永久綁定到您的錢包地址，無法轉移給他人。</p>
        </div>
        
        <div className="info-section">
          <h3>🎮 遊戲身份</h3>
          <p>您的所有遊戲成就、經驗值和進度都會記錄在這個唯一的檔案中。</p>
        </div>
        
        <div className="info-section">
          <h3>🚫 無法交易</h3>
          <p>與一般 NFT 不同，SBT 無法在市場上買賣，確保玩家成就的真實性。</p>
        </div>
        
        <Button onClick={onClose}>了解</Button>
      </div>
    </Modal>
  );
};

// ===== 5. 暫停狀態處理 =====

// hooks/usePlayerProfile.ts
export const usePlayerProfile = (address: string) => {
  const { data: isPaused } = useContractRead({
    address: PLAYER_PROFILE_ADDRESS,
    abi: PLAYER_PROFILE_ABI,
    functionName: 'paused',
  });
  
  const { data: profileData } = useContractRead({
    address: PLAYER_PROFILE_ADDRESS,
    abi: PLAYER_PROFILE_ABI,
    functionName: 'profileTokenOf',
    args: [address],
    enabled: !!address,
  });
  
  // 添加經驗值時檢查暫停狀態
  const addExperience = useCallback(async (amount: number) => {
    if (isPaused) {
      toast.error('系統維護中，無法添加經驗值');
      return;
    }
    
    try {
      // ... 添加經驗值邏輯
    } catch (error) {
      toast.error(handleProfileError(error));
    }
  }, [isPaused]);
  
  return {
    profile: profileData,
    isPaused,
    addExperience,
  };
};

// ===== 6. 管理後台 PlayerProfile 控制 =====

// admin/PlayerProfileManagement.tsx
export const PlayerProfileManagement = () => {
  const { data: isPaused } = useContractRead({
    address: PLAYER_PROFILE_ADDRESS,
    abi: PLAYER_PROFILE_ABI,
    functionName: 'paused',
  });
  
  const { write: pause } = useContractWrite({
    address: PLAYER_PROFILE_ADDRESS,
    abi: PLAYER_PROFILE_ABI,
    functionName: 'pause',
  });
  
  const { write: unpause } = useContractWrite({
    address: PLAYER_PROFILE_ADDRESS,
    abi: PLAYER_PROFILE_ABI,
    functionName: 'unpause',
  });
  
  return (
    <div className="admin-panel">
      <h2>玩家檔案系統管理</h2>
      
      <div className="system-control">
        <div className="status">
          <h3>系統狀態</h3>
          {isPaused ? (
            <Badge variant="warning">⏸ 已暫停</Badge>
          ) : (
            <Badge variant="success">✅ 運行中</Badge>
          )}
        </div>
        
        <div className="actions">
          {isPaused ? (
            <Button variant="success" onClick={() => unpause()}>
              恢復系統
            </Button>
          ) : (
            <Button 
              variant="danger" 
              onClick={() => {
                if (confirm('確定要暫停玩家檔案系統嗎？這將阻止創建新檔案和獲得經驗。')) {
                  pause();
                }
              }}
            >
              暫停系統
            </Button>
          )}
        </div>
      </div>
      
      <Alert variant="info">
        <InfoIcon />
        <div>
          <p>暫停狀態影響：</p>
          <ul>
            <li>無法創建新的玩家檔案</li>
            <li>無法添加經驗值</li>
            <li>查詢功能正常運作</li>
          </ul>
        </div>
      </Alert>
    </div>
  );
};

// ===== 7. 輔助函數 =====

// utils/playerProfile.helpers.ts
export const calculateLevel = (experience: bigint): number => {
  if (experience < 100n) return 1;
  return Number(sqrt(experience / 100n)) + 1;
};

export const getLevelRequirement = (level: number): bigint => {
  if (level <= 1) return 0n;
  return BigInt((level - 1) ** 2 * 100);
};

export const calculateProgress = (
  currentExp: bigint,
  currentLevelReq: bigint,
  nextLevelReq: bigint
): number => {
  const progress = Number(
    ((currentExp - currentLevelReq) * 100n) / (nextLevelReq - currentLevelReq)
  );
  return Math.min(100, Math.max(0, progress));
};

// 計算平方根（bigint）
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error('Square root of negative numbers is not supported');
  }
  if (value < 2n) {
    return value;
  }
  
  let x = value;
  let y = (x + 1n) / 2n;
  
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  
  return x;
}
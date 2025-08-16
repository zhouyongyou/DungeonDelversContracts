// VIPStaking 前端更新指南和代碼範例

// ===== 1. 移除轉移/批准相關 UI =====

// ❌ 移除這些組件/功能
// components/VIPCard.tsx - 移除轉移按鈕
/*
<Button onClick={handleTransfer}>
  轉移 VIP 卡
</Button>
*/

// ✅ 替換為說明文字
export const VIPCardInfo = () => (
  <div className="sbt-notice">
    <InfoIcon />
    <span>VIP 卡為靈魂綁定代幣 (SBT)，無法轉移或交易</span>
  </div>
);

// ===== 2. 更新錯誤處理 =====

// utils/vipStaking.ts
export const handleVIPError = (error: any): string => {
  const message = error?.message || error?.data?.message || '';
  
  // 新增 SBT 相關錯誤處理
  if (message.includes('VIP: SBT cannot be approved')) {
    return 'VIP 卡無法被授權給其他地址';
  }
  if (message.includes('VIP: SBT cannot be transferred')) {
    return 'VIP 卡無法轉移';
  }
  if (message.includes('Pausable: paused')) {
    return '系統維護中，請稍後再試';
  }
  
  // 原有錯誤處理
  if (message.includes('VIP: Cannot stake 0')) {
    return '質押數量不能為 0';
  }
  if (message.includes('VIP: You have a pending unstake')) {
    return '您有待領取的解除質押';
  }
  
  return '操作失敗，請重試';
};

// ===== 3. 更新 VIP 卡顯示邏輯 =====

// components/VIPStatus.tsx
import { useVIPStaking } from '@/hooks/useVIPStaking';

export const VIPStatus = ({ address }: { address: string }) => {
  const { stakeInfo, vipLevel } = useVIPStaking(address);
  
  // VIP 卡永不消失的新邏輯
  const hasVIPCard = stakeInfo?.tokenId > 0;
  const isActiveVIP = stakeInfo?.amount > 0;
  
  return (
    <div className="vip-status">
      {hasVIPCard ? (
        <>
          <div className="vip-card">
            <img src={`/vip-cards/${stakeInfo.tokenId}.png`} alt="VIP Card" />
            <div className="vip-badge">
              {isActiveVIP ? (
                <span className="active">VIP {vipLevel}</span>
              ) : (
                <span className="inactive">VIP 0 (未質押)</span>
              )}
            </div>
          </div>
          
          {!isActiveVIP && (
            <div className="vip-hint">
              <p>您的 VIP 卡仍然有效，質押 SOUL 即可重新激活</p>
              <Button onClick={handleStake}>重新質押</Button>
            </div>
          )}
        </>
      ) : (
        <div className="no-vip">
          <p>您還沒有 VIP 卡</p>
          <Button onClick={handleFirstStake}>立即質押獲得 VIP</Button>
        </div>
      )}
    </div>
  );
};

// ===== 4. 暫停狀態檢查 =====

// hooks/useContractStatus.ts
import { useContractRead } from 'wagmi';

export const useContractPaused = (contractAddress: string) => {
  const { data: isPaused } = useContractRead({
    address: contractAddress,
    abi: VIP_ABI,
    functionName: 'paused',
    watch: true, // 自動更新
  });
  
  return isPaused || false;
};

// components/StakeModal.tsx
export const StakeModal = () => {
  const isPaused = useContractPaused(VIP_CONTRACT_ADDRESS);
  
  if (isPaused) {
    return (
      <Modal>
        <div className="maintenance-notice">
          <MaintenanceIcon />
          <h3>系統維護中</h3>
          <p>VIP 質押系統暫時關閉，請稍後再試</p>
        </div>
      </Modal>
    );
  }
  
  // ... 正常的質押 UI
};

// ===== 5. 更新解除質押邏輯 =====

// components/UnstakeSection.tsx
export const UnstakeSection = () => {
  const { stakeInfo, unstakeRequest } = useVIPStaking();
  
  return (
    <div className="unstake-section">
      {stakeInfo?.amount > 0 && (
        <>
          <h3>當前質押: {formatEther(stakeInfo.amount)} SOUL</h3>
          <p>VIP 等級: {calculateVIPLevel(stakeInfo.amount)}</p>
          
          {/* 新增提示：解除質押不會失去 VIP 卡 */}
          <Alert variant="info">
            <InfoIcon />
            解除質押後，您的 VIP 卡仍會保留，但等級會降至 0
          </Alert>
          
          <Button onClick={handleRequestUnstake}>
            解除質押
          </Button>
        </>
      )}
      
      {unstakeRequest?.amount > 0 && (
        <UnstakeTimer 
          availableAt={unstakeRequest.availableAt}
          amount={unstakeRequest.amount}
        />
      )}
    </div>
  );
};

// ===== 6. 管理後台暫停功能 =====

// admin/VIPManagement.tsx
export const VIPManagement = () => {
  const { data: isPaused } = useContractRead({
    address: VIP_CONTRACT_ADDRESS,
    abi: VIP_ABI,
    functionName: 'paused',
  });
  
  const { write: pause } = useContractWrite({
    address: VIP_CONTRACT_ADDRESS,
    abi: VIP_ABI,
    functionName: 'pause',
  });
  
  const { write: unpause } = useContractWrite({
    address: VIP_CONTRACT_ADDRESS,
    abi: VIP_ABI,
    functionName: 'unpause',
  });
  
  return (
    <div className="admin-panel">
      <h2>VIP 系統管理</h2>
      
      <div className="pause-control">
        <h3>系統狀態</h3>
        <div className="status-indicator">
          {isPaused ? (
            <span className="status-paused">⏸ 已暫停</span>
          ) : (
            <span className="status-active">✅ 運行中</span>
          )}
        </div>
        
        <div className="control-buttons">
          {isPaused ? (
            <Button 
              variant="success" 
              onClick={() => unpause()}
              disabled={!unpause}
            >
              恢復系統
            </Button>
          ) : (
            <Button 
              variant="danger" 
              onClick={() => {
                if (confirm('確定要暫停 VIP 系統嗎？')) {
                  pause();
                }
              }}
              disabled={!pause}
            >
              暫停系統
            </Button>
          )}
        </div>
        
        <Alert variant="warning">
          暫停系統將阻止所有質押和解除質押操作，但不影響查詢功能
        </Alert>
      </div>
    </div>
  );
};

// ===== 7. 更新 VIP 資訊顯示 =====

// components/VIPInfo.tsx
export const VIPInfo = ({ address }: { address: string }) => {
  const { data: userInfo } = useContractRead({
    address: VIP_CONTRACT_ADDRESS,
    abi: VIP_ABI,
    functionName: 'userStakes',
    args: [address],
  });
  
  const { data: vipLevel } = useContractRead({
    address: VIP_CONTRACT_ADDRESS,
    abi: VIP_ABI,
    functionName: 'getVipLevel',
    args: [address],
  });
  
  if (!userInfo?.tokenId) {
    return <div>尚未擁有 VIP 卡</div>;
  }
  
  return (
    <div className="vip-info">
      <div className="vip-card-display">
        <h4>VIP #{userInfo.tokenId}</h4>
        <div className="vip-stats">
          <div>
            <span>當前等級</span>
            <strong>{vipLevel || 0}</strong>
          </div>
          <div>
            <span>質押金額</span>
            <strong>{formatEther(userInfo.amount)} SOUL</strong>
          </div>
          <div>
            <span>稅收減免</span>
            <strong>{(vipLevel || 0) * 0.5}%</strong>
          </div>
        </div>
      </div>
      
      {userInfo.amount === 0n && (
        <div className="inactive-notice">
          <p>您的 VIP 卡目前未激活</p>
          <small>質押 SOUL 以重新激活並享受 VIP 優惠</small>
        </div>
      )}
    </div>
  );
};
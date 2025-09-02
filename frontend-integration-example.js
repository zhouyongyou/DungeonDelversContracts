// frontend-integration-example.js
// 前端整合 PlayerVaultV2 自定義用戶名功能的示例代碼

import { ethers } from 'ethers';
import { isAddress } from 'viem';

// 假設你已經有 PlayerVaultV2 的合約實例
// const playerVaultV2 = new ethers.Contract(address, abi, signer);

class ReferralUsernameManager {
  constructor(playerVaultContract) {
    this.contract = playerVaultContract;
  }

  // =================== 用戶名註冊 ===================
  
  /**
   * 註冊自定義用戶名
   * @param {string} username - 用戶名（3-20字符）
   * @returns {Promise<string>} - 交易 hash
   */
  async registerUsername(username) {
    // 前端驗證
    if (!this.validateUsername(username)) {
      throw new Error('Invalid username format');
    }

    // 檢查可用性
    const isAvailable = await this.contract.isUsernameAvailable(username);
    if (!isAvailable) {
      throw new Error('Username already taken');
    }

    // 獲取註冊費用
    const registrationFee = await this.contract.usernameRegistrationFee();
    
    console.log(`🔖 Registering username: ${username}`);
    console.log(`💰 Registration fee: ${ethers.formatEther(registrationFee)} BNB`);

    // 執行註冊
    const tx = await this.contract.registerUsername(username, {
      value: registrationFee,
      gasLimit: 150000 // 預估 gas
    });

    console.log(`📝 Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Username "${username}" registered successfully!`);
    
    return tx.hash;
  }

  // =================== 推薦人設置 ===================
  
  /**
   * 智能解析推薦人（支援地址和用戶名）
   * @param {string} referrerInput - 推薦人輸入（地址或用戶名）
   * @returns {Promise<string>} - 推薦人地址
   */
  async resolveReferrer(referrerInput) {
    // 1. 檢查是否為有效地址
    if (isAddress(referrerInput)) {
      console.log(`📍 Referrer is address: ${referrerInput}`);
      return referrerInput;
    }

    // 2. 嘗試作為用戶名解析
    try {
      const address = await this.contract.resolveUsername(referrerInput);
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        console.log(`🏷️ Username "${referrerInput}" resolved to: ${address}`);
        return address;
      }
    } catch (error) {
      console.warn('Username resolution failed:', error);
    }

    throw new Error(`Referrer "${referrerInput}" not found`);
  }

  /**
   * 設置推薦人（智能解析）
   * @param {string} referrerInput - 推薦人輸入
   * @returns {Promise<string>} - 交易 hash
   */
  async setReferrer(referrerInput) {
    const referrerAddress = await this.resolveReferrer(referrerInput);

    // 檢查是否為用戶名
    if (!isAddress(referrerInput)) {
      // 使用專用的用戶名設置函數
      const tx = await this.contract.setReferrerByUsername(referrerInput, {
        gasLimit: 100000
      });
      console.log(`🎯 Set referrer by username: ${referrerInput} → ${referrerAddress}`);
      return tx.hash;
    } else {
      // 使用原有的地址設置函數
      const tx = await this.contract.setReferrer(referrerAddress, {
        gasLimit: 80000
      });
      console.log(`🎯 Set referrer by address: ${referrerAddress}`);
      return tx.hash;
    }
  }

  // =================== URL 處理 ===================
  
  /**
   * 生成推薦連結
   * @param {string} userAddress - 用戶地址
   * @returns {Promise<string>} - 推薦連結
   */
  async generateReferralLink(userAddress) {
    // 檢查是否有自定義用戶名
    const username = await this.contract.getUserUsername(userAddress);
    
    const baseUrl = window.location.origin;
    
    if (username && username.length > 0) {
      // 使用用戶名生成連結（更友好）
      return `${baseUrl}/#/referral?ref=${username}`;
    } else {
      // 使用地址生成連結
      return `${baseUrl}/#/referral?ref=${userAddress}`;
    }
  }

  /**
   * 解析 URL 中的推薦參數
   * @returns {Promise<{referrer: string, isUsername: boolean}>}
   */
  async parseReferralFromURL() {
    const hashParams = window.location.hash.includes('?') 
      ? new URLSearchParams(window.location.hash.split('?')[1])
      : new URLSearchParams(window.location.search);
    
    const ref = hashParams.get('ref');
    if (!ref) return null;

    const isUsername = !isAddress(ref);
    let referrerAddress;

    if (isUsername) {
      try {
        referrerAddress = await this.resolveReferrer(ref);
      } catch (error) {
        console.warn(`Invalid referral username: ${ref}`);
        return null;
      }
    } else {
      referrerAddress = ref;
    }

    return {
      referrer: referrerAddress,
      isUsername,
      originalInput: ref
    };
  }

  // =================== 工具函數 ===================
  
  /**
   * 前端用戶名驗證
   * @param {string} username - 用戶名
   * @returns {boolean} - 是否有效
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') return false;
    
    // 長度檢查
    if (username.length < 3 || username.length > 20) return false;
    
    // 字符檢查：只允許 a-z, A-Z, 0-9, _
    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(username)) return false;
    
    // 不能以 0x 開頭（避免與地址混淆）
    if (username.toLowerCase().startsWith('0x')) return false;
    
    // 黑名單檢查
    const blacklist = ['admin', 'official', 'team', 'support', 'owner', 'null', 'undefined'];
    if (blacklist.includes(username.toLowerCase())) return false;
    
    return true;
  }

  /**
   * 獲取用戶資訊
   * @param {string} userAddress - 用戶地址
   * @returns {Promise<object>} - 用戶資訊
   */
  async getUserInfo(userAddress) {
    const [username, referrer] = await Promise.all([
      this.contract.getUserUsername(userAddress),
      this.contract.referrers(userAddress)
    ]);

    return {
      address: userAddress,
      username: username || null,
      referrer: referrer === '0x0000000000000000000000000000000000000000' ? null : referrer,
      hasCustomUsername: username && username.length > 0
    };
  }

  /**
   * 檢查用戶名可用性（帶建議）
   * @param {string} username - 用戶名
   * @returns {Promise<{available: boolean, suggestions?: string[]}>}
   */
  async checkUsernameAvailability(username) {
    const isValid = this.validateUsername(username);
    if (!isValid) {
      return { available: false, error: 'Invalid format' };
    }

    const isAvailable = await this.contract.isUsernameAvailable(username);
    
    if (isAvailable) {
      return { available: true };
    } else {
      // 生成建議
      const suggestions = [];
      for (let i = 1; i <= 3; i++) {
        const suggestion = `${username}${i}`;
        if (this.validateUsername(suggestion)) {
          const suggestionAvailable = await this.contract.isUsernameAvailable(suggestion);
          if (suggestionAvailable) {
            suggestions.push(suggestion);
          }
        }
      }
      
      return { available: false, suggestions };
    }
  }
}

// =================== React Hook 範例 ===================

// 假設的 React Hook
export const useReferralUsername = (playerVaultContract) => {
  const [usernameManager] = useState(
    () => new ReferralUsernameManager(playerVaultContract)
  );

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 載入用戶資訊
  const loadUserInfo = useCallback(async (address) => {
    if (!address) return;
    
    setLoading(true);
    try {
      const info = await usernameManager.getUserInfo(address);
      setUserInfo(info);
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  }, [usernameManager]);

  // 註冊用戶名
  const registerUsername = useCallback(async (username) => {
    setLoading(true);
    try {
      const txHash = await usernameManager.registerUsername(username);
      // 重新載入用戶資訊
      if (userInfo?.address) {
        await loadUserInfo(userInfo.address);
      }
      return txHash;
    } finally {
      setLoading(false);
    }
  }, [usernameManager, userInfo, loadUserInfo]);

  return {
    usernameManager,
    userInfo,
    loading,
    loadUserInfo,
    registerUsername
  };
};

export default ReferralUsernameManager;
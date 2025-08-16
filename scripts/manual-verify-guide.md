# 手動驗證 VRFManagerV2PlusFixed 合約指南

## 合約信息
- **合約地址**: `0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1`
- **網絡**: BSC Mainnet
- **BSCScan 連結**: https://bscscan.com/address/0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1#code

## 驗證步驟

### 1. 打開 BSCScan
訪問: https://bscscan.com/address/0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1#code

### 2. 點擊 "Verify and Publish"

### 3. 填寫驗證表單

#### 基本信息
- **Contract Address**: `0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1` (自動填充)
- **Compiler Type**: Solidity (Single file)
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Open Source License Type**: MIT

#### 優化設置
- **Optimization**: Yes
- **Runs**: 200

#### 合約代碼
上傳文件: `VRFManagerV2PlusFixed_flat.sol`
或者直接複製貼上 flatten 後的代碼

#### 構造函數參數 (ABI-encoded)
```
000000000000000000000000471506e6aded0b9811d05b8cac8db25ee839ac94
```

這是 wrapper 地址 `0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94` 的 ABI 編碼

### 4. 完成驗證
- 填寫驗證碼
- 點擊 "Verify and Publish"

## 其他已部署合約狀態

### Hero 合約
- **地址**: `0x575e7407C06ADeb47067AD19663af50DdAe460CF`
- **VRF Manager**: ✅ 已更新為新版
- **BSCScan**: https://bscscan.com/address/0x575e7407C06ADeb47067AD19663af50DdAe460CF#code

### Relic 合約
- **地址**: `0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739`
- **VRF Manager**: ✅ 已更新為新版
- **BSCScan**: https://bscscan.com/address/0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739#code

### DungeonMaster 合約
- **地址**: `0xE391261741Fad5FCC2D298d00e8c684767021253`
- **VRF 授權**: ✅ 已在新 VRF Manager 中授權
- **BSCScan**: https://bscscan.com/address/0xE391261741Fad5FCC2D298d00e8c684767021253#code

### AltarOfAscension 合約
- **地址**: `0x095559778C0BAA2d8FA040Ab0f8752cF07779D33`
- **說明**: 不直接使用 VRF，通過 Hero/Relic 合約鑄造
- **BSCScan**: https://bscscan.com/address/0x095559778C0BAA2d8FA040Ab0f8752cF07779D33#code

## 重要提示

### VRF Manager 特點
1. **使用 BNB Direct Funding** - 不需要 LINK 代幣
2. **繼承正確的基類** - `VRFV2PlusWrapperConsumerBase`
3. **使用正確的函數** - `requestRandomnessPayInNative`

### 費用設置
- **Platform Fee**: 0.0003 BNB
- **VRF Fee**: 動態計算（目前 BSC 返回 0，可能需要手動設置）

### 授權狀態
- Hero: ✅ 已授權
- Relic: ✅ 已授權
- DungeonMaster: ✅ 已授權
- AltarOfAscension: 不需要（不直接調用 VRF）

## 交易記錄

### 部署交易
- Hash: `0x81f788dbbd856eebdd21bbfc65797a49108eb5f453f1006014d23b2829c5437a`
- 查看: https://bscscan.com/tx/0x81f788dbbd856eebdd21bbfc65797a49108eb5f453f1006014d23b2829c5437a

### 設置交易
1. 授權 Hero: `0xaae8f5d0d439a868c5408b44ad3cfa64f06c04b3b55bb1ba2dc555660c085328`
2. 授權 Relic: `0x436d7ae84f1db78e266f9b5b80042a3fff07de501508a4008301a4dd2e5ae95b`
3. 更新 Hero VRF: `0x6b719d8246614be0541fe12946c41bbb498449229df3f10dae065fca5e325c86`
4. 更新 Relic VRF: `0xf30af346ab715707bedc84331f95efd446689400449f217e28223a11734b478d`
5. 授權 DungeonMaster: `0x5d1d0e2ab387c8e8c1e3e2e7f1eb825f3861cbf66ec8aba996ad488b973bef1f`

## 測試鑄造

使用以下腳本測試新 VRF Manager:
```bash
npx hardhat run scripts/test-hero-mint.js --network bsc
```

預期費用:
- SOUL: ~34,072 SOUL (價值 $2 USD)
- BNB: ~0.0003 BNB (平台費) + VRF 費用
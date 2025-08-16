# VRF 合約部署總結

## 部署時間
2025-08-07

## 網絡
BSC Mainnet (Chain ID: 56)

## 已部署的合約地址

| 合約名稱 | 地址 | 狀態 |
|---------|------|------|
| VRFConsumerV2Plus | `0x980d224ec4d198d94f34a8af76a19c00dabe2436` | ✅ 已部署 |
| Hero | `0x671d937b171e2ba2c4dc23c133b07e4449f283ef` | ✅ 已部署 |
| Relic | `0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da` | ✅ 已部署 |
| DungeonMaster | 部署中... | ⏳ |
| AltarOfAscension | 待部署 | ⏳ |

## VRF 配置
- **VRF Coordinator**: `0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9`
- **Subscription ID**: 29062
- **Key Hash**: `0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4`

## 下一步驟

### 1. 完成剩餘部署
繼續運行部署腳本以完成 DungeonMaster 和 AltarOfAscension 的部署。

### 2. 驗證合約
```bash
# VRFConsumerV2Plus
npx hardhat verify --network bsc 0x980d224ec4d198d94f34a8af76a19c00dabe2436 29062 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9

# Hero
npx hardhat verify --network bsc 0x671d937b171e2ba2c4dc23c133b07e4449f283ef 0x10925A7138649C7E1794CE646182eeb5BF8ba647

# Relic
npx hardhat verify --network bsc 0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da 0x10925A7138649C7E1794CE646182eeb5BF8ba647
```

### 3. 設置 VRF Manager
每個合約需要設置 VRF Manager 地址：
```javascript
// 在每個合約上調用
await contract.setVRFManager("0x980d224ec4d198d94f34a8af76a19c00dabe2436");
```

### 4. 授權合約使用 VRF
在 VRFConsumerV2Plus 上授權各合約：
```javascript
await vrfConsumer.setAuthorizedContract(heroAddress, true);
await vrfConsumer.setAuthorizedContract(relicAddress, true);
// ... 其他合約
```

### 5. 在 Chainlink 添加消費者
訪問 https://vrf.chain.link/bsc/29062
添加 VRFConsumerV2Plus 地址作為消費者

### 6. 設置 DungeonCore 連接
更新 DungeonCore 中的合約地址

## 注意事項
- Hardhat ethers v6 插件有兼容性問題，但交易實際上成功發送
- 合約驗證可能需要等待 BSCScan 索引完成
- 確保訂閱中有足夠的 LINK 代幣

## 問題排查
如果遇到問題：
1. 檢查交易狀態：https://bscscan.com/tx/[交易hash]
2. 確認合約地址：https://bscscan.com/address/[合約地址]
3. 查看 VRF 訂閱狀態：https://vrf.chain.link/bsc/29062
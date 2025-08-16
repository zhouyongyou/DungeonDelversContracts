# DungeonDelvers 市場合約部署紀錄

## 部署信息

- **部署日期**: 2025-07-29
- **部署時間**: 11:23 UTC
- **網絡**: BSC Mainnet (Chain ID: 56)
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55720586

## 已部署合約

### 市場合約

1. **DungeonMarketplace**
   - 地址: `0x941A6A18d07C90112A86a367f66ae861cCd74A43`
   - BSCScan: https://bscscan.com/address/0x941A6A18d07C90112A86a367f66ae861cCd74A43
   - 功能: P2P NFT 市場，支持 Hero、Relic、Party NFT 交易

2. **OfferSystem**
   - 地址: `0x1782Bb58de2b75c03Cc8a1f48d1A32B6aDEedF67`
   - BSCScan: https://bscscan.com/address/0x1782Bb58de2b75c03Cc8a1f48d1A32B6aDEedF67
   - 功能: 出價系統，支持 SOUL 代幣托管

## 配置參數

- **平台手續費**: 2.5% (250 基點)
- **最大手續費**: 10% (1000 基點)
- **手續費接收者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647

## 依賴合約

- **SOUL Token**: 0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
- **Hero NFT**: 0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22
- **Relic NFT**: 0xe66036839c7E5F8372ADC36da8f0357429a96A34
- **Party NFT**: 0x22Ac9b248716FA64eD97025c77112c4c3e0169ab

## 部署狀態

✅ 合約成功部署
✅ 配置文件已更新 (master-config.json)
✅ 市場配置已生成 (marketplace-config.json)
✅ 環境變數已保存 (.env.marketplace)
✅ 前端和後端配置已同步

## 下一步

1. **驗證合約** (如需要):
   ```bash
   npm run marketplace:verify
   ```

2. **部署市場子圖**:
   ```bash
   cd marketplace/subgraph
   npm install
   npm run update:addresses
   npm run codegen
   npm run build
   npm run deploy:studio
   ```

3. **前端集成**:
   - 複製 marketplace-config.json 到前端
   - 更新前端代碼使用新的市場合約地址

## 注意事項

- 市場系統採用完全獨立架構，不影響主遊戲系統
- 部署腳本需要修復 ethers v6 API 兼容性問題（已知問題）
- 合約已經成功部署，可以正常使用

## 技術債務

- [ ] 修復 marketplace/deploy-standalone.js 的 ethers v6 API 兼容性
- [ ] 添加合約驗證腳本
- [ ] 完善錯誤處理機制
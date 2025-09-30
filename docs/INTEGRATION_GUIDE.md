# Integration Guide

> 更新日期：2025-09-25 ｜ 目標：同步前端、後端、子圖與合約於 v1.4.0.3 主網環境

## 1. 合約部署與驗證
1. 於 `DungeonDelversContracts` 執行 `forge script` 或相應部署腳本完成合約升級。
2. 執行 `node scripts/essential/check-address-sync.js` 確認 DungeonCore 內部指向正確。
3. `npx hardhat verify <address> --network bsc` 驗證新合約。

## 2. 發佈 ABI 與環境設定
1. 於合約倉庫執行：
   ```bash
   node scripts/essential/extract-abis.js
   ```
   - 將最新 ABI 推送至前端、後端、子圖專案。
2. 更新 `.env`：
   ```bash
   node update-env-with-new-contracts.js
   ```
   - 自動覆寫 `VITE_*_ADDRESS` 與其他環境變數。
3. 在各專案執行 `npm install` 以同步潛在依賴更新。

## 3. 子圖部署
```bash
cd ../dungeon-delvers-subgraph
npm run codegen
npm run build
GRAPH_ACCESS_TOKEN=*** npm run deploy
# 如需 Goldsky 備援
npm run deploy:goldsky
```
- 驗證 The Graph Studio 狀態為 `Synced`。
- 於 `docs/DOCUMENTATION_INDEX.md` 記錄此次部署摘要。

## 4. 後端更新
```bash
cd ../dungeon-delvers-metadata-server
npm run lint
npm run test
npm run dev # 確認本地啟動正常
```
- 確認 `FRONTEND_DOMAIN`、子圖端點與合約地址與主網一致。
- 若部署至 Render：推送至 main 分支觸發自動部署。

## 5. 前端驗證
```bash
cd ../SoulboundSaga
npm run docs:check
npm run type-check
npm run lint
npm run test
npm run build
```
- 更新 `src/config` 與 `docs/api`，確認新地址已套用。
- 手動檢查關鍵流程（鑄造、遠征、升階、提款）。

## 6. 白皮書與外部文檔
- 於 `dungeon-delvers-whitepaper` 更新合約地址、版本附錄。
- 執行 `gitbook build` 或對應靜態站生成流程。

## 7. 發佈前檢查清單
- [ ] 五個倉庫 `DOCUMENTATION_INDEX.md` 已更新
- [ ] 所有 README 與 SPEC 中的版本號、地址一致
- [ ] `docs/api`、`docs/GRAPHQL_QUERY_EXAMPLES.md`、`docs/CONTRACT_API_REFERENCE.md` 均已更新新函數/事件
- [ ] 測試網或主網 smoke test 透過 QA 團隊確認

## 8. 自動化與監控
- 建議於 CI 新增以下步驟：
  - `npm run docs:check`（前端）
  - `npx markdown-link-check README.md`（子圖 / 後端）
  - `forge test` + `npm run test` 維護回歸測試
- 監控面板：
  - Subgraph：The Graph Studio Alerts
  - Backend：Render Health + `/health/stats`
  - Frontend：Vercel Analytics

> 若流程有調整，請同步更新本指南與各專案的 `DOCUMENTATION_INDEX.md`。

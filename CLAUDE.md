# ⚡ DungeonDelvers 智能合約

## 專案定位
- **類型**: Smart Contracts (Solidity + Foundry)
- **核心功能**: GameFi合約套件 (Hero/Equipment/Battle/VIP)
- **Gas策略**: 0.11 gwei 固定原則

## 生態系統連結
```bash
CONTRACTS_PATH: /Users/sotadic/Documents/DungeonDelversContracts      # 當前專案
FRONTEND_PATH: /Users/sotadic/Documents/GitHub/SoulboundSaga
SUBGRAPH_PATH: /Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph
BACKEND_PATH: /Users/sotadic/Documents/dungeon-delvers-metadata-server
WHITEPAPER_PATH: /Users/sotadic/Documents/GitHub/dungeon-delvers-whitepaper
```

## 合約架構重點
- **多合約協調**: Hero/Equipment/Battle/VIP 系統間權限管理
- **Diamond Proxy**: 模組化升級架構
- **經濟安全**: 代幣鑄造、獎勵分配、VIP機制完整性
- **Gas優化**: Storage Layout、批次操作、Assembly優化

## 安全檢查重點
- **私鑰安全**: 掃描硬編碼、環境變數洩漏
- **權限管理**: 多重簽名、角色控制、升級安全
- **經濟漏洞**: 無限鑄造、溢出攻擊、重入漏洞
- **部署驗證**: 地址正確性、初始化參數

## 載入模組指令
需要時可載入：
- **模組B**: 私鑰與敏感資訊安全掃描
- **模組D**: 合約安全審計檢查清單
- **模組F**: Gas優化與部署腳本模板

---
*專注合約安全與Gas優化*
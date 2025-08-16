# DungeonDelvers V1 部署記錄

**部署日期**: 2025-07-18  
**部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647  
**網路**: BSC Mainnet  
**版本**: V1 (簡化版 - 無祭壇功能)

## 📍 部署的合約地址

### 核心合約
| 合約名稱 | 地址 | BSCScan |
|---------|------|---------|
| DungeonCore | `0x70Dce1dE6Eb73B66c26D49279bB6846947282952` | [查看](https://bscscan.com/address/0x70Dce1dE6Eb73B66c26D49279bB6846947282952#code) |
| Oracle | `0xD12330fE5353D2F008f909C35A132dfd0E49E508` | [查看](https://bscscan.com/address/0xD12330fE5353D2F008f909C35A132dfd0E49E508#code) |

### NFT 合約
| 合約名稱 | 地址 | BSCScan |
|---------|------|---------|
| Hero | `0x5EEa0b978f6DbE7735125C4C757458B0F5B48A65` | [查看](https://bscscan.com/address/0x5EEa0b978f6DbE7735125C4C757458B0F5B48A65#code) |
| Relic | `0x82A680344C09C10455F5A6397f6F7a38cf3ebe8A` | [查看](https://bscscan.com/address/0x82A680344C09C10455F5A6397f6F7a38cf3ebe8A#code) |
| Party | `0x6f707409821F11CbFC01FC79073264FC02b8Ff3e` | [查看](https://bscscan.com/address/0x6f707409821F11CbFC01FC79073264FC02b8Ff3e#code) |
| PlayerProfile | `0x7c04BB7C2bF02Fe8Fc33a29A61898D7Bd50650c7` | [查看](https://bscscan.com/address/0x7c04BB7C2bF02Fe8Fc33a29A61898D7Bd50650c7#code) |

### 遊戲機制合約
| 合約名稱 | 地址 | BSCScan |
|---------|------|---------|
| DungeonMaster | `0x9c8089a4e39971FD530fefd6B4ad2543C409d58d` | [查看](https://bscscan.com/address/0x9c8089a4e39971FD530fefd6B4ad2543C409d58d#code) |
| DungeonStorage | `0x92d07801f3AD4152F08528a296992d9A602C2C6F` | [查看](https://bscscan.com/address/0x92d07801f3AD4152F08528a296992d9A602C2C6F#code) |
| PlayerVault | `0x8777C09F0becA12767F746d50D3963d319a83F8c` | [查看](https://bscscan.com/address/0x8777C09F0becA12767F746d50D3963d319a83F8c#code) |
| VIPStaking | `0x6B25bf958F47259e7ae1e4F59948e50cD931a3A8` | [查看](https://bscscan.com/address/0x6B25bf958F47259e7ae1e4F59948e50cD931a3A8#code) |

## ⚠️ V1 版本特別說明

1. **祭壇功能暫時禁用**：為確保遊戲穩定性，V1版本暫不包含升星祭壇功能
2. **簡化系統**：專注於核心玩法（鑄造、組隊、探險）
3. **未來升級**：祭壇功能將在後續版本中推出

## 🔧 自動配置更新

以下文件已自動更新：
- ✅ 前端環境變數 (.env)
- ✅ 後端環境變數 (.env)
- ✅ 子圖配置 (subgraph.yaml)
- ✅ 統一配置文件 (contract-config-v1.json)

## 🚀 下一步行動

1. 驗證所有合約地址正確性
2. 重新部署前端到 Vercel
3. 重新部署子圖到 The Graph（注意移除祭壇相關監聽）
4. 重新部署後端到 Render
5. 測試核心功能（鑄造、組隊、探險）

---
*本文件由 V1 簡化部署腳本自動生成*

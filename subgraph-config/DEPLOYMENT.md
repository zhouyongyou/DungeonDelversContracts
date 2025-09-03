
# DungeonDelvers V1.3.3 子圖部署指南

## 📋 更新的合約地址

### 核心合約
- DungeonCore: 0xa94b609310f8fe9a6db5cd66faaf64cd0189581f
- Oracle: 0x21928de992cb31ede864b62bc94002fb449c2738
- PlayerVault: 0xe3c03d3e270d7eb3f8e27017790135f5a885a66f

### NFT 合約
- Hero: 0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e
- Relic: 0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd  
- Party: 0xb393e482495bacde5aaf08d25323146cc5b9567f
- PlayerProfile: 0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b
- VIPStaking: 0x409d964675235a5a00f375053535fce9f6e79882

### 遊戲合約
- AltarOfAscension: 0x7f4b3d0ff2994182200fc3b306fb5b035680de3c
- DungeonMaster: 0xdbee76d1c6e94f93ceecf743a0a0132c57371254
- DungeonStorage: 0x30dcbe703b258fa1e421d22c8ada643da51ceb4c
- VRFManager: 0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40

## 🚀 部署步驟

1. **更新子圖配置文件**
   ```bash
   cp subgraph.yaml.new subgraph.yaml
   cp networks.json.new networks.json
   ```

2. **更新 ABI 文件**
   ```bash
   # 從合約項目複製最新 ABI
   cp ../DungeonDelversContracts/artifacts/contracts/current/**/*.json ./abis/
   ```

3. **生成代碼**
   ```bash
   graph codegen
   ```

4. **構建子圖**
   ```bash
   graph build
   ```

5. **部署到 Studio**
   ```bash
   graph deploy --studio dungeon-delvers---bsc --version-label v1.3.3
   ```

## ⚙️ 重要配置

- **起始區塊**: 59848829
- **部署日期**: 2025-09-03T16:00:00.000Z
- **網路**: BSC Mainnet (Chain ID: 56)
- **版本**: v1.3.3

## 🔗 驗證鏈接

所有合約都已在 BSCScan 上驗證：
- dungeonCore: https://bscscan.com/address/0xa94b609310f8fe9a6db5cd66faaf64cd0189581f#code
- oracle: https://bscscan.com/address/0x21928de992cb31ede864b62bc94002fb449c2738#code
- playerVault: https://bscscan.com/address/0xe3c03d3e270d7eb3f8e27017790135f5a885a66f#code
- hero: https://bscscan.com/address/0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e#code
- relic: https://bscscan.com/address/0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd#code
- party: https://bscscan.com/address/0xb393e482495bacde5aaf08d25323146cc5b9567f#code
- playerProfile: https://bscscan.com/address/0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b#code
- vipStaking: https://bscscan.com/address/0x409d964675235a5a00f375053535fce9f6e79882#code
- altarOfAscension: https://bscscan.com/address/0x7f4b3d0ff2994182200fc3b306fb5b035680de3c#code
- dungeonMaster: https://bscscan.com/address/0xdbee76d1c6e94f93ceecf743a0a0132c57371254#code
- dungeonStorage: https://bscscan.com/address/0x30dcbe703b258fa1e421d22c8ada643da51ceb4c#code
- vrfManager: https://bscscan.com/address/0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40#code
- soulShard: https://bscscan.com/address/0x1a98769b8034d400745cc658dc204cd079de36fa#code
- testUSD1: https://bscscan.com/address/0x916a2a1eb605e88561139c56af0698de241169f2#code
- v3Pool: https://bscscan.com/address/0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba#code

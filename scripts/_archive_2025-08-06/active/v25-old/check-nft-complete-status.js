const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 完整 NFT 合約狀態檢查 (V22) ===\n");
  console.log("執行時間:", new Date().toLocaleString());
  console.log("=".repeat(80));

  // V22 配置
  const contracts = {
    Hero: {
      address: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
      type: "ERC721",
      mintPrice: "2 USD"
    },
    Relic: {
      address: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
      type: "ERC721",
      mintPrice: "0.8 USD"
    },
    Party: {
      address: "0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee",
      type: "ERC721",
      mintPrice: "由英雄組成"
    },
    VIPStaking: {
      address: "0xc59B9944a9CbB947F4067F941EbFB0a5A2564eb9",
      type: "ERC721 + Staking",
      mintPrice: "質押 SOUL 獲得"
    },
    PlayerProfile: {
      address: "0x4998FADF96Be619d54f6E9bcc654F89937201FBe",
      type: "ERC721",
      mintPrice: "免費"
    }
  };

  const dependencies = {
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    DUNGEONCORE: "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9",
    ALTAROFASCENSION: "0xfb121441510296A92c8A2Cc04B6Aff1a2f72cd3f"
  };

  console.log("\n📋 合約地址總覽：");
  console.log("-".repeat(80));
  for (const [name, info] of Object.entries(contracts)) {
    console.log(`${name.padEnd(15)} ${info.address} (${info.type})`);
  }
  console.log("-".repeat(80));

  // 檢查每個 NFT 合約
  for (const [name, info] of Object.entries(contracts)) {
    console.log(`\n\n🔍 檢查 ${name} 合約`);
    console.log("=".repeat(60));
    console.log(`地址: ${info.address}`);
    console.log(`類型: ${info.type}`);
    console.log(`鑄造價格: ${info.mintPrice}`);
    console.log("-".repeat(60));

    try {
      let contract;
      const commonABI = [
        "function baseURI() view returns (string)",
        "function contractURI() view returns (string)",
        "function tokenURI(uint256) view returns (string)",
        "function owner() view returns (address)",
        "function soulShardToken() view returns (address)",
        "function dungeonCore() view returns (address)",
        "function totalSupply() view returns (uint256)",
        "function name() view returns (string)",
        "function symbol() view returns (string)"
      ];

      // 根據合約類型使用不同的 ABI
      if (name === "Hero" || name === "Relic") {
        const contractPath = name === "Hero" 
          ? "contracts/current/nft/Hero.sol:Hero"
          : "contracts/current/nft/Relic.sol:Relic";
        contract = await ethers.getContractAt(contractPath, info.address);
      } else if (name === "VIPStaking") {
        const vipABI = [...commonABI,
          "function unstakeCooldown() view returns (uint256)",
          "function totalPendingUnstakes() view returns (uint256)"
        ];
        contract = new ethers.Contract(info.address, vipABI, ethers.provider);
      } else {
        contract = new ethers.Contract(info.address, commonABI, ethers.provider);
      }

      // 基本信息
      console.log("\n📌 基本信息：");
      try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        console.log(`  名稱: ${name}`);
        console.log(`  符號: ${symbol}`);
      } catch (e) {
        console.log(`  ✗ 無法讀取基本信息`);
      }

      // Owner
      try {
        const owner = await contract.owner();
        console.log(`  Owner: ${owner}`);
      } catch (e) {
        console.log(`  ✗ 無法讀取 owner`);
      }

      // 總供應量
      try {
        const totalSupply = await contract.totalSupply();
        console.log(`  總供應量: ${totalSupply.toString()}`);
      } catch (e) {
        console.log(`  總供應量: (無法讀取)`);
      }

      // 依賴關係
      console.log("\n🔗 依賴關係：");
      
      // SoulShardToken
      try {
        const token = await contract.soulShardToken();
        const isCorrect = token.toLowerCase() === dependencies.SOULSHARD.toLowerCase();
        console.log(`  SoulShardToken: ${token}`);
        console.log(`    ${isCorrect ? "✅ 正確" : "❌ 錯誤（應為 " + dependencies.SOULSHARD + "）"}`);
      } catch (e) {
        console.log(`  SoulShardToken: ❌ 未設置或無此功能`);
      }

      // DungeonCore
      try {
        const core = await contract.dungeonCore();
        const isCorrect = core.toLowerCase() === dependencies.DUNGEONCORE.toLowerCase();
        console.log(`  DungeonCore: ${core}`);
        console.log(`    ${isCorrect ? "✅ 正確" : "❌ 錯誤（應為 " + dependencies.DUNGEONCORE + "）"}`);
      } catch (e) {
        console.log(`  DungeonCore: ❌ 未設置或無此功能`);
      }

      // 元數據設置
      console.log("\n🎨 元數據設置：");
      
      // baseURI
      try {
        const baseURI = await contract.baseURI();
        console.log(`  baseURI: ${baseURI || "❌ (未設置)"}`);
        if (baseURI) {
          console.log(`    ${baseURI.includes("dungeon-delvers-metadata-server") ? "✅ 指向正確的元數據服務器" : "⚠️  可能需要更新"}`);
        }
      } catch (e) {
        console.log(`  baseURI: ❌ 無法讀取`);
      }

      // contractURI
      try {
        const contractURI = await contract.contractURI();
        console.log(`  contractURI: ${contractURI || "❌ (未設置)"}`);
      } catch (e) {
        console.log(`  contractURI: ❌ 無法讀取`);
      }

      // 測試 tokenURI
      console.log("\n🧪 tokenURI 測試：");
      try {
        const tokenURI = await contract.tokenURI(1);
        console.log(`  tokenURI(1): ✅ ${tokenURI}`);
      } catch (e) {
        if (e.message.includes("baseURI not set")) {
          console.log(`  tokenURI(1): ❌ baseURI 未設置`);
        } else if (e.message.includes("nonexistent token")) {
          console.log(`  tokenURI(1): ⚠️  Token #1 不存在`);
        } else {
          console.log(`  tokenURI(1): ❌ ${e.message}`);
        }
      }

      // VIPStaking 特有信息
      if (name === "VIPStaking") {
        console.log("\n💎 VIPStaking 特有信息：");
        try {
          const cooldown = await contract.unstakeCooldown();
          console.log(`  解質押冷卻時間: ${cooldown.toString()} 秒`);
        } catch (e) {
          console.log(`  解質押冷卻時間: (無法讀取)`);
        }
        try {
          const pending = await contract.totalPendingUnstakes();
          console.log(`  待處理解質押總量: ${ethers.formatEther(pending)} SOUL`);
        } catch (e) {
          console.log(`  待處理解質押總量: (無法讀取)`);
        }
      }

    } catch (error) {
      console.log(`\n❌ 檢查失敗: ${error.message}`);
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("📊 總結：");
  console.log("-".repeat(80));
  console.log("\n🔧 需要修復的問題：");
  console.log("1. 設置所有 NFT 合約的 baseURI 指向元數據服務器");
  console.log("2. 確保 VIPStaking 的 soulShardToken 和 dungeonCore 已設置");
  console.log("3. 同步元數據服務器到 V22 配置");
  console.log("\n✅ 建議執行：");
  console.log("1. npx hardhat run scripts/fix-v22-contracts.js --network bsc");
  console.log("2. 在元數據服務器更新合約地址配置");
  console.log("3. 驗證 NFT 市場是否能正確顯示圖片");
  console.log("\n" + "=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
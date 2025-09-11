// scripts/connect-nft-to-core.js
// 🔄 設置 DungeonCore 與 NFT 合約的雙向連接
// 部署 NFT 合約後執行此腳本完成雙向綁定

const hre = require("hardhat");
const { ethers } = require("hardhat");

// 🎯 重要：統一 Gas Price 設定 (0.11 gwei)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// 📋 配置常數
const CONFIG = {
  GAS_LIMIT: {
    SET_FUNCTION: 200000
  }
};

// 🔍 載入合約地址
async function loadContractAddresses() {
  try {
    const fs = require('fs');
    const envPath = '/Users/sotadic/Documents/DungeonDelversContracts/.env';
    
    if (!fs.existsSync(envPath)) {
      throw new Error("❌ .env 文件不存在");
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const addresses = {};
    
    // 解析地址
    const addressMappings = {
      DUNGEONCORE: /VITE_DUNGEONCORE_ADDRESS=(.+)/,
      VIPSTAKING: /VITE_VIPSTAKING_ADDRESS=(.+)/,
      HERO: /VITE_HERO_ADDRESS=(.+)/,
      RELIC: /VITE_RELIC_ADDRESS=(.+)/
    };
    
    for (const [key, regex] of Object.entries(addressMappings)) {
      const match = envContent.match(regex);
      if (match) {
        addresses[key] = match[1].trim();
        console.log(`✅ 找到 ${key}: ${addresses[key]}`);
      } else {
        console.log(`⚠️ 未找到 ${key} 地址`);
      }
    }
    
    return addresses;
  } catch (error) {
    console.error("❌ 無法載入合約地址:", error.message);
    throw error;
  }
}

// 🔄 設置 DungeonCore 中的 NFT 地址
async function setupDungeonCoreConnections(dungeonCoreAddress, nftAddresses, signer) {
  console.log("\n🔄 設置 DungeonCore 中的 NFT 合約地址...");
  
  try {
    // 連接到 DungeonCore 合約
    const DungeonCore = await ethers.getContractFactory("DungeonCore", signer);
    const dungeonCore = DungeonCore.attach(dungeonCoreAddress);
    
    const transactions = [];
    
    // 設置 VIPStaking 地址
    if (nftAddresses.VIPSTAKING) {
      console.log(`⏳ 設置 VIPStaking 地址: ${nftAddresses.VIPSTAKING}`);
      const tx = await dungeonCore.setVipStaking(nftAddresses.VIPSTAKING, {
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
        gasPrice: GAS_PRICE
      });
      transactions.push({ name: "setVipStaking", tx });
    }
    
    // 設置 Hero 地址
    if (nftAddresses.HERO) {
      console.log(`⏳ 設置 Hero 地址: ${nftAddresses.HERO}`);
      const tx = await dungeonCore.setHeroContract(nftAddresses.HERO, {
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
        gasPrice: GAS_PRICE
      });
      transactions.push({ name: "setHeroContract", tx });
    }
    
    // 設置 Relic 地址
    if (nftAddresses.RELIC) {
      console.log(`⏳ 設置 Relic 地址: ${nftAddresses.RELIC}`);
      const tx = await dungeonCore.setRelicContract(nftAddresses.RELIC, {
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
        gasPrice: GAS_PRICE
      });
      transactions.push({ name: "setRelicContract", tx });
    }
    
    // 等待所有交易確認
    console.log("\n⏳ 等待所有交易確認...");
    for (const { name, tx } of transactions) {
      await tx.wait();
      console.log(`✅ ${name} 完成: ${tx.hash}`);
    }
    
    console.log("✅ DungeonCore 連接設置完成");
    return true;
    
  } catch (error) {
    console.error("❌ DungeonCore 連接設置失敗:", error.message);
    return false;
  }
}

// 🔍 驗證雙向連接
async function verifyConnections(addresses, signer) {
  console.log("\n🔍 驗證雙向連接...");
  
  try {
    // 連接到 DungeonCore
    const DungeonCore = await ethers.getContractFactory("DungeonCore", signer);
    const dungeonCore = DungeonCore.attach(addresses.DUNGEONCORE);
    
    // 驗證 DungeonCore → NFT 連接
    console.log("\n📋 DungeonCore 中的 NFT 地址:");
    
    if (addresses.VIPSTAKING) {
      const storedVipAddress = await dungeonCore.vipStakingAddress();
      const isCorrect = storedVipAddress.toLowerCase() === addresses.VIPSTAKING.toLowerCase();
      console.log(`VIPStaking: ${storedVipAddress} ${isCorrect ? '✅' : '❌'}`);
    }
    
    if (addresses.HERO) {
      const storedHeroAddress = await dungeonCore.heroContractAddress();
      const isCorrect = storedHeroAddress.toLowerCase() === addresses.HERO.toLowerCase();
      console.log(`Hero: ${storedHeroAddress} ${isCorrect ? '✅' : '❌'}`);
    }
    
    if (addresses.RELIC) {
      const storedRelicAddress = await dungeonCore.relicContractAddress();
      const isCorrect = storedRelicAddress.toLowerCase() === addresses.RELIC.toLowerCase();
      console.log(`Relic: ${storedRelicAddress} ${isCorrect ? '✅' : '❌'}`);
    }
    
    // 驗證 NFT → DungeonCore 連接
    console.log("\n📋 NFT 合約中的 DungeonCore 地址:");
    
    const contractFactories = {
      VIPStaking: addresses.VIPSTAKING,
      Hero: addresses.HERO,
      Relic: addresses.RELIC
    };
    
    for (const [contractName, contractAddress] of Object.entries(contractFactories)) {
      if (contractAddress) {
        try {
          const ContractFactory = await ethers.getContractFactory(contractName, signer);
          const contract = ContractFactory.attach(contractAddress);
          
          const storedCoreAddress = await contract.dungeonCore();
          const isCorrect = storedCoreAddress.toLowerCase() === addresses.DUNGEONCORE.toLowerCase();
          console.log(`${contractName}: ${storedCoreAddress} ${isCorrect ? '✅' : '❌'}`);
          
        } catch (error) {
          console.log(`${contractName}: 無法驗證 (${error.message.split('.')[0]})`);
        }
      }
    }
    
    console.log("\n✅ 連接驗證完成");
    return true;
    
  } catch (error) {
    console.error("❌ 連接驗證失敗:", error.message);
    return false;
  }
}

// 📊 生成連接摘要報告
async function generateConnectionReport(addresses) {
  console.log("\n📊 雙向連接摘要報告");
  console.log("=".repeat(60));
  
  const connections = [
    {
      name: "DungeonCore ↔ VIPStaking",
      coreToNft: `DungeonCore.vipStakingAddress → ${addresses.VIPSTAKING || 'N/A'}`,
      nftToCore: `VIPStaking.dungeonCore → ${addresses.DUNGEONCORE || 'N/A'}`
    },
    {
      name: "DungeonCore ↔ Hero",
      coreToNft: `DungeonCore.heroContractAddress → ${addresses.HERO || 'N/A'}`,
      nftToCore: `Hero.dungeonCore → ${addresses.DUNGEONCORE || 'N/A'}`
    },
    {
      name: "DungeonCore ↔ Relic",
      coreToNft: `DungeonCore.relicContractAddress → ${addresses.RELIC || 'N/A'}`,
      nftToCore: `Relic.dungeonCore → ${addresses.DUNGEONCORE || 'N/A'}`
    }
  ];
  
  for (const conn of connections) {
    console.log(`\n🔗 ${conn.name}:`);
    console.log(`   ${conn.coreToNft}`);
    console.log(`   ${conn.nftToCore}`);
  }
  
  console.log("\n" + "=".repeat(60));
  
  // 保存報告到文件
  const fs = require('fs');
  const reportPath = `/Users/sotadic/Documents/DungeonDelversContracts/deployment-results/connection-report-${Date.now()}.md`;
  
  const reportContent = `# NFT Trinity 雙向連接報告\n\n生成時間: ${new Date().toISOString()}\n網路: ${hre.network.name}\n\n## 連接狀態\n\n${connections.map(conn => `### ${conn.name}\n- ${conn.coreToNft}\n- ${conn.nftToCore}`).join('\n\n')}\n`;
  
  // 確保目錄存在
  const reportDir = require('path').dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 報告已保存: ${reportPath}`);
}

// 🚀 主要執行流程
async function main() {
  console.log("🚀 開始設置 NFT Trinity 雙向連接");
  console.log(`📍 網路: ${hre.network.name}`);
  console.log(`⛽ Gas Price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);
  
  // 獲取簽名者
  const [signer] = await ethers.getSigners();
  console.log(`👤 操作者: ${signer.address}`);
  
  const balance = await signer.provider.getBalance(signer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
  
  try {
    // 🔍 階段 1: 載入地址
    console.log("\n🔍 === 階段 1: 載入合約地址 ===");
    const addresses = await loadContractAddresses();
    
    // 檢查必要地址
    if (!addresses.DUNGEONCORE) {
      throw new Error("❌ 缺少 DungeonCore 地址");
    }
    
    const nftAddresses = {
      VIPSTAKING: addresses.VIPSTAKING,
      HERO: addresses.HERO,
      RELIC: addresses.RELIC
    };
    
    const availableNfts = Object.entries(nftAddresses).filter(([_, addr]) => addr).length;
    
    if (availableNfts === 0) {
      throw new Error("❌ 沒有找到任何 NFT 合約地址");
    }
    
    console.log(`✅ 找到 ${availableNfts} 個 NFT 合約地址`);
    
    // 🔄 階段 2: 設置雙向連接
    console.log("\n🔄 === 階段 2: 設置雙向連接 ===");
    await setupDungeonCoreConnections(addresses.DUNGEONCORE, nftAddresses, signer);
    
    // 🔍 階段 3: 驗證連接
    console.log("\n🔍 === 階段 3: 驗證連接 ===");
    await verifyConnections(addresses, signer);
    
    // 📊 階段 4: 生成報告
    console.log("\n📊 === 階段 4: 生成報告 ===");
    await generateConnectionReport(addresses);
    
    console.log("\n🎉 NFT Trinity 雙向連接設置完成！");
    
  } catch (error) {
    console.error("\n💥 雙向連接設置失敗:", error);
    process.exit(1);
  }
}

// 🚀 執行主函數
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 腳本執行失敗:", error);
    process.exit(1);
  });
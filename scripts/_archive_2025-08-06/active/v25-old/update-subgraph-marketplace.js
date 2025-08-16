/**
 * 更新子圖配置以支持市場合約
 * 
 * 使用方式：
 * node scripts/active/update-subgraph-marketplace.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function updateSubgraphConfig() {
  console.log(`${colors.bright}${colors.blue}更新子圖配置以支持市場合約...${colors.reset}`);
  
  try {
    // 讀取 master-config
    const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
    const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    
    // 獲取市場合約地址
    const marketplaceAddress = masterConfig.contracts.mainnet.DUNGEONMARKETPLACE_ADDRESS;
    const offerSystemAddress = masterConfig.contracts.mainnet.OFFERSYSTEM_ADDRESS;
    
    if (marketplaceAddress === '0x0000000000000000000000000000000000000000' ||
        offerSystemAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`${colors.yellow}⚠️ 市場合約尚未部署，請先執行：${colors.reset}`);
      console.log(`${colors.cyan}npm run deploy:marketplace${colors.reset}`);
      return;
    }
    
    // 子圖配置路徑
    const subgraphYamlPath = path.join(
      __dirname, 
      '../../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml'
    );
    
    // 讀取子圖配置
    const subgraphConfig = yaml.load(fs.readFileSync(subgraphYamlPath, 'utf8'));
    
    // 更新市場合約地址
    let updated = false;
    
    for (let dataSource of subgraphConfig.dataSources) {
      if (dataSource.name === 'DungeonMarketplace') {
        console.log(`${colors.yellow}更新 DungeonMarketplace 地址...${colors.reset}`);
        dataSource.source.address = marketplaceAddress;
        dataSource.source.startBlock = masterConfig.deploymentBlock || 55714687;
        updated = true;
      } else if (dataSource.name === 'OfferSystem') {
        console.log(`${colors.yellow}更新 OfferSystem 地址...${colors.reset}`);
        dataSource.source.address = offerSystemAddress;
        dataSource.source.startBlock = masterConfig.deploymentBlock || 55714687;
        updated = true;
      }
    }
    
    if (!updated) {
      console.log(`${colors.red}❌ 未找到市場合約配置，請確認子圖 YAML 已包含市場合約定義${colors.reset}`);
      return;
    }
    
    // 保存更新後的配置
    const updatedYaml = yaml.dump(subgraphConfig, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '\'',
    });
    
    fs.writeFileSync(subgraphYamlPath, updatedYaml);
    
    console.log(`${colors.green}✅ 子圖配置已更新${colors.reset}`);
    console.log(`${colors.cyan}DungeonMarketplace: ${marketplaceAddress}${colors.reset}`);
    console.log(`${colors.cyan}OfferSystem: ${offerSystemAddress}${colors.reset}`);
    
    // 生成 mapping 文件（如果不存在）
    const mappingsDir = path.join(
      __dirname,
      '../../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src'
    );
    
    const marketplaceMappingPath = path.join(mappingsDir, 'marketplace.ts');
    const offerSystemMappingPath = path.join(mappingsDir, 'offer-system.ts');
    
    if (!fs.existsSync(marketplaceMappingPath)) {
      console.log(`${colors.yellow}創建 marketplace.ts mapping 文件...${colors.reset}`);
      fs.writeFileSync(marketplaceMappingPath, generateMarketplaceMapping());
    }
    
    if (!fs.existsSync(offerSystemMappingPath)) {
      console.log(`${colors.yellow}創建 offer-system.ts mapping 文件...${colors.reset}`);
      fs.writeFileSync(offerSystemMappingPath, generateOfferSystemMapping());
    }
    
    console.log(`\n${colors.bright}後續步驟：${colors.reset}`);
    console.log(`1. ${colors.yellow}cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers${colors.reset}`);
    console.log(`2. ${colors.yellow}npm run codegen${colors.reset}`);
    console.log(`3. ${colors.yellow}npm run build${colors.reset}`);
    console.log(`4. ${colors.yellow}graph deploy --studio dungeon-delvers${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ 更新失敗: ${error.message}${colors.reset}`);
  }
}

function generateMarketplaceMapping() {
  return `import { 
  ListingCreated,
  ListingSold,
  ListingCancelled,
  ListingPriceUpdated
} from "../generated/DungeonMarketplace/DungeonMarketplace"
import { 
  MarketListing,
  ListingPriceUpdate,
  MarketTransaction,
  MarketStats
} from "../generated/schema"
import { BigInt, store } from "@graphprotocol/graph-ts"

export function handleListingCreated(event: ListingCreated): void {
  let listing = new MarketListing(event.params.listingId.toString())
  listing.seller = event.params.seller
  listing.nftType = event.params.nftType
  listing.nftContract = event.params.nftContract
  listing.tokenId = event.params.tokenId
  listing.price = event.params.price
  listing.status = 0 // Active
  listing.createdAt = event.block.timestamp
  listing.updatedAt = event.block.timestamp
  
  // Link to NFT entities
  if (event.params.nftType == 0) {
    listing.hero = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  } else if (event.params.nftType == 1) {
    listing.relic = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  } else if (event.params.nftType == 2) {
    listing.party = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  }
  
  listing.save()
  
  // Update market stats
  updateMarketStats(true, false, BigInt.fromI32(0))
}

export function handleListingSold(event: ListingSold): void {
  let listing = MarketListing.load(event.params.listingId.toString())
  if (listing) {
    listing.status = 1 // Sold
    listing.updatedAt = event.block.timestamp
    listing.save()
  }
  
  // Create transaction record
  let tx = new MarketTransaction(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  tx.type = "ListingSold"
  tx.listing = event.params.listingId.toString()
  tx.seller = event.params.seller
  tx.buyer = event.params.buyer
  tx.price = event.params.price
  tx.platformFee = event.params.platformFeeAmount
  tx.timestamp = event.block.timestamp
  tx.transactionHash = event.transaction.hash
  tx.blockNumber = event.block.number
  tx.save()
  
  // Update market stats
  updateMarketStats(false, true, event.params.price)
}

export function handleListingCancelled(event: ListingCancelled): void {
  let listing = MarketListing.load(event.params.listingId.toString())
  if (listing) {
    listing.status = 2 // Cancelled
    listing.updatedAt = event.block.timestamp
    listing.save()
  }
  
  // Update market stats
  updateMarketStats(false, false, BigInt.fromI32(0))
}

export function handleListingPriceUpdated(event: ListingPriceUpdated): void {
  let listing = MarketListing.load(event.params.listingId.toString())
  if (listing) {
    listing.price = event.params.newPrice
    listing.updatedAt = event.block.timestamp
    listing.save()
    
    // Create price history record
    let priceUpdate = new ListingPriceUpdate(
      event.params.listingId.toString() + "-" + event.block.timestamp.toString()
    )
    priceUpdate.listing = event.params.listingId.toString()
    priceUpdate.oldPrice = event.params.oldPrice
    priceUpdate.newPrice = event.params.newPrice
    priceUpdate.timestamp = event.block.timestamp
    priceUpdate.transactionHash = event.transaction.hash
    priceUpdate.save()
  }
}

function updateMarketStats(isNewListing: boolean, isSale: boolean, saleAmount: BigInt): void {
  let stats = MarketStats.load("market")
  if (!stats) {
    stats = new MarketStats("market")
    stats.totalListings = 0
    stats.activeListings = 0
    stats.totalSales = 0
    stats.totalVolume = BigInt.fromI32(0)
    stats.totalOffers = 0
    stats.activeOffers = 0
    stats.acceptedOffers = 0
  }
  
  if (isNewListing) {
    stats.totalListings = stats.totalListings + 1
    stats.activeListings = stats.activeListings + 1
  } else if (isSale) {
    stats.totalSales = stats.totalSales + 1
    stats.totalVolume = stats.totalVolume.plus(saleAmount)
    stats.activeListings = stats.activeListings - 1
  } else {
    // Cancelled
    stats.activeListings = stats.activeListings - 1
  }
  
  stats.lastUpdatedAt = BigInt.fromI32(0) // Use block timestamp in real implementation
  stats.save()
}
`;
}

function generateOfferSystemMapping() {
  return `import {
  OfferCreated,
  OfferAccepted,
  OfferDeclined,
  OfferCancelled,
  OfferExpired
} from "../generated/OfferSystem/OfferSystem"
import {
  Offer,
  OfferTransaction,
  MarketStats
} from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleOfferCreated(event: OfferCreated): void {
  let offer = new Offer(event.params.offerId.toString())
  offer.buyer = event.params.buyer
  offer.seller = event.params.seller
  offer.nftType = event.params.nftType
  offer.nftContract = event.params.nftContract
  offer.tokenId = event.params.tokenId
  offer.amount = event.params.amount
  offer.expiresAt = event.params.expiresAt
  offer.status = 0 // Active
  offer.message = event.params.message
  offer.createdAt = event.block.timestamp
  
  // Link to NFT entities
  if (event.params.nftType == 0) {
    offer.hero = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  } else if (event.params.nftType == 1) {
    offer.relic = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  } else if (event.params.nftType == 2) {
    offer.party = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  }
  
  offer.save()
  
  // Update market stats
  updateOfferStats(true, false)
}

export function handleOfferAccepted(event: OfferAccepted): void {
  let offer = Offer.load(event.params.offerId.toString())
  if (offer) {
    offer.status = 1 // Accepted
    offer.save()
  }
  
  // Create transaction record
  let tx = new OfferTransaction(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  tx.type = "OfferAccepted"
  tx.offer = event.params.offerId.toString()
  tx.buyer = event.params.buyer
  tx.seller = event.params.seller
  tx.amount = event.params.amount
  tx.platformFee = event.params.platformFeeAmount
  tx.timestamp = event.block.timestamp
  tx.transactionHash = event.transaction.hash
  tx.blockNumber = event.block.number
  tx.save()
  
  // Update market stats
  updateOfferStats(false, true)
}

export function handleOfferDeclined(event: OfferDeclined): void {
  let offer = Offer.load(event.params.offerId.toString())
  if (offer) {
    offer.status = 2 // Declined
    offer.save()
  }
  
  updateOfferStats(false, false)
}

export function handleOfferCancelled(event: OfferCancelled): void {
  let offer = Offer.load(event.params.offerId.toString())
  if (offer) {
    offer.status = 4 // Cancelled
    offer.save()
  }
  
  updateOfferStats(false, false)
}

export function handleOfferExpired(event: OfferExpired): void {
  let offer = Offer.load(event.params.offerId.toString())
  if (offer) {
    offer.status = 3 // Expired
    offer.save()
  }
  
  updateOfferStats(false, false)
}

function updateOfferStats(isNew: boolean, isAccepted: boolean): void {
  let stats = MarketStats.load("market")
  if (!stats) {
    stats = new MarketStats("market")
    stats.totalListings = 0
    stats.activeListings = 0
    stats.totalSales = 0
    stats.totalVolume = BigInt.fromI32(0)
    stats.totalOffers = 0
    stats.activeOffers = 0
    stats.acceptedOffers = 0
  }
  
  if (isNew) {
    stats.totalOffers = stats.totalOffers + 1
    stats.activeOffers = stats.activeOffers + 1
  } else if (isAccepted) {
    stats.acceptedOffers = stats.acceptedOffers + 1
    stats.activeOffers = stats.activeOffers - 1
  } else {
    // Declined, cancelled, or expired
    stats.activeOffers = stats.activeOffers - 1
  }
  
  stats.lastUpdatedAt = BigInt.fromI32(0) // Use block timestamp in real implementation
  stats.save()
}
`;
}

// 執行更新
updateSubgraphConfig();
// Test queries for DungeonDelvers P2P Marketplace Subgraph
const axios = require('axios');

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeondelvers-p2p-marketplace/v0.0.1';

async function runQuery(query, name) {
  console.log(`\n========== ${name} ==========`);
  try {
    const response = await axios.post(SUBGRAPH_URL, { query });
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Query failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

async function testSubgraph() {
  console.log('Testing DungeonDelvers P2P Marketplace Subgraph...');
  console.log('Endpoint:', SUBGRAPH_URL);
  
  // 1. Test basic connection and schema
  await runQuery(`
    {
      _meta {
        block {
          number
          hash
        }
        deployment
        hasIndexingErrors
      }
    }
  `, 'Subgraph Metadata');

  // 2. Test market statistics
  await runQuery(`
    {
      marketStatsV2s(first: 1) {
        id
        totalListings
        activeListings
        totalSales
        totalVolume
        totalOffers
        activeOffers
        platformFeesCollected
        lastUpdated
      }
    }
  `, 'Market Statistics');

  // 3. Test active listings
  await runQuery(`
    {
      marketListingV2s(
        first: 10
        where: { isActive: true }
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        listingId
        seller
        nftType
        nftContract
        tokenId
        price
        acceptedTokens
        isActive
        createdAt
        updatedAt
      }
    }
  `, 'Active Listings');

  // 4. Test recent transactions
  await runQuery(`
    {
      marketTransactionV2s(
        first: 5
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        listingId
        buyer
        seller
        nftType
        nftContract
        tokenId
        price
        paymentToken
        platformFee
        timestamp
        blockNumber
        transactionHash
      }
    }
  `, 'Recent Transactions');

  // 5. Test offers
  await runQuery(`
    {
      offerV2s(
        first: 10
        where: { status: "ACTIVE" }
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        offerId
        offerer
        targetAddress
        nftType
        nftContract
        tokenId
        offerAmount
        paymentToken
        expirationTime
        status
        createdAt
      }
    }
  `, 'Active Offers');

  // 6. Test daily statistics
  await runQuery(`
    {
      dailyMarketStatsV2s(
        first: 7
        orderBy: date
        orderDirection: desc
      ) {
        id
        date
        listings
        sales
        volume
        uniqueBuyers
        uniqueSellers
        offers
        offersAccepted
      }
    }
  `, 'Daily Statistics (Last 7 Days)');

  // 7. Test user statistics
  await runQuery(`
    {
      userMarketStatsV2s(
        first: 5
        orderBy: totalVolumeAsSeller
        orderDirection: desc
      ) {
        id
        userAddress
        totalListings
        totalSales
        totalPurchases
        totalVolumeAsSeller
        totalVolumeAsBuyer
        totalOffersMade
        totalOffersReceived
        firstActivityAt
        lastActivityAt
      }
    }
  `, 'Top Sellers by Volume');

  // 8. Test supported tokens
  await runQuery(`
    {
      tokenSupports(where: { isSupported: true }) {
        id
        tokenAddress
        isSupported
        symbol
        name
        decimals
        addedAt
        updatedAt
      }
    }
  `, 'Supported Payment Tokens');

  // 9. Test NFT statistics
  await runQuery(`
    {
      nftmarketStatsV2s(
        first: 10
        orderBy: totalSales
        orderDirection: desc
      ) {
        id
        nftContract
        tokenId
        nftType
        totalListings
        totalSales
        totalOffers
        highestSalePrice
        lowestSalePrice
        averageSalePrice
        lastSalePrice
        lastListingPrice
        firstSaleAt
        lastSaleAt
      }
    }
  `, 'Top NFTs by Sales');

  // 10. Test price updates
  await runQuery(`
    {
      listingPriceUpdateV2s(
        first: 5
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        listingId
        oldPrice
        newPrice
        timestamp
        blockNumber
        transactionHash
      }
    }
  `, 'Recent Price Updates');

  // 11. Test complex query - Listings with specific NFT type
  await runQuery(`
    {
      heroListings: marketListingV2s(
        where: { 
          nftType: "HERO",
          isActive: true 
        }
        first: 5
      ) {
        id
        tokenId
        price
        seller
      }
      
      relicListings: marketListingV2s(
        where: { 
          nftType: "RELIC",
          isActive: true 
        }
        first: 5
      ) {
        id
        tokenId
        price
        seller
      }
    }
  `, 'Listings by NFT Type');

  // 12. Test pagination
  await runQuery(`
    {
      marketListingV2s(
        first: 3
        skip: 0
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        listingId
        createdAt
      }
    }
  `, 'Pagination Test');

  console.log('\n========== Test Complete ==========');
}

// Run the tests
testSubgraph().catch(console.error);
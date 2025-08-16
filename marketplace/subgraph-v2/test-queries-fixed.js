// Fixed test queries for DungeonDelvers P2P Marketplace Subgraph
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
  console.log('Current BSC Block: ~55754444');
  console.log('Subgraph Start Block: 55700000');
  
  // 1. Test basic connection and schema
  const metaResult = await runQuery(`
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
      marketStatsV2S(first: 1) {
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
      marketListingV2S(
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

  // 4. Test all listings (active and inactive)
  await runQuery(`
    {
      marketListingV2S(
        first: 10
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
        isActive
        createdAt
      }
    }
  `, 'All Listings (Recent)');

  // 5. Test recent transactions
  await runQuery(`
    {
      marketTransactionV2S(
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

  // 6. Test offers
  await runQuery(`
    {
      offerV2S(
        first: 10
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
  `, 'Recent Offers');

  // 7. Test active offers specifically
  await runQuery(`
    {
      offerV2S(
        first: 10
        where: { status: "ACTIVE" }
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        offerId
        offerer
        offerAmount
        status
      }
    }
  `, 'Active Offers Only');

  // 8. Test daily statistics
  await runQuery(`
    {
      dailyMarketStatsV2S(
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

  // 9. Test user statistics
  await runQuery(`
    {
      userMarketStatsV2S(
        first: 10
        orderBy: lastActivityAt
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
  `, 'Most Recent Active Users');

  // 10. Test supported tokens
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

  // 11. Test NFT statistics
  await runQuery(`
    {
      nftmarketStatsV2S(
        first: 10
        orderBy: totalListings
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
  `, 'Top NFTs by Listings');

  // 12. Test price updates
  await runQuery(`
    {
      listingPriceUpdateV2S(
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

  // 13. Test listings by NFT type
  await runQuery(`
    {
      heroListings: marketListingV2S(
        where: { 
          nftType: "HERO"
        }
        first: 5
      ) {
        id
        tokenId
        price
        seller
        isActive
      }
      
      relicListings: marketListingV2S(
        where: { 
          nftType: "RELIC"
        }
        first: 5
      ) {
        id
        tokenId
        price
        seller
        isActive
      }
    }
  `, 'Listings by NFT Type');

  // 14. Test single entity queries
  await runQuery(`
    {
      marketStatsV2(id: "global") {
        id
        totalListings
        activeListings
        totalSales
        totalVolume
        platformFeesCollected
      }
    }
  `, 'Global Market Stats (Single Entity)');

  // 15. Test offer transactions
  await runQuery(`
    {
      offerTransactionV2S(
        first: 5
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        offerId
        offerer
        accepter
        nftType
        nftContract
        tokenId
        offerAmount
        paymentToken
        platformFee
        timestamp
        transactionHash
      }
    }
  `, 'Offer Transactions');

  // 16. Test token volumes
  await runQuery(`
    {
      tokenVolumes(first: 10) {
        id
        tokenAddress
        volume
        platformFees
      }
    }
  `, 'Token Trading Volumes');

  console.log('\n========== Test Summary ==========');
  console.log('Subgraph is deployed and responding');
  console.log('Indexing Status:', !metaResult?.data?._meta?.hasIndexingErrors ? 'Healthy' : 'Has Errors');
  console.log('Current Indexed Block:', metaResult?.data?._meta?.block?.number || 'Unknown');
  console.log('\nNOTE: If queries return empty arrays, it may mean:');
  console.log('1. No transactions have occurred yet since deployment');
  console.log('2. The subgraph is still syncing (check current block vs start block)');
  console.log('3. The contract addresses in subgraph.yaml need to be updated');
}

// Run the tests
testSubgraph().catch(console.error);
// Test schema introspection for DungeonDelvers P2P Marketplace Subgraph
const axios = require('axios');

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeondelvers-p2p-marketplace/v0.0.1';

async function introspectSchema() {
  console.log('Introspecting subgraph schema...');
  
  try {
    const response = await axios.post(SUBGRAPH_URL, {
      query: `
        {
          __schema {
            queryType {
              fields {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `
    });
    
    console.log('Available query fields:');
    const fields = response.data.data.__schema.queryType.fields;
    fields.forEach(field => {
      console.log(`- ${field.name} (${field.type.kind}: ${field.type.name})`);
    });
    
    // Now let's test with corrected entity names
    console.log('\n\nTesting with corrected entity names...\n');
    
    // Find market listing entity
    const marketListingField = fields.find(f => f.name.toLowerCase().includes('market') && f.name.toLowerCase().includes('listing'));
    if (marketListingField) {
      console.log(`\nTesting ${marketListingField.name}...`);
      const query = `
        {
          ${marketListingField.name}(first: 5) {
            id
          }
        }
      `;
      const result = await axios.post(SUBGRAPH_URL, { query });
      console.log(JSON.stringify(result.data, null, 2));
    }
    
    // Find stats entity
    const statsField = fields.find(f => f.name.toLowerCase().includes('stats'));
    if (statsField) {
      console.log(`\nTesting ${statsField.name}...`);
      const query = `
        {
          ${statsField.name}(first: 1) {
            id
          }
        }
      `;
      const result = await axios.post(SUBGRAPH_URL, { query });
      console.log(JSON.stringify(result.data, null, 2));
    }
    
  } catch (error) {
    console.error('Introspection failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

introspectSchema().catch(console.error);
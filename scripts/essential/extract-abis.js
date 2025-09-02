// extract-abis.js - Extract and distribute ABI files to frontend/backend projects
// Simplified version of the ultimate-config-system.js ABI functionality

const fs = require("fs").promises;
const path = require("path");

// Project paths for ABI distribution
const FRONTEND_PROJECT = "/Users/sotadic/Documents/GitHub/DungeonDelvers";
const BACKEND_PROJECT = "/Users/sotadic/Documents/dungeon-delvers-metadata-server";
const SUBGRAPH_PROJECT = "/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers";

// Core contracts that need ABI distribution
const CORE_CONTRACTS = [
  "DungeonCore",
  "DungeonMaster", 
  "DungeonStorage",
  "AltarOfAscension",
  "Hero",
  "Relic", 
  "Party",
  "PlayerProfile",
  "PlayerVault",
  "VIPStaking",
  "Oracle",
  "VRFConsumerV2Plus",
  "TSOUL"
];

async function main() {
  console.log("📄 DungeonDelvers ABI Extraction & Distribution");
  console.log("🎯 Target: Frontend, Backend, Subgraph Projects");
  console.log("=" .repeat(60));

  // Ensure artifacts directory exists and is compiled
  const artifactsDir = path.join(__dirname, "../../artifacts/contracts");
  
  try {
    await fs.access(artifactsDir);
  } catch (error) {
    throw new Error("Artifacts directory not found. Run 'npm run compile' first.");
  }

  console.log("🔍 Extracting ABIs from compiled artifacts...");
  
  const extractedABIs = {};
  let extractedCount = 0;

  // Extract ABI for each core contract
  for (const contractName of CORE_CONTRACTS) {
    try {
      const abi = await extractContractABI(contractName);
      if (abi) {
        extractedABIs[contractName] = abi;
        extractedCount++;
        console.log(`✅ Extracted: ${contractName}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not extract ${contractName}: ${error.message}`);
    }
  }

  console.log(`\n📊 Extracted ${extractedCount} ABIs from ${CORE_CONTRACTS.length} contracts`);

  if (extractedCount === 0) {
    throw new Error("No ABIs extracted. Check compilation status.");
  }

  // Save ABIs to local abis/ directory 
  console.log("\n💾 Saving ABIs to local directory...");
  await saveLocalABIs(extractedABIs);

  // Distribute to external projects
  console.log("\n🚀 Distributing ABIs to external projects...");
  const distributionResults = await distributeABIs(extractedABIs);

  // Generate summary report
  console.log("\n📋 Distribution Summary");
  console.log("=" .repeat(60));
  console.log(`📄 ABIs extracted: ${extractedCount}`);
  console.log(`📁 Local directory: ✅ Updated`);
  
  distributionResults.forEach(result => {
    const status = result.success ? "✅" : "❌";
    console.log(`📂 ${result.project}: ${status} ${result.message}`);
  });

  console.log("\n🎉 ABI extraction and distribution completed!");
  console.log("\n💡 Next steps:");
  console.log("1. Restart frontend dev server to pick up new ABIs");
  console.log("2. Restart backend server to use updated contracts");
  console.log("3. Redeploy subgraph if contract addresses changed");
}

// Extract ABI from compiled artifact
async function extractContractABI(contractName) {
  const possiblePaths = [
    `current/core/${contractName}.sol/${contractName}.json`,
    `current/nft/${contractName}.sol/${contractName}.json`,
    `current/defi/${contractName}.sol/${contractName}.json`,
    `current/interfaces/interfaces.sol/${contractName}.json`
  ];

  const artifactsDir = path.join(__dirname, "../../artifacts/contracts");
  
  for (const relativePath of possiblePaths) {
    const fullPath = path.join(artifactsDir, relativePath);
    
    try {
      const artifactContent = await fs.readFile(fullPath, "utf8");
      const artifact = JSON.parse(artifactContent);
      
      if (artifact.abi && artifact.abi.length > 0) {
        return artifact.abi;
      }
    } catch (error) {
      // Continue trying other paths
      continue;
    }
  }
  
  throw new Error(`Artifact not found in any expected location`);
}

// Save ABIs to local abis/ directory
async function saveLocalABIs(abis) {
  const abisDir = path.join(__dirname, "../../abis");
  await fs.mkdir(abisDir, { recursive: true });

  for (const [contractName, abi] of Object.entries(abis)) {
    const filePath = path.join(abisDir, `${contractName}.json`);
    await fs.writeFile(filePath, JSON.stringify(abi, null, 2));
  }

  console.log(`✅ Saved ${Object.keys(abis).length} ABIs to ./abis/`);
}

// Distribute ABIs to external projects
async function distributeABIs(abis) {
  const results = [];

  // Frontend distribution
  try {
    const frontendABIDir = path.join(FRONTEND_PROJECT, "src/contracts/abi");
    await fs.mkdir(frontendABIDir, { recursive: true });

    for (const [contractName, abi] of Object.entries(abis)) {
      const filePath = path.join(frontendABIDir, `${contractName}.json`);
      await fs.writeFile(filePath, JSON.stringify(abi, null, 2));
    }

    results.push({
      project: "Frontend",
      success: true,
      message: `${Object.keys(abis).length} ABIs updated`
    });
  } catch (error) {
    results.push({
      project: "Frontend", 
      success: false,
      message: `Failed: ${error.message}`
    });
  }

  // Backend distribution
  try {
    const backendABIDir = path.join(BACKEND_PROJECT, "abis");
    await fs.mkdir(backendABIDir, { recursive: true });

    for (const [contractName, abi] of Object.entries(abis)) {
      const filePath = path.join(backendABIDir, `${contractName}.json`);
      await fs.writeFile(filePath, JSON.stringify(abi, null, 2));
    }

    results.push({
      project: "Backend",
      success: true, 
      message: `${Object.keys(abis).length} ABIs updated`
    });
  } catch (error) {
    results.push({
      project: "Backend",
      success: false,
      message: `Failed: ${error.message}`
    });
  }

  // Subgraph distribution
  try {
    const subgraphABIDir = path.join(SUBGRAPH_PROJECT, "abis");
    await fs.mkdir(subgraphABIDir, { recursive: true });

    // Subgraph only needs specific contracts
    const subgraphContracts = ["Hero", "Relic", "Party", "DungeonMaster", "AltarOfAscension"];
    
    for (const contractName of subgraphContracts) {
      if (abis[contractName]) {
        const filePath = path.join(subgraphABIDir, `${contractName}.json`);
        await fs.writeFile(filePath, JSON.stringify(abis[contractName], null, 2));
      }
    }

    results.push({
      project: "Subgraph",
      success: true,
      message: `${subgraphContracts.length} ABIs updated`
    });
  } catch (error) {
    results.push({
      project: "Subgraph",
      success: false,
      message: `Failed: ${error.message}`
    });
  }

  return results;
}

// Check if external project directories exist
async function checkProjectPaths() {
  const projects = [
    { name: "Frontend", path: FRONTEND_PROJECT },
    { name: "Backend", path: BACKEND_PROJECT },
    { name: "Subgraph", path: SUBGRAPH_PROJECT }
  ];

  console.log("\n🔍 Checking external project paths...");
  
  for (const project of projects) {
    try {
      await fs.access(project.path);
      console.log(`✅ ${project.name}: Found at ${project.path}`);
    } catch (error) {
      console.warn(`⚠️  ${project.name}: Not found at ${project.path}`);
    }
  }
}

if (require.main === module) {
  checkProjectPaths()
    .then(() => main())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ ABI extraction failed:", error.message);
      process.exit(1);
    });
}

module.exports = { main, extractContractABI };
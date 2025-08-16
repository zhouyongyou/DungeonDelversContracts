#!/bin/bash

# Fix Int8 import issue in generated schema
echo "Fixing Int8 import in generated schema..."
sed -i '' 's/, Int8//g; s/Int8,//g' generated/schema.ts 2>/dev/null || true

# Run build
echo "Building subgraph..."
npm run build
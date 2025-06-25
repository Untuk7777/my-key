#!/bin/bash

# Example usage script for the key validation API
# Replace YOUR_REPLIT_URL with your actual deployment URL

BASE_URL="http://localhost:5000"  # Change this to your deployed URL

echo "=== Key Generator API Example ==="
echo

# Generate a new key
echo "1. Generating a new key..."
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"name":"Example Script Key"}')

echo "Response: $GENERATE_RESPONSE"
echo

# Extract the key from the response
KEY=$(echo $GENERATE_RESPONSE | grep -o 'FREE-[a-f0-9]\{10\}-[a-f0-9]\{8\}')

if [ -z "$KEY" ]; then
    echo "Failed to generate key"
    exit 1
fi

echo "Generated key: $KEY"
echo

# Validate the key using GET endpoint
echo "2. Validating the key using GET /api/validate/:key"
VALIDATION_RESPONSE=$(curl -s "$BASE_URL/api/validate/$KEY")
echo "Response: $VALIDATION_RESPONSE"
echo

# Check if key is valid
IS_VALID=$(echo $VALIDATION_RESPONSE | grep -o '"valid":true')

if [ -n "$IS_VALID" ]; then
    echo "✓ Key is valid!"
else
    echo "✗ Key validation failed"
fi

echo

# Test with invalid key
echo "3. Testing with invalid key..."
INVALID_RESPONSE=$(curl -s "$BASE_URL/api/validate/FREE-invalid-key")
echo "Response: $INVALID_RESPONSE"
echo

# Show all keys
echo "4. Getting all active keys..."
ALL_KEYS=$(curl -s "$BASE_URL/api/keys")
echo "Response: $ALL_KEYS"
echo

echo "=== Example completed ==="
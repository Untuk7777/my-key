# API Documentation

## Base URL
Replace `YOUR_REPLIT_URL` with your actual deployment URL.

## Endpoints

### 1. Generate Key
**POST** `/api/keys`

Generate a new bash-style key.

**Request Body:**
```json
{
  "name": "Optional Key Name"
}
```

**Response:**
```json
{
  "name": "My Key",
  "key": "FREE-9f2d7c1a3e-bd4f7a29",
  "type": "bash",
  "length": 25,
  "expiresAt": "2025-06-26T07:00:00.000Z",
  "id": 1,
  "timestamp": "2025-06-25T07:00:00.000Z"
}
```

### 2. Validate Key (GET)
**GET** `/api/validate/{key}`

Validate a key by passing it in the URL path.

**Example:**
```
GET /api/validate/FREE-9f2d7c1a3e-bd4f7a29
```

**Response (Valid Key):**
```json
{
  "valid": true,
  "message": "Key is valid",
  "data": {
    "name": "My Key",
    "created": "2025-06-25T07:00:00.000Z",
    "expires": "2025-06-26T07:00:00.000Z"
  }
}
```

**Response (Invalid/Expired Key):**
```json
{
  "valid": false,
  "message": "Key not found"
}
```

### 3. Validate Key (POST)
**POST** `/api/validate`

Alternative validation method with JSON body.

**Request Body:**
```json
{
  "key": "FREE-9f2d7c1a3e-bd4f7a29"
}
```

**Response:** Same as GET method above.

### 4. Generate Key (External)
**POST** `/api/generate`

Generate key for external scripts (same as `/api/keys` but with different response format).

**Request Body:**
```json
{
  "name": "Script Key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Key generated successfully",
  "key": "FREE-9f2d7c1a3e-bd4f7a29",
  "expires": "2025-06-26T07:00:00.000Z",
  "name": "Script Key"
}
```

### 5. Get All Keys
**GET** `/api/keys`

Get all active (non-expired) keys.

**Response:**
```json
[
  {
    "name": "My Key",
    "key": "FREE-9f2d7c1a3e-bd4f7a29",
    "type": "bash",
    "length": 25,
    "expiresAt": "2025-06-26T07:00:00.000Z",
    "id": 1,
    "timestamp": "2025-06-25T07:00:00.000Z"
  }
]
```

### 6. Get Keys from File
**GET** `/api/keys/file`

Get keys and metadata from JSON storage.

**Response:**
```json
{
  "keys": [...],
  "metadata": {
    "total_keys": 1,
    "last_generated": "2025-06-25T07:00:00.000Z"
  }
}
```

## Key Format
Keys are generated in bash-style format:
- Pattern: `FREE-{10-hex-chars}-{8-hex-chars}`
- Example: `FREE-9f2d7c1a3e-bd4f7a29`
- Length: Always 25 characters
- Expiration: 24 hours from creation

## Usage Examples

### Bash/Shell Script
```bash
#!/bin/bash

# Generate a key
KEY_RESPONSE=$(curl -s -X POST "YOUR_REPLIT_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"name":"Script Key"}')

KEY=$(echo $KEY_RESPONSE | jq -r '.key')
echo "Generated key: $KEY"

# Validate the key
VALIDATION=$(curl -s "YOUR_REPLIT_URL/api/validate/$KEY")
IS_VALID=$(echo $VALIDATION | jq -r '.valid')

if [ "$IS_VALID" = "true" ]; then
    echo "Key is valid!"
else
    echo "Key is invalid or expired"
fi
```

### Python Script
```python
import requests
import json

BASE_URL = "YOUR_REPLIT_URL"

# Generate key
response = requests.post(f"{BASE_URL}/api/generate", 
                        json={"name": "Python Script Key"})
data = response.json()

if data.get("success"):
    key = data["key"]
    print(f"Generated key: {key}")
    
    # Validate key
    validation = requests.get(f"{BASE_URL}/api/validate/{key}")
    result = validation.json()
    
    if result.get("valid"):
        print("Key is valid!")
        print(f"Expires: {result['data']['expires']}")
    else:
        print(f"Invalid key: {result.get('message')}")
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

const BASE_URL = 'YOUR_REPLIT_URL';

async function generateAndValidateKey() {
    try {
        // Generate key
        const generateResponse = await axios.post(`${BASE_URL}/api/generate`, {
            name: 'JS Script Key'
        });
        
        const key = generateResponse.data.key;
        console.log(`Generated key: ${key}`);
        
        // Validate key
        const validateResponse = await axios.get(`${BASE_URL}/api/validate/${key}`);
        
        if (validateResponse.data.valid) {
            console.log('Key is valid!');
            console.log(`Expires: ${validateResponse.data.data.expires}`);
        } else {
            console.log(`Invalid key: ${validateResponse.data.message}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

generateAndValidateKey();
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid data)
- `404`: Not found
- `500`: Server error

Error responses include a `message` field describing the issue.
-- Lua API Integration Example
-- Replace YOUR_REPLIT_URL with your actual deployment URL

local HttpService = game:GetService("HttpService")
local API_BASE_URL = "YOUR_REPLIT_URL" -- Your deployed Replit app URL

-- Function to validate a key
function validateKey(key)
    local success, result = pcall(function()
        local response = HttpService:GetAsync(API_BASE_URL .. "/api/validate/" .. key)
        return HttpService:JSONDecode(response)
    end)
    
    if success and result then
        return result
    else
        return {valid = false, message = "Connection failed"}
    end
end

-- Function to generate a new key (if needed)
function generateKey(keyName)
    local success, result = pcall(function()
        local response = HttpService:PostAsync(
            API_BASE_URL .. "/api/generate",
            HttpService:JSONEncode({name = keyName or "Lua Generated Key"}),
            Enum.HttpContentType.ApplicationJson
        )
        return HttpService:JSONDecode(response)
    end)
    
    if success and result then
        return result
    else
        return {success = false, message = "Generation failed"}
    end
end

-- Example usage
local testKey = "FREE-f1d3b1ae20-3d587f47"

print("Validating key:", testKey)
local validation = validateKey(testKey)

if validation.valid then
    print("✓ Key is valid!")
    print("Name:", validation.data.name)
    print("Expires:", validation.data.expires)
else
    print("✗ Key invalid:", validation.message)
end

-- Generate a new key example
print("\nGenerating new key...")
local newKey = generateKey("My Lua Script")

if newKey.success then
    print("✓ Generated:", newKey.key)
    print("Expires:", newKey.expires)
else
    print("✗ Generation failed:", newKey.message)
end
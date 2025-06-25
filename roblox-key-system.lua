-- Roblox Key System Integration
-- Place this script in ServerScriptService

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

-- Configuration
local API_BASE_URL = "YOUR_REPLIT_URL_HERE" -- Replace with your actual Replit app URL
local KEY_DATASTORE = DataStoreService:GetDataStore("ValidatedKeys")

local KeySystem = {}

-- Function to validate a key with your web service
function KeySystem.ValidateKey(key)
    local success, result = pcall(function()
        local response = HttpService:PostAsync(
            API_BASE_URL .. "/api/validate",
            HttpService:JSONEncode({key = key}),
            Enum.HttpContentType.ApplicationJson
        )
        return HttpService:JSONDecode(response)
    end)
    
    if success and result then
        return result
    else
        return {
            success = false,
            message = "Failed to connect to key server",
            valid = false
        }
    end
end

-- Function to generate a new key (for admin use)
function KeySystem.GenerateKey(keyName)
    local success, result = pcall(function()
        local response = HttpService:PostAsync(
            API_BASE_URL .. "/api/generate",
            HttpService:JSONEncode({name = keyName or "Roblox Key"}),
            Enum.HttpContentType.ApplicationJson
        )
        return HttpService:JSONDecode(response)
    end)
    
    if success and result then
        return result
    else
        return {
            success = false,
            message = "Failed to generate key"
        }
    end
end

-- Function to check if player has valid key stored
function KeySystem.PlayerHasValidKey(player)
    local success, storedKey = pcall(function()
        return KEY_DATASTORE:GetAsync(tostring(player.UserId))
    end)
    
    if success and storedKey then
        -- Validate the stored key is still valid
        local validation = KeySystem.ValidateKey(storedKey)
        return validation.valid == true
    end
    
    return false
end

-- Function to store validated key for player
function KeySystem.StorePlayerKey(player, key)
    local validation = KeySystem.ValidateKey(key)
    
    if validation.valid then
        local success = pcall(function()
            KEY_DATASTORE:SetAsync(tostring(player.UserId), key)
        end)
        
        if success then
            return {
                success = true,
                message = "Key validated and stored successfully",
                keyData = validation.keyData
            }
        else
            return {
                success = false,
                message = "Failed to store key"
            }
        end
    else
        return validation
    end
end

-- Function to revoke player's key
function KeySystem.RevokePlayerKey(player)
    local success = pcall(function()
        KEY_DATASTORE:RemoveAsync(tostring(player.UserId))
    end)
    
    return {
        success = success,
        message = success and "Key revoked successfully" or "Failed to revoke key"
    }
end

-- Example usage functions
function KeySystem.OnPlayerJoined(player)
    if KeySystem.PlayerHasValidKey(player) then
        print(player.Name .. " has a valid key")
        -- Grant access to premium features
        KeySystem.GrantPremiumAccess(player)
    else
        print(player.Name .. " needs to validate a key")
        -- Show key validation GUI
        KeySystem.ShowKeyValidationGUI(player)
    end
end

function KeySystem.GrantPremiumAccess(player)
    -- Add your premium features here
    print("Granting premium access to " .. player.Name)
    
    -- Example: Give special tools, access to VIP areas, etc.
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats then
        local premiumStatus = leaderstats:FindFirstChild("Premium")
        if premiumStatus then
            premiumStatus.Value = "Active"
        end
    end
end

function KeySystem.ShowKeyValidationGUI(player)
    -- Create a simple GUI for key validation
    local playerGui = player:WaitForChild("PlayerGui")
    
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "KeyValidationGUI"
    screenGui.Parent = playerGui
    
    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 400, 0, 200)
    frame.Position = UDim2.new(0.5, -200, 0.5, -100)
    frame.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
    frame.BorderSizePixel = 0
    frame.Parent = screenGui
    
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 40)
    title.Position = UDim2.new(0, 0, 0, 10)
    title.BackgroundTransparency = 1
    title.Text = "Enter Your Key"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.TextScaled = true
    title.Font = Enum.Font.SourceSansBold
    title.Parent = frame
    
    local keyInput = Instance.new("TextBox")
    keyInput.Size = UDim2.new(0.8, 0, 0, 40)
    keyInput.Position = UDim2.new(0.1, 0, 0, 60)
    keyInput.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    keyInput.Text = ""
    keyInput.PlaceholderText = "FREE_xxxxx"
    keyInput.TextScaled = true
    keyInput.Font = Enum.Font.SourceSans
    keyInput.Parent = frame
    
    local validateButton = Instance.new("TextButton")
    validateButton.Size = UDim2.new(0.4, 0, 0, 40)
    validateButton.Position = UDim2.new(0.1, 0, 0, 120)
    validateButton.BackgroundColor3 = Color3.fromRGB(0, 200, 0)
    validateButton.Text = "Validate"
    validateButton.TextColor3 = Color3.fromRGB(255, 255, 255)
    validateButton.TextScaled = true
    validateButton.Font = Enum.Font.SourceSansBold
    validateButton.Parent = frame
    
    local closeButton = Instance.new("TextButton")
    closeButton.Size = UDim2.new(0.4, 0, 0, 40)
    closeButton.Position = UDim2.new(0.5, 0, 0, 120)
    closeButton.BackgroundColor3 = Color3.fromRGB(200, 0, 0)
    closeButton.Text = "Close"
    closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.SourceSansBold
    closeButton.Parent = frame
    
    local statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, 0, 0, 20)
    statusLabel.Position = UDim2.new(0, 0, 0, 170)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = ""
    statusLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.SourceSans
    statusLabel.Parent = frame
    
    validateButton.MouseButton1Click:Connect(function()
        local key = keyInput.Text
        if key == "" then
            statusLabel.Text = "Please enter a key"
            statusLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
            return
        end
        
        statusLabel.Text = "Validating..."
        statusLabel.TextColor3 = Color3.fromRGB(255, 255, 100)
        
        local result = KeySystem.StorePlayerKey(player, key)
        
        if result.success then
            statusLabel.Text = "Key validated successfully!"
            statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
            
            wait(2)
            screenGui:Destroy()
            KeySystem.GrantPremiumAccess(player)
        else
            statusLabel.Text = result.message or "Invalid key"
            statusLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
        end
    end)
    
    closeButton.MouseButton1Click:Connect(function()
        screenGui:Destroy()
        player:Kick("Key validation required")
    end)
end

-- Connect player events
Players.PlayerAdded:Connect(KeySystem.OnPlayerJoined)

-- Admin commands (for generating keys in-game)
game.Players.PlayerAdded:Connect(function(player)
    player.Chatted:Connect(function(message)
        if player.Name == "YourUsernameHere" then -- Replace with your username
            if message:lower():sub(1, 12) == "/generatekey" then
                local keyName = message:sub(14) or "Admin Generated Key"
                local result = KeySystem.GenerateKey(keyName)
                
                if result.success then
                    local gui = player.PlayerGui:FindFirstChild("KeyResultGUI")
                    if gui then gui:Destroy() end
                    
                    -- Show generated key to admin
                    local screenGui = Instance.new("ScreenGui")
                    screenGui.Name = "KeyResultGUI"
                    screenGui.Parent = player.PlayerGui
                    
                    local frame = Instance.new("Frame")
                    frame.Size = UDim2.new(0, 500, 0, 150)
                    frame.Position = UDim2.new(0.5, -250, 0.5, -75)
                    frame.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
                    frame.Parent = screenGui
                    
                    local keyLabel = Instance.new("TextLabel")
                    keyLabel.Size = UDim2.new(1, 0, 0.6, 0)
                    keyLabel.BackgroundTransparency = 1
                    keyLabel.Text = "Generated Key: " .. result.key
                    keyLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
                    keyLabel.TextScaled = true
                    keyLabel.Font = Enum.Font.SourceSansBold
                    keyLabel.Parent = frame
                    
                    local closeBtn = Instance.new("TextButton")
                    closeBtn.Size = UDim2.new(0.3, 0, 0.3, 0)
                    closeBtn.Position = UDim2.new(0.35, 0, 0.65, 0)
                    closeBtn.BackgroundColor3 = Color3.fromRGB(200, 0, 0)
                    closeBtn.Text = "Close"
                    closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
                    closeBtn.TextScaled = true
                    closeBtn.Parent = frame
                    
                    closeBtn.MouseButton1Click:Connect(function()
                        screenGui:Destroy()
                    end)
                end
            end
        end
    end)
end)

return KeySystem
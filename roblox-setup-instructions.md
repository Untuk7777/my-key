# Roblox Key System Setup Instructions

## Step 1: Enable HTTP Requests in Your Roblox Game

1. Go to your game in Roblox Studio
2. Open Game Settings (File > Game Settings)
3. Go to the "Security" tab
4. Enable "Allow HTTP Requests"
5. Save the settings

## Step 2: Get Your Replit App URL

1. In this Replit project, click the "Deploy" button (if you haven't already)
2. Copy your deployment URL (it will look like: `https://your-app-name.your-username.repl.co`)
3. Keep this URL handy for the next step

## Step 3: Install the Lua Script

1. In Roblox Studio, go to ServerScriptService
2. Create a new Script (not a LocalScript)
3. Copy the contents of `roblox-key-system.lua` into this script
4. Find the line `local API_BASE_URL = "YOUR_REPLIT_URL_HERE"`
5. Replace `YOUR_REPLIT_URL_HERE` with your actual Replit app URL
6. Find the line `if player.Name == "YourUsernameHere"` and replace with your Roblox username

## Step 4: Set Up Player Data (Optional)

If you want to show premium status in leaderstats:

1. Create a script that adds leaderstats to players:

```lua
game.Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player
    
    local premium = Instance.new("StringValue")
    premium.Name = "Premium"
    premium.Value = "None"
    premium.Parent = leaderstats
end)
```

## Step 5: Test the System

1. Start a test server in Roblox Studio
2. Join as a test player
3. You should see a key validation GUI
4. Generate a key using your web interface or the admin command `/generatekey TestKey`
5. Enter the key in the validation GUI

## Admin Commands (In-Game)

As the designated admin (your username), you can use these chat commands:

- `/generatekey MyKeyName` - Generates a new key with the specified name

## API Endpoints for Advanced Integration

Your key system provides these endpoints:

- `POST /api/validate` - Validate a key
  - Body: `{"key": "FREE_abc12"}`
  - Returns: `{"success": true, "valid": true, "message": "Key is valid"}`

- `POST /api/generate` - Generate a new key
  - Body: `{"name": "Optional Key Name"}`
  - Returns: `{"success": true, "key": "FREE_xyz89", "expires": "2024-..."}`

## Key Format

Keys are generated in the format: `FREE_xxxxx` where `xxxxx` is 5 random lowercase letters/numbers.

All keys expire after 24 hours from creation.

## Troubleshooting

1. **HTTP 403 Error**: Make sure HTTP requests are enabled in game settings
2. **Connection Failed**: Check that your Replit app URL is correct and the app is running
3. **Keys Not Working**: Verify the key format is correct (FREE_ prefix with lowercase suffix)
4. **GUI Not Showing**: Make sure the script is in ServerScriptService, not StarterGui

## Customization

You can customize the system by:

- Changing key expiration time in `server/routes.ts`
- Modifying the GUI appearance in the Lua script
- Adding more premium features in the `GrantPremiumAccess` function
- Creating different key types for different access levels
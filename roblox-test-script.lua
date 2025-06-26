-- Roblox Executor Test Script
-- Replace the URL with your deployment URL when deployed

local HttpService = game:GetService("HttpService")

-- PUT YOUR KEY HERE (generate from the web interface)
local key = "FREE-57fe02402c-a90bd899"

-- This will be your deployment URL (replace with actual URL when deployed)
local base = "https://your-deployment-url.replit.app"
-- For local testing (won't work in Roblox due to localhost restrictions)
-- local base = "http://localhost:5000"

local function validateKey(k)
	local url = base .. "/validate?key=" .. k
	local success, response = pcall(function()
		return HttpService:GetAsync(url)
	end)

	if not success then
		print("❌ Failed to validate key: " .. tostring(response))
		return false
	end

	print("🔍 Validation response: " .. response)
	return response:lower():find("valid") ~= nil
end

local function fetchAndRunScript(k)
	local url = base .. "/getscript?key=" .. k
	local success, script = pcall(function()
		return HttpService:GetAsync(url)
	end)

	if success then
		print("✅ Script received successfully!")
		print("📝 Script content preview:")
		print(script:sub(1, 200) .. "...")
		
		-- Execute the script
		local executeSuccess, executeError = pcall(function()
			loadstring(script)()
		end)
		
		if executeSuccess then
			print("🚀 Script executed successfully!")
		else
			print("❌ Script execution failed: " .. tostring(executeError))
		end
	else
		print("❌ Failed to fetch script: " .. tostring(script))
	end
end

-- Main execution
print("🔑 Testing key system...")
print("🔑 Key: " .. key)
print("🌐 Base URL: " .. base)

if validateKey(key) then
	print("✅ Key is valid! Fetching script...")
	fetchAndRunScript(key)
else
	print("❌ Invalid key or key system error")
end
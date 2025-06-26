import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Eye, EyeOff, Copy, AlertTriangle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Key } from "@shared/schema";

export default function Secret() {
  const [location] = useLocation();
  const [showKeys, setShowKeys] = useState(false);
  const [accessAttempts, setAccessAttempts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Key[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { toast } = useToast();

  // Check if someone is trying to access the secret page
  useEffect(() => {
    // Block access unless it's a validation check
    const isValidationCheck = location.includes("check") || location.includes("validate");
    
    if (!isValidationCheck) {
      setAccessAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= 3) {
          // Redirect to home after multiple attempts
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
        return newAttempts;
      });
    }
  }, [location]); // Removed accessAttempts from dependencies to prevent infinite loop

  const { data: allKeys, isLoading } = useQuery({
    queryKey: ["/api/keys"],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/keys/search", {
        query,
        secret: "gT7mA5zP2bW0kQeN81XrL9aFuCjYzTq47KvHdEp3MmNs"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.results || []);
      setIsSearchMode(true);
      toast({
        title: "Search Complete",
        description: `Found ${data.results?.length || 0} key(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Error",
        description: error.message || "Failed to search keys",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Key copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy key to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
  };

  const displayKeys = isSearchMode ? searchResults : (Array.isArray(allKeys) ? allKeys : []);

  // Show blocked message for non-validation access
  if (!location.includes("check") && !location.includes("validate")) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white shadow-xl border-2 border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
            <p className="text-red-600 mb-6">
              This page is restricted. Access blocked.
            </p>
            <p className="text-sm text-gray-500">
              Attempts: {accessAttempts}/3
            </p>
            {accessAttempts >= 2 && (
              <p className="text-xs text-red-500 mt-2">
                Redirecting...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
                <i className="fas fa-user-secret text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-semibold text-white">Secret Key Database</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <i className="fas fa-shield-alt"></i>
              <span>Restricted Access</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6">
            <i className="fas fa-database text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Key Database Search</h2>
          <p className="text-gray-400 mb-6">Search and view generated keys (server-side protected)</p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-6">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by key or name..."
                className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
              />
              <Button
                type="submit"
                disabled={searchMutation.isPending || !searchQuery.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {searchMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setShowKeys(!showKeys)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {showKeys ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Keys
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Keys
                </>
              )}
            </Button>
            
            {isSearchMode && (
              <Button
                onClick={clearSearch}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-slate-700"
              >
                Clear Search
              </Button>
            )}
          </div>
        </div>

        {/* Keys Display */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {isSearchMode ? "Search Results" : "Database Contents"}
              </h3>
              <span className="text-sm text-gray-400">
                {displayKeys.length} key{displayKeys.length === 1 ? '' : 's'} {isSearchMode ? 'found' : 'total'}
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <span className="text-gray-400 mt-2 block">Loading keys...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {displayKeys.length > 0 ? (
                  displayKeys.map((key: Key, index: number) => (
                    <div
                      key={key.id}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-300">
                            #{index + 1}
                          </span>
                          <span className="text-sm text-gray-400">{key.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                            {key.type.toUpperCase()}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(key.key)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="font-mono text-sm bg-slate-900 p-3 rounded border border-slate-600 mb-3">
                        {showKeys ? (
                          <span className="text-green-400">{key.key}</span>
                        ) : (
                          <span className="text-gray-500">
                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <br />
                          <span>{new Date(key.timestamp).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <br />
                          <span className="text-red-400">
                            {new Date(key.expiresAt).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Used:</span>
                          <br />
                          <span>{key.used}/{key.maxUses}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <br />
                          <span className={
                            new Date(key.expiresAt) < new Date() ? "text-red-400" :
                            key.used >= key.maxUses ? "text-orange-400" : "text-green-400"
                          }>
                            {new Date(key.expiresAt) < new Date() ? "Expired" :
                             key.used >= key.maxUses ? "Used" : "Active"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-4 opacity-50"></i>
                    <p>No keys found in database</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
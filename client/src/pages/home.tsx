import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Key } from "@shared/schema";

export default function Home() {
  const [keyName, setKeyName] = useState("");
  const [keyType, setKeyType] = useState("uuid");
  const [keyLength, setKeyLength] = useState(32);
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fileData, isLoading: fileLoading } = useQuery({
    queryKey: ["/api/keys/file"],
  });

  const generateKeyMutation = useMutation({
    mutationFn: async (keyData: { name: string; type: string; length: number }) => {
      const response = await apiRequest("POST", "/api/keys", keyData);
      return response.json();
    },
    onSuccess: (newKey: Key) => {
      setCurrentKey(newKey);
      queryClient.invalidateQueries({ queryKey: ["/api/keys/file"] });
      toast({
        title: "Success!",
        description: "Key generated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    generateKeyMutation.mutate({
      name: keyName || "Unnamed Key",
      type: keyType,
      length: keyType === "custom" ? keyLength : keyType === "uuid" ? 36 : 32,
    });
  };

  const copyToClipboard = async () => {
    if (currentKey) {
      try {
        await navigator.clipboard.writeText(currentKey.key);
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
    }
  };

  const refreshDatabase = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/keys/file"] });
    toast({
      title: "Refreshed!",
      description: "Database refreshed!",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-100 rounded-full opacity-20 animate-pulse-gentle"></div>
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-emerald-100 rounded-full opacity-20 animate-pulse-gentle animate-delay-1s"></div>
        <div className="absolute bottom-10 right-1/3 w-48 h-48 bg-purple-100 rounded-full opacity-20 animate-pulse-gentle animate-delay-2s"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <i className="fas fa-key text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">stupidxxwhn</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <i className="fas fa-key"></i>
              <span>Key Generator</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mb-6 animate-bounce-in">
            <i className="fas fa-plus text-white text-2xl"></i>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Create Your Own Key</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Generate FREE_ prefixed keys that expire in 24 hours.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Key Generation Card */}
          <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-slide-up">
            <CardContent className="p-0">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <i className="fas fa-magic text-blue-600"></i>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Generate New Key</h3>
              </div>

              <form onSubmit={handleGenerateKey} className="space-y-6">
                <div>
                  <Label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name (Optional)
                  </Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Enter a name for your key..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <Label htmlFor="keyType" className="block text-sm font-medium text-gray-700 mb-2">
                    Key Type
                  </Label>
                  <Select value={keyType} onValueChange={setKeyType}>
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uuid">UUID (Recommended)</SelectItem>
                      <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                      <SelectItem value="hex">Hexadecimal</SelectItem>
                      <SelectItem value="custom">Custom Length</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {keyType === "custom" && (
                  <div>
                    <Label htmlFor="keyLength" className="block text-sm font-medium text-gray-700 mb-2">
                      Key Length
                    </Label>
                    <Input
                      id="keyLength"
                      type="number"
                      min="8"
                      max="128"
                      value={keyLength}
                      onChange={(e) => setKeyLength(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={generateKeyMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  {generateKeyMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus-circle mr-2"></i>
                      Generate Key
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Generated Key Display */}
          <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-slide-up animate-delay-200ms">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <i className="fas fa-eye text-emerald-600"></i>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Your Latest Key</h3>
                </div>
                <Button
                  onClick={copyToClipboard}
                  disabled={!currentKey}
                  variant="secondary"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium text-gray-700"
                >
                  <i className="fas fa-copy mr-2"></i>Copy
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                {currentKey ? (
                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{currentKey.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{currentKey.type.toUpperCase()}</span>
                    </div>
                    <div className="font-mono text-sm bg-white p-3 rounded border break-all">
                      {currentKey.key}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <i className="fas fa-key text-4xl mb-4 opacity-50"></i>
                    <p className="text-lg font-medium">No key generated yet</p>
                    <p className="text-sm">Click "Generate Key" to create your first key</p>
                  </div>
                )}
              </div>

              {currentKey && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Generated:</span>
                    <span>{new Date(currentKey.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="text-orange-600 font-medium">
                      {new Date(currentKey.expiresAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{currentKey.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Length:</span>
                    <span>{currentKey.length} characters</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Keys.json Viewer */}
        <Card className="mt-12 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-slide-up animate-delay-400ms">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <i className="fas fa-database text-purple-600"></i>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Keys Database</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">keys.json</span>
                <Button
                  onClick={refreshDatabase}
                  variant="secondary"
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <i className="fas fa-refresh text-gray-600"></i>
                </Button>
              </div>
            </div>

            {/* JSON Display */}
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
                {fileLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <span className="text-gray-400 mt-2 block">Loading...</span>
                  </div>
                ) : (
                  <code dangerouslySetInnerHTML={{
                    __html: JSON.stringify(fileData || { keys: [], metadata: { total_keys: 0, last_generated: null } }, null, 2)
                      .replace(/("keys":|"metadata":|"total_keys":|"last_generated":|"id":|"name":|"key":|"type":|"length":|"timestamp":)/g, '<span class="text-emerald-400">$1</span>')
                      .replace(/(\d+)/g, '<span class="text-purple-400">$1</span>')
                      .replace(/(null)/g, '<span class="text-orange-400">$1</span>')
                      .replace(/(".*?")/g, '<span class="text-yellow-400">$1</span>')
                      .replace(/([{}])/g, '<span class="text-blue-400">$1</span>')
                      .replace(/([[\\]])/g, '<span class="text-yellow-400">$1</span>')
                  }} />
                )}
              </pre>
            </div>

            {/* Database Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-counter text-blue-600"></i>
                  <span className="text-sm font-medium text-blue-700">Total Keys</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {fileData?.metadata?.total_keys || 0}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-clock text-emerald-600"></i>
                  <span className="text-sm font-medium text-emerald-700">Last Generated</span>
                </div>
                <p className="text-sm font-medium text-emerald-900 mt-1">
                  {fileData?.metadata?.last_generated 
                    ? new Date(fileData.metadata.last_generated).toLocaleString() 
                    : "Never"}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-file-alt text-purple-600"></i>
                  <span className="text-sm font-medium text-purple-700">File Size</span>
                </div>
                <p className="text-sm font-medium text-purple-900 mt-1">
                  {Math.round(JSON.stringify(fileData || {}).length / 1024 * 100) / 100} KB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


      </main>
    </div>
  );
}

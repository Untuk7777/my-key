import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default function Validator() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const validateKey = async () => {
    if (!key.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/keys/check/${encodeURIComponent(key)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        message: "Failed to validate key",
        error: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    if (result.error) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    if (result.expired) return <Clock className="h-5 w-5 text-orange-500" />;
    if (result.used) return <XCircle className="h-5 w-5 text-red-500" />;
    if (result.valid) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!result) return "secondary";
    if (result.error) return "secondary";
    if (result.expired) return "secondary";
    if (result.used) return "destructive";
    if (result.valid) return "default";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-2xl pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Key Validator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Check if a key is valid without consuming it
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Validate Key</CardTitle>
            <CardDescription className="text-center">
              Enter a key to check its status (this won't consume the key)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Key to Validate
                </label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="FREE-xxxxxxxxxx-xxxxxxxx"
                  className="font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && validateKey()}
                />
              </div>

              <Button 
                onClick={validateKey} 
                disabled={!key.trim() || loading}
                className="w-full"
              >
                {loading ? "Validating..." : "Check Key"}
              </Button>
            </div>

            {result && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon()}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.message}</span>
                        <Badge variant={getStatusColor()}>
                          {result.valid ? "Valid" : 
                           result.expired ? "Expired" :
                           result.used ? "Used" :
                           result.error ? "Error" : "Invalid"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {result.data && (
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div><strong>Name:</strong> {result.data.name}</div>
                      <div><strong>Created:</strong> {new Date(result.data.created).toLocaleString()}</div>
                      <div><strong>Expires:</strong> {new Date(result.data.expires).toLocaleString()}</div>
                      {result.data.usesRemaining !== undefined && (
                        <div><strong>Uses Remaining:</strong> {result.data.usesRemaining}</div>
                      )}
                    </div>
                  )}

                  {result.valid && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ This key is valid and ready for use
                      </p>
                    </div>
                  )}

                  {result.expired && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        ⏰ This key has expired
                      </p>
                    </div>
                  )}

                  {result.used && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        ❌ This key has already been used
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
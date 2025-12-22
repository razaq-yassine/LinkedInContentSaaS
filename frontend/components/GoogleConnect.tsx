"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";

export function GoogleConnect() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.auth.googleStatus();
      setConnected(response.data.connected);
      setProfileData(response.data.profile_data);
    } catch (error) {
      console.error("Failed to check Google status:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await api.auth.googleLogin();
      const authUrl = response.data.authorization_url;
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("Google connection failed:", error);
      alert(error.response?.data?.detail || "Failed to connect Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#EA4335] rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Gmail Account</h3>
            <p className="text-sm text-gray-600">
              {connected
                ? "Connected - Your Google account is linked"
                : "Connect your Google account"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-[#EA4335] hover:bg-[#C5221F]"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Connecting..." : "Connect Google"}
            </Button>
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
      </div>

      {connected && profileData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-[#EA4335] text-white font-semibold">
                {profileData.name?.[0]?.toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{profileData.name}</p>
              <p className="text-sm text-gray-600">{profileData.email}</p>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
}

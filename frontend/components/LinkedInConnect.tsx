"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { Linkedin, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LinkedInConnect() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.auth.linkedInStatus();
      setConnected(response.data.connected);
      setProfileData(response.data.profile_data);
      setLastSync(response.data.last_sync);
    } catch (error) {
      console.error("Failed to check LinkedIn status:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await api.auth.linkedInConnect();
      const authUrl = response.data.authorization_url;
      
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("LinkedIn connection failed:", error);
      alert(error.response?.data?.detail || "Failed to connect LinkedIn");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your LinkedIn account?")) {
      return;
    }

    setLoading(true);
    try {
      await api.auth.linkedInDisconnect();
      setConnected(false);
      setProfileData(null);
      alert("LinkedIn account disconnected successfully");
    } catch (error: any) {
      console.error("Disconnect failed:", error);
      alert(error.response?.data?.detail || "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPosts = async () => {
    setSyncing(true);
    try {
      const response = await api.auth.linkedInSyncPosts();
      alert(`Successfully synced ${response.data.posts_count} posts!`);
      setLastSync(new Date().toISOString());
    } catch (error: any) {
      console.error("Sync failed:", error);
      alert(error.response?.data?.detail || "Failed to sync posts");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0A66C2] rounded-lg flex items-center justify-center">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">LinkedIn Account</h3>
            <p className="text-sm text-gray-600">
              {connected
                ? "Connected - Access your profile and posts"
                : "Connect to import your profile and posts"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-[#0A66C2] hover:bg-[#004182]"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              {loading ? "Connecting..." : "Connect LinkedIn"}
            </Button>
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
      </div>

      {connected && profileData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12">
              {profileData.picture && (
                <AvatarImage src={profileData.picture} alt={profileData.name || "LinkedIn User"} />
              )}
              <AvatarFallback className="bg-[#0A66C2] text-white font-semibold">
                {profileData.name?.[0]?.toUpperCase() || "L"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{profileData.name}</p>
              <p className="text-sm text-gray-600">{profileData.email}</p>
            </div>
          </div>
          {lastSync && (
            <p className="text-sm text-gray-600">
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {connected && (
        <div className="mt-4 flex gap-3">
          <Button
            onClick={handleSyncPosts}
            disabled={syncing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Posts"}
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={loading}
            variant="destructive"
          >
            Disconnect
          </Button>
        </div>
      )}
    </Card>
  );
}

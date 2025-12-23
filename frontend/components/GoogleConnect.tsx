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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
        setProfileData(data.profile_data);
      }
    } catch (error) {
      console.error("Failed to check Google status:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/connect`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const authUrl = data.authorization_url;
        
        // Open OAuth in popup window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          authUrl,
          'Google OAuth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
        );

        // Listen for OAuth completion message
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'google-oauth-success') {
            popup?.close();
            window.removeEventListener('message', messageListener);
            setLoading(false);
            checkConnectionStatus();
            alert('Google account connected successfully!');
          } else if (event.data.type === 'google-oauth-error') {
            popup?.close();
            window.removeEventListener('message', messageListener);
            setLoading(false);
            alert(event.data.message || 'Failed to connect Google');
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup was blocked
        if (!popup || popup.closed) {
          window.removeEventListener('message', messageListener);
          setLoading(false);
          alert('Popup was blocked. Please allow popups for this site.');
          return;
        }

        // Fallback: Check if popup was closed manually
        const popupCheckInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheckInterval);
            window.removeEventListener('message', messageListener);
            setLoading(false);
          }
        }, 500);
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to connect Google");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Google connection failed:", error);
      alert("Failed to connect Google");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google account?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setConnected(false);
        setProfileData(null);
        alert("Google account disconnected successfully");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to disconnect Google account");
      }
    } catch (error: any) {
      console.error("Disconnect failed:", error);
      alert(error.message || "Failed to disconnect Google account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-[#EA4335] rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">Google Account</h3>
            <p className="text-xs text-gray-600 truncate">
              {connected && profileData
                ? `Connected - ${profileData.email || profileData.name}`
                : "Connect your Google account"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {connected && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-[#EA4335] hover:bg-[#C5221F]"
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              disabled={loading}
              variant="destructive"
              size="sm"
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

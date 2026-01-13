"use client";

import { useState, useEffect } from "react";
import { X, Clock, User, Globe, Server, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ErrorDetail {
  id: string;
  error_type: string;
  category: string;
  severity: string;
  technical_message?: string;
  user_message: string;
  stack_trace?: string;
  request_context?: {
    endpoint?: string;
    method?: string;
    client_ip?: string;
    user_agent?: string;
    query_params?: Record<string, any>;
  };
  user_id?: string;
  session_id?: string;
  environment: string;
  resolution_status: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  details?: Record<string, any>;
  created_at: string;
  related_errors: Array<{
    id: string;
    error_type: string;
    created_at: string;
    severity: string;
  }>;
}

interface Props {
  errorId: string;
  onClose: () => void;
  onResolve: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  error: "bg-orange-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

export default function ErrorDetailModal({ errorId, onClose, onResolve }: Props) {
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "stacktrace" | "context" | "related">("details");

  useEffect(() => {
    async function loadError() {
      try {
        const token = localStorage.getItem("admin_token");
        const response = await fetch(`${API_URL}/api/admin/error-dashboard/detail/${errorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setError(data);
        }
      } catch (err) {
        console.error("Failed to load error details:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadError();
  }, [errorId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl bg-white dark:bg-slate-800 p-8">
          <p className="text-center text-gray-500">Error not found</p>
          <Button onClick={onClose} className="mt-4 mx-auto block">Close</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full mt-2 ${SEVERITY_COLORS[error.severity]}`} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {error.error_type}
                </h2>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  error.resolution_status === "resolved"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : error.resolution_status === "acknowledged"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {error.resolution_status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {error.category} • {error.environment}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(error.created_at)}
                </span>
                <button
                  onClick={() => copyToClipboard(error.id)}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {error.id}
                </button>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-700 px-6">
          <nav className="flex gap-4">
            {[
              { id: "details", label: "Details" },
              { id: "stacktrace", label: "Stack Trace" },
              { id: "context", label: "Request Context" },
              { id: "related", label: `Related (${error.related_errors.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* User Message */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  User Message
                </h3>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                  {error.user_message}
                </p>
              </div>

              {/* Technical Message */}
              {error.technical_message && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Technical Message
                  </h3>
                  <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {error.technical_message}
                  </pre>
                </div>
              )}

              {/* User Info */}
              <div className="grid md:grid-cols-2 gap-4">
                {error.user_id && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">{error.user_id}</p>
                    </div>
                  </div>
                )}
                {error.session_id && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Session ID</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{error.session_id}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {error.details && Object.keys(error.details).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Additional Details
                  </h3>
                  <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Resolution Notes */}
              {error.resolution_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Resolution Notes
                  </h3>
                  <p className="text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    {error.resolution_notes}
                  </p>
                  {error.resolved_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Resolved at {formatDate(error.resolved_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "stacktrace" && (
            <div>
              {error.stack_trace ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(error.stack_trace || "")}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <pre className="text-xs text-gray-900 dark:text-gray-100 bg-gray-900 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
                    {error.stack_trace}
                  </pre>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No stack trace available</p>
              )}
            </div>
          )}

          {activeTab === "context" && (
            <div className="space-y-4">
              {error.request_context ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    {error.request_context.endpoint && (
                      <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Endpoint</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {error.request_context.method} {error.request_context.endpoint}
                        </p>
                      </div>
                    )}
                    {error.request_context.client_ip && (
                      <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Client IP</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {error.request_context.client_ip}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {error.request_context.user_agent && (
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">User Agent</p>
                      <p className="text-sm text-gray-900 dark:text-white break-all">
                        {error.request_context.user_agent}
                      </p>
                    </div>
                  )}
                  
                  {error.request_context.query_params && Object.keys(error.request_context.query_params).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Query Parameters</p>
                      <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(error.request_context.query_params, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">No request context available</p>
              )}
            </div>
          )}

          {activeTab === "related" && (
            <div>
              {error.related_errors.length > 0 ? (
                <div className="space-y-2">
                  {error.related_errors.map((related) => (
                    <div
                      key={related.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[related.severity]}`} />
                        <div>
                          <p className="text-sm font-mono text-gray-900 dark:text-white">
                            {related.id.slice(0, 25)}...
                          </p>
                          <p className="text-xs text-gray-500">{related.error_type}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(related.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No related errors found</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}>
              <Copy className="w-4 h-4 mr-1" />
              Copy JSON
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {error.resolution_status !== "resolved" && (
              <Button onClick={onResolve}>
                <Check className="w-4 h-4 mr-1" />
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [usersRes, rulesRes] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getRules(),
      ]);
      setUsers(usersRes.data);
      setStats({});
      setRules(rulesRes.data);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (key: string, value: string) => {
    try {
      await api.admin.updateRules(key, value);
      alert("Rule updated successfully!");
      setEditingRule(null);
      loadAdminData();
    } catch (error: any) {
      alert("Failed to update: " + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rules">AI Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-blue-600">{stats?.total_users || users.length}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">Completed Onboarding</h3>
              <p className="text-4xl font-bold text-green-600">
                {stats?.completed_onboarding || users.filter(u => u.onboarding_completed).length}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">Posts Generated</h3>
              <p className="text-4xl font-bold text-purple-600">{stats?.total_posts_generated || 0}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">Comments Generated</h3>
              <p className="text-4xl font-bold text-orange-600">{stats?.total_comments_generated || 0}</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name || "Unnamed"}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {user.posts_count} posts • {user.comments_count} comments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.onboarding_completed ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Onboarding
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <div className="space-y-6">
            {rules && Object.entries(rules).map(([key, value]: [string, any]) => (
              <Card key={key} className="p-6">
                <h3 className="font-bold mb-2 capitalize">
                  {key.replace(/_/g, " ")}
                </h3>
                {editingRule === key ? (
                  <div>
                    <Textarea
                      value={value}
                      onChange={(e) =>
                        setRules((prev: any) => ({ ...prev, [key]: e.target.value }))
                      }
                      rows={10}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveRule(key, value)}>Save</Button>
                      <Button variant="outline" onClick={() => setEditingRule(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <pre className="whitespace-pre-wrap text-sm text-slate-600 mb-2 max-h-40 overflow-y-auto">
                      {value}
                    </pre>
                    <Button variant="outline" size="sm" onClick={() => setEditingRule(key)}>
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}



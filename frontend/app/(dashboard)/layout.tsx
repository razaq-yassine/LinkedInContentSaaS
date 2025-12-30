"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationList } from "@/components/ConversationList";
import { 
  PenSquare, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Sparkles,
  MoreVertical,
  CreditCard,
  User
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load conversations
    loadConversations();

    // Listen for new conversations being created
    const handleConversationCreated = () => {
      loadConversations();
    };

    window.addEventListener("conversationCreated", handleConversationCreated);

    return () => {
      window.removeEventListener("conversationCreated", handleConversationCreated);
    };
  }, [router]);

  const loadConversations = async () => {
    try {
      const response = await api.conversations.list();
      setConversations(response.data);
    } catch (error: any) {
      // Only log if it's not a network error (backend might be down)
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error("Failed to load conversations:", error);
      }
      // Silently fail for network errors - backend might not be running
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    router.push("/generate");
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    router.push(`/generate?conversation=${id}`);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.conversations.delete(id);
      setConversations(conversations.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(undefined);
        router.push("/generate");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await api.conversations.updateTitle(id, newTitle);
      setConversations(
        conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  const navItems = [
    { href: "/generate", label: "Copilot", icon: MessageSquare },
    { href: "/post-planning", label: "Posts Planning", icon: Calendar },
    { href: "/comments", label: "Comments", icon: MessageSquare },
    { href: "/context", label: "Profile Context", icon: Sparkles },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F2F0] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-[#E0DFDC] transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-[#E0DFDC]">
            <Link href="/generate" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                <PenSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-black">ContentAI</span>
            </Link>
          </div>

          {/* New Post Button */}
          <div className="px-4 py-4">
            <Button
              onClick={handleNewConversation}
              className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full font-semibold"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              Create a post
            </Button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
            />
          </div>

          {/* Navigation */}
          <div className="border-t border-[#E0DFDC] px-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
                    isActive
                      ? "bg-[#E7F3FF] text-[#0A66C2] font-semibold"
                      : "text-[#666666] hover:bg-[#F3F2F0]"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="border-t border-[#E0DFDC] p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full hover:bg-[#F3F2F0] rounded-lg p-2 transition-colors">
                  <Avatar className="w-10 h-10">
                    {user.linkedin_profile_picture && (
                      <AvatarImage src={user.linkedin_profile_picture} alt={user.name || "User"} />
                    )}
                    <AvatarFallback className="bg-[#0A66C2] text-white font-semibold">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-black truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-[#666666] truncate">
                      {user.email}
                    </p>
                  </div>
                  <MoreVertical className="w-5 h-5 text-[#666666] flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="top"
                className="w-64 bg-white border border-[#E0DFDC] shadow-lg"
                sideOffset={8}
              >
                {/* Profile Header */}
                <div className="px-3 py-3 bg-[#E7F3FF]">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {user.linkedin_profile_picture && (
                        <AvatarImage src={user.linkedin_profile_picture} alt={user.name || "User"} />
                      )}
                      <AvatarFallback className="bg-[#0A66C2] text-white font-semibold text-lg">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-black truncate">
                        {user.name || "User"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator className="bg-[#E0DFDC]" />
                
                {/* Menu Items */}
                <div className="py-1">
                  <DropdownMenuItem 
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F3F2F0] focus:bg-[#F3F2F0]"
                    onClick={() => router.push('/billing')}
                  >
                    <CreditCard className="w-5 h-5 text-black" />
                    <span className="text-base font-medium text-black">Billing</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F3F2F0] focus:bg-[#F3F2F0]"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="w-5 h-5 text-black" />
                    <span className="text-base font-medium text-black">Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-[#E0DFDC] my-1" />
                  
                  <DropdownMenuItem 
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F3F2F0] focus:bg-[#F3F2F0]"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 text-black" />
                    <span className="text-base font-medium text-black">Logout</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-[#E0DFDC] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 sm:p-2 hover:bg-[#F3F2F0] rounded-lg transition-colors"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
        <span className="text-base sm:text-lg font-bold text-black">ContentAI</span>
        <div className="w-8 sm:w-10" />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] pt-14 sm:pt-16 lg:pt-0">{children}</main>
    </div>
  );
}



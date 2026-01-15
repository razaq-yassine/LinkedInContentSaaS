"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationList } from "@/components/ConversationList";
import { ToasterProvider } from "@/components/ui/toaster";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { UpgradeModal } from "@/components/UpgradeModal";
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
  User,
  Moon,
  Sun
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { api } from "@/lib/api-client";
import axios from "axios";
import { AppLoader } from "@/components/AppLoader";
import { initializePushNotifications } from "@/lib/push-notifications";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    // Check maintenance mode first
    const checkMaintenance = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/settings`
        );
        const data = response.data;
        const isMaintenanceMode = data.maintenance_mode === 'true' || data.maintenance_mode === true;

        if (isMaintenanceMode) {
          setMaintenanceMode(true);
          setMaintenanceMessage(data.maintenance_message || '');
          // Clear user session when maintenance mode is active
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      } finally {
        setCheckingMaintenance(false);
      }
    };
    checkMaintenance();

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load conversations and subscription
    loadConversations();
    loadSubscription();

    // Initialize push notifications
    initializePushNotifications().catch((error) => {
      console.error('Failed to initialize push notifications:', error);
    });

    // Listen for new conversations being created
    const handleConversationCreated = () => {
      loadConversations();
    };

    const handleCreditsUpdated = () => {
      loadSubscription();
    };

    window.addEventListener("conversationCreated", handleConversationCreated);
    window.addEventListener("creditsUpdated", handleCreditsUpdated);

    return () => {
      window.removeEventListener("conversationCreated", handleConversationCreated);
      window.removeEventListener("creditsUpdated", handleCreditsUpdated);
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

  const loadSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubscription(response.data);

      // Show upgrade modal for free users on login
      if (response.data.plan === 'free') {
        setShowUpgradeModal(true);
      }
    } catch (error: any) {
      console.error("Failed to load subscription:", error);
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

  // Show loading while checking maintenance
  if (checkingMaintenance) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <AppLoader size="sm" />
      </div>
    );
  }

  // Show maintenance page if maintenance mode is active
  if (maintenanceMode) {
    return <MaintenanceBanner message={maintenanceMessage} variant="fullpage" />;
  }

  if (!user) {
    return null;
  }

  return (
    <ToasterProvider>
      <div className="min-h-screen bg-[#F3F2F0] dark:bg-slate-900 flex">
        {/* Sidebar */}
        <aside
          className={`sidebar-container fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-slate-900 border-r border-[#E0DFDC] dark:border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-[#E0DFDC] dark:border-slate-700 sidebar-expanded-content">
              <div className="flex items-center justify-between gap-2">
                <Link href="/generate" className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="PostInAi"
                    className="h-7 w-auto dark:hidden"
                  />
                  <img
                    src="/logo-dark.png"
                    alt="PostInAi"
                    className="h-7 w-auto hidden dark:block"
                  />
                </Link>
                <div className="flex items-center gap-2">
                  <DarkModeToggleIcon />
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg transition-colors text-[#666666] dark:text-slate-400 hover:bg-[#F3F2F0] dark:hover:bg-slate-800"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* New Post Button */}
            <div className="px-4 py-4 sidebar-expanded-content">
              <Button
                onClick={handleNewConversation}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full font-semibold"
              >
                <PenSquare className="w-4 h-4 mr-2" />
                <span className="sidebar-label">Create a post</span>
              </Button>
            </div>
            {/* Compact New Post Button (icon only) */}
            <div className="px-2 py-4 sidebar-icon-only hidden">
              <Button
                onClick={handleNewConversation}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full font-semibold p-3"
                title="Create a post"
              >
                <PenSquare className="w-5 h-5" />
              </Button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto px-2 py-2 sidebar-expanded-content">
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onRenameConversation={handleRenameConversation}
              />
            </div>

            {/* Navigation */}
            <div className="border-t border-[#E0DFDC] dark:border-slate-700 px-2 py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${isActive
                      ? "bg-[#E7F3FF] dark:bg-slate-800 text-[#0A66C2] dark:text-blue-400 font-semibold"
                      : "text-[#666666] dark:text-slate-400 hover:bg-[#F3F2F0] dark:hover:bg-slate-800"
                      }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm sidebar-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>


            {/* User Profile */}
            <div className="border-t border-[#E0DFDC] dark:border-slate-700 p-4 sidebar-expanded-content">
              {/* Credit Progress Bar */}
              {subscription && (
                <div className="mb-3 px-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {subscription.credits_limit === -1 ? 'Unlimited' : `${Math.round(subscription.credits_remaining * 100) / 100} left`}
                    </span>
                  </div>
                  {subscription.credits_limit !== -1 && (
                    <Progress
                      value={(subscription.credits_remaining / subscription.credits_limit) * 100}
                      className="h-1.5"
                    />
                  )}
                  {subscription.credits_limit === -1 && (
                    <div className="h-1.5 bg-blue-500 rounded-full"></div>
                  )}

                  {/* Upgrade Button for Free Users or Low Credits */}
                  {subscription.credits_limit !== -1 && (subscription.plan === 'free' || subscription.credits_remaining <= 2) && (
                    <button
                      onClick={() => router.push('/billing?tab=plans')}
                      className="w-full mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md hover:scale-105 animate-pulse hover:animate-none"
                    >
                      <Sparkles className="w-3 h-3" />
                      Upgrade Plan
                    </button>
                  )}
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full hover:bg-[#F3F2F0] dark:hover:bg-slate-800 rounded-lg p-2 transition-colors">
                    <Avatar className="w-10 h-10">
                      {user.linkedin_profile_picture && (
                        <AvatarImage src={user.linkedin_profile_picture} alt={user.name || "User"} />
                      )}
                      <AvatarFallback className="bg-[#0A66C2] text-white font-semibold">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-black dark:text-white truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-[#666666] dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <MoreVertical className="w-5 h-5 text-[#666666] dark:text-slate-400 flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="w-64 bg-white dark:bg-slate-800 border border-[#E0DFDC] dark:border-slate-700 shadow-lg"
                  sideOffset={8}
                >
                  {/* Profile Header */}
                  <div className="px-3 py-3 bg-[#E7F3FF] dark:bg-slate-700">
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
                        <p className="text-base font-semibold text-black dark:text-white truncate">
                          {user.name || "User"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-[#E0DFDC] dark:bg-slate-600" />

                  {/* Menu Items */}
                  <div className="py-1">
                    <DropdownMenuItem
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F3F2F0] dark:hover:bg-slate-700 focus:bg-[#F3F2F0] dark:focus:bg-slate-700"
                      onClick={() => router.push('/billing')}
                    >
                      <CreditCard className="w-5 h-5 text-black dark:text-white" />
                      <span className="text-base font-medium text-black dark:text-white">Billing</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F3F2F0] dark:hover:bg-slate-700 focus:bg-[#F3F2F0] dark:focus:bg-slate-700"
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className="w-5 h-5 text-black dark:text-white" />
                      <span className="text-base font-medium text-black dark:text-white">Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-[#E0DFDC] dark:bg-slate-600 my-1" />

                    <DropdownMenuItem
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F3F2F0] dark:hover:bg-slate-700 focus:bg-[#F3F2F0] dark:focus:bg-slate-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 text-black dark:text-white" />
                      <span className="text-base font-medium text-black dark:text-white">Logout</span>
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

        {/* Floating Mobile Menu Button */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/[0.01] dark:bg-slate-800/[0.01] backdrop-blur-md border border-[#E0DFDC]/[0.01] dark:border-slate-700/[0.01] rounded-lg shadow-sm hover:bg-white/20 dark:hover:bg-slate-800/20 transition-all text-black/60 dark:text-white/60"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Main Content */}
        <main className="main-content flex-1 lg:ml-[280px] pt-4 lg:pt-0 dark:bg-slate-900">{children}</main>

        {/* Upgrade Modal for Free Users */}
        {subscription && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            userPlan={subscription.plan}
            creditsRemaining={subscription.credits_remaining || 0}
          />
        )}
      </div>
    </ToasterProvider>
  );
}

function DarkModeToggleIcon() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg transition-colors text-[#666666] dark:text-slate-400 hover:bg-[#F3F2F0] dark:hover:bg-slate-800"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}

function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 w-full text-[#666666] dark:text-slate-400 hover:bg-[#F3F2F0] dark:hover:bg-slate-800"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
      <span className="text-sm sidebar-label">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <DashboardContent>{children}</DashboardContent>
    </ThemeProvider>
  );
}
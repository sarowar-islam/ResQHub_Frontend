import { useState } from "react";
import {
  Menu, X, Bell, Search, ChevronDown, LogOut, Settings,
  Shield, MessageCircle, AlertTriangle, Info, CheckCircle
} from "lucide-react";
import { Notification } from "../data/mockData";
import AIChat from "./AIChat";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PortalLayoutProps {
  navItems: NavItem[];
  activePage: string;
  onNavigate: (page: string) => void;
  userName: string;
  userRole: string;
  userInitials: string;
  portalLabel: string;
  onLogout: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  children: React.ReactNode;
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "alert") return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (type === "mission") return <CheckCircle className="w-3.5 h-3.5 text-teal-600" />;
  if (type === "update") return <Info className="w-3.5 h-3.5 text-blue-500" />;
  return <Bell className="w-3.5 h-3.5 text-gray-400" />;
}

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PortalLayout({
  navItems, activePage, onNavigate,
  userName, userRole, userInitials, portalLabel,
  onLogout, notifications, onMarkRead, children,
}: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const activeItem = navItems.find(n => n.id === activePage);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f4f8" }}>
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#1e3a5f" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>RescueNet</p>
            <p className="text-[10px] text-blue-300 mt-0.5">{portalLabel}</p>
          </div>
          <button className="ml-auto lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left
                  ${isActive
                    ? "bg-white/15 text-white font-semibold"
                    : "text-blue-200 hover:bg-white/8 hover:text-white"
                  }`}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-white" : "text-blue-300"}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName.split(" ").slice(0, 2).join(" ")}</p>
              <p className="text-[10px] text-blue-300 capitalize">{userRole}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shadow-sm">
          {/* Hamburger */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 hidden sm:block">{portalLabel}</span>
            {activeItem && (
              <>
                <span className="text-gray-300 hidden sm:block">/</span>
                <span className="font-semibold text-[#0f1b2d]">{activeItem.label}</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52 focus-within:border-[#1e3a5f] focus-within:ring-2 focus-within:ring-[#1e3a5f]/10 transition-all">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search..."
              className="text-xs bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 w-full"
            />
          </div>

          {/* AI button */}
          <button
            onClick={() => setAiOpen(v => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${aiOpen ? "bg-[#1e3a5f] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            title="AI Assistant"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${notifOpen ? "bg-[#1e3a5f] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {notifOpen && (
              <div className="absolute top-11 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-bold text-[#0f1b2d]">Notifications</span>
                  {unread > 0 && (
                    <span className="text-xs text-teal-600 font-medium">{unread} unread</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => onMarkRead(n.id)}
                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          n.type === "alert" ? "bg-red-100" :
                          n.type === "mission" ? "bg-teal-100" :
                          n.type === "update" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <NotifIcon type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0f1b2d] flex items-center gap-1.5">
                            {n.title}
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100">
                  <button
                    onClick={() => { notifications.forEach(n => onMarkRead(n.id)); }}
                    className="text-xs text-[#0d9488] font-medium hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute top-11 right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1.5">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-semibold text-[#0f1b2d]">{userName.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{userRole}</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); onNavigate("profile"); }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" /> Profile & Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* AI Chat */}
      <AIChat isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Click-outside to close panels */}
      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}
    </div>
  );
}

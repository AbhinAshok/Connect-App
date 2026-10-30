import React from 'react';
import { PhoneCall, Calendar, Star, Headphones, Shield, Sparkles, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: any;
  onTogglePremium: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onTogglePremium,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('random-call')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                Friend Connect
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                v1.0 MVP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('random-call')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'random-call'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Random Call</span>
            </button>

            <button
              onClick={() => setCurrentTab('events')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'events'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events & Tickets</span>
            </button>

            <button
              onClick={() => setCurrentTab('celebrities')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'celebrities'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Celebrities</span>
            </button>

            <button
              onClick={() => setCurrentTab('support')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'support'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Helpdesk</span>
            </button>

            {/* Special Role Tabs — shown only if the logged-in user has that role */}
            {currentUser?.role === 'ORGANIZATION' && (
              <button
                onClick={() => setCurrentTab('organization')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'organization'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>🏢 Org Portal</span>
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span>Super Admin</span>
              </button>
            )}
          </nav>

          {/* Right side: user info + actions */}
          <div className="flex items-center space-x-3">
            {/* Premium Toggle */}
            <button
              onClick={onTogglePremium}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                currentUser?.isPremium
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Toggle Premium membership"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentUser?.isPremium ? 'PRO PASS' : 'Go Pro'}</span>
            </button>

            {/* User avatar + name chip */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full bg-slate-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-xs font-bold">
                    {currentUser?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="text-slate-200 text-xs font-semibold max-w-[90px] truncate">
                  {currentUser?.name}
                </span>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
                  {currentUser?.role}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-slate-700 hover:border-red-400/30 transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

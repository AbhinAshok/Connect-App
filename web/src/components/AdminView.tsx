import React, { useState, useEffect } from 'react';
import { Shield, Users, PhoneCall, DollarSign, CheckCircle2, Ban, Sparkles } from 'lucide-react';

interface AdminViewProps {
  currentUser: any;
  allUsers: any[];
  onRefreshUsers: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, allUsers, onRefreshUsers }) => {
  const [stats, setStats] = useState<any | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [allUsers]);

  const toggleBan = async (userId: string, currentBanned: boolean) => {
    try {
      await fetch(`http://localhost:4000/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !currentBanned }),
      });
      onRefreshUsers();
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleVerify = async (userId: string, currentVerified: boolean) => {
    try {
      await fetch(`http://localhost:4000/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !currentVerified }),
      });
      onRefreshUsers();
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePremium = async (userId: string, currentPremium: boolean) => {
    try {
      await fetch(`http://localhost:4000/api/admin/users/${userId}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !currentPremium }),
      });
      onRefreshUsers();
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Super Admin <span className="text-red-400">Control Center</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          മൊത്തം പ്ലാറ്റ്‌ഫോം നിയന്ത്രണം, ഉപയോക്തൃ മോഡറേഷൻ, വരുമാന റിപ്പോർട്ടുകൾ.
        </p>
      </div>

      {/* Analytics KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{stats.users.total}</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.users.celebrities} Celebrities • {stats.users.organizations} Orgs
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Live Voice Calls</span>
              <PhoneCall className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{stats.liveActivity.activeAudioCalls}</div>
            <div className="text-xs text-slate-500 mt-1">
              Queue: {stats.liveActivity.matchmakingQueue} waiting
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Tickets Booked</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{stats.events.ticketsSold}</div>
            <div className="text-xs text-slate-500 mt-1">Across {stats.events.totalEvents} events</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">₹{stats.events.totalTicketRevenue}</div>
            <div className="text-xs text-slate-500 mt-1">Direct Platform Sales</div>
          </div>
        </div>
      )}

      {/* User Governance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">User Moderation & Access Control</h3>
          <span className="text-xs text-slate-400">{allUsers.length} Registered Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Phone</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {allUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-5 flex items-center space-x-3">
                    <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
                    <div>
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span>{u.name}</span>
                        {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {u.isPremium && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-5 font-mono text-slate-300">{u.phone}</td>

                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-5">
                    {u.isBanned ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                        BANNED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right space-x-2">
                    <button
                      onClick={() => toggleVerify(u.id, !!u.isVerified)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        u.isVerified
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {u.isVerified ? 'Unverify' : 'Verify'}
                    </button>

                    <button
                      onClick={() => togglePremium(u.id, !!u.isPremium)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        u.isPremium
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {u.isPremium ? 'Revoke VIP' : 'Grant VIP'}
                    </button>

                    <button
                      onClick={() => toggleBan(u.id, !!u.isBanned)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        u.isBanned
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30'
                      }`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban User'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

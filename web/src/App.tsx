import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { RandomCallView } from './components/RandomCallView';
import { EventsView } from './components/EventsView';
import { CelebrityView } from './components/CelebrityView';
import { SupportView } from './components/SupportView';
import { OrganizationView } from './components/OrganizationView';
import { AdminView } from './components/AdminView';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('random-call');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Fetch initial users from backend
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/users');
      const data = await res.json();
      setAllUsers(data);
      if (!currentUser && data.length > 0) {
        // Default to a normal user
        const defaultUser = data.find((u: any) => u.role === 'USER') || data[0];
        setCurrentUser(defaultUser);
      }
    } catch (e) {
      console.error('Failed to load users from backend:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    const s = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('Connected to backend Socket.io server with ID:', s.id);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Register user on socket when currentUser changes
  useEffect(() => {
    if (socket && currentUser) {
      socket.emit('register-user', { userId: currentUser.id });
    }
  }, [socket, currentUser]);

  const handleSwitchUser = (user: any) => {
    setCurrentUser(user);
    if (user.role === 'ORGANIZATION') setCurrentTab('organization');
    else if (user.role === 'ADMIN') setCurrentTab('admin');
  };

  const handleTogglePremium = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${currentUser.id}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !currentUser.isPremium }),
      });
      const updated = await res.json();
      setCurrentUser(updated);
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onTogglePremium={handleTogglePremium}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'random-call' && (
          <RandomCallView socket={socket} currentUser={currentUser} />
        )}
        {currentTab === 'events' && (
          <EventsView currentUser={currentUser} />
        )}
        {currentTab === 'celebrities' && (
          <CelebrityView
            socket={socket}
            currentUser={currentUser}
            onUpgradeToPremium={handleTogglePremium}
          />
        )}
        {currentTab === 'support' && (
          <SupportView socket={socket} currentUser={currentUser} />
        )}
        {currentTab === 'organization' && (
          <OrganizationView currentUser={currentUser} />
        )}
        {currentTab === 'admin' && (
          <AdminView
            currentUser={currentUser}
            allUsers={allUsers}
            onRefreshUsers={fetchUsers}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>Friend Connect Platform © 2026 • Realtime WebRTC & Location-Aware Microservices</p>
      </footer>
    </div>
  );
}

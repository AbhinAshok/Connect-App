import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { RandomCallView } from './components/RandomCallView';
import { EventsView } from './components/EventsView';
import { CelebrityView } from './components/CelebrityView';
import { SupportView } from './components/SupportView';
import { OrganizationView } from './components/OrganizationView';
import { AdminView } from './components/AdminView';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';

type AuthState = 'loading' | 'unauthenticated' | 'signup' | 'authenticated';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('random-call');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // --- Signup pending state ---
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  // On mount: check for stored JWT session
  useEffect(() => {
    const storedToken = localStorage.getItem('fc_token');
    const storedUser = localStorage.getItem('fc_user');
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setAuthToken(storedToken);
        setAuthState('authenticated');
      } catch {
        localStorage.removeItem('fc_token');
        localStorage.removeItem('fc_user');
        setAuthState('unauthenticated');
      }
    } else {
      setAuthState('unauthenticated');
    }
  }, []);

  // Fetch all users (for admin view & role switching) once authenticated
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (e) {
      console.error('Failed to load users from backend:', e);
    }
  };

  useEffect(() => {
    if (authState === 'authenticated') {
      fetchUsers();
    }
  }, [authState]);

  // Initialize Socket.io connection after authentication
  useEffect(() => {
    if (authState !== 'authenticated') return;

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
  }, [authState]);

  // Register user on socket when currentUser changes
  useEffect(() => {
    if (socket && currentUser) {
      socket.emit('register-user', { userId: currentUser.id });
    }
  }, [socket, currentUser]);

  // ---- Auth Handlers ----
  const persistSession = (user: any, token: string) => {
    localStorage.setItem('fc_token', token);
    localStorage.setItem('fc_user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthToken(token);
    setAuthState('authenticated');
    // Reset tab based on role
    if (user.role === 'ORGANIZATION') setCurrentTab('organization');
    else if (user.role === 'ADMIN') setCurrentTab('admin');
    else setCurrentTab('random-call');
  };

  const handleLoginSuccess = (user: any, token: string) => {
    persistSession(user, token);
  };

  const handleNewUser = (phone: string, token: string, user: any) => {
    setPendingPhone(phone);
    setPendingToken(token);
    setPendingUser(user);
    setAuthState('signup');
  };

  const handleSignupComplete = (user: any, token: string) => {
    persistSession(user, token);
  };

  const handleLogout = () => {
    localStorage.removeItem('fc_token');
    localStorage.removeItem('fc_user');
    setCurrentUser(null);
    setAuthToken(null);
    setAllUsers([]);
    setSocket((prev) => { prev?.disconnect(); return null; });
    setAuthState('unauthenticated');
  };

  // ---- In-App Actions ----
  const handleSwitchUser = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('fc_user', JSON.stringify(user));
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
      localStorage.setItem('fc_user', JSON.stringify(updated));
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  // ---- Render ----
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center animate-pulse">
            <span className="text-white text-xl">🔗</span>
          </div>
          <p className="text-slate-500 text-sm animate-pulse">Loading Friend Connect…</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onNewUser={handleNewUser} />;
  }

  if (authState === 'signup') {
    return (
      <SignupPage
        phone={pendingPhone}
        token={pendingToken}
        initialUser={pendingUser}
        onSignupComplete={handleSignupComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onTogglePremium={handleTogglePremium}
        onLogout={handleLogout}
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
        <p>Friend Connect Platform © 2026 • Realtime WebRTC &amp; Location-Aware Microservices</p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Headphones, Send, PhoneCall, CheckCircle2, MessageSquare, PhoneOff } from 'lucide-react';

interface SupportViewProps {
  socket: Socket | null;
  currentUser: any;
}

export const SupportView: React.FC<SupportViewProps> = ({ socket, currentUser }) => {
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInSupportCall, setIsInSupportCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const timerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize or fetch support ticket
  const startOrGetTicket = async () => {
    if (!currentUser) return;
    try {
      // Check existing ticket
      const res = await fetch(`http://localhost:4000/api/support/tickets?userId=${currentUser.id}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setActiveTicket(data[0]);
        loadMessages(data[0].id);
      } else {
        // Create new ticket
        const createRes = await fetch('http://localhost:4000/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            subject: 'Customer Assistance & General Queries',
          }),
        });
        const newTicket = await createRes.json();
        setActiveTicket(newTicket);
        loadMessages(newTicket.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/support/tickets/${ticketId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    startOrGetTicket();
  }, [currentUser]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket || !activeTicket) return;

    socket.on(`support-ticket-${activeTicket.id}-msg`, (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off(`support-ticket-${activeTicket.id}-msg`);
    };
  }, [socket, activeTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Support call timer
  useEffect(() => {
    if (isInSupportCall) {
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInSupportCall]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeTicket || !currentUser) return;

    const text = inputMessage.trim();
    setInputMessage('');

    if (socket) {
      socket.emit('support-send-message', {
        ticketId: activeTicket.id,
        senderId: currentUser.id,
        message: text,
      });
    }

    // Agent automatic simulated reply after 1.5 seconds if agent hasn't replied
    setTimeout(() => {
      if (socket) {
        socket.emit('support-send-message', {
          ticketId: activeTicket.id,
          senderId: 'usr_support_1',
          message: 'Thank you for reaching out! A support representative is on this case.',
        });
      }
    }, 1500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Customer Care <span className="text-emerald-400">Helpdesk</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            24/7 തത്സമയ സപ്പോർട്ട്. ചാറ്റ് ചെയ്യുകയോ അല്ലെങ്കിൽ നേരിട്ട് ഇൻ-ആപ്പ് ഓഡിയോ കോൾ ചെയ്യുകയോ ചെയ്യാം.
          </p>
        </div>

        {/* Live Audio Call Button */}
        {!isInSupportCall ? (
          <button
            onClick={() => setIsInSupportCall(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all self-start sm:self-auto"
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>Call Customer Care</span>
          </button>
        ) : (
          <div className="flex items-center space-x-3 bg-slate-900 border border-emerald-500/40 px-4 py-2 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold">LIVE CALL • {formatTimer(callDuration)}</span>
            <button
              onClick={() => setIsInSupportCall(false)}
              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="bg-slate-800/80 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Friend Connect Support Desk</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs text-slate-400">
                Ticket #{activeTicket?.id || 'TICK-101'} • Logged as {currentUser?.name} ({currentUser?.role})
              </span>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isMe = m.senderId === currentUser?.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-1 px-1">
                  {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-800/60 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message or issue..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all font-bold"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

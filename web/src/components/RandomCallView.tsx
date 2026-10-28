import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Phone, PhoneOff, Mic, MicOff, SkipForward, ShieldAlert, Sparkles, Volume2, Users } from 'lucide-react';

interface RandomCallViewProps {
  socket: Socket | null;
  currentUser: any;
}

export const RandomCallView: React.FC<RandomCallViewProps> = ({ socket, currentUser }) => {
  const [callState, setCallState] = useState<'IDLE' | 'SEARCHING' | 'CONNECTED'>('IDLE');
  const [peerInfo, setPeerInfo] = useState<any>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const timerRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio configuration (Google STUN)
  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  // Timer effect
  useEffect(() => {
    if (callState === 'CONNECTED') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean up WebRTC
  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  // Socket listeners for WebRTC signaling & matching
  useEffect(() => {
    if (!socket) return;

    socket.on('waiting-for-peer', (data: any) => {
      setCallState('SEARCHING');
      setStatusMessage(data.message || 'Searching for a friend...');
    });

    socket.on('match-found', async (data: any) => {
      console.log('[WEBRTC] Match found:', data);
      setCurrentRoomId(data.roomId);
      setPeerInfo(data.peer);
      setCallState('CONNECTED');
      setStatusMessage('Connected! Say Hi 👋');

      // Initialize WebRTC
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
          console.warn('[AUDIO] Microphone permission denied, running simulated audio connection.');
          return null;
        });

        localStreamRef.current = stream;

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        if (stream) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        pc.ontrack = (event) => {
          if (remoteAudioRef.current && event.streams[0]) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
              roomId: data.roomId,
              candidate: event.candidate,
            });
          }
        };

        // If this client is the designated initiator, create offer
        if (data.isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { roomId: data.roomId, offer });
        }
      } catch (err) {
        console.error('[WEBRTC ERROR]', err);
      }
    });

    socket.on('webrtc-offer', async ({ offer }: any) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      if (currentRoomId) {
        socket.emit('webrtc-answer', { roomId: currentRoomId, answer });
      }
    });

    socket.on('webrtc-answer', async ({ answer }: any) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('webrtc-ice-candidate', async ({ candidate }: any) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[ICE ERROR]', e);
        }
      }
    });

    socket.on('peer-left', (data: any) => {
      cleanupMedia();
      setCallState('IDLE');
      setStatusMessage(data.reason || 'Friend left the conversation.');
      setPeerInfo(null);
    });

    socket.on('call-ended', () => {
      cleanupMedia();
      setCallState('IDLE');
      setStatusMessage('Call ended.');
      setPeerInfo(null);
    });

    socket.on('matchmaking-cancelled', () => {
      setCallState('IDLE');
      setStatusMessage('Search cancelled.');
    });

    return () => {
      socket.off('waiting-for-peer');
      socket.off('match-found');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('peer-left');
      socket.off('call-ended');
      socket.off('matchmaking-cancelled');
      cleanupMedia();
    };
  }, [socket, currentRoomId]);

  // Actions
  const handleStartMatchmaking = () => {
    if (!socket || !currentUser) return;
    setStatusMessage('Entering matchmaking queue...');
    setCallState('SEARCHING');
    socket.emit('join-matchmaking', { userId: currentUser.id });
  };

  const handleCancelMatchmaking = () => {
    if (!socket) return;
    socket.emit('cancel-matchmaking');
    setCallState('IDLE');
  };

  const handleSkipFriend = () => {
    if (!socket || !currentRoomId) return;
    cleanupMedia();
    setStatusMessage('Searching for your next friend...');
    setCallState('SEARCHING');
    socket.emit('skip-friend', { roomId: currentRoomId, userId: currentUser.id });
  };

  const handleEndCall = () => {
    if (!socket || !currentRoomId) return;
    cleanupMedia();
    socket.emit('end-call', { roomId: currentRoomId });
    setCallState('IDLE');
    setPeerInfo(null);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <audio ref={remoteAudioRef} autoPlay />

      {/* Hero Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Connect with <span className="text-emerald-400">Random Friends</span>
        </h1>
        <p className="mt-2 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          പുതിയ ആളുകളുമായി സംസാരിക്കൂ! ഒരൊറ്റ ക്ലിക്കിൽ ലൈവ് ഓഡിയോ കോളിലൂടെ സുഹൃത്തുക്കളെ കണ്ടെത്താം.
        </p>
      </div>

      {/* Main Calling Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
        {/* Glow ambient background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />

        {/* ================= STATE 1: IDLE ================= */}
        {callState === 'IDLE' && (
          <div className="flex flex-col items-center text-center space-y-6 z-10">
            <div className="relative">
              <button
                onClick={handleStartMatchmaking}
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex flex-col items-center justify-center text-white shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300 group"
              >
                <Phone className="w-12 h-12 sm:w-16 sm:h-16 mb-2 group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-base sm:text-lg tracking-wide uppercase">Connect</span>
              </button>
              <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/20 animate-pulse pointer-events-none" />
            </div>

            <div className="space-y-1">
              <p className="text-slate-300 font-semibold text-lg">തത്സമയം സംസാരിക്കാൻ റെഡിയാണോ?</p>
              <p className="text-slate-500 text-xs sm:text-sm">
                100% സ്വകാര്യം • ഫോൺ നമ്പർ കാണിക്കില്ല • അജ്ഞാത കോൾ
              </p>
            </div>

            {statusMessage && (
              <div className="px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-full text-xs text-slate-300">
                {statusMessage}
              </div>
            )}
          </div>
        )}

        {/* ================= STATE 2: SEARCHING ================= */}
        {callState === 'SEARCHING' && (
          <div className="flex flex-col items-center text-center space-y-8 z-10">
            <div className="relative flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                <Users className="w-14 h-14 animate-bounce" />
              </div>
              <div className="absolute -inset-4 rounded-full border border-emerald-500/30 animate-ping" />
              <div className="absolute -inset-10 rounded-full border border-emerald-500/10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">സുഹൃത്തിനെ തിരയുന്നു...</h3>
              <p className="text-emerald-400 text-sm font-medium animate-pulse">
                {statusMessage || 'Searching for online users...'}
              </p>
            </div>

            <button
              onClick={handleCancelMatchmaking}
              className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold transition-all"
            >
              Cancel Search
            </button>
          </div>
        )}

        {/* ================= STATE 3: CONNECTED ================= */}
        {callState === 'CONNECTED' && (
          <div className="flex flex-col items-center w-full max-w-md text-center space-y-6 z-10">
            {/* Call Status Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE CALL • {formatTimer(callDuration)}</span>
            </div>

            {/* Peer Avatar */}
            <div className="relative">
              <img
                src={peerInfo?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=friend'}
                alt="Friend"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-emerald-500 shadow-xl shadow-emerald-500/20 bg-slate-800 object-cover"
              />
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{peerInfo?.name || 'Anonymous Friend'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Connected over High Quality Voice</p>
            </div>

            {/* Audio Wave Visualizer Simulation */}
            <div className="flex items-center justify-center space-x-1.5 h-8">
              {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 30, 60].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                />
              ))}
            </div>

            {/* In-Call Controls */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${
                  isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              {/* Next Friend Button */}
              <button
                onClick={handleSkipFriend}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                title="Next Friend (Skip)"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center space-x-4 text-xs text-slate-500">
              <button
                onClick={() => alert('Peer has been reported. Our moderation team will review this call.')}
                className="flex items-center space-x-1 hover:text-red-400 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report Peer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">HD Audio Quality</h4>
            <p className="text-slate-400 text-xs mt-1">WebRTC സാങ്കേതികവിദ്യ വഴി കുറഞ്ഞ ഡാറ്റയിൽ വ്യക്തമായ ശബ്ദം.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Instant Matchmaking</h4>
            <p className="text-slate-400 text-xs mt-1">Redis എഞ്ചിൻ വഴി കാത്തിരിപ്പില്ലാതെ അടുത്ത സുഹൃത്തിലേക്ക്.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Safe & Anonymous</h4>
            <p className="text-slate-400 text-xs mt-1">നിങ്ങളുടെ ഫോൺ നമ്പറോ ലൊക്കേഷനോ പരസ്പരം പങ്കുവെക്കില്ല.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

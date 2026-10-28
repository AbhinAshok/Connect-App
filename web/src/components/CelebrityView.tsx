import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Phone, Video, CheckCircle2, Lock, Sparkles, Image, ShieldAlert, X } from 'lucide-react';

interface CelebrityViewProps {
  socket: Socket | null;
  currentUser: any;
  onUpgradeToPremium: () => void;
}

export const CelebrityView: React.FC<CelebrityViewProps> = ({
  socket,
  currentUser,
  onUpgradeToPremium,
}) => {
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [callingCeleb, setCallingCeleb] = useState<any | null>(null);
  const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const [callStatus, setCallStatus] = useState<string>('Ringing...');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Celebrity management state (for celebrity user role)
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');

  const fetchCelebrities = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/celebrities');
      const data = await res.json();
      setCelebrities(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCelebrities();
  }, []);

  const handleInitiateCall = (celeb: any, type: 'AUDIO' | 'VIDEO') => {
    if (!currentUser.isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!celeb.profile.isAvailableForCalls) {
      alert(`${celeb.profile.stageName} is currently unavailable for calls.`);
      return;
    }

    setCallingCeleb(celeb);
    setCallType(type);
    setCallStatus('Connecting call to celebrity...');

    // Emit call request over socket
    if (socket) {
      socket.emit('direct-call-request', {
        callerId: currentUser.id,
        calleeId: celeb.user.id,
        callType: type === 'AUDIO' ? 'CELEBRITY_AUDIO' : 'CELEBRITY_VIDEO',
      });
    }

    // Auto simulate acceptance for interactive preview
    setTimeout(() => {
      setCallStatus('Call Connected! Audio/Video streaming live 🌟');
    }, 2500);
  };

  const handlePostMedia = async () => {
    if (!newPostUrl) return;
    try {
      const res = await fetch(`http://localhost:4000/api/celebrities/${currentUser.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IMAGE',
          url: newPostUrl,
          caption: newPostCaption,
        }),
      });
      if (res.ok) {
        setNewPostUrl('');
        setNewPostCaption('');
        fetchCelebrities();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isCelebrityUser = currentUser?.role === 'CELEBRITY';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Connect with <span className="text-amber-400">Celebrities</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            താരങ്ങളുമായി നേരിട്ട് സംസാരിക്കൂ! ലൈവ് വോയ്‌സ് & വീഡിയോ കോളുകൾ (Premium Only).
          </p>
        </div>

        {!currentUser?.isPremium && (
          <button
            onClick={onUpgradeToPremium}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Unlock Celebrity Calls</span>
          </button>
        )}
      </div>

      {/* Celebrity Mode Post Creator (If logged in as Celebrity) */}
      {isCelebrityUser && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Celebrity Dashboard: Post to your Fan Feed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Image or Video URL (e.g. Unsplash URL)"
              value={newPostUrl}
              onChange={(e) => setNewPostUrl(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
            <input
              type="text"
              placeholder="Caption for your fans..."
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={handlePostMedia}
            className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
          >
            Publish Post
          </button>
        </div>
      )}

      {/* Celebrities List */}
      <div className="space-y-8">
        {celebrities.map(({ user, profile }) => (
          <div
            key={user.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
          >
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-400/20"
                  />
                  {profile.isAvailableForCalls ? (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                      Online
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                      Busy
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{profile.stageName}</h2>
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">{profile.category}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">{user.bio}</p>
                </div>
              </div>

              {/* Call Rate Card & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center space-x-4 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80 text-xs">
                  <div>
                    <span className="text-slate-400 block">Audio Call</span>
                    <span className="text-white font-extrabold text-sm">₹{profile.audioRatePerMinute}/min</span>
                  </div>
                  <div className="h-6 w-px bg-slate-700" />
                  <div>
                    <span className="text-slate-400 block">Video Call</span>
                    <span className="text-white font-extrabold text-sm">₹{profile.videoRatePerMinute}/min</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleInitiateCall({ user, profile }, 'AUDIO')}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Voice Call</span>
                  </button>

                  <button
                    onClick={() => handleInitiateCall({ user, profile }, 'VIDEO')}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Call</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Media Gallery / Feed */}
            <div className="pt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Recent Posts & Behind the Scenes
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profile.media.map((item: any) => (
                  <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-slate-800 aspect-square">
                    <img
                      src={item.url}
                      alt={item.caption || 'Media'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.caption && (
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                        <p className="text-[11px] text-white line-clamp-2">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade to Premium Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white">Premium Feature</h3>
            <p className="text-xs text-slate-400 mt-2">
              സെലിബ്രിറ്റികളുമായി നേരിട്ട് ഓഡിയോ/വീഡിയോ കോളുകൾ ചെയ്യാൻ പ്രീമിയം പാസ്സ് ആവശ്യമാണ്.
            </p>

            <div className="my-6 p-4 bg-slate-800 rounded-2xl text-left border border-slate-700">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Friend Connect VIP Pass</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">അൺലിമിറ്റഡ് ആക്സസ്സ് • ഡയറക്ട് സെലിബ്രിറ്റി കോളിംഗ്</p>
              <div className="mt-3 text-lg font-black text-amber-400">₹199 / മാസം</div>
            </div>

            <button
              onClick={() => {
                onUpgradeToPremium();
                setShowUpgradeModal(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 transition-all"
            >
              Activate VIP Pass Now
            </button>
          </div>
        </div>
      )}

      {/* Ongoing Celebrity Call Simulation Modal */}
      {callingCeleb && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl relative flex flex-col items-center">
            <img
              src={callingCeleb.user.avatarUrl}
              alt="Celeb"
              className="w-28 h-28 rounded-full border-4 border-amber-400 shadow-xl object-cover animate-pulse"
            />
            <h3 className="text-xl font-bold text-white mt-4">{callingCeleb.profile.stageName}</h3>
            <p className="text-xs text-amber-400 font-semibold">{callType} CALL</p>
            <p className="text-xs text-slate-400 mt-2 font-mono">{callStatus}</p>

            <button
              onClick={() => setCallingCeleb(null)}
              className="mt-8 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Building2, Plus, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrganizationViewProps {
  currentUser: any;
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('9.9816');
  const [longitude, setLongitude] = useState('76.2999');
  const [ticketPrice, setTicketPrice] = useState('499');

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/events');
      const data = await res.json();
      setEvents(data.filter((e: any) => e.organizationId === currentUser.id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentUser]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentUser.id,
          title,
          description,
          bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
          category: 'Music & Concerts',
          locationName,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 5 + 18000000).toISOString(),
          ticketTiers: [
            {
              id: 'tier_standard',
              name: 'Standard Entry',
              price: parseFloat(ticketPrice),
              currency: 'INR',
              availableQuantity: 300,
              totalQuantity: 300,
            },
          ],
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyTicket = async () => {
    if (!verifyToken) return;
    try {
      const res = await fetch('http://localhost:4000/api/events/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeToken: verifyToken.trim(),
          orgId: currentUser.id,
        }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Organization <span className="text-purple-400">Management Portal</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ഇവന്റുകൾ പോസ്റ്റ് ചെയ്യാനും, ടിക്കറ്റ് സെയിൽസ് ട്രാക്ക് ചെയ്യാനും, ഗേറ്റിൽ QR ടിക്കറ്റ് ചെക്ക്-ഇൻ നടത്താനും.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* Ticket Scanner / Check-in Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex items-center space-x-2 text-purple-400 text-sm font-bold uppercase tracking-wider mb-4">
          <QrCode className="w-5 h-5" />
          <span>Event Gate: QR Code Ticket Scanner</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter or scan ticket token (e.g. TKT-XXXXXXXXXXXX)"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-400"
          />
          <button
            onClick={handleVerifyTicket}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all"
          >
            Verify & Check In
          </button>
        </div>

        {verifyResult && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-center space-x-3 text-sm ${
              verifyResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {verifyResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{verifyResult.message}</span>
          </div>
        )}
      </div>

      {/* My Organization's Events */}
      <h3 className="text-lg font-bold text-white mb-4">Your Published Events ({events.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <div key={evt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex space-x-4">
            <img src={evt.bannerUrl} alt="banner" className="w-28 h-28 object-cover rounded-xl" />
            <div>
              <h4 className="text-white font-bold text-base">{evt.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{evt.locationName}</p>
              <div className="mt-3 flex items-center space-x-3 text-xs">
                <span className="text-purple-400 font-bold">₹{evt.ticketTiers?.[0]?.price}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{evt.ticketTiers?.[0]?.availableQuantity} Tickets left</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEvent}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-xl font-bold text-white">Create New Event</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Event Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kerala Cultural Fest 2026"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event highlights and details..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Marine Drive Ground, Kochi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Ticket Price (INR)</label>
                <input
                  type="number"
                  required
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30"
              >
                Publish Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

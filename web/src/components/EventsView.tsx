import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Ticket, Compass, CheckCircle2, QrCode, X } from 'lucide-react';

interface EventsViewProps {
  currentUser: any;
}

const CITIES = [
  { name: 'Kochi (Cochin)', lat: 9.9816, lon: 76.2999 },
  { name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
  { name: 'Kozhikode (Calicut)', lat: 11.2588, lon: 75.7804 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
];

export const EventsView: React.FC<EventsViewProps> = ({ currentUser }) => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedTier, setSelectedTier] = useState<any | null>(null);
  const [bookedTicket, setBookedTicket] = useState<any | null>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/events?lat=${selectedCity.lat}&lon=${selectedCity.lon}&radiusKm=${radiusKm}`
      );
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`http://localhost:4000/api/events/user-tickets/${currentUser.id}`);
      const data = await res.json();
      setMyTickets(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCity, radiusKm]);

  useEffect(() => {
    fetchMyTickets();
  }, [currentUser]);

  const handleBookTicket = async () => {
    if (!selectedEvent || !selectedTier || !currentUser) return;

    try {
      const res = await fetch('http://localhost:4000/api/events/book-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          userId: currentUser.id,
          tierId: selectedTier.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookedTicket(data);
        setSelectedEvent(null);
        setSelectedTier(null);
        fetchEvents();
        fetchMyTickets();
      } else {
        alert(data.error || 'Failed to book ticket');
      }
    } catch (e) {
      console.error(e);
      alert('Error booking ticket');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Discover <span className="text-emerald-400">Nearby Events</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            നിങ്ങളുടെ പ്രദേശത്തെ സംഗീത നിശകൾ, പരിപാടികൾ, ഒപ്പം എളുപ്പത്തിൽ ടിക്കറ്റ് ബുക്കിംഗും.
          </p>
        </div>

        <button
          onClick={() => {
            fetchMyTickets();
            setShowMyTickets(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-semibold text-sm transition-all"
        >
          <Ticket className="w-4 h-4" />
          <span>My Tickets ({myTickets.length})</span>
        </button>
      </div>

      {/* Location & Distance Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block">Current Location / City</label>
            <select
              value={selectedCity.name}
              onChange={(e) => {
                const found = CITIES.find((c) => c.name === e.target.value);
                if (found) setSelectedCity(found);
              }}
              className="bg-transparent text-white font-bold text-base outline-none cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-72">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Distance Radius</span>
              <span className="text-emerald-400 font-bold">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={150}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Loading events near you...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No events found within {radiusKm} km</h3>
          <p className="text-slate-500 text-sm mt-1">Try increasing the distance slider above or pick another city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col group shadow-lg"
            >
              <div className="relative h-48 overflow-hidden bg-slate-800">
                <img
                  src={evt.bannerUrl}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {evt.distanceKm !== undefined && (
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-slate-700 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{evt.distanceKm} km away</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700">
                  {evt.category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{evt.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{evt.description}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>{new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="truncate">{evt.locationName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Starting from</span>
                    <span className="text-emerald-400 font-extrabold text-lg">
                      ₹{evt.ticketTiers?.[0]?.price || 0}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEvent(evt);
                      setSelectedTier(evt.ticketTiers?.[0] || null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Book Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-white pr-8">{selectedEvent.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{selectedEvent.locationName}</p>

            <div className="mt-6 space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Ticket Tier</label>
              <div className="space-y-2">
                {selectedEvent.ticketTiers.map((tier: any) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTier?.id === tier.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{tier.name}</div>
                      <div className="text-xs text-slate-400">{tier.availableQuantity} tickets remaining</div>
                    </div>
                    <div className="text-emerald-400 font-extrabold text-base">₹{tier.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Amount</span>
                <div className="text-2xl font-black text-white">₹{selectedTier?.price || 0}</div>
              </div>

              <button
                onClick={handleBookTicket}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booked Ticket Success QR Modal */}
      {bookedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">Ticket Confirmed!</h3>
            <p className="text-xs text-slate-400 mt-1">Show this QR code at the event gate for check-in.</p>

            <div className="my-6 p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QrCode className="w-40 h-40 text-slate-950 mx-auto" />
              <p className="text-[10px] font-mono font-bold text-slate-700 mt-2">{bookedTicket.qrCodeToken}</p>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/80 p-3 rounded-xl mb-6">
              <div className="flex justify-between">
                <span>Tier:</span>
                <span className="font-bold text-white">{bookedTicket.tierName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{bookedTicket.pricePaid}</span>
              </div>
            </div>

            <button
              onClick={() => setBookedTicket(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* My Tickets Drawer */}
      {showMyTickets && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowMyTickets(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">My Booked Tickets</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {myTickets.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No tickets booked yet.</p>
              ) : (
                myTickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{t.tierName}</div>
                      <div className="text-[11px] font-mono text-emerald-400 mt-0.5">{t.qrCodeToken}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Status: <span className="text-emerald-400 font-semibold">{t.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">₹{t.pricePaid}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

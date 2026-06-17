/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Search, Calendar, Clock, MapPin, User, Phone, 
  Star, Trash2, CheckCircle2, Frown, Smile
} from "lucide-react";

export default function BookingsDashboard() {
  const [phoneQuery, setPhoneQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  // Review & Rating State
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState("");

  // Sync data on search or load
  const loadBookings = async () => {
    if (!activeSearch) return;
    Promise.resolve().then(() => setLoading(true));
    
    let allBookings: any[] = [];

    // 1. Fetch bookings from backend if online
    try {
      const response = await fetch(`/_/backend/api/v1/bookings?phone=${activeSearch}`);
      if (response.ok) {
        const data = await response.json();
        if (data.bookings) {
          allBookings = data.bookings;
        }
      }
    } catch (err) {
      console.warn("Backend database not reachable. Falling back to local storage bookings.");
    }

    // 2. Read from localStorage for mock mode
    try {
      const localBookingsStr = localStorage.getItem("atozworks_bookings");
      const localBookings = localBookingsStr ? JSON.parse(localBookingsStr) : [];
      
      // Filter local bookings that match the search phone number
      const matchedLocal = localBookings.filter((b: any) => 
        b.phone === activeSearch || b.phone.replace(/[^0-9]/g, "") === activeSearch
      );

      // Merge local with database bookings, avoiding duplicate IDs
      const merged = [...allBookings, ...matchedLocal];
      const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      // Sort bookings: newest first
      unique.sort((a: any, b: any) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      setBookings(unique);
    } catch (e) {
      console.error("Failed to read local bookings:", e);
    }

    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBookings();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneQuery.length >= 10) {
      setActiveSearch(phoneQuery);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelLoading(id);

    // 1. Attempt to update backend status to CANCELLED
    try {
      await fetch(`/_/backend/api/v1/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
    } catch (e) {
      console.warn("Backend not reachable. Updating cancellation locally.");
    }

    // 2. Update local state & localStorage
    const updatedBookings = bookings.map(b => {
      if (b.id === id) {
        return { ...b, status: "CANCELLED" };
      }
      return b;
    });
    setBookings(updatedBookings);

    try {
      const localBookingsStr = localStorage.getItem("atozworks_bookings");
      if (localBookingsStr) {
        const localBookings = JSON.parse(localBookingsStr);
        const updatedLocal = localBookings.map((b: any) => {
          if (b.id === id) {
            return { ...b, status: "CANCELLED" };
          }
          return b;
        });
        localStorage.setItem("atozworks_bookings", JSON.stringify(updatedLocal));
      }
    } catch (err) {
      console.error("Failed to save cancellation in local storage:", err);
    }

    setCancelLoading(null);
  };

  const handleSubmitRating = (bookingId: string) => {
    if (!ratingComment.trim()) return;

    // Save rating details to localStorage ratings simulation
    try {
      const localRatingsStr = localStorage.getItem("atozworks_ratings");
      const localRatings = localRatingsStr ? JSON.parse(localRatingsStr) : [];
      const newRating = {
        id: `r_${Date.now()}`,
        bookingId,
        stars: ratingStars,
        comment: ratingComment,
        date: new Date().toISOString()
      };
      localRatings.push(newRating);
      localStorage.setItem("atozworks_ratings", JSON.stringify(localRatings));

      // Also tag the booking in state and localStorage as "rated" so the form hides
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId) {
          return { ...b, rated: true, rating: ratingStars, reviewComment: ratingComment };
        }
        return b;
      });
      setBookings(updatedBookings);

      const localBookingsStr = localStorage.getItem("atozworks_bookings");
      if (localBookingsStr) {
        const localBookings = JSON.parse(localBookingsStr);
        const updatedLocal = localBookings.map((b: any) => {
          if (b.id === bookingId) {
            return { ...b, rated: true, rating: ratingStars, reviewComment: ratingComment };
          }
          return b;
        });
        localStorage.setItem("atozworks_bookings", JSON.stringify(updatedLocal));
      }

      setRatingSuccessMsg("Thank you for your rating & feedback!");
      setTimeout(() => {
        setRatingBookingId(null);
        setRatingSuccessMsg("");
        setRatingComment("");
        setRatingStars(5);
      }, 2500);

    } catch (err) {
      console.error("Failed to save rating:", err);
    }
  };

  // Group bookings
  const upcomingBookings = bookings.filter(b => b.status === "PENDING" || b.status === "APPROVED");
  const pastBookings = bookings.filter(b => b.status === "COMPLETED" || b.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f8fbfe] to-white text-[#0f172a] font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="backdrop-blur-xl bg-white/80 border border-[#82cdff]/30 rounded-2xl px-6 py-1 flex items-center justify-between shadow-[0_8px_30px_rgba(130,200,255,0.08)]">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="AtoZ Works Logo" className="h-16 md:h-24 w-auto object-contain hover:scale-115 transition-all duration-300 transform" />
          </Link>

          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-[#0088ff] transition flex items-center gap-1.5">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto w-full flex-grow flex flex-col">
        {!activeSearch ? (
          /* SEARCH GATE */
          <div className="flex-grow flex items-center justify-center py-12">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-white border border-[#82cdff]/20 rounded-[2.5rem] p-8 md:p-10 shadow-xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#82cdff]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-16 h-16 bg-[#e3f2fd] text-[#0088ff] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Search size={28} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Track Bookings</h1>
                <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
                  Enter your 10-digit customer phone number to verify and view your scheduled home services in Hosur.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="tel" 
                      required
                      pattern="[0-9]{10}"
                      value={phoneQuery}
                      onChange={(e) => setPhoneQuery(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="9876543210" 
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50 font-medium" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={phoneQuery.length < 10}
                  className="w-full bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-3.5 rounded-xl font-bold shadow-lg hover:brightness-95 transition-all cursor-pointer disabled:opacity-50 text-sm"
                >
                  Retrieve Service Bookings
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* BOOKINGS LIST VIEW */
          <div className="space-y-8 flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#82cdff]/15 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Bookings</h1>
                <p className="text-xs text-slate-500 mt-1">Showing service dashboard for customer +91 {activeSearch}</p>
              </div>
              <button 
                onClick={() => {
                  setActiveSearch("");
                  setPhoneQuery("");
                  setBookings([]);
                }}
                className="text-xs font-bold text-[#0066cc] bg-[#82cdff]/15 hover:bg-[#82cdff]/25 border border-[#82cdff]/20 px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Track Different Number
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-[#0088ff] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white border border-[#82cdff]/20 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
                <div className="text-slate-400 text-4xl">📭</div>
                <h3 className="text-xl font-bold text-slate-700">No Bookings Found</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  We couldn&apos;t find any scheduled services registered under +91 {activeSearch}. Please make sure you entered the correct number used during checkout.
                </p>
                <Link 
                  href="/#services" 
                  className="inline-block bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-95 transition"
                >
                  Book a Service Now
                </Link>
              </div>
            ) : (
              <div className="space-y-10">
                {/* 1. UPCOMING APPOINTMENTS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0088ff]" /> Upcoming Appointments ({upcomingBookings.length})
                  </h3>

                  {upcomingBookings.length === 0 ? (
                    <div className="bg-white/50 border border-[#82cdff]/10 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                      No active bookings scheduled.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map((b) => (
                        <div 
                          key={b.id} 
                          className="bg-white border border-[#82cdff]/20 rounded-3xl p-6 shadow-sm hover:border-[#82cdff]/40 transition-all flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden"
                        >
                          <div className="space-y-4 flex-grow">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">{b.bookingNumber}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                b.status === "APPROVED" 
                                  ? "bg-blue-50 border-blue-200 text-blue-600" 
                                  : "bg-amber-50 border-amber-200 text-amber-600"
                              }`}>
                                {b.status === "APPROVED" ? "APPROVED & DISPATCHED" : "PENDING VERIFICATION"}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <h4 className="text-xl font-extrabold text-slate-800">{b.service}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {b.date}</div>
                                <div className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {b.timeSlot || "09:00 AM - 12:00 PM"}</div>
                                <div className="flex items-center gap-1.5 sm:col-span-2"><MapPin size={14} className="text-slate-400" /> {b.address}</div>
                              </div>
                            </div>

                            {/* Assigned Partner details */}
                            {b.status === "APPROVED" && (
                              <div className="bg-[#e3f2fd]/20 border border-[#82cdff]/15 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#82cdff]/15 rounded-lg text-[#0066cc] flex items-center justify-center flex-shrink-0">
                                    <User size={18} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block leading-none">ASSIGNED PARTNER</span>
                                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{b.provider || "Robert Electrician"}</span>
                                  </div>
                                </div>
                                <a 
                                  href={`tel:${b.phone || "9876543201"}`}
                                  className="self-center inline-flex items-center gap-1.5 text-xs font-bold text-[#0066cc] hover:underline"
                                >
                                  <Phone size={12} /> Contact Partner
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col justify-between items-end md:justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 md:w-44 text-right flex-shrink-0">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Service Mode</span>
                              <span className="text-sm font-extrabold text-[#0088ff]">Pay on Complete</span>
                            </div>
                            
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              disabled={cancelLoading === b.id}
                              className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {cancelLoading === b.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <><Trash2 size={12} /> Cancel Service</>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. PAST APPOINTMENTS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Service History ({pastBookings.length})
                  </h3>

                  {pastBookings.length === 0 ? (
                    <div className="bg-white/50 border border-[#82cdff]/10 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                      No previous bookings found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastBookings.map((b) => (
                        <div 
                          key={b.id} 
                          className="bg-white/80 border border-[#82cdff]/10 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative"
                        >
                          <div className="space-y-3 flex-grow opacity-90">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">{b.bookingNumber}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                b.status === "COMPLETED" 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                  : "bg-rose-50 border-rose-200 text-rose-600"
                              }`}>
                                {b.status === "COMPLETED" ? "SERVICE COMPLETED" : "CANCELLED"}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-slate-700">{b.service}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                                <div className="flex items-center gap-1"><Calendar size={12} /> {b.date}</div>
                                <div className="flex items-center gap-1"><MapPin size={12} /> {b.address}</div>
                              </div>
                            </div>

                            {/* Ratings view if already rated */}
                            {b.status === "COMPLETED" && b.rated && (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-700">Your Rating:</span>
                                  <div className="flex text-amber-500">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={12} 
                                        fill={i < b.rating ? "currentColor" : "none"} 
                                        className={i < b.rating ? "text-amber-500" : "text-gray-200"}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {b.reviewComment && (
                                  <p className="text-slate-500 mt-1 leading-normal">&ldquo;{b.reviewComment}&rdquo;</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col justify-between items-end md:justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 md:w-44 text-right flex-shrink-0">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Status</span>
                              <span className="text-sm font-bold text-slate-700">Completed</span>
                            </div>

                            {/* Rate service button */}
                            {b.status === "COMPLETED" && !b.rated && (
                              <button
                                onClick={() => setRatingBookingId(b.id)}
                                className="bg-[#82cdff]/15 hover:bg-[#82cdff]/25 text-[#0066cc] border border-[#82cdff]/20 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Rate Service
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#82cdff]/20 py-6 text-center text-xs text-slate-400 mt-20">
        <div>AtoZ Works © 2026. Customer Bookings Manager.</div>
      </footer>

      {/* Rating & Review Dialog Modal */}
      <AnimatePresence>
        {ratingBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRatingBookingId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-[95%] max-w-md rounded-[2rem] border border-[#82cdff]/30 p-6 md:p-8 shadow-2xl relative overflow-hidden z-10 text-center space-y-6"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#82cdff]/5 rounded-full blur-xl pointer-events-none" />

              <h3 className="text-2xl font-extrabold text-slate-800">Rate Service</h3>
              <p className="text-slate-500 text-xs">How was your service experience with AtoZ Works?</p>

              {ratingSuccessMsg ? (
                <div className="py-6 space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="text-sm font-bold text-emerald-600 block">{ratingSuccessMsg}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Star selector */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className="text-amber-500 hover:scale-110 transition cursor-pointer"
                      >
                        <Star 
                          size={32} 
                          fill={star <= ratingStars ? "currentColor" : "none"} 
                          className={star <= ratingStars ? "text-amber-500 animate-pulse" : "text-gray-200"}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center gap-1.5 text-xs font-semibold text-slate-500">
                    {ratingStars <= 2 ? (
                      <span className="flex items-center gap-1 text-rose-500"><Frown size={14} /> Dissatisfied</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600"><Smile size={14} /> Satisfied</span>
                    )}
                  </div>

                  {/* Feedback field */}
                  <div className="text-left space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Review Comment</label>
                    <textarea
                      required
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={3}
                      placeholder="Share details of your experience..."
                      className="w-full px-3 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#82cdff] transition resize-none placeholder-slate-400/50 leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRatingBookingId(null)}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!ratingComment.trim()}
                      onClick={() => handleSubmitRating(ratingBookingId)}
                      className="flex-1 bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-3 rounded-xl text-xs font-bold shadow-md hover:brightness-95 transition cursor-pointer disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

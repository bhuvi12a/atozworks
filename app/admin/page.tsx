/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ShieldAlert, CalendarClock, 
  ArrowLeft, Search, CheckCircle2, TrendingUp, 
  Briefcase, AlertCircle, MapPin,
  Camera, Upload, Lock, Eye, EyeOff
} from "lucide-react";
import GoogleMap from "@/components/GoogleMap";

// Mock Data representing state for preview/fallback
const MOCK_ANALYTICS = {
  totalBookings: 245,
  revenue: 84950,
  customersCount: 182,
  providersCount: 34,
  cancellationRate: 4.8,
  topServices: [
    { name: "AC Repair", count: 98, pct: 40 },
    { name: "Home Cleaning", count: 72, pct: 30 },
    { name: "Plumbing", count: 48, pct: 20 },
    { name: "Electrical", count: 27, pct: 10 }
  ]
};

const MOCK_KYC = [
  { id: "p1", name: "Ramesh Kumar", service: "Plumbing", experience: 6, docUrl: "Aadhaar_Card.pdf", phone: "9876543201" },
  { id: "p2", name: "Sunil Verma", service: "AC Repair", experience: 4, docUrl: "Pan_Card.pdf", phone: "9876543202" },
  { id: "p3", name: "Amit Sharma", service: "Carpentry", experience: 8, docUrl: "Driving_License.pdf", phone: "9876543203" }
];

const MOCK_USERS = [
  { id: "u1", name: "John Doe", email: "john@example.com", phone: "9876543210", role: "CUSTOMER", status: "ACTIVE" },
  { id: "u2", name: "Robert Electrician", email: "robert@example.com", phone: "7777777777", role: "PROVIDER", status: "ACTIVE" },
  { id: "u3", name: "David Cleaner", email: "david@example.com", phone: "6666666666", role: "PROVIDER", status: "ACTIVE" },
  { id: "u4", name: "Alice Brown", email: "alice@example.com", phone: "9876543211", role: "CUSTOMER", status: "SUSPENDED" }
];

const MOCK_BOOKINGS = [
  { id: "b1", bookingNumber: "AW-20260604-8742", customer: "John Doe", service: "AC Repair", provider: "Ramesh Kumar", date: "2026-06-05", price: "₹299", status: "PROVIDER_ASSIGNED", lat: 12.7420, lng: 77.8280, phone: "9876543210", email: "john@example.com", address: "No. 42, Green Glen Layout, Hosur - 635109" },
  { id: "b2", bookingNumber: "AW-20260604-3291", customer: "Alice Brown", service: "Home Cleaning", provider: "David Cleaner", date: "2026-06-06", price: "₹499", status: "IN_PROGRESS", lat: 12.7480, lng: 77.8320, phone: "9876543211", email: "alice@example.com", address: "Plot 12, SIPCOT Area, Hosur - 635126" },
  { id: "b3", bookingNumber: "AW-20260604-1049", customer: "John Doe", service: "Plumbing", provider: "Sunil Verma", date: "2026-06-04", price: "₹199", status: "COMPLETED", lat: 12.7380, lng: 77.8180, phone: "9876543210", email: "john@example.com", address: "No. 42, Green Glen Layout, Hosur - 635109" },
  { id: "b4", bookingNumber: "AW-20260604-9812", customer: "Jane Smith", service: "Electrical", provider: "Robert Electrician", date: "2026-06-07", price: "₹149", status: "PENDING", lat: 12.7550, lng: 77.8420, phone: "9876543212", email: "jane@example.com", address: "No. 5, NGO Colony, Hosur - 635109" }
];



export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "kyc" | "users" | "bookings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dynamic State management for UI interactions
  const [kycList, setKycList] = useState<any[]>(MOCK_KYC);
  const [userList, setUserList] = useState<any[]>(MOCK_USERS);
  const [bookingList, setBookingList] = useState<any[]>(MOCK_BOOKINGS);
  const [activeMapBooking, setActiveMapBooking] = useState<any | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<any | null>(null);

  // Password Security Gate States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("atozworks_admin_auth");
      setIsAuthenticated(auth === "true");
    }
  }, []);

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const hashed = await hashPassword(password);
      // c66c75f960f598f862daf49a4b79596267cdc1c9c54a5a053d7f6fd7858d630e is SHA-256 for AtoZWorks@Admin2026!
      if (hashed === "c66c75f960f598f862daf49a4b79596267cdc1c9c54a5a053d7f6fd7858d630e") {
        sessionStorage.setItem("atozworks_admin_auth", "true");
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid admin credentials. Please try again.");
      }
    } catch (err) {
      setAuthError("Encryption verification failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const downloadPhoto = (base64Url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = base64Url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: KYC approvals
  const handleVerifyKyc = async (id: string, approve: boolean) => {
    const status = approve ? "APPROVED" : "REJECTED";
    try {
      const response = await fetch(`http://localhost:5000/api/v1/admin/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        // Refresh dynamically from DB
        const providersRes = await fetch("http://localhost:5000/api/v1/admin/providers");
        if (providersRes.ok) {
          const providersData = await providersRes.json();
          const dbKyc = providersData.providers
            .filter((p: any) => p.kycStatus === "PENDING")
            .map((p: any) => ({
              id: p._id,
              name: p.userId?.name || "Unknown Provider",
              service: p.categories?.map((c: any) => c.name).join(", ") || "General",
              experience: p.experience,
              docUrl: "Aadhaar_Card.pdf",
              phone: p.userId?.phone || "",
              selfie: p.selfie,
              idCard: p.idCard
            }));
          setKycList(dbKyc);
          
          // Also reload users list to show approved role details
          const usersRes = await fetch("http://localhost:5000/api/v1/admin/users");
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            const dbUsers = usersData.users.map((u: any) => {
              const pInfo = providersData.providers.find((p: any) => p.userId?._id === u._id);
              return {
                id: u._id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role,
                status: u.status,
                selfie: pInfo?.selfie,
                idCard: pInfo?.idCard,
                experience: pInfo?.experience,
                service: pInfo?.categories?.map((c: any) => c.name).join(", ")
              };
            });
            setUserList(dbUsers);
          }
        }
      } else {
        throw new Error("KYC verification failed");
      }
    } catch (err) {
      // Local Storage fallback
      const updatedKyc = kycList.filter(item => item.id !== id);
      setKycList(updatedKyc);
      const userKyc = updatedKyc.filter(item => item.id.startsWith("k_"));
      try {
        localStorage.setItem("atozworks_kyc", JSON.stringify(userKyc));
      } catch (storeErr: any) {
        if (storeErr.name === "QuotaExceededError" || storeErr.name === "NS_ERROR_DOM_QUOTA_REACHED" || storeErr.code === 22) {
          console.warn("Quota exceeded on KYC update fallback. Stripping base64 images.");
          const strippedKyc = userKyc.map(item => ({ ...item, selfie: "/images/placeholder_selfie.png", idCard: "/images/placeholder_id.png" }));
          try {
            localStorage.setItem("atozworks_kyc", JSON.stringify(strippedKyc));
          } catch (retryErr) {
            console.error("Failed writing fallback KYC data: ", retryErr);
          }
        }
      }
    }

    if (approve) {
      alert("Provider documents verified. Status updated to: APPROVED.");
    } else {
      alert("Provider documents rejected. Notification dispatched.");
    }
  };

  // Action: User suspension toggles
  const handleToggleUserStatus = async (id: string) => {
    const userToToggle = userList.find(u => u.id === id);
    if (!userToToggle) return;
    const targetStatus = userToToggle.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      const response = await fetch(`http://localhost:5000/api/v1/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      if (response.ok) {
        // Refresh lists from database
        const [usersRes, providersRes] = await Promise.all([
          fetch("http://localhost:5000/api/v1/admin/users"),
          fetch("http://localhost:5000/api/v1/admin/providers")
        ]);

        if (usersRes.ok && providersRes.ok) {
          const usersData = await usersRes.json();
          const providersData = await providersRes.json();
          const dbUsers = usersData.users.map((u: any) => {
            const pInfo = providersData.providers.find((p: any) => p.userId?._id === u._id);
            return {
              id: u._id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              role: u.role,
              status: u.status,
              selfie: pInfo?.selfie,
              idCard: pInfo?.idCard,
              experience: pInfo?.experience,
              service: pInfo?.categories?.map((c: any) => c.name).join(", ")
            };
          });
          setUserList(dbUsers);
        }
      } else {
        throw new Error("User toggle failed");
      }
    } catch (err) {
      // Local Storage fallback
      const updatedUsers = userList.map(u => {
        if (u.id === id) {
          const newStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          return { ...u, status: newStatus };
        }
        return u;
      });
      setUserList(updatedUsers);
      const userCreated = updatedUsers.filter(u => u.id.startsWith("u_") && u.id !== "u1" && u.id !== "u2" && u.id !== "u3" && u.id !== "u4");
      try {
        localStorage.setItem("atozworks_users", JSON.stringify(userCreated));
      } catch (storeErr: any) {
        if (storeErr.name === "QuotaExceededError" || storeErr.name === "NS_ERROR_DOM_QUOTA_REACHED" || storeErr.code === 22) {
          console.warn("Quota exceeded on User update fallback. Stripping base64 images.");
          const strippedUsers = userCreated.map(u => ({ ...u, selfie: "/images/placeholder_selfie.png", idCard: "/images/placeholder_id.png" }));
          try {
            localStorage.setItem("atozworks_users", JSON.stringify(strippedUsers));
          } catch (retryErr) {
            console.error("Failed writing fallback user data: ", retryErr);
          }
        }
      }
    }
  };

  // Action: Booking state updates
  const handleUpdateBookingStatus = async (id: string, newStatus: string) => {
    // 1. Attempt to patch the database backend
    try {
      await fetch(`http://localhost:5000/api/v1/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn("Backend not reachable. Updating status locally.");
    }

    // 2. Update local state
    const updatedList = bookingList.map(b => {
      if (b.id === id) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBookingList(updatedList);

    // Save updated items back to localStorage
    const userBookings = updatedList.filter(b => b.id.startsWith("b_"));
    try {
      localStorage.setItem("atozworks_bookings", JSON.stringify(userBookings));
    } catch (err) {
      console.error("Failed writing fallback booking data to local storage: ", err);
    }
  };

  // Load bookings and coupons on mount from database or local storage
  useEffect(() => {
    if (isAuthenticated !== true) return;
    const syncData = async () => {
      // Load Bookings
      try {
        const response = await fetch("http://localhost:5000/api/v1/bookings");
        if (response.ok) {
          const data = await response.json();
          if (data.bookings && data.bookings.length > 0) {
            setBookingList(data.bookings);
          } else {
            loadLocalBookings();
          }
        } else {
          loadLocalBookings();
        }
      } catch (err) {
        loadLocalBookings();
      }



      // Load custom users & KYC requests
      await fetchDatabaseUsersAndProviders();
    };

    const fetchDatabaseUsersAndProviders = async () => {
      try {
        const [usersRes, providersRes] = await Promise.all([
          fetch("http://localhost:5000/api/v1/admin/users"),
          fetch("http://localhost:5000/api/v1/admin/providers")
        ]);

        if (usersRes.ok && providersRes.ok) {
          const usersData = await usersRes.json();
          const providersData = await providersRes.json();

          if (usersData.users && providersData.providers) {
            // Format KYC list items (Pending providers)
            const dbKyc = providersData.providers
              .filter((p: any) => p.kycStatus === "PENDING")
              .map((p: any) => ({
                id: p._id,
                name: p.userId?.name || "Unknown Provider",
                service: p.categories?.map((c: any) => c.name).join(", ") || "General",
                experience: p.experience,
                docUrl: "Aadhaar_Card.pdf",
                phone: p.userId?.phone || "",
                selfie: p.selfie,
                idCard: p.idCard
              }));
            setKycList(dbKyc);

            // Format users and merge providers photos
            const dbUsers = usersData.users.map((u: any) => {
              const pInfo = providersData.providers.find((p: any) => p.userId?._id === u._id);
              return {
                id: u._id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role,
                status: u.status,
                selfie: pInfo?.selfie,
                idCard: pInfo?.idCard,
                experience: pInfo?.experience,
                service: pInfo?.categories?.map((c: any) => c.name).join(", ")
              };
            });
            setUserList(dbUsers);
            return;
          }
        }
        
        loadLocalUsers();
        loadLocalKyc();
      } catch (err) {
        console.warn("Backend admin endpoints not reachable. Falling back to local storage.");
        loadLocalUsers();
        loadLocalKyc();
      }
    };

    const loadLocalBookings = () => {
      const localBookingsStr = localStorage.getItem("atozworks_bookings");
      if (localBookingsStr) {
        const localBookings = JSON.parse(localBookingsStr);
        const merged = [...localBookings, ...MOCK_BOOKINGS];
        // prevent duplicate booking numbers
        const unique = merged.filter((v, i, a) => a.findIndex(t => t.bookingNumber === v.bookingNumber) === i);
        setBookingList(unique);
      }
    };



    const loadLocalUsers = () => {
      const localUsersStr = localStorage.getItem("atozworks_users");
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const merged = [...MOCK_USERS, ...localUsers];
        // prevent duplicate user IDs
        const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setUserList(unique);
      }
    };

    const loadLocalKyc = () => {
      const localKycStr = localStorage.getItem("atozworks_kyc");
      if (localKycStr) {
        const localKyc = JSON.parse(localKycStr);
        const merged = [...MOCK_KYC, ...localKyc];
        // prevent duplicate KYC IDs
        const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setKycList(unique);
      }
    };

    syncData();
  }, [isAuthenticated]);



  const filteredUsers = userList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.phone.includes(searchQuery)
  );

  const filteredBookings = bookingList.filter(b => 
    b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1. Initial sessionStorage check state (prevent flash)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbfe]">
        <div className="w-12 h-12 border-4 border-[#82cdff]/20 border-t-[#0088ff] rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Not authenticated state - Render glassmorphic login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3f2fd] via-[#f8fbfe] to-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Animated background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#82cdff]/15 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md backdrop-blur-xl bg-white/70 border border-[#82cdff]/30 rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,102,255,0.1)] relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#82cdff] to-[#0088ff] flex items-center justify-center text-white shadow-lg shadow-[#0088ff]/15">
                <Lock className="w-7 h-7" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Gatekeeper</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium">Authorization required to access AtoZ Works systems.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-5 pr-12 py-3.5 bg-slate-50 text-[#0f172a] rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] focus:bg-white transition placeholder-slate-400/50 font-medium font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 font-semibold flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {authError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-4 rounded-2xl font-bold shadow-lg hover:brightness-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Unlock Dashboard"
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0088ff] font-semibold transition">
                <ArrowLeft size={12} /> Back to Homepage
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f8fbfe] to-white text-[#0f172a] font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-[#82cdff]/30 p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 group">
            <img src="/images/logo.png" alt="AtoZ Works Logo" className="h-14 md:h-18 w-auto object-contain hover:scale-115 transition-all duration-300 transform" />
            <span className="text-[10px] bg-[#82cdff]/20 text-[#0066ff] px-2 py-0.5 rounded-full font-bold">Admin</span>
          </Link>

          {/* Nav Tabs */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "dashboard" ? "bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white shadow-md shadow-[#82cdff]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            
            <button
              onClick={() => { setActiveTab("kyc"); setSearchQuery(""); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition relative ${
                activeTab === "kyc" ? "bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white shadow-md shadow-[#82cdff]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <ShieldAlert size={18} /> KYC Verification
              {kycList.length > 0 && (
                <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {kycList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "users" ? "bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white shadow-md shadow-[#82cdff]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Users size={18} /> Users & Providers
            </button>

            <button
              onClick={() => { setActiveTab("bookings"); setSearchQuery(""); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "bookings" ? "bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white shadow-md shadow-[#82cdff]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <CalendarClock size={18} /> Bookings List
            </button>


          </nav>
        </div>

        {/* Footer Back link */}
        <div className="pt-6 border-t border-[#82cdff]/20 mt-6 hidden md:block">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0088ff] transition">
            <ArrowLeft size={14} /> Back to Website
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight capitalize">{activeTab} panel</h1>
            <p className="text-slate-500 text-sm mt-1">Manage users, provider verify status, coupons, and track booking analytics.</p>
          </div>

          {/* Global Search Bar for lists */}
          {(activeTab === "users" || activeTab === "bookings") && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={activeTab === "users" ? "Search users by name, phone..." : "Search bookings by customer, number..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#82cdff]/30 rounded-xl text-sm focus:outline-none focus:border-[#0088ff] transition shadow-sm"
              />
            </div>
          )}
        </header>

        {/* Dynamic Panel Tabs Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Stats Bento Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-white border border-[#82cdff]/15 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
                      <Briefcase className="w-5 h-5 text-[#0088ff]" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight">{MOCK_ANALYTICS.totalBookings}</h3>
                      <span className="text-xs text-emerald-500 flex items-center gap-1 font-semibold mt-1">
                        <TrendingUp size={12} /> +12.3% this month
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#82cdff]/15 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Verified Partners</span>
                      <Users className="w-5 h-5 text-[#0088ff]" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight">{MOCK_ANALYTICS.providersCount}</h3>
                      <span className="text-xs text-slate-500 block mt-1">Background-verified pros</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#82cdff]/15 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
                      <Users className="w-5 h-5 text-[#0088ff]" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight">{MOCK_ANALYTICS.customersCount}</h3>
                      <span className="text-xs text-slate-500 block mt-1">Active users directory</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#82cdff]/15 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Cancel Rate</span>
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight">{MOCK_ANALYTICS.cancellationRate}%</h3>
                      <span className="text-xs text-emerald-500 block mt-1">Industry standard target</span>
                    </div>
                  </div>
                </div>

                {/* Grid Analytics Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Top Services bar charts */}
                  <div className="bg-white border border-[#82cdff]/15 rounded-3xl p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Performing Services</h3>
                    <div className="space-y-6">
                      {MOCK_ANALYTICS.topServices.map((service, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                            <span>{service.name}</span>
                            <span className="text-slate-500">{service.count} bookings ({service.pct}%)</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${service.pct}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-[#82cdff] to-[#0088ff]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Platform Summary */}
                  <div className="bg-gradient-to-br from-[#0033aa] to-[#001155] text-white border border-[#82cdff]/30 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Operations Alert</h3>
                      <p className="text-blue-100 text-xs leading-relaxed">
                        We have {kycList.length} service providers waiting for document KYC checks. Ensure you process them today to maintain adequate service coverage metrics.
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-200">KYC Backlog:</span>
                        <span className="font-bold text-amber-300">{kycList.length} pending</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-200">Active Bookings Today:</span>
                        <span className="font-bold text-emerald-400">14 in progress</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: KYC VERIFICATION */}
            {activeTab === "kyc" && (
              <div className="bg-white border border-[#82cdff]/15 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Verification Requests ({kycList.length})</h3>
                
                {kycList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-sm">All clear! No pending KYC requests.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                          <th className="pb-4">Provider Name</th>
                          <th className="pb-4">Category</th>
                          <th className="pb-4">Experience</th>
                          <th className="pb-4">Verification Photos</th>
                          <th className="pb-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {kycList.map(p => (
                          <tr key={p.id} className="text-slate-700">
                            <td className="py-4 font-bold">{p.name}</td>
                            <td className="py-4">{p.service}</td>
                            <td className="py-4">{p.experience} Years</td>
                            <td className="py-4">
                              {p.selfie || p.idCard ? (
                                <button
                                  onClick={() => setSelectedPhotos({ selfie: p.selfie, idCard: p.idCard, name: p.name })}
                                  className="text-[11px] font-bold text-[#0088ff] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <Camera size={12} /> View Photos
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No photos uploaded</span>
                              )}
                            </td>
                            <td className="py-4 text-right space-x-2">
                              <button
                                onClick={() => handleVerifyKyc(p.id, true)}
                                className="inline-flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyKyc(p.id, false)}
                                className="inline-flex items-center gap-1 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-rose-600 transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === "users" && (
              <div className="bg-white border border-[#82cdff]/15 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">User Database Directory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-4">User Name</th>
                        <th className="pb-4">Email</th>
                        <th className="pb-4">Phone</th>
                        <th className="pb-4">Role</th>
                        <th className="pb-4">Verification Photos</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="text-slate-700">
                          <td className="py-4 font-bold">{u.name}</td>
                          <td className="py-4">{u.email}</td>
                          <td className="py-4">{u.phone}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === "PROVIDER" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-sky-50 text-[#0066cc] border border-sky-100"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4">
                            {u.role === "PROVIDER" ? (
                              u.selfie || u.idCard ? (
                                <button
                                  onClick={() => setSelectedPhotos({ selfie: u.selfie, idCard: u.idCard, name: u.name })}
                                  className="text-[11px] font-bold text-[#0088ff] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <Camera size={12} /> View Photos
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No photos uploaded</span>
                              )
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                u.status === "ACTIVE" 
                                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
                              }`}
                            >
                              {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: BOOKINGS */}
            {activeTab === "bookings" && (
              <div className="bg-white border border-[#82cdff]/15 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Service Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-4">Booking ID</th>
                        <th className="pb-4">Customer</th>
                        <th className="pb-4">Service</th>
                        <th className="pb-4">Provider</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredBookings.map(b => (
                        <tr key={b.id} className="text-slate-700">
                          <td className="py-4 font-mono font-bold text-xs text-slate-500">{b.bookingNumber}</td>
                          <td className="py-4">
                            <div className="font-bold text-slate-800">{b.customer}</div>
                            <div className="text-[11px] text-slate-500 font-medium">Ph: {b.phone}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{b.email}</div>
                            <div className="text-[11px] text-slate-500 italic max-w-xs truncate mt-1" title={b.address}>
                              Addr: {b.address}
                            </div>
                            <button
                              onClick={() => setActiveMapBooking(b)}
                              className="text-[10px] text-[#0088ff] font-semibold hover:underline flex items-center gap-0.5 mt-1.5 cursor-pointer"
                            >
                              <MapPin size={10} /> View Map Location
                            </button>
                          </td>
                          <td className="py-4">{b.service}</td>
                          <td className="py-4">{b.provider}</td>
                          <td className="py-4">{b.date}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              b.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              b.status === "PENDING" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              b.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                              "bg-[#82cdff]/10 text-[#0066cc] border border-[#82cdff]/20"
                            }`}>
                              {b.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:outline-none focus:border-[#82cdff] font-semibold text-slate-700"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PROVIDER_ASSIGNED">Assigned</option>
                              <option value="ON_THE_WAY">On The Way</option>
                              <option value="ARRIVED">Arrived</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}



          </motion.div>
        </AnimatePresence>
      </main>

      {/* Client Location Map Modal */}
      {activeMapBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#82cdff]/30 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="text-[#0088ff]" size={18} /> Client Pin Location - {activeMapBooking.customer}
            </h3>
            
            <div className="h-64 rounded-2xl overflow-hidden border border-[#82cdff]/20 mb-4">
              <GoogleMap 
                mode="viewer" 
                latitude={activeMapBooking.lat} 
                longitude={activeMapBooking.lng} 
              />
            </div>

            <p className="text-slate-700 text-sm mb-1 leading-relaxed">
              <strong>Service Address:</strong> {activeMapBooking.address}
            </p>
            <p className="text-slate-500 text-xs mb-6">
              <strong>Coordinates:</strong> Lat: {activeMapBooking.lat}, Lng: {activeMapBooking.lng}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveMapBooking(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Close Location Map
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#82cdff]/30 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Camera className="text-[#0088ff]" size={18} /> Onboarding Photo Verification - {selectedPhotos.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Selfie Frame */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Partner Selfie</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-50 relative group flex items-center justify-center">
                  {selectedPhotos.selfie ? (
                    <>
                      <img src={selectedPhotos.selfie} className="w-full h-full object-cover" alt="Selfie" />
                      <button
                        onClick={() => downloadPhoto(selectedPhotos.selfie, `${selectedPhotos.name.toLowerCase().replace(/ /g, "_")}_selfie.jpg`)}
                        className="absolute right-3 bottom-3 bg-slate-800/80 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-sm transition-all cursor-pointer inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 shadow-md"
                      >
                        <Upload size={12} className="rotate-180" /> Download
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-xs">No photo uploaded</div>
                  )}
                </div>
              </div>

              {/* ID Card Frame */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Aadhaar / PAN Card</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-50 relative group flex items-center justify-center">
                  {selectedPhotos.idCard ? (
                    <>
                      <img src={selectedPhotos.idCard} className="w-full h-full object-cover" alt="ID Card" />
                      <button
                        onClick={() => downloadPhoto(selectedPhotos.idCard, `${selectedPhotos.name.toLowerCase().replace(/ /g, "_")}_id_card.jpg`)}
                        className="absolute right-3 bottom-3 bg-slate-800/80 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-sm transition-all cursor-pointer inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 shadow-md"
                      >
                        <Upload size={12} className="rotate-180" /> Download
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-xs">No ID card uploaded</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedPhotos(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

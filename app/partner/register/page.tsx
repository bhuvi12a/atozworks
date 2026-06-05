/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, CheckCircle2, User, Phone, Mail, Lock, 
  Briefcase, Wrench, ShieldCheck, HeartHandshake, Camera, Upload, RefreshCw, Check
} from "lucide-react";

export default function PartnerRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    experience: "",
    category: "electrical",
  });
  
  // Verification states
  const [step, setStep] = useState(1);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idCard, setIdCard] = useState<string | null>(null);
  
  // Camera state
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeCaptureType, setActiveCaptureType] = useState<"selfie" | "idCard" | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mockMode, setMockMode] = useState(false);

  const categories = [
    { value: "ac-repair", label: "AC Repair & Servicing" },
    { value: "home-cleaning", label: "Home Deep Cleaning" },
    { value: "plumbing", label: "Plumbing Services" },
    { value: "electrical", label: "Electrical Repairs" },
    { value: "house-shifting", label: "Packers & Movers" },
    { value: "painting", label: "Painting & Decorating" },
    { value: "carpentry", label: "Carpentry & Woodwork" },
    { value: "cctv", label: "Security & CCTV System" },
    { value: "appliance", label: "Appliance Repairs" },
    { value: "pest-control", label: "Pest Control & Bugs" },
  ];

  // Camera helpers
  const startCamera = async (type: "selfie" | "idCard") => {
    try {
      setActiveCaptureType(type);
      setIsCameraActive(true);
      setErrorMsg("");
      
      const constraints = {
        video: {
          facingMode: type === "selfie" ? "user" : "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);

      // Bind stream to video element
      setTimeout(() => {
        const videoElement = document.getElementById("webcam-preview") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.warn("Could not access camera, falling back to file upload:", err);
      setIsCameraActive(false);
      setVideoStream(null);
      setErrorMsg("Camera access denied or unavailable. Please use file upload fallback below.");
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
    setActiveCaptureType(null);
  };

  const capturePhoto = () => {
    const videoElement = document.getElementById("webcam-preview") as HTMLVideoElement;
    if (!videoElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Mirror selfie front-camera preview
      if (activeCaptureType === "selfie") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      
      if (activeCaptureType === "selfie") {
        setSelfie(dataUrl);
      } else {
        setIdCard(dataUrl);
      }
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "selfie" | "idCard") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (type === "selfie") {
        setSelfie(dataUrl);
      } else {
        setIdCard(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const proceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.password || !formData.experience) {
      setErrorMsg("Please fill out all details.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selfie || !idCard) {
      setErrorMsg("Both Selfie and ID Card photo verification are required.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: "PROVIDER",
      experience: formData.experience,
      category: formData.category,
      selfie: selfie,
      idCard: idCard
    };

    try {
      const response = await fetch("http://localhost:5000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.warn("Backend API not reachable. Falling back to local mock mode registration.");
      setMockMode(true);
      
      // Save locally to user list simulation
      const providerId = `u_${Date.now()}`;
      const newProviderMock = {
        id: providerId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: "PROVIDER",
        status: "ACTIVE",
        selfie: selfie,
        idCard: idCard,
        experience: formData.experience,
        category: categories.find(c => c.value === formData.category)?.label || formData.category
      };

      const newKycMock = {
        id: `k_${Date.now()}`,
        name: formData.name,
        service: categories.find(c => c.value === formData.category)?.label || formData.category,
        experience: parseInt(formData.experience || "0"),
        docUrl: "Aadhaar_Card.pdf",
        phone: formData.phone,
        selfie: selfie,
        idCard: idCard
      };

      // Safely write users to local storage
      try {
        const localUsersStr = localStorage.getItem("atozworks_users");
        const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
        localUsers.push(newProviderMock);
        localStorage.setItem("atozworks_users", JSON.stringify(localUsers));
      } catch (err: any) {
        if (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22) {
          console.warn("Local storage quota exceeded. Saving provider registration with placeholder photos.");
          try {
            const localUsersStr = localStorage.getItem("atozworks_users");
            const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
            const strippedProvider = { ...newProviderMock, selfie: "/images/placeholder_selfie.png", idCard: "/images/placeholder_id.png" };
            localUsers.push(strippedProvider);
            // Clean base64 from all elements in the array to free space
            const cleanedUsers = localUsers.map((u: any) => ({
              ...u,
              selfie: u.selfie && u.selfie.startsWith("data:") ? "/images/placeholder_selfie.png" : u.selfie,
              idCard: u.idCard && u.idCard.startsWith("data:") ? "/images/placeholder_id.png" : u.idCard
            }));
            localStorage.setItem("atozworks_users", JSON.stringify(cleanedUsers));
          } catch (retryErr) {
            console.error("Failed to save even with stripped photos: ", retryErr);
          }
        } else {
          console.error("Local storage error: ", err);
        }
      }

      // Safely write KYC requests to local storage
      try {
        const localKycStr = localStorage.getItem("atozworks_kyc");
        const localKyc = localKycStr ? JSON.parse(localKycStr) : [];
        localKyc.push(newKycMock);
        localStorage.setItem("atozworks_kyc", JSON.stringify(localKyc));
      } catch (err: any) {
        if (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22) {
          console.warn("Local storage quota exceeded. Saving KYC details with placeholder photos.");
          try {
            const localKycStr = localStorage.getItem("atozworks_kyc");
            const localKyc = localKycStr ? JSON.parse(localKycStr) : [];
            const strippedKyc = { ...newKycMock, selfie: "/images/placeholder_selfie.png", idCard: "/images/placeholder_id.png" };
            localKyc.push(strippedKyc);
            // Clean base64 from all elements in the array to free space
            const cleanedKyc = localKyc.map((k: any) => ({
              ...k,
              selfie: k.selfie && k.selfie.startsWith("data:") ? "/images/placeholder_selfie.png" : k.selfie,
              idCard: k.idCard && k.idCard.startsWith("data:") ? "/images/placeholder_id.png" : k.idCard
            }));
            localStorage.setItem("atozworks_kyc", JSON.stringify(cleanedKyc));
          } catch (retryErr) {
            console.error("Failed to save KYC retry: ", retryErr);
          }
        } else {
          console.error("Local storage KYC error: ", err);
        }
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Main content grid */}
      <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        {/* Left Side: Perks */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#0088ff]/10 to-[#82cdff]/15 text-[#0066cc] border border-[#82cdff]/20 rounded-full text-xs font-bold uppercase tracking-wide">
              Partner Network
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] text-slate-800">
              Grow Your Business. Earn More in Hosur.
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              We connect skilled technicians and professionals to active bookings. We handle billing and customer service, so you focus on what you do best.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: ShieldCheck, title: "Selfie & ID Verification", desc: "A secure digital verification process to qualify you for direct bookings." },
              { icon: HeartHandshake, title: "Fair Weekly Payouts", desc: "Weekly direct transfers to your bank account with complete transparency." },
              { icon: Wrench, title: "Work On Your Own Terms", desc: "Define your working times and select the Hosur zones you prefer to serve." }
            ].map((perk, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/60 border border-[#82cdff]/10 shadow-sm hover:border-[#82cdff]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#82cdff]/15 text-[#0066cc] flex items-center justify-center flex-shrink-0">
                  <perk.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{perk.title}</h4>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Step Progression Container */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#82cdff]/20 rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#82cdff]/5 rounded-full blur-2xl pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {!success ? (
                <div className="space-y-4">
                  {/* Step indicators */}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-[#82cdff]/10 pb-4">
                    <span className={step === 1 ? "text-[#0088ff]" : "text-slate-400"}>1. Personal Info</span>
                    <span className="h-[2px] bg-slate-200 flex-grow mx-4 rounded-full" />
                    <span className={step === 2 ? "text-[#0088ff]" : "text-slate-400"}>2. Selfie & ID Verification</span>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-600 font-medium flex items-center gap-2">
                      <span>⚠️ {errorMsg}</span>
                    </div>
                  )}

                  {/* STEP 1: PERSONAL DETAILS */}
                  {step === 1 && (
                    <motion.form
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={proceedToStep2}
                      className="space-y-4"
                    >
                      <div className="mb-2">
                        <h2 className="text-2xl font-extrabold text-slate-800">Partner Details</h2>
                        <p className="text-slate-500 text-xs mt-1">Start by filling out your basic profile information.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Ramesh Kumar" 
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                              type="tel" 
                              required
                              pattern="[0-9]{10}"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="9876543201" 
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="ramesh@example.com" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="password" 
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Create password" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Years of Experience</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                              type="number" 
                              required
                              min="0"
                              value={formData.experience}
                              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                              placeholder="5" 
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Primary Skill</label>
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition font-medium"
                          >
                            {categories.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-95 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        Next: Verify Identity & Selfie
                      </button>
                    </motion.form>
                  )}

                  {/* STEP 2: CAMERA UPLOADS (SELFIE + ID CARD) */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="text-2xl font-extrabold text-slate-800">Identify Validation</h2>
                        <p className="text-slate-500 text-xs mt-1">Please provide a selfie photo and picture of your Aadhaar or PAN card.</p>
                      </div>

                      {/* Video Player Modal during capture */}
                      {isCameraActive && activeCaptureType && (
                        <div className="rounded-2xl border-2 border-[#0088ff] overflow-hidden bg-black aspect-video flex flex-col justify-between relative shadow-inner">
                          <video 
                            id="webcam-preview" 
                            autoPlay 
                            playsInline 
                            className={`w-full h-full object-cover ${activeCaptureType === "selfie" ? "scale-x-[-1]" : ""}`} 
                          />
                          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 z-10">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="bg-[#0088ff] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#0077ee] transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Camera size={14} /> Capture {activeCaptureType === "selfie" ? "Selfie" : "ID Card"}
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="bg-slate-800/80 text-white px-4 py-2.5 rounded-xl font-bold text-xs backdrop-blur-sm hover:bg-slate-900 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!isCameraActive && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* SELFIE CARD */}
                          <div className="border border-[#82cdff]/20 rounded-3xl p-5 bg-slate-50 relative flex flex-col justify-between h-56">
                            <div>
                              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                                Selfie Verification
                                {selfie && <span className="bg-emerald-100 text-emerald-600 rounded-full p-0.5"><Check size={10} className="stroke-[3]" /></span>}
                              </h4>
                              <p className="text-slate-400 text-[10px] mt-0.5 leading-normal">Required for your client-facing service profile picture.</p>
                            </div>

                            {selfie ? (
                              <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 mt-2">
                                <img src={selfie} className="w-full h-full object-cover" alt="Selfie Preview" />
                                <button
                                  type="button"
                                  onClick={() => startCamera("selfie")}
                                  className="absolute right-2 bottom-2 bg-slate-800/80 text-white p-1.5 rounded-lg backdrop-blur-sm text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-slate-900"
                                >
                                  <RefreshCw size={10} /> Retake
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center flex-grow py-3 space-y-3">
                                <button
                                  type="button"
                                  onClick={() => startCamera("selfie")}
                                  className="inline-flex items-center gap-1.5 bg-[#82cdff]/15 hover:bg-[#82cdff]/25 text-[#0066cc] border border-[#82cdff]/20 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition"
                                >
                                  <Camera size={14} /> Live Capture Selfie
                                </button>
                                
                                <label className="text-xs text-slate-500 hover:text-[#0088ff] font-semibold underline cursor-pointer inline-flex items-center gap-1">
                                  <Upload size={12} /> Upload Selfie File
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, "selfie")} 
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* ID CARD CARD */}
                          <div className="border border-[#82cdff]/20 rounded-3xl p-5 bg-slate-50 relative flex flex-col justify-between h-56">
                            <div>
                              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                                Aadhaar / PAN ID
                                {idCard && <span className="bg-emerald-100 text-emerald-600 rounded-full p-0.5"><Check size={10} className="stroke-[3]" /></span>}
                              </h4>
                              <p className="text-slate-400 text-[10px] mt-0.5 leading-normal">Submit a photo of your official ID document for KYC checks.</p>
                            </div>

                            {idCard ? (
                              <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 mt-2">
                                <img src={idCard} className="w-full h-full object-cover" alt="ID Card Preview" />
                                <button
                                  type="button"
                                  onClick={() => startCamera("idCard")}
                                  className="absolute right-2 bottom-2 bg-slate-800/80 text-white p-1.5 rounded-lg backdrop-blur-sm text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-slate-900"
                                >
                                  <RefreshCw size={10} /> Retake
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center flex-grow py-3 space-y-3">
                                <button
                                  type="button"
                                  onClick={() => startCamera("idCard")}
                                  className="inline-flex items-center gap-1.5 bg-[#82cdff]/15 hover:bg-[#82cdff]/25 text-[#0066cc] border border-[#82cdff]/20 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition"
                                >
                                  <Camera size={14} /> Live Capture ID
                                </button>
                                
                                <label className="text-xs text-slate-500 hover:text-[#0088ff] font-semibold underline cursor-pointer inline-flex items-center gap-1">
                                  <Upload size={12} /> Upload ID Photo
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, "idCard")} 
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                      {/* Navigation Controls */}
                      <div className="flex justify-between items-center gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="px-6 py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer text-sm"
                        >
                          Back to Details
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading || !selfie || !idCard}
                          className="flex-grow bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Submit Verification Application"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div 
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6 shadow-[0_8px_20px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Application Submitted!</h3>
                  <p className="text-slate-600 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
                    Thank you, <strong>{formData.name}</strong>. Your profile has been successfully registered with photo verifications. 
                    {mockMode ? (
                      <span className="block text-blue-600 font-bold mt-1 text-xs">Registered in Local Mock Mode</span>
                    ) : (
                      <span className="block text-emerald-600 font-bold mt-1 text-xs">Saved directly into MongoDB Database</span>
                    )}
                  </p>
                  
                  <div className="bg-[#e3f2fd]/20 p-5 rounded-2xl border border-[#82cdff]/15 max-w-sm mx-auto text-left mb-6 space-y-3">
                    <div className="text-xs text-slate-700">
                      <span className="font-bold block mb-1">What happens next?</span>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-normal">
                        <li>Our administrator team will review your selfie & official document.</li>
                        <li>We will verify details and activate your provider account status.</li>
                        <li>We will contact you at <strong>+91 {formData.phone}</strong> for final verification.</li>
                      </ol>
                    </div>
                  </div>

                  <Link 
                    href="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-md shadow-[#82cdff]/15"
                  >
                    Return to Homepage
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#82cdff]/20 py-6 text-center text-xs text-slate-400">
        <div>AtoZ Works © 2026. Partner Onboarding Gateway.</div>
      </footer>
    </div>
  );
}

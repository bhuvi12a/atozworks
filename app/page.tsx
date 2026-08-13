"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Wind, Sparkles, Truck, Droplets, Zap, Paintbrush, 
  ShieldCheck, Clock, ArrowRight, Hammer, Camera, Bug, Wrench, Search,
  LayoutGrid, Flower, Tv, Snowflake, Laptop, Smartphone, Bike, Car,
  Scissors, Utensils, Pill, ShoppingBag, Flame, Building, FileText,
  Home as HomeIcon, Heart, Store, Flower2, ChefHat, Leaf, ShoppingCart,
  Music, Shirt, Smile, Sliders, Activity, Mic, Package, Award, Phone
} from "lucide-react";
import { ALL_SERVICES, CATEGORIES, getServiceKeyword } from "./services-config";

// CUSTOM 3D TILT COMPONENT
const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={className}
      style={{ perspective: 1000 }}
    >
      <motion.div
        whileHover={{ rotateX: 5, rotateY: -5, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="h-full w-full relative"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allServicesOpen, setAllServicesOpen] = useState(false);

  const featuredServices = [
    { name: "House Shifting", slug: "house-shifting", desc: "Safe packing & moving.", icon: Truck, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/house_shifting.png" },
    { name: "Plumbing", slug: "plumbing", desc: "Leak repairs & installations.", icon: Droplets, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/plumbing.png" },
    { name: "Electrical", slug: "electrical", desc: "Wiring & safety checks.", icon: Zap, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/electrical.png" },
    { name: "Painting", slug: "painting", desc: "Interior & exterior painting.", icon: Paintbrush, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/painting.png" },
    { name: "Carpentry", slug: "carpentry", desc: "Furniture & modular kitchens.", icon: Hammer, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/carpentry.png" },
    { name: "CCTV", slug: "cctv", desc: "Security camera installation.", icon: Camera, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/cctv.png" },
    { name: "Appliance", slug: "appliance", desc: "Fridge, washing machine fix.", icon: Wrench, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/appliance.png" },
    { name: "Pest Control", slug: "pest-control", desc: "Termites & bug elimination.", icon: Bug, color: "from-[#82cdff] to-[#0088ff]", image: "/images/services/pest-control.png" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f8fbfe] to-white text-[#0f172a] font-sans overflow-x-hidden">
      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="backdrop-blur-xl bg-white/90 border border-[#82cdff]/30 rounded-2xl px-4 md:px-6 py-2 md:py-1 flex items-center justify-between shadow-[0_8px_30px_rgba(130,200,255,0.08)] relative z-20">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="AtoZ Works Logo" className="h-10 sm:h-12 md:h-24 w-auto object-contain hover:scale-105 transition-all duration-300 transform" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium text-slate-500 hover:text-[#0088ff] transition">Services</a>
            <a href="#why" className="text-sm font-medium text-slate-500 hover:text-[#0088ff] transition">Why Us</a>
            <a href="#about" className="text-sm font-medium text-slate-500 hover:text-[#0088ff] transition">About & Franchise</a>
            <Link href="/bookings" className="text-sm font-medium text-slate-500 hover:text-[#0088ff] transition">
              My Bookings
            </Link>
            <Link href="/partner/register" className="text-sm font-semibold text-[#0088ff] hover:underline transition">
              Join as Partner
            </Link>
            <a href="#services" className="inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white px-5 py-2 rounded-xl hover:brightness-95 transition cursor-pointer shadow-md shadow-[#82cdff]/20">
              Book Now <ArrowRight size={14} />
            </a>
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile Nav Dropdown overlay */}
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#82cdff]/30 flex flex-col gap-4 md:hidden z-10 mx-2">
            <a href="#services" className="font-semibold text-slate-700 hover:text-[#0088ff] px-2 py-1" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#why" className="font-semibold text-slate-700 hover:text-[#0088ff] px-2 py-1" onClick={() => setMenuOpen(false)}>Why Us</a>
            <a href="#about" className="font-semibold text-slate-700 hover:text-[#0088ff] px-2 py-1" onClick={() => setMenuOpen(false)}>About & Franchise</a>
            <Link href="/bookings" className="font-semibold text-slate-700 hover:text-[#0088ff] px-2 py-1">My Bookings</Link>
            <Link href="/partner/register" className="font-semibold text-[#0088ff] hover:underline px-2 py-1">Join as Partner</Link>
            <a href="#services" className="text-center bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-3.5 rounded-xl font-bold shadow-md shadow-[#82cdff]/30" onClick={() => setMenuOpen(false)}>Book Now</a>
          </motion.div>
        )}
      </header>

      <main className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        
        {/* UNCONVENTIONAL HERO - BENTO GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          
          {/* Main Headline Card */}
          <TiltCard className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#82cdff] to-[#0077ff] rounded-[2rem] p-8 md:p-12 flex flex-col justify-between text-white shadow-[0_20px_60px_-15px_rgba(130,200,255,0.4)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <motion.span 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold border border-white/20 text-white"
                >
                  HOSUR’S #1 HOME SERVICES
                </motion.span>
                <motion.a 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  href="tel:+919360651833"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/25 hover:bg-white/35 backdrop-blur-md rounded-full text-xs font-bold border border-white/30 text-white transition-all shadow-sm hover:scale-105"
                >
                  <Phone size={12} className="animate-pulse text-blue-100" /> Call +91 93606 51833
                </motion.a>
              </div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tighter mb-4"
              >
                Complete Home Services at Your Doorstep.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-base text-blue-50 max-w-lg"
              >
                From AC Repair to House Shifting, connect with verified professionals in minutes.
              </motion.p>

              {/* Dynamic Autocomplete Search Bar */}
              <div className="relative mt-6 max-w-md w-full text-slate-800 z-30">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for AC repair, plumbing, cleaning..."
                    className="w-full pl-5 pr-12 py-3.5 bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl text-white placeholder-blue-100/75 focus:outline-none focus:bg-white focus:text-[#0f172a] focus:placeholder-slate-400 focus:border-white transition shadow-lg text-sm font-medium"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-100 group-focus-within:text-slate-500 w-5 h-5 pointer-events-none" />
                </div>
                {searchQuery && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-40">
                    {ALL_SERVICES.filter(s => 
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 ? (
                      ALL_SERVICES.filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.desc.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((s) => (
                        <Link
                          key={s.slug}
                          href={`/services/${s.slug}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition border-b border-slate-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#82cdff] to-[#0088ff] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <s.icon size={16} />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-slate-800 text-xs">{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium leading-normal">{s.desc}</div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-4 text-xs text-slate-400 text-center font-semibold">No services found matching &quot;{searchQuery}&quot;</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 w-full">
              <button onClick={() => setAllServicesOpen(true)} className="inline-flex items-center justify-center gap-2 bg-white text-[#0066cc] px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:-translate-y-1 transition-transform cursor-pointer w-full sm:w-auto">
                Book a Service <ArrowRight size={18} />
              </button>
              <button onClick={() => setAllServicesOpen(true)} className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold hover:bg-white/10 transition cursor-pointer w-full sm:w-auto">
                Explore Services
              </button>
            </div>
          </TiltCard>

          {/* Team Image Card */}
          <TiltCard className="md:col-span-1 md:row-span-2 rounded-[2rem] overflow-hidden relative group bg-slate-100 border border-[#82cdff]/20 shadow-lg min-h-[380px]">
            <img 
              src="/images/team.jpg" 
              alt="AtoZ Work Solutions Team" 
              className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 text-white z-10">
              <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/10">
                Verified Experts
              </span>
              <h3 className="text-xl font-extrabold tracking-tight">Hosur Service Crew</h3>
              <p className="text-xs text-blue-100/80 mt-1 leading-normal">Background-checked & safety-certified technicians</p>
            </div>
          </TiltCard>
        </section>

        {/* Dynamic Trust Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16 md:mb-24 text-center">
          {[
            { icon: ShieldCheck, title: "100% Verified", desc: "Police background checks" },
            { icon: Clock, title: "Same Day Service", desc: "Booking to doorstep in hours" },
            { icon: Wrench, title: "5,000+ Jobs Done", desc: "Highest satisfaction in Hosur" },
            { icon: Wind, title: "Warranty Covered", desc: "30-day service protection" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-sm border border-[#82cdff]/15 rounded-2xl p-5 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#82cdff]/15 text-[#0066cc] flex items-center justify-center mb-3">
                <stat.icon size={20} />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">{stat.title}</h4>
              <p className="text-slate-400 text-xs mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </section>

        {/* ASYMMETRIC SERVICE GRID */}
        <section id="services" className="mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Premium Services.</h2>
              <p className="text-slate-500 text-lg mt-3 max-w-md">Carefully curated home solutions for modern living.</p>
            </div>
            <button 
              onClick={() => setAllServicesOpen(true)} 
              className="text-[#0088ff] font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              View all services <ArrowRight size={16} />
            </button>
          </div>

          {/* Magazine Style Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 auto-rows-[160px] sm:auto-rows-[180px] md:auto-rows-[220px]">
            
            {/* Featured Big Card (AC Repair) */}
            <Link href="/services/ac-repair" className="col-span-2 row-span-2 block">
              <TiltCard className="h-full w-full rounded-[2rem] overflow-hidden relative group bg-gradient-to-br from-[#82cdff] to-[#0066ff] border border-[#82cdff]/30 shadow-md">
                <img 
                  src="/images/services/ac_repair.png" 
                  alt="AC Repair" 
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-60 mix-blend-overlay group-hover:opacity-100 group-hover:mix-blend-normal"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-3 border border-white/20">
                    <Wind size={14} /> Most Popular
                  </div>
                  <h3 className="text-3xl font-extrabold mb-1">AC Repair</h3>
                  <p className="text-gray-300 text-sm">Premium Quality</p>
                </div>
              </TiltCard>
            </Link>

            {/* Small Cards (House Shifting, Plumbing, Electrical, Painting) */}
            {featuredServices.slice(0, 4).map((s) => (
              <Link key={s.name} href={`/services/${s.slug}`} className="block">
                <TiltCard className="h-full w-full rounded-[2rem] overflow-hidden relative group bg-white border border-[#82cdff]/15 shadow-[0_8px_30px_rgba(130,200,255,0.06)] hover:shadow-md transition-shadow">
                  <img 
                    src={s.image} 
                    alt={s.name} 
                    className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  <div className="p-4 sm:p-5 md:p-6 h-full flex flex-col justify-between relative z-20">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
                      <s.icon className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                    </div>
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-white transition-colors duration-300 mb-0.5 md:mb-1">{s.name}</h4>
                      <p className="text-[10px] md:text-xs text-slate-400 group-hover:text-blue-100 transition-colors duration-300">Verified Pros</p>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            ))}

            {/* Dark Wide Card (Cleaning) */}
            <Link href="/services/home-cleaning" className="col-span-2 block">
              <TiltCard className="h-full w-full rounded-[2rem] overflow-hidden relative group bg-gradient-to-br from-[#82cdff] to-[#0066ff] p-8 text-white shadow-md">
                <img 
                  src="/images/services/home_cleaning.png" 
                  alt="Home Cleaning" 
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-45 mix-blend-overlay group-hover:opacity-100 group-hover:mix-blend-normal"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10" />
                <div className="relative z-20 h-full flex flex-col justify-between">
                  <Sparkles size={40} className="opacity-40 group-hover:opacity-80 transition-opacity" />
                  <div>
                    <h3 className="text-2xl font-extrabold mb-1">Home Cleaning</h3>
                    <p className="text-blue-100 text-sm max-w-[280px]">Deep cleaning & sanitization for a spotless home.</p>
                    <div className="mt-4 inline-flex items-center gap-2 font-semibold text-sm border-b border-white/50 pb-1 group-hover:border-white transition">
                      Book Now <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Link>

            {/* Remaining Small Cards (Carpentry, CCTV, Appliance, Pest Control) */}
            {featuredServices.slice(4, 8).map((s) => (
               <Link key={s.name} href={`/services/${s.slug}`} className="block">
                 <TiltCard className="h-full w-full rounded-[2rem] overflow-hidden relative group bg-white border border-[#82cdff]/15 shadow-[0_8px_30px_rgba(130,200,255,0.06)] hover:shadow-md transition-shadow">
                   <img 
                     src={s.image} 
                     alt={s.name} 
                     className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                   />
                   <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                   <div className="p-4 sm:p-5 md:p-6 h-full flex flex-col justify-between relative z-20">
                     <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
                       <s.icon className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                     </div>
                     <div>
                       <h4 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-white transition-colors duration-300 mb-0.5 md:mb-1">{s.name}</h4>
                       <p className="text-[10px] md:text-xs text-slate-400 group-hover:text-blue-100 transition-colors duration-300">Verified Pros</p>
                     </div>
                   </div>
                 </TiltCard>
               </Link>
            ))}

            {/* Custom Service Request Card to balance layout */}
            <button onClick={() => setAllServicesOpen(true)} className="col-span-2 block w-full text-left bg-transparent border-none p-0 outline-none cursor-pointer">
              <TiltCard className="h-full w-full rounded-[2rem] overflow-hidden relative group bg-[#002266] border border-[#82cdff]/20 p-8 text-white shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Custom Request</span>
                    <Sparkles className="text-blue-400 w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold mb-1">Need a Custom Service?</h3>
                    <p className="text-blue-200 text-xs max-w-sm">Can&apos;t find what you are looking for? Contact us and we will find verified professionals for you.</p>
                    <div className="mt-4 inline-flex items-center gap-2 font-semibold text-xs border-b border-white/50 pb-1 group-hover:border-white transition">
                      Request Custom Booking <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </TiltCard>
            </button>

          </div>
        </section>

        {/* INTERACTIVE WHY US SECTION */}
        <section id="why" className="mb-24 md:mb-32 bg-gradient-to-br from-[#0033aa] to-[#001155] border border-[#82cdff]/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/2" />
          
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 relative z-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">Why AtoZ Works is different.</h2>
              <p className="text-blue-200 text-base md:text-lg leading-relaxed mb-6 md:mb-8">Founded and led by our visionary CEO Praveen Billa, we don&apos;t just connect you with workers. We guarantee a premium, seamless experience from booking to completion, built on absolute trust and quality service.</p>
              <a href="#services" className="inline-flex items-center justify-center gap-3 bg-white text-[#0033aa] px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold hover:-translate-y-1 transition-transform shadow-[0_10px_25px_-5px_rgba(0,50,200,0.2)] cursor-pointer w-full md:w-auto">
                Get Started <ArrowRight size={18} />
              </a>
            </div>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, title: "Strict Background Checks", desc: "Police verified and highly trained professionals, not random freelancers." },
                { icon: Clock, title: "Always On Time", desc: "If we're late, the service is on us. Punctuality is our core metric." },
                { icon: Sparkles, title: "Premium Equipment", desc: "Our partners arrive with professional-grade tools and cleaning supplies." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col sm:flex-row items-start gap-4 p-5 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:border-white/30 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#0033aa] transition-all flex-shrink-0">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                    <p className="text-blue-100 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT & FRANCHISE SECTION */}
        <section id="about" className="mb-24 md:mb-32 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* About Company Card */}
          <div className="bg-white border border-[#82cdff]/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#82cdff]/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-[#0066cc] border border-[#82cdff]/20 rounded-full text-xs font-bold mb-6">
                <Award size={14} className="text-[#0088ff]" /> About AtoZ Works
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 mb-6 leading-tight">
                4 Years of Excellence in Hosur
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                AtoZ Works has been Hosur’s premier, go-to home services network for over 4 successful years. Under the leadership of our CEO, <strong className="text-[#0066cc]">Praveen Billa</strong>, we have built a reputation for trust, quality, and complete transparency.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                We handle everything from simple plumbing and electrical repairs to complex modular carpentry, home cleaning, and full-scale house shifting. Our trained professionals ensure that every job meets the highest standards of safety and punctuality.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 text-center">
              <div>
                <div className="text-3xl font-extrabold text-[#0066cc]">4+</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Years Running</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#0066cc]">5,000+</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Jobs Completed</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#0066cc]">100%</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Verified Pros</div>
              </div>
            </div>
          </div>

          {/* Franchise Card */}
          <div className="bg-gradient-to-br from-[#0a1e3f] to-[#000a1a] border border-blue-900/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066cc]/10 rounded-full blur-[80px] pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 text-blue-300 border border-white/10 rounded-full text-xs font-bold mb-6">
                <Store size={14} className="text-blue-300" /> Franchise Opportunity
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Partner with Hosur’s #1 Home Services Brand
              </h3>
              <p className="text-blue-100/80 leading-relaxed mb-6">
                AtoZ Works is now open for franchise partners! Expand your entrepreneurial journey by partnering with a trusted brand. We offer a proven, high-demand business model, advanced booking software, marketing support, and technician training.
              </p>
              <p className="text-blue-100/80 leading-relaxed mb-8">
                Whether you want to launch operations in your neighborhood or expand to another city, we provide end-to-end operational setup and direct client lead pipelines.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-6">
              <a 
                href="https://wa.me/919360651833?text=Hi%20Praveen%20Billa,%20I'm%20interested%20in%20the%20AtoZ%20Works%20Franchise%20opportunity."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:brightness-95 transition-all text-center"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.885-6.963C16.53 1.928 14.06 1.01 11.43 1.01c-5.436 0-9.861 4.42-9.865 9.852-.001 1.77.478 3.49 1.38 5.02L1.93 20.48l4.717-1.326zM17.436 14.39c-.314-.157-1.858-.916-2.146-1.022-.289-.105-.499-.157-.709.157-.21.314-.813.996-.996 1.206-.184.21-.367.236-.68.078-1.564-.78-2.61-1.378-3.661-3.19-.277-.478.277-.444.792-1.474.087-.174.043-.327-.021-.458-.066-.13-.578-1.393-.792-1.906-.21-.505-.44-.436-.6-.444-.148-.007-.318-.008-.488-.008-.17 0-.446.064-.68.314-.233.25-1.07 1.045-1.07 2.548 0 1.502 1.092 2.955 1.243 3.155.152.2.215.328.675 1.03.713 1.086 1.55 1.636 2.514 2.05.618.266 1.176.248 1.62.182.493-.074 1.516-.618 1.728-1.216.21-.598.21-1.11.147-1.216-.063-.105-.23-.157-.544-.314z" />
                </svg>
                Apply for Franchise
              </a>
              <a 
                href="tel:+919360651833"
                className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/50 text-white px-6 py-4 rounded-2xl font-bold transition-all text-center"
              >
                <Phone size={16} /> Contact CEO Directly
              </a>
            </div>
          </div>
        </section>

        {/* PARTNER SIGNUP PROMO SECTION */}
        <section className="mb-24 md:mb-32 bg-white border border-[#82cdff]/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-[#82cdff]/10 to-[#0088ff]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#0088ff]/5 to-[#82cdff]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-xl">
            <span className="inline-block px-3 py-1 bg-[#82cdff]/15 text-[#0066cc] border border-[#82cdff]/20 rounded-full text-xs font-bold">
              EARN WITH ATOZ WORKS
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-800">
              Become an AtoZ Works Service Partner
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              Are you a skilled technician, cleaner, plumber, or electrician? Join Hosur&apos;s most trusted home services platform. Get a steady flow of customers, set your own working hours, and grow your earnings.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 text-xs font-semibold text-slate-500 pt-2">
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                ✓ Weekly Payouts
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                ✓ Flexible Hours
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                ✓ Steady Jobs Flow
              </span>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
            <Link 
              href="/partner/register" 
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold shadow-lg hover:brightness-95 transition-all text-center cursor-pointer"
            >
              Register as Partner <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* POPULAR SERVICES IN HOSUR (SEO LINKS) */}
        <section className="mb-12 bg-white/40 backdrop-blur-sm border border-[#82cdff]/15 rounded-[2rem] p-8 md:p-10 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0088ff]" />
            Popular Service Locations & Searches in Hosur
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-semibold text-slate-500">
            {[...ALL_SERVICES]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((service) => (
                <Link 
                  key={service.slug} 
                  href={`/services/${service.slug}`} 
                  className="hover:text-[#0088ff] transition-all bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#82cdff] flex-shrink-0" />
                  <span className="truncate">{getServiceKeyword(service.name)}</span>
                </Link>
              ))}
          </div>
        </section>

        {/* PREMIUM MULTI-COLUMN FOOTER */}
        <footer className="border-t border-[#82cdff]/20 pt-16 pb-12 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
            {/* Column 1: Company Profile */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#82cdff] to-[#0088ff] flex items-center justify-center text-white font-bold text-xs shadow-sm">AW</div>
                <span className="text-lg font-extrabold tracking-tight text-slate-800">AtoZ Works</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Hosur’s most trusted home services platform. Running successfully across 4 years, delivering premium, background-verified technician solutions directly to your doorstep.
              </p>
              <div className="text-xs text-slate-400 font-semibold">
                CEO: <span className="text-slate-700 font-bold">Praveen Billa</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Quick Links</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><a href="#services" className="text-slate-500 hover:text-[#0088ff] transition">Services</a></li>
                <li><a href="#why" className="text-slate-500 hover:text-[#0088ff] transition">Why Us</a></li>
                <li><a href="#about" className="text-slate-500 hover:text-[#0088ff] transition">About Us</a></li>
                <li><Link href="/bookings" className="text-slate-500 hover:text-[#0088ff] transition">My Bookings</Link></li>
              </ul>
            </div>

            {/* Column 3: Partner & Franchise */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Contact & Franchise</h4>
              <ul className="space-y-3.5 text-sm font-medium">
                <li>
                  <Link href="/partner/register" className="inline-flex items-center gap-1.5 text-[#0088ff] hover:underline font-semibold">
                    Join as Service Partner
                  </Link>
                </li>
                <li>
                  <div className="text-xs text-slate-400">Franchise Inquiry / Customer Support:</div>
                  <a 
                    href="https://wa.me/919360651833" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-800 px-4.5 py-2.5 rounded-xl font-bold transition-all text-xs"
                  >
                    <svg className="w-4.5 h-4.5 text-emerald-600 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.885-6.963C16.53 1.928 14.06 1.01 11.43 1.01c-5.436 0-9.861 4.42-9.865 9.852-.001 1.77.478 3.49 1.38 5.02L1.93 20.48l4.717-1.326zM17.436 14.39c-.314-.157-1.858-.916-2.146-1.022-.289-.105-.499-.157-.709.157-.21.314-.813.996-.996 1.206-.184.21-.367.236-.68.078-1.564-.78-2.61-1.378-3.661-3.19-.277-.478.277-.444.792-1.474.087-.174.043-.327-.021-.458-.066-.13-.578-1.393-.792-1.906-.21-.505-.44-.436-.6-.444-.148-.007-.318-.008-.488-.008-.17 0-.446.064-.68.314-.233.25-1.07 1.045-1.07 2.548 0 1.502 1.092 2.955 1.243 3.155.152.2.215.328.675 1.03.713 1.086 1.55 1.636 2.514 2.05.618.266 1.176.248 1.62.182.493-.074 1.516-.618 1.728-1.216.21-.598.21-1.11.147-1.216-.063-.105-.23-.157-.544-.314z" />
                    </svg>
                    +91 93606 51833
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* SEO Services Footer Links */}
          <div className="border-t border-[#82cdff]/15 pt-8 mb-8">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">All Home & Business Services in Hosur</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-xs text-slate-500 font-medium">
              {ALL_SERVICES.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`} className="hover:text-[#0088ff] transition">
                  {getServiceKeyword(s.name)}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-[#82cdff]/15 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-slate-400 text-center sm:text-left">
            <div>
              © {new Date().getFullYear()} AtoZ Works. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-medium">
              <Link href="/privacy-policy" className="hover:text-[#0088ff] transition">Privacy Policy</Link>
              <Link href="/terms-and-conditions" className="hover:text-[#0088ff] transition">Terms of Service</Link>
              <Link href="/refund-policy" className="hover:text-[#0088ff] transition">Refund Policy</Link>
              <a href="tel:+919360651833" className="hover:text-[#0088ff] transition">Support Hotline</a>
            </div>
          </div>
        </footer>
      </main>

      {/* All Services Categorized Modal */}
      <AnimatePresence>
        {allServicesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setAllServicesOpen(false)} />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white/95 backdrop-blur-xl border border-[#82cdff]/30 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative z-10 p-5 md:p-10 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8 sticky top-0 bg-white/95 backdrop-blur-md pb-4 border-b border-slate-100 z-20">
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">Our Services</h3>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Flat <span className="text-[#0088ff] font-bold">₹199 visiting charge</span> applies to all bookings. Pay on completion.
                  </p>
                </div>
                <button
                  onClick={() => setAllServicesOpen(false)}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Categorized Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {Object.values(CATEGORIES).map((categoryName) => {
                  const categoryServices = ALL_SERVICES.filter(s => s.category === categoryName);
                  return (
                    <div key={categoryName} className="space-y-4">
                      <div className="py-1 border-b border-slate-100 mb-2">
                        <h4 className="font-extrabold text-slate-800 tracking-tight text-sm flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#0088ff]" />
                          {categoryName}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        {categoryServices.map((service) => {
                          const IconComp = service.icon;
                          return (
                            <Link
                              key={service.slug}
                              href={`/services/${service.slug}`}
                              onClick={() => setAllServicesOpen(false)}
                              className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-sky-50/70 border border-transparent hover:border-[#82cdff]/20 transition group"
                            >
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${service.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm transform group-hover:scale-105 transition-transform`}>
                                <IconComp size={16} />
                              </div>
                              <div className="text-left">
                                <h5 className="font-bold text-slate-800 text-xs group-hover:text-[#0088ff] transition">{service.name}</h5>
                                <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">{service.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LucideIcon,
  Wind, Sparkles, Truck, Droplets, Zap, Paintbrush, 
  Hammer, Camera, Wrench, Bug, ShieldCheck, Clock, 
  ArrowLeft, ChevronDown, CheckCircle2, Star, 
  Calendar, MapPin, User, Phone, Check
} from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import { ALL_SERVICES } from "../../services-config";

// Service Data with detailed specs
const SERVICES_DATA: Record<string, {
  name: string;
  desc: string;
  price: string;
  icon: LucideIcon;
  color: string;
  image: string;
  features: string[];
  about: string;
  faqs: { q: string; a: string }[];
}> = {
  "ac-repair": {
    name: "AC Repair",
    desc: "Diagnostics & gas refilling for all models.",
    price: "₹299",
    icon: Wind,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/ac_repair.png",
    features: [
      "Deep filter & coil cleaning",
      "Gas leak detection & top-up",
      "Diagnostics & component repair",
      "30-day post-service warranty",
      "Police-verified professional technicians"
    ],
    about: "Keep your home cool and fresh with our premium AC Repair and servicing. Our expert technicians perform multi-point checks to ensure optimal cooling efficiency, identify hidden leaks, and provide long-lasting repairs for all split and window AC brands.",
    faqs: [
      { q: "How often should I service my AC?", a: "We recommend getting your AC serviced every 6 months to maintain high energy efficiency and dust-free air cooling." },
      { q: "Is gas refilling covered under standard service?", a: "Standard service includes diagnostics and cleaning. Gas refilling is charged additionally depending on the gas level required, starting from the base package rate." },
      { q: "What brands do you service?", a: "We service all major Split and Window AC brands including Daikin, Voltas, LG, Samsung, Blue Star, Carrier, and others." }
    ]
  },
  "home-cleaning": {
    name: "Home Cleaning",
    desc: "Deep cleaning & sanitization for a spotless home.",
    price: "₹499",
    icon: Sparkles,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/home_cleaning.png",
    features: [
      "Kitchen and bathroom deep sanitization",
      "Sofa, carpet, and mattress vacuuming",
      "Floor scrubbing & window pane cleaning",
      "Eco-friendly, child-safe cleaning agents",
      "Highly trained cleaning crews"
    ],
    about: "Transform your house into a spotless home with our comprehensive cleaning services. We use professional-grade machines and safe, non-toxic sanitizing solutions to clean every corner, removing deep dirt, dust, stains, and bacteria.",
    faqs: [
      { q: "Do I need to provide cleaning materials?", a: "No, our crew brings all necessary cleaning equipment, vacuum cleaners, and premium solutions with them." },
      { q: "How long does a deep home cleaning session take?", a: "Depending on the size of the house, a standard 2BHK deep cleaning session takes approximately 4 to 6 hours." },
      { q: "Is it safe for pets and children?", a: "Yes, we use organic, eco-friendly, and odorless cleaning products that are completely safe for households with children and pets." }
    ]
  },
  "house-shifting": {
    name: "House Shifting",
    desc: "Safe packing & moving with expert handlers.",
    price: "₹1,999",
    icon: Truck,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/house_shifting.png",
    features: [
      "Multi-layered bubble & foam packing",
      "Experienced loaders and closed transport trucks",
      "Furniture dismantling and reassembly",
      "Real-time location tracking",
      "Transit damage coverage option"
    ],
    about: "Move house without the stress. Our packers and movers ensure your belongings are packed using multi-layer protective materials, handled with absolute care, and delivered safely to your new location.",
    faqs: [
      { q: "Do you provide packing materials?", a: "Yes, we provide bubble wraps, heavy-duty cardboard boxes, tapes, and protective blankets as part of the shifting package." },
      { q: "How is the final price calculated?", a: "The base price starts at ₹1,999. The final estimate depends on the volume of goods, the distance between locations, and the floor level of the houses." },
      { q: "Can you dismantle my modular kitchen or AC?", a: "We provide basic dismantling and reassembly of beds and wardrobes. For AC uninstallation/installation or complex modular kitchen work, we recommend adding our specific technicians during checkout." }
    ]
  },
  "plumbing": {
    name: "Plumbing",
    desc: "Leak repairs & installations.",
    price: "₹199",
    icon: Droplets,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/plumbing.png",
    features: [
      "Tap, mixer, and shower installation",
      "Pipe blockages & leak detection",
      "Water tank cleaning & servicing",
      "Emergency plumbing response",
      "High-quality durable spare parts"
    ],
    about: "Resolve all your plumbing issues quickly with our certified plumbers. From fixing minor pipe leaks and blocked drains to installing premium bath fittings and water meters, we offer clean, hassle-free plumbing work.",
    faqs: [
      { q: "Are the plumbing spare parts included in the price?", a: "No, the booking fee covers the labor charges. Any spare parts required (like valves, pipes, or taps) will be billed separately based on actual cost, or you can purchase them yourself." },
      { q: "Do you provide a warranty on repairs?", a: "Yes, we provide a 15-day service warranty on all plumbing repair work." },
      { q: "How fast can you send a plumber?", a: "For normal bookings, we schedule same-day appointments. In case of emergency leaks, we aim to deliver help within 60 to 90 minutes." }
    ]
  },
  "electrical": {
    name: "Electrical",
    desc: "Wiring, repairs, & safety checks.",
    price: "₹149",
    icon: Zap,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/electrical.png",
    features: [
      "Switch, socket, and fan installation",
      "Complete home wiring and inspection",
      "Short circuit & fuse diagnostics",
      "Inverter installation and repairs",
      "Fully equipped, safety-certified electricians"
    ],
    about: "Don't let electrical issues interrupt your day. Our background-checked electricians are trained to safely handle all electrical tasks, ensuring your switches, appliances, and home wiring function safely and efficiently.",
    faqs: [
      { q: "Is it safe to get wiring done during the rainy season?", a: "Our electricians follow strict safety protocols, wear insulated safety gear, and ensure there is no water contact during repairs." },
      { q: "What should I do in case of a short circuit?", a: "Immediately switch off the main MCB power switch and contact us. Do not touch any burnt sockets or wires yourself." }
    ]
  },
  "painting": {
    name: "Painting",
    desc: "Interior & exterior painting.",
    price: "₹999",
    icon: Paintbrush,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/painting.png",
    features: [
      "Wall sanding and primer application",
      "Premium plastic paint & textures",
      "Furniture & floor protection covering",
      "Post-painting cleanup",
      "Expert color consultation"
    ],
    about: "Give your walls a fresh, vibrant look. Our professional painting service includes wall putty, primer, and high-quality paint coats. We protect your furniture and clean up completely after the job is done.",
    faqs: [
      { q: "How do I select the right colors?", a: "Our painting consultants bring catalog brochures and provide color consultancy to help you select matching shades for your rooms." },
      { q: "How long does painting a 3BHK flat take?", a: "A standard interior painting job for a 3BHK takes about 4 to 7 days, including wall preparation and paint drying time." }
    ]
  },
  "carpentry": {
    name: "Carpentry",
    desc: "Furniture repair & assembly.",
    price: "₹399",
    icon: Hammer,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/carpentry.png",
    features: [
      "Door and window lock adjustments",
      "Modular kitchen cabinet repairs",
      "Custom shelves & furniture assembly",
      "Hinge and handle replacements",
      "Experienced custom carpenters"
    ],
    about: "From fixing squeaky door hinges to installing custom cabinets, our skilled carpenters provide precise woodwork. We help you repair, restore, or build wooden furniture with excellent craftsmanship.",
    faqs: [
      { q: "Can you customize wood shelves?", a: "Yes, our carpenters can cut and install custom shelves based on your specific storage needs and space availability." },
      { q: "Do you assemble online purchased furniture?", a: "Yes, we provide furniture assembly services for products bought online (e.g., Ikea, Amazon, Pepperfry)." }
    ]
  },
  "cctv": {
    name: "CCTV",
    desc: "Security camera installation.",
    price: "₹499",
    icon: Camera,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/cctv.png",
    features: [
      "IP & Analog camera installation",
      "DVR/NVR configuration & wiring",
      "Mobile view app setup",
      "Hidden cable routing",
      "System health checks & diagnostics"
    ],
    about: "Secure your property with our professional security camera installation. We help you select the optimal camera placement, route cables cleanly, configure DVR/NVR recording, and set up remote mobile viewing.",
    faqs: [
      { q: "Do you sell CCTV cameras?", a: "We install cameras provided by you, or we can supply high-quality cameras from top brands (like Hikvision, CP Plus, Dahua) at competitive prices." },
      { q: "Can I view my camera feed on my phone?", a: "Yes, as long as you have an internet connection at home, our technician will set up the mobile app so you can view live feeds anywhere." }
    ]
  },
  "appliance": {
    name: "Appliance Repair",
    desc: "Fridge, washing machine fix.",
    price: "₹199",
    icon: Wrench,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/appliance.png",
    features: [
      "Front & Top load washing machine repair",
      "Single/Double door fridge diagnostics",
      "Microwave heating element fix",
      "Genuine spare parts replacement",
      "30-day service warranty"
    ],
    about: "Get your essential household appliances running again. Our experienced repair technicians diagnose faults quickly and replace damaged parts with genuine manufacturer-approved components.",
    faqs: [
      { q: "What is the visitation charge?", a: "The base booking fee of ₹199 covers the technician's visit and diagnosis. Repair labor and parts will be quoted after inspection." },
      { q: "Do you use original spare parts?", a: "Yes, we only source and install original spare parts from authorized brand distributors to ensure long-term durability." }
    ]
  },
  "pest-control": {
    name: "Pest Control",
    desc: "Termites & bug elimination.",
    price: "₹699",
    icon: Bug,
    color: "from-[#82cdff] to-[#0088ff]",
    image: "/images/services/pest-control.png",
    features: [
      "Odorless gel treatment for cockroaches",
      "Anti-termite wood treatment",
      "Bed bug eradication spraying",
      "Eco-friendly, safe chemicals",
      "Multi-month protection plans"
    ],
    about: "Protect your home from pests. We use certified, odorless, and government-approved sprays and gels that are safe for pets and children, ensuring effective elimination of insects and rodents.",
    faqs: [
      { q: "Do we need to empty the kitchen before treatment?", a: "For gel treatments, there is no need to empty cabinets. For spray treatments, we recommend covering open food items and kitchen utensils." },
      { q: "Is the chemical safe for pets?", a: "Yes, we use advanced eco-friendly chemicals that are safe for pets, though we recommend keeping pets in a separate room during the spray process." }
    ]
  }
};

function createBookingPayload(
  name: string,
  phone: string,
  date: string,
  address: string,
  serviceName: string,
  finalPrice: number
) {
  return {
    id: `b_${Date.now()}`,
    bookingNumber: `AW-${date.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: name,
    phone: phone,
    email: `${name.toLowerCase().replace(/ /g, "")}@example.com`,
    service: serviceName,
    provider: "Robert Electrician", // Mock assigned provider
    date: date,
    price: `₹${finalPrice.toLocaleString("en-IN")}`,
    discount: undefined,
    couponCode: undefined,
    status: "PENDING",
    lat: 12.7408 + (Math.random() - 0.5) * 0.02, // Hosur region offset
    lng: 77.8253 + (Math.random() - 0.5) * 0.02,
    address: address
  };
}

export default function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const serviceKey = slug as keyof typeof SERVICES_DATA;
  let service = SERVICES_DATA[serviceKey];

  if (!service) {
    const matchedService = ALL_SERVICES.find(s => s.slug === slug);
    if (matchedService) {
      service = {
        name: matchedService.name,
        desc: matchedService.desc,
        price: matchedService.price,
        icon: matchedService.icon,
        color: matchedService.color,
        image: matchedService.image,
        features: [
          "Professional and background-checked technicians",
          "All tools, equipment and necessary materials provided",
          "High-quality service with a 15-day satisfaction warranty",
          "Safe, verified, and background-checked experts"
        ],
        about: `Enjoy a premium and hassle-free experience with our ${matchedService.name} service. We connect you with the most skilled, police-verified specialists in Hosur who bring advanced equipment and high-quality materials to ensure your complete satisfaction.`,
        faqs: [
          { q: `How do I book the ${matchedService.name} service?`, a: `Simply fill out the appointment booking form on this page with your name, phone number, preferred date, time slot, and location. Our system will confirm your appointment instantly.` },
          { q: `What is the ₹199 visiting charge?`, a: `The ₹199 visiting charge is mandatory for all service bookings. It covers the expert's travel time, initial inspection, and detailed diagnostics at your doorstep.` },
          { q: `Are the cost of replacement parts or extra materials included?`, a: `No. The basic visit charge includes inspection and diagnostic labor. Any additional materials, replacement components, or wholesale supplies will be discussed with you and billed separately with your approval.` }
        ]
      };
    }
  }

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", phone: "", date: "", timeSlot: "09:00 AM - 12:00 PM", address: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const getPricing = () => {
    const basePrice = parseInt(service.price.replace(/[^\d]/g, ""));
    return {
      finalPrice: basePrice
    };
  };

  const { finalPrice } = getPricing();

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8fbfe] text-[#0f172a]">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-4">Service Not Found</h1>
          <p className="text-slate-500 mb-6">The service page you are looking for does not exist.</p>
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white rounded-xl font-bold shadow-lg hover:brightness-95 transition">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.address) return;
    
    setLoading(true);

    const bookingPayload = createBookingPayload(
      formData.name,
      formData.phone,
      formData.date,
      formData.address,
      service.name,
      finalPrice
    );

    // 1. Attempt to sync with PostgreSQL backend database
    try {
      await fetch("/_/backend/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: serviceKey,
          addressId: "saved-address-uuid-from-profile",
          bookingDate: formData.date,
          bookingTime: formData.timeSlot.split(" ")[0],
          materialCharges: 0,
        }),
      });
    } catch (err) {
      console.warn("Backend API server not reachable. Running in localStorage fallback mode.");
    }

    // 2. Persist in shared client localStorage database
    const localBookingsStr = localStorage.getItem("atozworks_bookings");
    const localBookings = localBookingsStr ? JSON.parse(localBookingsStr) : [];
    localBookings.unshift(bookingPayload);
    try {
      localStorage.setItem("atozworks_bookings", JSON.stringify(localBookings));
    } catch (err) {
      console.error("Failed writing bookings to local storage: ", err);
    }

    setTimeout(() => {
      setLoading(false);
      setBookingSuccess(true);
    }, 1200);
  };

  const ServiceIcon = service.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f8fbfe] to-white text-[#0f172a] font-sans overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="backdrop-blur-xl bg-white/80 border border-[#82cdff]/30 rounded-2xl px-6 py-1 flex items-center justify-between shadow-[0_8px_30px_rgba(130,200,255,0.08)]">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="AtoZ Works Logo" className="h-16 md:h-24 w-auto object-contain hover:scale-115 transition-all duration-300 transform" />
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/bookings" className="text-sm font-medium text-slate-500 hover:text-[#0088ff] transition">
              My Bookings
            </Link>
            <Link href="/#services" className="text-sm font-medium text-slate-500 hover:text-[#0088ff] transition flex items-center gap-1">
              <ArrowLeft size={14} /> Back to Services
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-8">
          <Link href="/" className="hover:text-[#0088ff] transition">Home</Link>
          <span>/</span>
          <span className="text-slate-700">{service.name}</span>
        </div>

        {/* Hero Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-20">
          {/* Details Column */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Service Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-xl flex-shrink-0`}>
                  <ServiceIcon size={32} />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-[#82cdff]/15 text-[#0066cc] border border-[#82cdff]/20 rounded-full text-xs font-bold mb-2">Verified Professional</span>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">{service.name}</h1>
                  <p className="text-slate-500 text-lg leading-relaxed">{service.desc}</p>
                </div>
              </div>

              {/* Review / Ratings Indicator */}
              <div className="bg-white border border-[#82cdff]/15 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer Satisfaction</span>
                  <div className="text-2xl font-extrabold text-[#0088ff] mt-1">Top Rated Service</div>
                  <div className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <span>•</span> Mandatory Visiting Charge: ₹199
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-amber-500 font-bold text-sm">
                    <Star size={16} fill="currentColor" />
                    <span>4.8/5 Rating</span>
                  </div>
                  <span className="text-xs text-slate-400">Based on 1,200+ bookings</span>
                </div>
              </div>

              {/* About Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-3">About the Service</h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">{service.about}</p>
              </div>

              {/* Features checklist */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">What&apos;s Included</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-[#82cdff]/15 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-700">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Why Us Indicators */}
            <div className="border-t border-[#82cdff]/20 pt-6 mt-6 grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#82cdff]/15 text-[#0066cc] flex-shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">100% Safe</h4>
                  <p className="text-[10px] text-slate-500">Insured work</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#82cdff]/15 text-[#0066cc] flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">On-Time</h4>
                  <p className="text-[10px] text-slate-500">Punctual pros</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#82cdff]/15 text-[#0066cc] flex-shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Premium</h4>
                  <p className="text-[10px] text-slate-500">Top-grade tools</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual & Booking Card Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Image Card with Zoom */}
            <div className="relative rounded-[2rem] overflow-hidden group shadow-md border border-[#82cdff]/20 aspect-video lg:aspect-[4/3] bg-slate-100">
              <img 
                src={service.image} 
                alt={service.name} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-slate-800 pointer-events-none">
                <div className="flex items-center gap-1.5 backdrop-blur-md bg-white/40 px-3 py-1 rounded-full text-xs font-semibold">
                  <Clock size={12} /> Same-day Booking
                </div>
              </div>
            </div>

            {/* Interactive Booking Card */}
            <div className="bg-white border border-[#82cdff]/20 rounded-[2rem] p-6 shadow-md relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!bookingSuccess ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleBooking}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">Book Appointment</h3>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Your Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe" 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            placeholder="9876543210" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Select Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="date" 
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition placeholder-slate-400/50" 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Preferred Time Slot</label>
                      <select 
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition"
                      >
                        <option>09:00 AM - 12:00 PM</option>
                        <option>12:00 PM - 03:00 PM</option>
                        <option>03:00 PM - 06:00 PM</option>
                        <option>06:00 PM - 09:00 PM</option>
                      </select>
                    </div>

                    <div>
                      <GoogleMap 
                        mode="picker"
                        onLocationSelect={(lat, lng, address) => {
                          setFormData(prev => ({ ...prev, address }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Service Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                        <textarea 
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                          placeholder="Your complete address..." 
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#82cdff] transition resize-none placeholder-slate-400/50" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#82cdff] to-[#0088ff] text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                    <span className="text-[10px] text-[#0066cc] text-center block font-semibold mt-1">* Mandatory visiting charge of ₹199 applies. Pay on completion.</span>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6 shadow-[0_8px_20px_rgba(16,185,129,0.1)]">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Booking Confirmed!</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                      Awesome, {formData.name}. Our technician will arrive on <strong>{formData.date}</strong> between <strong>{formData.timeSlot}</strong>.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-xs mx-auto text-left mb-6 text-xs text-slate-700 space-y-1">
                      <div><strong>Service:</strong> {service.name}</div>
                      <div><strong>Scheduled Date:</strong> {formData.date}</div>
                      <div><strong>Time Slot:</strong> {formData.timeSlot}</div>
                      <div><strong>Contact:</strong> +91 {formData.phone}</div>
                    </div>
                    <button 
                      onClick={() => {
                        setBookingSuccess(false);
                      }}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      Book Another Service
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-extrabold tracking-tight mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl">
            {service.faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-[#82cdff]/15 rounded-2xl overflow-hidden shadow-sm"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-800 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${activeFaq === idx ? "rotate-180 text-[#0088ff]" : ""}`} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-slate-600 border-t border-[#82cdff]/10 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Other Services Carousel */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Other Services</h2>
              <p className="text-slate-500 text-sm mt-1">Check out our other professional solutions for your home.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(SERVICES_DATA)
              .filter(([k]) => k !== slug)
              .slice(0, 4)
              .map(([key, s]) => {
                const ItemIcon = s.icon;
                return (
                  <Link 
                    key={key} 
                    href={`/services/${key}`}
                    className="bg-white border border-[#82cdff]/15 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#82cdff]/50 transition flex flex-col justify-between group h-44 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-sm transform group-hover:rotate-6 transition-transform flex-shrink-0`}>
                      <ItemIcon size={20} />
                    </div>
                    <div className="mt-4">
                      <h4 className="font-bold text-slate-800 group-hover:text-[#0088ff] transition text-sm mb-1">{s.name}</h4>
                      <p className="text-xs text-slate-400 font-semibold">Verified Pro</p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      </main>

      {/* PREMIUM MULTI-COLUMN FOOTER */}
      <footer className="border-t border-[#82cdff]/20 pt-16 pb-12 mt-20 max-w-6xl mx-auto px-4">
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
              <li><Link href="/#services" className="text-slate-500 hover:text-[#0088ff] transition">Services</Link></li>
              <li><Link href="/#why" className="text-slate-500 hover:text-[#0088ff] transition">Why Us</Link></li>
              <li><Link href="/#about" className="text-slate-500 hover:text-[#0088ff] transition">About Us</Link></li>
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

        <div className="border-t border-[#82cdff]/15 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} AtoZ Works. All rights reserved.
          </div>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-[#0088ff] transition">Privacy Policy</a>
            <a href="#" className="hover:text-[#0088ff] transition">Terms of Service</a>
            <a href="#" className="hover:text-[#0088ff] transition">Refund Policy</a>
            <a href="tel:+919360651833" className="hover:text-[#0088ff] transition">Support Hotline</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

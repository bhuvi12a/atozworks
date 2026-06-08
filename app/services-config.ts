import {
  LucideIcon,
  Droplets, Zap, Paintbrush, LayoutGrid, Flower, Hammer, Tv, Snowflake, Wrench, Laptop,
  Smartphone, Bike, Car, Scissors, Utensils, Pill, ShoppingBag, Flame, Camera,
  Truck, Sparkles, Building, Package, FileText, Home as HomeIcon, Heart, Store, Flower2,
  ChefHat, Leaf, ShoppingCart, Music, Shirt, Smile, Sliders, Activity, Mic
} from "lucide-react";

export interface ServiceItem {
  name: string;
  slug: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  image: string;
  category: string;
  price: string;
}

export const CATEGORIES = {
  HOME_MAINTENANCE: "Home Maintenance & Repairs",
  VEHICLES_PERSONAL: "Vehicles & Personal Care",
  LOGISTICS_BUSINESS: "Logistics & Business",
  EVENTS_SUPPLIES: "Events & Supplies"
};

export const ALL_SERVICES: ServiceItem[] = [
  // COLUMN 1: Home Maintenance & Repairs
  {
    name: "Plumbing",
    slug: "plumbing",
    desc: "Leak repairs, tap installations & piping.",
    icon: Droplets,
    color: "from-blue-400 to-blue-600",
    image: "/images/services/plumbing.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹199"
  },
  {
    name: "Electrician",
    slug: "electrical",
    desc: "Wiring, switchboard installation & safety checks.",
    icon: Zap,
    color: "from-amber-400 to-amber-600",
    image: "/images/services/electrical.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹149"
  },
  {
    name: "Painting",
    slug: "painting",
    desc: "Wall painting, primers & designer texture coats.",
    icon: Paintbrush,
    color: "from-pink-400 to-pink-600",
    image: "/images/services/painting.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹999"
  },
  {
    name: "Tiles Work",
    slug: "tiles-work",
    desc: "Precision floor tiling & kitchen wall tiles.",
    icon: LayoutGrid,
    color: "from-slate-400 to-slate-600",
    image: "/images/services/tiles_work.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹399"
  },
  {
    name: "Flower Works",
    slug: "flower-works",
    desc: "Exquisite floral arrangements & garlands.",
    icon: Flower,
    color: "from-rose-400 to-rose-600",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹299"
  },
  {
    name: "Wood Works",
    slug: "wood-works",
    desc: "Cabinet repair, wooden shelves & carpentry.",
    icon: Hammer,
    color: "from-orange-500 to-amber-800",
    image: "/images/services/carpentry.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹399"
  },
  {
    name: "TV Mechanic",
    slug: "tv-mechanic",
    desc: "LED/LCD TV mounting, repair & setup.",
    icon: Tv,
    color: "from-indigo-400 to-indigo-600",
    image: "/images/services/appliance.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹199"
  },
  {
    name: "AC Mechanic",
    slug: "ac-repair",
    desc: "AC cleaning, gas filling & compressor fix.",
    icon: Snowflake,
    color: "from-sky-400 to-sky-600",
    image: "/images/services/ac_repair.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹299"
  },
  {
    name: "Fridge Mechanic",
    slug: "fridge-mechanic",
    desc: "Single/double door refrigerator diagnostics.",
    icon: Wrench,
    color: "from-cyan-400 to-cyan-600",
    image: "/images/services/appliance.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹199"
  },
  {
    name: "RO Mechanic",
    slug: "ro-mechanic",
    desc: "Water filter cartridge swap & leak fix.",
    icon: Droplets,
    color: "from-teal-400 to-teal-600",
    image: "/images/services/plumbing.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹199"
  },
  {
    name: "System Service",
    slug: "system-service",
    desc: "OS installation, RAM upgrade & laptop repairs.",
    icon: Laptop,
    color: "from-blue-500 to-indigo-700",
    image: "/images/services/system_service.png",
    category: CATEGORIES.HOME_MAINTENANCE,
    price: "₹299"
  },

  // COLUMN 2: Vehicles & Personal Care
  {
    name: "Mobile Service",
    slug: "mobile-service",
    desc: "Screen replacement, software & mic repair.",
    icon: Smartphone,
    color: "from-purple-400 to-purple-600",
    image: "/images/services/system_service.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹199"
  },
  {
    name: "Bike Mechanic",
    slug: "bike-mechanic",
    desc: "Engine tuning, oil change & break diagnostics.",
    icon: Bike,
    color: "from-emerald-400 to-emerald-600",
    image: "/images/services/appliance.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹199"
  },
  {
    name: "Car Mechanic",
    slug: "car-mechanic",
    desc: "Brake service, engine tuning & dent fixing.",
    icon: Car,
    color: "from-blue-600 to-blue-800",
    image: "/images/services/car_booking.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹299"
  },
  {
    name: "Bike Washing",
    slug: "bike-washing",
    desc: "High-pressure foam wash & chrome polishing.",
    icon: Droplets,
    color: "from-sky-500 to-sky-700",
    image: "/images/services/plumbing.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹99"
  },
  {
    name: "Car Washing",
    slug: "car-washing",
    desc: "Deep foam wash, interior vacuuming & dashboard polish.",
    icon: Droplets,
    color: "from-blue-500 to-cyan-600",
    image: "/images/services/car_booking.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹299"
  },
  {
    name: "Hair Cut / Beautician",
    slug: "hair-cut-beautician",
    desc: "Professional haircutting & grooming at home.",
    icon: Scissors,
    color: "from-purple-500 to-pink-600",
    image: "/images/services/hair_salon.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹199"
  },
  {
    name: "Food Delivery",
    slug: "food-delivery",
    desc: "Hot meal pickups and deliveries at your step.",
    icon: Utensils,
    color: "from-orange-400 to-red-600",
    image: "/images/services/food_delivery.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹49"
  },
  {
    name: "Medicine Delivery",
    slug: "medicine-delivery",
    desc: "Prescription drug pickups and deliveries.",
    icon: Pill,
    color: "from-emerald-500 to-teal-700",
    image: "/images/services/medicine_delivery.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹49"
  },
  {
    name: "Vegetable Delivery",
    slug: "vegetable-delivery",
    desc: "Fresh, handpicked organic farm vegetables.",
    icon: ShoppingBag,
    color: "from-green-400 to-green-600",
    image: "/images/services/vegetable_delivery.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹49"
  },
  {
    name: "Photo Shoot",
    slug: "photo-shoot",
    desc: "Event, portrait & family photography.",
    icon: Camera,
    color: "from-violet-500 to-fuchsia-700",
    image: "/images/services/photo_shoot.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹999"
  },
  {
    name: "Welding Works",
    slug: "welding-works",
    desc: "Metal gate, window grill & railing repairs.",
    icon: Flame,
    color: "from-yellow-600 to-red-700",
    image: "/images/services/welding_works.png",
    category: CATEGORIES.VEHICLES_PERSONAL,
    price: "₹399"
  },

  // COLUMN 3: Logistics & Business
  {
    name: "House Shifting",
    slug: "house-shifting",
    desc: "Premium bubble wrapping, loading & shifting.",
    icon: Truck,
    color: "from-blue-500 to-indigo-800",
    image: "/images/services/house_shifting.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹1999"
  },
  {
    name: "House Cleaning",
    slug: "home-cleaning",
    desc: "Kitchen deep scrubbing & full house sanitizing.",
    icon: Sparkles,
    color: "from-sky-400 to-blue-500",
    image: "/images/services/home_cleaning.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹499"
  },
  {
    name: "Office Cleaning",
    slug: "office-cleaning",
    desc: "Desks, glass panes and carpets cleaning.",
    icon: Building,
    color: "from-slate-500 to-slate-800",
    image: "/images/services/office_cleaning.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹999"
  },
  {
    name: "Loading",
    slug: "loading",
    desc: "Heavy machinery, furniture & box loading.",
    icon: Package,
    color: "from-amber-600 to-amber-800",
    image: "/images/services/house_shifting.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹399"
  },
  {
    name: "Unloading",
    slug: "unloading",
    desc: "Unpacking and placing heavy items safely.",
    icon: Package,
    color: "from-yellow-500 to-amber-700",
    image: "/images/services/house_shifting.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹399"
  },
  {
    name: "Govt. Document Broker",
    slug: "govt-document-broker",
    desc: "Assistance with files, licenses & applications.",
    icon: FileText,
    color: "from-zinc-500 to-zinc-700",
    image: "/images/services/document_broker.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹199"
  },
  {
    name: "Real Estate Mediator",
    slug: "real-estate-mediator",
    desc: "Plot, rental, and commercial properties search.",
    icon: HomeIcon,
    color: "from-emerald-600 to-teal-800",
    image: "/images/services/real_estate.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹199"
  },
  {
    name: "Tailor",
    slug: "tailor",
    desc: "Blouse stitching, alterations & custom fits at home.",
    icon: Scissors,
    color: "from-pink-500 to-rose-700",
    image: "/images/services/tailor_stitching.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹199"
  },
  {
    name: "Marriage Works",
    slug: "marriage-works",
    desc: "Wedding stage decor & ceremony planning.",
    icon: Heart,
    color: "from-red-500 to-rose-700",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹4999"
  },
  {
    name: "Mall Booking",
    slug: "mall-booking",
    desc: "Promotional events space booking in malls.",
    icon: Store,
    color: "from-indigo-600 to-violet-800",
    image: "/images/services/mall_booking.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹1999"
  },
  {
    name: "Flower Design",
    slug: "flower-design",
    desc: "Exotic floral background and backdrop design.",
    icon: Flower2,
    color: "from-rose-500 to-orange-500",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.LOGISTICS_BUSINESS,
    price: "₹499"
  },

  // COLUMN 4: Events & Supplies
  {
    name: "Catering Department",
    slug: "catering-department",
    desc: "Multi-cuisine buffet & plate service.",
    icon: ChefHat,
    color: "from-amber-500 to-red-600",
    image: "/images/services/catering.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹2999"
  },
  {
    name: "Car Booking",
    slug: "car-booking",
    desc: "Wedding and trip premium cars booking.",
    icon: Car,
    color: "from-indigo-500 to-blue-700",
    image: "/images/services/car_booking.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹1499"
  },
  {
    name: "Auto Booking",
    slug: "auto-booking",
    desc: "Goods and passenger auto hire.",
    icon: Truck,
    color: "from-yellow-500 to-orange-600",
    image: "/images/services/car_booking.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹299"
  },
  {
    name: "Vegetables",
    slug: "vegetables-wholesale",
    desc: "Bulk vegetables supply for functions & hotels.",
    icon: Leaf,
    color: "from-green-500 to-emerald-700",
    image: "/images/services/vegetable_delivery.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹499"
  },
  {
    name: "Grocery Items",
    slug: "grocery-wholesale",
    desc: "Bulk grains, oil & pantry provisions.",
    icon: ShoppingCart,
    color: "from-teal-500 to-cyan-700",
    image: "/images/services/grocery_delivery.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹999"
  },
  {
    name: "Drums",
    slug: "drums",
    desc: "Traditional drums & band sets for events.",
    icon: Music,
    color: "from-orange-400 to-amber-700",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹999"
  },
  {
    name: "Dress",
    slug: "dress-rental",
    desc: "Wedding & ceremonial dress rentals.",
    icon: Shirt,
    color: "from-purple-500 to-violet-700",
    image: "/images/services/hair_salon.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹499"
  },
  {
    name: "Welcome Givers",
    slug: "welcome-givers",
    desc: "Event hostess and greeter staff hire.",
    icon: Smile,
    color: "from-rose-400 to-pink-600",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹999"
  },
  {
    name: "DJ",
    slug: "dj-service",
    desc: "Premium speakers, lighting & professional tracks DJ.",
    icon: Sliders,
    color: "from-indigo-500 to-fuchsia-600",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹1999"
  },
  {
    name: "Dance Program",
    slug: "dance-program",
    desc: "Choreographed troupe performances.",
    icon: Activity,
    color: "from-rose-500 to-red-600",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹2999"
  },
  {
    name: "Singers",
    slug: "singers-vocalists",
    desc: "Melodious live vocalists and orchestra.",
    icon: Mic,
    color: "from-blue-500 to-violet-600",
    image: "/images/services/flower_decor.png",
    category: CATEGORIES.EVENTS_SUPPLIES,
    price: "₹1999"
  }
];

export function getServiceKeyword(name: string): string {
  const lowerName = name.toLowerCase();
  if (
    lowerName.endsWith("work") || 
    lowerName.endsWith("works") || 
    lowerName.endsWith("service") || 
    lowerName.endsWith("services") || 
    lowerName.endsWith("mechanic") || 
    lowerName.endsWith("broker") || 
    lowerName.endsWith("mediator") || 
    lowerName.endsWith("department") ||
    lowerName.includes("design") ||
    lowerName.includes("shoot") ||
    lowerName.includes("singers") ||
    lowerName.includes("welcome") ||
    lowerName.includes("beautician")
  ) {
    return `${name} in Hosur`;
  }
  if (
    lowerName.includes("delivery") || 
    lowerName.includes("washing") || 
    lowerName.includes("booking") || 
    lowerName.includes("rental") || 
    lowerName.includes("control") || 
    lowerName.includes("program") ||
    lowerName.includes("dj") ||
    lowerName.includes("drums")
  ) {
    return `${name} services in Hosur`;
  }
  if (lowerName === "vegetables") {
    return "Vegetable supply in Hosur";
  }
  if (lowerName === "grocery items") {
    return "Grocery supply in Hosur";
  }
  if (lowerName === "dress") {
    return "Dress rentals in Hosur";
  }
  return `${name} works in Hosur`;
}

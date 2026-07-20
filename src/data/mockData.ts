export type DisasterType = "flood" | "cyclone" | "landslide" | "drought";
export type RequestStatus = "pending" | "accepted" | "assigned" | "completed" | "cancelled";
export type RequestType = "food" | "water" | "medicine" | "medical" | "rescue" | "shelter" | "other";
export type Priority = "critical" | "high" | "medium" | "low";
export type UserRole = "victim" | "volunteer" | "ngo" | "admin";
export type VolunteerSkill = "boat" | "medical" | "driving" | "cooking" | "search_rescue" | "first_aid" | "communication";
export type InventoryStatus = "adequate" | "low" | "critical";

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
  district: string;
}

export interface Alert {
  id: string;
  type: DisasterType;
  severity: "extreme" | "severe" | "moderate" | "minor";
  title: string;
  description: string;
  location: string;
  timestamp: string;
  affectedAreas: string[];
  evacuationOrder: boolean;
}

export interface TimelineEvent {
  status: RequestStatus;
  timestamp: string;
  note?: string;
  actor?: string;
}

export interface HelpRequest {
  id: string;
  victimName: string;
  victimPhone: string;
  type: RequestType;
  priority: Priority;
  status: RequestStatus;
  description: string;
  location: GeoLocation;
  createdAt: string;
  updatedAt: string;
  assignedVolunteer?: string;
  ngoId?: string;
  timeline: TimelineEvent[];
}

export interface Volunteer {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  skills: VolunteerSkill[];
  location: GeoLocation;
  isAvailable: boolean;
  missionsCompleted: number;
  hoursServed: number;
  rating: number;
  joinedAt: string;
  badges: string[];
  languages: string[];
  ngoId?: string;
}

export interface Shelter {
  id: string;
  name: string;
  location: GeoLocation;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  hasMedical: boolean;
  hasFood: boolean;
  contactPhone: string;
  managedBy: string;
  status: "open" | "full" | "closed";
  distance: number;
}

export interface NGO {
  id: string;
  name: string;
  initials: string;
  description: string;
  verified: boolean;
  location: string;
  contactEmail: string;
  contactPhone: string;
  totalRelief: number;
  activeCampaigns: number;
  volunteerCount: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  ngoId: string;
  targetArea: string;
  status: "active" | "completed" | "paused";
  startDate: string;
  endDate: string;
  assignedVolunteers: string[];
  requestsHandled: number;
  totalNeeded: number;
  progress: number;
  disasterType: DisasterType;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "food" | "water" | "medicine" | "shelter" | "clothing" | "other";
  quantity: number;
  unit: string;
  lastUpdated: string;
  minimumStock: number;
  location: string;
  status: InventoryStatus;
}

export interface Notification {
  id: string;
  type: "alert" | "mission" | "update" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: Priority;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  quote: string;
  rating: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  category: string;
  image: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended" | "pending";
  joinedAt: string;
  location: string;
  verified: boolean;
}

export interface ChartDataPoint {
  date: string;
  requests: number;
  completed: number;
  volunteers: number;
}

export interface MapMarker {
  id: string;
  type: "victim" | "volunteer" | "shelter" | "medical" | "relief";
  label: string;
  location: GeoLocation;
  detail: string;
  status?: string;
}

export const ALERTS: Alert[] = [
  {
    id: "alert-1",
    type: "flood",
    severity: "extreme",
    title: "Severe Flash Flooding — Sylhet Division",
    description: "Unprecedented rainfall has caused severe flooding across Sylhet, Sunamganj, and Habiganj. Water levels rising rapidly. Immediate evacuation required for low-lying areas.",
    location: "Sylhet Division",
    timestamp: "2024-06-15T08:30:00Z",
    affectedAreas: ["Sylhet Sadar", "Sunamganj", "Habiganj", "Moulvibazar"],
    evacuationOrder: true,
  },
  {
    id: "alert-2",
    type: "cyclone",
    severity: "severe",
    title: "Cyclone Warning — Coastal Districts",
    description: "Cyclonic storm approaching Bay of Bengal. Expected landfall near Chittagong–Cox's Bazar coast within 48 hours. Wind speed 120–140 kmph.",
    location: "Chittagong Division",
    timestamp: "2024-06-14T14:00:00Z",
    affectedAreas: ["Cox's Bazar", "Chittagong", "Feni", "Noakhali"],
    evacuationOrder: true,
  },
  {
    id: "alert-3",
    type: "landslide",
    severity: "moderate",
    title: "Landslide Risk — Hill Districts",
    description: "Heavy rainfall increased landslide risk in Rangamati, Bandarban, and Khagrachhari. Hillside residents should relocate immediately.",
    location: "Chittagong Hill Tracts",
    timestamp: "2024-06-14T10:15:00Z",
    affectedAreas: ["Rangamati", "Bandarban", "Khagrachhari"],
    evacuationOrder: false,
  },
];

export const HELP_REQUESTS: HelpRequest[] = [
  {
    id: "req-001",
    victimName: "Mohammad Rafiqul Islam",
    victimPhone: "+8801712345678",
    type: "rescue",
    priority: "critical",
    status: "assigned",
    description: "Family of 6 trapped on roof. Water level is 8 feet. Two elderly and one infant. Need boat rescue immediately.",
    location: { lat: 24.8949, lng: 91.8687, label: "Sylhet Sadar, Ward 5", district: "Sylhet" },
    createdAt: "2024-06-15T09:15:00Z",
    updatedAt: "2024-06-15T10:45:00Z",
    assignedVolunteer: "vol-001",
    timeline: [
      { status: "pending", timestamp: "2024-06-15T09:15:00Z", note: "Request submitted via RescueNet", actor: "System" },
      { status: "accepted", timestamp: "2024-06-15T09:45:00Z", note: "Request accepted and verified", actor: "RescueNet Admin" },
      { status: "assigned", timestamp: "2024-06-15T10:45:00Z", note: "Volunteer Karim Ahmed assigned with rescue boat", actor: "BRAC Coordinator" },
    ],
  },
  {
    id: "req-002",
    victimName: "Fatema Begum",
    victimPhone: "+8801812345678",
    type: "food",
    priority: "high",
    status: "accepted",
    description: "No food for 2 days. Family of 8 including 3 children under 5. Currently at Sylhet Government School shelter.",
    location: { lat: 24.9045, lng: 91.8611, label: "Govt. School Shelter, Sylhet", district: "Sylhet" },
    createdAt: "2024-06-15T11:20:00Z",
    updatedAt: "2024-06-15T12:00:00Z",
    timeline: [
      { status: "pending", timestamp: "2024-06-15T11:20:00Z", note: "Request submitted", actor: "System" },
      { status: "accepted", timestamp: "2024-06-15T12:00:00Z", note: "Being processed by BRAC Relief Team", actor: "BRAC Relief Team" },
    ],
  },
  {
    id: "req-003",
    victimName: "Abdul Karim",
    victimPhone: "+8801912345678",
    type: "medicine",
    priority: "critical",
    status: "pending",
    description: "Diabetic patient needs insulin urgently. Running out in 4 hours. Located in Mirpur — water makes road inaccessible.",
    location: { lat: 23.8103, lng: 90.4125, label: "Mirpur-10, Dhaka", district: "Dhaka" },
    createdAt: "2024-06-15T13:45:00Z",
    updatedAt: "2024-06-15T13:45:00Z",
    timeline: [
      { status: "pending", timestamp: "2024-06-15T13:45:00Z", note: "Request submitted", actor: "System" },
    ],
  },
  {
    id: "req-004",
    victimName: "Rina Akter",
    victimPhone: "+8801512345678",
    type: "shelter",
    priority: "medium",
    status: "completed",
    description: "House completely flooded. Need emergency shelter for family of 5.",
    location: { lat: 24.3636, lng: 88.6241, label: "Rajshahi Sadar", district: "Rajshahi" },
    createdAt: "2024-06-14T15:20:00Z",
    updatedAt: "2024-06-15T08:00:00Z",
    timeline: [
      { status: "pending", timestamp: "2024-06-14T15:20:00Z", note: "Request submitted", actor: "System" },
      { status: "accepted", timestamp: "2024-06-14T16:00:00Z", note: "Accepted by Red Crescent", actor: "Red Crescent" },
      { status: "assigned", timestamp: "2024-06-14T17:30:00Z", note: "Shelter arranged at RC Rajshahi centre", actor: "Red Crescent" },
      { status: "completed", timestamp: "2024-06-15T08:00:00Z", note: "Family relocated to shelter safely", actor: "Volunteer Raju" },
    ],
  },
  {
    id: "req-005",
    victimName: "Jamal Hossain",
    victimPhone: "+8801612345678",
    type: "water",
    priority: "high",
    status: "pending",
    description: "No clean drinking water for 3 days. 12 families affected. Surrounded by flood water — none drinkable.",
    location: { lat: 22.3569, lng: 91.7832, label: "Cox's Bazar Sadar", district: "Cox's Bazar" },
    createdAt: "2024-06-15T07:30:00Z",
    updatedAt: "2024-06-15T07:30:00Z",
    timeline: [
      { status: "pending", timestamp: "2024-06-15T07:30:00Z", note: "Request submitted", actor: "System" },
    ],
  },
  {
    id: "req-006",
    victimName: "Shirin Akhter",
    victimPhone: "+8801634567890",
    type: "medical",
    priority: "high",
    status: "accepted",
    description: "Pregnant woman, 8 months. Cannot reach hospital. Needs immediate medical attention at home.",
    location: { lat: 23.7461, lng: 90.3742, label: "Keraniganj, Dhaka", district: "Dhaka" },
    createdAt: "2024-06-15T14:20:00Z",
    updatedAt: "2024-06-15T14:50:00Z",
    timeline: [
      { status: "pending", timestamp: "2024-06-15T14:20:00Z", note: "Request submitted", actor: "System" },
      { status: "accepted", timestamp: "2024-06-15T14:50:00Z", note: "Medical team dispatched", actor: "BRAC Medical" },
    ],
  },
];

export const VOLUNTEERS: Volunteer[] = [
  {
    id: "vol-001",
    name: "Karim Ahmed",
    initials: "KA",
    phone: "+8801711111111",
    email: "karim.ahmed@email.com",
    skills: ["boat", "search_rescue", "first_aid"],
    location: { lat: 24.8949, lng: 91.8687, label: "Sylhet", district: "Sylhet" },
    isAvailable: true,
    missionsCompleted: 47,
    hoursServed: 312,
    rating: 4.9,
    joinedAt: "2023-01-15",
    badges: ["Rescue Hero", "First Responder", "Top Volunteer 2023"],
    languages: ["Bengali", "English"],
    ngoId: "ngo-001",
  },
  {
    id: "vol-002",
    name: "Sadia Rahman",
    initials: "SR",
    phone: "+8801722222222",
    email: "sadia.rahman@email.com",
    skills: ["medical", "first_aid", "cooking"],
    location: { lat: 23.8103, lng: 90.4125, label: "Dhaka", district: "Dhaka" },
    isAvailable: false,
    missionsCompleted: 32,
    hoursServed: 218,
    rating: 4.8,
    joinedAt: "2023-03-20",
    badges: ["Medical Expert", "Community Hero"],
    languages: ["Bengali", "English", "Hindi"],
    ngoId: "ngo-002",
  },
  {
    id: "vol-003",
    name: "Raju Miah",
    initials: "RM",
    phone: "+8801733333333",
    email: "raju.miah@email.com",
    skills: ["driving", "cooking", "communication"],
    location: { lat: 24.3636, lng: 88.6241, label: "Rajshahi", district: "Rajshahi" },
    isAvailable: true,
    missionsCompleted: 28,
    hoursServed: 189,
    rating: 4.7,
    joinedAt: "2023-06-10",
    badges: ["Relief Driver", "Community Helper"],
    languages: ["Bengali"],
    ngoId: "ngo-001",
  },
  {
    id: "vol-004",
    name: "Nasrin Sultana",
    initials: "NS",
    phone: "+8801744444444",
    email: "nasrin.sultana@email.com",
    skills: ["medical", "search_rescue", "first_aid", "communication"],
    location: { lat: 22.3569, lng: 91.7832, label: "Cox's Bazar", district: "Cox's Bazar" },
    isAvailable: true,
    missionsCompleted: 55,
    hoursServed: 398,
    rating: 5.0,
    joinedAt: "2022-11-01",
    badges: ["Legend", "Medical Expert", "Search & Rescue Pro", "Top Volunteer"],
    languages: ["Bengali", "English", "Rohingya"],
    ngoId: "ngo-003",
  },
  {
    id: "vol-005",
    name: "Tanvir Hasan",
    initials: "TH",
    phone: "+8801755555555",
    email: "tanvir.hasan@email.com",
    skills: ["boat", "driving", "first_aid"],
    location: { lat: 24.9045, lng: 91.8611, label: "Sylhet", district: "Sylhet" },
    isAvailable: true,
    missionsCompleted: 19,
    hoursServed: 134,
    rating: 4.6,
    joinedAt: "2024-01-10",
    badges: ["Rising Star"],
    languages: ["Bengali"],
    ngoId: "ngo-001",
  },
];

export const SHELTERS: Shelter[] = [
  {
    id: "shelter-001",
    name: "Sylhet Government College Emergency Shelter",
    location: { lat: 24.9045, lng: 91.8611, label: "MC College Road, Sylhet", district: "Sylhet" },
    capacity: 500,
    currentOccupancy: 423,
    facilities: ["Toilets", "Running Water", "Electricity", "Kitchen", "Generator"],
    hasMedical: true,
    hasFood: true,
    contactPhone: "+8808821711234",
    managedBy: "Sylhet District Administration",
    status: "open",
    distance: 1.2,
  },
  {
    id: "shelter-002",
    name: "BRAC Emergency Shelter — Sunamganj",
    location: { lat: 24.9833, lng: 91.3978, label: "Sunamganj Sadar", district: "Sunamganj" },
    capacity: 300,
    currentOccupancy: 300,
    facilities: ["Toilets", "Water Supply"],
    hasMedical: false,
    hasFood: true,
    contactPhone: "+8801711002233",
    managedBy: "BRAC",
    status: "full",
    distance: 18.5,
  },
  {
    id: "shelter-003",
    name: "Red Crescent Relief Center — Dhaka",
    location: { lat: 23.7808, lng: 90.4198, label: "Mirpur, Dhaka", district: "Dhaka" },
    capacity: 800,
    currentOccupancy: 612,
    facilities: ["Toilets", "Running Water", "Electricity", "Kitchen", "Generator", "Wi-Fi"],
    hasMedical: true,
    hasFood: true,
    contactPhone: "+8802-9884811",
    managedBy: "Bangladesh Red Crescent Society",
    status: "open",
    distance: 4.8,
  },
  {
    id: "shelter-004",
    name: "Community Cyclone Shelter — Cox's Bazar",
    location: { lat: 21.4272, lng: 92.0058, label: "Teknaf, Cox's Bazar", district: "Cox's Bazar" },
    capacity: 1200,
    currentOccupancy: 847,
    facilities: ["Toilets", "Water Tank", "Emergency Lighting", "Radio"],
    hasMedical: false,
    hasFood: false,
    contactPhone: "+8801955667788",
    managedBy: "UNDP Bangladesh",
    status: "open",
    distance: 32.1,
  },
  {
    id: "shelter-005",
    name: "Friendship NGO Char Shelter — Gaibandha",
    location: { lat: 25.3282, lng: 89.5408, label: "Gaibandha Sadar", district: "Gaibandha" },
    capacity: 200,
    currentOccupancy: 87,
    facilities: ["Toilets", "Solar Power", "Water Purifier"],
    hasMedical: true,
    hasFood: true,
    contactPhone: "+8801717009901",
    managedBy: "Friendship Bangladesh",
    status: "open",
    distance: 67.3,
  },
];

export const NGOS: NGO[] = [
  {
    id: "ngo-001",
    name: "BRAC Disaster Response",
    initials: "BR",
    description: "World's largest NGO with extensive disaster response operations across Bangladesh.",
    verified: true,
    location: "Dhaka",
    contactEmail: "disaster@brac.net",
    contactPhone: "+8802-9881265",
    totalRelief: 125000,
    activeCampaigns: 8,
    volunteerCount: 450,
  },
  {
    id: "ngo-002",
    name: "Bangladesh Red Crescent Society",
    initials: "RC",
    description: "Humanitarian organization providing emergency relief and disaster management across Bangladesh.",
    verified: true,
    location: "Dhaka",
    contactEmail: "info@bdrcs.org",
    contactPhone: "+8802-9884811",
    totalRelief: 98000,
    activeCampaigns: 6,
    volunteerCount: 380,
  },
  {
    id: "ngo-003",
    name: "Friendship Bangladesh",
    initials: "FB",
    description: "Specialized in reaching the most vulnerable communities in char and haor areas.",
    verified: true,
    location: "Dhaka",
    contactEmail: "info@friendship.ngo",
    contactPhone: "+8801717009900",
    totalRelief: 52000,
    activeCampaigns: 4,
    volunteerCount: 210,
  },
  {
    id: "ngo-004",
    name: "Charity Aid Foundation BD",
    initials: "CA",
    description: "Local NGO focused on disaster preparedness and community-level response.",
    verified: false,
    location: "Chattogram",
    contactEmail: "info@cafbd.org",
    contactPhone: "+8801899001122",
    totalRelief: 12000,
    activeCampaigns: 2,
    volunteerCount: 78,
  },
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp-001",
    title: "Sylhet Flood Emergency Response 2024",
    description: "Comprehensive flood relief covering Sylhet, Sunamganj and Habiganj districts.",
    ngoId: "ngo-001",
    targetArea: "Sylhet Division",
    status: "active",
    startDate: "2024-06-14",
    endDate: "2024-07-14",
    assignedVolunteers: ["vol-001", "vol-003", "vol-005"],
    requestsHandled: 287,
    totalNeeded: 500,
    progress: 57,
    disasterType: "flood",
  },
  {
    id: "camp-002",
    title: "Cyclone Preparedness — Coastal Areas",
    description: "Pre-cyclone evacuation support and relief pre-positioning for Cox's Bazar coast.",
    ngoId: "ngo-002",
    targetArea: "Chittagong Division",
    status: "active",
    startDate: "2024-06-13",
    endDate: "2024-06-20",
    assignedVolunteers: ["vol-004"],
    requestsHandled: 143,
    totalNeeded: 200,
    progress: 71,
    disasterType: "cyclone",
  },
  {
    id: "camp-003",
    title: "Char Area Monthly Food Distribution",
    description: "Monthly food distribution for isolated char island communities in Jamuna river.",
    ngoId: "ngo-003",
    targetArea: "Mymensingh Division",
    status: "completed",
    startDate: "2024-05-01",
    endDate: "2024-05-31",
    assignedVolunteers: ["vol-002"],
    requestsHandled: 412,
    totalNeeded: 400,
    progress: 100,
    disasterType: "flood",
  },
  {
    id: "camp-004",
    title: "Hill Tracts Landslide Response",
    description: "Emergency response for landslide-affected families in Rangamati and Bandarban.",
    ngoId: "ngo-001",
    targetArea: "Chittagong Hill Tracts",
    status: "paused",
    startDate: "2024-06-10",
    endDate: "2024-06-25",
    assignedVolunteers: [],
    requestsHandled: 64,
    totalNeeded: 150,
    progress: 42,
    disasterType: "landslide",
  },
];

export const INVENTORY: InventoryItem[] = [
  { id: "inv-001", name: "Rice (50 kg bags)", category: "food", quantity: 2840, unit: "bags", lastUpdated: "2024-06-15T08:00:00Z", minimumStock: 500, location: "Sylhet Warehouse", status: "adequate" },
  { id: "inv-002", name: "Drinking Water (20L bottles)", category: "water", quantity: 156, unit: "bottles", lastUpdated: "2024-06-15T08:00:00Z", minimumStock: 500, location: "Sylhet Warehouse", status: "critical" },
  { id: "inv-003", name: "ORS Packets", category: "medicine", quantity: 3200, unit: "packets", lastUpdated: "2024-06-15T08:00:00Z", minimumStock: 1000, location: "Sylhet Warehouse", status: "adequate" },
  { id: "inv-004", name: "Emergency Blankets", category: "shelter", quantity: 890, unit: "pieces", lastUpdated: "2024-06-15T06:00:00Z", minimumStock: 500, location: "Dhaka Warehouse", status: "adequate" },
  { id: "inv-005", name: "Tarpaulin Sheets", category: "shelter", quantity: 234, unit: "sheets", lastUpdated: "2024-06-15T06:00:00Z", minimumStock: 300, location: "Dhaka Warehouse", status: "low" },
  { id: "inv-006", name: "First Aid Kits", category: "medicine", quantity: 98, unit: "kits", lastUpdated: "2024-06-14T18:00:00Z", minimumStock: 200, location: "Cox's Bazar Warehouse", status: "critical" },
  { id: "inv-007", name: "Lentils (Dal) — bulk", category: "food", quantity: 1450, unit: "kg", lastUpdated: "2024-06-15T08:00:00Z", minimumStock: 500, location: "Sylhet Warehouse", status: "adequate" },
  { id: "inv-008", name: "Mosquito Nets", category: "other", quantity: 620, unit: "nets", lastUpdated: "2024-06-14T14:00:00Z", minimumStock: 300, location: "Dhaka Warehouse", status: "adequate" },
  { id: "inv-009", name: "Cooking Oil (5L)", category: "food", quantity: 380, unit: "cans", lastUpdated: "2024-06-14T10:00:00Z", minimumStock: 400, location: "Sylhet Warehouse", status: "low" },
  { id: "inv-010", name: "Dry Rations Packs", category: "food", quantity: 1820, unit: "packs", lastUpdated: "2024-06-15T07:00:00Z", minimumStock: 500, location: "Cox's Bazar Warehouse", status: "adequate" },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "notif-001", type: "alert", title: "Emergency Alert", message: "New critical rescue request in Sylhet — family of 6 trapped on rooftop.", timestamp: "2024-06-15T09:15:00Z", read: false, priority: "critical" },
  { id: "notif-002", type: "mission", title: "Mission Assigned", message: "You have been assigned to rescue mission REQ-001 in Sylhet Sadar.", timestamp: "2024-06-15T10:45:00Z", read: false, priority: "high" },
  { id: "notif-003", type: "update", title: "Shelter Update", message: "BRAC Sunamganj shelter has reached full capacity (300/300).", timestamp: "2024-06-15T11:30:00Z", read: false },
  { id: "notif-004", type: "system", title: "New Volunteer Joined", message: "Nasrin Sultana has joined your NGO team and is ready for deployment.", timestamp: "2024-06-15T12:00:00Z", read: true },
  { id: "notif-005", type: "mission", title: "Mission Completed", message: "Mission REQ-004 completed. Family safely relocated to Rajshahi shelter.", timestamp: "2024-06-15T08:00:00Z", read: true },
  { id: "notif-006", type: "alert", title: "Low Inventory Warning", message: "Drinking water supply at Sylhet warehouse is critically low (156 bottles).", timestamp: "2024-06-15T07:30:00Z", read: true, priority: "high" },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-001",
    name: "Jahanara Begum",
    role: "Flood Survivor",
    location: "Sylhet",
    initials: "JB",
    quote: "RescueNet reached us within 2 hours of our request. The volunteers were incredible. I cannot imagine surviving that flood without their help.",
    rating: 5,
  },
  {
    id: "t-002",
    name: "Dr. Aminur Rahman",
    role: "Medical Volunteer",
    location: "Dhaka",
    initials: "AR",
    quote: "The platform makes coordination so efficient. I can see requests near me in real-time and respond immediately. This is the future of disaster response.",
    rating: 5,
  },
  {
    id: "t-003",
    name: "Tasnim Jahan",
    role: "Program Director, BRAC",
    location: "Dhaka",
    initials: "TJ",
    quote: "RescueNet has transformed how we coordinate relief operations. The inventory and volunteer management features alone save us countless hours each day.",
    rating: 5,
  },
];

export const NEWS: NewsItem[] = [
  {
    id: "news-001",
    title: "Flash Floods Displace 200,000 in Northeast Bangladesh",
    summary: "Unprecedented rainfall in Sylhet and Sunamganj has caused major flooding, displacing thousands and cutting off road connections to remote areas.",
    source: "The Daily Star",
    timestamp: "2024-06-15T10:00:00Z",
    category: "Flood",
    image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=220&fit=crop&auto=format",
  },
  {
    id: "news-002",
    title: "Navy and Coast Guard on High Alert as Cyclone Intensifies",
    summary: "Bangladesh authorities have put naval and coast guard forces on high alert as a cyclonic storm intensifies over the Bay of Bengal.",
    source: "Prothom Alo",
    timestamp: "2024-06-14T15:30:00Z",
    category: "Cyclone",
    image: "https://images.unsplash.com/photo-1559928047-0e40b0ddeabc?w=400&h=220&fit=crop&auto=format",
  },
  {
    id: "news-003",
    title: "5,000 Volunteers Deployed Across 12 Flood-Affected Districts",
    summary: "NGOs and government agencies jointly deployed over 5,000 trained volunteers to assist flood victims, marking Bangladesh's largest coordinated relief effort.",
    source: "Bangladesh Sangbad Sangstha",
    timestamp: "2024-06-14T12:00:00Z",
    category: "Relief",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=220&fit=crop&auto=format",
  },
];

export const USERS: AppUser[] = [
  { id: "user-001", name: "Mohammad Rafiqul Islam", email: "rafiq@email.com", role: "victim", status: "active", joinedAt: "2024-06-10", location: "Sylhet", verified: true },
  { id: "user-002", name: "Karim Ahmed", email: "karim@email.com", role: "volunteer", status: "active", joinedAt: "2023-01-15", location: "Sylhet", verified: true },
  { id: "user-003", name: "BRAC Disaster Response", email: "disaster@brac.net", role: "ngo", status: "active", joinedAt: "2023-01-01", location: "Dhaka", verified: true },
  { id: "user-004", name: "Fatema Begum", email: "fatema@email.com", role: "victim", status: "active", joinedAt: "2024-06-12", location: "Sylhet", verified: false },
  { id: "user-005", name: "Sadia Rahman", email: "sadia@email.com", role: "volunteer", status: "active", joinedAt: "2023-03-20", location: "Dhaka", verified: true },
  { id: "user-006", name: "Charity Aid Foundation BD", email: "info@caf.org", role: "ngo", status: "pending", joinedAt: "2024-06-01", location: "Chattogram", verified: false },
  { id: "user-007", name: "Abdul Karim", email: "abdul@email.com", role: "victim", status: "active", joinedAt: "2024-06-14", location: "Dhaka", verified: false },
  { id: "user-008", name: "Nasrin Sultana", email: "nasrin@email.com", role: "volunteer", status: "active", joinedAt: "2022-11-01", location: "Cox's Bazar", verified: true },
  { id: "user-009", name: "Rina Akter", email: "rina@email.com", role: "victim", status: "active", joinedAt: "2024-06-14", location: "Rajshahi", verified: true },
  { id: "user-010", name: "Raju Miah", email: "raju@email.com", role: "volunteer", status: "active", joinedAt: "2023-06-10", location: "Rajshahi", verified: true },
  { id: "user-011", name: "Jamal Hossain", email: "jamal@email.com", role: "victim", status: "active", joinedAt: "2024-06-15", location: "Cox's Bazar", verified: false },
  { id: "user-012", name: "Tanvir Hasan", email: "tanvir@email.com", role: "volunteer", status: "active", joinedAt: "2024-01-10", location: "Sylhet", verified: true },
];

export const CHART_DATA: ChartDataPoint[] = [
  { date: "Jun 10", requests: 45, completed: 38, volunteers: 120 },
  { date: "Jun 11", requests: 82, completed: 71, volunteers: 145 },
  { date: "Jun 12", requests: 134, completed: 98, volunteers: 178 },
  { date: "Jun 13", requests: 189, completed: 142, volunteers: 210 },
  { date: "Jun 14", requests: 267, completed: 198, volunteers: 285 },
  { date: "Jun 15", requests: 312, completed: 234, volunteers: 342 },
];

export const RELIEF_DISTRIBUTION_DATA = [
  { name: "Food", value: 38 },
  { name: "Water", value: 22 },
  { name: "Medicine", value: 18 },
  { name: "Rescue", value: 12 },
  { name: "Shelter", value: 10 },
];

export const MAP_MARKERS: MapMarker[] = [
  { id: "m-001", type: "victim", label: "Mohammad R.", location: { lat: 24.8949, lng: 91.8687, label: "Sylhet Sadar", district: "Sylhet" }, detail: "Rescue needed — family of 6", status: "assigned" },
  { id: "m-002", type: "victim", label: "Abdul K.", location: { lat: 23.8103, lng: 90.4125, label: "Mirpur, Dhaka", district: "Dhaka" }, detail: "Medicine needed urgently", status: "pending" },
  { id: "m-003", type: "volunteer", label: "Karim A.", location: { lat: 24.9200, lng: 91.8800, label: "Near Sylhet", district: "Sylhet" }, detail: "Available — boat & rescue", status: "active" },
  { id: "m-004", type: "volunteer", label: "Nasrin S.", location: { lat: 22.3700, lng: 91.8000, label: "Cox's Bazar", district: "Cox's Bazar" }, detail: "Medical volunteer — on mission", status: "on-mission" },
  { id: "m-005", type: "shelter", label: "Govt. College Shelter", location: { lat: 24.9045, lng: 91.8611, label: "Sylhet", district: "Sylhet" }, detail: "423/500 capacity", status: "open" },
  { id: "m-006", type: "shelter", label: "RC Relief Center", location: { lat: 23.7808, lng: 90.4198, label: "Mirpur, Dhaka", district: "Dhaka" }, detail: "612/800 capacity", status: "open" },
  { id: "m-007", type: "medical", label: "BRAC Medical Camp", location: { lat: 24.8700, lng: 91.8500, label: "Sylhet", district: "Sylhet" }, detail: "24/7 emergency medical", status: "active" },
  { id: "m-008", type: "relief", label: "Relief Distribution", location: { lat: 24.3636, lng: 88.6241, label: "Rajshahi", district: "Rajshahi" }, detail: "Food & water distribution", status: "active" },
];

export const STATS = {
  victimsHelped: 48250,
  registeredVolunteers: 12847,
  partnerNGOs: 89,
  activeShelters: 234,
  activeRequests: 312,
  completedRequests: 28943,
};

export const EMERGENCY_CONTACTS = [
  { name: "National Emergency Helpline", number: "999", available: "24/7" },
  { name: "Fire Service & Civil Defence", number: "199", available: "24/7" },
  { name: "Flood Forecasting Centre", number: "10941", available: "24/7" },
  { name: "BRAC Emergency Hotline", number: "16430", available: "24/7" },
  { name: "Red Crescent Bangladesh", number: "+880-2-9884811", available: "8am–8pm" },
  { name: "DGDA Drug Emergency", number: "16121", available: "9am–5pm" },
];

export const PARTNER_NAMES = [
  "BRAC", "UNDP", "UNICEF", "Red Crescent", "Save the Children",
  "World Food Programme", "WHO Bangladesh", "Oxfam BD",
];

export const AI_RESPONSES: Record<string, string> = {
  "summarize": "**Field Report Summary — Sylhet Flood (June 15, 2024)**\n\nTotal active requests: 312 (47 critical, 128 high priority). Primary needs: rescue (34%), food (28%), medicine (18%). Avg response time: 2.4 hours. Volunteer deployment: 87% capacity. Recommendation: Deploy 3 additional boat-rescue teams to Sunamganj sector immediately.",
  "prioritize": "**Priority Queue (Top 5 Requests)**\n\n1. 🔴 REQ-001 — Family of 6 trapped, Sylhet (rescue + infant)\n2. 🔴 REQ-003 — Diabetic patient, insulin critical, Dhaka\n3. 🔴 REQ-006 — Pregnant woman, 8 months, Keraniganj\n4. 🟠 REQ-002 — 8 people without food 2 days, Sylhet\n5. 🟠 REQ-005 — 12 families no clean water, Cox's Bazar",
  "shelter": "**Nearest Available Shelters**\n\n1. **Sylhet Govt. College** — 1.2 km away, 77 spots remaining, medical support available ✓\n2. **RC Relief Center Dhaka** — 4.8 km, 188 spots, full facilities ✓\n3. **Friendship Char Shelter** — 67 km, 113 spots, medical support ✓\n\nRecommendation: Sylhet Govt. College for flood-affected families with medical needs.",
  "generate": "**Relief Operation Summary — June 15, 2024**\n\nRescueNet has facilitated 312 active relief operations across 8 districts. 234 volunteers deployed. 48,250 individuals reached. Inventory status: adequate for food, critical for water and first aid. NGO coordination: 6 active organizations. Next 24-hour priority: water purification for Sylhet and Cox's Bazar sectors.",
};

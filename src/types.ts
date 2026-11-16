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
  assignedVolunteerId?: string;
  ownerId?: string;
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
  ngoId?: string;
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
  ngoId?: string;
}

export interface Notification {
  id: string;
  userId?: string;
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
  phone?: string;
  role: UserRole;
  status: "active" | "suspended" | "pending";
  joinedAt: string;
  location: string;
  verified: boolean;
  emailVerified: boolean;
  bloodGroup?: string;
  familyMembers?: string[];
  medicalConditions?: string[];
  emergencyContacts?: string[];
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

export type RescuePoll = {
  id: string;
  victimName: string;
  location: string;
  note: string;
  reporter: string;
  time: string;
  hearts: number;
  createdAt?: string;
  ownerId?: string;
  heartedBy?: string[];
};

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | UserRole;
  date: string;
  pinned?: boolean;
}

export interface Stats {
  victimsHelped: number;
  registeredVolunteers: number;
  partnerNGOs: number;
  activeShelters: number;
  activeRequests: number;
  completedRequests: number;
  criticalRequests: number;
}

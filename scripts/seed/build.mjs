// Generates supabase/functions/server/seed_data.tsx (demo accounts + records for the whole site).
// Run: node scripts/seed/build.mjs   (reads scripts/seed/old-data.json, a dump of the original mock data)
import fs from "node:fs";
const old = JSON.parse(fs.readFileSync(process.env.OLD_JSON || "scripts/seed/old-data.json", "utf8"));
const NOW = Date.now();
const iso = (hoursAgo) => new Date(NOW - hoursAgo * 3600e3).toISOString();
const day = (daysAgo) => new Date(NOW - daysAgo * 864e5).toISOString().slice(0, 10);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const jit = (n) => (rnd() - 0.5) * n;
const initials = (n) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const D = {
  Sylhet: [24.8949, 91.8687], Sunamganj: [25.0715, 91.395], Habiganj: [24.3745, 91.4155], Dhaka: [23.8103, 90.4125],
  Chattogram: [22.3569, 91.7832], "Cox's Bazar": [21.4272, 92.0058], Khulna: [22.8456, 89.5403], Barishal: [22.701, 90.3535],
  Rangpur: [25.7439, 89.2752], Kurigram: [25.8054, 89.6361], Bhola: [22.6859, 90.6482], Satkhira: [22.7185, 89.0705],
  Feni: [23.0159, 91.3976], Noakhali: [22.8696, 91.0995], Bogura: [24.8465, 89.3773], Netrokona: [24.8703, 90.7279],
  Rajshahi: [24.3745, 88.6042], Moulvibazar: [24.4829, 91.7774],
};
const loc = (district, label, spread = 0.05) => ({ lat: +(D[district][0] + jit(spread)).toFixed(4), lng: +(D[district][1] + jit(spread)).toFixed(4), label: label || district, district });
const phone = (i) => `+88017${String(10000000 + i * 1371).slice(0, 8)}`;
const DOMAIN = "resqhub-demo.org";

// ---------------- accounts ----------------
const accounts = [];
const add = (a) => accounts.push({ password: "123456", ...a });
add({ key: "adm1", role: "admin", name: "Sarowar Islam", email: "sarowarislam1122@gmail.com", district: "Dhaka", phone: "+8801700000001" });
add({ key: "adm2", role: "admin", name: "Nusrat Jahan", email: `admin.ops@${DOMAIN}`, district: "Dhaka", phone: "+8801700000002" });

const ngoDefs = [
  ["ngo1", "ResQHub Relief Foundation", "ss7373992@gmail.com", "Dhaka", true, "Flagship ResQHub partner coordinating flood response, shelters and volunteer deployment across Bangladesh."],
  ["ngo2", "BRAC Disaster Response", `brac@${DOMAIN}`, "Dhaka", true, "World's largest NGO with extensive disaster response operations across Bangladesh."],
  ["ngo3", "Bangladesh Red Crescent Society", `redcrescent@${DOMAIN}`, "Dhaka", true, "National humanitarian society providing first aid, shelters, and emergency relief."],
  ["ngo4", "Friendship Bangladesh", `friendship@${DOMAIN}`, "Kurigram", true, "Community-based relief and health support for char and haor communities."],
  ["ngo5", "Charity Aid Foundation BD", `charityaid@${DOMAIN}`, "Chattogram", true, "Emergency food, water and shelter support for cyclone-prone coastal districts."],
  ["ngo6", "Dhaka Youth Rescue Network", `dyrn@${DOMAIN}`, "Dhaka", false, "Youth-led rescue network applying to become a verified ResQHub partner."],
];
ngoDefs.forEach(([key, name, email, district, verified, description], i) =>
  add({ key, role: "ngo", name, email, district, phone: `+88029${String(100000 + i * 7311).slice(0, 6)}`, verified, description }));

const volDefs = [
  ["vol1", "Karim Ahmed", "sarowar2204107@gmail.com", "Sylhet", ["boat", "search_rescue", "first_aid"], 47, 312, 4.9, "ngo1", ["Rescue Hero", "First Responder", "Top Volunteer"], ["Bengali", "English"], true],
  ["vol2", "Sadia Rahman", `sadia@${DOMAIN}`, "Dhaka", ["medical", "first_aid", "communication"], 38, 254, 4.8, "ngo1", ["Medical Star", "First Responder"], ["Bengali", "English", "Hindi"], true],
  ["vol3", "Raju Miah", `raju@${DOMAIN}`, "Sunamganj", ["boat", "driving"], 29, 198, 4.7, "ngo2", ["Boat Captain"], ["Bengali"], true],
  ["vol4", "Nasrin Sultana", `nasrin@${DOMAIN}`, "Cox's Bazar", ["cooking", "communication", "first_aid"], 22, 160, 4.6, "ngo5", ["Community Cook"], ["Bengali", "English"], false],
  ["vol5", "Tanvir Hasan", `tanvir@${DOMAIN}`, "Sylhet", ["search_rescue", "driving"], 31, 221, 4.8, "ngo1", ["Search Specialist"], ["Bengali", "English"], true],
  ["vol6", "Mahbub Alam", `mahbub@${DOMAIN}`, "Habiganj", ["boat", "search_rescue"], 18, 120, 4.5, "ngo2", ["Night Rescuer"], ["Bengali"], true],
  ["vol7", "Farhana Yesmin", `farhana@${DOMAIN}`, "Chattogram", ["medical", "first_aid"], 26, 175, 4.9, "ngo3", ["Medical Star", "Cyclone Responder"], ["Bengali", "English"], true],
  ["vol8", "Imran Hossain", `imran@${DOMAIN}`, "Khulna", ["driving", "communication"], 14, 90, 4.4, "ngo3", [], ["Bengali", "English"], true],
  ["vol9", "Shaila Parvin", `shaila@${DOMAIN}`, "Kurigram", ["cooking", "first_aid"], 20, 140, 4.6, "ngo4", ["Community Cook"], ["Bengali"], true],
  ["vol10", "Rashed Khan", `rashed@${DOMAIN}`, "Barishal", ["boat", "driving", "search_rescue"], 33, 230, 4.7, "ngo5", ["Boat Captain", "Search Specialist"], ["Bengali", "English"], false],
  ["vol11", "Mitu Das", `mitu@${DOMAIN}`, "Rajshahi", ["communication", "first_aid"], 9, 52, 4.3, "ngo4", [], ["Bengali", "Hindi"], true],
  ["vol12", "Arif Chowdhury", `arif@${DOMAIN}`, "Noakhali", ["boat"], 0, 0, 0, undefined, [], ["Bengali"], true, false],
  ["vol13", "Lamia Akter", `lamia@${DOMAIN}`, "Dhaka", ["medical"], 0, 0, 0, undefined, [], ["Bengali", "English"], true, false],
];
volDefs.forEach(([key, name, email, district, skills, missions, hours, rating, ngo, badges, languages, avail, verified = true], i) =>
  add({ key, role: "volunteer", name, email, district, phone: phone(i + 11), skills, missions, hours, rating, ngo, badges, languages, avail, verified }));

const vicDefs = [
  ["vic1", "Mohammad Rafiqul Islam", "u2204107@student.cuet.ac.bd", "Sylhet", "O+"],
  ["vic2", "Fatema Begum", `fatema@${DOMAIN}`, "Sunamganj", "A+"],
  ["vic3", "Abdul Karim", `abdulkarim@${DOMAIN}`, "Habiganj", "B+"],
  ["vic4", "Rina Akter", `rina@${DOMAIN}`, "Dhaka", "AB+"],
  ["vic5", "Jamal Hossain", `jamal@${DOMAIN}`, "Sylhet", "O-"],
  ["vic6", "Shirin Akhter", `shirin@${DOMAIN}`, "Netrokona", "A-"],
  ["vic7", "Habib Ullah", `habib@${DOMAIN}`, "Cox's Bazar", "B-"],
  ["vic8", "Morzina Khatun", `morzina@${DOMAIN}`, "Kurigram", "O+"],
  ["vic9", "Sumon Mia", `sumon@${DOMAIN}`, "Bhola", "A+"],
  ["vic10", "Parveen Sultana", `parveen@${DOMAIN}`, "Satkhira", "B+"],
  ["vic11", "Anwar Hossain", `anwar@${DOMAIN}`, "Feni", "O+"],
  ["vic12", "Joya Barua", `joya@${DOMAIN}`, "Chattogram", "AB-"],
];
vicDefs.forEach(([key, name, email, district, blood], i) => add({ key, role: "victim", name, email, district, bloodGroup: blood, phone: phone(i + 41) }));

const A = Object.fromEntries(accounts.map((a) => [a.key, a]));
const at = (k) => "@" + k;

// ---------------- records ----------------
const users = accounts.map((a) => {
  const pending = (a.role === "ngo" && !a.verified) || (a.role === "volunteer" && a.verified === false);
  const u = {
    id: at(a.key), name: a.name, email: a.email, phone: a.phone, role: a.role,
    status: pending && a.role === "ngo" ? "pending" : "active", joinedAt: day(20 + Math.floor(rnd() * 400)),
    location: a.district, verified: a.role === "victim" || a.role === "admin" || a.verified !== false, emailVerified: true,
  };
  if (a.role === "victim") u.bloodGroup = a.bloodGroup;
  if (a.key === "vic1") Object.assign(u, {
    familyMembers: ["Nasima Islam (Wife)", "Rahim Islam (Son, 8)", "Amina Islam (Daughter, 3)", "Hafeza Khatun (Mother, 68)"],
    medicalConditions: ["Hypertension (mother)", "Asthma (son)"],
    emergencyContacts: ["Nasima Islam: +8801712000111", "Shafiqul Islam (Brother): +8801812000222"],
  });
  return u;
});

const volunteers = accounts.filter((a) => a.role === "volunteer").map((a) => ({
  id: at(a.key), name: a.name, initials: initials(a.name), phone: a.phone, email: a.email, skills: a.skills,
  location: loc(a.district, a.district, 0.08), isAvailable: a.avail, missionsCompleted: a.missions, hoursServed: a.hours,
  rating: a.rating, joinedAt: day(60 + Math.floor(rnd() * 500)), badges: a.badges, languages: a.languages, ...(a.ngo ? { ngoId: at(a.ngo) } : {}),
}));

const volCountByNgo = {}; volDefs.forEach((v) => { if (v[8]) volCountByNgo[v[8]] = (volCountByNgo[v[8]] || 0) + 1; });
const ngos = ngoDefs.map(([key, name, email, district, verified, description], i) => ({
  id: at(key), name, initials: initials(name), description, verified, location: district, contactEmail: email,
  contactPhone: A[key].phone, totalRelief: [86500, 125000, 98000, 41000, 57000, 0][i], activeCampaigns: [3, 3, 2, 1, 1, 0][i],
  volunteerCount: (volCountByNgo[key] || 0) + [120, 450, 380, 90, 60, 15][i],
}));

// help requests: [victim, type, priority, status, district, hoursAgo, description, volunteer, ngo]
const R = [
  ["vic1", "rescue", "critical", "assigned", "Sylhet", 5, "Family of 6 trapped on roof. Water level is 8 feet. Two elderly and one infant. Need boat rescue immediately.", "vol1", "ngo1"],
  ["vic1", "medicine", "high", "completed", "Sylhet", 70, "Mother needs hypertension medication and ORS packets; pharmacy is under water.", "vol2", "ngo1"],
  ["vic1", "food", "medium", "completed", "Sylhet", 120, "Dry food for 6 people for three days. Stored rice was soaked.", "vol5", "ngo1"],
  ["vic1", "water", "medium", "pending", "Sylhet", 2, "Tube well is submerged. Need clean drinking water for 6 people.", null, null],
  ["vic2", "rescue", "critical", "accepted", "Sunamganj", 6, "Flash flood cut off our village. Two pregnant women need evacuation to a shelter.", null, null],
  ["vic3", "food", "high", "pending", "Habiganj", 4, "35 families on an embankment without food since yesterday morning.", null, null],
  ["vic4", "medical", "medium", "completed", "Dhaka", 150, "Child with high fever and dehydration after waterlogging. Need doctor visit.", "vol7", "ngo3"],
  ["vic5", "shelter", "high", "pending", "Sylhet", 3, "House collapsed. 4 people including a newborn need shelter tonight.", null, null],
  ["vic6", "rescue", "high", "accepted", "Netrokona", 9, "Haor water rising fast. Elderly father unable to walk. Need boat.", null, null],
  ["vic7", "shelter", "critical", "assigned", "Cox's Bazar", 7, "Cyclone surge destroyed our homes. 12 people seeking cyclone shelter.", "vol4", "ngo5"],
  ["vic8", "food", "medium", "assigned", "Kurigram", 14, "River erosion took our house. Need cooked food for 9 people.", "vol9", "ngo4"],
  ["vic9", "water", "high", "pending", "Bhola", 8, "Salt water intrusion. No safe drinking water in the entire para.", null, null],
  ["vic10", "medicine", "medium", "completed", "Satkhira", 200, "Insulin and diabetic supplies lost in the flood.", "vol8", "ngo3"],
  ["vic11", "rescue", "critical", "pending", "Feni", 1, "Two children stuck on a tin roof as water is rising. Phone battery is low.", null, null],
  ["vic12", "medical", "high", "assigned", "Chattogram", 11, "Landslide injuries. Father has a leg fracture and needs medical transport.", "vol7", "ngo3"],
  ["vic2", "food", "medium", "completed", "Sunamganj", 100, "Relief food for 12 relatives sheltering with us.", "vol3", "ngo2"],
  ["vic3", "rescue", "high", "completed", "Habiganj", 130, "Boat needed to move cattle and elderly neighbours to higher ground.", "vol6", "ngo2"],
  ["vic4", "other", "low", "pending", "Dhaka", 20, "Need blankets and tarpaulin for a street-side family displaced by waterlogging.", null, null],
  ["vic5", "medicine", "medium", "completed", "Sylhet", 90, "Antibiotics and bandages for waterborne skin infection.", "vol1", "ngo1"],
  ["vic6", "food", "high", "completed", "Netrokona", 160, "Food relief for a flooded village of 60 families.", "vol10", "ngo5"],
  ["vic7", "medical", "medium", "cancelled", "Cox's Bazar", 60, "Resolved: neighbour helped us reach the clinic. Cancel request.", null, null],
  ["vic8", "water", "medium", "pending", "Kurigram", 16, "Need purification tablets for 25 families on the char.", null, null],
  ["vic9", "shelter", "high", "accepted", "Bhola", 18, "River bank collapse; 6 families need temporary tents.", null, null],
  ["vic10", "rescue", "medium", "pending", "Satkhira", 12, "Embankment breach, a family of 5 is stranded on the second floor.", null, null],
  ["vic11", "food", "medium", "completed", "Feni", 180, "Rice, lentils and oil for 8 people after canal flooding.", "vol9", "ngo4"],
  ["vic12", "shelter", "low", "completed", "Chattogram", 210, "Temporary shelter for 3 nights while house is repaired.", "vol7", "ngo3"],
  ["vic1", "medical", "low", "completed", "Sylhet", 300, "Follow-up check for son's asthma after flood exposure.", "vol2", "ngo1"],
  ["vic3", "food", "critical", "assigned", "Habiganj", 10, "Elderly couple isolated for 2 days, no food, no mobile balance.", "vol6", "ngo2"],
  ["vic2", "medicine", "high", "assigned", "Sunamganj", 15, "Pregnant woman needs prenatal medicine and a checkup.", "vol3", "ngo2"],
  ["vic6", "water", "low", "completed", "Netrokona", 240, "Water purification tablets for the household.", "vol11", "ngo4"],
  ["vic5", "rescue", "high", "completed", "Sylhet", 96, "Rescue from submerged ground floor, 3 adults and a toddler.", "vol5", "ngo1"],
];
const volName = (k) => A[k].name;
const helpRequests = R.map(([v, type, priority, status, district, h, description, vol, ngo], i) => {
  const id = `req-${String(i + 1).padStart(3, "0")}`;
  const created = iso(h);
  const tl = [{ status: "pending", timestamp: created, note: "Request submitted via ResQHub", actor: "System" }];
  if (["accepted", "assigned", "completed"].includes(status)) tl.push({ status: "accepted", timestamp: iso(h - 0.4), note: "Request reviewed and verified", actor: "ResQHub Admin" });
  if (["assigned", "completed"].includes(status)) tl.push({ status: "assigned", timestamp: iso(h - 0.9), note: `Volunteer ${volName(vol)} assigned`, actor: A[ngo].name });
  if (status === "completed") tl.push({ status: "completed", timestamp: iso(Math.max(h - 4, 0.2)), note: "Help delivered and confirmed", actor: volName(vol) });
  if (status === "cancelled") tl.push({ status: "cancelled", timestamp: iso(h - 1), note: "Cancelled by requester", actor: A[v].name });
  const updated = tl[tl.length - 1].timestamp;
  const r = { id, victimName: A[v].name, victimPhone: A[v].phone, type, priority, status, description, location: loc(district, `${district} Sadar, Ward ${1 + (i % 9)}`, 0.06), createdAt: created, updatedAt: updated, ownerId: at(v), timeline: tl };
  if (vol) { r.assignedVolunteer = volName(vol); r.assignedVolunteerId = at(vol); r.ngoId = at(ngo); }
  return r;
});

// shelters: [name, district, label, capacity, occupancy, facilities, medical, food, ngo, managedBy, distance]
const S = [
  ["Sylhet Government College Emergency Shelter", "Sylhet", "MC College Road, Sylhet", 500, 423, ["Toilets", "Running Water", "Electricity", "Kitchen", "Generator"], true, true, "ngo1", "ResQHub Relief Foundation", 1.2],
  ["Sylhet Alia Madrasa Relief Centre", "Sylhet", "Zindabazar, Sylhet", 300, 188, ["Toilets", "Running Water", "Kitchen"], false, true, "ngo1", "ResQHub Relief Foundation", 2.4],
  ["Sunamganj Town Cyclone Shelter", "Sunamganj", "Sunamganj Sadar", 400, 400, ["Toilets", "Running Water", "Generator"], true, true, "ngo2", "BRAC Disaster Response", 3.1],
  ["Habiganj Model School Shelter", "Habiganj", "Habiganj Sadar", 250, 96, ["Toilets", "Running Water", "Electricity"], false, true, "ngo2", "BRAC Disaster Response", 4.0],
  ["Moulvibazar Community Hall", "Moulvibazar", "Moulvibazar Town", 200, 74, ["Toilets", "Running Water"], false, false, "ngo2", "BRAC Disaster Response", 5.2],
  ["Cox's Bazar Coastal Cyclone Centre", "Cox's Bazar", "Kolatoli, Cox's Bazar", 600, 512, ["Toilets", "Running Water", "Electricity", "Kitchen", "Generator", "Medical Room"], true, true, "ngo5", "Charity Aid Foundation BD", 2.0],
  ["Chattogram College Relief Shelter", "Chattogram", "Panchlaish, Chattogram", 450, 220, ["Toilets", "Running Water", "Electricity", "Kitchen"], true, true, "ngo3", "Bangladesh Red Crescent Society", 3.6],
  ["Kurigram Char Flood Shelter", "Kurigram", "Kurigram Sadar", 350, 301, ["Toilets", "Running Water", "Kitchen"], true, true, "ngo4", "Friendship Bangladesh", 1.8],
  ["Khulna Cyclone Shelter No. 7", "Khulna", "Dacope, Khulna", 280, 140, ["Toilets", "Running Water", "Generator"], false, true, "ngo3", "Bangladesh Red Crescent Society", 6.5],
  ["Barishal Zilla School Shelter", "Barishal", "Barishal Sadar", 320, 118, ["Toilets", "Running Water", "Electricity"], false, true, "ngo5", "Charity Aid Foundation BD", 4.4],
  ["Bhola Coastal Shelter", "Bhola", "Char Fasson, Bhola", 260, 205, ["Toilets", "Running Water"], false, true, "ngo5", "Charity Aid Foundation BD", 7.0],
  ["Satkhira Embankment Relief Camp", "Satkhira", "Shyamnagar, Satkhira", 220, 90, ["Toilets", "Running Water", "Kitchen"], false, true, "ngo3", "Bangladesh Red Crescent Society", 5.8],
  ["Dhaka Mirpur Emergency Hall", "Dhaka", "Mirpur 10, Dhaka", 380, 120, ["Toilets", "Running Water", "Electricity", "Medical Room"], true, true, "ngo1", "ResQHub Relief Foundation", 1.1],
  ["Netrokona Haor Relief Centre", "Netrokona", "Netrokona Sadar", 240, 0, ["Toilets", "Running Water"], false, false, "ngo4", "Friendship Bangladesh", 6.1],
];
const shelters = S.map(([name, district, label, capacity, currentOccupancy, facilities, hasMedical, hasFood, ngo, managedBy, distance], i) => ({
  id: `shelter-${String(i + 1).padStart(3, "0")}`, name, location: loc(district, label, 0.03), capacity, currentOccupancy, facilities, hasMedical, hasFood,
  contactPhone: `+88${["0821", "0821", "0871", "0831", "0861", "0341", "031", "0581", "041", "0431", "0491", "0471", "02", "0951"][i]}71${1200 + i * 37}`,
  managedBy, ngoId: at(ngo), status: i === 13 ? "closed" : currentOccupancy >= capacity ? "full" : "open", distance,
}));

// campaigns: [title, description, ngo, area, status, startDaysAgo, durationDays, vols, handled, needed, type]
const C = [
  ["Sylhet Flood Emergency Response", "Comprehensive flood relief covering Sylhet, Sunamganj and Habiganj districts.", "ngo1", "Sylhet Division", "active", 7, 30, ["vol1", "vol2", "vol5"], 287, 500, "flood"],
  ["Safe Water for Haor Communities", "Distributing water purification tablets and repairing tube wells.", "ngo1", "Sunamganj & Netrokona", "active", 10, 45, ["vol1", "vol5"], 140, 400, "flood"],
  ["Dhaka Waterlogging Relief", "Food and medical camps in waterlogged Dhaka neighbourhoods.", "ngo1", "Dhaka", "completed", 40, 20, ["vol2"], 220, 220, "flood"],
  ["Haor Region Food Security", "Emergency food distribution for haor villages cut off by floods.", "ngo2", "Sunamganj", "active", 8, 30, ["vol3", "vol6"], 180, 350, "flood"],
  ["Rapid Boat Rescue Network", "Standby rescue boats and trained crews in flood-prone upazilas.", "ngo2", "Habiganj", "active", 5, 40, ["vol3", "vol6"], 64, 120, "flood"],
  ["Cyclone Preparedness Drive", "Early warning, evacuation drills and cyclone shelter readiness.", "ngo3", "Chattogram & Khulna", "active", 12, 60, ["vol7", "vol8"], 95, 300, "cyclone"],
  ["Char Livelihood Recovery", "Rebuilding livelihoods for erosion-hit char families.", "ngo4", "Kurigram", "active", 15, 90, ["vol9", "vol11"], 60, 200, "flood"],
  ["Coastal Cyclone Relief 2024", "Food, tents and medicine for cyclone-affected coastal communities.", "ngo5", "Cox's Bazar & Bhola", "paused", 30, 30, ["vol4", "vol10"], 130, 260, "cyclone"],
];
const campaigns = C.map(([title, description, ngo, targetArea, status, start, dur, vols, handled, needed, disasterType], i) => ({
  id: `camp-${String(i + 1).padStart(3, "0")}`, title, description, ngoId: at(ngo), targetArea, status, startDate: day(start),
  endDate: day(start - dur), assignedVolunteers: vols.map(at), requestsHandled: handled, totalNeeded: needed, progress: Math.min(100, Math.round((handled / needed) * 100)), disasterType,
}));

// inventory: [name, category, qty, unit, min, location]
const invBase = [
  ["Rice (50 kg bags)", "food", 2840, "bags", 500, "Warehouse"], ["Drinking Water (20L)", "water", 380, "jars", 400, "Warehouse"],
  ["Oral Saline (ORS)", "medicine", 9200, "packets", 2000, "Medical Store"], ["First Aid Kits", "medicine", 140, "kits", 150, "Medical Store"],
  ["Tarpaulin Sheets", "shelter", 620, "pieces", 300, "Warehouse"], ["Blankets", "clothing", 1500, "pieces", 800, "Warehouse"],
  ["Lentils (25 kg)", "food", 90, "bags", 200, "Warehouse"], ["Water Purification Tablets", "water", 12000, "tablets", 3000, "Medical Store"],
];
const invNgos = { ngo1: 8, ngo2: 6, ngo3: 6, ngo4: 5, ngo5: 5 };
const inventory = [];
Object.entries(invNgos).forEach(([ngo, n], gi) => {
  invBase.slice(0, n).forEach(([name, category, q, unit, min, where], j) => {
    const quantity = Math.max(10, Math.round(q * (0.45 + ((gi * 7 + j * 3) % 10) / 9)));
    inventory.push({
      id: `inv-${ngo}-${j + 1}`, ngoId: at(ngo), name, category, quantity, unit, minimumStock: min,
      location: `${A[ngo].district} ${where}`, lastUpdated: iso(2 + j * 5),
      status: quantity <= min ? "critical" : quantity <= min * 1.5 ? "low" : "adequate",
    });
  });
});

// notifications
let ni = 0;
const N = (userKey, type, title, message, hours, priority, read = false) => ({ id: `notif-${String(++ni).padStart(3, "0")}`, userId: at(userKey), type, title, message, timestamp: iso(hours), read, ...(priority ? { priority } : {}) });
const notifications = [
  N("vic1", "update", "Volunteer assigned", "Karim Ahmed has been assigned to your rescue request and is on the way.", 4.1, "high"),
  N("vic1", "alert", "Flood warning", "Severe flooding expected in Sylhet Division. Move to higher ground and keep your phone charged.", 6, "critical"),
  N("vic1", "update", "Request completed", "Your medicine request was completed by Sadia Rahman. Stay safe.", 66, undefined, true),
  N("vic1", "system", "Welcome to ResQHub", "Complete your profile and emergency contacts so responders can reach your family.", 300, undefined, true),
  N("vol1", "mission", "Mission assigned", "You have been assigned to rescue mission REQ-001 in Sylhet Sadar. Victim is a family of 6 on a rooftop.", 4.3, "critical"),
  N("vol1", "alert", "Emergency alert", "New critical rescue request in Feni. Check the Missions tab.", 1, "critical"),
  N("vol1", "update", "Mission completed", "Great work on REQ-019! The family has been supplied with medicine.", 88, undefined, true),
  N("vol1", "system", "Badge unlocked", "You earned the Rescue Hero badge for 40+ completed missions.", 400, undefined, true),
  N("ngo1", "alert", "Inventory low", "Lentils (25 kg) stock is below minimum at your warehouse.", 3, "high"),
  N("ngo1", "update", "New volunteer joined", "Tanvir Hasan joined your volunteer roster.", 30),
  N("ngo1", "mission", "Campaign milestone", "Sylhet Flood Emergency Response passed 55% of its target.", 20, undefined, true),
  N("ngo1", "system", "Organization verified", "Your NGO is a verified ResQHub partner.", 500, undefined, true),
  N("adm1", "alert", "NGO awaiting verification", "Dhaka Youth Rescue Network applied for partner verification.", 5, "high"),
  N("adm1", "alert", "Volunteers awaiting verification", "2 new volunteers are waiting in the verification queue.", 8, "medium"),
  N("adm1", "system", "Daily summary", "Platform activity is up. Review the overview for live statistics.", 24, undefined, true),
];
["vic2", "vic3", "vic5", "vic6"].forEach((k, i) => notifications.push(N(k, "update", "Request received", "Your request is being reviewed by the ResQHub team.", 5 + i, "medium")));
["vol2", "vol3", "vol5", "vol7"].forEach((k, i) => notifications.push(N(k, "mission", "Mission assigned", "A new mission has been assigned to you. Open Missions for details.", 6 + i, "high")));
["ngo2", "ngo3", "ngo5"].forEach((k, i) => notifications.push(N(k, "update", "Daily brief", "New help requests were received in your area. Open Volunteers to assign teams.", 7 + i)));

const alerts = [
  ...old.ALERTS.map((a) => ({ ...a, timestamp: iso([6, 12, 20][old.ALERTS.indexOf(a)] ?? 24) })),
  { id: "alert-4", type: "cyclone", severity: "severe", title: "Cyclone Warning Signal 7 - Cox's Bazar & Chattogram", description: "A deep depression over the Bay of Bengal is intensifying. Fishing boats must return to shore; coastal residents should move to cyclone shelters.", location: "Cox's Bazar", timestamp: iso(9), affectedAreas: ["Cox's Bazar", "Teknaf", "Chattogram", "Bhola"], evacuationOrder: true },
  { id: "alert-5", type: "landslide", severity: "severe", title: "Landslide Risk - Chattogram Hill Tracts", description: "Continuous heavy rain has raised landslide risk on hill slopes. Residents living on slopes should relocate to safer shelters.", location: "Chattogram Hill Tracts", timestamp: iso(15), affectedAreas: ["Rangamati", "Bandarban", "Chattogram"], evacuationOrder: true },
  { id: "alert-6", type: "flood", severity: "moderate", title: "River Erosion - Kurigram and Rangpur", description: "Brahmaputra and Teesta water levels are above danger mark. Char dwellers should prepare to relocate.", location: "Kurigram", timestamp: iso(28), affectedAreas: ["Kurigram", "Gaibandha", "Rangpur"], evacuationOrder: false },
  { id: "alert-7", type: "drought", severity: "minor", title: "Dry Spell Advisory - Barind Tract", description: "Below-average rainfall is affecting water availability for farmers across the Barind Tract. Conserve water where possible.", location: "Rajshahi", timestamp: iso(60), affectedAreas: ["Rajshahi", "Naogaon", "Chapainawabganj"], evacuationOrder: false },
  { id: "alert-8", type: "flood", severity: "moderate", title: "Waterlogging Alert - Dhaka City", description: "Heavy downpour is causing waterlogging in low-lying Dhaka areas. Avoid unnecessary travel.", location: "Dhaka", timestamp: iso(30), affectedAreas: ["Mirpur", "Jatrabari", "Demra"], evacuationOrder: false },
];

const img = old.NEWS.map((n) => n.image);
const N2 = [
  ["Flash Floods Displace 200,000 in Northeast Bangladesh", "Unprecedented rainfall in Sylhet and Sunamganj has caused major flooding, displacing thousands and cutting off road connections to remote areas.", "The Daily Star", "Flood", 10],
  ["Army and Volunteers Launch Joint Rescue Operation in Sylhet", "More than 400 volunteers and 60 boats have joined the rescue effort as water levels remain above the danger mark.", "Prothom Alo", "Rescue", 22],
  ["Cyclone Shelters Fill Up Along the Coast", "Authorities report most cyclone centres in Cox's Bazar are at capacity as residents heed evacuation warnings.", "bdnews24", "Cyclone", 14],
  ["Health Teams Deployed to Prevent Waterborne Disease", "Red Crescent medical teams are distributing ORS and purification tablets across flood-hit upazilas.", "The Business Standard", "Health", 30],
  ["Haor Farmers Face Crop Losses After Early Flooding", "Early monsoon floods have damaged boro rice crops across Sunamganj and Netrokona, raising food security concerns.", "The Daily Star", "Agriculture", 40],
  ["Landslide Warning Issued for Hill Districts", "Meteorologists urge people living on hill slopes in Rangamati and Bandarban to move to safer places.", "Dhaka Tribune", "Landslide", 36],
  ["Local Volunteers Rebuild Roads Washed Away in Habiganj", "Youth groups coordinated through ResQHub are repairing village roads to restore access to relief.", "Prothom Alo", "Community", 52],
  ["ResQHub Partners Add Six New Relief Shelters", "New shelters in Dhaka, Sylhet and Kurigram will add more than 1,800 places for displaced families.", "ResQHub Newsroom", "Update", 18],
  ["Safe Water Drive Reaches 40 Haor Villages", "NGO partners have distributed over 100,000 purification tablets to communities cut off by floodwater.", "bdnews24", "Relief", 70],
];
const news = N2.map(([title, summary, source, category, h], i) => ({ id: `news-${String(i + 1).padStart(3, "0")}`, title, summary, source, timestamp: iso(h), category, image: img[i % img.length] }));

const T = [
  ...old.TESTIMONIALS,
  { id: "t-004", name: "Abdul Mannan", role: "Haor Farmer", location: "Sunamganj", initials: "AM", quote: "We were cut off for three days. A volunteer boat brought food and medicine within hours of my request.", rating: 5 },
  { id: "t-005", name: "Rokeya Khatun", role: "Cyclone Survivor", location: "Cox's Bazar", initials: "RK", quote: "The shelter finder showed me the nearest open cyclone centre and directions. We got there safely.", rating: 5 },
  { id: "t-006", name: "Dr. Imtiaz Hasan", role: "Volunteer Doctor", location: "Dhaka", initials: "IH", quote: "ResQHub routes medical cases to the right volunteers instantly. It saves hours in the field.", rating: 5 },
  { id: "t-007", name: "Salma Akter", role: "NGO Coordinator", location: "Chattogram", initials: "SA", quote: "Managing inventory, shelters and volunteers in one dashboard changed how our team responds.", rating: 4 },
  { id: "t-008", name: "Kamal Uddin", role: "Landslide Survivor", location: "Rangamati", initials: "KU", quote: "The early alert on my phone gave us time to leave. I am grateful for the warning.", rating: 5 },
  { id: "t-009", name: "Taslima Nasrin", role: "Volunteer", location: "Barishal", initials: "TN", quote: "I could see exactly who needed help nearby and get directions in one tap.", rating: 4 },
];

const announcements = [
  { id: "ann-001", title: "Flood response protocols updated", body: "All volunteers must verify victim location and confirm contact before dispatching a boat. Wear life jackets at all times.", audience: "volunteer", date: day(1), pinned: true },
  { id: "ann-002", title: "Cyclone preparedness reminder", body: "Keep dry food, drinking water, medicine and a charged phone ready. Know your nearest cyclone shelter.", audience: "all", date: day(2), pinned: true },
  { id: "ann-003", title: "Partner NGOs: update your inventory daily", body: "Accurate stock levels let ResQHub route supplies faster. Please update inventory by 6 PM every day.", audience: "ngo", date: day(3) },
  { id: "ann-004", title: "How to request help quickly", body: "Open the Request Help tab, choose a type, describe your situation and allow location access for faster rescue.", audience: "victim", date: day(4) },
  { id: "ann-005", title: "Verified email required", body: "Only accounts with a confirmed email address can send requests and accept missions.", audience: "all", date: day(6) },
];

const RP = [
  ["vic1", "Rafiq Islam", "Flooded lane near Sylhet Sadar", "Relatives report he was trapped near the embankment and lost connection. Volunteers should verify before dispatching rescue.", "Amena Begum", 16, 15],
  ["vic2", "Sadia Noor", "Sunamganj bus stand area", "Last seen helping neighbours move belongings. Phone is switched off since morning.", "Mizanur Rahman", 50, 22],
  ["vic3", "Old man named Hashem", "Habiganj embankment road", "Elderly man refused to leave his house. Neighbours worried; boat help needed.", "Abul Hossain", 90, 11],
  ["vic5", "Two children (Rahim and Karim)", "Beanibazar, Sylhet", "Children separated from parents during evacuation. Last seen near the school.", "Jamal Hossain", 140, 31],
  ["vic4", "Nasima Begum", "Mirpur 12, Dhaka", "Pregnant woman missing since waterlogging; family has not heard from her.", "Rina Akter", 200, 9],
  ["vic7", "Fisherman Abdul Gafur", "Teknaf coast", "Went fishing before the cyclone warning and has not returned. Coast guard notified.", "Habib Ullah", 300, 27],
  ["vic8", "Family of five", "Char Kurigram", "Last contact yesterday. House near riverbank may have collapsed.", "Morzina Khatun", 420, 13],
  ["vic6", "Mother and infant", "Netrokona haor", "Last seen on a boat heading towards the market; boat has not arrived.", "Shirin Akhter", 600, 18],
].map(([k, victimName, location, note, reporter, mins, hearts], i) => ({
  id: `rescue-${i + 1}`, victimName, location, note, reporter, time: mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} hr ago`, hearts, createdAt: iso(mins / 60), ownerId: at(k), heartedBy: [],
}));

const data = { users, volunteers, ngos, helpRequests, shelters, campaigns, inventory, notifications, alerts, news, testimonials: T, announcements, rescuePolls: rescuePolls_(), };
function rescuePolls_() { return RP; }

const accountsOut = accounts.map(({ key, role, name, email, password, district, verified, description, phone }) => ({ key, role, name, email, password, district, phone, ...(role === "ngo" ? { verified, description } : {}), ...(role === "volunteer" ? { verified } : {}) }));
const out = `// AUTO-GENERATED by scripts/seed/build.mjs - demo accounts and records used by POST /seed.
// Strings like "@vic1" are replaced with the real Supabase Auth user id at seed time.
export const SEED_GENERATED_AT = ${NOW};
export const SEED_ACCOUNTS: Array<{ key: string; role: string; name: string; email: string; password: string; district: string; phone: string; verified?: boolean; description?: string }> = ${JSON.stringify(accountsOut)};
export const SEED_DATA: Record<string, any[]> = ${JSON.stringify(data)};
`;
fs.writeFileSync("supabase/functions/server/seed_data.tsx", out);
console.log("accounts", accounts.length, Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));

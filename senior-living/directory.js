// Built-in starter directory of well-known senior communities in the
// Indianapolis area. These are always shown, even if the live data feeds
// can't be reached. Map pins are approximate (placed from the street
// address); always confirm details with the community before visiting.
//
// type: "nursing" | "assisted" | "independent"
// care: the levels of care the community is known to offer
window.SENIOR_DIRECTORY = [
  { name: "Marquette Senior Living", type: "independent", lifePlan: true,
    address: "8140 Township Line Rd", city: "Indianapolis", zip: "46260", county: "Marion",
    lat: 39.9047, lng: -86.2221, care: ["Independent living", "Assisted living", "Memory care", "Skilled nursing"] },
  { name: "Westminster Village North", type: "independent", lifePlan: true,
    address: "11050 Presbyterian Dr", city: "Indianapolis", zip: "46236", county: "Marion",
    lat: 39.9234, lng: -85.9497, care: ["Independent living", "Assisted living", "Memory care", "Skilled nursing"] },
  { name: "Robin Run Village", type: "independent", lifePlan: true,
    address: "5354 W 62nd St", city: "Indianapolis", zip: "46268", county: "Marion",
    lat: 39.8722, lng: -86.2468, care: ["Independent living", "Assisted living", "Skilled nursing"] },
  { name: "Hoosier Village", type: "independent", lifePlan: true,
    address: "5300 W 96th St", city: "Zionsville", zip: "46077", county: "Boone",
    lat: 39.9287, lng: -86.2466, care: ["Independent living", "Assisted living", "Memory care", "Skilled nursing"] },
  { name: "Altenheim Senior Living", type: "independent", lifePlan: true,
    address: "3525 E Hanna Ave", city: "Indianapolis", zip: "46237", county: "Marion",
    lat: 39.7031, lng: -86.1003, care: ["Independent living", "Assisted living", "Skilled nursing"] },
  { name: "American Village", type: "independent", lifePlan: true,
    address: "2026 E 54th St", city: "Indianapolis", zip: "46220", county: "Marion",
    lat: 39.8523, lng: -86.1290, care: ["Independent living", "Assisted living", "Skilled nursing"] },
  { name: "Indianapolis Retirement Home", type: "independent",
    address: "1731 N Capitol Ave", city: "Indianapolis", zip: "46202", county: "Marion",
    lat: 39.7907, lng: -86.1619, care: ["Independent living", "Assisted living"] },
  { name: "Saint Paul Hermitage", type: "independent",
    address: "501 N 17th Ave", city: "Beech Grove", zip: "46107", county: "Marion",
    lat: 39.7225, lng: -86.0874, care: ["Independent living", "Assisted living", "Skilled nursing"] },
  { name: "The Barrington of Carmel", type: "independent", lifePlan: true,
    address: "1335 S Guilford Rd", city: "Carmel", zip: "46032", county: "Hamilton",
    lat: 39.9592, lng: -86.1441, care: ["Independent living", "Assisted living", "Memory care", "Skilled nursing"] },
  { name: "The Stratford", type: "independent", lifePlan: true,
    address: "2460 Glebe St", city: "Carmel", zip: "46032", county: "Hamilton",
    lat: 39.9655, lng: -86.1590, care: ["Independent living", "Assisted living", "Memory care", "Skilled nursing"] },
  { name: "Allisonville Meadows", type: "assisted",
    address: "10312 Allisonville Rd", city: "Fishers", zip: "46038", county: "Hamilton",
    lat: 39.9327, lng: -86.0355, care: ["Assisted living", "Memory care"] },
  { name: "Greenwood Village South", type: "independent", lifePlan: true,
    address: "295 Village Ln", city: "Greenwood", zip: "46143", county: "Johnson",
    lat: 39.6035, lng: -86.1255, care: ["Independent living", "Assisted living", "Skilled nursing"] },
  { name: "Franklin United Methodist Community", type: "independent", lifePlan: true,
    address: "1070 W Jefferson St", city: "Franklin", zip: "46131", county: "Johnson",
    lat: 39.4827, lng: -86.0710, care: ["Independent living", "Assisted living", "Memory care", "Skilled nursing"] },
];

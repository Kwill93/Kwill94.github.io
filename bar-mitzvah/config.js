/* ==========================================================================
   EVENT CONFIGURATION — edit this file only. Everything on the site
   (names, dates, venues, hotel link, RSVP destination) comes from here.
   ========================================================================== */
window.EVENT = {
  // --- The guest of honor -------------------------------------------------
  honoreeName: "Benjamin",
  honoreeMiddleName: "Jacob",
  honoreeNickname: "Ben",
  honoreeFullName: "Benjamin Jacob",
  hebrewName: "",                     // add the Hebrew name here (shown under his name)
  hostNames: "James and Aviva Marer",

  // --- Dates ----------------------------------------------------------------
  // ISO date-time of the service; drives the countdown (EST, before DST starts).
  eventDateISO: "2027-03-13T10:30:00-05:00",
  displayDate: "Saturday, March 13, 2027",
  rsvpDeadline: "February 6, 2027",

  // --- Events (add/remove entries freely) -------------------------------
  events: [
    {
      title: "Bar Mitzvah Service",
      time: "10:30 AM",
      date: "Saturday, March 13, 2027",
      venue: "Indianapolis Hebrew Congregation",
      address: "6501 North Meridian Street, Indianapolis, Indiana",
      mapUrl: "https://maps.google.com/?q=Indianapolis+Hebrew+Congregation+6501+North+Meridian+Street+Indianapolis+IN",
      note: "Kiddush luncheon to follow.",
      attire: "Shabbat attire",
    },
    {
      title: "Party",
      time: "6:30 – 9:30 PM",
      date: "Saturday, March 13, 2027",
      venue: "Combat Ops Entertainment",
      address: "4650 E Southport Road, Suites E/F, Indianapolis, Indiana",
      mapUrl: "https://maps.google.com/?q=4650+E+Southport+Road+Indianapolis+IN",
      note: "Get your game on as the celebration continues in honor of Ben!",
      attire: "Casual attire",
    },
  ],

  // --- Hotel room block ---------------------------------------------------
  hotel: {
    // Fill these in when the room block is set. Empty fields are hidden.
    name: "",                // e.g. "Hilton Indianapolis North"
    address: "",
    bookingUrl: "",          // <-- paste the group-rate booking link here
    groupCode: "",           // shown to guests; leave "" to hide
    rate: "",                // e.g. "$149 / night"
    cutoff: "",              // e.g. "February 10, 2027"
    note: "We've reserved a block of rooms at a special rate for out-of-town guests.",
  },

  // --- Contact for questions ----------------------------------------------
  contactName: "James and Aviva Marer",
  contactEmail: "family@example.com",
  contactPhone: "",          // optional

  // --- Access gate --------------------------------------------------------
  // SHA-256 hash of the invitation passcode (case-insensitive; uppercased
  // before hashing). Default passcode: MAZELTOV
  // To change it, see README.md ("Changing the passcode").
  passcodeHash: "f1f0dde078b5a47994b77cbb1a83b7798a1b854962250036f296330710bf476a",

  // --- RSVP destination ---------------------------------------------------
  // Paste the Google Apps Script "Web app URL" here (see README.md).
  // While empty, the form runs in preview mode and nothing is saved.
  rsvpEndpoint: "",

  // Dietary options shown as checkboxes for every guest.
  dietaryOptions: [
    "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
    "Kosher meal", "Nut allergy", "Shellfish allergy",
  ],
};

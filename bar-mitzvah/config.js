/* ==========================================================================
   EVENT CONFIGURATION — edit this file only. Everything on the site
   (names, dates, venues, hotel link, RSVP destination) comes from here.
   ========================================================================== */
window.EVENT = {
  // --- The guest of honor -------------------------------------------------
  honoreeName: "Benjamin",            // first name shown in the big heading
  honoreeFullName: "Benjamin Cohen",  // used in page title / footer
  hebrewName: "בנימין",               // optional — set to "" to hide
  hostNames: "David & Sarah Cohen",   // "Together with his parents ..."

  // --- Dates ----------------------------------------------------------------
  // ISO date-time of the service; drives the countdown.
  eventDateISO: "2027-05-15T10:00:00-04:00",
  displayDate: "Saturday, May 15, 2027",
  rsvpDeadline: "April 15, 2027",

  // --- Events (add/remove entries freely) -------------------------------
  events: [
    {
      title: "Bar Mitzvah Service",
      time: "10:00 AM",
      date: "Saturday, May 15, 2027",
      venue: "Temple Beth Shalom",
      address: "123 Main Street, Indianapolis, IN 46204",
      mapUrl: "https://maps.google.com/?q=123+Main+Street+Indianapolis+IN",
      note: "Kiddush luncheon to follow in the social hall.",
      attire: "Dressy / Shabbat attire",
    },
    {
      title: "Celebration Party",
      time: "7:00 PM – 11:00 PM",
      date: "Saturday, May 15, 2027",
      venue: "The Grand Ballroom",
      address: "456 Celebration Ave, Indianapolis, IN 46204",
      mapUrl: "https://maps.google.com/?q=456+Celebration+Ave+Indianapolis+IN",
      note: "Dinner, dancing, and a candle-lighting ceremony.",
      attire: "Cocktail attire — comfy shoes for the dance floor!",
    },
  ],

  // --- Hotel room block ---------------------------------------------------
  hotel: {
    name: "Downtown Marriott",
    address: "789 Hotel Blvd, Indianapolis, IN 46204",
    bookingUrl: "",          // <-- paste the group-rate booking link here
    groupCode: "COHEN2027",  // shown to guests; set "" to hide
    rate: "$159 / night",
    cutoff: "April 14, 2027",
    note: "Shuttle service provided between the hotel and the party.",
  },

  // --- Contact for questions ----------------------------------------------
  contactName: "Sarah Cohen",
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

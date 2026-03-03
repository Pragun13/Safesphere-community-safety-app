// ========== GLOBAL STATE ==========
let reports = [];
let insightElements = {};
let heatmapListEl = null;
let reportsListEl = null;
let noReportsTextEl = null;

let currentUserEmail = null;
let currentRole = "guest";
let sampleDataLoaded = false;

let savedContacts = [];
let volunteers = [];
let sosAlerts = [];

const CONTACTS_KEY_PREFIX = "safesphere_contacts_";
const VOLUNTEER_KEY_PREFIX = "safesphere_volunteers_";
const THEME_KEY = "safesphere_theme";

// GEO-FENCING ZONES
const GEOFENCE_ZONES = [
  "RNSIT Main Gate",
  "Hostel Road",
  "Back Gate Junction",
  "CSE Block Parking",
];

// Coordinates for map heatzones
const ZONE_COORD_LOOKUP = {
  "rnsit main gate": { lat: 12.9398, lng: 77.5041, label: "RNSIT Main Gate" },
  "hostel road": { lat: 12.9392, lng: 77.5052, label: "Hostel Road" },
  "back gate junction": { lat: 12.9390, lng: 77.5030, label: "Back Gate Junction" },
  "cse block parking": { lat: 12.9399, lng: 77.5047, label: "CSE Block Parking" },
};

let leafletMap = null;
let heatCircles = [];

// MULTI-LANGUAGE TEXT
const I18N = {
  en: {
    appTitle: "SafeSphere",
    appSubtitle: "Community Safety & Emergency Support",
    sosTitle: "Emergency SOS",
    sosDesc: "Tap the button below to trigger an SOS alert.",
    contactsTitle: "Emergency Contacts",
    reportTitle: "Report an Issue",
    recentReportsTitle: "Recent Reports",
    sosButton: "SEND SOS"
  },
  hi: {
    appTitle: "SafeSphere",
    appSubtitle: "सुरक्षा और आपातकाल सहायता",
    sosTitle: "आपातकालीन SOS",
    sosDesc: "SOS अलर्ट भेजने के लिए नीचे दिए गए बटन पर टैप करें।",
    contactsTitle: "आपातकालीन संपर्क",
    reportTitle: "समस्या रिपोर्ट करें",
    recentReportsTitle: "हाल की रिपोर्ट",
    sosButton: "SOS भेजें"
  },
  kn: {
    appTitle: "SafeSphere",
    appSubtitle: "ಸಮುದಾಯ ಭದ್ರತಾ & ತುರ್ತು ಸಹಾಯ",
    sosTitle: "ತುರ್ತು SOS",
    sosDesc: "SOS ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ.",
    contactsTitle: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    reportTitle: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
    recentReportsTitle: "ಇತ್ತೀಚಿನ ವರದಿಗಳು",
    sosButton: "SOS ಕಳುಹಿಸಿ"
  }
};

// ========== DOM READY ==========
window.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("loginSection");
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");

  const appHeader = document.getElementById("appHeader");
  const appContent = document.getElementById("appContent");
  const appFooter = document.getElementById("appFooter");

  const roleBadge = document.getElementById("roleBadge");
  const languageSelect = document.getElementById("languageSelect");

  const offlineBanner = document.getElementById("offlineBanner");

  const sosButton = document.getElementById("sosButton");
  const sosStatus = document.getElementById("sosStatus");
  const smsStatus = document.getElementById("smsStatus");

  const contactNameInput = document.getElementById("contactName");
  const contactPhoneInput = document.getElementById("contactPhone");
  const addContactBtn = document.getElementById("addContactBtn");
  const contactsListEl = document.getElementById("contactsList");
  const clearContactsBtn = document.getElementById("clearContactsBtn");

  reportsListEl = document.getElementById("reportsList");
  noReportsTextEl = document.getElementById("noReportsText");
  const clearReportsBtn = document.getElementById("clearReportsBtn");

  // AI Insight elements
  insightElements = {
    count: document.getElementById("insightCount"),
    category: document.getElementById("insightCategory"),
    area: document.getElementById("insightArea"),
    risk: document.getElementById("insightRisk"),
    geofence: document.getElementById("insightGeofence"),
    trend: document.getElementById("insightTrend")
  };

  heatmapListEl = document.getElementById("heatmapList");

  const reportForm = document.getElementById("reportForm");
  const themeToggleBtn = document.getElementById("themeToggle");

  const volunteerNameInput = document.getElementById("volunteerName");
  const volunteerRoleSelect = document.getElementById("volunteerRole");
  const addVolunteerBtn = document.getElementById("addVolunteerBtn");
  const volunteerListEl = document.getElementById("volunteerList");

  const adminPanel = document.getElementById("adminPanel");
  const alertsListEl = document.getElementById("alertsList");
  const adminVolunteerListEl = document.getElementById("adminVolunteerList");

  const analyticsSummary = document.getElementById("analyticsSummary");
  const analyticsScore = document.getElementById("analyticsScore");

  const btnHospitals = document.getElementById("btnHospitals");
  const btnPolice = document.getElementById("btnPolice");
  const btnMedical = document.getElementById("btnMedical");
  const btnMyLocation = document.getElementById("btnMyLocation");
  const locationStatus = document.getElementById("locationStatus");

  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  const DEMO_PASSWORD = "safesphere";

  // ========== THEME ==========
  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light-mode");
      themeToggleBtn.textContent = "Dark Mode";
    } else {
      document.body.classList.remove("light-mode");
      themeToggleBtn.textContent = "Light Mode";
    }
  }

  let savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-mode");
    const newTheme = isLight ? "dark" : "light";
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  });

  // ========== MULTI-LANGUAGE ==========
  function applyLanguage(lang) {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
  }
  applyLanguage("en");

  languageSelect.addEventListener("change", () => {
    applyLanguage(languageSelect.value);
  });

  // ========== OFFLINE MODE ==========
  function updateOnlineStatus() {
    offlineBanner.style.display = navigator.onLine ? "none" : "block";
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();
    // ========== LOGIN WITH ROLES ==========
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (password !== DEMO_PASSWORD) {
      loginError.textContent = "Invalid password. Use 'safesphere' (demo only).";
      return;
    }

    let role = "student";

    if (email === "user@rnsit.com") {
      role = "student";
    } else if (email === "security@rnsit.com") {
      role = "security";
    } else if (email === "admin@rnsit.com") {
      role = "admin";
    } else {
      loginError.textContent =
        "Use one of: user@rnsit.com, security@rnsit.com, admin@rnsit.com";
      return;
    }

    currentUserEmail = email;
    currentRole = role;

    roleBadge.textContent = `Role: ${role.toUpperCase()}`;
    loginError.textContent = "";

    // Show app
    loginSection.style.display = "none";
    appHeader.classList.remove("hidden");
    appContent.classList.remove("hidden");
    appFooter.classList.remove("hidden");

    // Admin / security panel
    if (role === "admin" || role === "security") {
      adminPanel.style.display = "block";
    } else {
      adminPanel.style.display = "none";
    }

    // Load saved data for this user
    loadSavedContacts();
    renderContactsList(contactsListEl);

    loadSavedVolunteers();
    renderVolunteerList(volunteerListEl);
    renderVolunteerListForAdmin(adminVolunteerListEl);

    // Load demo sample reports (once)
    loadSampleData();
    renderReports();
    updateInsights();
    updateAnalyticsSummary();
    updateAlertsUI(alertsListEl);

    // Initialize the interactive map
    initMap();
  });

  // ========== CONTACTS ==========
  addContactBtn.addEventListener("click", () => {
    const name = contactNameInput.value.trim() || "Unknown";
    const phone = contactPhoneInput.value.trim();

    if (!phone) {
      alert("Please enter a phone number.");
      return;
    }

    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 8) {
      alert("Please enter a valid phone number.");
      return;
    }

    savedContacts.push({ name, phone });
    saveContacts();
    renderContactsList(contactsListEl);

    contactNameInput.value = "";
    contactPhoneInput.value = "";
  });

  clearContactsBtn.addEventListener("click", () => {
    if (!savedContacts.length) {
      alert("No contacts to clear.");
      return;
    }
    if (!confirm("Remove all saved emergency contacts?")) return;

    savedContacts = [];
    saveContacts();
    renderContactsList(contactsListEl);
  });

  // ========== SOS BUTTON CLICK ==========
  sosButton.addEventListener("click", () => {
    triggerSOSFlow(sosStatus, smsStatus, locationStatus, alertsListEl);
  });

  // ========== PANIC GESTURE (SHAKE TRIGGER) ==========
  if ("DeviceMotionEvent" in window) {
    let lastShakeTime = 0;
    window.addEventListener("devicemotion", (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
      );

      const now = Date.now();
      if (magnitude > 25 && now - lastShakeTime > 5000) {
        lastShakeTime = now;
        alert("Panic gesture detected! (Demo) Triggering SOS...");
        triggerSOSFlow(sosStatus, smsStatus, locationStatus, alertsListEl);
      }
    });
  }

  // ========== REPORT FORM SUBMIT ==========
  reportForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = document.getElementById("category").value;
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();
    const anonymous = document.getElementById("anonymous").checked;

    if (!location || !description) {
      alert("Please fill in location and description.");
      return;
    }

    const newReport = {
      category,
      location,
      description,
      anonymous,
      time: new Date().toLocaleString()
    };

    reports.unshift(newReport);
    reportForm.reset();

    renderReports();
    updateInsights();
    updateAnalyticsSummary();
  });

  // ========== CLEAR ALL REPORTS ==========
  clearReportsBtn.addEventListener("click", () => {
    if (!reports.length) {
      alert("No reports to clear.");
      return;
    }
    if (!confirm("Delete all reports (demo data + user reports)?")) return;

    reports = [];
    renderReports();
    updateInsights();
    updateAnalyticsSummary();
  });

  // ========== MAP QUICK ACTIONS (NEARBY SEARCHES) ==========
  btnHospitals.addEventListener("click", () => {
    window.open("https://www.google.com/maps/search/hospitals+near+me/", "_blank");
  });

  btnPolice.addEventListener("click", () => {
    window.open("https://www.google.com/maps/search/police+stations+near+me/", "_blank");
  });

  btnMedical.addEventListener("click", () => {
    window.open("https://www.google.com/maps/search/medical+shops+near+me/", "_blank");
  });

  // ========== LIVE LOCATION BUTTON ==========
  btnMyLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      locationStatus.textContent =
        "Your browser does not support live location access.";
      return;
    }

    locationStatus.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        locationStatus.innerHTML = `
          Your approximate location:
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">
            Open in Google Maps
          </a>
        `;
      },
      (err) => {
        console.error(err);
        locationStatus.textContent =
          "Unable to fetch your location. Please allow location access.";
      }
    );
  });

  // ========== VOLUNTEER NETWORK ==========
  addVolunteerBtn.addEventListener("click", () => {
    const name = volunteerNameInput.value.trim();
    const role = volunteerRoleSelect.value;

    if (!name) {
      alert("Please enter your name to join as a volunteer.");
      return;
    }

    volunteers.push({
      name,
      role,
      time: new Date().toLocaleString()
    });

    saveVolunteers();
    renderVolunteerList(volunteerListEl);
    renderVolunteerListForAdmin(adminVolunteerListEl);
    updateAnalyticsSummary();

    volunteerNameInput.value = "";
    volunteerRoleSelect.value = "General";
  });

  // ========== PDF DOWNLOAD ==========
  downloadPdfBtn.addEventListener("click", () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF library failed to load. Check your connection and retry.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("SafeSphere - Safety Report (Phase 2 Demo)", 10, y);
    y += 8;

    doc.setFontSize(11);
    const generatedAt = new Date().toLocaleString();
    doc.text(`Generated at: ${generatedAt}`, 10, y);
    y += 8;

    const summaryLines = [];
    summaryLines.push(`Total reports: ${reports.length || 0}`);
    summaryLines.push(
      "Overall activity: " + (insightElements.count?.textContent || "")
    );
    summaryLines.push(
      "Most common issue type: " + (insightElements.category?.textContent || "")
    );
    summaryLines.push(
      "Most reported area: " + (insightElements.area?.textContent || "")
    );
    summaryLines.push(
      "Estimated risk: " + (insightElements.risk?.textContent || "")
    );
    summaryLines.push(
      "Geo-fence coverage: " +
        (insightElements.geofence?.textContent || "")
    );
    summaryLines.push(
      "Trend & SafeScore: " + (insightElements.trend?.textContent || "")
    );

    summaryLines.forEach((line) => {
      doc.text(line, 10, y);
      y += 6;
    });

    y += 4;
    doc.setFontSize(13);
    doc.text("Recent Reports:", 10, y);
    y += 8;
    doc.setFontSize(10);

    if (reports.length === 0) {
      doc.text("No reports available.", 10, y);
    } else {
      reports.slice(0, 10).forEach((r, index) => {
        const block = [
          `${index + 1}. [${r.time}] ${r.category}`,
          `   Location: ${r.location}`,
          `   Description: ${r.description.substring(0, 80)}${
            r.description.length > 80 ? "..." : ""
          }`,
          `   Anonymous: ${r.anonymous ? "Yes" : "No"}`
        ];

        block.forEach((line) => {
          if (y > 280) {
            doc.addPage();
            y = 10;
          }
          doc.text(line, 10, y);
          y += 5;
        });
        y += 2;
      });
    }

    doc.save("safesphere_report_phase2.pdf");
  });

  // Initial calculations
  updateInsights();
  updateAnalyticsSummary();
});
// ========== SOS FLOW (WITH LIVE LOCATION + ALERT LOG) ==========
function triggerSOSFlow(sosStatus, smsStatus, locationStatus, alertsListEl) {
  const time = new Date().toLocaleString();
  sosStatus.textContent = `SOS TRIGGERED at ${time}. (Demo: This would alert your contacts / authorities.)`;

  if (!navigator.geolocation) {
    smsStatus.textContent =
      "SMS simulation: sending alert without live location (browser does not support location).";
    sendSimulatedSms(null, smsStatus, alertsListEl);
    return;
  }

  smsStatus.textContent =
    "Trying to attach your live location to the SOS alert...";
  locationStatus.textContent = "Detecting your location for SOS...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      locationStatus.innerHTML = `
        Location used for SOS:
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
      `;

      sendSimulatedSms(mapsUrl, smsStatus, alertsListEl);
    },
    (error) => {
      console.error(error);
      locationStatus.textContent =
        "Could not fetch live location. SOS will be sent without location link (demo).";
      sendSimulatedSms(null, smsStatus, alertsListEl);
    }
  );
}

// ========== SMS COMPOSE (DEMO) ==========
function openSmsCompose(message) {
  if (!message) return;
  const smsBody = encodeURIComponent(message);
  const smsUrl = `sms:?&body=${smsBody}`;
  window.location.href = smsUrl;
}

// ========== SEND SIMULATED SMS + LOG FOR ADMIN PANEL ==========
function sendSimulatedSms(mapsUrl, smsStatus, alertsListEl) {
  let message =
    'SOS Alert!\n\n"I need help. Please check my location and reach out."';

  if (mapsUrl) {
    message += `\n\nLive location link:\n${mapsUrl}`;
  }

  let contactText = "No emergency contacts saved.";

  if (savedContacts.length > 0) {
    contactText = savedContacts
      .map((c) => `${c.name} (${c.phone})`)
      .join(", ");
  }

  if (savedContacts.length > 0) {
    if (mapsUrl) {
      smsStatus.textContent = `SMS simulation: safety alert + live location prepared for ${contactText}.`;
    } else {
      smsStatus.textContent = `SMS simulation: safety alert prepared for ${contactText} (without live location).`;
    }
  } else {
    smsStatus.textContent =
      "SMS simulation: no contacts saved. (In a full version, this would send real messages.)";
  }

  sosAlerts.unshift({
    time: new Date().toLocaleString(),
    contacts: contactText,
    hasLocation: !!mapsUrl
  });
  const alertsList = alertsListEl || document.getElementById("alertsList");
  updateAlertsUI(alertsList);

  alert(
    `SOS triggered!\n\nDemo SMS would be prepared for:\n${contactText}\n\nMessage:\n${message}`
  );

  openSmsCompose(message);
}

// ========== UPDATE ALERTS IN ADMIN PANEL ==========
function updateAlertsUI(alertsListEl) {
  if (!alertsListEl) return;
  alertsListEl.innerHTML = "";

  if (!sosAlerts.length) {
    const li = document.createElement("li");
    li.className = "contacts-empty";
    li.textContent = "No SOS alerts yet.";
    alertsListEl.appendChild(li);
    return;
  }

  sosAlerts.slice(0, 10).forEach((alertItem) => {
    const li = document.createElement("li");
    li.textContent = `[${alertItem.time}] SOS sent ${
      alertItem.hasLocation ? "with" : "without"
    } live location to: ${alertItem.contacts}`;
    alertsListEl.appendChild(li);
  });
}

// ========== CONTACTS: LOAD & SAVE ==========
function loadSavedContacts() {
  savedContacts = [];
  if (!currentUserEmail) return;
  const key = CONTACTS_KEY_PREFIX + currentUserEmail;
  const raw = localStorage.getItem(key);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) savedContacts = parsed;
  } catch (e) {
    console.error("Failed to parse saved contacts", e);
  }
}

function saveContacts() {
  if (!currentUserEmail) return;
  const key = CONTACTS_KEY_PREFIX + currentUserEmail;
  localStorage.setItem(key, JSON.stringify(savedContacts));
}

function renderContactsList(listEl) {
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!savedContacts.length) {
    const li = document.createElement("li");
    li.className = "contacts-empty";
    li.textContent = "No contacts saved yet.";
    listEl.appendChild(li);
    return;
  }

  savedContacts.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = `${c.name} (${c.phone})`;
    listEl.appendChild(li);
  });
}

// ========== VOLUNTEERS: LOAD & SAVE ==========
function loadSavedVolunteers() {
  volunteers = [];
  if (!currentUserEmail) return;
  const key = VOLUNTEER_KEY_PREFIX + currentUserEmail;
  const raw = localStorage.getItem(key);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) volunteers = parsed;
  } catch (e) {
    console.error("Failed to parse volunteers", e);
  }
}

function saveVolunteers() {
  if (!currentUserEmail) return;
  const key = VOLUNTEER_KEY_PREFIX + currentUserEmail;
  localStorage.setItem(key, JSON.stringify(volunteers));
}

function renderVolunteerList(listEl) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!volunteers.length) {
    const li = document.createElement("li");
    li.className = "contacts-empty";
    li.textContent = "No volunteers enrolled yet.";
    listEl.appendChild(li);
    return;
  }

  volunteers.forEach((v) => {
    const li = document.createElement("li");
    li.textContent = `${v.name} - ${v.role}`;
    listEl.appendChild(li);
  });
}

function renderVolunteerListForAdmin(listEl) {
  renderVolunteerList(listEl);
}
// ========== LOAD SAMPLE DATA (DEMO REPORTS) ==========
function loadSampleData() {
  if (sampleDataLoaded) return;
  sampleDataLoaded = true;

  const demoReports = [
    {
      category: "Suspicious Activity",
      location: "RNSIT Main Gate",
      description:
        "Group of unknown people loitering near the main gate late evening.",
      anonymous: true,
      time: new Date().toLocaleString()
    },
    {
      category: "Broken Streetlight",
      location: "Hostel Road",
      description: "Streetlight not working, area remains dark after 7 PM.",
      anonymous: false,
      time: new Date().toLocaleString()
    },
    {
      category: "Harassment",
      location: "CSE Block Parking",
      description:
        "Student reported verbal harassment incident near parking area.",
      anonymous: true,
      time: new Date().toLocaleString()
    },
    {
      category: "Road Hazard",
      location: "Back Gate Junction",
      description: "Large pothole causing bikes to skid near back gate.",
      anonymous: false,
      time: new Date().toLocaleString()
    },
    {
      category: "Suspicious Activity",
      location: "RNSIT Main Gate",
      description:
        "Unattended bag spotted near the entrance, reported to security.",
      anonymous: true,
      time: new Date().toLocaleString()
    }
  ];

  reports = demoReports.concat(reports);
}

// ========== RENDER REPORTS ==========
function renderReports() {
  if (!reportsListEl || !noReportsTextEl) return;

  if (!reports.length) {
    noReportsTextEl.style.display = "block";
    reportsListEl.innerHTML = "";
    return;
  }

  noReportsTextEl.style.display = "none";
  reportsListEl.innerHTML = "";

  reports.forEach((report) => {
    const card = document.createElement("div");
    card.className = "report-card-item";

    const header = document.createElement("div");
    header.className = "report-header";

    const categorySpan = document.createElement("span");
    categorySpan.className = "report-category";
    categorySpan.textContent = report.category;

    const timeSpan = document.createElement("span");
    timeSpan.textContent = report.time;

    header.appendChild(categorySpan);
    header.appendChild(timeSpan);

    const locationP = document.createElement("p");
    locationP.style.fontSize = "0.85rem";
    locationP.style.color = "#9ca3af";
    locationP.textContent = `Location: ${report.location}`;

    const geoTag = document.createElement("p");
    geoTag.style.fontSize = "0.75rem";
    const inZone = isInGeofence(report.location);
    geoTag.style.color = inZone ? "#f97316" : "#6b7280";
    geoTag.textContent = inZone
      ? "Within critical campus safety zone (geo-fenced)."
      : "Outside predefined critical zones.";

    const body = document.createElement("p");
    body.className = "report-body";
    body.textContent = report.description;

    const anonInfo = document.createElement("p");
    anonInfo.style.fontSize = "0.8rem";
    anonInfo.style.color = "#6b7280";
    anonInfo.textContent = report.anonymous
      ? "Submitted anonymously"
      : "Name visible to authorities (demo).";

    card.appendChild(header);
    card.appendChild(locationP);
    card.appendChild(geoTag);
    card.appendChild(body);
    card.appendChild(anonInfo);

    reportsListEl.appendChild(card);
  });
}

// ========== GEOFENCE CHECK ==========
function isInGeofence(locationText) {
  if (!locationText) return false;
  const lower = locationText.toLowerCase();
  return GEOFENCE_ZONES.some((zone) =>
    lower.includes(zone.toLowerCase().trim())
  );
}

// ========== AI INSIGHTS + HEATMAP DRIVER ==========
function updateInsights() {
  if (!insightElements.count) return;

  if (!reports.length) {
    insightElements.count.textContent = "Not enough data yet.";
    insightElements.category.textContent = "Not enough data yet.";
    insightElements.area.textContent = "Not enough data yet.";
    insightElements.risk.textContent = "Low (waiting for more reports)";
    insightElements.geofence.textContent = "Critical zones not triggered yet.";
    insightElements.trend.textContent = "Not enough data to calculate trend.";
    updateHeatmap({}, 0);
    return;
  }

  const total = reports.length;
  const categoryCounts = {};
  const locationCounts = {};
  let geoFenceCount = 0;

  reports.forEach((r) => {
    if (!categoryCounts[r.category]) categoryCounts[r.category] = 0;
    categoryCounts[r.category]++;

    const locKey = r.location.toLowerCase().trim();
    if (!locationCounts[locKey]) {
      locationCounts[locKey] = { name: r.location, count: 0 };
    }
    locationCounts[locKey].count++;

    if (isInGeofence(r.location)) geoFenceCount++;
  });

  let topCategory = "Mixed issues";
  let topCategoryCount = 0;
  Object.keys(categoryCounts).forEach((cat) => {
    if (categoryCounts[cat] > topCategoryCount) {
      topCategoryCount = categoryCounts[cat];
      topCategory = cat;
    }
  });

  let topArea = "Spread across multiple locations";
  let topAreaCount = 0;
  Object.keys(locationCounts).forEach((key) => {
    if (locationCounts[key].count > topAreaCount) {
      topAreaCount = locationCounts[key].count;
      topArea = locationCounts[key].name;
    }
  });

  let riskLevel = "Low";
  let riskMessage = "Overall activity is low. Situation seems under control.";

  if (total >= 3 && total <= 5) {
    riskLevel = "Moderate";
    riskMessage =
      "There is noticeable activity. Authorities should monitor the situation.";
  } else if (total > 5) {
    riskLevel = "High";
    riskMessage =
      "High number of reports. Immediate attention and preventive action recommended.";
  }

  if (topCategory === "Harassment" || topCategory === "Suspicious Activity") {
    if (riskLevel === "Low") {
      riskLevel = "Moderate";
      riskMessage =
        "Sensitive reports detected. Even with fewer cases, proactive action is advised.";
    } else if (riskLevel === "Moderate") {
      riskLevel = "High";
      riskMessage =
        "Serious safety issues trending. Strong preventive and corrective steps needed.";
    }
  }

  const geoPercent = Math.round((geoFenceCount / total) * 100);
  const geoText =
    geoFenceCount === 0
      ? "Critical zones not triggered yet."
      : `${geoFenceCount} of ${total} reports (${geoPercent}%) are inside predefined critical campus zones.`;

  // Simple SafeScore (demo)
  let safeScore = 100 - total * 5;
  safeScore = Math.max(20, Math.min(100, safeScore));
  let trendText = `Estimated SafeScore: ${safeScore}/100 – lower score means more risk.`;

  if (total > 5 || riskLevel === "High") {
    trendText += " Trend: incidents appear to be increasing (demo inference).";
  } else if (total <= 3) {
    trendText += " Trend: currently stable with low incident volume.";
  } else {
    trendText += " Trend: moderate activity, worth monitoring.";
  }

  insightElements.count.textContent = `${total} report(s) in the recent log.`;
  insightElements.category.textContent = `${topCategory} (appears ${topCategoryCount} time(s))`;
  insightElements.area.textContent = `${topArea} (reported ${topAreaCount} time(s))`;
  insightElements.risk.textContent = `${riskLevel} – ${riskMessage}`;
  insightElements.geofence.textContent = geoText;
  insightElements.trend.textContent = trendText;

  updateHeatmap(locationCounts, total);
}

// ========== HEATMAP (LIST + MAP) ==========
function updateHeatmap(locationCounts, total) {
  if (!heatmapListEl) return;

  const locations = Object.values(locationCounts);

  if (!locations.length || !total) {
    heatmapListEl.innerHTML =
      '<p class="placeholder-text">Not enough data yet to build a heatmap.</p>';
    // clear map zones too
    updateMapHeatZones({});
    return;
  }

  locations.sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...locations.map((l) => l.count));
  heatmapListEl.innerHTML = "";

  locations.forEach((loc) => {
    const row = document.createElement("div");
    row.className = "heatmap-row";

    const label = document.createElement("span");
    label.className = "heatmap-label";
    label.textContent = `${loc.name} (${loc.count})`;

    const barOuter = document.createElement("div");
    barOuter.className = "heatmap-bar-outer";

    const barInner = document.createElement("div");
    barInner.className = "heatmap-bar-inner";

    const percentage = Math.max(
      15,
      Math.round((loc.count / maxCount) * 100)
    );
    barInner.style.width = `${percentage}%`;

    barOuter.appendChild(barInner);
    row.appendChild(label);
    row.appendChild(barOuter);

    heatmapListEl.appendChild(row);
  });

  // Also update the map heat zones
  updateMapHeatZones(locationCounts);
}

// ========== MAP HEAT ZONES USING LEAFLET ==========
function updateMapHeatZones(locationCounts) {
  if (!leafletMap || typeof L === "undefined") return;

  // Remove old circles
  heatCircles.forEach((circle) => leafletMap.removeLayer(circle));
  heatCircles = [];

  const zonesAgg = {};

  // Aggregate counts per known zone
  Object.values(locationCounts).forEach((entry) => {
    const locName = entry.name.toLowerCase();
    Object.keys(ZONE_COORD_LOOKUP).forEach((zoneKey) => {
      if (locName.includes(zoneKey)) {
        if (!zonesAgg[zoneKey]) zonesAgg[zoneKey] = 0;
        zonesAgg[zoneKey] += entry.count;
      }
    });
  });

  // Draw circles on the map for zones with data
  Object.entries(ZONE_COORD_LOOKUP).forEach(([zoneKey, zone]) => {
    const count = zonesAgg[zoneKey] || 0;
    if (!count) return;

    const radius = 40 + count * 30; // meters

    const circle = L.circle([zone.lat, zone.lng], {
      radius,
      color: "#f97316",
      fillColor: "#f97316",
      fillOpacity: 0.35
    })
      .addTo(leafletMap)
      .bindTooltip(
        `${zone.label} (${count} report${count > 1 ? "s" : ""})`,
        { permanent: false }
      );

    heatCircles.push(circle);
  });
}

// ========== CAMPUS-WIDE ANALYTICS ==========
function updateAnalyticsSummary() {
  const analyticsSummary = document.getElementById("analyticsSummary");
  const analyticsScore = document.getElementById("analyticsScore");

  if (!analyticsSummary || !analyticsScore) return;

  const totalReports = reports.length;
  const totalVolunteers = volunteers.length;
  const totalAlerts = sosAlerts.length;

  if (!totalReports && !totalVolunteers && !totalAlerts) {
    analyticsSummary.textContent =
      "Not enough data yet. Submit reports, join as volunteers, and trigger SOS to see analytics.";
    analyticsScore.textContent = "SafeScore: N/A";
    return;
  }

  let safetyScore = 100 - totalReports * 5 + totalVolunteers * 2;
  safetyScore = Math.max(10, Math.min(100, safetyScore));

  const parts = [];
  parts.push(`Total reports: ${totalReports}`);
  parts.push(`Total SOS alerts (demo): ${totalAlerts}`);
  parts.push(`Registered volunteers: ${totalVolunteers}`);

  analyticsSummary.textContent = parts.join(" | ");
  analyticsScore.textContent = `SafeScore (demo): ${safetyScore}/100`;
}

// ========== LEAFLET MAP INITIALIZATION ==========
function initMap() {
  const mapEl = document.getElementById("liveMap");
  if (!mapEl) return;
  if (typeof L === "undefined") {
    console.warn("Leaflet library not loaded.");
    return;
  }

  if (leafletMap) {
    // already initialized
    return;
  }

  // Center on RNSIT
  leafletMap = L.map("liveMap").setView([12.9397338, 77.5040948], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(leafletMap);

  // Campus center marker
  L.marker([12.9397338, 77.5040948])
    .addTo(leafletMap)
    .bindPopup("R N S Institute of Technology (RNSIT)")
    .openPopup();
}  
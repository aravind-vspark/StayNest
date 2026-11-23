const tr = (key, parameters) => globalThis.StayNestI18n?.translate(key, parameters) ?? key;
const $ = (s) => document.querySelector(s);
const mobileOrigin = globalThis.STAYNEST_MOBILE?.apiOrigin || "";
const apiURL = path => mobileOrigin + path;
const icons = {
  home: "M3 10l9-7 9 7v10H3z M9 20v-7h6v7",
  search: "M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  wifi: "M2 8a16 16 0 0 1 20 0 M5 12a11 11 0 0 1 14 0 M8 16a6 6 0 0 1 8 0 M12 20h0",
  food: "M4 2v7h5V2 M6.5 9v13 M18 2v20 M18 2c-5 4-5 10 0 10",
  bed: "M2 19V7 M22 19V7 M2 15h20 M4 15v-5h16v5 M5 10V5h14v5",
  shield: "M12 2l9 4v6c0 6-9 10-9 10S3 18 3 12V6z M8 12l3 3 5-6",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2",
  wallet: "M3 5h16v4 M3 5v15h19V9H3 M17 14h2",
  chat: "M21 3H3v14h4v5l6-5h8z M7 8h10 M7 12h7",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  user: "M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 22v-3a8 8 0 0 1 16 0v3",
  plus: "M12 4v16 M4 12h16",
  phone: "M5 3l4 5-3 3c2 3 4 5 7 7l3-3 5 4c-1 6-6 3-11 0S1 5 5 3",
  filter: "M3 5h18 M6 12h12 M9 19h6",
  check: "M4 12l5 5L20 6",
  map: "M1 6v15l7-4 8 4 7-4V2l-7 4-8-4-7 4zm7-2v13m8-11v13",
  video: "M23 7l-7 5 7 5V7z M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};
const ic = (n) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[n] || icons.home}"/></svg>`;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = n => new Intl.NumberFormat(globalThis.StayNestI18n?.locale() || "en-IN", {style:"currency",currency:"INR",maximumFractionDigits:2,minimumFractionDigits:0}).format(Number(n));
const photos = [
  "photo-1520277739336-7bf67edfa768",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1611892440504-42a792e24d32",
  "photo-1505693416388-ac5ce068fe85",
  "photo-1590490360182-c33d57733427",
  "photo-1566665797739-1674de7a421a",
];
const img = (i) => "/placeholder.svg";
function setExploreView(m) {
  exploreViewMode = m;
  render();
}
function quickFilter(k, v) {
  if (k === "all") {
    filters.loc = "";
    filters.type = "";
    filters.sharing = [];
    filters.amen = [];
  } else if (k === "loc") {
    filters.loc = filters.loc === v ? "" : v;
  } else if (k === "type") {
    filters.type = filters.type === v ? "" : v;
  } else if (k === "amen") {
    filters.amen = filters.amen.includes(v) ? filters.amen.filter((x) => x !== v) : [...filters.amen, v];
  } else if (k === "sharing") {
    filters.sharing = filters.sharing.includes(v) ? filters.sharing.filter((x) => x !== v) : [...filters.sharing, v];
  }
  render();
}
function explore() {
  if (view === "enquiries")
    return `<div class="pagehead"><div><div class="eyebrow">${tr("Your next chapter")}</div><h1>${tr("My enquiries")}</h1><p>${tr("Track your remote viewings and booking requests.")}</p></div></div><div class="panel">${db.enquiries.length ? db.enquiries.map((e) => `<div class="row"><div><h3>${esc(e.hostel)}</h3><p>${esc(tr(e.kind))} · ${esc(e.date)} · ${esc(e.name)}</p></div><span class="status">${esc(tr(e.status))}</span></div>`).join("") : empty(tr("No enquiries yet"), tr("Find a place you love and request a video tour."), tr("Explore hostels"), "nav('discover')")}</div>`;
  return `${view === "discover" ? `<section class="hero"><div><div class="eyebrow">${tr("A new city. A familiar feeling.")}</div><h1>${tr("Find a place.")}<br>${tr("Feel at home.")}</h1><p>${tr("Discover hostels that fit your life, your budget,")}<br>${tr("and your kind of people.")}</p></div><div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="house"><div class="roof"></div><div class="windows"><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="floating"><b>✓</b> ${tr("Your next home is out there.")}</div></div></section><form class="searchbar" onsubmit="event.preventDefault();applyFilters()"><div class="searchfield"><label for="location">${ic("pin")} ${tr("Where do you want to stay?")}</label><input id="location" placeholder="${tr("Area, hospital, tech park or hostel")}" oninput="applyFilters()" value="${esc(filters.loc)}" list="areas"><datalist id="areas"><option value="Apollo Hospital, Jubilee Hills"></option><option value="KIMS Hospital, Kondapur"></option><option value="AIG Hospitals, Gachibowli"></option><option value="Care Hospitals, HITEC City"></option>${[...new Set(db.listings.map(h => h.area))].sort().map(a => `<option value="${esc(a)}"></option>`).join("")}</datalist></div><div class="searchfield"><label for="hosteltype">${tr("Looking for")}</label><select id="hosteltype" onchange="applyFilters()"><option value="">${tr("All hostel types")}</option>${["Women", "Men", "Co-living"].map((a) => `<option value="${a}" ${filters.type === a ? "selected" : ""}>${tr(a)}</option>`).join("")}</select></div><button class="btn" type="submit">${ic("search")} ${tr("Find my stay")}</button></form><div class="filter-chips"><button class="chip ${!filters.loc && !filters.type && !filters.amen.length && !filters.sharing.length ? 'active' : ''}" onclick="quickFilter('all')">${tr("All Hostels")}</button><button class="chip ${filters.loc === 'hospital' ? 'active' : ''}" onclick="quickFilter('loc', 'hospital')">🏥 ${tr("Near Hospitals")}</button><button class="chip ${filters.type === 'Women' ? 'active' : ''}" onclick="quickFilter('type', 'Women')">👩 ${tr("Women")}</button><button class="chip ${filters.type === 'Men' ? 'active' : ''}" onclick="quickFilter('type', 'Men')">👨 ${tr("Men")}</button><button class="chip ${filters.type === 'Co-living' ? 'active' : ''}" onclick="quickFilter('type', 'Co-living')">👥 ${tr("Co-living")}</button><button class="chip ${filters.amen.includes('Meals') ? 'active' : ''}" onclick="quickFilter('amen', 'Meals')">🍽️ ${tr("Meals included")}</button><button class="chip ${filters.sharing.includes(1) ? 'active' : ''}" onclick="quickFilter('sharing', 1)">🛏️ ${tr("Private Room")}</button></div>` : `<div class="pagehead"><div><div class="eyebrow">${tr("Keep your favourites close")}</div><h1>${tr("Saved places")}</h1><p>${tr("Your shortlist, all in one place.")}</p></div></div>`}<div class="layout"><aside class="filters"><div class="filter-head"><h3>${ic("filter")} ${tr("Filters")}</h3><button class="textbtn" onclick="resetFilters()">${tr("Reset")}</button><button class="mobile-filter hide" aria-label="${tr("Toggle filters")}" onclick="this.closest('aside').classList.toggle('expanded')">⌄</button></div><div class="filter-group"><h4>${tr("Monthly budget")}</h4><input aria-label="${tr("Maximum monthly budget")}" id="budget" type="range" min="5000" max="20000" step="500" value="${filters.max}" oninput="filters.max=+this.value;$('#budgetlabel').textContent=money(this.value);renderCards()"><div class="between small muted"><span>₹5,000</span><b id="budgetlabel">${money(filters.max)}</b></div></div><div class="filter-group"><h4>${tr("Room sharing")}</h4>${[1, 2, 3, 4].map((n) => `<label><input type="checkbox" ${filters.sharing.includes(n) ? "checked" : ""} onchange="toggleFilter('sharing',${n},this.checked)">${n === 1 ? tr("Private room") : tr("{count} sharing", {count:n})}</label>`).join("")}</div><div class="filter-group"><h4>${tr("Make yourself comfortable")}</h4>${["Wi-Fi", "Meals", "AC", "Laundry", "Gym"].map((a) => `<label><input type="checkbox" ${filters.amen.includes(a) ? "checked" : ""} onchange="toggleFilter('amen','${a}',this.checked)">${tr(a === "Meals" ? "Meals included" : a)}</label>`).join("")}</div><div class="filter-group"><button class="btn light small" onclick="nearby()" ${locating ? "disabled" : ""}>${ic("pin")} ${tr(locating ? "Finding your location..." : "Use my location")}</button>${geo ? `<button class="textbtn" onclick="clearLocation()">${tr("Clear my location")}</button>` : ""}<p class="small muted" style="margin-top:10px">${tr(geo ? "Distances use your location." : "Distances from Gachibowli. Enable location for nearby results.")}</p></div></aside><section><div class="between results-head"><div><h2>${tr(view === "saved" ? "Your favourites" : "A good stay starts here")}</h2><p id="count" class="muted"></p></div><div style="display:flex;align-items:center;gap:10px"><div class="view-toggle"><button class="${exploreViewMode==='list'?'active':''}" onclick="setExploreView('list')" aria-label="${tr("List view")}">${ic("grid")} ${tr("List")}</button><button class="${exploreViewMode==='map'?'active':''}" onclick="setExploreView('map')" aria-label="${tr("Map view")}">${ic("map")} ${tr("Map")}</button></div><select class="sort" aria-label="${tr("Sort hostels")}" onchange="filters.sort=this.value;renderCards()">${[
    ["recommended", "Recommended"],
    ["price", "Price: low to high"],
    ["distance", "Nearest first"],
    ["rating", "Highest rated"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${filters.sort === v ? "selected" : ""}>${tr(l)}</option>`,
    )
    .join(
      "",
    )}</select></div></div><div id="cards" class="cards"></div></section></div>`;
}
function empty(title, body, label, action) {
  return `<div class="empty">${ic("search")}<h3>${title}</h3><p>${body}</p>${label ? `<button class="btn light" onclick="${action}">${label}</button>` : ""}</div>`;
}
function applyFilters() {
  filters.loc = ($("#location")?.value ?? filters.loc).trim();
  filters.type = $("#hosteltype")?.value ?? filters.type;
  renderCards();
}
function searchText(value) {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
const landmarkAliases = {
  hospital: ["gachibowli", "kondapur", "madhapur", "kukatpally"],
  apollo: ["gachibowli", "madhapur"],
  kims: ["kondapur", "gachibowli"],
  aig: ["gachibowli", "madhapur"],
  care: ["gachibowli", "hitec city"],
  metro: ["hitec city", "madhapur", "kukatpally"]
};
function matchesLocation(hostel, query) {
  const q = searchText(query);
  if (!q) return true;
  const text = searchText([hostel.area, hostel.name, hostel.address].join(" "));
  const words = q.split(/\s+/).filter(Boolean);
  const directMatch = words.every(word => text.includes(word));
  if (directMatch) return true;
  for (const [key, areas] of Object.entries(landmarkAliases)) {
    if (q.includes(key) && areas.some(a => text.includes(a))) return true;
  }
  return false;
}
function resetFilters() {
  filters = {
    loc: "",
    type: "",
    max: 15000,
    sharing: [],
    amen: [],
    sort: "recommended",
  };
  render();
}
function toggleFilter(k, v, on) {
  filters[k] = on ? [...filters[k], v] : filters[k].filter((x) => x !== v);
  renderCards();
}
function renderCards() {
  if (!$("#cards")) return;
  let list = db.listings.filter(
    (h) =>
      (view !== "saved" || db.saved.includes(h.id)) &&
      matchesLocation(h, filters.loc) &&
      (!filters.type || h.type === filters.type) &&
      h.price <= filters.max &&
      (!filters.sharing.length ||
        (h.sharing_options || [h.sharing]).some((n) =>
          filters.sharing.includes(n),
        )) &&
      filters.amen.every((a) => h.amen.includes(a)),
  );
  if (filters.sort === "price") list.sort((a, b) => a.price - b.price);
  if (filters.sort === "distance") list.sort((a, b) => a.distance - b.distance);
  if (filters.sort === "rating") list.sort((a, b) => b.rating - a.rating);
  $("#count").textContent = tr("{count} hostels", {count:list.length}) + (geo ? " · " + tr("Distance from you") : "");
  if (exploreViewMode === "map") {
    const hospitals = [
      { name: "Apollo Hospital", area: "Gachibowli / Jubilee Hills" },
      { name: "KIMS Hospital", area: "Kondapur" },
      { name: "AIG Hospitals", area: "Gachibowli" },
      { name: "Care Hospitals", area: "HITEC City" }
    ];
    $("#cards").innerHTML = `
      <div class="map-panel" style="grid-column: 1/-1;">
        <div style="width:100%;text-align:center;margin-bottom:18px">
          <span class="hospital-badge">🏥 ${tr("Hospital & Landmark Proximity Map")}</span>
          <p class="small muted" style="margin-top:6px">${tr("Tap any hostel pin to view rooms, video tours, vacancies and prices")}</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:800px;margin-bottom:20px">
          ${hospitals.map(h => `<div style="background:#ffebee;color:#b71c1c;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:6px">🏥 ${esc(h.name)} <small style="color:#c62828">(${esc(h.area)})</small></div>`).join("")}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:850px">
          ${list.map(h => `
            <button class="map-pin-pill" onclick="detail(${h.id})" title="${esc(h.name)} · ${esc(h.area)}">
              <span>📍 ${esc(h.name)}</span>
              <b style="background:var(--lime);color:var(--green);padding:2px 7px;border-radius:10px">${money(h.price)}</b>
              <small style="color:#52744e">${h.distance ? h.distance.toFixed(1) + " km" : esc(h.area)}</small>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    return;
  }
  $("#cards").innerHTML = list.length
    ? list
        .map(
          (h) =>
            `<article class="card"><div class="photo"><img src="${esc(h.photo || img(h.id - 1))}" alt="Room at ${esc(h.name)}" loading="lazy"><span class="badge">${h.sharing_options?.length > 1 ? tr("Multiple room types") : h.sharing === 1 ? tr("Private room") : tr("{count} sharing", {count:h.sharing})}</span><button class="heart ${db.saved.includes(h.id) ? "saved" : ""}" aria-label="${db.saved.includes(h.id) ? "Unsave" : "Save"} ${esc(h.name)}" onclick="toggleSave(${h.id})">${ic("heart")}</button></div><div class="cardbody"><div class="between"><div class="type">${tr(h.type === "Men" ? "Men’s hostel" : h.type === "Women" ? "Women’s hostel" : "Co-living")}</div><div class="rating"><span>★</span> ${h.rating || tr("New")}</div></div><h3><button style="padding:0;text-align:left" onclick="detail(${h.id})">${esc(h.name)}</button></h3><p class="address">${esc(h.area)} · ${tr("{distance} km away", {distance:h.distance.toFixed(1)})}</p><div class="amenities">${h.amen
              .slice(0, 3)
              .map(
                (a) =>
                  `<span>${ic(a === "Wi-Fi" ? "wifi" : a === "Meals" ? "food" : "check")}${tr(a)}</span>`,
              )
              .join(
                "",
              )}</div><div class="cardfoot"><div><div class="price">${money(h.price)} <small>${tr("/ month")}</small></div><div class="vacancy">${tr("{count} beds available", {count:h.beds})}</div></div><button class="arrow" aria-label="View ${esc(h.name)}" onclick="detail(${h.id})">${ic("arrow")}</button></div></div></article>`,
        )
        .join("")
    : empty(
        tr("No places match just yet"),
        tr("Try a wider budget or fewer filters."),
        tr("Reset filters"),
        "resetFilters()",
      );
}
function nearby() {
  if (locating) return;
  const locate = globalThis.StayNestNative?.locate || navigator.geolocation?.getCurrentPosition.bind(navigator.geolocation);
  if (!locate)
    return toast(tr("Location is unavailable. Search an area instead."));
  applyFilters();
  locating = true;
  render();
  toast(tr("Requesting your location…"));
  locate(
    (p) => {
      locating = false;
      const {latitude, longitude} = p.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        render();
        return toast(tr("Your device returned an invalid location. Search an area instead."));
      }
      userCoordinates = {lat: latitude, lon: longitude};
      updateDistances();
      geo = true;
      filters.sort = "distance";
      filters.loc = "";
      render();
      toast(tr("Hostels sorted by distance from you."));
    },
    (error) => {
      locating = false;
      render();
      toast(error.code === 1 ? "Location permission is blocked. Allow location in your browser's site settings, then try again." : error.code === 3 ? "Finding your location timed out. Try again or search an area." : "Your device could not find its location. Search an area instead.");
    },
    { timeout: 15000, maximumAge: 60000, enableHighAccuracy: false },
  );
}
function updateDistances() {
  const point = userCoordinates || {lat: 17.4401, lon: 78.3489};
  db.listings.forEach(h => h.distance = distance(point.lat, point.lon, h.lat, h.lon));
}
function clearLocation() {
  userCoordinates = null;
  geo = false;
  if (filters.sort === "distance") filters.sort = "recommended";
  updateDistances();
  render();
}
function modal(title, body) {
  $("#modal").innerHTML =
    `<div class="modalhead"><h2>${title}</h2><button class="close" aria-label="${tr("Close dialog")}" onclick="$('#modal').close()">×</button></div><div class="modalbody">${body}</div>`;
  if (!$("#modal").open) $("#modal").showModal();
}
function closeModal() {
  $("#modal").close();
}
let mode = "Explore",
  view = "discover",
  ownerTab = "Overview",
  exploreViewMode = "list",
  geo = false,
  user = null,
  selectedProperty = null,
  state = null,
  loading = false;
let userCoordinates = null;
let locating = false;
let filters = {
  loc: "",
  type: "",
  max: 15000,
  sharing: [],
  amen: [],
  sort: "recommended",
};
let db = { listings: [], saved: [], enquiries: [] };
const toast = (t) => {
  $("#toast").textContent = tr(t);
  $("#toast").classList.add("visible");
  setTimeout(() => $("#toast").classList.remove("visible"), 4000);
};
async function api(path, method = "GET", data) {
  let opts = {
    method,
    credentials: mobileOrigin ? "include" : "same-origin",
    headers: { "X-StayNest-Request": "1" },
  };
  if (mobileOrigin) opts.headers.Origin = mobileOrigin;
  if (data instanceof FormData) opts.body = data;
  else if (data !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(data);
  }
  let r = await fetch(apiURL("/api" + path), opts);
  let body = await r.json().catch(() => ({ detail: "Request failed" }));
  if (!r.ok) {
    let msg = Array.isArray(body.detail)
      ? body.detail.map((x) => x.msg).join("; ")
      : body.detail;
    let e = new Error(tr(msg || "Request failed"));
    e.status = r.status;
    throw e;
  }
  function media(value) {
    if (Array.isArray(value)) value.forEach(media);
    else if (value && typeof value === "object") {
      if (typeof value.photo === "string" && value.photo.startsWith("/media/")) value.photo = apiURL(value.photo);
      Object.values(value).forEach(media);
    }
  }
  if (mobileOrigin) media(body);
  return body;
}
async function action(fn) {
  if (loading) return;
  loading = true;
  try {
    await fn();
  } catch (e) {
    toast(e.message);
  } finally {
    loading = false;
  }
}
async function refresh() {
  db.listings = await api("/properties");
  updateDistances();
  if (user) {
    user = await api("/me");
    [db.saved, db.enquiries] = await Promise.all([
      api("/saved"),
      api("/enquiries"),
    ]);
    if (mode === "Owner" && user.properties.length) {
      if (!user.properties.some((p) => p.id === selectedProperty))
        selectedProperty = user.properties[0].id;
      state = await api("/owner/" + selectedProperty + "?offset=" + historyOffset);
    } else if (mode === "Tenant") {
      state = user.tenant ? await api("/tenant") : { property: null, tenancy: null };
      state.invoices = await api("/invoices?offset=" + billingOffset);
    }
    else state = null;
  }
  if (user?.tenant && new URLSearchParams(location.search).get("billing") === "1") {
    mode="Tenant"; view="payments"; state=await api("/tenant");
  }
  render();
}
function distance(a, b, c, d) {
  let rad = (x) => (x * Math.PI) / 180;
  let n =
    Math.sin(rad(c - a) / 2) ** 2 +
    Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2;
  n = Math.max(0, Math.min(1, n));
  return 12742 * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n));
}
async function setMode(m) {
  if (loading) return;
  if (m !== "Explore" && !user) {
    pendingMode = m;
    return auth();
  }
  mode = m;
  view = m === "Explore" ? "discover" : m === "Tenant" ? "home" : "owner";
  await action(refresh);
}
function nav(v) {
  view = v;
  render();
}
function render() {
  if (!user) {
    const featuredList = (db.listings || []).slice(0, 3);
    $("#app").innerHTML = `
      <header>
        <button class="brand" onclick="render()" aria-label="${tr("StayNest home")}">
          <span class="brandmark">${ic("home")}</span>${tr("StayNest")}<span style="color:#8ba26c">.</span>
        </button>
        <div class="right">
          ${languageSelector()}
          <div class="account">
            <button class="btn small" onclick="auth()">${tr("Sign in")}</button>
            <button class="btn small light" onclick="auth(true)">${tr("Get started")}</button>
          </div>
        </div>
      </header>
      <main class="shell">
        <section class="landing-hero">
          <div>
            <div class="eyebrow">✦ ${tr("A new city. A familiar feeling.")}</div>
            <h1>${tr("Find a place.")}<br>${tr("Feel at home.")}</h1>
            <p>${tr("Discover verified hostels that fit your life, budget, and commute. Ideal for students, working professionals, and hospital visitors.")}</p>
            <form class="landing-search" onsubmit="event.preventDefault();filters.loc=$('#landing-input').value;auth(true)">
              ${ic("pin")}
              <input id="landing-input" placeholder="${tr("Search area, hospital (e.g. Apollo, KIMS), or tech park")}">
              <button class="btn" type="submit">${ic("search")} ${tr("Search")}</button>
            </form>
          </div>
          <div class="hero-art" aria-hidden="true" style="margin-left:20px">
            <div class="sun"></div>
            <div class="house">
              <div class="roof"></div>
              <div class="windows"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
        </section>

        <div class="trust-row">
          <div class="trust-item">${ic("shield")} ${tr("100% Verified Properties")}</div>
          <div class="trust-item">${ic("bed")} ${tr("Real-time Available Beds")}</div>
          <div class="trust-item">${ic("pin")} ${tr("Near Hospitals & Tech Hubs")}</div>
          <div class="trust-item">${ic("wallet")} ${tr("Direct Digital Rent Receipts")}</div>
        </div>

        <div style="margin:40px 0 20px">
          <div class="eyebrow">${tr("Simple & paperless")}</div>
          <h2>${tr("How StayNest works")}</h2>
        </div>
        <div class="how-it-works">
          <div class="how-step">
            <span class="step-number">1</span>
            <div class="step-icon">${ic("search")}</div>
            <h3>${tr("Explore & Tour")}</h3>
            <p>${tr("Browse verified hostels by budget, room sharing, or proximity to hospitals & offices. Request video tours remotely without travel.")}</p>
          </div>
          <div class="how-step">
            <span class="step-number">2</span>
            <div class="step-icon">${ic("pin")}</div>
            <h3>${tr("Scan QR at Reception")}</h3>
            <p>${tr("Simply scan the hostel's join QR code at the reception desk. The owner approves and assigns your bed in seconds.")}</p>
          </div>
          <div class="how-step">
            <span class="step-number">3</span>
            <div class="step-icon">${ic("home")}</div>
            <h3>${tr("Live Hassle-Free")}</h3>
            <p>${tr("View digital hostel noticeboards, daily food menus, pay rent with instant receipts, and raise maintenance tickets.")}</p>
          </div>
        </div>

        ${featuredList.length ? `
          <div class="featured-preview">
            <div class="between" style="margin-bottom:18px">
              <div>
                <div class="eyebrow">${tr("Featured properties")}</div>
                <h2>${tr("Popular stays in Hyderabad")}</h2>
              </div>
              <button class="btn small light" onclick="auth()">${tr("View all hostels →")}</button>
            </div>
            <div class="cards">
              ${featuredList.map(h => `
                <div class="hostel-preview" style="border:1px solid var(--line);background:#fff;border-radius:16px;overflow:hidden">
                  <div class="photo">
                    <img src="${esc(h.photo || img(h.id - 1))}" alt="Room at ${esc(h.name)}" loading="lazy">
                    <span class="badge">${h.sharing === 1 ? tr("Private room") : tr("{count} sharing", {count:h.sharing})}</span>
                  </div>
                  <div class="cardbody">
                    <div class="between">
                      <div class="type">${tr(h.type === "Men" ? "Men’s hostel" : h.type === "Women" ? "Women’s hostel" : "Co-living")}</div>
                      <div class="rating">★ ${h.rating || tr("New")}</div>
                    </div>
                    <h3>${esc(h.name)}</h3>
                    <p class="address">📍 ${esc(h.area)} · ${tr("{distance} km away", {distance:h.distance ? h.distance.toFixed(1) : "1.2"})}</p>
                    <div class="cardfoot" style="margin-top:14px">
                      <div>
                        <div class="price">${money(h.price)} <small>${tr("/ month")}</small></div>
                        <div class="vacancy">● ${tr("{count} beds available", {count:h.beds})}</div>
                      </div>
                      <button class="btn small" onclick="auth()">${tr("View stay")}</button>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <div class="owner-pitch">
          <div>
            <div class="eyebrow" style="color:#d0e6ba">🏢 ${tr("For Hostel Owners & Wardens")}</div>
            <h2>${tr("Run your hostel smoothly without extra staff")}</h2>
            <p>${tr("Eliminate manual paperwork, phone call coordination, and physical room showing. StayNest handles daily hostel operations in one place.")}</p>
            <ul class="benefit-list">
              <li>${ic("check")} ${tr("Remote video tours eliminate the need for staff to physically show rooms to every enquiry.")}</li>
              <li>${ic("check")} ${tr("Digital noticeboard broadcasts meal alerts ('Food is ready!') & gate timings instantly to all residents.")}</li>
              <li>${ic("check")} ${tr("Reception join QR lets new residents onboard digitally without paper registers.")}</li>
              <li>${ic("check")} ${tr("Automated rent invoicing, payment tracking, and structured maintenance complaint handling.")}</li>
            </ul>
            <div style="margin-top:20px">
              <button class="btn" onclick="auth(true)">${tr("Register your property →")}</button>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:16px;padding:24px;text-align:center">
            <div style="font-size:36px;margin-bottom:10px">📱</div>
            <h3 style="color:#fff;margin-bottom:8px">${tr("Reception Join QR")}</h3>
            <p style="color:#dbe9c6;font-size:12px;line-height:1.6">${tr("Print one QR code for your reception. Walk-in tenants scan, request admission, and you assign their bed with one tap.")}</p>
          </div>
        </div>

        <div class="footer-note" style="margin-top:40px">
          <span>${tr("StayNest · A little closer to home.")}</span>
          <span>${tr("Availability confirmed by verified property owners.")}</span>
        </div>
      </main>
    `;
    return;
  }
  const navs =
    mode === "Explore"
      ? [
          ["discover", "Explore hostels", "search"],
          ["saved", "Saved places", "heart"],
          ["enquiries", "My enquiries", "chat"],
        ]
      : mode === "Tenant"
        ? [
            ["home", "My hostel", "home"],
            ["payments", "Payments", "wallet"],
            ["requests", "My requests", "chat"],
          ]
        : [
            ["owner", "Dashboard", "grid"],
            ["property", "My property", "home"],
          ];
  $("#app").innerHTML =
    `<header><button class="brand" onclick="setMode('Explore')" aria-label="${tr("StayNest home")}"><span class="brandmark">${ic("home")}</span>${tr("StayNest")}<span style="color:#8ba26c">.</span></button><nav class="topnav">${navs.map(([v, l]) => `<button class="${view === v ? "active" : ""}" onclick="nav('${v}')">${tr(l)}</button>`).join("")}</nav><div class="right">${languageSelector()}<div class="mode" aria-label="${tr("App mode")}">${["Explore", "Tenant", "Owner"].map((m) => `<button class="${m === mode ? "active" : ""}" onclick="setMode('${m}')">${tr(m === 'Explore' ? 'Find a hostel' : m === 'Tenant' ? 'My stay' : 'Owner workspace')}</button>`).join("")}</div><button class="bell" aria-label="${tr("Notifications")}" onclick="notifications()">${ic("bell")}</button></div><div class="account">${user ? `<span class="avatar" title="${esc(user.name)}">${esc(user.name.slice(0, 2).toUpperCase())}</span><button onclick="accountSettings()">${tr("Account")}</button><button onclick="signout()">${tr("Sign out")}</button>` : `<button class="btn small" onclick="auth()">${tr("Sign in")}</button>`}</div></header><main class="shell">${db.listings.some(p => p.demonstration) ? `<p class="notice">${tr("Demo session: sample listings and residents are included. New registrations and changes are saved.")}</p>` : ""}${mode === "Explore" ? journey() + explore() : mode === "Tenant" ? tenant() : owner()}<div class="footer-note"><span>${tr("StayNest · A little closer to home.")}</span><span>${tr("Availability confirmed by property owners.")}</span></div><div class="footer-links" style="display:flex;gap:12px;justify-content:center;margin:8px 0 16px;font-size:12px"><a href="/privacy.html" style="color:var(--muted)">${tr("Privacy Policy")}</a> · <a href="/terms.html" style="color:var(--muted)">${tr("Terms of Service")}</a> · <a href="/refund.html" style="color:var(--muted)">${tr("Refund Policy")}</a></div></main><nav class="bottomnav">${navs.map(([v, l, i]) => `<button class="${view === v ? "active" : ""}" onclick="nav('${v}')">${ic(i)}${tr(l)}</button>`).join("")}<button onclick="notifications()">${ic("bell")}${tr("Updates")}</button></nav>`;
  if (mode === "Explore") renderCards();
  if (globalThis.StayNestNative && $("#join-qr")) {
    const image = $("#join-qr");
    fetch(apiURL(`/api/owner/${selectedProperty}/qr`), {credentials:"include"})
      .then(response => {if (!response.ok) throw new Error(tr("Could not load join QR")); return response.blob();})
      .then(blob => {const url = URL.createObjectURL(blob);image.onload=()=>URL.revokeObjectURL(url);image.src=url;})
      .catch(error => toast(error.message));
  }
}
function languageSelector() {
  const service=globalThis.StayNestI18n;
  if (!service) return "";
  return `<label class="language-picker"><span>${tr("Language")}</span><select aria-label="${tr("Application language")}" onchange="changeLanguage(this.value)">${Object.entries(service.languages).map(([code,name])=>`<option value="${code}" ${service.getLanguage()===code?'selected':''}>${name}</option>`).join('')}</select></label>`;
}
function changeLanguage(code) {
  const drafts=[...(document.querySelectorAll?.('#app form') || [])].map(form=>({
    submit:form.getAttribute('onsubmit'),
    fields:[...form.elements].filter(field=>field.name&&field.type!=='file').map(field=>({name:field.name,type:field.type,value:field.value,checked:field.checked}))
  }));
  if (!globalThis.StayNestI18n?.setLanguage(code)) return;
  document.title=tr("StayNest — Find your place");
  render();
  for(const form of document.querySelectorAll?.('#app form') || []){
    const draft=drafts.find(saved=>saved.submit===form.getAttribute('onsubmit'));
    if(!draft)continue;
    for(const field of form.elements){
      const saved=draft.fields.find(value=>value.name===field.name&&value.type===field.type&&(!['checkbox','radio'].includes(field.type)||value.value===field.value));
      if(!saved)continue;
      if(['checkbox','radio'].includes(field.type))field.checked=saved.checked;
      else field.value=saved.value;
    }
  }
  document.querySelector('.language-picker select')?.focus?.({preventScroll:true});
}
let pendingMode = null;
let lastReceipt = null;
function homeMode() {
  mode = user.tenant ? "Tenant" : (user.properties.length || user.onboarding_intent === "owner") ? "Owner" : user.onboarding_intent === "tenant" ? "Tenant" : "Explore";
  view = mode === "Tenant" ? "home" : mode === "Owner" ? "owner" : "discover";
}
function journey() {
  if (!user) return "";
  if (user.tenant) return `<div class="panel"><h2>${tr("You're settled in at {hostel}", {hostel:esc(user.active_property?.name || tr("your hostel"))})}</h2><p>${tr("Your saved places and enquiries stay with your account.")}</p><button class="btn" onclick="setMode('Tenant')">${tr("Open my hostel")}</button></div>`;
  const requests = (user.join_requests || []).filter(r => r.status === "Requested");
  return `<div class="panel"><h2>${requests.length ? "Your move-in is awaiting approval" : "From finding a place to feeling at home"}</h2>${requests.map(r => `<p><b>${esc(r.property_name)}</b> ${tr("· Waiting for the owner to verify you and assign a bed.")}</p>`).join("")}<p>${tr("Shortlist a hostel → arrange a visit → scan its join QR at reception → get your room approved. Your account becomes a tenant account automatically.")}</p><div class="detail-actions"><button class="btn light" onclick="explorePage('saved')">${tr("My shortlist")}</button><button class="btn light" onclick="explorePage('enquiries')">${tr("My visits & enquiries")}</button><button class="btn light" onclick="joinByCode()">${tr("I have a hostel join link")}</button></div></div>`;
}
async function explorePage(page) {
  await setMode("Explore");
  nav(page);
}
function joinByCode() {
  modal(tr("Join your hostel"), `<p>${tr("Ask the owner for the join link or scan the QR at reception. Approval is required before hostel services open.")}</p><form onsubmit="openJoinLink(event)"><label class="field">${tr("Hostel join link")}<input name="link" type="url" required placeholder="${esc(location.origin || "http://localhost:8000")}/?join=…"></label><button class="btn">${tr("Continue")}</button></form>`);
}
async function openJoinLink(event) {
  event.preventDefault();
  try {
    const link = new URL(new FormData(event.target).get("link"));
    const code = link.searchParams.get("join");
    if (link.origin !== (mobileOrigin || location.origin) || !code || !/^[A-Za-z0-9_-]{20,64}$/.test(code)) throw new Error(tr("Use the join link provided by this StayNest hostel."));
    history.replaceState({}, "", "/?join=" + encodeURIComponent(code));
    await joinFromLink();
  } catch (err) { toast(err.message); }
}
function auth(register = false) {
  modal(
    tr(register ? "Create your account" : "Welcome to StayNest"),
    `<form class="authform" onsubmit="authenticate(event,${register})">${register ? `<label class="field">${tr("Full name")}<input name="name" required minlength="2" maxlength="80" autocomplete="name"></label>` : ""}${register ? `<label class="field">${tr("What brings you to StayNest?")}<select name="onboarding_intent"><option value="seeker">${tr("I am looking for a hostel")}</option><option value="tenant">${tr("I already stay at a hostel")}</option><option value="owner">${tr("I own or manage a hostel")}</option></select></label><p class="small muted">${tr("One account follows your journey. Find a place first; become a tenant after your owner approves you.")}</p>` : ""}<label class="field">${tr("Email")}<input name="email" type="email" required autocomplete="email"></label><label class="field">${tr("Password")}<input name="password" type="password" minlength="12" maxlength="128" required autocomplete="${register ? "new-password" : "current-password"}"></label><p class="small muted">${tr("Use at least 12 characters. Owner approval is required before a property can be published.")}</p><button class="btn" style="width:100%;margin:18px 0">${tr(register ? "Create account" : "Sign in")}</button><button type="button" class="textbtn" onclick="auth(${!register})">${tr(register ? "Already registered? Sign in" : "New here? Create an account")}</button>${!register ? `<button type="button" class="textbtn" style="display:block;margin-top:10px" onclick="forgotPassword()">${tr("Forgot password?")}</button>` : ""}<p id="auth-error" role="alert" style="color:#a64530;margin-top:15px"></p></form>`,
  );
}
function forgotPassword() {
  modal(
    tr("Reset your password"),
    `<form class="authform" onsubmit="submitForgotPassword(event)"><p class="small muted">${tr("Enter your registered email address to receive password reset instructions.")}</p><label class="field">${tr("Email")}<input name="email" type="email" required autocomplete="email"></label><button class="btn" style="width:100%;margin:18px 0">${tr("Send reset code")}</button><button type="button" class="textbtn" onclick="auth(false)">${tr("Back to sign in")}</button><p id="reset-msg" role="alert" style="margin-top:12px"></p></form>`,
  );
}
async function submitForgotPassword(e) {
  e.preventDefault();
  const email = new FormData(e.target).get("email");
  try {
    const res = await api("/auth/forgot-password", "POST", { email });
    modal(
      tr("Enter new password"),
      `<form class="authform" onsubmit="submitResetPassword(event)"><p class="small muted">${res.debug_token ? `${tr("Reset code generated.")} [Debug token: ${res.debug_token}]` : tr("Enter the reset code sent to your email and your new password.")}</p><label class="field">${tr("Reset code / token")}<input name="token" required value="${esc(res.debug_token || "")}"></label><label class="field">${tr("New password")}<input name="new_password" type="password" minlength="12" maxlength="128" required autocomplete="new-password"></label><p class="small muted">${tr("Use at least 12 characters.")}</p><button class="btn" style="width:100%;margin:18px 0">${tr("Update password")}</button><button type="button" class="textbtn" onclick="auth(false)">${tr("Back to sign in")}</button><p id="reset-err" role="alert" style="color:#a64530;margin-top:12px"></p></form>`,
    );
  } catch (err) {
    const msg = $("#reset-msg");
    if (msg) { msg.textContent = err.message; msg.style.color = "#a64530"; } else toast(err.message);
  }
}
async function submitResetPassword(e) {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  try {
    await api("/auth/reset-password", "POST", f);
    toast(tr("Password updated successfully. Please sign in."));
    auth(false);
  } catch (err) {
    const msg = $("#reset-err");
    if (msg) { msg.textContent = err.message; msg.style.color = "#a64530"; } else toast(err.message);
  }
}
async function authenticate(e, register) {
  e.preventDefault();
  let f = Object.fromEntries(new FormData(e.target));
  await action(async () => {
    try {
      await api("/auth/" + (register ? "register" : "login"), "POST", f);
      user = await api("/me");
      if (register) pendingMode = null;
      if (pendingMode) {
        mode = pendingMode;
        view = mode === "Tenant" ? "home" : "owner";
        pendingMode = null;
      } else homeMode();
      closeModal();
      await refresh();
      await joinFromLink();
      if (new URLSearchParams(location.search).get("account") === "delete") accountSettings();
    } catch (err) {
      $("#auth-error").textContent = err.message;
    }
  });
}
async function signout() {
  await action(async () => {
    if (globalThis.StayNestNative) {
      await api("/push/subscriptions", "DELETE");
      await globalThis.StayNestNative.disablePush().catch(() => {});
    }
    await api("/auth/logout", "POST");
    user = null;
    lastReceipt = null;
    billingOffset = 0;
    historyOffset = 0;
    state = null;
    db.saved = [];
    db.enquiries = [];
    mode = "Explore";
    view = "discover";
    render();
  });
}
function accountSettings() {
  if (!user) return auth();
  const phoneBox = user.phone_verified
    ? `<div style="background:#f0f5eb;padding:12px;border-radius:8px;margin:12px 0"><p style="margin:0"><b>${tr("Verified phone number:")}</b> ${esc(user.phone || "")} <span style="background:#2e7d32;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">✓ ${tr("Verified")}</span></p></div>`
    : `<div style="background:#fff9e6;border:1px solid #ffe082;padding:12px;border-radius:8px;margin:12px 0"><p style="margin:0 0 6px;font-size:13px"><b>${tr("Verify your phone number (OTP)")}</b></p><p class="small muted" style="margin:0 0 10px">${tr("Required for hostel check-ins, rent invoicing, and owner communication.")}</p><div style="display:flex;gap:8px"><input id="otp-phone-input" type="tel" placeholder="+91 9876543210" value="${esc(user.phone || "")}" style="flex:1"><button class="btn small" type="button" onclick="sendPhoneOTP()">${tr("Send OTP")}</button></div><div id="otp-step-2" style="display:none;margin-top:10px"><p class="small" style="margin:0 0 6px">${tr("Enter the 6-digit code sent to your phone:")}</p><div style="display:flex;gap:8px"><input id="otp-code-input" type="text" maxlength="6" pattern="[0-9]{6}" placeholder="123456" style="flex:1;letter-spacing:4px;text-align:center;font-weight:700"><button class="btn small" type="button" onclick="verifyPhoneOTP()">${tr("Verify")}</button></div></div><p id="otp-msg" class="small" style="margin:6px 0 0;color:#2e7d32"></p></div>`;
  modal(tr("Your account"), `<p>${esc(user.name)} · ${esc(user.email)}</p>${phoneBox}<p><a href="${apiURL('/privacy.html')}" target="_blank" rel="noopener">${tr("Privacy Policy")}</a> · <a href="${apiURL('/terms.html')}" target="_blank" rel="noopener">${tr("Terms of Service")}</a> · <a href="${apiURL('/refund.html')}" target="_blank" rel="noopener">${tr("Refund Policy")}</a> · <a href="${apiURL('/delete-account.html')}" target="_blank" rel="noopener">${tr("Account deletion")}</a></p><p>${tr("Deleting your account signs you out everywhere, removes your login details, saved places, enquiries, join requests and authored maintenance requests, and ends your tenancy. Owned listings are unpublished. Invoice, tenancy and audit references remain for accounting and operational history.")}</p><form onsubmit="removeAccount(event)"><label class="field">${tr("Confirm your password")}<input name="password" type="password" required minlength="12" autocomplete="current-password"></label><label class="field">${tr("Type DELETE to confirm")}<input name="confirmation" required pattern="DELETE"></label><button class="btn">${tr("Delete my account")}</button></form>`);
}
async function sendPhoneOTP() {
  const phone = $("#otp-phone-input")?.value?.trim();
  if (!phone) return toast(tr("Please enter a phone number."));
  try {
    const res = await api("/auth/otp/send", "POST", { phone });
    $("#otp-step-2").style.display = "block";
    const msg = $("#otp-msg");
    if (msg) {
      msg.textContent = res.debug_code ? `${tr("OTP sent.")} [Debug OTP: ${res.debug_code}]` : tr("OTP sent to your phone.");
      msg.style.color = "#2e7d32";
    }
  } catch (err) {
    const msg = $("#otp-msg");
    if (msg) { msg.textContent = err.message; msg.style.color = "#a64530"; } else toast(err.message);
  }
}
async function verifyPhoneOTP() {
  const phone = $("#otp-phone-input")?.value?.trim();
  const code = $("#otp-code-input")?.value?.trim();
  if (!phone || !code) return toast(tr("Please enter both phone and 6-digit OTP code."));
  try {
    await api("/auth/otp/verify", "POST", { phone, code });
    user = await api("/me");
    toast(tr("Phone number verified successfully!"));
    accountSettings();
  } catch (err) {
    const msg = $("#otp-msg");
    if (msg) { msg.textContent = err.message; msg.style.color = "#a64530"; } else toast(err.message);
  }
}
async function removeAccount(event) {
  event.preventDefault();
  await action(async () => {
    await api("/account", "DELETE", Object.fromEntries(new FormData(event.target)));
    if (globalThis.StayNestNative) await globalThis.StayNestNative.disablePush().catch(() => {});
    user = null; state = null; db.saved = []; db.enquiries = [];
    closeModal();render();toast(tr("Your account has been deleted."));
  });
}
async function toggleSave(id) {
  if (!user) return auth();
  await action(async () => {
    await api("/saved/" + id, db.saved.includes(id) ? "DELETE" : "PUT");
    db.saved = await api("/saved");
    renderCards();
  });
}
function detail(id) {
  let h = db.listings.find((x) => x.id === id);
  modal(
    esc(h.name),
    `<img class="detailphoto" src="${esc(h.photo || img(id - 1))}" alt="Room at ${esc(h.name)}">
    ${(h.photos && h.photos.length > 1) ? `<div style="display:flex;gap:8px;margin-top:8px;overflow-x:auto">${h.photos.map(p => `<img src="${esc(p)}" style="width:72px;height:54px;object-fit:cover;border-radius:6px;cursor:pointer" onclick="$('.detailphoto').src='${esc(p)}'">`).join("")}</div>` : ""}
    <div class="between" style="margin-top:18px">
      <div>
        <div class="type">${esc(tr(h.type))} · ${esc(h.area)}</div>
        <h2>${money(h.price)} <span class="small muted">${tr("/ month onwards")}</span></h2>
      </div>
      <span class="status" style="font-weight:700">● ${tr("{count} beds available now", {count:h.beds})}</span>
    </div>
    <p class="meta">${tr("Updated {date}", {date:esc(new Date(h.updated + "Z").toLocaleString(globalThis.StayNestI18n?.locale()))})}</p>
    
    <div class="detail-info-grid">
      <div class="detail-info-card">
        <div class="info-icon">🛏️</div>
        <div class="info-value">${h.sharing_options.map((n) => (n === 1 ? tr("Private") : tr("{count} sharing", {count:n}))).join(", ") || tr("Available")}</div>
        <div class="info-label">${tr("Room options")}</div>
      </div>
      <div class="detail-info-card">
        <div class="info-icon">💰</div>
        <div class="info-value">${money(h.deposit)}</div>
        <div class="info-label">${tr("Security deposit")}</div>
      </div>
      <div class="detail-info-card">
        <div class="info-icon">📅</div>
        <div class="info-value">${h.notice_days} ${tr("days")}</div>
        <div class="info-label">${tr("Notice period")}</div>
      </div>
      <div class="detail-info-card">
        <div class="info-icon">⏱️</div>
        <div class="info-value">${esc(h.closing)}</div>
        <div class="info-label">${tr("Gate closing")}</div>
      </div>
    </div>

    <div style="background:#f0f5eb;padding:12px 16px;border-radius:12px;margin:16px 0;display:flex;align-items:center;gap:12px">
      <span style="font-size:24px">🎥</span>
      <div style="flex:1">
        <b style="color:var(--green);font-size:13px">${tr("Remote Room Viewing Available")}</b>
        <p class="small muted" style="margin:2px 0 0">${tr("Owners can show rooms online via video tour — no need to travel or wait for hostel staff.")}</p>
      </div>
      ${h.video_url ? `<a class="btn small" href="${esc(h.video_url)}" target="_blank" rel="noopener">${tr("Watch video tour")}</a>` : `<button class="btn small" onclick="enquiry(${id},'Video tour')">${tr("Book Tour")}</button>`}
    </div>

    <h3>${tr("Everything you need")}</h3>
    <div class="amenities">${h.amen.map((a) => `<span>${esc(tr(a))}</span>`).join("")}</div>
    
    <div class="house-rules">
      <h3>${tr("House terms & address")}</h3>
      <p style="font-size:13px;margin-bottom:8px">📍 ${esc(h.address)}</p>
      <p class="small muted">${esc(h.rules || tr("Electricity charges, refund terms and room move-in date confirmed upon bed assignment."))}</p>
    </div>

    <div class="detail-actions">
      ${h.video_url ? `<a class="btn" href="${esc(h.video_url)}" target="_blank" rel="noopener">${ic("video")} ${tr("Watch video tour")}</a>` : `<button class="btn" onclick="enquiry(${id},'Video tour')">${ic("video")} ${tr("Request video tour")}</button>`}
      <button class="btn outline" onclick="enquiry(${id},'Booking enquiry')">${tr("Enquire about a bed")}</button>
      <a class="btn light" href="tel:${esc(h.phone)}">${ic("phone")} ${tr("Call owner")}</a>
      <a class="btn light" href="https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}" target="_blank" rel="noopener">${ic("map")} ${tr("View map")}</a>
    </div>`,
  );
}
function enquiry(id, kind) {
  if (!user) return auth();
  let h = db.listings.find((x) => x.id === id);
  modal(
    kind,
    `<p>${esc(h.name)}</p><form onsubmit="submitEnquiry(event,${id},'${kind}')"><label class="field">${tr("Preferred date")}<input name="date" type="date" required min="${new Date().toISOString().slice(0, 10)}"></label><label class="field">${tr("Message")}<textarea name="message" maxlength="500" placeholder="${tr("Move-in date, room preference or tour questions")}"></textarea></label><p class="notice">${tr("The owner will confirm the request. An enquiry does not reserve a bed.")}</p><button class="btn">${tr("Submit enquiry")}</button></form>`,
  );
}
async function submitEnquiry(e, id, kind) {
  e.preventDefault();
  await action(async () => {
    await api("/properties/" + id + "/enquiries", "POST", {
      ...Object.fromEntries(new FormData(e.target)),
      kind,
    });
    closeModal();
    await refresh();
    toast(tr("Request sent. Track it in My enquiries."));
  });
}
async function joinFromLink() {
  let code = new URLSearchParams(location.search).get("join");
  if (!code) return;
  try {
    let p = await api("/join/" + encodeURIComponent(code));
    modal(
      "Join " + esc(p.name),
      `<p>${esc(p.area)}</p><p class="notice">${tr("Your owner will confirm your identity and assign a room and bed before you can access tenant services.")}</p><button class="btn" onclick="joinHostel()">${tr(user ? "Request to join" : "Sign in to join")}</button>`,
    );
  } catch (e) {
    toast(e.message);
  }
}
async function joinHostel() {
  if (!user) return auth();
  await action(async () => {
    await api("/join", "POST", {
      code: new URLSearchParams(location.search).get("join"),
    });
    closeModal();
    history.replaceState({}, "", location.pathname);
    await refresh();
    toast(tr("Join request sent. Your owner will assign your bed."));
  });
}
let billingOffset = 0;
let historyOffset = 0;
async function billingPage(delta) {
  await action(async () => {
    billingOffset = Math.max(0, billingOffset + delta);
    state.invoices = await api("/invoices?offset=" + billingOffset);
    render();
  });
}
function billingPager() {
  return `<div class="detail-actions"><button class="btn light" ${billingOffset ? "" : "disabled"} onclick="billingPage(-100)">${tr("Newer invoices")}</button><button class="btn light" ${state.invoices.length === 100 ? "" : "disabled"} onclick="billingPage(100)">${tr("Older invoices")}</button></div>`;
}
async function shareJoinLink() {
  await action(() => globalThis.StayNestNative.share(state.join_url, state.property.name));
}
async function ownerHistory(delta) {
  await action(async () => {
    historyOffset = Math.max(0, historyOffset + delta);
    state = await api("/owner/" + selectedProperty + "?offset=" + historyOffset);
    render();
  });
}
function ownerPager() {
  const offset = state.history_offset || 0;
  const more = [state.requests, state.announcements, state.enquiries, state.invoices].some(rows => rows.length === 100);
  return `<div class="detail-actions"><span>${tr("History records {start}–{end}", {start:offset+1,end:offset+100})}</span><button class="btn light" ${offset ? "" : "disabled"} onclick="ownerHistory(-100)">${tr("Newer history")}</button><button class="btn light" ${more ? "" : "disabled"} onclick="ownerHistory(100)">${tr("Older history")}</button></div>`;
}
function tenant() {
  if (state && !state.tenancy) {
    if (view === "payments") return `<div class="pagehead"><h1>${tr("Your payments")}</h1></div><div class="panel"><h3>${tr("Invoices & receipts")}</h3>${invoiceRows(false)}${billingPager()}</div>`;
    return journey() + `<div class="panel"><h1>${tr("Your tenant account")}</h1><p>${tr("Signed in as {email}.", {email:esc(user.email)})}</p><p>${tr("You have no active tenancy. Scan a hostel join QR to request a bed.")}</p>${db.listings.some(p => p.demonstration) ? `<p class="notice">${tr("For the populated demo dashboard, sign out and sign in as tenant@example.test using the demo password. Selecting Tenant keeps your current account.")}</p>` : ''}<div class="detail-actions"><button class="btn" onclick="nav('payments')">${tr("Invoices & receipts")}</button><button class="btn light" onclick="signout()">${tr("Sign out to switch account")}</button></div></div>`;
  }
  if (!state)
    return empty(
      tr("Your hostel is one scan away"),
      tr("Scan the hostel’s join QR code. Your owner will approve your room and bed."),
      tr("Refresh status"),
      "action(refresh)",
    );
  let p = state.property,
    t = state.tenancy;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? tr("Good morning") : hour < 17 ? tr("Good afternoon") : tr("Good evening");
  let head = `<div class="pagehead"><div><div class="eyebrow">${esc(p.name)} · ${tr("Room {room}, Bed {bed}", {room:esc(t.room),bed:esc(t.bed)})}</div><h1>${view === "payments" ? tr("Your payments") : view === "requests" ? tr("We’re here to help.") : tr("Welcome home, {name}.", {name:esc(user.name.split(" ")[0])})}</h1><p>${tr("A little less admin. A little more living.")}</p></div><a class="btn outline small" href="tel:${esc(p.phone)}">${ic("phone")} ${tr("Contact owner")}</a></div>`;
  if (view === "payments")
    return (
      head +
      `<div class="panel"><h3>${tr("Invoices & receipts")}</h3>${invoiceRows(false)}${billingPager()}</div>`
    );
  if (view === "requests")
    return (
      head +
      `<div class="between" style="margin-bottom:20px"><h3>${tr("Your requests")}</h3><button class="btn" onclick="newRequest()">${ic("plus")} ${tr("New request")}</button></div><div class="panel">${requestRows(false)}</div><div class="panel"><h3>${tr("Planning to move?")}</h3><p class="small muted">${tr("{days}-day notice period. Your owner will review the deposit settlement.", {days:p.notice_days})}</p>${t.moveout ? `<p class="notice">${tr("Notice submitted for {date}", {date:esc(t.moveout)})}</p>` : `<button class="btn light" style="margin-top:15px" onclick="moveOut()">${tr("Submit move-out notice")}</button>`}</div>`
    );
  const quickActionsHtml = `
    <div class="quick-actions">
      <div class="quick-action" onclick="newRequest()">
        <div class="qa-icon">${ic("plus")}</div>
        <span>${tr("Raise Request")}</span>
      </div>
      <div class="quick-action" onclick="notifications()">
        <div class="qa-icon">${ic("bell")}</div>
        <span>${tr("Noticeboard")}</span>
      </div>
      <div class="quick-action" onclick="nav('payments')">
        <div class="qa-icon">${ic("wallet")}</div>
        <span>${tr("Pay Rent")}</span>
      </div>
      <a class="quick-action" href="tel:${esc(p.phone)}" style="text-decoration:none">
        <div class="qa-icon">${ic("phone")}</div>
        <span>${tr("Call Owner")}</span>
      </a>
    </div>
  `;
  return (
    head +
    quickActionsHtml +
    `<div class="dashboard"><div><div class="panel"><div class="between"><h3>${tr("Noticeboard")}</h3><span class="badge">${tr("{count} updates", {count:state.announcements.length})}</span></div>${noticeRows()}</div><div class="panel"><div class="between"><h3>${tr("Your requests")}</h3><button class="textbtn" onclick="newRequest()">${tr("+ New request")}</button></div>${requestRows(false)}</div></div><div>${rent()}<div class="panel" style="margin-top:22px"><h3>${tr("On the menu today")}</h3>${menuHTML()}</div></div></div>`
  );
}
function rent() {
  let i = state.invoices.find((x) => x.status === "due") || state.invoices[0];
  if (!i)
    return `<div class="rent-card"><div class="eyebrow">${tr("Your rent")}</div><strong>${tr("All clear")}</strong><p>${tr("Your owner hasn’t issued an invoice yet.")}</p></div>`;
  return `<div class="rent-card"><div class="eyebrow">${tr("Rent for {period}", {period:esc(i.period)})}</div><div class="between"><strong>${money(i.amount / 100)}</strong><span class="badge" style="background:#ffffff26;color:#fff">${i.status === "paid" ? "✓ " + tr("Paid") : tr("Due {date}", {date:esc(i.due)})}</span></div><p>${tr("Invoice #{id} - Charges issued by your owner", {id:i.id})}</p><button class="btn" onclick="${i.status === "paid" ? "receipt" : "pay"}(${i.id})">${ic("wallet")} ${tr(i.status === "paid" ? "View receipt" : "Pay rent")}</button></div>`;
}
function invoiceRows(ownerMode) {
  return state.invoices.length
    ? `<div class="tablewrap"><table><thead><tr>${ownerMode ? `<th>${tr("Tenant")}</th>` : ""}<th>${tr("Period")}</th><th>${tr("Amount")}</th><th>${tr("Due")}</th><th>${tr("Status")}</th><th>${tr("Action")}</th></tr></thead><tbody>${state.invoices.map((i) => `<tr>${ownerMode ? `<td>${esc(state.tenants.find((t) => t.user_id === i.user_id)?.name || tr("Former tenant #{id}", {id:i.user_id}))}</td>` : ""}<td>${esc(i.period)}</td><td>${money(i.amount / 100)}</td><td>${esc(i.due)}</td><td><span class="status ${i.status === "paid" ? "" : "warn"}">${esc(tr(i.status))}</span></td><td>${i.status === "paid" ? `<button class="link" onclick="receipt(${i.id})">${tr("Receipt")}</button>` : ownerMode ? tr("Awaiting payment") : `<button class="btn small" onclick="pay(${i.id})">${tr("Pay rent")}</button>`}</td></tr>`).join("")}</tbody></table></div>`
    : `<p class="muted">${tr("No invoices yet.")}</p>`;
}
async function pay(id) {
  if (globalThis.StayNestNative) {
    return action(() => globalThis.StayNestNative.payOnWebsite());
  }
  await action(async () => {
    const o = await api("/invoices/" + id + "/order", "POST");
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        let s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error(tr("Could not load secure checkout")));
        document.head.append(s);
      });
    }
    let checkout = new Razorpay({
      ...o,
      name: state.property?.name || "StayNest",
      description: "StayNest rent invoice #" + id,
      prefill: { name: user.name, email: user.email },
      handler: async (result) => {
        await action(async () => {
          await api("/invoices/" + id + "/verify", "POST", result);
          await refresh();
          toast("Payment verified. Your receipt is available.");
        });
      },
      theme: { color: "#164f42" },
    });
    checkout.on("payment.failed", () =>
      toast(tr("Payment was not completed. Check your invoice before retrying.")),
    );
    checkout.open();
  });
}
async function receipt(id) {
  await action(async () => {
    let r = await api("/invoices/" + id + "/receipt");
    lastReceipt = r;
    modal(
      tr("Rent receipt"),
      `${r.demonstration ? `<p class="notice">${tr("DEMO RECEIPT ? sample payment history. No money was collected.")}</p>` : ""}<div class="eyebrow">${esc(r.receipt_number)}</div><h2>${esc(r.property)}</h2><div class="detailgrid"><div class="info"><small>${tr("Tenant")}</small>${esc(r.tenant)}</div><div class="info"><small>${tr("Period")}</small>${esc(r.invoice.period)}</div><div class="info"><small>${tr("Amount paid")}</small>${money(r.invoice.amount / 100)}</div><div class="info"><small>${tr("Payment ID")}</small>${esc(r.invoice.payment_id)}</div></div><p class="small muted">${tr("Paid {date} UTC", {date:esc(r.invoice.paid_at)})}</p>${globalThis.StayNestNative ? `<button class="btn light" onclick="shareReceipt()">${tr("Share receipt")}</button>` : `<button class="btn light" style="margin-top:18px" onclick="window.print()">${tr("Print receipt")}</button>`}`,
    );
  });
}
async function shareReceipt() {
  if (!lastReceipt || !globalThis.StayNestNative) return;
  const r = lastReceipt;
  await action(() => globalThis.StayNestNative.shareReceipt(`${r.demonstration ? 'DEMO — no money collected\n' : ''}${r.receipt_number}\n${r.property}\nTenant: ${r.tenant}\nPeriod: ${r.invoice.period}\nAmount: ${money(r.invoice.amount / 100)}\nPayment: ${r.invoice.payment_id}\nPaid: ${r.invoice.paid_at} UTC`));
}
function requestRows(ownerMode) {
  return state.requests.length
    ? state.requests
        .map(
          (r) =>
            `<div class="row"><div style="flex:1"><b>${esc(r.title)}</b><p>${esc(tr(r.category))} · #${r.id}${ownerMode ? " · " + esc(state.tenants.find((t) => t.user_id === r.user_id)?.name || tr("Former tenant")) : ""}</p><p>${esc(r.detail)}</p>${r.reply ? `<p style="color:#52744e">${tr("Owner: {reply}", {reply:esc(r.reply)})}</p>` : ""}</div>${ownerMode ? `<button class="btn light small" onclick="updateRequest(${r.id})">${tr("Update")}</button>` : ""}<span class="status ${r.status === "Open" ? "warn" : r.status === "In progress" ? "blue" : ""}">${esc(tr(r.status))}</span></div>`,
        )
        .join("")
    : `<p class="muted">${tr("No requests yet.")}</p>`;
}
function newRequest() {
  modal(
    tr("How can we help?"),
    `<form onsubmit="submitRequest(event)"><label class="field">${tr("Category")}<select name="category">${["Maintenance", "Internet", "Food", "Housekeeping", "Payment", "Other"].map((x) => `<option value="${x}">${tr(x)}</option>`).join("")}</select></label><label class="field">${tr("Subject")}<input name="title" required minlength="3" maxlength="100"></label><label class="field">${tr("Tell us more")}<textarea name="detail" required minlength="3" maxlength="1000"></textarea></label><button class="btn">${tr("Submit request")}</button></form>`,
  );
}
async function submitRequest(e) {
  e.preventDefault();
  await action(async () => {
    await api("/requests", "POST", Object.fromEntries(new FormData(e.target)));
    closeModal();
    await refresh();
    toast(tr("Your request has been sent."));
  });
}
function updateRequest(id) {
  let r = state.requests.find((x) => x.id === id);
  modal(
    tr("Update tenant request"),
    `<h3>${esc(r.title)}</h3><form onsubmit="saveRequest(event,${id})"><label class="field">${tr("Progress")}<select name="status">${["Open", "In progress", "Resolved"].map((s) => `<option value="${s}" ${s === r.status ? "selected" : ""}>${tr(s)}</option>`).join("")}</select></label><label class="field">${tr("Update for tenant")}<textarea name="reply" required maxlength="1000">${esc(r.reply)}</textarea></label><button class="btn">${tr("Save update")}</button></form>`,
  );
}
async function saveRequest(e, id) {
  e.preventDefault();
  await action(async () => {
    await api(
      "/requests/" + id,
      "PATCH",
      Object.fromEntries(new FormData(e.target)),
    );
    closeModal();
    await refresh();
    toast(tr("Request updated."));
  });
}
function moveOut() {
  modal(
    tr("Move-out notice"),
    `<form onsubmit="submitMoveout(event)"><label class="field">${tr("Planned move-out date")}<input name="date" type="date" required min="${new Date(Date.now() + state.property.notice_days * 86400000).toISOString().slice(0, 10)}"></label><p class="notice">${tr("Your owner will review the notice and settle any outstanding charges and deposit separately.")}</p><button class="btn">${tr("Submit notice")}</button></form>`,
  );
}
async function submitMoveout(e) {
  e.preventDefault();
  await action(async () => {
    await api("/moveout", "POST", Object.fromEntries(new FormData(e.target)));
    closeModal();
    await refresh();
  });
}
function menuHTML() {
  return `<div class="menu">${["breakfast", "lunch", "dinner"].map((k) => `<div class="meal">${ic("food")}<div><b>${tr(k[0].toUpperCase() + k.slice(1))}</b><small>${state.menu[k] ? esc(state.menu[k]) : tr("Menu not posted yet")}</small></div></div>`).join("")}</div>`;
}
function noticeRows() {
  return state.announcements.length
    ? state.announcements
        .map(
          (a) =>
            `<div class="row"><span class="brandmark" style="background:#edf2e2;color:#6c8a58">${ic(a.type === "Food ready" ? "food" : "bell")}</span><div style="flex:1"><b>${esc(a.title)}</b><p>${esc(a.body)}</p><p>${esc(new Date(a.created + "Z").toLocaleString(globalThis.StayNestI18n?.locale()))}</p></div></div>`,
        )
        .join("")
    : `<p class="muted">${tr("No announcements yet.")}</p>`;
}
function notifications() {
  if (!user) return auth();
  if (!state?.property) return toast(tr("Join a hostel to receive its updates."));
  modal(
    tr("Hostel updates"),
    `<div class="detail-actions"><button class="btn light small" onclick="enablePush()">${tr("Enable notifications")}</button><button class="textbtn" onclick="disablePush()">${tr("Turn off notifications")}</button></div>` +
      noticeRows(),
  );
}
function owner() {
  if (view === "property") return property();
  if (!state)
    return `<div class="pagehead"><div><div class="eyebrow">${tr("Owner workspace")}</div><h1>${tr("Give your hostel a home.")}</h1><p>${tr("Add your property, then contact the platform team for ownership verification.")}</p></div></div><button class="btn" onclick="nav('property')">${ic("plus")} ${tr("Add your property")}</button>`;
  return `<div class="pagehead"><div><div class="eyebrow">${tr("Owner workspace")} · ${esc(state.property.name)}</div><h1>${tr("A good home, well managed.")}</h1><p>${tr("Your property, people and daily essentials.")}</p></div><button class="btn" onclick="announce()">${ic("plus")} ${tr("Send update")}</button></div><div class="between" style="margin-bottom:20px"><select class="ownerselect" aria-label="${tr("Select property")}" onchange="selectedProperty=+this.value;historyOffset=0;action(refresh)">${user.properties.map((p) => `<option value="${p.id}" ${p.id === selectedProperty ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select><button class="textbtn" onclick="newProperty()">${tr("+ Add property")}</button></div><div class="tabs">${["Overview", "Rooms & beds", "Payments", "Requests", "Enquiries", "Food & notices", "Tenants & QR"].map((t) => `<button class="${ownerTab === t ? "active" : ""}" onclick="ownerTab='${t}';render()">${tr(t)}</button>`).join("")}</div>${ownerContent()}${ownerPager()}`;
}
function ownerContent() {
  let p = state.property;
  if (ownerTab === "Requests")
    return `<div class="panel"><h3>${tr("Tenant queries & maintenance")}</h3>${requestRows(true)}</div>`;
  if (ownerTab === "Payments")
    return `<div class="panel"><div class="between"><h3>${tr("Rent collection")}</h3><button class="btn small" onclick="newInvoice()">${tr("Issue invoice")}</button></div>${invoiceRows(true)}</div>`;
  if (ownerTab === "Enquiries")
    return `<div class="panel"><h3>${tr("Remote tours & booking enquiries")}</h3>${state.enquiries.length ? state.enquiries.map((e) => `<div class="row"><div><b>${esc(e.name)}</b><p>${esc(tr(e.kind))} · ${esc(e.date)}</p><p>${esc(e.message)}</p></div><select class="sort" aria-label="${tr("Enquiry status")}" onchange="changeEnquiry(${e.id},this.value)">${["Requested", "Confirmed", "Completed", "Cancelled"].map((s) => `<option value="${s}" ${s === e.status ? "selected" : ""}>${tr(s)}</option>`).join("")}</select></div>`).join("") : `<p class="muted">${tr("Your enquiries will appear here.")}</p>`}</div>`;
  if (ownerTab === "Food & notices")
    return `<div class="dashboard"><div class="panel"><div class="between"><h3>${tr("Today’s menu")}</h3><button class="textbtn" onclick="editMenu()">${tr("Edit menu")}</button></div>${menuHTML()}<button class="btn" style="margin-top:20px" onclick="foodReady()">${ic("food")} ${tr("Notify: food is ready")}</button></div><div class="panel"><h3>${tr("Recent announcements")}</h3>${noticeRows()}</div></div>`;
  if (ownerTab === "Rooms & beds")
    return `<div class="panel"><div class="between"><div><h3>${tr("Room inventory")}</h3><p class="small muted">${tr("Vacancies are calculated from active, unoccupied beds.")}</p></div><button class="btn light small" onclick="addBed()">${tr("Add bed")}</button></div><div class="cards" style="margin-top:25px">${state.beds.map((b) => `<div class="room"><div class="between"><h3>${tr("Room {room}", {room:esc(b.room)})}</h3><span class="badge">${tr("{count} sharing", {count:b.sharing})}</span></div><div class="beds"><div class="bed ${b.active && !b.occupied ? "free" : ""}">${ic("bed")} ${esc(b.label)}</div></div><p class="small muted">${tr(b.occupied ? "Occupied" : b.active ? "Available" : "Unavailable")}</p>${!b.occupied ? `<button class="btn light small" onclick="bedState(${b.id},${!b.active})">${tr(b.active ? "Mark unavailable" : "Make available")}</button>` : ""}</div>`).join("") || `<p class="muted">${tr("Add your first room and bed.")}</p>`}</div></div>`;
  if (ownerTab === "Tenants & QR") return tenantsQR();
  let period = new Date().toISOString().slice(0, 7);
  const pendingJoinsCount = state.joins?.length || 0;
  const openReqsCount = state.open_requests || 0;
  const newEnqCount = state.new_enquiries || 0;
  
  const actionRequiredHtml = (pendingJoinsCount > 0 || openReqsCount > 0 || newEnqCount > 0) ? `
    <div class="action-required">
      <h3>⚡ ${tr("Action Required")}</h3>
      ${pendingJoinsCount > 0 ? `<div class="action-item"><span class="action-dot"></span><span>${tr("{count} resident join request(s) awaiting verification", {count:pendingJoinsCount})}</span><button onclick="ownerTab='Tenants & QR';render()">${tr("Review & Assign Bed →")}</button></div>` : ""}
      ${openReqsCount > 0 ? `<div class="action-item"><span class="action-dot"></span><span>${tr("{count} open maintenance / support ticket(s)", {count:openReqsCount})}</span><button onclick="ownerTab='Requests';render()">${tr("Resolve Tickets →")}</button></div>` : ""}
      ${newEnqCount > 0 ? `<div class="action-item"><span class="action-dot"></span><span>${tr("{count} video tour / booking enquiry(s)", {count:newEnqCount})}</span><button onclick="ownerTab='Enquiries';render()">${tr("View Enquiries →")}</button></div>` : ""}
    </div>
  ` : "";

  return `
    ${actionRequiredHtml}
    <div class="stats">
      <div class="stat"><span class="muted small">${tr("Available beds")}</span><strong>${p.beds}</strong><small>${esc(p.name)}</small></div>
      <div class="stat"><span class="muted small">${tr("Rent received")}</span><strong>${money((state.rent_received ?? 0) / 100)}</strong><small>${period}</small></div>
      <div class="stat"><span class="muted small">${tr("Open requests")}</span><strong>${state.open_requests ?? 0}</strong><small>${tr("Awaiting your attention")}</small></div>
      <div class="stat"><span class="muted small">${tr("New enquiries")}</span><strong>${state.new_enquiries ?? 0}</strong><small>${tr("Tours & booking requests")}</small></div>
    </div>
    <div class="dashboard">
      <div>
        <div class="panel">
          <h3>${tr("Needs your attention")}</h3>
          ${requestRows(true)}
        </div>
        <div class="panel">
          <h3>${tr("Quick actions for owners")}</h3>
          <p class="small muted" style="margin-bottom:14px">${tr("Manage daily hostel operations without additional desk staff.")}</p>
          <div class="detail-actions">
            <button class="btn light" onclick="ownerTab='Rooms & beds';render()">${ic("bed")} ${tr("Update vacancies")}</button>
            <button class="btn light" onclick="announce()">${ic("bell")} ${tr("Post notice")}</button>
            <button class="btn light" onclick="foodReady()">${ic("food")} ${tr("Food is ready")}</button>
            <button class="btn light" onclick="editMenu()">${tr("Edit menu")}</button>
            <button class="btn light" onclick="newInvoice()">${ic("wallet")} ${tr("Issue invoice")}</button>
            <button class="btn light" onclick="ownerTab='Tenants & QR';render()">${ic("user")} ${tr("Reception QR")}</button>
          </div>
        </div>
      </div>
      <div>
        <div class="panel">
          <h3>${tr("Your property")}</h3>
          <img src="${esc(p.photo || img(p.id - 1))}" alt="Property room" style="width:100%;height:170px;object-fit:cover;border-radius:12px">
          <div class="row">
            <div>
              <b>${esc(p.name)}</b>
              <p>${esc(p.area)} · ${money(p.price)} / month</p>
            </div>
            <span class="badge">${tr(p.published ? "Published" : "Awaiting approval")}</span>
          </div>
          <button class="btn outline" style="width:100%;margin-top:10px" onclick="nav('property')">${tr("Manage property")} ${ic("arrow")}</button>
        </div>
        <div class="panel">
          <h3>${tr("Hostel Reception QR")}</h3>
          <p class="small muted" style="margin-bottom:12px">${tr("Display at reception desk. New tenants scan to join directly without physical paperwork.")}</p>
          <button class="btn small" style="width:100%" onclick="ownerTab='Tenants & QR';render()">${tr("Open Join QR Code")}</button>
        </div>
      </div>
    </div>`;
}
function tenantsQR() {
  return `<div class="dashboard"><div><div class="panel"><h3>${tr("Join requests")}</h3>${state.joins.map((j) => `<div class="row"><div><b>${esc(j.name)}</b><p>${esc(j.email)}</p></div><button class="btn small" onclick="approveJoin(${j.id})">${tr("Assign bed")}</button></div>`).join("") || `<p class="muted">${tr("No pending requests.")}</p>`}</div><div class="panel"><h3>${tr("Current tenants")}</h3>${state.tenants.map((t) => `<div class="row"><div><b>${esc(t.name)}</b><p>${esc(t.email)} · Bed #${t.bed_id}</p>${t.moveout ? `<p>${tr("Move-out requested: {date}", {date:esc(t.moveout)})}</p>` : ""}</div><button class="textbtn" onclick="checkoutTenant(${t.id})">${tr("Check out")}</button></div>`).join("") || `<p class="muted">${tr("No tenants assigned.")}</p>`}</div></div><div class="panel"><h3>${tr("Scan to join your hostel")}</h3><img id="join-qr" src="${globalThis.StayNestNative ? '/placeholder.svg' : '/api/owner/'+selectedProperty+'/qr'}" alt="Hostel join QR code" style="width:100%;max-width:260px"><p class="small muted">${tr("Print this QR at reception. Residents sign in and request to join. Only you can approve their bed assignment.")}</p><button class="btn" style="width:100%;margin-top:12px" onclick="printStandee()">${tr("Print reception QR standee")}</button>${globalThis.StayNestNative ? `<button class="btn light" style="margin-top:8px;width:100%" onclick="shareJoinLink()">${tr("Share join link")}</button>` : `<a class="btn light" style="margin-top:8px;display:inline-block" href="/api/owner/${selectedProperty}/qr" download="staynest-join-qr.png">Download QR</a>`}<button class="textbtn" style="display:block;margin-top:12px" onclick="rotateQR()">${tr("Replace join QR")}</button></div></div>`;
}
function printStandee() {
  const p = state?.property;
  if (!p) return;
  const qrSrc = globalThis.StayNestNative ? '/placeholder.svg' : `/api/owner/${selectedProperty}/qr`;
  modal(
    tr("Reception QR Standee"),
    `<div id="standee-print-area" class="standee-card"><div class="standee-header"><span class="brandmark">${ic("home")}</span><h2 style="margin:4px 0 0;font-size:20px;color:var(--green)">StayNest</h2><p style="margin:2px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">${tr("Official Reception Check-in")}</p></div><div class="standee-hostel"><h1 style="margin:8px 0 4px;font-size:24px">${esc(p.name)}</h1><p style="margin:0;font-size:13px;color:var(--muted)">${esc(p.area || p.address)}</p></div><div class="standee-qr" style="margin:16px 0;padding:12px;background:#fff;border:2px dashed #cbd5e1;border-radius:12px;display:inline-block"><img src="${qrSrc}" alt="Hostel QR" style="width:200px;height:200px;display:block;margin:0 auto"></div><div style="text-align:left;max-width:300px;margin:0 auto 16px;font-size:13px"><div style="margin-bottom:6px">1️⃣ ${tr("Scan QR with phone camera or QR app")}</div><div style="margin-bottom:6px">2️⃣ ${tr("Sign in or create your StayNest account")}</div><div>3️⃣ ${tr("Tap Request to join for instant bed approval")}</div></div><div style="font-size:11px;color:var(--muted);border-top:1px solid #e2e8f0;padding-top:8px">${tr("Direct rent receipts, maintenance tickets & digital hostel management")}</div></div><div style="margin-top:16px;display:flex;gap:8px;justify-content:center"><button class="btn" onclick="window.print()">${tr("Print standee")}</button><button class="btn light" onclick="closeModal()">${tr("Close")}</button></div>`,
  );
}
function approveJoin(id) {
  let beds = state.beds.filter((b) => b.active && !b.occupied);
  if (!beds.length) return toast(tr("Add an available bed first."));
  modal(
    tr("Assign tenant to a bed"),
    `<form onsubmit="submitApproval(event,${id})"><label class="field">${tr("Available bed")}<select name="bed_id">${beds.map((b) => `<option value="${b.id}">${tr("Room {room}, Bed {bed}", {room:esc(b.room),bed:esc(b.label)})}</option>`).join("")}</select></label><p class="notice">${tr("Confirm this person is your tenant before approving. Approval grants access to hostel notices and services.")}</p><button class="btn">${tr("Approve and assign")}</button></form>`,
  );
}
async function submitApproval(e, id) {
  e.preventDefault();
  await action(async () => {
    await api("/joins/" + id + "/approve", "POST", {
      bed_id: +new FormData(e.target).get("bed_id"),
    });
    closeModal();
    await refresh();
    toast(tr("Tenant approved and bed assigned."));
  });
}
function checkoutTenant(id) {
  modal(
    tr("Confirm tenant checkout"),
    `<p class="notice">${tr("Confirm the tenant has moved out. This releases the bed and removes active tenant access. Outstanding invoices remain recorded. Settle the deposit separately.")}</p><button class="btn" onclick="completeCheckout(${id})">${tr("Confirm checkout")}</button>`,
  );
}
async function completeCheckout(id) {
  await action(async () => {
    await api("/tenancies/" + id + "/checkout", "POST");
    closeModal();
    await refresh();
  });
}
async function rotateQR() {
  await action(async () => {
    await api("/owner/" + selectedProperty + "/join-code/rotate", "POST");
    await refresh();
    toast(tr("New QR generated. Replace old printed copies."));
  });
}
function addBed() {
  modal(
    tr("Add a room bed"),
    `<form onsubmit="submitBed(event)"><label class="field">${tr("Room number")}<input name="room" required maxlength="30" placeholder="204"></label><label class="field">${tr("Bed label")}<input name="label" required maxlength="20" placeholder="B"></label><label class="field">${tr("People per room")}<input name="sharing" type="number" min="1" max="8" required value="2"></label><button class="btn">${tr("Add bed")}</button></form>`,
  );
}
async function submitBed(e) {
  e.preventDefault();
  let f = Object.fromEntries(new FormData(e.target));
  f.sharing = +f.sharing;
  await action(async () => {
    await api("/owner/" + selectedProperty + "/beds", "POST", f);
    closeModal();
    await refresh();
  });
}
async function bedState(id, active) {
  await action(async () => {
    await api("/beds/" + id, "PATCH", { active });
    await refresh();
  });
}
function newInvoice() {
  if (!state.tenants.length) return toast(tr("Approve a tenant first."));
  modal(
    tr("Issue rent invoice"),
    `<form onsubmit="submitInvoice(event)"><label class="field">${tr("Tenant")}<select name="tenancy_id">${state.tenants.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label><label class="field">${tr("Rent month")}<input name="period" type="month" required value="${new Date().toISOString().slice(0, 7)}"></label><label class="field">${tr("Total amount (₹)")}<input name="amount" type="number" min="1" max="100000" step="0.01" required value="${state.property.price}"></label><label class="field">${tr("Due date")}<input name="due" type="date" required></label><button class="btn">${tr("Issue invoice")}</button></form>`,
  );
}
async function submitInvoice(e) {
  e.preventDefault();
  let f = Object.fromEntries(new FormData(e.target));
  f.tenancy_id = +f.tenancy_id;
  f.amount = Math.round(+f.amount * 100);
  await action(async () => {
    await api("/owner/" + selectedProperty + "/invoices", "POST", f);
    closeModal();
    await refresh();
  });
}
async function changeEnquiry(id, status) {
  await action(async () => {
    await api("/enquiries/" + id, "PATCH", { status });
    await refresh();
  });
}
function announce() {
  modal(
    tr("Send a hostel update"),
    `<form onsubmit="submitAnnouncement(event)"><label class="field">${tr("Type")}<select name="type">${["General update", "Food ready", "Gate timing", "Maintenance"].map((t) => `<option value="${t}">${tr(t)}</option>`).join("")}</select></label><label class="field">${tr("Title")}<input name="title" required minlength="2" maxlength="100"></label><label class="field">${tr("Message")}<textarea name="body" required minlength="2" maxlength="1000"></textarea></label><p class="notice">${tr("Visible to your tenants in their noticeboard. The open app refreshes automatically.")}</p><button class="btn">${tr("Post announcement")}</button></form>`,
  );
}
async function submitAnnouncement(e) {
  e.preventDefault();
  await action(async () => {
    await api(
      "/owner/" + selectedProperty + "/announcements",
      "POST",
      Object.fromEntries(new FormData(e.target)),
    );
    closeModal();
    await refresh();
    toast(tr("Announcement posted."));
  });
}
function foodReady() {
  modal(
    tr("Food is ready"),
    `<form onsubmit="sendFood(event)"><label class="field">${tr("Meal")}<select name="meal"><option value="Breakfast">${tr("Breakfast")}</option><option value="Lunch">${tr("Lunch")}</option><option value="Dinner">${tr("Dinner")}</option></select></label><button class="btn">${tr("Notify tenants")}</button></form>`,
  );
}
async function sendFood(e) {
  e.preventDefault();
  let meal = new FormData(e.target).get("meal");
  await action(async () => {
    await api("/owner/" + selectedProperty + "/announcements", "POST", {
      title: tr("{meal} is ready", {meal:tr(meal)}),
      body: tr("Please join us in the dining hall. Enjoy your meal!"),
      type: "Food ready",
    });
    closeModal();
    await refresh();
    toast(tr("Food-ready notice posted."));
  });
}
function editMenu() {
  modal(
    tr("Edit today’s menu"),
    `<form onsubmit="saveMenu(event)">${["breakfast", "lunch", "dinner"].map((k) => `<label class="field">${tr(k[0].toUpperCase() + k.slice(1))}<input name="${k}" value="${esc(state.menu[k] || "")}" maxlength="250"></label>`).join("")}<button class="btn">${tr("Save menu")}</button></form>`,
  );
}
async function saveMenu(e) {
  e.preventDefault();
  await action(async () => {
    await api(
      "/owner/" + selectedProperty + "/menu",
      "PUT",
      Object.fromEntries(new FormData(e.target)),
    );
    closeModal();
    await refresh();
  });
}
let addingProperty = false;
function newProperty() {
  addingProperty = true;
  view = "property";
  render();
}
function property() {
  let p = addingProperty ? {} : state?.property || {};
  return `<div class="pagehead"><div><div class="eyebrow">${tr("Owner workspace")}</div><h1>${tr("Your place, presented well.")}</h1><p>${tr(p.id ? "Manage your listing details." : "Register your property for review.")}</p></div></div><div class="dashboard"><div class="panel"><h3>${tr("Listing details")}</h3><form onsubmit="saveProperty(event,${p.id || 0})"><label class="field">${tr("Hostel name")}<input name="name" value="${esc(p.name || "")}" required minlength="2" maxlength="80"></label><label class="field">${tr("Full address")}<input name="address" value="${esc(p.address || "")}" required minlength="5" maxlength="500"></label><div class="detailgrid"><label class="field">${tr("Locality")}<input name="area" value="${esc(p.area || "")}" required minlength="2" maxlength="80"></label><label class="field">${tr("Hostel type")}<select name="type">${["Women", "Men", "Co-living"].map((a) => `<option value="${a}" ${a === p.type ? "selected" : ""}>${tr(a)}</option>`).join("")}</select></label><label class="field">${tr("Monthly rent onwards (₹)")}<input name="price" type="number" min="1000" max="100000" required value="${p.price || 9500}"></label><label class="field">${tr("Deposit (₹)")}<input name="deposit" type="number" min="0" max="500000" required value="${p.deposit || 0}"></label><label class="field">${tr("Latitude")}<input name="lat" type="number" step="any" min="-90" max="90" required value="${p.lat || 17.4401}"></label><label class="field">${tr("Longitude")}<input name="lon" type="number" step="any" min="-180" max="180" required value="${p.lon || 78.3489}"></label><label class="field">${tr("Owner contact number")}<input name="phone" type="tel" pattern="[+]?[0-9]{10,15}" required value="${esc(p.phone || "")}"></label><label class="field">${tr("Gate closing time")}<input name="closing" type="time" required value="${esc(p.closing || "22:30")}"></label><label class="field">${tr("Notice period (days)")}<input name="notice_days" type="number" min="0" max="180" required value="${p.notice_days ?? 30}"></label><label class="field">${tr("Video tour URL (YouTube / Drive)")}<input name="video_url" type="url" maxlength="500" placeholder="https://..." value="${esc(p.video_url || "")}"></label><label class="field">${tr("Payment merchant ID (Optional)")}<input name="merchant_account_id" maxlength="64" placeholder="acc_..." value="${esc(p.merchant_account_id || "")}"></label></div><h4>${tr("Amenities")}</h4><div class="amenities">${["Wi-Fi", "Meals", "AC", "Laundry", "Gym"].map((a) => `<label class="check"><input type="checkbox" name="amen" value="${a}" ${(p.amen || []).includes(a) ? "checked" : ""}>${tr(a)}</label>`).join("")}</div><label class="field">${tr("Rules, extra charges & refund terms")}<textarea name="rules" maxlength="2000">${esc(p.rules || "")}</textarea></label><button class="btn">${tr(p.id ? "Save listing" : "Register property")}</button></form></div><div><div class="panel"><h3>${tr("Owner verification")}</h3><span class="status ${p.published ? "" : "warn"}">${tr(p.published ? "Published" : user.owner_approved ? "Owner approved · listing under review" : "Verification pending")}</span><p class="notice">${tr("The platform team reviews ownership and listing details before publication. Your contact number is shown on the published listing.")}</p></div>${p.id ? `<div class="panel"><h3>${tr("Room photo")}</h3><img src="${esc(p.photo || img(p.id - 1))}" alt="Room" style="width:100%;border-radius:12px">${(p.photos && p.photos.length > 1) ? `<div style="display:flex;gap:8px;margin-top:8px;overflow-x:auto">${p.photos.map(ph => `<img src="${esc(ph)}" style="width:64px;height:48px;object-fit:cover;border-radius:6px">`).join('')}</div>` : ''}<label class="field">${tr("Upload photo")}<input type="file" accept="image/jpeg,image/png,image/webp" onchange="uploadPhoto(this)"></label><p class="small muted">${tr("Maximum 5 MB. Use an actual room photo.")}</p></div>` : ""}</div></div>`;
}
async function saveProperty(e, id) {
  e.preventDefault();
  let f = new FormData(e.target),
    data = Object.fromEntries(f);
  data.amen = f.getAll("amen");
  for (let k of ["price", "deposit", "lat", "lon", "notice_days"])
    data[k] = +data[k];
  if (!data.video_url) delete data.video_url;
  if (!data.merchant_account_id) delete data.merchant_account_id;
  await action(async () => {
    let p = await api(
      "/properties" + (id ? "/" + id : ""),
      id ? "PUT" : "POST",
      data,
    );
    selectedProperty = p.id;
    addingProperty = false;
    await refresh();
    toast(tr("Property saved."));
  });
}
async function uploadPhoto(input) {
  let file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return toast(tr("Choose an image under 5 MB."));
  let f = new FormData();
  f.append("file", file);
  await action(async () => {
    await api("/owner/" + selectedProperty + "/photo", "POST", f);
    await refresh();
    toast(tr("Photo uploaded."));
  });
}
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) closeModal();
});
(async () => {
  try {
    try {
      user = await api("/me");
      homeMode();
    } catch (e) {
      if (e.status !== 401) throw e;
    }
    await refresh();
    await joinFromLink();
    if (user && new URLSearchParams(location.search).get("account") === "delete") accountSettings();
  } catch (e) {
    $("#app").innerHTML =
      `<main class="shell"><h1>${tr("StayNest")}</h1><p>${tr("Unable to connect. Please reload in a moment.")}</p></main>`;
    toast(e.message);
  }
})();
setInterval(async () => {
  if (
    document.hidden ||
    !user ||
    loading ||
    $("#modal").open ||
    document.activeElement?.matches("input,textarea,select")
  )
    return;
  try {
    if (mode === "Explore") {
      const wasTenant = user.tenant;
      user = await api("/me");
      if (!wasTenant && user.tenant) {
        homeMode();
        await refresh();
        toast(tr("Your room is approved. Welcome to your hostel!"));
      } else render();
    } else if (mode === "Tenant") {
      user = await api("/me");
      state = user.tenant ? await api("/tenant") : { property: null, tenancy: null };
      state.invoices = await api("/invoices?offset=" + billingOffset);
      render();
    } else if (mode === "Owner" && selectedProperty) {
      state = await api("/owner/" + selectedProperty + "?offset=" + historyOffset);
      if (view !== "property") render();
    }
  } catch {}
}, 30000);

async function enablePush() {
  await action(async () => {
    if (globalThis.StayNestNative) {
      const config = await api("/push/config");
      if (!config.native?.[globalThis.StayNestNative.platform]) throw new Error(tr("Background notifications are not available yet. Updates are available in the app."));
      await globalThis.StayNestNative.enablePush((platform, token) => api("/push/native", "POST", {platform, token}));
      return toast(tr("Notifications enabled."));
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      throw new Error(
        tr("Push is unavailable in this browser. Use the noticeboard."),
      );
    const config = await api("/push/config");
    if (!config.public_key)
      throw new Error(tr("Background notifications are not configured yet."));
    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      throw new Error(tr("Notifications were not enabled."));
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const raw = config.public_key.replace(/-/g, "+").replace(/_/g, "/");
    const key = Uint8Array.from(
      atob(raw + "=".repeat((4 - (raw.length % 4)) % 4)),
      (c) => c.charCodeAt(0),
    );
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      }));
    const j = sub.toJSON();
    await api("/push/subscribe", "POST", {
      endpoint: j.endpoint,
      keys: j.keys,
    });
    toast(tr("Notifications enabled."));
  });
}
async function disablePush() {
  await action(async () => {
    await api("/push/subscriptions", "DELETE");
    if (globalThis.StayNestNative) {
      await globalThis.StayNestNative.disablePush();
      return toast(tr("Notifications turned off."));
    }
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    toast(tr("Notifications turned off for this account."));
  });
}
if (!mobileOrigin && "serviceWorker" in navigator)
  navigator.serviceWorker.register("/sw.js").catch(() => {});

if (globalThis.StayNestNative) {
  globalThis.addEventListener("staynest:update", () => action(refresh));
  globalThis.addEventListener("staynest:join", () => joinFromLink());
  globalThis.addEventListener("staynest:back", () => {
    if ($("#modal").open) closeModal();
    else if (view !== "home" && view !== "discover" && view !== "owner") {homeMode();render();}
    else toast(tr("Use your device's home gesture to leave StayNest."));
  });
}

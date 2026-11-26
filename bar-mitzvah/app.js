(() => {
  "use strict";
  const E = window.EVENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ACCESS_KEY = "bm_access";

  /* ---------------- Access gate ---------------- */
  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  const normalize = s => (s || "").trim().toUpperCase();

  async function checkCode(code) {
    return code && (await sha256(normalize(code))) === E.passcodeHash;
  }

  async function initGate() {
    const params = new URLSearchParams(location.search);
    const urlCode = params.get("code");
    if (urlCode && (await checkCode(urlCode))) {
      localStorage.setItem(ACCESS_KEY, E.passcodeHash);
      // strip the code from the address bar so it isn't shared by accident
      params.delete("code");
      const qs = params.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
    if (localStorage.getItem(ACCESS_KEY) === E.passcodeHash) return unlock();

    $("#gate").hidden = false;
    $("#passcode").focus();
    $("#gate-form").addEventListener("submit", async e => {
      e.preventDefault();
      if (await checkCode($("#passcode").value)) {
        localStorage.setItem(ACCESS_KEY, E.passcodeHash);
        $("#gate").hidden = true;
        unlock();
      } else {
        $("#gate-error").hidden = false;
        $("#passcode").select();
      }
    });
  }

  function unlock() {
    $("#site").hidden = false;
    render();
    if (location.hash) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(() => t.scrollIntoView(), 50);
    }
  }

  /* ---------------- Render content from config ---------------- */
  const get = path => path.split(".").reduce((o, k) => (o == null ? o : o[k]), E);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function render() {
    document.title = `${E.honoreeFullName}'s Bar Mitzvah`;
    $$("[data-bind]").forEach(el => {
      const v = get(el.dataset.bind);
      el.textContent = v || "";
      if (!v) el.hidden = true;
    });
    $$("[data-needs]").forEach(el => { if (!get(el.dataset.needs)) el.hidden = true; });

    $("#event-cards").innerHTML = E.events.map(ev => `
      <article class="card">
        <h3>${esc(ev.title)}</h3>
        <p class="when">${esc(ev.date)} · ${esc(ev.time)}</p>
        <p class="venue">${esc(ev.venue)}</p>
        <p class="muted">${esc(ev.address)}</p>
        ${ev.note ? `<p>${esc(ev.note)}</p>` : ""}
        ${ev.attire ? `<p class="attire"><strong>Attire:</strong> ${esc(ev.attire)}</p>` : ""}
        ${ev.mapUrl ? `<a class="map" href="${esc(ev.mapUrl)}" target="_blank" rel="noopener">Get directions →</a>` : ""}
      </article>`).join("");

    $("#event-checkboxes").innerHTML = E.events.map(ev => `
      <label class="check"><input type="checkbox" name="events" value="${esc(ev.title)}" checked /> ${esc(ev.title)}</label>`).join("");

    // Hotel
    const link = $("#hotel-link");
    if (E.hotel.bookingUrl) link.href = E.hotel.bookingUrl;
    else { link.hidden = true; $("#hotel-pending").hidden = false; }

    // FAQ + contact
    $("#faq-attire").innerHTML = E.events.map(ev => `<strong>${esc(ev.title)}:</strong> ${esc(ev.attire)}`).join("<br>");
    const contact = `${esc(E.contactName)} — <a href="mailto:${esc(E.contactEmail)}">${esc(E.contactEmail)}</a>${E.contactPhone ? ` · <a href="tel:${esc(E.contactPhone)}">${esc(E.contactPhone)}</a>` : ""}`;
    $("#faq-contact").innerHTML = contact;
    const fc = $("#footer-contact");
    fc.href = `mailto:${E.contactEmail}`;
    fc.textContent = E.contactEmail;

    if (!E.rsvpEndpoint) $("#preview-note").hidden = false;

    startCountdown();
    initNav();
    initRsvp();
  }

  function startCountdown() {
    const target = new Date(E.eventDateISO).getTime();
    const el = $("#countdown");
    const tick = () => {
      const d = target - Date.now();
      if (d <= 0) { el.innerHTML = `<div><b>Mazel Tov!</b></div>`; return; }
      const parts = [["Days", 864e5], ["Hours", 36e5], ["Mins", 6e4]];
      let rem = d;
      el.innerHTML = parts.map(([l, ms]) => { const n = Math.floor(rem / ms); rem -= n * ms; return `<div><b>${n}</b><span>${l}</span></div>`; }).join("");
    };
    tick();
    setInterval(tick, 30000);
  }

  function initNav() {
    const btn = $(".nav-toggle"), links = $(".nav-links");
    btn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
    $$(".nav-links a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
  }

  /* ---------------- RSVP ---------------- */
  function addGuest(prefillName = "") {
    const node = $("#guest-tpl").content.firstElementChild.cloneNode(true);
    $(".diet-opts", node).innerHTML = E.dietaryOptions.map(o =>
      `<label class="check"><input type="checkbox" value="${esc(o)}" /> ${esc(o)}</label>`).join("");
    $(".g-name", node).value = prefillName;
    $(".remove-guest", node).addEventListener("click", () => { node.remove(); renumber(); });
    $("#guests").appendChild(node);
    renumber();
    return node;
  }
  function renumber() {
    $$(".guest").forEach((g, i) => ($(".guest-num", g).textContent = `Guest ${i + 1}`));
  }

  function initRsvp() {
    const form = $("#rsvp-form");
    addGuest();

    form.addEventListener("change", e => {
      if (e.target.name === "attending") { $("#attending-yes").hidden = e.target.value !== "Yes"; showError(""); }
    });
    $("#add-guest").addEventListener("click", () => $(".g-name", addGuest()).focus());
    $("#rsvp-again").addEventListener("click", () => {
      $("#rsvp-thanks").hidden = true;
      form.hidden = false;
      form.scrollIntoView();
    });
    form.addEventListener("input", e => e.target.classList.remove("invalid"));
    form.addEventListener("submit", onSubmit);
  }

  function collect(form) {
    const fd = new FormData(form);
    const attending = fd.get("attending");
    const guests = attending === "Yes" ? $$(".guest").map(g => ({
      name: $(".g-name", g).value.trim(),
      age: $(".g-age", g).value,
      dietary: $$(".diet-opts input:checked", g).map(i => i.value),
      allergies: $(".g-allergy", g).value.trim(),
    })) : [];
    const count = label => guests.filter(g => g.age.startsWith(label)).length;
    return {
      submittedAt: new Date().toISOString(),
      partyName: (fd.get("partyName") || "").trim(),
      email: (fd.get("email") || "").trim().toLowerCase(),
      phone: (fd.get("phone") || "").trim(),
      attending,
      events: fd.getAll("events").join(", "),
      totalGuests: guests.length,
      adults: count("Adult"),
      teens: count("Teen"),
      children: count("Child"),
      hotel: fd.get("hotel") || "",
      song: (fd.get("song") || "").trim(),
      message: (fd.get("message") || "").trim(),
      guests,
      website: fd.get("website") || "", // honeypot
    };
  }

  function validate(form, data) {
    $$(".invalid", form).forEach(el => el.classList.remove("invalid"));
    const bad = [];
    const flag = el => { el.classList.add("invalid"); bad.push(el); };
    if (!data.partyName) flag(form.partyName);
    if (!/^\S+@\S+\.\S+$/.test(data.email)) flag(form.email);
    if (!data.attending) bad.push($(".attending"));
    if (data.attending === "Yes") {
      $$(".guest .g-name").forEach(i => { if (!i.value.trim()) flag(i); });
      if (!data.guests.length) bad.push($("#add-guest"));
    }
    if (bad.length) {
      const msg = !data.attending ? "Please let us know if you can attend." : "Please fill in the highlighted fields.";
      showError(msg);
      bad[0].scrollIntoView({ block: "center" });
      if (bad[0].focus) bad[0].focus();
      return false;
    }
    return true;
  }
  function showError(msg) { const e = $("#rsvp-error"); e.textContent = msg; e.hidden = !msg; }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = collect(form);
    if (!validate(form, data)) return;
    showError("");
    if (data.website) return thanks(data); // bot — pretend success

    const btn = $("#rsvp-submit");
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      if (E.rsvpEndpoint) {
        // text/plain avoids a CORS preflight, which Apps Script can't answer.
        await fetch(E.rsvpEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
      } else {
        console.info("[preview] RSVP payload", data);
        await new Promise(r => setTimeout(r, 600));
      }
      thanks(data);
    } catch (err) {
      showError(`Something went wrong sending your RSVP. Please try again, or email ${E.contactEmail}.`);
    } finally {
      btn.disabled = false;
      btn.textContent = "Send RSVP";
    }
  }

  function thanks(data) {
    $("#rsvp-form").hidden = true;
    const box = $("#rsvp-thanks");
    if (data.attending === "Yes") {
      $("#thanks-title").textContent = "Mazel tov — see you there!";
      $("#thanks-body").textContent = `We've got ${data.totalGuests} guest${data.totalGuests === 1 ? "" : "s"} down for your party. ` +
        (E.hotel.bookingUrl ? "Don't forget to book your hotel room at our group rate." : "");
    } else {
      $("#thanks-title").textContent = "We'll miss you!";
      $("#thanks-body").textContent = `Thank you for letting us know. ${E.honoreeNickname || E.honoreeName} appreciates your good wishes.`;
    }
    box.hidden = false;
    box.scrollIntoView({ block: "center" });
  }

  initGate();
})();

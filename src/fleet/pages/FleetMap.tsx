import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import {
  AlertTriangle, Calendar, Car, ChevronRight, Clock, Gauge, MapPin, Maximize2,
  RefreshCw, Search, SlidersHorizontal, Wrench, X,
} from "lucide-react";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import { listFleetMapVehicles, type FleetMapVehicle } from "../services/mapService";

// ── Status config ────────────────────────────────────────────────────────────
type StatusKey = "Available" | "On Hire" | "In Repair" | "Breakdown" | "Reserved" | "Off Fleet";
const STATUS: Record<string, { hex: string; badge: string; soft: string }> = {
  available: { hex: "#16a34a", badge: "bg-[#e7f8ec] text-[#15803d]", soft: "bg-green-50 text-green-600" },
  "on hire": { hex: "#2563eb", badge: "bg-[#e6efff] text-[#1d4ed8]", soft: "bg-blue-50 text-blue-600" },
  "in repair": { hex: "#f59e0b", badge: "bg-[#fff3df] text-[#b45309]", soft: "bg-amber-50 text-amber-600" },
  breakdown: { hex: "#dc2626", badge: "bg-[#fdeaea] text-[#dc2626]", soft: "bg-red-50 text-red-600" },
  reserved: { hex: "#7c3aed", badge: "bg-[#f1eafe] text-[#6d28d9]", soft: "bg-purple-50 text-purple-600" },
  "off fleet": { hex: "#6b7280", badge: "bg-neutral-100 text-neutral-500", soft: "bg-neutral-100 text-neutral-500" },
};
const cfg = (v: FleetMapVehicle) => STATUS[(v.status || "").toLowerCase()] || STATUS["off fleet"];
const ALL_STATUSES: StatusKey[] = ["Available", "On Hire", "In Repair", "Breakdown", "Reserved", "Off Fleet"];
const statusIcon: Record<StatusKey, React.ReactNode> = {
  Available: <Car size={14} />, "On Hire": <Car size={14} />, "In Repair": <Wrench size={14} />,
  Breakdown: <AlertTriangle size={14} />, Reserved: <MapPin size={14} />, "Off Fleet": <Car size={14} />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const REF: [number, number] = [52.4862, -1.8904]; // Birmingham depot = "you are here"
const distanceKm = (lat: number, lng: number) => {
  const R = 6371, dLat = ((lat - REF[0]) * Math.PI) / 180, dLng = ((lng - REF[1]) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((REF[0] * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const relTime = (ms: number) => {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
};
const secondary = (v: FleetMapVehicle) =>
  (v.status || "").toLowerCase() === "on hire" ? v.driver_name || v.location_label : v.location_label;

// Colored circular vehicle marker (no external images — avoids Leaflet's asset issue).
const carIcon = (hex: string, selected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${hex};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 5px rgba(0,0,0,.35);border:2px solid #fff;${selected ? "outline:3px solid #111;outline-offset:1px;" : ""}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2v-3.28a2 2 0 0 0-.55-1.38l-1.63-1.72a2 2 0 0 0-.9-.55L14 9l-2.3-2.3a2 2 0 0 0-1.4-.7H5.5a2 2 0 0 0-1.8 1.1L2.4 9.7A3 3 0 0 0 2 11.2V17h2"/>
        <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
      </svg></div>`,
    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14],
  });
const depotIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><svg width="26" height="34" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="#7c3aed"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg></div>`,
    iconSize: [26, 34], iconAnchor: [13, 34],
  });

const FleetMap: React.FC = () => {
  const [vehicles, setVehicles] = useState<FleetMapVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(Date.now());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"vehicles" | "depots">("vehicles");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [active, setActive] = useState<Set<string>>(new Set(ALL_STATUSES));
  const [showDepots, setShowDepots] = useState(true);
  const [showGarages, setShowGarages] = useState(true);
  const [, force] = useState(0); // bump on map move so the detail card re-anchors

  const rootRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});

  const load = async () => {
    setLoading(true);
    setVehicles(await listFleetMapVehicles());
    setLoadedAt(Date.now());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Init map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { center: [53.4, -1.8], zoom: 6, zoomControl: false });
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 46,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      // Cluster bubble coloured by its dominant status, matching the pins.
      iconCreateFunction: (c) => {
        const tally: Record<string, number> = {};
        c.getAllChildMarkers().forEach((m) => {
          const s = String((m.options as any).vstatus || "").toLowerCase();
          tally[s] = (tally[s] || 0) + 1;
        });
        const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        const hex = STATUS[top]?.hex || "#2563eb";
        const n = c.getChildCount();
        return L.divIcon({
          className: "",
          html: `<div style="width:36px;height:36px;border-radius:50%;background:${hex};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.3)">${n}</div>`,
          iconSize: [36, 36],
        });
      },
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const bump = () => force((n) => n + 1);
    map.on("move zoom resize", bump);
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Distinct depots / garages (coords = mean of their vehicles).
  const depots = useMemo(() => {
    const g: Record<string, { lat: number; lng: number; n: number; available: number; onHire: number; inRepair: number }> = {};
    vehicles.forEach((v) => {
      const key = v.depot || "—";
      const d = (g[key] = g[key] || { lat: 0, lng: 0, n: 0, available: 0, onHire: 0, inRepair: 0 });
      d.lat += v.latitude; d.lng += v.longitude; d.n += 1;
      const s = (v.status || "").toLowerCase();
      if (s === "available") d.available += 1; else if (s === "on hire") d.onHire += 1; else if (s === "in repair") d.inRepair += 1;
    });
    return Object.entries(g).map(([name, d]) => ({ name, lat: d.lat / d.n, lng: d.lng / d.n, ...d }));
  }, [vehicles]);
  const garages = useMemo(() => {
    const set = new Map<string, { lat: number; lng: number }>();
    vehicles.filter((v) => (v.status || "").toLowerCase() === "in repair").forEach((v) => {
      if (v.location_label && !set.has(v.location_label)) set.set(v.location_label, { lat: v.latitude, lng: v.longitude });
    });
    return [...set.entries()].map(([name, p]) => ({ name, ...p }));
  }, [vehicles]);

  const shownVehicles = useMemo(() => vehicles.filter((v) => active.has(v.status || "")), [vehicles, active]);

  // (Re)build the clustered vehicle layer + depot/garage overlay when data or
  // filters change (NOT on selection — that only re-styles the chosen marker).
  useEffect(() => {
    const cluster = clusterRef.current, overlay = overlayRef.current;
    if (!cluster || !overlay) return;
    cluster.clearLayers();
    overlay.clearLayers();
    markersRef.current = {};
    shownVehicles.forEach((v) => {
      const m = L.marker([v.latitude, v.longitude], { icon: carIcon(cfg(v).hex, false), vstatus: v.status } as L.MarkerOptions)
        .on("click", () => setSelectedId(v.id));
      markersRef.current[v.id] = m;
      cluster.addLayer(m);
    });
    if (showDepots) depots.forEach((d) => overlay.addLayer(L.marker([d.lat, d.lng], { icon: depotIcon() }).bindTooltip(d.name)));
    if (showGarages) garages.forEach((gr) => overlay.addLayer(L.marker([gr.lat, gr.lng], { icon: carIcon("#f59e0b", false) }).bindTooltip(gr.name)));
  }, [shownVehicles, depots, garages, showDepots, showGarages]);

  // Fit to all vehicles on first load.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || vehicles.length === 0) return;
    map.fitBounds(L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude] as [number, number])).pad(0.15));
  }, [vehicles.length]);

  const selected = vehicles.find((v) => v.id === selectedId) || null;
  // Highlight the chosen pin and zoom the cluster in until it's individually visible.
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    Object.entries(markersRef.current).forEach(([id, m]) => {
      const v = vehicles.find((x) => x.id === Number(id));
      if (v) m.setIcon(carIcon(cfg(v).hex, Number(id) === selectedId));
    });
    if (selectedId != null && markersRef.current[selectedId]) {
      cluster.zoomToShowLayer(markersRef.current[selectedId], () => force((n) => n + 1));
    }
  }, [selectedId, vehicles]);

  const counts = useMemo(() => {
    const c = (k: string) => vehicles.filter((v) => (v.status || "").toLowerCase() === k).length;
    return { available: c("available"), onHire: c("on hire"), inRepair: c("in repair"), breakdown: c("breakdown"), depots: depots.length, total: vehicles.length };
  }, [vehicles, depots]);

  const cards = [
    { label: "Available", value: counts.available, sub: "Vehicles", Icon: Car, tint: "bg-green-50 text-green-600" },
    { label: "On Hire", value: counts.onHire, sub: "Vehicles", Icon: Car, tint: "bg-blue-50 text-blue-600" },
    { label: "In Repair", value: counts.inRepair, sub: "Vehicles", Icon: Wrench, tint: "bg-amber-50 text-amber-600" },
    { label: "Breakdown", value: counts.breakdown, sub: "Vehicles", Icon: AlertTriangle, tint: "bg-red-50 text-red-600" },
    { label: "Depot", value: counts.depots, sub: "Locations", Icon: MapPin, tint: "bg-purple-50 text-purple-600" },
    { label: "Total Fleet", value: counts.total, sub: "Vehicles", Icon: Car, tint: "bg-neutral-100 text-neutral-700" },
  ];

  const nearby = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shownVehicles
      .map((v) => ({ v, km: distanceKm(v.latitude, v.longitude) }))
      .filter(({ v }) => !needle || [v.registration, v.make, v.model, v.driver_name, v.location_label, v.depot].filter(Boolean).join(" ").toLowerCase().includes(needle))
      .sort((a, b) => a.km - b.km);
  }, [shownVehicles, query]);

  const toggleStatus = (s: string) => setActive((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.();
  };

  // Pixel position of the selected marker for the anchored detail card.
  const anchor = (() => {
    const map = mapRef.current;
    if (!map || !selected) return null;
    const p = map.latLngToContainerPoint([selected.latitude, selected.longitude]);
    return { x: p.x, y: p.y };
  })();

  return (
    <div ref={rootRef} className="min-h-screen bg-neutral-50 font-sans-headline">
      {loading && <FleetSpinnerLoader />}

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-neutral-900 text-2xl font-semibold">Fleet Map</h1>
            <p className="text-neutral-500 text-sm">Live view of all fleet vehicles and locations</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters((o) => !o)} className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-neutral-50">
                <SlidersHorizontal size={15} /> Filters
              </button>
              <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50">
                <Maximize2 size={15} />
              </button>
              <button type="button" onClick={load} className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-neutral-50">
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Last updated {relTime(loadedAt)}
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="text-xs text-neutral-500 mb-2">{c.label}</div>
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.tint}`}><c.Icon size={20} /></span>
                <div className="leading-tight">
                  <div className="text-2xl font-bold text-neutral-900">{c.value}</div>
                  <div className="text-xs text-neutral-400">{c.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map + right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* Map */}
          <div className="relative rounded-xl border border-neutral-200 overflow-hidden bg-white h-[560px]">
            <div ref={mapEl} className="absolute inset-0" style={{ zIndex: 0 }} />

            {/* Vehicle Status overlay */}
            {showFilters && (
              <div className="absolute top-3 left-3 z-[500] w-52 bg-white rounded-xl border border-neutral-200 shadow-lg p-3 max-h-[520px] overflow-y-auto">
                <div className="text-sm font-semibold text-neutral-800 mb-2">Vehicle Status</div>
                <div className="flex flex-col gap-1.5">
                  {ALL_STATUSES.map((s) => {
                    const c = STATUS[s.toLowerCase()];
                    const on = active.has(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleStatus(s)} className="flex items-center gap-2 text-left">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? "bg-neutral-900 border-neutral-900" : "border-neutral-300"}`}>
                          {on && <span className="w-1.5 h-1.5 bg-white rounded-sm" />}
                        </span>
                        <span className="w-5 h-5 rounded flex items-center justify-center" style={{ color: c.hex }}>{statusIcon[s]}</span>
                        <span className="text-sm text-neutral-600">{s}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-sm font-semibold text-neutral-800 mt-3 mb-2">Locations</div>
                <div className="flex flex-col gap-1.5">
                  {[["Depots", showDepots, setShowDepots, "#7c3aed"], ["Garages", showGarages, setShowGarages, "#f59e0b"]].map(([label, on, setter, hex]: any) => (
                    <button key={label} type="button" onClick={() => setter((o: boolean) => !o)} className="flex items-center gap-2 text-left">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? "bg-neutral-900 border-neutral-900" : "border-neutral-300"}`}>
                        {on && <span className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </span>
                      <span className="w-5 h-5 rounded flex items-center justify-center" style={{ color: hex }}><MapPin size={14} /></span>
                      <span className="text-sm text-neutral-600">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Anchored vehicle detail card */}
            {selected && anchor && (
              <div
                className="absolute z-[600] w-64 bg-white rounded-xl border border-neutral-200 shadow-xl p-3"
                style={{ left: Math.min(Math.max(anchor.x - 128, 8), (mapEl.current?.clientWidth || 800) - 264), top: Math.max(anchor.y - 250, 8) }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-900 font-semibold">{selected.registration}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg(selected).badge}`}>{selected.status}</span>
                    </div>
                    <div className="text-xs text-neutral-500">{[selected.make, selected.model].filter(Boolean).join(" ")}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedId(null)} className="text-neutral-400 hover:text-neutral-700"><X size={15} /></button>
                </div>
                <div className="my-2 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-300"><Car size={30} /></div>
                <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-2"><MapPin size={13} className="text-neutral-400" /> {selected.location_label || selected.depot}</div>
                  <div className="flex items-center gap-2"><Clock size={13} className="text-neutral-400" /> Updated {relTime(loadedAt)}</div>
                  <div className="flex items-center gap-2"><Gauge size={13} className="text-neutral-400" /> {selected.mileage ? `${selected.mileage.toLocaleString()} miles` : "—"}</div>
                  <div className="flex items-center gap-2"><Calendar size={13} className="text-neutral-400" /> Plate Expiry {fmtDate(selected.plate_expiry)}</div>
                  <div className="flex items-center gap-2"><Calendar size={13} className="text-neutral-400" /> MOT Expiry {fmtDate(selected.mot_expiry)}</div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button type="button" className="flex-1 h-8 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-medium hover:bg-neutral-50">View Details</button>
                  <button type="button" className="flex-1 h-8 rounded-lg bg-[#2563eb] text-white text-xs font-medium hover:bg-blue-700">Allocate</button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="rounded-xl border border-neutral-200 bg-white flex flex-col h-[560px]">
            <div className="p-3 border-b border-neutral-100">
              <div className="h-10 px-3 border border-neutral-200 rounded-lg flex items-center gap-2">
                <Search size={16} className="text-neutral-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search registration or location…" className="w-full outline-none text-sm text-neutral-900 placeholder:text-neutral-400" />
              </div>
            </div>
            <div className="px-3 flex items-center gap-5 border-b border-neutral-100">
              {([["vehicles", `Nearby Vehicles (${nearby.length})`], ["depots", `Depots & Garages (${depots.length + garages.length})`]] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={`py-3 text-sm border-b-2 -mb-px ${tab === k ? "border-[#2563eb] text-[#2563eb] font-medium" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}>{label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === "vehicles" ? (
                nearby.length === 0 ? (
                  <div className="p-6 text-center text-sm text-neutral-400">No vehicles match.</div>
                ) : nearby.map(({ v, km }) => (
                  <button key={v.id} type="button" onClick={() => setSelectedId(v.id)} className={`w-full text-left px-4 py-3 border-b border-neutral-100 flex items-center gap-3 hover:bg-neutral-50 ${v.id === selectedId ? "bg-blue-50/40" : ""}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg(v).hex }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-neutral-900 text-sm font-semibold">{v.registration}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg(v).badge}`}>{v.status}</span>
                      </span>
                      <span className="block text-neutral-500 text-xs mt-0.5 truncate">{[v.make, v.model].filter(Boolean).join(" ")} · {secondary(v)}</span>
                      <span className="block text-neutral-400 text-xs mt-0.5">{km.toFixed(1)} km away</span>
                    </span>
                    <ChevronRight size={16} className="text-neutral-300 shrink-0" />
                  </button>
                ))
              ) : (
                <>
                  {depots.map((d) => (
                    <div key={d.name} className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
                      <MapPin size={16} className="text-purple-600 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-neutral-900 text-sm font-semibold">{d.name}</span>
                        <span className="block text-neutral-400 text-xs">{d.n} vehicles</span>
                      </span>
                    </div>
                  ))}
                  {garages.map((g) => (
                    <div key={g.name} className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
                      <Wrench size={16} className="text-amber-600 shrink-0" />
                      <span className="text-neutral-900 text-sm font-semibold">{g.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="p-3 border-t border-neutral-100">
              <button type="button" className="w-full h-9 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black inline-flex items-center justify-center gap-2">
                View All Vehicles <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Overview by Location */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-neutral-900 text-lg font-semibold">Overview by Location</h2>
            <button type="button" className="text-sm text-[#2563eb] font-medium inline-flex items-center gap-1 hover:underline">View All Depots <ChevronRight size={14} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
            {depots.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-4 border border-neutral-100 rounded-lg px-4 py-3">
                <span className="flex items-center gap-2 min-w-0">
                  <MapPin size={16} className="text-purple-600 shrink-0" />
                  <span className="text-neutral-900 text-sm font-medium truncate">{d.name}</span>
                </span>
                <span className="flex items-center gap-5 shrink-0 text-center">
                  <span><span className="block text-lg font-bold text-green-600">{d.available}</span><span className="text-[11px] text-neutral-400">Available</span></span>
                  <span><span className="block text-lg font-bold text-blue-600">{d.onHire}</span><span className="text-[11px] text-neutral-400">On Hire</span></span>
                  <span><span className="block text-lg font-bold text-amber-600">{d.inRepair}</span><span className="text-[11px] text-neutral-400">In Repair</span></span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetMap;

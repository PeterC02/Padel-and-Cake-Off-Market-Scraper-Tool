import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const L = window.L;

const QUICK_LOCATIONS = [
  { name: 'Wokingham', lat: 51.411, lng: -0.834 },
  { name: 'Richmond', lat: 51.461, lng: -0.303 },
  { name: 'Guildford', lat: 51.236, lng: -0.571 },
  { name: 'Bracknell', lat: 51.416, lng: -0.749 },
  { name: 'Woking', lat: 51.316, lng: -0.556 },
  { name: 'London', lat: 51.507, lng: -0.128 },
  { name: 'Manchester', lat: 53.483, lng: -2.244 },
  { name: 'Birmingham', lat: 52.486, lng: -1.890 },
  { name: 'Leeds', lat: 53.801, lng: -1.549 },
  { name: 'Bristol', lat: 51.455, lng: -2.588 },
];

const SITE_TYPES = [
  {
    id: 'tennis',
    label: 'Tennis Courts',
    emoji: '🎾',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["leisure"="pitch"]["sport"="tennis"](around:${r},${lat},${lng});relation["leisure"="pitch"]["sport"="tennis"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 85,
  },
  {
    id: 'car_park',
    label: 'Surface Car Parks',
    emoji: '🅿️',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["amenity"="parking"]["parking"="surface"](around:${r},${lat},${lng});way["amenity"="parking"]["parking"!="multi-storey"]["parking"!="underground"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 60,
  },
  {
    id: 'disused',
    label: 'Disused/Abandoned Land',
    emoji: '🏚️',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["disused:leisure"](around:${r},${lat},${lng});way["disused:amenity"](around:${r},${lat},${lng});way["abandoned:leisure"](around:${r},${lat},${lng});way["abandoned:amenity"](around:${r},${lat},${lng});way["landuse"="brownfield"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 70,
  },
  {
    id: 'muga',
    label: 'Multi-Sport Courts (MUGAs)',
    emoji: '🏐',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["leisure"="pitch"]["sport"="multi"](around:${r},${lat},${lng});way["leisure"="pitch"]["sport"~"basketball|netball|volleyball"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 75,
  },
  {
    id: 'church',
    label: 'Churches (car parks/grounds)',
    emoji: '⛪',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 50,
  },
  {
    id: 'school',
    label: 'Schools (grounds/courts)',
    emoji: '🏫',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["amenity"="school"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 55,
  },
];

const STATUSES = [
  'new',
  'satellite checked',
  'owner found',
  'contacted',
  'replied',
  'viewing',
  'negotiating',
  'secured',
  'dead',
];

const STATUS_COLORS = {
  new: '#3b82f6',
  'satellite checked': '#8b5cf6',
  'owner found': '#f59e0b',
  contacted: '#f97316',
  replied: '#10b981',
  viewing: '#06b6d4',
  negotiating: '#ec4899',
  secured: '#22c55e',
  dead: '#6b7280',
};

function scoreSite(element, siteType) {
  let score = siteType.baseScore;
  const tags = element.tags || {};
  const reasons = [];
  let approxArea = null;

  // Surface scoring
  const surface = (tags.surface || '').toLowerCase();
  if (surface.includes('asphalt') || surface.includes('concrete') || surface.includes('tarmac')) {
    score += 10;
    reasons.push('+10 hard surface');
  } else if (surface.includes('grass') || surface.includes('clay')) {
    score -= 5;
    reasons.push('-5 soft surface');
  }

  // Disused bonus
  if (
    tags['disused:leisure'] ||
    tags['disused:amenity'] ||
    tags['abandoned:leisure'] ||
    tags['abandoned:amenity'] ||
    tags.landuse === 'brownfield'
  ) {
    score += 15;
    reasons.push('+15 disused/brownfield');
  }

  // Area scoring
  if (element.bounds) {
    const latDiff = Math.abs(element.bounds.maxlat - element.bounds.minlat);
    const lngDiff = Math.abs(element.bounds.maxlon - element.bounds.minlon);
    approxArea = Math.round(latDiff * 111000 * (lngDiff * 111000 * Math.cos((element.center?.lat || 51.4) * Math.PI / 180)));
    if (approxArea >= 600 && approxArea <= 2500) {
      score += 15;
      reasons.push('+15 ideal size');
    } else if (approxArea >= 400 && approxArea <= 4000) {
      score += 5;
      reasons.push('+5 usable size');
    } else if (approxArea > 10000) {
      score -= 10;
      reasons.push('-10 too large');
    }
  }

  // Access scoring
  const access = (tags.access || '').toLowerCase();
  if (access === 'private') {
    score -= 10;
    reasons.push('-10 private access');
  } else if (access === 'no') {
    score -= 20;
    reasons.push('-20 no access');
  }

  // Lighting bonus
  if (tags.lit === 'yes' || tags.floodlit === 'yes' || tags.lighting === 'yes') {
    score += 5;
    reasons.push('+5 has lighting');
  }

  return { score: Math.max(0, Math.min(100, score)), reasons, approxArea };
}

function getScoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}

function getStorageItem(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

function createMarkerIcon(score, emoji) {
  const color = getScoreColor(score);
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:white;
      border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:bold;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
    ">${score}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function createSavedMarkerIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#7c3aed;
      color:white;
      border-radius:50%;
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;
      border:2px solid #fbbf24;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
    ">★</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export default function PadelScout() {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedTypes, setSelectedTypes] = useState(['tennis', 'car_park', 'disused', 'muga']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedSites, setSavedSites] = useState([]);
  const [expandedSite, setExpandedSite] = useState(null);
  const [searchProgress, setSearchProgress] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [minScore, setMinScore] = useState(0);
  const [postcode, setPostcode] = useState('');
  const [searchCenter, setSearchCenter] = useState({ lat: 51.411, lng: -0.834 });
  const [searchRadius, setSearchRadius] = useState(3000);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightedSite, setHighlightedSite] = useState(null);
  const [sidebarView, setSidebarView] = useState('controls');
  const [dismissedSites, setDismissedSites] = useState(new Set());

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const savedMarkersLayerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const centerMarkerRef = useRef(null);

  // Load saved sites from localStorage on mount
  useEffect(() => {
    const saved = getStorageItem('padel-scout-sites');
    if (saved) setSavedSites(saved);
  }, []);

  // Persist saved sites to localStorage
  useEffect(() => {
    setStorageItem('padel-scout-sites', savedSites);
  }, [savedSites]);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [searchCenter.lat, searchCenter.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri', maxZoom: 19 }
    );

    const baseMaps = { 'Street Map': map._layers[Object.keys(map._layers)[0]], 'Satellite': satellite };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    savedMarkersLayerRef.current = L.layerGroup().addTo(map);

    // Click on map to set search center
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setSearchCenter({ lat, lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update radius circle and center marker when searchCenter or searchRadius changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);
    if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);

    radiusCircleRef.current = L.circle([searchCenter.lat, searchCenter.lng], {
      radius: searchRadius,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8 4',
    }).addTo(map);

    centerMarkerRef.current = L.marker([searchCenter.lat, searchCenter.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:16px;height:16px;
          background:#3b82f6;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(59,130,246,0.5);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).addTo(map);

    centerMarkerRef.current.bindPopup(
      `<div style="font-size:12px;text-align:center;">
        <strong>Search Centre</strong><br/>
        ${searchCenter.lat.toFixed(5)}, ${searchCenter.lng.toFixed(5)}<br/>
        <em>Radius: ${(searchRadius / 1000).toFixed(1)}km</em>
      </div>`
    );
  }, [searchCenter, searchRadius]);

  // Update result markers on map
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const filtered = results.filter((r) => r.score >= minScore);
    const sorted = [...filtered];
    if (sortBy === 'score') sorted.sort((a, b) => b.score - a.score);
    else if (sortBy === 'type') sorted.sort((a, b) => a.siteType.label.localeCompare(b.siteType.label));

    sorted.forEach((site) => {
      const isSaved = savedSites.some((s) => s.id === site.id);
      const marker = L.marker([site.lat, site.lng], {
        icon: createMarkerIcon(site.score, site.siteType.emoji),
      });

      const popupHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:240px;max-width:300px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">${site.siteType.emoji}</span>
            <strong style="font-size:13px;flex:1;">${site.name}</strong>
            <span style="background:${getScoreColor(site.score)};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;">${site.score}</span>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">${site.siteType.label} &middot; ${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</div>
          ${Object.keys(site.tags).length > 0 ? `<div style="font-size:10px;color:#9ca3af;margin-bottom:6px;">${Object.entries(site.tags).filter(([k]) => !k.startsWith('addr:') && !k.startsWith('source') && k !== 'type').slice(0, 5).map(([k, v]) => `${k}=${v}`).join(' &middot; ')}</div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <a href="https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">📡 Satellite</a>
            <a href="https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">🚶 Street View</a>
            <a href="https://www.openstreetmap.org/${site.osmType}/${site.osmId}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">🗺️ OSM</a>
            <a href="https://eservices.landregistry.gov.uk/wps/portal/Property_Search?lat=${site.lat}&lng=${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">📋 Land Registry</a>
          </div>
          ${site.approxArea ? `<div style="font-size:10px;color:#64748b;margin-bottom:6px;">📐 ~${site.approxArea.toLocaleString()}m² ${site.approxArea >= 600 && site.approxArea <= 2500 ? '✅ ideal for 3 courts' : site.approxArea < 600 ? '⚠️ may be small' : site.approxArea <= 4000 ? '👍 workable' : '⚠️ very large'}</div>` : ''}
          ${site.reasons && site.reasons.length > 0 ? `<div style="font-size:9px;color:#94a3b8;margin-bottom:6px;">${site.reasons.join(' · ')}</div>` : ''}
          <button onclick="window.__padelSaveSite__('${site.id}')" style="
            width:100%;padding:6px;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;
            background:${isSaved ? '#d1d5db' : '#22c55e'};color:white;
          " ${isSaved ? 'disabled' : ''}>${isSaved ? '✓ Saved to Pipeline' : '💾 Save to Pipeline'}</button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 320 });

      marker.on('mouseover', () => setHighlightedSite(site.id));
      marker.on('mouseout', () => setHighlightedSite(null));

      layer.addLayer(marker);
    });
  }, [results, minScore, sortBy, savedSites]);

  // Update saved site markers on pipeline tab
  useEffect(() => {
    const layer = savedMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (activeTab !== 'pipeline') return;

    savedSites.forEach((site) => {
      const marker = L.marker([site.lat, site.lng], {
        icon: createSavedMarkerIcon(),
      });
      marker.bindPopup(
        `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:200px;">
          <strong>${site.siteTypeEmoji || ''} ${site.name}</strong><br/>
          <span style="font-size:11px;color:${STATUS_COLORS[site.status]};font-weight:600;text-transform:uppercase;">${site.status}</span><br/>
          <div style="font-size:11px;color:#6b7280;margin:4px 0;">${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a href="https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">📡 Satellite</a>
            <a href="https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">🚶 Street View</a>
            <a href="https://www.openstreetmap.org/${site.osmType}/${site.osmId}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">🗺️ OSM</a>
            <a href="https://eservices.landregistry.gov.uk/wps/portal/Property_Search?lat=${site.lat}&lng=${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">📋 Land Registry</a>
          </div>
        </div>`
      );
      layer.addLayer(marker);
    });
  }, [savedSites, activeTab]);

  // Expose save function to popup buttons
  useEffect(() => {
    window.__padelSaveSite__ = (siteId) => {
      const site = results.find((r) => r.id === siteId);
      if (site) saveSite(site);
    };
    return () => { delete window.__padelSaveSite__; };
  }, [results, savedSites]);

  const flyTo = useCallback((lat, lng, zoom) => {
    const map = mapInstanceRef.current;
    if (map) map.flyTo([lat, lng], zoom || 14, { duration: 1 });
    setSearchCenter({ lat, lng });
  }, []);

  const lookupPostcode = useCallback(async () => {
    if (!postcode.trim()) return;
    setError(null);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      if (data.status === 200 && data.result) {
        flyTo(data.result.latitude, data.result.longitude, 14);
      } else {
        setError('Postcode not found. Try another UK postcode.');
      }
    } catch {
      setError('Failed to lookup postcode. Check your connection.');
    }
  }, [postcode, flyTo]);

  const searchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchProgress('Starting search...');
    setSidebarView('results');

    const { lat, lng } = searchCenter;
    const radius = searchRadius;

    const allResults = [];
    const typesToSearch = SITE_TYPES.filter((t) => selectedTypes.includes(t.id));

    for (let i = 0; i < typesToSearch.length; i++) {
      const siteType = typesToSearch[i];
      setSearchProgress(`Searching ${siteType.label} (${i + 1}/${typesToSearch.length})...`);

      try {
        const query = siteType.query(lat, lng, radius);
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${siteType.label}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const elements = data.elements || [];

        elements.forEach((el) => {
          const elLat = el.center?.lat || el.lat;
          const elLng = el.center?.lon || el.lon;
          if (!elLat || !elLng) return;

          const { score, reasons, approxArea } = scoreSite(el, siteType);
          allResults.push({
            id: `${el.type}-${el.id}`,
            osmId: el.id,
            osmType: el.type,
            lat: elLat,
            lng: elLng,
            tags: el.tags || {},
            siteType: siteType,
            score,
            reasons,
            approxArea,
            name:
              el.tags?.name ||
              el.tags?.['disused:name'] ||
              `${siteType.label} near ${elLat.toFixed(4)}, ${elLng.toFixed(4)}`,
          });
        });

        // Rate limiting - be nice to Overpass
        if (i < typesToSearch.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (err) {
        console.warn(`Error searching ${siteType.label}:`, err);
      }
    }

    setResults(allResults);
    setSearchProgress('');
    setLoading(false);
  }, [searchCenter, searchRadius, selectedTypes]);

  const saveSite = useCallback(
    (site) => {
      if (savedSites.find((s) => s.id === site.id)) return;
      const newSite = {
        ...site,
        status: 'new',
        notes: '',
        savedAt: new Date().toISOString(),
        siteTypeId: site.siteType.id,
        siteTypeLabel: site.siteType.label,
        siteTypeEmoji: site.siteType.emoji,
      };
      setSavedSites((prev) => [...prev, newSite]);
    },
    [savedSites]
  );

  const updateSiteStatus = useCallback((siteId, status) => {
    setSavedSites((prev) => prev.map((s) => (s.id === siteId ? { ...s, status } : s)));
  }, []);

  const updateSiteNotes = useCallback((siteId, notes) => {
    setSavedSites((prev) => prev.map((s) => (s.id === siteId ? { ...s, notes } : s)));
  }, []);

  const removeSite = useCallback((siteId) => {
    setSavedSites((prev) => prev.filter((s) => s.id !== siteId));
  }, []);

  const filteredResults = useMemo(() => {
    let filtered = results.filter((r) => r.score >= minScore && !dismissedSites.has(r.id));
    if (sortBy === 'score') filtered.sort((a, b) => b.score - a.score);
    else if (sortBy === 'type') filtered.sort((a, b) => a.siteType.label.localeCompare(b.siteType.label));
    return filtered;
  }, [results, sortBy, minScore, dismissedSites]);

  const typeCounts = useMemo(() => {
    const counts = {};
    filteredResults.forEach((r) => {
      counts[r.siteType.id] = (counts[r.siteType.id] || 0) + 1;
    });
    return counts;
  }, [filteredResults]);

  const exportPipelineCSV = useCallback(() => {
    if (savedSites.length === 0) return;
    const headers = ['Name','Type','Score','Status','Lat','Lng','Area (m²)','Notes','Satellite','Street View','OSM','Land Registry','Saved At'];
    const rows = savedSites.map((s) => [
      s.name,
      s.siteTypeLabel || '',
      s.score,
      s.status,
      s.lat,
      s.lng,
      s.approxArea || '',
      (s.notes || '').replace(/[\n\r,]/g, ' '),
      `https://www.google.com/maps/@${s.lat},${s.lng},200m/data=!3m1!1e3`,
      `https://www.google.com/maps?layer=c&cbll=${s.lat},${s.lng}`,
      `https://www.openstreetmap.org/${s.osmType}/${s.osmId}`,
      `https://eservices.landregistry.gov.uk/wps/portal/Property_Search?lat=${s.lat}&lng=${s.lng}`,
      s.savedAt || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padel-pipeline-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [savedSites]);

  const pipelineGroups = useMemo(() => {
    const groups = {};
    STATUSES.forEach((s) => (groups[s] = []));
    savedSites.forEach((site) => {
      if (groups[site.status]) groups[site.status].push(site);
    });
    return groups;
  }, [savedSites]);

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  };

  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    fontFamily: font,
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: font, color: '#1f2937' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '380px' : '0px',
          minWidth: sidebarOpen ? '380px' : '0px',
          height: '100%',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s, min-width 0.2s',
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🏸 Padel Scout UK</h1>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>OFF-MARKET LAND TOOL</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          {[
            { id: 'search', label: '🔍 Search', count: null },
            { id: 'pipeline', label: '📊 Pipeline', count: savedSites.length },
            { id: 'resources', label: '📚 Info', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontFamily: font,
              }}
            >
              {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* Sidebar content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {activeTab === 'search' && (
            <>
              {/* Postcode search */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Search any UK location
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Enter UK postcode (e.g. GU1 4QA)"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupPostcode()}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      fontFamily: font,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={lookupPostcode}
                    style={{ ...btnStyle, background: '#3b82f6', color: 'white', padding: '8px 14px', fontSize: '13px' }}
                  >
                    Go
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                  Or click anywhere on the map to set search centre
                </div>
              </div>

              {/* Quick locations */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quick jump
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => flyTo(loc.lat, loc.lng, 14)}
                      style={{
                        ...btnStyle,
                        background: Math.abs(searchCenter.lat - loc.lat) < 0.01 && Math.abs(searchCenter.lng - loc.lng) < 0.01
                          ? '#3b82f6' : '#e2e8f0',
                        color: Math.abs(searchCenter.lat - loc.lat) < 0.01 && Math.abs(searchCenter.lng - loc.lng) < 0.01
                          ? 'white' : '#475569',
                        padding: '4px 8px',
                        fontSize: '11px',
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Search radius
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    {(searchRadius / 1000).toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={15000}
                  step={500}
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                  <span>0.5km</span><span>15km</span>
                </div>
              </div>

              {/* Site types */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Site types to search
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {SITE_TYPES.map((type) => (
                    <label
                      key={type.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: selectedTypes.includes(type.id) ? '#eff6ff' : 'transparent',
                        fontSize: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.id)}
                        onChange={() =>
                          setSelectedTypes((prev) =>
                            prev.includes(type.id) ? prev.filter((t) => t !== type.id) : [...prev, type.id]
                          )
                        }
                        style={{ accentColor: '#3b82f6' }}
                      />
                      <span>{type.emoji}</span>
                      <span style={{ flex: 1 }}>{type.label}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>base: {type.baseScore}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={searchSites}
                disabled={loading || selectedTypes.length === 0}
                style={{
                  ...btnStyle,
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  borderRadius: '8px',
                }}
              >
                {loading ? `⏳ ${searchProgress}` : `🔍 Search this area (${(searchRadius / 1000).toFixed(1)}km)`}
              </button>

              {/* Coordinates display */}
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Centre: {searchCenter.lat.toFixed(5)}, {searchCenter.lng.toFixed(5)}
              </div>

              {error && (
                <div style={{ ...cardStyle, background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626', fontSize: '12px' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Results */}
              {(sidebarView === 'results' || results.length > 0) && (
                <>
                  {results.length > 0 && (
                    <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                        {filteredResults.length} sites found
                      </span>
                      {dismissedSites.size > 0 && (
                        <button
                          onClick={() => setDismissedSites(new Set())}
                          style={{ ...btnStyle, background: '#fef3c7', color: '#92400e', fontSize: '10px', padding: '2px 8px' }}
                        >
                          Show {dismissedSites.size} dismissed
                        </button>
                      )}
                    </div>
                    {Object.keys(typeCounts).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {SITE_TYPES.filter(t => typeCounts[t.id]).map(t => (
                          <span key={t.id} style={{ fontSize: '10px', background: '#f1f5f9', padding: '1px 6px', borderRadius: '8px', color: '#475569' }}>
                            {t.emoji} {typeCounts[t.id]}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '11px', fontFamily: font }}
                        >
                          <option value="score">By Score</option>
                          <option value="type">By Type</option>
                        </select>
                        <select
                          value={minScore}
                          onChange={(e) => setMinScore(parseInt(e.target.value))}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '11px', fontFamily: font }}
                        >
                          <option value={0}>All</option>
                          <option value={40}>40+</option>
                          <option value={60}>60+</option>
                          <option value={80}>80+</option>
                        </select>
                      </div>
                    </div>
                    </>
                  )}

                  {filteredResults.map((site) => {
                    const isSaved = savedSites.some((s) => s.id === site.id);
                    const isHighlighted = highlightedSite === site.id;
                    return (
                      <div
                        key={site.id}
                        style={{
                          ...cardStyle,
                          borderColor: isHighlighted ? '#3b82f6' : '#e5e7eb',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                        onClick={() => {
                          const map = mapInstanceRef.current;
                          if (map) map.flyTo([site.lat, site.lng], 17, { duration: 0.5 });
                        }}
                        onMouseEnter={() => setHighlightedSite(site.id)}
                        onMouseLeave={() => setHighlightedSite(null)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '14px' }}>{site.siteType.emoji}</span>
                              <span style={{ fontWeight: '600', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</span>
                              <span style={{
                                display: 'inline-block', padding: '1px 6px', borderRadius: '10px',
                                backgroundColor: getScoreColor(site.score), color: 'white', fontSize: '10px', fontWeight: 'bold', flexShrink: 0,
                              }}>{site.score}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>
                              {site.siteType.label} &middot; {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                              {site.approxArea ? ` · ~${site.approxArea.toLocaleString()}m²` : ''}
                            </div>
                            {site.reasons && site.reasons.length > 0 && (
                              <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px' }}>
                                {site.reasons.join(' · ')}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <a href={`https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📡 Sat</a>
                              <a href={`https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🚶 SV</a>
                              <a href={`https://www.openstreetmap.org/${site.osmType}/${site.osmId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🗺️ OSM</a>
                              <a href={`https://eservices.landregistry.gov.uk/wps/portal/Property_Search?lat=${site.lat}&lng=${site.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📋 LR</a>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0, marginLeft: '6px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); saveSite(site); }}
                              disabled={isSaved}
                              style={{
                                ...btnStyle,
                                background: isSaved ? '#d1d5db' : '#22c55e',
                                color: 'white',
                                fontSize: '10px',
                                padding: '4px 8px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isSaved ? '✓' : '💾'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDismissedSites(prev => new Set([...prev, site.id])); }}
                              title="Dismiss this result"
                              style={{
                                ...btnStyle,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                fontSize: '10px',
                                padding: '4px 8px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {activeTab === 'pipeline' && (
            <>
              {/* Pipeline summary */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pipeline funnel
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {STATUSES.map((status) => (
                    <div
                      key={status}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: STATUS_COLORS[status] + '18',
                        border: `1px solid ${STATUS_COLORS[status]}30`,
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ fontWeight: '700', color: STATUS_COLORS[status] }}>
                        {pipelineGroups[status].length}
                      </span>{' '}
                      <span style={{ color: '#64748b' }}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {savedSites.length > 0 && (
                <button
                  onClick={exportPipelineCSV}
                  style={{ ...btnStyle, width: '100%', background: '#1e293b', color: 'white', padding: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '8px', borderRadius: '6px' }}
                >
                  📥 Export Pipeline to CSV
                </button>
              )}

              {savedSites.length === 0 && (
                <div style={{ ...cardStyle, textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No saved sites yet. Search and save sites to build your pipeline.
                </div>
              )}

              {STATUSES.map(
                (status) =>
                  pipelineGroups[status].length > 0 && (
                    <div key={status}>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', color: STATUS_COLORS[status],
                        margin: '12px 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {status} ({pipelineGroups[status].length})
                      </div>
                      {pipelineGroups[status].map((site) => (
                        <div key={site.id} style={cardStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div
                              style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                              onClick={() => {
                                const map = mapInstanceRef.current;
                                if (map) map.flyTo([site.lat, site.lng], 17, { duration: 0.5 });
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '14px' }}>{site.siteTypeEmoji}</span>
                                <span style={{ fontWeight: '600', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</span>
                                <span style={{
                                  display: 'inline-block', padding: '1px 6px', borderRadius: '10px',
                                  backgroundColor: getScoreColor(site.score), color: 'white', fontSize: '10px', fontWeight: 'bold', flexShrink: 0,
                                }}>{site.score}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '3px' }}>
                                {site.siteTypeLabel} &middot; {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <a href={`https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📡 Sat</a>
                                <a href={`https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🚶 SV</a>
                                <a href={`https://www.openstreetmap.org/${site.osmType}/${site.osmId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🗺️ OSM</a>
                                <a href={`https://eservices.landregistry.gov.uk/wps/portal/Property_Search?lat=${site.lat}&lng=${site.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📋 LR</a>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedSite(expandedSite === site.id ? null : site.id)}
                              style={{ ...btnStyle, background: '#f1f5f9', color: '#475569', padding: '4px 8px', fontSize: '11px', flexShrink: 0, marginLeft: '6px' }}
                            >
                              {expandedSite === site.id ? '▲' : '▼'}
                            </button>
                          </div>

                          {expandedSite === site.id && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '3px' }}>Status</label>
                                <select
                                  value={site.status}
                                  onChange={(e) => updateSiteStatus(site.id, e.target.value)}
                                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', width: '100%', fontFamily: font }}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '3px' }}>Notes</label>
                                <textarea
                                  value={site.notes}
                                  onChange={(e) => updateSiteNotes(site.id, e.target.value)}
                                  placeholder="Owner name, phone, observations, next actions..."
                                  style={{
                                    width: '100%', minHeight: '60px', padding: '6px', borderRadius: '4px',
                                    border: '1px solid #d1d5db', fontSize: '12px', fontFamily: font, resize: 'vertical', boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => removeSite(site.id)}
                                style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626', fontSize: '11px' }}
                              >
                                🗑️ Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
              )}
            </>
          )}

          {activeTab === 'resources' && (
            <>
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Council brownfield registers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="https://www.wokingham.gov.uk/planning-policy/planning-policy-information/brownfield-land-register" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Wokingham Brownfield Register</a>
                  <a href="https://www.richmond.gov.uk/services/planning/planning_policy/brownfield_land_register" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Richmond Brownfield Register</a>
                  <a href="https://www.guildford.gov.uk/brownfieldregister" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Guildford Brownfield Register</a>
                  <a href="https://www.bracknell-forest.gov.uk/planning-and-building-control/planning/brownfield-land-register" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Bracknell Forest Brownfield Register</a>
                  <a href="https://www.woking.gov.uk/planning-and-building-control/planning-policy/brownfield-register" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Woking Brownfield Register</a>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Playing pitch strategies
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="https://www.wokingham.gov.uk/planning-policy/planning-policy-information/playing-pitch-strategy" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Wokingham Playing Pitch Strategy</a>
                  <a href="https://www.richmond.gov.uk/services/leisure_and_culture/sports_and_fitness/playing_pitch_strategy" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Richmond Playing Pitch Strategy</a>
                  <a href="https://www.guildford.gov.uk/playingpitchstrategy" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Guildford Playing Pitch Strategy</a>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Planning application portals
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="https://planning.wokingham.gov.uk/FastWeb/welcome.asp" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Wokingham Planning Portal</a>
                  <a href="https://www2.richmond.gov.uk/PlanData2/Planning_Search.aspx" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Richmond Planning Portal</a>
                  <a href="https://www.guildford.gov.uk/planning/search" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Guildford Planning Portal</a>
                  <a href="https://planapp.bracknell-forest.gov.uk/online-applications/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Bracknell Forest Planning Portal</a>
                  <a href="https://caps.woking.gov.uk/online-applications/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Woking Planning Portal</a>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Key tools
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="https://eservices.landregistry.gov.uk/wps/portal/Property_Search" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>🏠 HM Land Registry — Property Search</a>
                  <a href="https://www.activeplacespower.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>📊 Active Places Power — Sport England</a>
                  <a href="https://www.lta.org.uk/play/ways-to-play/find-a-court/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>🎾 LTA Court Finder</a>
                  <a href="https://www.google.com/earth/versions/#earth-pro" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>🌍 Google Earth Pro (free)</a>
                  <a href="https://magic.defra.gov.uk/MagicMap.aspx" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>🗺️ MAGIC Map — Environmental designations</a>
                  <a href="https://www.tax.service.gov.uk/check-council-tax-band/search" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>💷 Council Tax Band Lookup</a>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Padel court quick reference
                </div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>
                  <div><strong>Single court:</strong> 20m × 10m (200m²) + run-off = ~300m²</div>
                  <div><strong>3 courts (ideal):</strong> 60m × 10m or 40m × 20m = 600–800m²</div>
                  <div><strong>Sweet spot:</strong> 600–2,500m² sites</div>
                  <div><strong>Surface:</strong> Asphalt/concrete base preferred</div>
                  <div><strong>Height:</strong> Min 8m clearance</div>
                  <div><strong>Access:</strong> Vehicle access + customer parking</div>
                  <div><strong>Planning:</strong> Usually D2 (assembly & leisure) use class</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'absolute',
          left: sidebarOpen ? '380px' : '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          width: '24px',
          height: '48px',
          border: 'none',
          borderRadius: '0 6px 6px 0',
          background: 'white',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#64748b',
          transition: 'left 0.2s',
          fontFamily: font,
        }}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, height: '100%' }} />

      {/* Score legend overlay */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '12px',
        zIndex: 1000,
        background: 'white',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '10px',
        color: '#475569',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Score</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: '80+', color: '#16a34a' },
            { label: '60+', color: '#d97706' },
            { label: '40+', color: '#ea580c' },
            { label: '<40', color: '#dc2626' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

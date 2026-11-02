import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GlobalPort, ShippingCorridor, ECAZone, LiveVessel } from '../types';
import { Ship, Radio, Wind, Zap, Fuel, ArrowUpRight, Gauge, CheckCircle2 } from 'lucide-react';

interface MaritimeMapProps {
  corridors: ShippingCorridor[];
  vessels: LiveVessel[];
  ports: GlobalPort[];
  ecas: ECAZone[];
  height?: string;
  selectedVesselId?: string | null;
  onSelectVessel?: (vessel: LiveVessel | null) => void;
}

export const MaritimeMap: React.FC<MaritimeMapProps> = ({
  corridors,
  vessels,
  ports,
  ecas,
  height = '620px',
  selectedVesselId,
  onSelectVessel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    portsLayer?: L.LayerGroup;
    corridorsLayer?: L.LayerGroup;
    ecasLayer?: L.LayerGroup;
    vesselsLayer?: L.LayerGroup;
  }>({});

  const [showECAs, setShowECAs] = useState(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [focusedVessel, setFocusedVessel] = useState<LiveVessel | null>(null);
  const [basemap, setBasemap] = useState<'esri-dark' | 'esri-ocean' | 'osm-dark'>('esri-dark');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.0, 40.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersRef.current.portsLayer = L.layerGroup().addTo(map);
    layersRef.current.corridorsLayer = L.layerGroup().addTo(map);
    layersRef.current.ecasLayer = L.layerGroup().addTo(map);
    layersRef.current.vesselsLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer dynamically when basemap changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    let options: L.TileLayerOptions = {
      maxZoom: 16,
      className: 'maritime-dark-tile',
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    };

    if (basemap === 'esri-ocean') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
      options = {
        maxZoom: 13,
        className: 'maritime-ocean-tile',
        attribution: '&copy; Esri, GEBCO, NOAA',
      };
    } else if (basemap === 'osm-dark') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = {
        maxZoom: 19,
        className: 'maritime-osm-dark',
        attribution: '&copy; OpenStreetMap contributors',
      };
    }

    const newTile = L.tileLayer(url, options).addTo(map);
    tileLayerRef.current = newTile;
    newTile.bringToBack();
  }, [basemap]);

  // Sync selected vessel from prop
  useEffect(() => {
    if (selectedVesselId) {
      const v = vessels.find((item) => item.id === selectedVesselId) || null;
      setFocusedVessel(v);
      if (v && mapInstanceRef.current) {
        mapInstanceRef.current.setView([v.lat, v.lng], 5, { animate: true });
      }
    }
  }, [selectedVesselId, vessels]);

  // Render ECAs
  useEffect(() => {
    const layer = layersRef.current.ecasLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showECAs) return;

    ecas.forEach((eca) => {
      const polygon = L.polygon(eca.coordinates, {
        color: eca.color,
        weight: 1.5,
        fillColor: eca.color,
        fillOpacity: 0.12,
        dashArray: '4, 4',
      });

      polygon.bindPopup(`
        <div style="background:#071220; color:#F8FAFC; padding:8px; border-radius:6px; font-family:sans-serif; min-width:200px;">
          <div style="font-weight:bold; color:${eca.color}; margin-bottom:4px; font-size:12px;">${eca.name}</div>
          <div style="font-size:11px; color:#94A3B8; line-height:1.4;">${eca.regulation}</div>
          <div style="margin-top:6px; font-size:10px; color:#FCD34D;">⚡ Strict Low-Sulfur (0.10%) & Tier III NOx Zone</div>
        </div>
      `, { className: 'maritime-popup' });

      polygon.addTo(layer);
    });
  }, [ecas, showECAs]);

  // Render Corridors
  useEffect(() => {
    const layer = layersRef.current.corridorsLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showCorridors) return;

    const colors = ['#00B4D8', '#10B981', '#F59E0B', '#A855F7'];

    corridors.forEach((corr, idx) => {
      const color = colors[idx % colors.length];
      const polyline = L.polyline(corr.waypoints, {
        color,
        weight: 2.5,
        opacity: 0.75,
        dashArray: '6, 4',
      });

      polyline.bindPopup(`
        <div style="background:#071220; color:#F8FAFC; padding:8px; border-radius:6px; font-family:sans-serif; min-width:210px;">
          <div style="font-weight:bold; color:${color}; font-size:12px; margin-bottom:4px;">${corr.name}</div>
          <div style="font-size:11px; color:#94A3B8;">Distance: <b style="color:#FFF">${corr.distance_nm.toLocaleString()} nm</b></div>
          <div style="font-size:11px; color:#94A3B8;">Transit Time: <b style="color:#FFF">${corr.avg_duration_days} days</b></div>
          <div style="font-size:10px; color:#38BDF8; margin-top:4px;">ECA Zones: ${corr.eca_zones_crossed.length ? corr.eca_zones_crossed.join(', ') : 'Open Ocean'}</div>
        </div>
      `, { className: 'maritime-popup' });

      polyline.addTo(layer);
    });
  }, [corridors, showCorridors]);

  // Render Ports
  useEffect(() => {
    const layer = layersRef.current.portsLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showPorts) return;

    ports.forEach((port) => {
      const iconHtml = `
        <div style="
          width: 14px;
          height: 14px;
          background: #060D17;
          border: 2px solid ${port.shore_power ? '#10B981' : '#00B4D8'};
          border-radius: 50%;
          box-shadow: 0 0 8px ${port.shore_power ? 'rgba(16, 185, 129, 0.8)' : 'rgba(0, 180, 216, 0.8)'};
        "></div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-port-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([port.lat, port.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="background:#071220; color:#F8FAFC; padding:8px; border-radius:6px; font-family:sans-serif; min-width:220px;">
          <div style="font-weight:bold; color:#00B4D8; font-size:12px;">${port.name} (${port.code})</div>
          <div style="font-size:10px; color:#94A3B8; margin-bottom:4px;">${port.type} • ${port.country}</div>
          <div style="font-size:11px; color:#94A3B8;">Berths: <b style="color:#FFF">${port.berths}</b></div>
          <div style="font-size:11px; color:#94A3B8;">Shore Power: <b style="color:${port.shore_power ? '#10B981' : '#EF4444'}">${port.shore_power ? 'Available (Cold Ironing)' : 'Not Equipped'}</b></div>
          <div style="font-size:11px; color:#94A3B8;">Grid Factor: <b style="color:#FFF">${port.grid_carbon_g_kwh} g CO₂/kWh</b></div>
          <div style="font-size:10px; color:#A7F3D0; margin-top:4px;">${port.bio_methanol_bunkering ? '✓ Bio-Methanol Bunker Available' : '• Conventional / LNG Only'}</div>
        </div>
      `, { className: 'maritime-popup' });

      marker.addTo(layer);
    });
  }, [ports, showPorts]);

  // Render Vessels
  useEffect(() => {
    const layer = layersRef.current.vesselsLayer;
    if (!layer) return;
    layer.clearLayers();

    vessels.forEach((vessel) => {
      const isSelected = focusedVessel?.id === vessel.id;
      const fuelColor =
        vessel.fuel_type === 'Green Ammonia'
          ? '#10B981'
          : vessel.fuel_type.includes('Methanol')
          ? '#34D399'
          : vessel.fuel_type === 'LNG'
          ? '#00B4D8'
          : '#F59E0B';

      const iconHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        ">
          ${
            isSelected
              ? `<div style="
                  position: absolute;
                  width: 38px;
                  height: 38px;
                  border-radius: 50%;
                  border: 2px dashed #00B4D8;
                  animation: spin 6s linear infinite;
                "></div>`
              : ''
          }
          <div style="
            width: 22px;
            height: 22px;
            background: #0B192C;
            border: 2px solid ${fuelColor};
            border-radius: 6px;
            transform: rotate(${vessel.heading}deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${fuelColor};
            cursor: pointer;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${fuelColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-vessel-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([vessel.lat, vessel.lng], { icon: customIcon });

      marker.on('click', () => {
        setFocusedVessel(vessel);
        if (onSelectVessel) {
          onSelectVessel(vessel);
        }
      });

      marker.bindTooltip(`<b>${vessel.name}</b> (${vessel.speed_knots} kts • ${vessel.fuel_type})`, {
        direction: 'top',
        className: 'vessel-map-tooltip',
      });

      marker.addTo(layer);
    });
  }, [vessels, focusedVessel, onSelectVessel]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-navy-750 shadow-2xl bg-navy-950">
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height }} />

      {/* Floating Controls Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-navy-900/90 backdrop-blur-md border border-navy-700/80 rounded-lg p-2.5 shadow-xl text-xs space-y-2">
          <div className="font-bold text-white flex items-center gap-2 pb-1.5 border-b border-navy-750">
            <Radio className="w-3.5 h-3.5 text-cyan-brand animate-pulse" />
            <span>GIS Map Layers</span>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showCorridors}
                onChange={(e) => setShowCorridors(e.target.checked)}
                className="rounded border-navy-700 text-cyan-brand focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-cyan-brand rounded-full inline-block" />
                Shipping Corridors
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showECAs}
                onChange={(e) => setShowECAs(e.target.checked)}
                className="rounded border-navy-700 text-amber-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500/30 border border-amber-500 rounded-sm inline-block" />
                IMO ECA Geofences
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showPorts}
                onChange={(e) => setShowPorts(e.target.checked)}
                className="rounded border-navy-700 text-emerald-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-emerald-400 bg-emerald-950 inline-block" />
                World Ports & Shore Power
              </span>
            </label>
          </div>

          {/* Basemap Style Toggle (100% Free - No API Key) */}
          <div className="pt-2 border-t border-navy-750">
            <span className="text-[10px] text-slate-400 font-semibold block mb-1 uppercase tracking-wider">
              Basemap (No API Key Required)
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setBasemap('esri-dark')}
                className={`py-1 px-1 rounded text-[10px] font-semibold transition text-center ${
                  basemap === 'esri-dark'
                    ? 'bg-cyan-brand text-navy-950 font-bold shadow-sm'
                    : 'bg-navy-950 text-slate-400 hover:text-white'
                }`}
              >
                Dark Canvas
              </button>
              <button
                type="button"
                onClick={() => setBasemap('esri-ocean')}
                className={`py-1 px-1 rounded text-[10px] font-semibold transition text-center ${
                  basemap === 'esri-ocean'
                    ? 'bg-cyan-brand text-navy-950 font-bold shadow-sm'
                    : 'bg-navy-950 text-slate-400 hover:text-white'
                }`}
              >
                Ocean Depth
              </button>
              <button
                type="button"
                onClick={() => setBasemap('osm-dark')}
                className={`py-1 px-1 rounded text-[10px] font-semibold transition text-center ${
                  basemap === 'osm-dark'
                    ? 'bg-cyan-brand text-navy-950 font-bold shadow-sm'
                    : 'bg-navy-950 text-slate-400 hover:text-white'
                }`}
              >
                OSM Night
              </button>
            </div>
          </div>
        </div>

        {/* Vessel Selector Dropdown */}
        <div className="bg-navy-900/90 backdrop-blur-md border border-navy-700/80 rounded-lg p-2 shadow-xl text-xs">
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Fleet Vessel</label>
          <select
            value={focusedVessel?.id || ''}
            onChange={(e) => {
              const v = vessels.find((item) => item.id === e.target.value) || null;
              setFocusedVessel(v);
              if (onSelectVessel) onSelectVessel(v);
              if (v && mapInstanceRef.current) {
                mapInstanceRef.current.setView([v.lat, v.lng], 5, { animate: true });
              }
            }}
            className="input-maritime text-xs py-1 px-2 w-full bg-navy-950 border border-navy-750 rounded text-slate-200"
          >
            <option value="">-- All Active Vessels ({vessels.length}) --</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.type} • {v.fuel_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Vessel Telemetry HUD (Bottom Right / Side) */}
      {focusedVessel && (
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-navy-900/95 backdrop-blur-md border border-cyan-brand/40 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-navy-750 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-brand" />
                <h3 className="text-sm font-bold text-white">{focusedVessel.name}</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {focusedVessel.type} • {focusedVessel.dwt.toLocaleString()} DWT
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                focusedVessel.cii_rating === 'A'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              CII: Grade {focusedVessel.cii_rating}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-navy-950/70 p-2 rounded-lg border border-navy-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-brand" /> Speed Thru Water
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                {focusedVessel.speed_knots} kts
              </span>
              <span className="text-[9px] text-slate-500">Design: {focusedVessel.design_speed} kts</span>
            </div>

            <div className="bg-navy-950/70 p-2 rounded-lg border border-navy-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Fuel className="w-3 h-3 text-amber-400" /> Bunker Fuel
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block truncate">
                {focusedVessel.fuel_type}
              </span>
              <span className="text-[9px] text-slate-500">Burn: {focusedVessel.fuel_burn_mt_day} MT/day</span>
            </div>

            <div className="bg-navy-950/70 p-2 rounded-lg border border-navy-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-300" /> Heading & Position
              </span>
              <span className="text-xs font-semibold text-slate-200 font-mono mt-0.5 block">
                {focusedVessel.heading}° ({focusedVessel.lat.toFixed(1)}°, {focusedVessel.lng.toFixed(1)}°)
              </span>
              <span className="text-[9px] text-slate-500">Corridor: {focusedVessel.origin} → {focusedVessel.destination}</span>
            </div>

            <div className="bg-navy-950/70 p-2 rounded-lg border border-navy-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Shore Power
              </span>
              <span className="text-xs font-semibold text-white mt-0.5 block flex items-center gap-1">
                {focusedVessel.shore_power_equipped ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cold Iron Ready
                  </>
                ) : (
                  <span className="text-slate-400">Not Equipped</span>
                )}
              </span>
              <span className="text-[9px] text-slate-500">
                CO₂e: {focusedVessel.co2e_rate_t_day} t/day
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-navy-750/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Status:</span>
            <span className="text-cyan-brand font-medium truncate max-w-[200px]">
              {focusedVessel.status}
            </span>
          </div>

          <button
            onClick={() => setFocusedVessel(null)}
            className="w-full mt-2.5 py-1 text-[11px] text-slate-400 hover:text-white bg-navy-800/80 hover:bg-navy-700/80 rounded transition"
          >
            Close HUD
          </button>
        </div>
      )}

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-navy-900/90 backdrop-blur-md border border-navy-700/80 rounded-lg p-2.5 shadow-xl text-[10px] flex items-center gap-4 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-glow-emerald" />
          <span>Zero/Bio Fuel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-glow-cyan" />
          <span>LNG Transitional</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>VLSFO / MGO</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 border-t-2 border-dashed border-amber-400 inline-block" />
          <span>IMO ECA Zone</span>
        </div>
      </div>
    </div>
  );
};


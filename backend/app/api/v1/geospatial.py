"""
NaviQGreen Geospatial Maritime Digital Twin API
Serves international maritime corridors, live vessel telemetry, 
IMO Emission Control Areas (ECAs), and port shore-power infrastructure.
"""

from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/geospatial", tags=["Geospatial & Maritime Digital Twin"])

GLOBAL_PORTS = [
    {
        "code": "NLRTM",
        "name": "Port of Rotterdam",
        "country": "Netherlands",
        "lat": 51.95,
        "lng": 4.14,
        "type": "Deepwater Hub",
        "berths": 48,
        "shore_power": True,
        "grid_carbon_g_kwh": 245.0,
        "lng_bunkering": True,
        "bio_methanol_bunkering": True
    },
    {
        "code": "SGSIN",
        "name": "Port of Singapore",
        "country": "Singapore",
        "lat": 1.26,
        "lng": 103.82,
        "type": "Global Mega-Transshipment",
        "berths": 67,
        "shore_power": True,
        "grid_carbon_g_kwh": 390.0,
        "lng_bunkering": True,
        "bio_methanol_bunkering": True
    },
    {
        "code": "CNSHA",
        "name": "Port of Shanghai (Yangshan)",
        "country": "China",
        "lat": 31.39,
        "lng": 121.50,
        "type": "Primary Container Hub",
        "berths": 125,
        "shore_power": True,
        "grid_carbon_g_kwh": 540.0,
        "lng_bunkering": True,
        "bio_methanol_bunkering": False
    },
    {
        "code": "USHOU",
        "name": "Port of Houston",
        "country": "United States",
        "lat": 29.73,
        "lng": -95.27,
        "type": "Energy & Petrochemical Hub",
        "berths": 38,
        "shore_power": False,
        "grid_carbon_g_kwh": 420.0,
        "lng_bunkering": True,
        "bio_methanol_bunkering": True
    },
    {
        "code": "BEANR",
        "name": "Port of Antwerp-Bruges",
        "country": "Belgium",
        "lat": 51.28,
        "lng": 4.31,
        "type": "Multimodal Gateway",
        "berths": 52,
        "shore_power": True,
        "grid_carbon_g_kwh": 190.0,
        "lng_bunkering": True,
        "bio_methanol_bunkering": True
    },
    {
        "code": "AEJEA",
        "name": "Jebel Ali Port (Dubai)",
        "country": "United Arab Emirates",
        "lat": 24.99,
        "lng": 55.06,
        "type": "Middle East Transshipment",
        "berths": 44,
        "shore_power": False,
        "grid_carbon_g_kwh": 480.0,
        "lng_bunkering": True,
        "bio_methanol_bunkering": False
    }
]

GLOBAL_SHIPPING_CORRIDORS = [
    {
        "id": "corridor-asia-europe-suez",
        "name": "Asia-Europe Trunk via Suez Canal",
        "origin": "CNSHA",
        "destination": "NLRTM",
        "distance_nm": 10500,
        "avg_duration_days": 24.5,
        "eca_zones_crossed": ["North Sea / English Channel ECA"],
        "waypoints": [
            [31.39, 121.50],
            [25.00, 122.50],
            [15.00, 115.00],
            [4.50, 105.00],
            [1.26, 103.82],  # Singapore
            [4.50, 98.50],   # Malacca Strait
            [6.00, 85.00],   # Indian Ocean
            [10.00, 65.00],  # Arabian Sea
            [12.50, 47.00],  # Gulf of Aden
            [12.60, 43.30],  # Bab-el-Mandeb
            [20.00, 38.50],  # Red Sea
            [27.50, 34.00],
            [29.95, 32.55],  # Suez Canal
            [31.50, 32.30],
            [34.50, 24.00],  # Mediterranean Sea
            [36.50, 15.00],  # Strait of Sicily
            [37.00, 2.00],
            [36.00, -5.35],  # Strait of Gibraltar
            [43.00, -9.50],  # Cape Finisterre
            [48.00, -5.50],  # Ushant / English Channel
            [50.50, -0.50],
            [51.95, 4.14]    # Rotterdam
        ]
    },
    {
        "id": "corridor-asia-europe-cape",
        "name": "Asia-Europe Decarbonized via Cape of Good Hope",
        "origin": "SGSIN",
        "destination": "NLRTM",
        "distance_nm": 11800,
        "avg_duration_days": 28.0,
        "eca_zones_crossed": ["North Sea ECA"],
        "waypoints": [
            [1.26, 103.82],   # Singapore
            [-5.50, 104.00],  # Sunda Strait
            [-15.00, 90.00],  # South Indian Ocean
            [-25.00, 60.00],
            [-32.00, 35.00],
            [-34.80, 20.00],  # Cape of Good Hope
            [-33.00, 15.00],
            [-20.00, 5.00],   # South Atlantic
            [-5.00, -10.00],  # Equatorial Atlantic
            [15.00, -20.00],  # North Atlantic
            [30.00, -18.00],
            [42.00, -12.00],
            [48.50, -5.50],   # Ushant
            [50.50, 0.00],
            [51.95, 4.14]     # Rotterdam
        ]
    },
    {
        "id": "corridor-transatlantic-houston-antwerp",
        "name": "Transatlantic Industrial Corridor",
        "origin": "USHOU",
        "destination": "BEANR",
        "distance_nm": 4850,
        "avg_duration_days": 13.5,
        "eca_zones_crossed": ["North American Coastal ECA", "North Sea ECA"],
        "waypoints": [
            [29.73, -95.27],  # Houston
            [27.00, -90.00],  # Gulf of Mexico
            [24.50, -82.50],  # Florida Straits
            [26.00, -78.00],
            [33.00, -70.00],  # Atlantic Great Circle
            [40.00, -50.00],
            [46.00, -35.00],  # Mid-Atlantic
            [49.50, -15.00],
            [50.00, -4.50],   # English Channel entrance
            [51.20, 1.50],
            [51.28, 4.31]     # Antwerp
        ]
    },
    {
        "id": "corridor-mideast-singapore",
        "name": "Arabian Gulf to Southeast Asia Corridor",
        "origin": "AEJEA",
        "destination": "SGSIN",
        "distance_nm": 3600,
        "avg_duration_days": 10.2,
        "eca_zones_crossed": [],
        "waypoints": [
            [24.99, 55.06],   # Jebel Ali
            [26.20, 56.50],   # Strait of Hormuz
            [24.00, 59.00],   # Gulf of Oman
            [18.00, 65.00],   # Arabian Sea
            [9.00, 75.00],    # South Indian tip
            [5.80, 80.50],    # Sri Lanka South
            [4.00, 92.00],    # Andaman Sea
            [3.50, 99.00],    # Malacca Strait
            [1.26, 103.82]    # Singapore
        ]
    }
]

EMISSION_CONTROL_AREAS = [
    {
        "id": "eca-north-sea-baltic",
        "name": "North Sea & Baltic Sea SECA/ECA",
        "regulation": "IMO MARPOL Annex VI — 0.10% Sulfur Cap & Tier III NOx",
        "color": "#F59E0B",
        "fill_color": "rgba(245, 158, 11, 0.15)",
        "coordinates": [
            [62.0, 4.0],
            [58.0, 11.0],
            [56.0, 20.0],
            [60.0, 28.0],
            [65.0, 24.0],
            [58.0, 18.0],
            [54.0, 12.0],
            [51.0, 1.5],
            [48.5, -5.5],
            [51.5, -4.0],
            [56.0, -2.0],
            [60.0, -1.0],
            [62.0, 4.0]
        ]
    },
    {
        "id": "eca-north-america-atlantic",
        "name": "North American Coastal ECA (Atlantic & Gulf)",
        "regulation": "IMO MARPOL Annex VI — 200 nm Coastal Zone 0.10% Sulfur Limit",
        "color": "#EF4444",
        "fill_color": "rgba(239, 68, 68, 0.12)",
        "coordinates": [
            [45.0, -65.0],
            [40.0, -68.0],
            [33.0, -74.0],
            [25.0, -78.0],
            [23.0, -83.0],
            [26.0, -90.0],
            [28.0, -96.0],
            [30.5, -94.0],
            [30.0, -85.0],
            [32.0, -80.0],
            [38.0, -74.0],
            [44.0, -66.0],
            [45.0, -65.0]
        ]
    }
]

LIVE_FLEET_VESSELS = [
    {
        "id": "VES-001",
        "name": "NaviQ Polaris",
        "type": "Container (ULCV)",
        "dwt": 210000,
        "fuel_type": "LNG",
        "speed_knots": 18.4,
        "design_speed": 22.0,
        "lat": 16.50,
        "lng": 113.80,
        "heading": 215,
        "route_id": "corridor-asia-europe-suez",
        "origin": "CNSHA",
        "destination": "NLRTM",
        "eta_days": 18.2,
        "cargo_tonnes": 185000,
        "fuel_burn_mt_day": 82.4,
        "co2e_rate_t_day": 226.6,
        "cii_rating": "A",
        "shore_power_equipped": True,
        "status": "Underway (Optimal Cruise)"
    },
    {
        "id": "VES-002",
        "name": "Oceanic Aurora",
        "type": "Capesize Bulk Carrier",
        "dwt": 182000,
        "fuel_type": "VLSFO",
        "speed_knots": 12.6,
        "design_speed": 14.5,
        "lat": -33.50,
        "lng": 17.20,
        "heading": 325,
        "route_id": "corridor-asia-europe-cape",
        "origin": "SGSIN",
        "destination": "NLRTM",
        "eta_days": 12.4,
        "cargo_tonnes": 172000,
        "fuel_burn_mt_day": 36.2,
        "co2e_rate_t_day": 114.0,
        "cii_rating": "B",
        "shore_power_equipped": False,
        "status": "Underway (Slow Steaming)"
    },
    {
        "id": "VES-003",
        "name": "Verdant Pioneer",
        "type": "Chemical / Product Tanker",
        "dwt": 49999,
        "fuel_type": "Bio/e-Methanol",
        "speed_knots": 14.2,
        "design_speed": 15.0,
        "lat": 38.20,
        "lng": -52.40,
        "heading": 68,
        "route_id": "corridor-transatlantic-houston-antwerp",
        "origin": "USHOU",
        "destination": "BEANR",
        "eta_days": 6.8,
        "cargo_tonnes": 46500,
        "fuel_burn_mt_day": 38.5,
        "co2e_rate_t_day": 52.9,
        "cii_rating": "A",
        "shore_power_equipped": True,
        "status": "Underway (Low-Carbon Mode)"
    },
    {
        "id": "VES-004",
        "name": "Aegean Horizon",
        "type": "Aframax Crude Tanker",
        "dwt": 115000,
        "fuel_type": "LNG",
        "speed_knots": 13.8,
        "design_speed": 15.2,
        "lat": 13.40,
        "lng": 52.10,
        "heading": 265,
        "route_id": "corridor-asia-europe-suez",
        "origin": "CNSHA",
        "destination": "NLRTM",
        "eta_days": 9.5,
        "cargo_tonnes": 105000,
        "fuel_burn_mt_day": 44.1,
        "co2e_rate_t_day": 121.2,
        "cii_rating": "A",
        "shore_power_equipped": True,
        "status": "Entering Bab-el-Mandeb"
    },
    {
        "id": "VES-005",
        "name": "Nordic Zephyr",
        "type": "Handymax Bulk Carrier",
        "dwt": 58000,
        "fuel_type": "MGO",
        "speed_knots": 0.0,
        "design_speed": 14.0,
        "lat": 51.28,
        "lng": 4.31,
        "heading": 0,
        "route_id": "corridor-transatlantic-houston-antwerp",
        "origin": "USHOU",
        "destination": "BEANR",
        "eta_days": 0.0,
        "cargo_tonnes": 52000,
        "fuel_burn_mt_day": 0.0,
        "co2e_rate_t_day": 1.2,
        "cii_rating": "A",
        "shore_power_equipped": True,
        "status": "Moored (Cold Ironing Active — 0 kg/h Auxiliary Fuel)"
    },
    {
        "id": "VES-006",
        "name": "Quantum Express",
        "type": "Feeder Container",
        "dwt": 28000,
        "fuel_type": "Green Ammonia",
        "speed_knots": 15.1,
        "design_speed": 18.0,
        "lat": 3.20,
        "lng": 99.80,
        "heading": 135,
        "route_id": "corridor-mideast-singapore",
        "origin": "AEJEA",
        "destination": "SGSIN",
        "eta_days": 1.1,
        "cargo_tonnes": 24000,
        "fuel_burn_mt_day": 41.0,
        "co2e_rate_t_day": 0.0,
        "cii_rating": "A",
        "shore_power_equipped": True,
        "status": "Underway (Zero-Carbon Trial)"
    }
]


@router.get("/summary")
def get_geospatial_summary():
    """Returns high-level global maritime geospatial summary statistics."""
    total_vessels = len(LIVE_FLEET_VESSELS)
    active_corridors = len(GLOBAL_SHIPPING_CORRIDORS)
    active_ecas = len(EMISSION_CONTROL_AREAS)
    clean_fuel_count = sum(1 for v in LIVE_FLEET_VESSELS if v["fuel_type"] in ["LNG", "Bio/e-Methanol", "Green Ammonia"])
    shore_power_active = sum(1 for v in LIVE_FLEET_VESSELS if v["status"].startswith("Moored (Cold Ironing"))
    
    return {
        "status": "online",
        "total_monitored_vessels": total_vessels,
        "clean_alternative_fuel_vessels": clean_fuel_count,
        "clean_fuel_adoption_pct": round((clean_fuel_count / total_vessels) * 100, 1),
        "active_global_corridors": active_corridors,
        "designated_eca_zones": active_ecas,
        "shore_power_cold_ironing_active": shore_power_active,
        "total_tracked_tonnage": sum(v["dwt"] for v in LIVE_FLEET_VESSELS)
    }


@router.get("/corridors")
def get_shipping_corridors():
    """Returns all mapped global shipping corridors with waypoints."""
    return GLOBAL_SHIPPING_CORRIDORS


@router.get("/vessels")
def get_fleet_vessels():
    """Returns real-time digital twin locations and telemetry of fleet vessels."""
    return LIVE_FLEET_VESSELS


@router.get("/ecas")
def get_emission_control_areas():
    """Returns geographical boundaries and regulatory constraints for IMO ECAs."""
    return EMISSION_CONTROL_AREAS


@router.get("/ports")
def get_world_ports():
    """Returns key global port hubs with shore power grid infrastructure."""
    return GLOBAL_PORTS


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Crosshair, LocateFixed, Search } from "lucide-react";

export type MapSignal = {
  city: string;
  state: string;
  lat: number;
  lon: number;
  level: "high" | "medium" | "watch";
  label: string;
  scope: string;
  source: string;
  sourceUrl: string;
};

type OutbreakMapProps = {
  signals: MapSignal[];
};

function distanceMiles(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radius = 3958.8;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function OutbreakMap({ signals }: OutbreakMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [selected, setSelected] = useState<MapSignal | null>(signals[0] ?? null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(
    "Search a city or ZIP, or use your location. Patient addresses are never shown.",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-86.2, 38.8],
      zoom: 3.35,
      minZoom: 2.5,
      maxZoom: 12,
      attributionControl: false,
    });
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((marker) => marker.remove());
    markers.current = signals.map((signal) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `map-marker marker-${signal.level}`;
      element.setAttribute(
        "aria-label",
        `${signal.city}, ${signal.state}: ${signal.label}`,
      );
      element.addEventListener("click", () => {
        setSelected(signal);
        map.current?.flyTo({ center: [signal.lon, signal.lat], zoom: 6 });
      });
      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([signal.lon, signal.lat])
        .addTo(map.current!);
    });
  }, [signals]);

  const nearest = useMemo(() => {
    if (!selected) return [];
    return signals
      .map((signal) => ({
        ...signal,
        miles: distanceMiles(selected.lat, selected.lon, signal.lat, signal.lon),
      }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 3);
  }, [selected, signals]);

  function focusPoint(lat: number, lon: number, locationLabel: string) {
    const ranked = signals
      .map((signal) => ({
        signal,
        miles: distanceMiles(lat, lon, signal.lat, signal.lon),
      }))
      .sort((a, b) => a.miles - b.miles);
    const closest = ranked[0];
    if (closest) {
      setSelected(closest.signal);
      setStatus(
        `${locationLabel}: nearest listed public signal is ${closest.signal.city}, ${closest.signal.state} (${Math.round(closest.miles)} mi). No nearby marker does not mean no cases.`,
      );
    }
    map.current?.flyTo({ center: [lon, lat], zoom: 6.4 });
    new maplibregl.Marker({ color: "#f4f0e4" })
      .setLngLat([lon, lat])
      .setPopup(new maplibregl.Popup().setText("Approximate search location"))
      .addTo(map.current!)
      .togglePopup();
  }

  async function searchLocation(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setStatus("Looking up that location…");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&q=${encodeURIComponent(query.trim())}`,
      );
      if (!response.ok) throw new Error("Location lookup failed");
      const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (!results[0]) {
        setStatus("No U.S. location matched. Try a city and state or a five-digit ZIP.");
        return;
      }
      focusPoint(
        Number(results[0].lat),
        Number(results[0].lon),
        results[0].display_name.split(",").slice(0, 2).join(","),
      );
    } catch {
      setStatus("The location service is temporarily unavailable. The map is still usable.");
    } finally {
      setBusy(false);
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setStatus("Location is not available in this browser.");
      return;
    }
    setBusy(true);
    setStatus("Requesting your approximate location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        focusPoint(position.coords.latitude, position.coords.longitude, "Your location");
        setBusy(false);
      },
      () => {
        setStatus("Location permission was not granted. Search by city or ZIP instead.");
        setBusy(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="map-shell">
      <div className="map-toolbar">
        <form onSubmit={searchLocation} className="location-search" role="search">
          <Search size={17} aria-hidden="true" />
          <label className="sr-only" htmlFor="near-me-query">
            Search cases near me by city, state, or ZIP
          </label>
          <input
            id="near-me-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="City, state, or ZIP"
          />
          <button type="submit" disabled={busy}>
            Search
          </button>
        </form>
        <button className="locate-button" type="button" onClick={useLocation} disabled={busy}>
          <LocateFixed size={17} aria-hidden="true" />
          Use my location
        </button>
      </div>
      <p className="map-status" aria-live="polite">
        <Crosshair size={15} aria-hidden="true" /> {status}
      </p>
      <div className="map-canvas" ref={mapContainer} aria-label="Interactive U.S. outbreak signal map" />
      <div className="map-legend" aria-label="Map legend">
        <span><i className="legend-dot dot-high" /> Federal outbreak state</span>
        <span><i className="legend-dot dot-medium" /> Elevated state/local reporting</span>
        <span><i className="legend-dot dot-watch" /> Monitoring signal</span>
      </div>
      {selected && (
        <aside className="map-detail" aria-live="polite">
          <div>
            <span className={`severity severity-${selected.level}`}>{selected.level}</span>
            <p className="eyebrow">Nearest selected signal</p>
            <h3>{selected.city}, {selected.state}</h3>
            <p>{selected.label}</p>
          </div>
          <div className="map-detail-meta">
            <span>{selected.scope}</span>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
              {selected.source} ↗
            </a>
          </div>
          <div className="nearby-list">
            {nearest.map((signal) => (
              <button key={`${signal.city}-${signal.state}`} onClick={() => setSelected(signal)}>
                <span>{signal.city}, {signal.state}</span>
                <small>{Math.round(signal.miles)} mi from selected</small>
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

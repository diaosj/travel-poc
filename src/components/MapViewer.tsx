"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Itinerary, Stop, DayPlan } from "@/types/itinerary";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Kyushu bounds for initial view
const KYUSHU_BOUNDS: [[number, number], [number, number]] = [
  [129.4, 32.6], // SW corner
  [131.0, 33.7], // NE corner
];

const iconEmoji: Record<string, string> = {
  // specific icon field
  "plane-departure": "\uD83D\uDEEB",
  "plane-arrival": "\uD83D\uDEEC",
  "utensils": "\uD83C\uDF54",
  "bed": "\uD83D\uDECF\uFE0F",
  "flag": "\uD83D\uDEA9",
  "monument": "\uD83D\uDDFF",
  "fort": "\uD83C\uDFEF",
  "camera": "\uD83D\uDCF8",
  "shrine": "\u26E9\uFE0F",
  "memorial": "\uD83D\uDD4A\uFE0F",
  "temple": "\uD83D\uDED5",
  "cherry-blossom": "\uD83C\uDF38",
  // fallback by type
  transport: "\u2708\uFE0F",
  attraction: "\uD83D\uDCCD",
  food: "\uD83C\uDF5C",
  hotel: "\uD83C\uDFE8",
  station: "\uD83D\uDE89",
};

function getStopEmoji(stop: Stop): string {
  return iconEmoji[stop.icon || ""] || iconEmoji[stop.type] || "\uD83D\uDCCD";
}

function getRouteCoords(day: DayPlan): [number, number][] {
  return day.stops
    .filter((s) => s.coordinate.lat > 30)
    .map((s) => [s.coordinate.lng, s.coordinate.lat]);
}

export default function MapViewer({
  data,
  activeStopId,
  activeDayIndex,
  onMarkerClick,
}: {
  data: Itinerary;
  activeStopId: string | null;
  activeDayIndex: number | null;
  onMarkerClick: (stop: Stop) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      accessToken: MAPBOX_TOKEN,
      bounds: KYUSHU_BOUNDS,
      fitBoundsOptions: { padding: 60 },
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render markers and routes
  const renderMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clear route layers
    data.days.forEach((day) => {
      const lineId = `route-${day.dayIndex}`;
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getSource(lineId)) map.removeSource(lineId);
    });

    const visibleDays = activeDayIndex
      ? data.days.filter((d) => d.dayIndex === activeDayIndex)
      : data.days;

    visibleDays.forEach((day) => {
      const coords = getRouteCoords(day);
      const lineId = `route-${day.dayIndex}`;
      const isSoloDay = activeDayIndex === day.dayIndex;

      // Route line
      if (coords.length >= 2) {
        map.addSource(lineId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });
        map.addLayer({
          id: lineId,
          type: "line",
          source: lineId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": day.color,
            "line-width": isSoloDay ? 3.5 : 2.5,
            "line-opacity": isSoloDay ? 0.8 : 0.4,
            "line-dasharray": [4, 3],
          },
        });
      }

      // Markers
      day.stops.forEach((stop, stopIndex) => {
        if (stop.coordinate.lat < 30) return;

        const isActive = activeStopId === stop.id;
        const size = isActive ? 34 : 26;
        const emoji = getStopEmoji(stop);

        // Outer container — clean dimensions for Mapbox anchor calculation
        const el = document.createElement("div");
        el.style.cssText = `
          width: ${size}px; height: ${size}px;
          cursor: pointer;
        `;

        // Inner circle — all visual styling here
        const circle = document.createElement("div");
        circle.style.cssText = `
          width: 100%; height: 100%; border-radius: 50%;
          background: ${isActive ? day.color : "white"};
          border: 2.5px solid ${day.color};
          box-shadow: 0 2px 8px rgba(0,0,0,${isActive ? 0.3 : 0.15});
          display: flex; align-items: center; justify-content: center;
          font-size: ${isActive ? 15 : 12}px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          box-sizing: border-box;
        `;
        circle.textContent = emoji;

        // Order badge
        const badge = document.createElement("div");
        badge.style.cssText = `
          position: absolute; top: -4px; right: -4px;
          width: 14px; height: 14px; border-radius: 50%;
          background: ${day.color}; color: white;
          font-size: 8px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid white;
        `;
        badge.textContent = `${stopIndex + 1}`;
        circle.appendChild(badge);
        el.appendChild(circle);

        // Hover scales inner circle only — never touch el's transform
        el.addEventListener("mouseenter", () => {
          circle.style.transform = "scale(1.15)";
          circle.style.boxShadow = `0 2px 12px rgba(0,0,0,0.3)`;
        });
        el.addEventListener("mouseleave", () => {
          circle.style.transform = "scale(1)";
          circle.style.boxShadow = `0 2px 8px rgba(0,0,0,${isActive ? 0.3 : 0.15})`;
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([stop.coordinate.lng, stop.coordinate.lat])
          .addTo(map);

        marker.getElement().addEventListener("click", () => {
          onMarkerClick(stop);
        });
        marker.getElement().style.zIndex = `${isActive ? 100 : 10 + stopIndex}`;

        markersRef.current.push(marker);
      });
    });

    // Fit bounds when filtering by day
    if (activeDayIndex && visibleDays.length === 1) {
      const coords = getRouteCoords(visibleDays[0]);
      if (coords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 80, duration: 800 });
      }
    } else if (!activeDayIndex && !activeStopId) {
      map.fitBounds(KYUSHU_BOUNDS, { padding: 60, duration: 800 });
    }
  }, [data, mapReady, activeDayIndex, activeStopId, onMarkerClick]);

  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // Fly to active stop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !activeStopId) return;

    for (const day of data.days) {
      const stop = day.stops.find((s) => s.id === activeStopId);
      if (stop && stop.coordinate.lat > 30) {
        if (popupRef.current) popupRef.current.remove();

        map.flyTo({
          center: [stop.coordinate.lng, stop.coordinate.lat],
          zoom: 14,
          duration: 1000,
          essential: true,
        });

        const popup = new mapboxgl.Popup({
          offset: 22,
          closeButton: false,
          maxWidth: "260px",
          className: "custom-popup",
        })
          .setLngLat([stop.coordinate.lng, stop.coordinate.lat])
          .setHTML(
            `<div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px;">
              <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">${stop.name}</div>
              ${stop.nameJa ? `<div style="color: #999; font-size: 11px; margin-top: 1px;">${stop.nameJa}</div>` : ""}
              ${stop.time ? `<div style="color: ${day.color}; font-size: 12px; font-weight: 600; margin-top: 4px;">${stop.time}</div>` : ""}
              ${stop.description ? `<div style="color: #555; font-size: 11px; margin-top: 3px; line-height: 1.4;">${stop.description}</div>` : ""}
            </div>`
          )
          .addTo(map);

        popupRef.current = popup;
        break;
      }
    }
  }, [activeStopId, data, mapReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500 p-8 text-center">
        <div>
          <p className="text-lg font-semibold mb-2">Mapbox Token Required</p>
          <p className="text-sm">
            Add to <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">.env.local</code>:
          </p>
          <code className="block mt-2 bg-gray-200 p-3 rounded text-xs">
            NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
          </code>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className="h-full w-full" />;
}

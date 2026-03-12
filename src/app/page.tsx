"use client";

import { useState, useCallback } from "react";
import Timeline from "@/components/Timeline";
import MapViewer from "@/components/MapViewer";
import itineraryData from "@/data/kyushu-2026.json";
import type { Itinerary, Stop } from "@/types/itinerary";

const data = itineraryData as Itinerary;

export default function Home() {
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  const handleStopClick = useCallback((stop: Stop) => {
    setActiveStopId((prev) => (prev === stop.id ? null : stop.id));
  }, []);

  const handleDayClick = useCallback((dayIndex: number) => {
    setActiveDayIndex((prev) => (prev === dayIndex || dayIndex === 0 ? null : dayIndex));
    setActiveStopId(null);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left: Timeline */}
      <aside className="w-full md:w-[400px] lg:w-[440px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
        <Timeline
          data={data}
          activeStopId={activeStopId}
          activeDayIndex={activeDayIndex}
          onStopClick={handleStopClick}
          onDayClick={handleDayClick}
        />
      </aside>

      {/* Right: Map */}
      <main className="hidden md:block flex-1 relative">
        <MapViewer
          data={data}
          activeStopId={activeStopId}
          activeDayIndex={activeDayIndex}
          onMarkerClick={handleStopClick}
        />
      </main>

      {/* Mobile: Map toggle */}
      <MobileMapToggle
        data={data}
        activeStopId={activeStopId}
        activeDayIndex={activeDayIndex}
        onMarkerClick={handleStopClick}
      />
    </div>
  );
}

function MobileMapToggle({
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
  const [showMap, setShowMap] = useState(false);

  return (
    <>
      {showMap && (
        <div className="fixed inset-0 z-40 md:hidden">
          <MapViewer
            data={data}
            activeStopId={activeStopId}
            activeDayIndex={activeDayIndex}
            onMarkerClick={onMarkerClick}
          />
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-4 left-4 z-50 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium"
          >
            &larr; Timeline
          </button>
        </div>
      )}

      <button
        onClick={() => setShowMap(true)}
        className="fixed bottom-6 right-6 z-30 md:hidden bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-xl"
        aria-label="Show map"
      >
        \uD83D\uDDFA
      </button>
    </>
  );
}

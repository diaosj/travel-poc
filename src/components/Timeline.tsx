"use client";

import { useState, useMemo } from "react";
import type { Itinerary, Stop, DayPlan, Leg } from "@/types/itinerary";

const iconEmoji: Record<string, string> = {
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
  transport: "\u2708\uFE0F",
  attraction: "\uD83D\uDCCD",
  food: "\uD83C\uDF5C",
  hotel: "\uD83C\uDFE8",
  station: "\uD83D\uDE89",
};

function getStopEmoji(stop: { type: string; icon?: string }): string {
  return iconEmoji[stop.icon || ""] || iconEmoji[stop.type] || "\uD83D\uDCCD";
}

/** Extract numeric yen value from cost string like "¥4,220" or "~¥1,350" */
function extractYen(s: string): number {
  const m = s.match(/[¥￥]([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
}

function isRMB(s: string): boolean {
  return s.includes("RMB");
}

interface CostItem {
  label: string;
  amount: number;
  currency: "JPY" | "RMB";
  raw: string;
}

function collectDayCosts(day: DayPlan): { transport: CostItem[]; hotel: CostItem | null } {
  const transport: CostItem[] = day.legs
    .filter((l) => l.cost)
    .map((l) => ({
      label: l.transport.split(" ")[0],
      amount: extractYen(l.cost!),
      currency: isRMB(l.cost!) ? "RMB" as const : "JPY" as const,
      raw: l.cost!,
    }));

  const hotelStop = day.stops.find((s) => s.type === "hotel");
  let hotel: CostItem | null = null;
  if (hotelStop?.description) {
    const amount = extractYen(hotelStop.description);
    if (amount > 0) {
      hotel = {
        label: hotelStop.name,
        amount,
        currency: "JPY",
        raw: `\u00A5${amount.toLocaleString()}/\u665A`,
      };
    }
  }

  return { transport, hotel };
}

/* ─── Transport leg row (equal weight with stops) ─── */
function LegRow({ leg, color }: { leg: Leg; color: string }) {
  const verified = leg.verified === true;
  return (
    <div
      className={`flex items-center gap-1.5 py-[6px] px-1.5 rounded-md mx-0.5 ${
        verified ? "bg-emerald-50/60" : "bg-gray-50/80"
      }`}
    >
      {/* Spacer to align with stop time column */}
      <span className="w-11 shrink-0" />

      {/* Verification badge */}
      <div
        className={`w-[18px] h-[18px] shrink-0 rounded-full text-[9px] flex items-center justify-center font-bold ${
          verified
            ? "bg-emerald-500 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
        title={verified ? "\u5DF2\u786E\u8BA4" : "\u5F85\u786E\u8BA4"}
      >
        {verified ? "\u2713" : "?"}
      </div>

      {/* Transport info */}
      <div className="flex-1 min-w-0">
        <span className={`text-[12px] ${verified ? "text-gray-600" : "text-gray-500"}`}>
          {leg.transport}
          {leg.duration && (
            <span className="text-gray-400">{" \u00B7 "}{leg.duration}</span>
          )}
        </span>
      </div>

      {/* Cost */}
      {leg.cost && (
        <span className="text-[12px] font-semibold text-amber-600 whitespace-nowrap">
          {leg.cost}
        </span>
      )}
    </div>
  );
}

/* ─── Single stop row ─── */
function StopRow({
  stop,
  color,
  isActive,
  onClick,
}: {
  stop: Stop;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const emoji = getStopEmoji(stop);
  const isHotel = stop.type === "hotel";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-1.5 py-[6px] px-1.5 rounded-md cursor-pointer transition-all ${
        isActive
          ? "bg-white shadow-sm"
          : "hover:bg-gray-50/80"
      }`}
      style={
        isActive
          ? { boxShadow: `0 0 0 1.5px ${color}33, 0 2px 8px rgba(0,0,0,0.06)` }
          : undefined
      }
    >
      {/* Time */}
      <span className={`w-11 shrink-0 text-right text-[11px] font-mono pt-0.5 ${
        stop.time ? "text-gray-500 font-semibold" : ""
      }`}>
        {stop.time || ""}
      </span>

      {/* Dot */}
      <div
        className="w-[18px] h-[18px] shrink-0 rounded-full border-2 mt-[1px]"
        style={{
          borderColor: color,
          backgroundColor: isActive ? color : isHotel ? `${color}18` : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "9px", lineHeight: 1 }}>{emoji}</span>
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-[13px] leading-tight ${
              isActive ? "font-semibold text-gray-900" : "font-medium text-gray-700"
            } ${isHotel ? "text-blue-700" : ""}`}
          >
            {stop.name}
          </span>
          {stop.nameJa && (
            <span className="text-[10px] text-gray-300 truncate hidden sm:inline">
              {stop.nameJa}
            </span>
          )}
        </div>
        {stop.description && (
          <p className={`text-[11px] mt-0.5 leading-relaxed ${isHotel ? "text-blue-500" : "text-gray-400"}`}>
            {stop.description}
          </p>
        )}
      </div>
    </button>
  );
}

/* ─── Day cost summary ─── */
function DayCostSummary({ day }: { day: DayPlan }) {
  const { transport, hotel } = collectDayCosts(day);
  if (transport.length === 0 && !hotel) return null;

  const jpyTransport = transport.filter((c) => c.currency === "JPY");
  const rmbTransport = transport.filter((c) => c.currency === "RMB");
  const jpyTotal = jpyTransport.reduce((s, c) => s + c.amount, 0) + (hotel?.amount || 0);
  const rmbTotal = rmbTransport.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="mt-2 mx-1 pt-2 border-t border-dashed border-gray-200 text-[11px] space-y-0.5">
      {rmbTransport.length > 0 && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-8 shrink-0">交通</span>
          <span className="text-gray-500">
            {rmbTransport.map((c) => c.raw).join(" + ")}
          </span>
        </div>
      )}
      {jpyTransport.length > 0 && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-8 shrink-0">{rmbTransport.length > 0 ? "" : "交通"}</span>
          <span className="text-gray-500">
            {jpyTransport.map((c) => c.raw).join(" + ")}
          </span>
        </div>
      )}
      {hotel && (
        <div className="flex gap-2">
          <span className="text-gray-400 w-8 shrink-0">住宿</span>
          <span className="text-blue-500">{hotel.raw}</span>
        </div>
      )}
      <div className="flex gap-2 font-medium pt-0.5">
        <span className="text-gray-400 w-8 shrink-0">小计</span>
        <span className="text-gray-700">
          {rmbTotal > 0 && `\u00A5${rmbTotal.toLocaleString()} RMB`}
          {rmbTotal > 0 && jpyTotal > 0 && " + "}
          {jpyTotal > 0 && `\u00A5${jpyTotal.toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}

/* ─── Day section ─── */
function DaySection({
  day,
  activeStopId,
  onStopClick,
  onDayClick,
  isActiveDay,
}: {
  day: DayPlan;
  activeStopId: string | null;
  onStopClick: (stop: Stop) => void;
  onDayClick: (dayIndex: number) => void;
  isActiveDay: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-5">
      {/* Day header */}
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={() => onDayClick(day.dayIndex)}
          className={`flex items-center gap-2.5 flex-1 cursor-pointer rounded-lg px-2 py-1.5 transition-all ${
            isActiveDay ? "bg-gray-100" : "hover:bg-gray-50"
          }`}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: day.color }}
          >
            D{day.dayIndex}
          </div>
          <div className="text-left min-w-0 flex-1">
            <h3 className="font-semibold text-[13px] text-gray-900 truncate">
              {day.title}
            </h3>
            <p className="text-[11px] text-gray-400">
              {day.date} {day.weekday} &middot; {day.theme}
            </p>
          </div>
        </button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-300 hover:text-gray-500 text-xs px-1 cursor-pointer"
        >
          {isCollapsed ? "\u25B6" : "\u25BC"}
        </button>
      </div>

      {/* Stops + legs interleaved as equal rows */}
      {!isCollapsed && (
        <div className="space-y-[2px]">
          {day.stops.map((stop, i) => (
            <div key={stop.id} className="space-y-[2px]">
              {i > 0 && day.legs[i - 1] && (
                <LegRow leg={day.legs[i - 1]} color={day.color} />
              )}
              <StopRow
                stop={stop}
                color={day.color}
                isActive={activeStopId === stop.id}
                onClick={() => onStopClick(stop)}
              />
            </div>
          ))}
          <DayCostSummary day={day} />
        </div>
      )}
    </div>
  );
}

/* ─── Verification progress ─── */
function VerificationProgress({ data }: { data: Itinerary }) {
  const { verified, total } = useMemo(() => {
    let verified = 0;
    let total = 0;
    data.days.forEach((day) => {
      day.legs.forEach((leg) => {
        total++;
        if (leg.verified) verified++;
      });
    });
    return { verified, total };
  }, [data]);

  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const done = verified === total;

  return (
    <div className={`rounded-lg px-3 py-2 mb-3 text-[11px] ${done ? "bg-emerald-50" : "bg-amber-50"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold text-[12px] ${done ? "text-emerald-700" : "text-amber-700"}`}>
          {done ? "\u2705 行程已全部确认" : "\uD83D\uDD0D 行程确认进度"}
        </span>
        <span className={`font-mono font-bold ${done ? "text-emerald-600" : "text-amber-600"}`}>
          {verified}/{total}
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Trip cost overview ─── */
function TripCostOverview({ data }: { data: Itinerary }) {
  const totals = useMemo(() => {
    let jpyTransport = 0;
    let rmbTransport = 0;
    let jpyHotel = 0;

    data.days.forEach((day) => {
      const { transport, hotel } = collectDayCosts(day);
      transport.forEach((c) => {
        if (c.currency === "RMB") rmbTransport += c.amount;
        else jpyTransport += c.amount;
      });
      if (hotel) jpyHotel += hotel.amount;
    });

    return { jpyTransport, rmbTransport, jpyHotel };
  }, [data]);

  const { jpyTransport, rmbTransport, jpyHotel } = totals;
  const jpyTotal = jpyTransport + jpyHotel;

  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-3 text-[11px]">
      <div className="font-semibold text-[12px] text-gray-700 mb-1.5">
        费用概览
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        {rmbTransport > 0 && (
          <>
            <span className="text-gray-400">机票</span>
            <span className="text-gray-600 font-medium">
              &yen;{rmbTransport.toLocaleString()} RMB
            </span>
          </>
        )}
        <span className="text-gray-400">交通</span>
        <span className="text-gray-600 font-medium">
          &yen;{jpyTransport.toLocaleString()}
        </span>
        <span className="text-gray-400">住宿</span>
        <span className="text-blue-600 font-medium">
          &yen;{jpyHotel.toLocaleString()}
        </span>
        <span className="text-gray-500 font-semibold border-t border-gray-200 pt-1">
          合计
        </span>
        <span className="text-gray-800 font-bold border-t border-gray-200 pt-1">
          &yen;{rmbTransport.toLocaleString()} RMB + &yen;{jpyTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Timeline ─── */
export default function Timeline({
  data,
  activeStopId,
  activeDayIndex,
  onStopClick,
  onDayClick,
}: {
  data: Itinerary;
  activeStopId: string | null;
  activeDayIndex: number | null;
  onStopClick: (stop: Stop) => void;
  onDayClick: (dayIndex: number) => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">{data.title}</h1>
        <p className="text-xs text-gray-400 mt-1">
          {data.startDate} → {data.endDate} &middot; {data.region}
        </p>
        {/* Day filter pills */}
        <div className="flex gap-1.5 mt-3">
          {data.days.map((day) => (
            <button
              key={day.dayIndex}
              onClick={() => onDayClick(day.dayIndex)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${
                activeDayIndex === day.dayIndex
                  ? "text-white shadow-sm"
                  : "text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
              style={
                activeDayIndex === day.dayIndex
                  ? { backgroundColor: day.color }
                  : undefined
              }
            >
              D{day.dayIndex}
            </button>
          ))}
          {activeDayIndex && (
            <button
              onClick={() => onDayClick(0)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer text-gray-400 hover:text-gray-600"
            >
              All
            </button>
          )}
        </div>
      </div>

      {/* Verification progress */}
      <VerificationProgress data={data} />

      {/* Trip cost overview */}
      <TripCostOverview data={data} />

      {/* Days */}
      {data.days.map((day) => (
        <DaySection
          key={day.date}
          day={day}
          activeStopId={activeStopId}
          onStopClick={onStopClick}
          onDayClick={onDayClick}
          isActiveDay={activeDayIndex === day.dayIndex}
        />
      ))}
    </div>
  );
}

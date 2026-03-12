export interface Coordinate {
  lng: number;
  lat: number;
}

export interface Stop {
  id: string;
  name: string;
  nameJa?: string;
  coordinate: Coordinate;
  time?: string;
  description?: string;
  type: "transport" | "attraction" | "food" | "hotel" | "station";
  icon?: string;
}

export interface Leg {
  from: string; // stop id
  to: string; // stop id
  transport: string;
  duration?: string;
  cost?: string;
  note?: string;
  verified?: boolean;
}

export interface DayPlan {
  date: string;
  dayIndex: number;
  weekday: string;
  title: string;
  theme: string;
  color: string;
  stops: Stop[];
  legs: Leg[];
}

export interface Itinerary {
  title: string;
  startDate: string;
  endDate: string;
  region: string;
  days: DayPlan[];
}

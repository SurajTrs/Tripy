// lib/memoryStore.ts

import { TripPlanData } from '../types';

let lastPlannedTrip: TripPlanData | null = null;

export const getLastTrip = (): TripPlanData | null => lastPlannedTrip;
export const setLastTrip = (trip: TripPlanData): void => {
  lastPlannedTrip = trip;
};

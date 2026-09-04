import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Auto-scale energy: kWh → MWh → GWh → TWh
export function formatEnergy(kwh: number): { value: string; unit: string } {
  const abs = Math.abs(kwh);
  if (abs >= 1_000_000_000) return { value: (kwh / 1_000_000_000).toFixed(2), unit: 'TWh' };
  if (abs >= 1_000_000)     return { value: (kwh / 1_000_000).toFixed(2),     unit: 'GWh' };
  if (abs >= 1_000)         return { value: (kwh / 1_000).toFixed(2),         unit: 'MWh' };
  return                           { value: kwh.toFixed(2),                    unit: 'kWh' };
}

// Auto-scale power: kW → MW → GW
export function formatPower(kw: number): { value: string; unit: string } {
  const abs = Math.abs(kw);
  if (abs >= 1_000_000) return { value: (kw / 1_000_000).toFixed(2), unit: 'GW' };
  if (abs >= 1_000)     return { value: (kw / 1_000).toFixed(2),     unit: 'MW' };
  return                       { value: kw.toFixed(1),                unit: 'kW' };
}

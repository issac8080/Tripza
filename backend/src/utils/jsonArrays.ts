import { VehicleType } from "../domain/enums";

const vehicleTypeValues = new Set<string>(Object.values(VehicleType));

export function parseVehicleTypesJson(value: unknown): VehicleType[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is VehicleType => typeof v === "string" && vehicleTypeValues.has(v));
}

export function toVehicleTypesJson(types: VehicleType[]): unknown {
  return types;
}

export function parseStringArrayJson(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is string => typeof v === "string");
}

export function toStringArrayJson(items: string[]): unknown {
  return items;
}

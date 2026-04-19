import type { VehicleRow } from "../firestore/vehicles";
import { moneyToString } from "./money";

function optionalMoney(n: number): string | null {
  if (n === 0 || Number.isNaN(n)) {
    return null;
  }
  return moneyToString(n);
}

export function serializeVehicle(vehicle: VehicleRow) {
  return {
    id: vehicle.id,
    providerId: vehicle.providerId,
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    seatingCapacity: vehicle.seatingCapacity,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    ac: vehicle.ac,
    musicSystem: vehicle.musicSystem,
    luxuryLevel: vehicle.luxuryLevel,
    driverIncluded: vehicle.driverIncluded,
    selfDriveAllowed: vehicle.selfDriveAllowed,
    baseAddress: vehicle.baseAddress,
    serviceAreas: vehicle.serviceAreas,
    baseLat: vehicle.baseLat,
    baseLng: vehicle.baseLng,
    pricePerKm: optionalMoney(vehicle.pricePerKm),
    pricePerDay: optionalMoney(vehicle.pricePerDay),
    minimumCharge: optionalMoney(vehicle.minimumCharge),
    contactPhone: vehicle.contactPhone,
    status: vehicle.status,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    images: vehicle.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
  };
}

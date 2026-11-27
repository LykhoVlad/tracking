export const SIM_CONFIG = {
  seed: 7,
  vehicleCount: 12,
  stepSec: 1,

  cruiseSpeedKmh: [35, 55], // Every driver has their own “usual” speed
  accelKmhPerSec: 8, // acceleration
  brakeKmhPerSec: 15, // braking is more abrupt than acceleration
  approachSlowdownKm: 0.15, // 150 meters before the end of the route—slow down
  approachSpeedKmh: 15,

  idleSec: [30, 120], // loading at the depot
  deliverySec: [60, 180], // delivery to the address
  initialStaggerSec: [5, 90], // so that not everyone leaves at the same time

  trafficStop: { chancePerSec: 0.01, durationSec: [10, 45] },
  speeding: { chancePerSec: 0.002, speedKmh: [85, 110], durationSec: [15, 40] },
  signalLoss: { chancePerSec: 0.0008, durationSec: [20, 90] },

  gpsNoiseMeters: 4, // GPS errors
} as const;

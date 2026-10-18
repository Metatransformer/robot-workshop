export type SupplierLink = {
  name: string;
  manufacturer: string;
  model: string;
  seller: string;
  sku?: string;
  url: string;
  checkedAt: string;
  selectionNotes: string[];
  catalogItemId?: string;
};

export const supplierLinks: Record<string, SupplierLink> = {
  originalPico: {
    name: "Raspberry Pi Pico",
    manufacturer: "Raspberry Pi",
    model: "Pico",
    seller: "Raspberry Pi",
    url: "https://www.raspberrypi.com/products/raspberry-pi-pico/",
    checkedAt: "2026-10-18",
    catalogItemId: "raspberry-pi-pico",
    selectionNotes: [
      "The sensor starter targets the original non-wireless Pico. Pico H adds fitted headers; confirm its firmware target. Pico W and Pico 2 require a separate firmware/pin review, not a silent substitution.",
      "Confirm header population, Micro-USB data cable, logic voltage, and power arrangement against the exact board before wiring.",
    ],
  },
  Pi5: {
    name: "Raspberry Pi 5",
    manufacturer: "Raspberry Pi",
    model: "5",
    seller: "Raspberry Pi",
    url: "https://www.raspberrypi.com/products/raspberry-pi-5/",
    checkedAt: "2026-10-18",
    catalogItemId: "raspberry-pi-5",
    selectionNotes: [
      "Select the RAM variant deliberately; storage is separate.",
      "Power supply, cooling, case, display cable, storage, and peripherals are separate compatibility decisions.",
    ],
  },
  BME2802652: {
    name: "Adafruit BME280 breakout",
    manufacturer: "Adafruit",
    model: "BME280 breakout",
    seller: "Adafruit",
    sku: "2652",
    url: "https://www.adafruit.com/product/2652",
    checkedAt: "2026-10-18",
    catalogItemId: "adafruit-bme280",
    selectionNotes: [
      "This is the Adafruit breakout board, not a bare BME280 sensor or a similarly named BMP280 board.",
      "Confirm supply voltage, I²C or SPI wiring, fitted headers, address, and environmental placement before use.",
    ],
  },
  SG92R169: {
    name: "TowerPro SG92R micro servo",
    manufacturer: "TowerPro",
    model: "SG92R",
    seller: "Adafruit",
    sku: "169",
    url: "https://www.adafruit.com/product/169",
    checkedAt: "2026-10-18",
    catalogItemId: "adafruit-sg92r",
    selectionNotes: [
      "Confirm the actual servo label, connector order, travel, horn fit, load, and current demand before connecting it.",
      "A controller signal pin is not a servo power source; choose and validate the power path separately.",
    ],
  },
  fan3368: {
    name: "Adafruit miniature 5 V cooling fan",
    manufacturer: "Adafruit",
    model: "Miniature 5 V cooling fan",
    seller: "Adafruit",
    sku: "3368",
    url: "https://www.adafruit.com/product/3368",
    checkedAt: "2026-10-18",
    selectionNotes: [
      "The supplier describes a 5 V, 0.2 A cooling fan; it is a candidate for a guarded airflow observation, not a vacuum blower.",
      "Confirm connector, polarity, guarding, supply capacity, and switching method for the exact fan before use.",
    ],
  },
  "DRV8833-3297": {
    name: "Adafruit DRV8833 DC/stepper motor driver breakout",
    manufacturer: "Adafruit",
    model: "DRV8833 breakout",
    seller: "Adafruit",
    sku: "3297",
    url: "https://www.adafruit.com/product/3297",
    checkedAt: "2026-10-18",
    selectionNotes: [
      "Match motor type, supply range, brushed-motor stall current, wiring, and thermal duty to the documented board limits.",
      "This candidate driver does not automatically control a two-wire brushless cooling fan and is not electrically qualified for a project by appearing here.",
    ],
  },
  OLED326: {
    name: "Adafruit 128 × 64 monochrome OLED breakout",
    manufacturer: "Adafruit",
    model: "128 × 64 monochrome OLED breakout",
    seller: "Adafruit",
    sku: "326",
    url: "https://www.adafruit.com/product/326",
    checkedAt: "2026-10-18",
    selectionNotes: [
      "Confirm the current board revision, interface selection, logic and supply requirements, address, and pin labels.",
      "Headers, cable, and controller are separate; this candidate does not enter a project or the global catalog automatically.",
    ],
  },
  FS902818: {
    name: "FEETECH FS90 micro servo",
    manufacturer: "FEETECH",
    model: "FS90",
    seller: "Pololu",
    sku: "2818",
    url: "https://www.pololu.com/product/2818",
    checkedAt: "2026-10-18",
    catalogItemId: "feetech-fs90",
    selectionNotes: [
      "Select the positional FS90, not the FS90R continuous-rotation variant; confirm the received label, connector order, horn fit, and revision before connection.",
      "Pololu explicitly documents 3.3 V and 5 V control compatibility. Available current figures conflict and are not a guaranteed limit, so begin unloaded and record supply behavior without deliberately stalling the servo.",
    ],
  },
  servoSupply276: {
    name: "5 V 2 A switching power supply",
    manufacturer: "Adafruit",
    model: "5 V 2 A switching power supply",
    seller: "Adafruit",
    sku: "276",
    url: "https://www.adafruit.com/product/276",
    checkedAt: "2026-10-18",
    catalogItemId: "servo-supply-5v",
    selectionNotes: [
      "The supplier describes a regulated 5 V, up-to-2 A, positive-tip 5.5 mm OD / 2.1 mm ID barrel supply; verify actual output and polarity before connection.",
      "This selection provides planning headroom but does not prove servo current limits, transient performance, assembly quality, or regional suitability.",
    ],
  },
  servoPowerAdapter368: {
    name: "2.1 mm female DC power adapter",
    manufacturer: "Adafruit",
    model: "2.1 mm female barrel-to-screw adapter",
    seller: "Adafruit",
    sku: "368",
    url: "https://www.adafruit.com/product/368",
    checkedAt: "2026-10-18",
    catalogItemId: "servo-power-adapter",
    selectionNotes: [
      "Match the 2.1 mm positive-tip supply and verify the adapter's marked terminals with the actual parts before wiring.",
      "Clamp properly stripped conductors and check retention; do not clamp loose Dupont pins or treat the adapter as a completed power harness.",
    ],
  },
  servoButton1119: {
    name: "12 mm square, 6 mm tall tactile button 10-pack",
    manufacturer: "Adafruit",
    model: "12 mm square, 6 mm tall tactile button",
    seller: "Adafruit",
    sku: "1119",
    url: "https://www.adafruit.com/product/1119",
    checkedAt: "2026-10-18",
    catalogItemId: "servo-button-pack",
    selectionNotes: [
      "The package contains ten buttons; the FS90 bench uses one, and the remaining buttons are not build quantity.",
      "Identify the two internally connected leg pairs by unpowered continuity before breadboard placement instead of relying on orientation alone.",
    ],
  },
  servoCable5515: {
    name: "Servo extension to male jumper adapter",
    manufacturer: "Adafruit",
    model: "Shrouded servo-to-three-male-jumper adapter",
    seller: "Adafruit",
    sku: "5515",
    url: "https://www.adafruit.com/product/5515",
    checkedAt: "2026-10-18",
    catalogItemId: "servo-cable-adapter",
    selectionNotes: [
      "Confirm the shrouded connector matches the FS90 lead and trace signal, positive, and ground from labels rather than trusting color alone.",
      "Keep the signal male pin for logic; prepare the adapter's power leads for the screw clamp exactly as the guide directs. Do not cut the servo's original lead or treat this as plug-and-play power wiring.",
    ],
  },
};

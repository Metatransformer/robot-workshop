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
};

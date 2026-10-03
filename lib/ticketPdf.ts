import { formatMoney, getActiveMarketId } from "../data/markets.js";
import { formatDuration } from "./resultsHelpers.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 32;
const CONTENT_W = PAGE_WIDTH - MARGIN * 2;

export type TicketEndpoint = {
  city: string;
  code: string;
  time: string;
  date: string;
};

export type TicketPassenger = {
  index: number;
  name: string;
  type: string;
  gender: string;
  seatMeal: string;
};

export type TicketFare = {
  base: string;
  taxes: string;
  fee: string;
  extras: string | null;
  discount: string | null;
  total: string;
};

export type TicketDocument = {
  filename: string;
  reference: string;
  status: string;
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  service: string;
  contact: {
    email: string;
    phone: string;
  };
  flight: {
    airline: string;
    airlineCode: string;
    flightNumber: string;
    cabin: string;
    fareLabel: string;
    baggage: string;
    cabinKg: number;
    checkinKg: number;
    duration: string;
    stops: string;
    from: TicketEndpoint;
    to: TicketEndpoint;
  };
  hotel: {
    name: string;
    address: string;
    checkIn: string;
    checkOut: string;
    room: string;
  };
  bus: {
    operator: string;
    from: string;
    to: string;
    date: string;
    seats: string;
  };
  passengers: TicketPassenger[];
  fare: TicketFare;
  bookedAt: string;
};

type BookingLike = {
  service?: string;
  reference?: string;
  airline?: string;
  title?: string;
  searchQuery?: Record<string, unknown>;
  selectedFare?: {
    cabin?: string;
    label?: string;
    baggage?: string;
    cabinKg?: number | null;
    checkinKg?: number | null;
  } | null;
  payable?: Record<string, unknown>;
  travellers?: unknown;
  contact?: { email?: string; phone?: string };
  selectedSeat?: string | string[];
  createdAt?: string;
  bookedAtLocal?: string;
};

type CatalogLike = {
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  cabin?: string;
  baggage?: string;
  cabinKg?: number | null;
  checkinKg?: number | null;
  durationMinutes?: number;
  stops?: number;
  stopLabel?: string;
  selectedFareLabel?: string;
  selectedFare?: BookingLike["selectedFare"];
  from?: Partial<TicketEndpoint> & { city?: string; code?: string; time?: string; date?: string };
  to?: Partial<TicketEndpoint> & { city?: string; code?: string; time?: string; date?: string };
  name?: string;
  address?: string;
  location?: string;
  roomType?: string;
  operator?: string;
};

function sanitize(value: unknown) {
  return String(value ?? "")
    .replaceAll("₹", "INR ")
    .replaceAll("→", " - ")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("·", " | ")
    .replaceAll("•", "*")
    .replaceAll("✓", "OK")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfEscape(value: unknown) {
  return sanitize(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Approximate Helvetica glyph width for clipping. */
function approxWidth(value: string, fontSize: number) {
  return sanitize(value).length * fontSize * 0.52;
}

function clipToWidth(value: unknown, maxWidth: number, fontSize: number) {
  const raw = sanitize(value);
  if (!raw) return "-";
  if (approxWidth(raw, fontSize) <= maxWidth) return raw;
  const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * 0.52)) - 1);
  return `${raw.slice(0, maxChars)}...`;
}

function wrapLines(value: unknown, maxWidth: number, fontSize: number, maxLines = 8) {
  const words = sanitize(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (approxWidth(next, fontSize) <= maxWidth) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = clipToWidth(word, maxWidth, fontSize);
  });
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = clipToWidth(clipped[maxLines - 1], maxWidth, fontSize);
  return clipped;
}

function prettyDate(value: unknown) {
  const raw = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return sanitize(value) || "-";
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function money(amount: unknown, currency: string) {
  if (amount == null || amount === "") return "-";
  const number = Number(amount);
  if (!Number.isFinite(number)) return sanitize(amount);
  return sanitize(formatMoney(number, getActiveMarketId(), currency || "INR"));
}

function personRows(travellers: unknown): TicketPassenger[] {
  if (!travellers) return [];
  let list: Record<string, unknown>[] = [];
  if (Array.isArray(travellers)) {
    list = travellers as Record<string, unknown>[];
  } else if (travellers && typeof travellers === "object") {
    const group = travellers as { lead?: Record<string, unknown>; additional?: Record<string, unknown>[] };
    list = [group.lead, ...(group.additional || [])].filter(Boolean) as Record<string, unknown>[];
  }
  return list.map((person, index) => {
    const name = [person.title, person.firstName, person.lastName].filter(Boolean).join(" ");
    const type = String(person.type || "adult").replace(/^\w/, (c) => c.toUpperCase());
    const gender = person.gender
      ? String(person.gender).replace(/^\w/, (c) => c.toUpperCase())
      : "-";
    const seat = person.seat ? String(person.seat) : "-";
    const meal = person.meal
      ? String(person.meal)
      : person.meals
        ? "Included"
        : "-";
    return {
      index: index + 1,
      name: name || `Passenger ${index + 1}`,
      type,
      gender,
      seatMeal: seat === "-" && meal === "-" ? "-" : `${seat} / ${meal}`,
    };
  });
}

function hashSeed(value: unknown) {
  let h = 2166136261;
  const text = String(value || "APL");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function verificationMatrix(seedText: unknown, size = 21) {
  const seed = hashSeed(seedText);
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  function placeFinder(ox: number, oy: number) {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[oy + y][ox + x] = edge || core ? 1 : 0;
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);
  let bit = seed;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inFinder =
        (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
      if (inFinder) continue;
      bit = (Math.imul(bit, 1664525) + 1013904223) >>> 0;
      matrix[y][x] = bit & 1;
    }
  }
  return matrix;
}

const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  " ": "nwwnnnwnn",
  "*": "nwnnwnwnn",
};

function barcodePattern(value: unknown) {
  const raw = sanitize(value)
    .toUpperCase()
    .replace(/[^A-Z0-9\- ]/g, "")
    .slice(0, 18);
  const payload = `*${raw || "APL"}*`;
  const units: number[] = [];
  for (const ch of payload) {
    const pattern = CODE39[ch] || CODE39["-"];
    for (const mark of pattern) {
      units.push(mark === "w" ? 2 : 1);
    }
    units.push(1);
  }
  return units;
}

function text(font: string, size: number, x: number, y: number, value: unknown, color = "0 0 0") {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(value)}) Tj ET`;
}

function textInBox(
  font: string,
  size: number,
  x: number,
  y: number,
  value: unknown,
  maxWidth: number,
  color = "0 0 0",
) {
  return text(font, size, x, y, clipToWidth(value, maxWidth, size), color);
}

function rect(x: number, y: number, w: number, h: number, fill: string) {
  return `${fill} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;
}

function strokeRect(x: number, y: number, w: number, h: number, color = "0.78 0.86 0.9", width = 1) {
  return `${color} RG ${width} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`;
}

function line(x1: number, y1: number, x2: number, y2: number, color = "0.78 0.86 0.9", width = 1) {
  return `${color} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function circleFill(cx: number, cy: number, r: number, fill: string) {
  const k = 0.5522847498 * r;
  return [
    `${fill} rg`,
    `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + r).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx + k).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx - k).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - r).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx - k).toFixed(2)} ${(cy - r).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} c`,
    `${(cx + k).toFixed(2)} ${(cy - r).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c`,
    "f",
  ].join("\n");
}

export function ticketFromBooking(booking: BookingLike, catalog?: CatalogLike | null): TicketDocument {
  const service = booking?.service || "flight";
  const query = booking?.searchQuery || {};
  const fare = booking?.selectedFare || catalog?.selectedFare || null;
  const payable = booking?.payable || {};
  const currency = String(payable.currency || "INR");
  const people = personRows(booking?.travellers);
  const from = catalog?.from || {};
  const to = catalog?.to || {};

  return {
    filename: `APL-E-Ticket-${sanitize(booking?.reference || "booking") || "booking"}.pdf`,
    reference: String(booking?.reference || "-"),
    status: "CONFIRMED / TICKETED - ONLINE",
    company: {
      name: "APL Travel",
      address: "123, Noida, Uttar Pradesh, India - 201301",
      email: "hello@apltravel.com",
      phone: "+91 120 456 7890",
    },
    service,
    contact: {
      email: booking?.contact?.email || "-",
      phone: booking?.contact?.phone || "-",
    },
    flight: {
      airline: catalog?.airline || booking?.airline || "-",
      airlineCode: catalog?.airlineCode || "-",
      flightNumber:
        catalog?.flightNumber ||
        `${catalog?.airlineCode || "APL"}-${String(booking?.reference || "").slice(-4)}`,
      cabin: fare?.cabin || catalog?.cabin || "Economy",
      fareLabel: fare?.label || catalog?.selectedFareLabel || "Standard",
      baggage: fare?.baggage || catalog?.baggage || "As per fare",
      cabinKg: Number(fare?.cabinKg ?? catalog?.cabinKg ?? 7),
      checkinKg: Number(fare?.checkinKg ?? catalog?.checkinKg ?? 15),
      duration: formatDuration(catalog?.durationMinutes || 0),
      stops: catalog?.stops === 0 ? "Non-stop" : catalog?.stopLabel || "Stops as per itinerary",
      from: {
        city: String(from.city || query.from || "-"),
        code: String(from.code || "-"),
        time: String(from.time || "-"),
        date: prettyDate(from.date || query.depart),
      },
      to: {
        city: String(to.city || query.to || "-"),
        code: String(to.code || "-"),
        time: String(to.time || "-"),
        date: prettyDate(to.date || query.depart),
      },
    },
    hotel: {
      name: catalog?.name || booking?.title || "-",
      address: catalog?.address || catalog?.location || "-",
      checkIn: prettyDate(query.checkIn),
      checkOut: prettyDate(query.checkOut),
      room: catalog?.roomType || "-",
    },
    bus: {
      operator: catalog?.operator || "-",
      from: String(catalog?.from?.city || query.from || "-"),
      to: String(catalog?.to?.city || query.to || "-"),
      date: prettyDate(query.date),
      seats: Array.isArray(booking?.selectedSeat)
        ? booking.selectedSeat.join(", ")
        : String(booking?.selectedSeat || "-"),
    },
    passengers: people,
    fare: {
      base: String(payable.baseLabel || money(payable.base, currency)),
      taxes: String(payable.taxesLabel || money(payable.taxes, currency)),
      fee: String(payable.serviceFeeLabel || money(payable.serviceFee, currency)),
      extras: Number(payable.extras) > 0 ? String(payable.extrasLabel || "") : null,
      discount: Number(payable.discount) > 0 ? String(payable.discountLabel || "") : null,
      total: String(payable.totalPayableLabel || money(payable.totalPayable, currency)),
    },
    bookedAt: booking?.createdAt || booking?.bookedAtLocal || new Date().toISOString(),
  };
}

function drawBarcode(commands: string[], x: number, y: number, width: number, height: number, value: unknown) {
  const units = barcodePattern(value);
  const unitCount = units.reduce((sum, n) => sum + n, 0) || 1;
  const unitW = width / unitCount;
  let cursor = x;
  let bar = true;
  units.forEach((unit) => {
    const w = unit * unitW;
    if (bar) commands.push(rect(cursor, y, w, height, "0.05 0.11 0.14"));
    cursor += w;
    bar = !bar;
  });
}

function drawQr(commands: string[], x: number, y: number, size: number, value: unknown) {
  const matrix = verificationMatrix(value, 21);
  const cell = size / matrix.length;
  commands.push(rect(x - 2, y - 2, size + 4, size + 4, "1 1 1"));
  commands.push(strokeRect(x - 2, y - 2, size + 4, size + 4, "0.78 0.86 0.9", 1));
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix.length; col += 1) {
      if (!matrix[row][col]) continue;
      commands.push(
        rect(
          x + col * cell,
          y + (matrix.length - 1 - row) * cell,
          cell,
          cell,
          "0.05 0.11 0.14",
        ),
      );
    }
  }
}

export function buildTicketPdfBytes(doc: TicketDocument) {
  const commands: string[] = [];
  const brand = "0.055 0.455 0.565";
  const brandDeep = "0.043 0.31 0.376";
  const muted = "0.35 0.42 0.47";
  const ink = "0.05 0.11 0.14";
  const emerald = "0.02 0.55 0.4";
  const lineSoft = "0.84 0.9 0.93";
  const company = doc.company || {
    name: "APL Travel",
    address: "123, Noida, Uttar Pradesh, India - 201301",
    email: "hello@apltravel.com",
    phone: "+91 120 456 7890",
  };

  // ── Header band (fixed 88pt) ─────────────────────────────────────
  const headerH = 88;
  commands.push(rect(0, PAGE_HEIGHT - headerH, PAGE_WIDTH, headerH, brandDeep));
  commands.push(circleFill(MARGIN + 22, PAGE_HEIGHT - 44, 20, "1 1 1"));
  commands.push(text("F2", 10, MARGIN + 10, PAGE_HEIGHT - 48, "APL", brandDeep));
  commands.push(text("F2", 16, MARGIN + 52, PAGE_HEIGHT - 38, "APL Travel", "1 1 1"));
  commands.push(
    text("F1", 8, MARGIN + 52, PAGE_HEIGHT - 54, "Electronic Ticket / Itinerary Receipt", "0.85 0.95 0.97"),
  );

  const companyX = 330;
  const companyW = PAGE_WIDTH - companyX - MARGIN;
  commands.push(textInBox("F2", 10, companyX, PAGE_HEIGHT - 30, company.name, companyW, "1 1 1"));
  commands.push(textInBox("F1", 7.5, companyX, PAGE_HEIGHT - 44, company.address, companyW, "0.85 0.95 0.97"));
  commands.push(textInBox("F1", 7.5, companyX, PAGE_HEIGHT - 56, company.email, companyW, "0.85 0.95 0.97"));
  commands.push(
    textInBox("F2", 9, companyX, PAGE_HEIGHT - 70, `PNR / Booking: ${doc.reference || "-"}`, companyW, "1 1 1"),
  );

  let y = PAGE_HEIGHT - headerH - 16;

  // ── Verification + status (fixed height) ─────────────────────────
  const verifyH = 96;
  const verifyLeftW = 300;
  commands.push(rect(MARGIN, y - verifyH, CONTENT_W, verifyH, "0.97 0.99 1"));
  commands.push(strokeRect(MARGIN, y - verifyH, CONTENT_W, verifyH, lineSoft, 1));

  commands.push(rect(MARGIN + 12, y - 28, 210, 16, "0.86 0.98 0.93"));
  commands.push(
    textInBox("F2", 7.5, MARGIN + 18, y - 23, doc.status || "CONFIRMED", 198, emerald),
  );
  commands.push(text("F1", 7.5, MARGIN + 12, y - 44, "Support phone", muted));
  commands.push(textInBox("F2", 9, MARGIN + 12, y - 58, company.phone || "", verifyLeftW - 24, ink));
  commands.push(textInBox("F1", 7.5, MARGIN + 12, y - 72, company.email || "", verifyLeftW - 24, muted));

  const qrSize = 58;
  const qrX = MARGIN + verifyLeftW + 18;
  const qrY = y - 78;
  drawQr(commands, qrX, qrY, qrSize, doc.reference || "APL");
  commands.push(text("F1", 6.5, qrX, y - 88, "Verification QR", muted));

  const barcodeX = qrX + qrSize + 14;
  const barcodeW = Math.max(80, MARGIN + CONTENT_W - barcodeX - 8);
  drawBarcode(commands, barcodeX, y - 52, barcodeW, 24, doc.reference || "APL");
  commands.push(
    textInBox("F1", 7, barcodeX, y - 66, `PNR barcode · ${doc.reference || "-"}`, barcodeW, muted),
  );
  commands.push(textInBox("F2", 8, barcodeX, y - 24, "Scan to verify", barcodeW, brandDeep));

  y -= verifyH + 14;

  // ── Flight itinerary (3 equal columns + baggage bar) ─────────────
  if (doc.service === "flight") {
    const flight = doc.flight || ({} as TicketDocument["flight"]);
    const cardH = 132;
    const colW = CONTENT_W / 3;
    commands.push(rect(MARGIN, y - cardH, CONTENT_W, cardH, "1 1 1"));
    commands.push(strokeRect(MARGIN, y - cardH, CONTENT_W, cardH, brand, 1.25));
    commands.push(line(MARGIN + colW, y - 14, MARGIN + colW, y - cardH + 28, lineSoft, 0.8));
    commands.push(line(MARGIN + colW * 2, y - 14, MARGIN + colW * 2, y - cardH + 28, lineSoft, 0.8));

    commands.push(text("F2", 8, MARGIN + 10, y - 14, "FLIGHT ITINERARY", brandDeep));

    // Departure
    const c1 = MARGIN + 10;
    commands.push(textInBox("F2", 14, c1, y - 36, flight.from?.time || "-", colW - 20, ink));
    commands.push(textInBox("F2", 10, c1, y - 52, flight.from?.city || "-", colW - 20, brandDeep));
    commands.push(textInBox("F1", 8, c1, y - 66, flight.from?.code || "-", colW - 20, muted));
    commands.push(textInBox("F1", 8, c1, y - 80, flight.from?.date || "-", colW - 20, muted));

    // Center path
    const c2 = MARGIN + colW + 10;
    commands.push(textInBox("F2", 9, c2, y - 36, flight.airline || "-", colW - 20, brandDeep));
    commands.push(
      textInBox(
        "F1",
        8,
        c2,
        y - 50,
        `${flight.flightNumber || "-"} | ${flight.cabin || "-"}`,
        colW - 20,
        muted,
      ),
    );
    commands.push(
      textInBox(
        "F1",
        8,
        c2,
        y - 64,
        `${flight.duration || "-"} | ${flight.stops || "-"}`,
        colW - 20,
        muted,
      ),
    );
    const pathY = y - 78;
    const pathX1 = c2;
    const pathX2 = c2 + colW - 28;
    commands.push(line(pathX1, pathY, pathX2, pathY, brand, 1.2));
    commands.push(circleFill(pathX1, pathY, 2.2, brand));
    commands.push(circleFill(pathX2, pathY, 2.2, "0.96 0.62 0.04"));
    commands.push(text("F1", 8, (pathX1 + pathX2) / 2 - 4, pathY + 3, ">", brandDeep));
    commands.push(textInBox("F1", 7.5, c2, y - 94, flight.fareLabel || "-", colW - 20, muted));

    // Arrival
    const c3 = MARGIN + colW * 2 + 10;
    commands.push(textInBox("F2", 14, c3, y - 36, flight.to?.time || "-", colW - 20, ink));
    commands.push(textInBox("F2", 10, c3, y - 52, flight.to?.city || "-", colW - 20, brandDeep));
    commands.push(textInBox("F1", 8, c3, y - 66, flight.to?.code || "-", colW - 20, muted));
    commands.push(textInBox("F1", 8, c3, y - 80, flight.to?.date || "-", colW - 20, muted));

    // Baggage sub-bar
    commands.push(rect(MARGIN + 1, y - cardH + 1, CONTENT_W - 2, 24, "0.94 0.98 0.99"));
    commands.push(
      textInBox(
        "F2",
        8,
        MARGIN + 10,
        y - cardH + 9,
        `Baggage  |  Cabin ${flight.cabinKg ?? 7} kg  |  Check-in ${flight.checkinKg ?? 15} kg  |  ${flight.baggage || ""}`,
        CONTENT_W - 20,
        brandDeep,
      ),
    );
    y -= cardH + 14;
  } else if (doc.service === "hotel") {
    const hotel = doc.hotel;
    const cardH = 72;
    commands.push(rect(MARGIN, y - cardH, CONTENT_W, cardH, "1 1 1"));
    commands.push(strokeRect(MARGIN, y - cardH, CONTENT_W, cardH, brand, 1.2));
    commands.push(text("F2", 9, MARGIN + 10, y - 14, "HOTEL STAY", brandDeep));
    commands.push(textInBox("F2", 11, MARGIN + 10, y - 32, hotel.name, CONTENT_W - 20, ink));
    commands.push(textInBox("F1", 8, MARGIN + 10, y - 46, hotel.address, CONTENT_W - 20, muted));
    commands.push(
      textInBox(
        "F1",
        8,
        MARGIN + 10,
        y - 60,
        `${hotel.checkIn} -> ${hotel.checkOut} | ${hotel.room}`,
        CONTENT_W - 20,
        muted,
      ),
    );
    y -= cardH + 14;
  } else {
    const bus = doc.bus;
    const cardH = 72;
    commands.push(rect(MARGIN, y - cardH, CONTENT_W, cardH, "1 1 1"));
    commands.push(strokeRect(MARGIN, y - cardH, CONTENT_W, cardH, brand, 1.2));
    commands.push(text("F2", 9, MARGIN + 10, y - 14, "BUS JOURNEY", brandDeep));
    commands.push(textInBox("F2", 11, MARGIN + 10, y - 32, `${bus.from} - ${bus.to}`, CONTENT_W - 20, ink));
    commands.push(textInBox("F1", 8, MARGIN + 10, y - 46, `${bus.operator} | ${bus.date}`, CONTENT_W - 20, muted));
    commands.push(textInBox("F1", 8, MARGIN + 10, y - 60, `Seats: ${bus.seats}`, CONTENT_W - 20, muted));
    y -= cardH + 14;
  }

  // ── Passenger table (fixed columns) ──────────────────────────────
  commands.push(text("F2", 10, MARGIN, y, "Passenger & contact information", brandDeep));
  y -= 12;

  const colXs = [
    MARGIN + 6,
    MARGIN + 28,
    MARGIN + 250,
    MARGIN + 320,
    MARGIN + 400,
  ];
  const colWs = [18, 210, 60, 70, 120];
  const rowH = 18;
  const headerH2 = 18;
  const pax = (doc.passengers || []).slice(0, 8);

  commands.push(rect(MARGIN, y - headerH2, CONTENT_W, headerH2, "0.94 0.97 0.98"));
  ["#", "Passenger Name", "Type", "Gender", "Seat / Meal"].forEach((label, index) => {
    commands.push(textInBox("F2", 7.5, colXs[index], y - 12, label, colWs[index], muted));
  });
  y -= headerH2;

  pax.forEach((person) => {
    commands.push(strokeRect(MARGIN, y - rowH, CONTENT_W, rowH, lineSoft, 0.6));
    const values = [
      String(person.index),
      person.name,
      person.type,
      person.gender,
      person.seatMeal,
    ];
    values.forEach((value, index) => {
      commands.push(textInBox("F1", 8, colXs[index], y - 12, value, colWs[index], ink));
    });
    y -= rowH;
  });

  y -= 8;
  commands.push(rect(MARGIN, y - 22, CONTENT_W, 22, "0.98 0.99 1"));
  commands.push(strokeRect(MARGIN, y - 22, CONTENT_W, 22, lineSoft, 0.7));
  commands.push(
    textInBox(
      "F1",
      8,
      MARGIN + 8,
      y - 14,
      `Primary contact  |  ${doc.contact?.email || "-"}  |  ${doc.contact?.phone || "-"}`,
      CONTENT_W - 16,
      muted,
    ),
  );
  y -= 36;

  // ── Fare + signature (two fixed columns) ─────────────────────────
  commands.push(text("F2", 10, MARGIN, y, "Fare breakdown & authorisation", brandDeep));
  y -= 10;

  const fareRows: [string, string][] = [
    ["Base fare", doc.fare?.base || "-"],
    ["Taxes & surcharges", doc.fare?.taxes || "-"],
    ["Convenience fee", doc.fare?.fee || "-"],
  ];
  if (doc.fare?.extras) fareRows.push(["Extras", doc.fare.extras]);
  if (doc.fare?.discount) fareRows.push(["Discount", `-${doc.fare.discount}`]);
  fareRows.push(["Total paid", doc.fare?.total || "-"]);

  const fareColW = 300;
  const signColW = CONTENT_W - fareColW - 12;
  const boxH = Math.max(fareRows.length * 15 + 18, 96);

  commands.push(rect(MARGIN, y - boxH, fareColW, boxH, "0.98 0.99 1"));
  commands.push(strokeRect(MARGIN, y - boxH, fareColW, boxH, lineSoft, 1));
  fareRows.forEach(([label, value], index) => {
    const rowY = y - 14 - index * 15;
    const bold = index === fareRows.length - 1;
    commands.push(textInBox(bold ? "F2" : "F1", 8, MARGIN + 10, rowY, label, 150, bold ? brandDeep : muted));
    commands.push(textInBox(bold ? "F2" : "F1", 8, MARGIN + 170, rowY, value, 118, ink));
  });

  const signX = MARGIN + fareColW + 12;
  commands.push(strokeRect(signX, y - boxH, signColW, boxH, lineSoft, 1));
  commands.push(textInBox("F2", 9, signX + 12, y - 18, "Authorized Signatory", signColW - 24, brandDeep));
  commands.push(textInBox("F2", 10, signX + 12, y - 36, "APL Travel", signColW - 24, ink));
  commands.push(line(signX + 12, y - 56, signX + signColW - 16, y - 56, brand, 1));
  commands.push(textInBox("F1", 7, signX + 12, y - 70, "Digitally authorised e-ticket", signColW - 24, muted));
  commands.push(textInBox("F1", 7, signX + 12, y - 82, prettyDate(doc.bookedAt), signColW - 24, muted));

  y -= boxH + 18;

  // ── Footer disclaimer (constrained, no overflow) ─────────────────
  const disclaimer =
    "Important: Carry a valid photo ID matching passenger names. Arrive at the airport at least 2 hours before domestic departure. This e-ticket is non-transferable. Fare rules of the selected tier apply for changes and cancellations. APL Travel acts as a booking facilitator; airline operating conditions remain binding.";
  const disclaimerLines = wrapLines(disclaimer, CONTENT_W, 7, 5);
  const footerBottom = 36;
  const needed = disclaimerLines.length * 9 + 14;
  if (y - needed < footerBottom) {
    y = footerBottom + needed;
  }
  disclaimerLines.forEach((entry) => {
    commands.push(text("F1", 7, MARGIN, y, entry, muted));
    y -= 9;
  });
  commands.push(text("F1", 7, MARGIN, 24, "APL Travel · Generated for A4 print · Page 1 of 1", muted));

  const stream = commands.join("\n");
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("");
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const pageId = add(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>`,
  );
  objects[1] = `<< /Type /Pages /Count 1 /Kids [${pageId} 0 R] >>`;

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(body);
}

export function downloadTicketPdf(doc: TicketDocument) {
  const bytes = buildTicketPdfBytes(doc);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = doc.filename || "APL-ticket.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

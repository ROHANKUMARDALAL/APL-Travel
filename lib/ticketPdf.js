import { formatMoney, getActiveMarketId } from "../data/markets.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

function sanitize(value) {
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

function pdfEscape(value) {
  return sanitize(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(value, width) {
  const text = sanitize(value) || "-";
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ["-"];
}

function prettyDate(value) {
  const raw = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return sanitize(value);
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function money(amount, currency) {
  if (amount == null || amount === "") return "";
  const number = Number(amount);
  if (!Number.isFinite(number)) return sanitize(amount);
  return formatMoney(number, getActiveMarketId(), currency || "INR");
}

function personName(person) {
  if (!person || typeof person !== "object") return "";
  const name = [person.title, person.firstName, person.lastName].filter(Boolean).join(" ");
  const seat = person.seat ? ` (seat ${person.seat})` : "";
  return `${name}${seat}`.trim();
}

function peopleFrom(travellers) {
  if (!travellers) return [];
  if (Array.isArray(travellers)) return travellers.map(personName).filter(Boolean);
  const rows = [];
  if (travellers.lead) rows.push(personName(travellers.lead));
  ["additional", "adults", "children", "infants"].forEach((key) => {
    if (Array.isArray(travellers[key])) {
      travellers[key].forEach((person) => {
        const name = personName(person);
        if (name) rows.push(name);
      });
    }
  });
  return rows.filter(Boolean);
}

function row(label, value) {
  const text = sanitize(value);
  if (!text) return null;
  return [label, text];
}

function serviceLabel(service) {
  if (service === "hotel") return "Hotel";
  if (service === "bus") return "Bus";
  return "Flight";
}

function paymentRows(booking) {
  const price = booking.itinerary?.price || {};
  const currency = price.currency || "INR";
  const rows = [
    row("Payment via", paymentVia(booking.payment)),
    row("Payment status", booking.payment?.status || ""),
    row("Base fare", price.base != null ? money(price.base, currency) : booking.payable?.baseLabel),
    ...(Array.isArray(price.addOnItems) ? price.addOnItems : []).map((extra) =>
      row(extra.label || "Add-on", money(extra.amount, currency)),
    ),
    row("Taxes", price.taxes != null ? money(price.taxes, currency) : booking.payable?.taxesLabel),
    row(
      "Total",
      price.total != null ? money(price.total, currency) : booking.payable?.totalPayableLabel,
    ),
  ];
  return rows.filter(Boolean);
}

function paymentVia(payment) {
  if (!payment) return "";
  const method = String(payment.method || "").toUpperCase();
  const names = { CARD: "Card", UPI: "UPI", NETBANKING: "Net banking", WALLET: "Wallet" };
  const label = names[method] || method;
  if (!label && !payment.last4) return "";
  return payment.last4 ? `${label || "Card"} ending ${payment.last4}` : label;
}

function journeyRows(booking, catalog) {
  const service = booking.service;
  const trip = booking.itinerary || {};
  const query = booking.searchQuery || {};
  if (service === "hotel") {
    return [
      row("Hotel", trip.name || catalog?.name || booking.title),
      row("Address", trip.address || catalog?.address),
      row("City", trip.city || query.destination || catalog?.location),
      row("Room", trip.room || catalog?.roomName),
      row("Check-in", prettyDate(trip.checkIn || query.checkIn)),
      row("Check-out", prettyDate(trip.checkOut || query.checkOut)),
    ].filter(Boolean);
  }
  if (service === "bus") {
    const seats = Array.isArray(trip.seats)
      ? trip.seats.join(", ")
      : trip.seats || booking.selectedSeat;
    return [
      row("From", trip.from || query.from || catalog?.from?.city),
      row("To", trip.to || query.to || catalog?.to?.city),
      row("Travel date", prettyDate(trip.date || query.date)),
      row("Departure time", catalog?.from?.time),
      row("Arrival time", catalog?.to?.time),
      row("Operator", trip.operator || catalog?.operator),
      row("Coach", catalog?.busType),
      row("Boarding", catalog?.boarding),
      row("Drop-off", catalog?.dropOff),
      row("Seats", Array.isArray(seats) ? seats.filter(Boolean).join(", ") : seats),
    ].filter(Boolean);
  }
  const from = trip.from || {};
  const to = trip.to || {};
  return [
    row("Airline", trip.airline || catalog?.airline || booking.airline),
    row("Flight number", trip.flightNumber || catalog?.flightNumber),
    row("Cabin", trip.cabin || catalog?.cabin),
    row("Baggage", trip.baggage || catalog?.baggage),
    row("Departure city", from.city || query.from || catalog?.from?.city),
    row("Departure airport", [from.airport, from.code].filter(Boolean).join(", ") || catalog?.from?.code),
    row("Departure date", prettyDate(from.date || query.depart)),
    row("Departure time", from.time || catalog?.from?.time),
    row("Arrival city", to.city || query.to || catalog?.to?.city),
    row("Arrival airport", [to.airport, to.code].filter(Boolean).join(", ") || catalog?.to?.code),
    row("Arrival date", prettyDate(to.date || query.return)),
    row("Arrival time", to.time || catalog?.to?.time),
  ].filter(Boolean);
}

export function ticketFromBooking(booking, catalog) {
  const service = booking?.service || "flight";
  const label = serviceLabel(service);
  const people = peopleFrom(booking?.travellers);
  const sections = [
    {
      heading: "Booking",
      rows: [
        row("Booking reference", booking?.reference),
        row("PNR / reference", service === "flight" ? booking?.reference : ""),
        row("Status", booking?.bookingStatus || booking?.tripPhase),
        row("Booked on", booking?.bookedAtLocal),
      ].filter(Boolean),
    },
    { heading: `${label} details`, rows: journeyRows(booking || {}, catalog) },
    {
      heading: service === "hotel" ? "Guests" : "Passengers",
      rows: people.length
        ? people.map((name, index) => [people.length > 1 ? `${index + 1}` : "Name", name])
        : [["Name", "-"]],
    },
    { heading: "Payment", rows: paymentRows(booking || {}) },
  ].filter((section) => section.rows.length);

  if (booking?.contact?.email) {
    sections.push({
      heading: "Contact",
      rows: [row("Email", booking.contact.email), row("Phone", booking.contact.phone)].filter(Boolean),
    });
  }

  return {
    filename: `APL-${label}-ticket-${sanitize(booking?.reference || "booking") || "booking"}.pdf`,
    kicker: "APL Travel",
    title: `${label} ticket`,
    sections,
  };
}

function text(font, size, x, y, value, color = "0 0 0") {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`;
}

export function buildTicketPdfBytes(doc) {
  const pages = [];
  let commands = [];
  let y = 780;

  function newPage() {
    if (commands.length) pages.push(commands.join("\n"));
    commands = [];
    y = 780;
    commands.push("0.027 0.196 0.235 rg");
    commands.push(`36 ${PAGE_HEIGHT - 78} 523 52 re f`);
    commands.push(text("F2", 16, 48, PAGE_HEIGHT - 50, doc.kicker || "APL Travel", "1 1 1"));
    commands.push(text("F1", 11, 48, PAGE_HEIGHT - 66, doc.title || "Ticket", "0.85 0.95 0.97"));
    y = PAGE_HEIGHT - 108;
  }

  function need(height) {
    if (y - height < 56) newPage();
  }

  newPage();
  (doc.sections || []).forEach((section) => {
    need(36);
    commands.push("0.91 0.96 0.97 rg");
    commands.push(`40 ${y - 6} 515 22 re f`);
    commands.push(text("F2", 12, 48, y, section.heading, "0.05 0.31 0.38"));
    y -= 28;
    (section.rows || []).forEach(([label, value]) => {
      const lines = wrap(value, 62);
      need(16 * lines.length + 6);
      commands.push(text("F1", 10, 48, y, label, "0.29 0.39 0.45"));
      lines.forEach((line, index) => {
        if (index > 0) {
          y -= 14;
          need(16);
        }
        commands.push(text("F2", 10, 210, y, line, "0.05 0.11 0.14"));
      });
      y -= 18;
    });
    y -= 8;
  });
  pages.push(commands.join("\n"));

  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("");
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const kids = pages.map((stream) => {
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    return add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>`,
    );
  });
  objects[1] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((id) => `${id} 0 R`).join(" ")}] >>`;

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

export function downloadTicketPdf(doc) {
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import BookingProgress from "@/components/booking/BookingProgress";
import PriceSummary, { BookingNotFound } from "@/components/booking/PriceSummary";
import ExtrasSelector from "@/components/booking/ExtrasSelector";
import {
  BusPassengerForm,
  FlightTravellerForm,
  HotelGuestForm,
} from "@/components/booking/TravellerForms";
import {
  BusMainDetails,
  FlightMainDetails,
  HotelMainDetails,
  PoliciesBlock,
} from "@/components/booking/MainDetails";
import { getActiveMarketId } from "@/data/markets";
import {
  BOOKING_EXTRAS,
  buildCheckoutHref,
  buildResultsReturnHref,
  calcBookingTotals,
  findResultById,
  getExtraPrice,
  getHotelRooms,
  nightsFromSearch,
  saveBookingDraft,
} from "@/lib/booking";
import {
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
} from "@/lib/searchQuery";

function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

function phoneOk(value) {
  return String(value || "").replace(/\D/g, "").length >= 7;
}

function createTravellersFromSearch(searchQuery) {
  const adults = Number(searchQuery.adults || 1);
  const children = Number(searchQuery.children || 0);
  const infants = Number(searchQuery.infants || 0);
  const list = [];
  for (let i = 0; i < adults; i += 1) {
    list.push({
      id: `adult-${i + 1}`,
      type: "adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      nationality: "",
      passport: "",
      passportExpiry: "",
    });
  }
  for (let i = 0; i < children; i += 1) {
    list.push({
      id: `child-${i + 1}`,
      type: "child",
      title: "Mx",
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      nationality: "",
      passport: "",
      passportExpiry: "",
    });
  }
  for (let i = 0; i < infants; i += 1) {
    list.push({
      id: `infant-${i + 1}`,
      type: "infant",
      title: "Mx",
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      nationality: "",
      passport: "",
      passportExpiry: "",
    });
  }
  return list;
}

function queryFromParams(service, searchParams) {
  if (service === "flight") {
    const parsed = parseFlightSearchParams(searchParams);
    return {
      from: parsed.from,
      to: parsed.to,
      depart: searchParams.get("depart") || "",
      return: searchParams.get("return") || "",
      adults: String(parsed.adults),
      children: String(parsed.children),
      infants: String(parsed.infants),
      fareType: parsed.fareType,
    };
  }
  if (service === "hotel") {
    const parsed = parseHotelSearchParams(searchParams);
    return {
      destination: parsed.destination,
      checkIn: searchParams.get("checkIn") || "",
      checkOut: searchParams.get("checkOut") || "",
      guests: String(parsed.guests),
      rooms: String(parsed.rooms),
    };
  }
  const parsed = parseBusSearchParams(searchParams);
  return {
    from: parsed.from,
    to: parsed.to,
    date: searchParams.get("date") || "",
  };
}

function looksInternational(searchQuery) {
  const text = `${searchQuery.from || ""} ${searchQuery.to || ""}`.toLowerCase();
  return (
    text.includes("london") ||
    text.includes("lhr") ||
    text.includes("jfk") ||
    text.includes("new york")
  );
}

export default function BookingDetailsPage({ service }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = getActiveMarketId();
  const id = searchParams.get("id") || "";
  const item = findResultById(service, id);
  const searchQuery = useMemo(
    () => queryFromParams(service, searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service, searchParams.toString()],
  );
  const resultsHref = buildResultsReturnHref(service, searchQuery);
  const nights = nightsFromSearch(searchQuery);
  const rooms = useMemo(
    () => (service === "hotel" && item ? getHotelRooms(item.id) : []),
    [service, item],
  );

  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedSeat, setSelectedSeat] = useState("");
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");

  const [flightTravellers, setFlightTravellers] = useState(() =>
    createTravellersFromSearch(searchQuery),
  );
  const [hotelLead, setHotelLead] = useState({ firstName: "", lastName: "" });
  const [hotelAdditional, setHotelAdditional] = useState(() => {
    const guests = Math.max(0, Number(searchQuery.guests || 2) - 1);
    return Array.from({ length: Math.min(guests, 4) }, (_, index) => ({
      id: `guest-${index + 2}`,
      firstName: "",
      lastName: "",
    }));
  });
  const [busPassenger, setBusPassenger] = useState({
    firstName: "",
    lastName: "",
  });
  const [contact, setContact] = useState({ email: "", phone: "" });

  useEffect(() => {
    if (service === "hotel" && rooms.length) {
      setSelectedRoomId((prev) =>
        rooms.some((room) => room.id === prev) ? prev : rooms[0].id,
      );
    }
  }, [rooms, service]);

  if (!item) {
    return (
      <SiteChrome activeService={service}>
        <div className="container-page booking-page">
          <BookingNotFound resultsHref={resultsHref} />
        </div>
      </SiteChrome>
    );
  }

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
  const extrasCatalog = BOOKING_EXTRAS[service] || [];
  const selectedExtras = extrasCatalog.filter((extra) =>
    selectedExtraIds.includes(extra.id),
  );

  const totals = calcBookingTotals({
    service,
    item,
    room: selectedRoom,
    selectedExtras,
    nights,
    marketId,
    discount: 0,
  });

  const extrasForSummary = selectedExtras.map((extra) => ({
    id: extra.id,
    label: extra.label,
    amount: getExtraPrice(extra, nights, marketId),
  }));

  function toggleExtra(extraId) {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId)
        ? prev.filter((idValue) => idValue !== extraId)
        : [...prev, extraId],
    );
  }

  function validate() {
    const next = {};

    if (!emailOk(contact.email)) next.email = "Enter a valid email";
    if (!phoneOk(contact.phone)) next.phone = "Enter a valid phone number";

    if (service === "flight") {
      const showPassport = looksInternational(searchQuery);
      flightTravellers.forEach((person) => {
        if (!person.firstName.trim()) next[`${person.id}-firstName`] = "Required";
        if (!person.lastName.trim()) next[`${person.id}-lastName`] = "Required";
        if (!person.dob) next[`${person.id}-dob`] = "Required";
        if (!person.gender) next[`${person.id}-gender`] = "Required";
        if (!person.nationality.trim()) {
          next[`${person.id}-nationality`] = "Required";
        }
        if (showPassport) {
          if (!person.passport.trim()) next[`${person.id}-passport`] = "Required";
          if (!person.passportExpiry) {
            next[`${person.id}-passportExpiry`] = "Required";
          }
        }
      });
    }

    if (service === "hotel") {
      if (!hotelLead.firstName.trim()) next.leadFirst = "Required";
      if (!hotelLead.lastName.trim()) next.leadLast = "Required";
      if (!selectedRoomId) next.room = "Select a room";
    }

    if (service === "bus") {
      if (!busPassenger.firstName.trim()) next.firstName = "Required";
      if (!busPassenger.lastName.trim()) next.lastName = "Required";
      if (!selectedSeat) next.seat = "Select a seat";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinue() {
    if (!validate()) {
      setFormMessage("Please complete the highlighted fields before continuing.");
      const travellerEl = document.getElementById("traveller");
      travellerEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const draft = {
      service,
      id: item.id,
      searchQuery,
      selectedRoomId: service === "hotel" ? selectedRoomId : null,
      selectedSeat: service === "bus" ? selectedSeat : null,
      extras: selectedExtraIds,
      contact,
      travellers:
        service === "flight"
          ? flightTravellers
          : service === "hotel"
            ? { lead: hotelLead, additional: hotelAdditional }
            : busPassenger,
      totals,
      savedAt: new Date().toISOString(),
    };
    saveBookingDraft(draft);

    const href = buildCheckoutHref(service, item.id, searchQuery, {
      roomId: selectedRoomId,
      seat: selectedSeat,
      extras: selectedExtraIds,
    });
    router.push(href);
  }

  const policies =
    service === "flight"
      ? [
          item.fareConditions,
          "Changes and cancellations follow the selected fare rules.",
          "Travel documents must match traveller names exactly.",
        ]
      : service === "hotel"
        ? [
            selectedRoom?.cancellation || item.cancellation,
            "Resort fees may apply at some properties and are shown in taxes where known.",
            "Photo ID is required at check-in.",
          ]
        : [
            item.cancellation,
            "Arrive at boarding point at least 20 minutes early.",
            "Seat map is illustrative until live inventory is connected.",
          ];

  return (
    <SiteChrome activeService={service}>
      <div className="booking-page">
        <div className="container-page booking-page-inner">
          <BookingProgress current="details" />

          <div className="booking-top-actions">
            <Link className="btn-ghost" href={resultsHref}>
              ← Back to results
            </Link>
          </div>

          <div className="booking-layout">
            <div className="booking-main">
              {service === "flight" ? (
                <FlightMainDetails item={item} searchQuery={searchQuery} />
              ) : null}
              {service === "hotel" ? (
                <HotelMainDetails
                  item={item}
                  searchQuery={searchQuery}
                  rooms={rooms}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  nights={nights}
                />
              ) : null}
              {service === "bus" ? (
                <BusMainDetails
                  item={item}
                  searchQuery={searchQuery}
                  selectedSeat={selectedSeat}
                  onSelectSeat={setSelectedSeat}
                />
              ) : null}

              {errors.seat ? <p className="field-error">{errors.seat}</p> : null}
              {errors.room ? <p className="field-error">{errors.room}</p> : null}

              <PoliciesBlock items={policies} />

              {service === "flight" ? (
                <FlightTravellerForm
                  travellers={flightTravellers}
                  onChangeTraveller={(personId, patch) =>
                    setFlightTravellers((prev) =>
                      prev.map((person) =>
                        person.id === personId ? { ...person, ...patch } : person,
                      ),
                    )
                  }
                  contact={contact}
                  onChangeContact={setContact}
                  errors={errors}
                  showPassport={looksInternational(searchQuery)}
                />
              ) : null}

              {service === "hotel" ? (
                <HotelGuestForm
                  leadGuest={hotelLead}
                  onChangeLead={setHotelLead}
                  additionalGuests={hotelAdditional}
                  onChangeAdditional={(guestId, patch) =>
                    setHotelAdditional((prev) =>
                      prev.map((guest) =>
                        guest.id === guestId ? { ...guest, ...patch } : guest,
                      ),
                    )
                  }
                  contact={contact}
                  onChangeContact={setContact}
                  errors={errors}
                />
              ) : null}

              {service === "bus" ? (
                <BusPassengerForm
                  passenger={busPassenger}
                  onChangePassenger={setBusPassenger}
                  contact={contact}
                  onChangeContact={setContact}
                  errors={errors}
                />
              ) : null}

              <ExtrasSelector
                extrasCatalog={extrasCatalog}
                selectedIds={selectedExtraIds}
                onToggle={toggleExtra}
                nights={nights}
              />

              {formMessage ? (
                <p className="field-error booking-form-message" role="alert">
                  {formMessage}
                </p>
              ) : null}
            </div>

            <PriceSummary
              totals={totals}
              extras={extrasForSummary}
              nights={service === "hotel" ? nights : 1}
              onContinue={handleContinue}
            />
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}

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
  MAX_BUS_SEATS,
  nightsFromSearch,
  saveBookingDraft,
  BUS_TAKEN_SEATS,
} from "@/lib/booking";
import {
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
} from "@/lib/searchQuery";
import { AUTH_EVENT, getCurrentUser } from "@/lib/auth";
import {
  applySavedTraveller,
  fetchSavedTravellers,
} from "@/lib/api/travellers";
import { isValidAge, ageFromDob } from "@/components/booking/TravellerForms";
import TravellerPickerModal from "@/components/booking/TravellerPickerModal";

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
  const [selectedSeats, setSelectedSeats] = useState([]);
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
      age: "",
    }));
  });
  const [busPassengers, setBusPassengers] = useState([]);
  const [seatMessage, setSeatMessage] = useState("");
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [savedTravellers, setSavedTravellers] = useState([]);
  const [accountReady, setAccountReady] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    if (service === "hotel" && rooms.length) {
      setSelectedRoomId((prev) =>
        rooms.some((room) => room.id === prev) ? prev : rooms[0].id,
      );
    }
  }, [rooms, service]);

  useEffect(() => {
    function fillContactFromProfile() {
      const user = getCurrentUser();
      if (!user) return;
      setContact((prev) => ({
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }

    fillContactFromProfile();
    setAccountReady(true);
    setPageReady(true);
    if (!getCurrentUser()) return undefined;
    let ignore = false;
    fetchSavedTravellers()
      .then((rows) => {
        if (!ignore) setSavedTravellers(rows);
      })
      .catch(() => {});
    window.addEventListener(AUTH_EVENT, fillContactFromProfile);
    return () => {
      ignore = true;
      window.removeEventListener(AUTH_EVENT, fillContactFromProfile);
    };
  }, []);

  if (!pageReady) {
    return (
      <SiteChrome activeService={service}>
        <div className="booking-page">
          <div className="container-page booking-page-inner">
            <p className="section-copy">Loading your booking…</p>
          </div>
        </div>
      </SiteChrome>
    );
  }

  if (!item) {
    return (
      <SiteChrome activeService={service}>
        <div className="container-page booking-page">
          <BookingProgress current="details" backHref={resultsHref} />
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
    seatCount: service === "bus" ? selectedSeats.length : 1,
    discount: 0,
  });

  const extrasForSummary = selectedExtras.map((extra) => ({
    id: extra.id,
    label: extra.label,
    amount: getExtraPrice(extra, nights, marketId),
  }));

  function toggleBusSeat(seat) {
    if (BUS_TAKEN_SEATS.includes(seat)) return;
    if (selectedSeats.includes(seat)) {
      setSelectedSeats((current) => current.filter((id) => id !== seat));
      setBusPassengers((people) => people.filter((person) => person.seat !== seat));
      setSeatMessage("");
      return;
    }
    if (selectedSeats.length >= MAX_BUS_SEATS) {
      setSeatMessage(`You can select up to ${MAX_BUS_SEATS} seats.`);
      return;
    }
    setSelectedSeats((current) => [...current, seat]);
    setBusPassengers((people) => [
      ...people,
      { id: seat, seat, firstName: "", lastName: "" },
    ]);
    setSeatMessage("");
  }

  function selectSavedTraveller(person) {
    setPicker({ kind: "flight", personId: person.id, type: person.type });
  }

  function chooseSavedTraveller(saved) {
    if (!picker) return;
    if (picker.kind === "flight") {
      setFlightTravellers((prev) =>
        prev.map((person) =>
          person.id === picker.personId ? applySavedTraveller(person, saved) : person,
        ),
      );
    } else if (picker.kind === "hotel") {
      setHotelLead({
        firstName: saved.firstName || "",
        lastName: saved.lastName || "",
        age: ageFromDob(saved.dateOfBirth),
      });
    } else if (picker.kind === "bus") {
      setBusPassengers((prev) =>
        prev.map((person) =>
          person.seat === picker.seat
            ? {
                ...person,
                firstName: saved.firstName || "",
                lastName: saved.lastName || "",
                age: ageFromDob(saved.dateOfBirth),
              }
            : person,
        ),
      );
    }
    setPicker(null);
  }

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
      if (!isValidAge(hotelLead.age)) next.leadAge = "Enter age";
      hotelAdditional.forEach((guest) => {
        if (!isValidAge(guest.age)) next[`addAge-${guest.id}`] = "Enter age";
      });
      if (!selectedRoomId) next.room = "Select a room";
    }

    if (service === "bus") {
      if (!selectedSeats.length) next.seat = "Select at least one seat";
      if (selectedSeats.length > MAX_BUS_SEATS) {
        next.seat = `Select up to ${MAX_BUS_SEATS} seats`;
      }
      busPassengers.forEach((person) => {
        if (!person.firstName.trim()) next[`${person.seat}-firstName`] = "Required";
        if (!person.lastName.trim()) next[`${person.seat}-lastName`] = "Required";
        if (!isValidAge(person.age)) next[`${person.seat}-age`] = "Enter age";
      });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleContinue() {
    if (!validate()) {
      setFormMessage("Please complete the highlighted fields before continuing.");
      const travellerEl = document.getElementById("traveller");
      travellerEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
    const draft = {
      service,
      id: item.id,
      searchQuery,
      selectedRoomId: service === "hotel" ? selectedRoomId : null,
      selectedSeat: service === "bus" ? selectedSeats : null,
      extras: selectedExtraIds,
      contact,
      travellers:
        service === "flight"
          ? flightTravellers
          : service === "hotel"
            ? { lead: hotelLead, additional: hotelAdditional }
            : busPassengers,
      totals,
      apiBooking:
        service === "flight" && item.searchId && item.aplFareId && item.quote
          ? {
              kind: "flight",
              searchId: item.searchId,
              aplFlightId: item.id,
              aplFareId: item.aplFareId,
              quote: item.quote,
            }
          : service === "hotel" && item.searchId && selectedRoom?.quote
            ? {
                kind: "hotel",
                searchId: item.searchId,
                aplHotelId: item.id,
                aplRoomId: selectedRoom.id,
                quote: selectedRoom.quote,
              }
            : null,
      savedAt: new Date().toISOString(),
    };
    saveBookingDraft(draft);

    const href = buildCheckoutHref(service, item.id, searchQuery, {
      roomId: selectedRoomId,
      seat: selectedSeats,
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
          <BookingProgress current="details" backHref={resultsHref} />

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
                  selectedSeats={selectedSeats}
                  onToggleSeat={toggleBusSeat}
                  seatMessage={seatMessage}
                />
              ) : null}

              {errors.seat ? <p className="field-error">{errors.seat}</p> : null}
              {errors.room ? <p className="field-error">{errors.room}</p> : null}

              <PoliciesBlock items={policies} />

              {service === "flight" ? (
                <>
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
                  savedTravellers={accountReady ? savedTravellers : []}
                  onSelectSaved={accountReady && getCurrentUser() ? selectSavedTraveller : null}
                  contactHint={
                    accountReady && getCurrentUser()
                      ? "Email and phone are filled from your profile. Change them here if this trip should use a different contact."
                      : ""
                  }
                />
                </>
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
                  onOpenTravellers={
                    accountReady && getCurrentUser() ? () => setPicker({ kind: "hotel" }) : null
                  }
                />
              ) : null}

              {service === "bus" ? (
                <BusPassengerForm
                  passengers={busPassengers}
                  onChangePassenger={(seat, patch) =>
                    setBusPassengers((prev) =>
                      prev.map((person) =>
                        person.seat === seat ? { ...person, ...patch } : person,
                      ),
                    )
                  }
                  contact={contact}
                  onChangeContact={setContact}
                  errors={errors}
                  onOpenTravellers={
                    accountReady && getCurrentUser()
                      ? (person) => setPicker({ kind: "bus", seat: person.seat })
                      : null
                  }
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
      <TravellerPickerModal
        open={Boolean(picker)}
        typeFilter={picker?.kind === "flight" ? picker.type : ""}
        travellers={savedTravellers}
        takenIds={flightTravellers.map((person) => person.savedTravellerId).filter(Boolean)}
        onClose={() => setPicker(null)}
        onSelect={chooseSavedTraveller}
      />
    </SiteChrome>
  );
}

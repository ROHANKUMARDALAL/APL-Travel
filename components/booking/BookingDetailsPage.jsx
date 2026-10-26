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
  TransferPassengerForm,
} from "@/components/booking/TravellerForms";
import {
  BusMainDetails,
  FlightMainDetails,
  HotelMainDetails,
  TransferMainDetails,
  PoliciesBlock,
} from "@/components/booking/MainDetails";
import { formatMoney, getActiveMarketId } from "@/data/markets";
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
  loadBookingDraft,
  saveBookingDraft,
  BUS_TAKEN_SEATS,
} from "@/lib/booking";
import {
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
  parseTransferSearchParams,
} from "@/lib/searchQuery";
import { AUTH_EVENT, getCurrentUser } from "@/lib/auth";
import {
  applySavedTraveller,
  fetchSavedTravellers,
} from "@/lib/api/travellers";
import { isValidAge, ageFromDob } from "@/components/booking/TravellerForms";
import { dobErrorForType } from "@/lib/travellerAge";
import TravellerPickerModal from "@/components/booking/TravellerPickerModal";
import { payingPassengerCount, selectedFareSnapshot, withSelectedFare } from "@/lib/fareSelection";
import { PromoCodeField } from "@/components/checkout/PromoWallet";
import FlightAddOnsModal, {
  passengerAddOnTotal,
  passengerSummary,
  selectionsToAddOns,
} from "@/components/booking/FlightAddOns";
import { selectionStillOffered } from "@/lib/ssrLayout.mjs";
import { apiPost } from "@/lib/api/client";
import BusPointsModal from "@/components/results/BusPointsModal";
import { readBusPoints, saveBusPoints } from "@/lib/busPoints";

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
      trip: parsed.tripType,
      from: parsed.from,
      to: parsed.to,
      depart: searchParams.get("depart") || "",
      return: parsed.tripType === "return" ? searchParams.get("return") || "" : "",
      adults: String(parsed.adults),
      children: String(parsed.children),
      infants: String(parsed.infants),
      fareType: parsed.fareType,
      originCityCode: parsed.originCityCode,
      destinationCityCode: parsed.destinationCityCode,
      legs: parsed.tripType === "multi" ? searchParams.get("legs") || "" : "",
    };
  }
  if (service === "hotel") {
    const parsed = parseHotelSearchParams(searchParams);
    return {
      destination: parsed.destination,
      cityCode: parsed.cityCode,
      checkIn: searchParams.get("checkIn") || "",
      checkOut: searchParams.get("checkOut") || "",
      guests: String(parsed.guests),
      rooms: String(parsed.rooms),
    };
  }
  if (service === "transfer") {
    const parsed = parseTransferSearchParams(searchParams);
    return {
      pickup: parsed.pickup,
      dropoff: parsed.dropoff,
      pickupKind: parsed.pickupKind,
      dropoffKind: parsed.dropoffKind,
      date: searchParams.get("date") || "",
      time: parsed.pickupTime,
      passengers: String(parsed.passengers),
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

const flightAddonCache = new Map();

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
  const [transferPassengers, setTransferPassengers] = useState(() => {
    const count = Math.max(1, Math.min(8, Number(searchParams.get("passengers") || 1)));
    return Array.from({ length: count }, (_, index) => ({
      id: `xfer-${index + 1}`,
      type: "ADULT",
      firstName: "",
      lastName: "",
      age: "",
    }));
  });
  const [transferNotes, setTransferNotes] = useState({
    pickupInstructions: "",
  });
  const [pickupPoint, setPickupPoint] = useState(null);
  const [seatMessage, setSeatMessage] = useState("");
  const [busPoints, setBusPoints] = useState(null);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [contact, setContact] = useState({ email: "", phone: "", countryCode: "+91", pickupContact: "" });
  const [couponPromo, setCouponPromo] = useState(null);
  const [fareNotice, setFareNotice] = useState("");
  const [acceptFareChange, setAcceptFareChange] = useState(false);
  const [supplierSsr, setSupplierSsr] = useState(null);
  const [ssrStatus, setSsrStatus] = useState("idle");
  const [ssrSelections, setSsrSelections] = useState({});
  const [ssrPassengerId, setSsrPassengerId] = useState(null);
  const [savedTravellers, setSavedTravellers] = useState([]);
  const [accountReady, setAccountReady] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    if (service !== "transfer" || !item?.id) return;
    const draft = loadBookingDraft();
    if (!draft || draft.service !== "transfer" || draft.id !== item.id) return;
    if (Array.isArray(draft.travellers) && draft.travellers.length) setTransferPassengers(draft.travellers);
    if (draft.transferNotes) setTransferNotes(draft.transferNotes);
    if (draft.pickupPoint) setPickupPoint(draft.pickupPoint);
    if (draft.contact) setContact((current) => ({ ...current, ...draft.contact }));
  }, [service, item?.id]);

  useEffect(() => {
    if (service !== "transfer" || !item?.searchId || !item?.id) return undefined;
    let ignore = false;
    const body = {
      searchId: item.searchId,
      aplTransferId: item.id,
      aplOfferId: item.aplOfferId || undefined,
    };
    Promise.all([
      apiPost("/transfers/details", body),
      apiPost("/transfers/revalidate", body),
    ]).then(([, checked]) => {
      if (ignore) return;
      const amount = Number(checked?.price?.amount);
      if (Number.isFinite(amount) && item.quote && amount !== Number(item.quote.amount)) {
        setFareNotice(`The fare is now ${amount} ${checked.price?.currency || ""}. Search again before paying.`);
      }
    }).catch((err) => {
      if (!ignore) setFareNotice(err.message || "This cab could not be rechecked.");
    });
    return () => { ignore = true; };
  }, [service, item?.searchId, item?.id, item?.aplOfferId, item?.quote?.amount]);

  useEffect(() => {
    if (service !== "bus" || !item?.id) return;
    const saved = readBusPoints(item.searchId, item.id);
    const boardingCode = searchParams.get("boarding");
    const droppingCode = searchParams.get("dropping");
    const matches = saved
      && (!boardingCode || saved.boarding.code === boardingCode)
      && (!droppingCode || saved.dropping.code === droppingCode);
    if (matches) {
      setBusPoints(saved);
      setPointsOpen(false);
      return;
    }
    const boarding = (item.boardingPoints || []).find((point) => point.code === boardingCode);
    const dropping = (item.droppingPoints || []).find((point) => point.code === droppingCode);
    if (boarding && dropping) {
      const selection = { boarding, dropping };
      saveBusPoints(item.searchId, item.id, selection);
      setBusPoints({ searchId: item.searchId, busId: item.id, ...selection });
      setPointsOpen(false);
      return;
    }
    setBusPoints(null);
    setPointsOpen(true);
  }, [service, item?.id, item?.searchId, searchParams]);

  useEffect(() => {
    if (service !== "flight" || !item?.searchId || !item?.id) return undefined;
    let ignore = false;
    const flightId = item.aplFlightId || item.id;
    const returnLeg = item.returnLeg;
    const cacheKey = [
      item.searchId,
      flightId,
      item.aplFareId || "",
      returnLeg?.searchId || "",
      returnLeg?.id || "",
      returnLeg?.aplFareId || "",
      acceptFareChange ? "accept" : "hold",
    ].join("|");
    setSsrStatus("loading");
    setFareNotice("");
    async function confirmThenLoad() {
      const quoted = await apiPost("/flights/fare-quote", {
        searchId: item.searchId,
        aplFlightId: flightId,
        aplFareId: item.aplFareId || undefined,
        journeyId: item.journeyId || undefined,
        acceptPriceChange: acceptFareChange,
      });
      if (quoted?.requiresAcceptance) {
        throw new Error(
          `The fare changed from ${quoted.previousPrice?.amount ?? ""} to ${quoted.price?.amount ?? ""} ${quoted.price?.currency || ""}. Accept the updated fare before choosing add-ons.`,
        );
      }
      if (returnLeg?.id && returnLeg.searchId) {
        const returnQuoted = await apiPost("/flights/fare-quote", {
          searchId: returnLeg.searchId,
          aplFlightId: returnLeg.id,
          aplFareId: returnLeg.aplFareId || undefined,
          journeyId: quoted?.journeyId || item.journeyId || undefined,
          asReturn: true,
          acceptPriceChange: acceptFareChange,
        });
        if (returnQuoted?.requiresAcceptance) {
          throw new Error("The return fare changed. Accept the updated fare before choosing add-ons.");
        }
      }
      return Promise.all([
        apiPost("/flights/ssr", {
          searchId: item.searchId,
          aplFlightId: flightId,
          aplFareId: item.aplFareId || undefined,
          journeyId: quoted?.journeyId || item.journeyId || undefined,
        }),
        returnLeg?.id && returnLeg.searchId
          ? apiPost("/flights/ssr", {
              searchId: returnLeg.searchId,
              aplFlightId: returnLeg.id,
              aplFareId: returnLeg.aplFareId || undefined,
              journeyId: quoted?.journeyId || item.journeyId || undefined,
              asReturn: true,
            })
          : Promise.resolve(null),
      ]);
    }
    const cached = flightAddonCache.get(cacheKey);
    const pending = cached && Date.now() - cached.at < 10 * 60 * 1000
      ? cached.promise
      : confirmThenLoad();
    if (!cached || Date.now() - cached.at >= 10 * 60 * 1000) {
      flightAddonCache.set(cacheKey, { at: Date.now(), promise: pending });
    }
    pending
      .then(([data, inbound]) => {
        if (ignore) return;
        const outboundSegments = Array.isArray(data?.segments) ? data.segments : [];
        const inboundSegments = Array.isArray(inbound?.segments) ? inbound.segments : [];
        const segments = [...outboundSegments, ...inboundSegments];
        const first = segments[0] || {};
        setSupplierSsr({
          ...data,
          segments,
          addOns: {
            seats: first.seats || [],
            meals: first.meals || [],
            baggage: first.baggage || [],
          },
          baggage: data?.fareRules?.baggage || data?.baggage || null,
          fareRules: data?.fareRules || null,
        });
        setSsrSelections((current) => {
          let changed = false;
          const next = {};
          Object.entries(current || {}).forEach(([passengerId, bySegment]) => {
            const kept = {};
            Object.entries(bySegment || {}).forEach(([segmentKey, choice]) => {
              const segment = segments.find((entry, index) => (
                (entry.segmentKey || entry.id || `${flightId}-seg-${index}`) === segmentKey
              ));
              if (segment && selectionStillOffered(choice, segment)) kept[segmentKey] = choice;
              else changed = true;
            });
            if (Object.keys(kept).length) next[passengerId] = kept;
            else if (Object.keys(bySegment || {}).length) changed = true;
          });
          return changed ? next : current;
        });
        setSsrStatus(first.seats?.length || first.meals?.length ? "ready" : "empty");
      })
      .catch((error) => {
        if (ignore) return;
        flightAddonCache.delete(cacheKey);
        setFareNotice(error instanceof Error ? error.message : "Confirm the selected fare before choosing add-ons.");
        setSsrStatus("empty");
      });
    return () => {
      ignore = true;
    };
  }, [service, item?.searchId, item?.id, item?.aplFlightId, item?.aplFareId, item?.returnLeg?.searchId, item?.returnLeg?.id, item?.returnLeg?.aplFareId, acceptFareChange]);

  useEffect(() => {
    if (service === "hotel" && rooms.length) {
      setSelectedRoomId((prev) =>
        rooms.some((room) => room.id === prev) ? prev : rooms[0].id,
      );
    }
  }, [rooms, service]);

  useEffect(() => {
    if (service !== "flight" || !couponPromo?.code || !item?.searchId) return undefined;
    const selectedFareId = searchParams.get("fareId") || item.selectedFareId || "";
    const selected = withSelectedFare(item, selectedFareId) || item;
    const offerId = selected?.aplFareId || selectedFareId;
    if (!offerId) return undefined;
    let ignore = false;
    const passengers = payingPassengerCount({
      travellers: flightTravellers,
      searchQuery,
      paxCount: item.paxCount,
    });
    apiPost("/bookings/coupon-check", {
      code: couponPromo.code,
      serviceCode: "flight",
      searchId: item.searchId,
      offerId,
      passengers,
    })
      .then((data) => {
        if (ignore || !data?.quote) return;
        const quote = data.quote;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("apl-coupon-code", data.coupon.code);
          window.sessionStorage.setItem("apl-coupon-service", "flight");
          window.sessionStorage.setItem("apl-coupon-savings", String(quote.couponSavings ?? ""));
          window.sessionStorage.setItem("apl-coupon-unit", String(quote.total ?? ""));
          window.sessionStorage.setItem("apl-coupon-currency", quote.currency || "INR");
        }
        setCouponPromo((current) => {
          if (!current?.code || current.code !== data.coupon.code) return current;
          if (
            Number(current.payable) === Number(quote.total) &&
            Number(current.amount) === Number(quote.couponSavings)
          ) {
            return current;
          }
          return {
            ...current,
            amount: quote.couponSavings,
            payable: quote.total,
            currency: quote.currency,
            fare: quote.fare,
            automaticDiscount: quote.discount,
          };
        });
      })
      .catch(() => {
        if (!ignore) setCouponPromo(null);
      });
    return () => {
      ignore = true;
    };
  }, [
    service,
    id,
    item?.searchId,
    item?.selectedFareId,
    item?.paxCount,
    couponPromo?.code,
    searchParams,
    flightTravellers,
    searchQuery,
  ]);

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

  const fareId = searchParams.get("fareId") || item.selectedFareId || "";
  const pricedItem =
    service === "flight" ? withSelectedFare(item, fareId) || item : item;
  const activeFare = selectedFareSnapshot(item, fareId);

  function selectFare(nextFareId) {
    if (!nextFareId || nextFareId === fareId) return;
    setSsrSelections({});
    const params = new URLSearchParams(searchParams.toString());
    params.set("fareId", nextFareId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
  const extrasCatalog = BOOKING_EXTRAS[service] || [];
  const selectedExtras = extrasCatalog.filter((extra) =>
    selectedExtraIds.includes(extra.id),
  );

  const totals = calcBookingTotals({
    service,
    item: pricedItem,
    room: selectedRoom,
    selectedExtras,
    nights,
    marketId,
    seatCount: service === "bus" ? selectedSeats.length : 1,
    discount: 0,
  });

  const flightSegments = service !== "flight"
    ? []
    : (supplierSsr?.segments?.length
      ? supplierSsr.segments
      : pricedItem.segments?.length
        ? pricedItem.segments
        : [{
            id: pricedItem.id || "segment-1",
            from: pricedItem.from?.code || "",
            to: pricedItem.to?.code || "",
            flightNumber: pricedItem.flightNumber || "",
          }]
    ).map((segment, index) => ({
      id: segment.segmentKey || segment.id || `${pricedItem.id}-seg-${index}`,
      from: segment.origin || segment.from || "",
      to: segment.destination || segment.to || "",
      flightNumber: segment.flightNumber || pricedItem.flightNumber || "",
      airline: segment.airline?.name || segment.airline || pricedItem.airline || "",
      seats: segment.seats || null,
      meals: segment.meals || null,
      baggage: segment.baggage || null,
    }));
  const flightAddOns = service === "flight"
    ? selectionsToAddOns(ssrSelections)
    : { amount: 0, seats: [], meals: [], baggage: [] };

  const extrasForSummary = selectedExtras.map((extra) => ({
    id: extra.id,
    label: extra.label,
    amount: getExtraPrice(extra, nights, marketId),
  }));

  function toggleBusSeat(seat) {
    const taken = item?.takenSeats?.length ? item.takenSeats : BUS_TAKEN_SEATS;
    if (taken.includes(seat)) return;
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
    } else if (picker.kind === "transfer") {
      setTransferPassengers((prev) =>
        prev.map((person, index) =>
          index === picker.index
            ? {
                ...person,
                firstName: saved.firstName || "",
                lastName: saved.lastName || "",
                age: ageFromDob(saved.dateOfBirth),
              }
            : person,
        ),
      );
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
        else {
          const dobMessage = dobErrorForType(person.dob, person.type || "adult");
          if (dobMessage) next[`${person.id}-dob`] = dobMessage;
        }
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
      if (!busPoints?.boarding?.code || !busPoints?.dropping?.code) {
        next.points = "Select a boarding point and a dropping point";
      }
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

    if (service === "transfer") {
      if (transferPassengers.length > Number(item?.maxPassengers || 8)) {
        next.passengers = `This cab seats ${item.maxPassengers} passengers`;
      }
      if ((item?.pickupPoints || []).length && !pickupPoint?.code) {
        next.pickupPoint = "Select a pickup point";
      }
      transferPassengers.forEach((person) => {
        if (!person.firstName.trim()) next[`${person.id}-firstName`] = "Required";
        if (!person.lastName.trim()) next[`${person.id}-lastName`] = "Required";
        if (!isValidAge(person.age)) next[`${person.id}-age`] = "Enter age";
      });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleContinue() {
    if (service === "transfer" && fareNotice) {
      setFormMessage(fareNotice);
      return;
    }
    if (!validate()) {
      setFormMessage("Please complete the highlighted fields before continuing.");
      const travellerEl = document.getElementById("traveller");
      travellerEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
    const fareSnapshot = service === "flight" ? selectedFareSnapshot(item, fareId) : null;
    const bookingItem = service === "flight" ? pricedItem : item;
    const draft = {
      service,
      id: item.id,
      searchQuery,
      selectedRoomId: service === "hotel" ? selectedRoomId : null,
      selectedSeat: service === "bus" ? selectedSeats : null,
      selectedFareId: fareSnapshot?.id || fareId || null,
      selectedFare: fareSnapshot,
      extras: service === "flight" ? [] : selectedExtraIds,
      flightAddOns: service === "flight" ? selectionsToAddOns(ssrSelections) : null,
      contact,
      boardingPoint: service === "bus" ? busPoints?.boarding || null : null,
      droppingPoint: service === "bus" ? busPoints?.dropping || null : null,
      travellers:
        service === "flight"
          ? flightTravellers
          : service === "hotel"
            ? { lead: hotelLead, additional: hotelAdditional }
            : service === "transfer"
              ? transferPassengers
              : busPassengers,
      transferNotes: service === "transfer" ? transferNotes : null,
      pickupPoint: service === "transfer" ? pickupPoint : null,
      totals,
      apiBooking:
        service === "flight" && bookingItem.searchId && bookingItem.quote
          ? {
              kind: "flight",
              searchId: bookingItem.searchId,
              aplFlightId: bookingItem.aplFlightId || bookingItem.id,
              aplFareId: bookingItem.aplFareId || fareSnapshot?.aplFareId || null,
              returnOffer: bookingItem.returnLeg?.id
                ? {
                    searchId: bookingItem.returnLeg.searchId,
                    aplFlightId: bookingItem.returnLeg.id,
                    aplFareId: bookingItem.returnLeg.aplFareId || null,
                    quote: bookingItem.returnLeg.quote || null,
                  }
                : undefined,
              quote: fareSnapshot?.quote || bookingItem.quote,
              selectedFareQuote: fareSnapshot?.quote || bookingItem.quote,
              fareLabel: fareSnapshot?.label || bookingItem.selectedFareLabel || null,
            }
          : service === "hotel" && item.searchId && selectedRoom?.quote
            ? {
                kind: "hotel",
                searchId: item.searchId,
                aplHotelId: item.id,
                aplRoomId: selectedRoom.id,
                quote: selectedRoom.quote,
              }
            : service === "bus" && item.searchId && item.quote
              ? {
                  kind: "bus",
                  searchId: item.searchId,
                  aplBusId: item.id,
                  aplOfferId: item.aplOfferId || null,
                  quote: item.quote,
                  boardingPointCode: busPoints?.boarding?.code,
                  droppingPointCode: busPoints?.dropping?.code,
                  selectedSeats,
                }
              : service === "transfer" && item.searchId && item.quote
                ? {
                    kind: "transfer",
                    searchId: item.searchId,
                    aplTransferId: item.id,
                    aplOfferId: item.aplOfferId || null,
                    quote: item.quote,
                    pickupPoint,
                    pickupInstructions: transferNotes.pickupInstructions || null,
                  }
                : null,
      savedAt: new Date().toISOString(),
    };
    saveBookingDraft(draft);

    const href = buildCheckoutHref(service, item.id, searchQuery, {
      roomId: selectedRoomId,
      seat: selectedSeats,
      extras: selectedExtraIds,
      fareId: fareSnapshot?.id || fareId || undefined,
    });
    router.push(href);
  }

  const policies =
    service === "flight"
      ? [
          pricedItem.fareConditions,
          "Changes and cancellations follow the selected fare rules.",
          "Travel documents must match traveller names exactly.",
        ]
      : service === "hotel"
        ? [
            selectedRoom?.cancellation || item.cancellation,
            "Resort fees may apply at some properties and are shown in taxes where known.",
            "Photo ID is required at check-in.",
          ]
        : service === "transfer"
          ? [
              item.cancellation,
              "Meet your driver at the agreed pickup point with matching passenger names.",
              "Pickup instructions help the driver find you at the selected point.",
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
                <FlightMainDetails
                  item={pricedItem}
                  searchQuery={searchQuery}
                  selectedFareId={fareId || activeFare?.id || ""}
                  onSelectFare={selectFare}
                />
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
                <>
                  <BusMainDetails
                    item={item}
                    searchQuery={searchQuery}
                    selectedSeats={selectedSeats}
                    onToggleSeat={toggleBusSeat}
                    seatMessage={seatMessage}
                    boardingPoint={busPoints?.boarding}
                    droppingPoint={busPoints?.dropping}
                    onChangePoints={() => setPointsOpen(true)}
                  />
                  {errors.points ? <p className="field-error">{errors.points}</p> : null}
                </>
              ) : null}
              {service === "transfer" ? (
                <>
                  <TransferMainDetails
                    item={item}
                    searchQuery={searchQuery}
                    fareNotice={fareNotice}
                    pickupPoint={pickupPoint}
                    onPickupPoint={setPickupPoint}
                  />
                  {errors.pickupPoint ? <p className="field-error">{errors.pickupPoint}</p> : null}
                </>
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
                  renderAddOns={(person, index) => {
                    const typeLabel = person.type === "child" ? "Child" : person.type === "infant" ? "Infant" : "Adult";
                    const summary = Object.values(ssrSelections?.[person.id] || {}).map(passengerSummary).filter(Boolean).join(" · ");
                    const total = passengerAddOnTotal(ssrSelections, person.id);
                    return (
                      <div className="passenger-addons">
                        <button type="button" className="passenger-addons-btn" onClick={() => setSsrPassengerId(person.id)}>
                          + Add-ons: Seat, Meal & Baggage
                        </button>
                        {fareNotice ? <p className="passenger-addons-note">{fareNotice}</p> : null}
                        {fareNotice && /changed/i.test(fareNotice) ? (
                          <button type="button" className="passenger-addons-note" onClick={() => setAcceptFareChange(true)}>
                            Accept updated fare
                          </button>
                        ) : null}
                        {ssrStatus === "loading" ? <p className="passenger-addons-note">Confirming the fare, then loading add-ons…</p> : null}
                        {ssrStatus === "empty" ? <p className="passenger-addons-note">Add-ons are unavailable for this fare.</p> : null}
                        {summary ? (
                          <p className="passenger-addons-summary">
                            {summary}
                            {total > 0 ? ` · ${formatMoney(total, marketId)}` : ""}
                          </p>
                        ) : null}
                        <span className="sr-only">Passenger {index + 1} · {typeLabel}</span>
                      </div>
                    );
                  }}
                />
                {supplierSsr?.fareRules ? (
                  <section className="fare-rules-panel">
                    <h3>Fare rules and cancellation</h3>
                    <p>{supplierSsr.fareRules.refundable ? "This mock fare can be cancelled with a fee." : "This mock fare is non-refundable."}</p>
                    <p>{supplierSsr.fareRules.cancellation}</p>
                    <p>{supplierSsr.fareRules.change}</p>
                    <p>{supplierSsr.fareRules.noShow}</p>
                  </section>
                ) : null}
                <FlightAddOnsModal
                  open={Boolean(ssrPassengerId)}
                  passenger={(() => {
                    const person = flightTravellers.find((entry) => entry.id === ssrPassengerId);
                    if (!person) return null;
                    return {
                      ...person,
                      label: `Passenger ${flightTravellers.findIndex((entry) => entry.id === person.id) + 1}`,
                      typeLabel: person.type === "child" ? "Child" : person.type === "infant" ? "Infant" : "Adult",
                    };
                  })()}
                  passengers={flightTravellers.map((person, index) => ({
                    ...person,
                    label: `Passenger ${index + 1}`,
                    typeLabel: person.type === "child" ? "Child" : person.type === "infant" ? "Infant" : "Adult",
                  }))}
                  onSelectPassenger={setSsrPassengerId}
                  segments={flightSegments}
                  catalog={supplierSsr?.addOns || null}
                  includedBaggage={supplierSsr?.baggage || null}
                  selections={ssrSelections}
                  loading={ssrStatus === "loading"}
                  error={fareNotice}
                  airline={pricedItem.airline || ""}
                  basePayable={
                    (Number.isFinite(Number(couponPromo?.payable)) ? Number(couponPromo.payable) : totals.total || 0)
                    + ((Number(pricedItem.returnLeg?.quote?.amount) || 0) * Math.max(1, Number(pricedItem.paxCount) || 1))
                  }
                  payableCurrency={totals.currency || "INR"}
                  onClose={() => setSsrPassengerId(null)}
                  onChange={setSsrSelections}
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

              {service === "transfer" ? (
                <TransferPassengerForm
                  passengers={transferPassengers}
                  maxPassengers={item?.maxPassengers}
                  onChangePassenger={(id, patch) =>
                    setTransferPassengers((prev) =>
                      prev.map((person) =>
                        person.id === id ? { ...person, ...patch } : person,
                      ),
                    )
                  }
                  contact={contact}
                  onChangeContact={setContact}
                  errors={errors}
                  transferNotes={transferNotes}
                  onChangeNotes={setTransferNotes}
                  onOpenTravellers={
                    accountReady && getCurrentUser()
                      ? (person, index) => setPicker({ kind: "transfer", index })
                      : null
                  }
                />
              ) : null}

              <PromoCodeField
                service={service}
                searchId={item?.searchId || ""}
                offerId={
                  service === "flight"
                    ? pricedItem?.aplFareId || fareId || item?.id || ""
                    : service === "hotel"
                      ? selectedRoom?.id || ""
                      : item?.aplOfferId || item?.id || ""
                }
                passengers={
                  service === "flight"
                    ? payingPassengerCount({
                        travellers: flightTravellers,
                        searchQuery,
                        paxCount: pricedItem?.paxCount,
                      })
                    : 0
                }
                promo={couponPromo}
                onApply={setCouponPromo}
                onRemove={() => {
                  setCouponPromo(null);
                  if (service === "flight" && item?.searchId && item?.id) {
                    const fare = pricedItem?.aplFareId || fareId;
                    if (fare) {
                      void apiPost("/flights/revalidate", {
                        searchId: item.searchId,
                        aplFlightId: item.id,
                        aplFareId: fare,
                      }).catch(() => undefined);
                    }
                  }
                }}
              />

              {service === "flight" ? null : (
                <ExtrasSelector
                  extrasCatalog={extrasCatalog}
                  selectedIds={selectedExtraIds}
                  onToggle={toggleExtra}
                  nights={nights}
                />
              )}

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
              fareLabel={service === "flight" ? activeFare?.label || "" : ""}
              onContinue={handleContinue}
              continueLabel={service === "transfer" ? "Continue to Payment" : "Continue to checkout"}
              addonsAmount={flightAddOns.amount}
              returnAmount={
                service === "flight"
                  ? (Number(pricedItem.returnLeg?.quote?.amount) || 0) *
                    Math.max(1, Number(pricedItem.paxCount) || 1)
                  : 0
              }
              coupon={
                couponPromo?.code
                  ? {
                      code: couponPromo.code,
                      amount: Number(couponPromo.amount) || 0,
                      currency: couponPromo.currency,
                      payable: Number(couponPromo.payable),
                      automaticDiscount: Number(couponPromo.automaticDiscount) || 0,
                    }
                  : null
              }
            />
          </div>
        </div>
      </div>
      {service === "bus" && item ? (
        <BusPointsModal
          open={pointsOpen}
          item={item}
          searchQuery={searchQuery}
          initial={busPoints}
          onClose={() => setPointsOpen(false)}
          onContinue={(selection) => {
            saveBusPoints(item.searchId, item.id, selection);
            setBusPoints({ searchId: item.searchId, busId: item.id, ...selection });
            setPointsOpen(false);
          }}
        />
      ) : null}
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

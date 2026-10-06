"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutProgress, CheckoutShell } from "@/components/checkout/CheckoutShell";
import BookingSummaryCard, {
  TravellerReview,
} from "@/components/checkout/BookingSummaryCard";
import { PromoCodeField, WalletCredit } from "@/components/checkout/PromoWallet";
import PaymentMethods from "@/components/checkout/PaymentMethods";
import { CheckoutPricePanel, FinalReview } from "@/components/checkout/FinalReview";
import {
  buildResultsReturnHref,
  calcBookingTotals,
  findResultById,
  loadBookingDraft,
  nightsFromSearch,
  saveBookingDraft,
  BOOKING_EXTRAS,
  getHotelRooms,
} from "@/lib/booking";
import {
  withSelectedFare,
  selectedFareSnapshot,
  payingPassengerCount,
} from "@/lib/fareSelection";
import {
  calcCheckoutPayable,
  getWalletBalance,
} from "@/lib/checkoutPricing";
import { simulateMockPayment, validateCardFields } from "@/lib/mockPayment";
import { bookFlightStay, bookHotelStay, bookBusStay, bookTransferStay } from "@/lib/api/booking";
import { applySavedTraveller, fetchSavedTravellers } from "@/lib/api/travellers";
import TravellerPickerModal from "@/components/booking/TravellerPickerModal";
import { isValidAge, ageFromDob } from "@/components/booking/TravellerForms";
import { getCurrentUser } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import {
  clearBookingDraft,
  generateBookingReference,
  saveConfirmation,
} from "@/lib/confirmation";
import { getActiveMarketId } from "@/data/markets";

function buildDetailsHref(service, searchParams, draft) {
  const path =
    service === "flight"
      ? "flights"
      : service === "hotel"
        ? "hotels"
        : service === "transfer"
          ? "transfers"
          : "buses";
  const params = new URLSearchParams(searchParams.toString());
  if (draft?.id) params.set("id", draft.id);
  if (draft?.selectedFareId) params.set("fareId", draft.selectedFareId);
  return `/${path}/details?${params.toString()}`;
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = getActiveMarketId();
  const [draft, setDraft] = useState(null);
  const [ready, setReady] = useState(false);

  const [promo, setPromo] = useState(null);
  const [usedCodes, setUsedCodes] = useState([]);
  const [walletApplied, setWalletApplied] = useState(0);
  const [method, setMethod] = useState("upi");
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [forceFail, setForceFail] = useState(false);
  const [accepted, setAccepted] = useState({
    terms: false,
    cancellation: false,
    privacy: false,
  });
  const [errors, setErrors] = useState({});
  const [payError, setPayError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [savedTravellers, setSavedTravellers] = useState([]);
  const [picker, setPicker] = useState(null);
  const payingRef = useRef(false);
  const { user: accountUser } = useAuth();

  useEffect(() => {
    const loaded = loadBookingDraft();
    const user = getCurrentUser();
    let next = loaded;
    if (next) {
      const fareId =
        next.selectedFareId ||
        searchParams.get("fareId") ||
        next.selectedFare?.id ||
        "";
      if (next.service === "flight" && next.id) {
        const catalogItem = findResultById("flight", next.id);
        if (catalogItem) {
          const priced = withSelectedFare(catalogItem, fareId);
          const fareSnap =
            next.selectedFare || selectedFareSnapshot(catalogItem, fareId);
          const nights = nightsFromSearch(next.searchQuery);
          const room =
            next.service === "hotel"
              ? getHotelRooms(next.id).find((entry) => entry.id === next.selectedRoomId)
              : null;
          const extrasCatalog = BOOKING_EXTRAS.flight || [];
          const selectedExtras = extrasCatalog.filter((extra) =>
            (next.extras || []).includes(extra.id),
          );
          const totals = calcBookingTotals({
            service: "flight",
            item: priced || catalogItem,
            room,
            selectedExtras,
            nights,
            marketId,
            seatCount: 1,
            discount: 0,
          });
          next = {
            ...next,
            selectedFareId: fareSnap?.id || fareId || next.selectedFareId || null,
            selectedFare: fareSnap,
            totals,
            apiBooking: next.apiBooking
              ? {
                  ...next.apiBooking,
                  aplFareId:
                    priced?.aplFareId ||
                    fareSnap?.aplFareId ||
                    next.apiBooking.aplFareId ||
                    null,
                  quote: priced?.quote || fareSnap?.quote || next.apiBooking.quote,
                  selectedFareQuote:
                    fareSnap?.quote ||
                    priced?.quote ||
                    next.apiBooking.selectedFareQuote ||
                    next.apiBooking.quote,
                  fareLabel: fareSnap?.label || next.apiBooking.fareLabel || null,
                }
              : next.apiBooking,
          };
        }
      }
      if (user) {
        next = {
          ...next,
          contact: {
            email: next.contact?.email || user.email || "",
            phone: next.contact?.phone || user.phone || "",
          },
          bookedForUserId: user.id,
        };
      }
      saveBookingDraft(next);
    }
    setDraft(next);
    setReady(true);
    if (user) {
      fetchSavedTravellers()
        .then((rows) => setSavedTravellers(rows))
        .catch(() => setSavedTravellers([]));
    }
  }, []);

  function chooseSavedTraveller(saved) {
    if (!picker) return;
    setDraft((prev) => {
      if (!prev) return prev;
      let next = prev;
      if (picker.kind === "flight") {
        next = {
          ...prev,
          travellers: (prev.travellers || []).map((person, index) =>
            index === picker.index ? applySavedTraveller(person, saved) : person,
          ),
        };
      } else if (picker.kind === "hotel") {
        next = {
          ...prev,
          travellers: {
            ...prev.travellers,
            lead: {
              ...(prev.travellers?.lead || {}),
              firstName: saved.firstName || "",
              lastName: saved.lastName || "",
              age: ageFromDob(saved.dateOfBirth),
            },
          },
        };
      } else if (
        (picker.kind === "bus" || picker.kind === "transfer") &&
        Array.isArray(prev.travellers)
      ) {
        next = {
          ...prev,
          travellers: prev.travellers.map((person, index) =>
            index === picker.index
              ? {
                  ...person,
                  firstName: saved.firstName || "",
                  lastName: saved.lastName || "",
                  age: ageFromDob(saved.dateOfBirth),
                }
              : person,
          ),
        };
      } else {
        next = {
          ...prev,
          travellers: {
            ...prev.travellers,
            firstName: saved.firstName || "",
            lastName: saved.lastName || "",
          },
        };
      }
      saveBookingDraft(next);
      return next;
    });
    setPicker(null);
  }

  const service = draft?.service || searchParams.get("service") || "";
  const id = draft?.id || searchParams.get("id") || "";
  const catalogItem = service && id ? findResultById(service, id) : null;
  const fareId =
    draft?.selectedFareId ||
    searchParams.get("fareId") ||
    draft?.selectedFare?.id ||
    "";
  const item =
    service === "flight" && catalogItem
      ? withSelectedFare(catalogItem, fareId) || catalogItem
      : catalogItem;
  const nights = nightsFromSearch(draft?.searchQuery);
  const walletBalance = getWalletBalance(marketId);

  const payable = useMemo(() => {
    if (!draft || !service) {
      return calcCheckoutPayable({
        draftTotals: { base: 0, taxes: 0 },
        service: "flight",
        selectedExtraIds: [],
        marketId,
      });
    }
    return calcCheckoutPayable({
      draftTotals: draft.totals,
      service,
      selectedExtraIds: draft.extras || [],
      nights,
      promo,
      walletApplied,
      marketId,
    });
  }, [draft, service, nights, promo, walletApplied, marketId]);

  const maxWallet = Math.min(
    walletBalance,
    Math.max(
      0,
      payable.base + payable.taxes + payable.serviceFee + payable.extras - payable.discount,
    ),
  );

  useEffect(() => {
    if (walletApplied > maxWallet) setWalletApplied(maxWallet);
  }, [walletApplied, maxWallet]);

  if (!ready) {
    return (
      <CheckoutShell>
        <div className="container-page checkout-page">
          <p className="section-copy">Loading checkout…</p>
        </div>
      </CheckoutShell>
    );
  }

  if (!draft || !item) {
    return (
      <CheckoutShell>
        <div className="container-page checkout-page">
          <CheckoutProgress current="payment" backHref="/" />
          <div className="booking-not-found">
            <h1 className="section-title">Checkout session missing</h1>
            <p className="section-copy">
              We couldn’t find your booking draft. This can happen after a long
              pause, private browsing, or opening checkout directly. Start again
              from search results.
            </p>
            <div className="checkout-actions">
              <Link className="btn-primary" href="/">
                Back to search
              </Link>
              <Link
                className="btn-ghost"
                href={buildResultsReturnHref(service || "flight", {})}
              >
                Browse results
              </Link>
            </div>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  const detailsHref = buildDetailsHref(service, searchParams, draft);
  const resultsHref = buildResultsReturnHref(service, draft.searchQuery);
  const payLabel = `Pay Now · ${payable.totalPayableLabel}`;

  function validateCheckout() {
    const next = {};
    if (service === "hotel") {
      if (!isValidAge(draft?.travellers?.lead?.age)) next.leadAge = "Enter age";
      (draft?.travellers?.additional || []).forEach((guest) => {
        if (!isValidAge(guest.age)) next[`addAge-${guest.id}`] = "Enter age";
      });
    }
    if (service === "bus" && Array.isArray(draft?.travellers)) {
      draft.travellers.forEach((person, index) => {
        if (!isValidAge(person.age)) next[`age-${person.seat || index}`] = "Enter age";
      });
    }
    if (method === "card") {
      Object.assign(next, validateCardFields(card));
    }
    if (!accepted.terms || !accepted.cancellation || !accepted.privacy) {
      next.legal = "Please accept the required policies to continue";
    }
    setErrors(next);
    return next;
  }

  function changePassengerAge(change) {
    setDraft((prev) => {
      if (!prev) return prev;
      let travellers = prev.travellers;
      if (change.kind === "hotel-lead") {
        travellers = {
          ...prev.travellers,
          lead: { ...(prev.travellers?.lead || {}), age: change.age },
        };
      } else if (change.kind === "hotel-guest") {
        travellers = {
          ...prev.travellers,
          additional: (prev.travellers?.additional || []).map((guest) =>
            guest.id === change.id ? { ...guest, age: change.age } : guest,
          ),
        };
      } else if (
        (change.kind === "bus" || change.kind === "transfer") &&
        Array.isArray(prev.travellers)
      ) {
        travellers = prev.travellers.map((person, index) =>
          (change.seat ? person.seat === change.seat : index === change.index)
            ? { ...person, age: change.age }
            : person,
        );
      }
      const next = { ...prev, travellers };
      saveBookingDraft(next);
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      if (change.kind === "hotel-lead") delete next.leadAge;
      if (change.kind === "hotel-guest") delete next[`addAge-${change.id}`];
      if (change.kind === "bus") delete next[`age-${change.seat || change.index}`];
      return next;
    });
  }

  async function handlePay() {
    if (payingRef.current || processing) return;
    setPayError("");
    const problems = validateCheckout();
    if (Object.keys(problems).length) {
      const needsAge = Object.keys(problems).some(
        (key) => key === "leadAge" || key.startsWith("addAge-") || key.startsWith("age-"),
      );
      setPayError(
        needsAge
          ? "Enter the age for every guest before paying."
          : "Please fix the highlighted fields before paying.",
      );
      document.getElementById(needsAge ? "checkout-guests" : "payment")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    payingRef.current = true;
    setProcessing(true);

    try {
      const signedInAccount = accountUser || getCurrentUser();
      const signedInTrip =
        (service === "flight" || service === "hotel" || service === "bus" || service === "transfer") &&
        signedInAccount;
      if (draft.apiBooking || signedInTrip) {
        const lead = draft.travellers?.lead || {};
        const extraGuests = (draft.travellers?.additional || [])
          .filter((guest) => guest.firstName?.trim() && guest.lastName?.trim())
          .map((guest) => ({
            type: "ADULT",
            title: "Mr",
            firstName: guest.firstName.trim(),
            lastName: guest.lastName.trim(),
          }));
        const cardNumber = String(card.number || "").replace(/\D/g, "");
        const payment =
          method === "card"
            ? {
                method: "CARD",
                cardNumber: forceFail ? `${cardNumber.slice(0, -4)}0000` : cardNumber,
              }
            : method === "upi"
              ? { method: "UPI" }
              : { method: "NETBANKING" };
        const accountBooking =
          draft.apiBooking?.kind
            ? draft.apiBooking
            : service === "flight" && item?.searchId && item?.aplFareId && item?.quote
              ? {
                  kind: "flight",
                  searchId: item.searchId,
                  aplFlightId: item.id,
                  aplFareId: item.aplFareId,
                  quote: item.quote,
                }
              : service === "hotel" && item?.searchId && draft.selectedRoomId
                ? {
                    kind: "hotel",
                    searchId: item.searchId,
                    aplHotelId: item.id,
                    aplRoomId: draft.selectedRoomId,
                    quote: item.apiRooms?.find((room) => room.id === draft.selectedRoomId)?.quote,
                  }
                : service === "bus" && item?.searchId && item?.quote
                  ? {
                      kind: "bus",
                      searchId: item.searchId,
                      aplBusId: item.id,
                      aplOfferId: item.aplOfferId || null,
                      quote: item.quote,
                      boardingPointCode: item.boardingPointCode,
                      droppingPointCode: item.droppingPointCode,
                      selectedSeats: draft.selectedSeat || [],
                    }
                  : service === "transfer" && item?.searchId && item?.quote
                    ? {
                        kind: "transfer",
                        searchId: item.searchId,
                        aplTransferId: item.id,
                        aplOfferId: item.aplOfferId || null,
                        quote: item.quote,
                        flightNumber: draft.transferNotes?.flightNumber || null,
                        pickupInstructions: draft.transferNotes?.pickupInstructions || null,
                      }
                    : null;
        if (
          (service === "flight" || service === "hotel" || service === "bus" || service === "transfer") &&
          signedInAccount &&
          !accountBooking?.quote
        ) {
          setPayError("This signed-in booking must be saved on your account. Search again, then pay.");
          setProcessing(false);
          payingRef.current = false;
          return;
        }
        const isFlight = accountBooking?.kind === "flight" || Boolean(accountBooking?.aplFlightId);
        const isBus = accountBooking?.kind === "bus" || Boolean(accountBooking?.aplBusId);
        const isTransfer =
          accountBooking?.kind === "transfer" || Boolean(accountBooking?.aplTransferId);
        const flightTravellers = (draft.travellers || []).map((person) => ({
          type: String(person.type || "adult").toUpperCase(),
          title: person.title || "Mr",
          firstName: person.firstName?.trim(),
          lastName: person.lastName?.trim(),
          dateOfBirth: person.dob || person.dateOfBirth,
          gender: person.gender,
          nationality: person.nationality || "IN",
          passportNumber: person.passport,
          passportExpiry: person.passportExpiry,
        }));
        const selectedQuote =
          draft.selectedFare?.quote ||
          accountBooking?.quote ||
          item?.quote ||
          null;
        const booked = isFlight
          ? await bookFlightStay({
                ...accountBooking,
                aplFareId:
                  accountBooking?.aplFareId ||
                  draft.selectedFare?.aplFareId ||
                  item?.aplFareId ||
                  null,
                quote: selectedQuote,
                selectedFareQuote: {
                  amount: Number(selectedQuote?.amount),
                  currency: selectedQuote?.currency || "INR",
                  label:
                    draft.selectedFare?.label ||
                    accountBooking?.fareLabel ||
                    item?.selectedFareLabel ||
                    undefined,
                },
                fareLabel:
                  draft.selectedFare?.label ||
                  accountBooking?.fareLabel ||
                  item?.selectedFareLabel ||
                  undefined,
                passengerCount: payingPassengerCount({
                  travellers: flightTravellers,
                  searchQuery: draft.searchQuery,
                  paxCount: item?.paxCount,
                }),
                extras: draft.extras || [],
                contact: draft.contact,
                travellers: flightTravellers,
                payment,
              })
          : isBus
            ? await bookBusStay({
                ...accountBooking,
                selectedSeats: draft.selectedSeat || accountBooking?.selectedSeats || [],
                boardingPointCode:
                  accountBooking?.boardingPointCode || item?.boardingPointCode,
                droppingPointCode:
                  accountBooking?.droppingPointCode || item?.droppingPointCode,
                quote: selectedQuote,
                contact: draft.contact,
                travellers: Array.isArray(draft.travellers) ? draft.travellers : [],
                payment,
              })
          : isTransfer
            ? await bookTransferStay({
                ...accountBooking,
                quote: selectedQuote,
                contact: draft.contact,
                travellers: Array.isArray(draft.travellers) ? draft.travellers : [],
                payment,
                flightNumber:
                  accountBooking?.flightNumber || draft.transferNotes?.flightNumber || null,
                pickupInstructions:
                  accountBooking?.pickupInstructions ||
                  draft.transferNotes?.pickupInstructions ||
                  null,
              })
          : await bookHotelStay({
                ...accountBooking,
                contact: draft.contact,
                guests: [
                  {
                    type: "ADULT",
                    title: "Mr",
                    firstName: lead.firstName?.trim(),
                    lastName: lead.lastName?.trim(),
                  },
                  ...extraGuests,
                ],
                guestCount: Math.max(1, Number(item?.paxCount) || 1),
                payment,
              });
        const reference = booked.aplBookingRef;
        saveConfirmation({
          reference,
          service,
          id: item.id,
          searchQuery: draft.searchQuery,
          travellers: draft.travellers,
          contact: draft.contact,
          extras: draft.extras || [],
          selectedRoomId: draft.selectedRoomId || null,
          selectedSeat: draft.selectedSeat || null,
          selectedFareId: draft.selectedFareId || fareId || null,
          selectedFare: draft.selectedFare || selectedFareSnapshot(catalogItem, fareId),
          payable,
          payment: {
            status: "paid",
            method,
            last4: payment.cardNumber ? payment.cardNumber.slice(-4) : null,
            paidAt: new Date().toISOString(),
          },
          bookingStatus: "confirmed",
          bookedForUserId: signedInAccount?.id || null,
          airline: item.airline || "",
          createdAt: new Date().toISOString(),
        });
        clearBookingDraft();
        router.push(`/booking-confirmation?ref=${encodeURIComponent(reference)}`);
        return;
      }

      const result = await simulateMockPayment({
        method,
        card: method === "card" ? card : null,
        forceFail,
      });

      if (!result.ok) {
        setPayError(result.message);
        setProcessing(false);
        payingRef.current = false;
        return;
      }

      const reference = generateBookingReference();
      const confirmation = {
        reference,
        service,
        id: item.id,
        searchQuery: draft.searchQuery,
        travellers: draft.travellers,
        contact: draft.contact,
        extras: draft.extras || [],
        selectedRoomId: draft.selectedRoomId || null,
        selectedSeat: draft.selectedSeat || null,
        selectedFareId: draft.selectedFareId || fareId || null,
        selectedFare: draft.selectedFare || selectedFareSnapshot(catalogItem, fareId),
        payable,
        payment: {
          status: "paid",
          method: result.method,
          last4: result.last4,
          paidAt: new Date().toISOString(),
        },
        bookingStatus: "confirmed",
        bookedForUserId: signedInAccount?.id || null,
        airline: item.airline || "",
        createdAt: new Date().toISOString(),
      };

      saveConfirmation(confirmation);
      clearBookingDraft();

      router.push(`/booking-confirmation?ref=${encodeURIComponent(reference)}`);
    } catch (error) {
      setPayError(error?.message || "The booking could not be confirmed. Please try again.");
      setProcessing(false);
      payingRef.current = false;
    }
  }

  return (
    <CheckoutShell>
      <div className="checkout-page">
        <div className="container-page checkout-page-inner">
          <CheckoutProgress current="payment" backHref={detailsHref} />
          <h1 className="section-title">Secure checkout</h1>
          <p className="section-copy">
            {getCurrentUser()
              ? "You are signed in. Payment saves this trip on your account."
              : "Review your trip, then complete payment."}
          </p>

          <div className="booking-layout">
            <div className="booking-main">
              <CheckoutPricePanel
                variant="mobile"
                payable={payable}
                nights={service === "hotel" ? nights : 1}
                payLabel={payLabel}
                onPay={handlePay}
                disabled={processing}
                processing={processing}
                fareLabel={
                  service === "flight"
                    ? draft.selectedFare?.label || item.selectedFareLabel || ""
                    : ""
                }
                onQuickMethod={setMethod}
              />
              <BookingSummaryCard
                service={service}
                item={item}
                draft={draft}
                detailsHref={detailsHref}
                resultsHref={resultsHref}
              />
              <TravellerReview
                service={service}
                draft={draft}
                detailsHref={detailsHref}
                onChangeContact={(contact) => {
                  setDraft((prev) => {
                    if (!prev) return prev;
                    const next = { ...prev, contact };
                    saveBookingDraft(next);
                    return next;
                  });
                }}
                onChooseTraveller={accountUser || getCurrentUser() ? setPicker : undefined}
                onChangeAge={changePassengerAge}
                ageErrors={errors}
              />
              <PromoCodeField
                promo={promo}
                usedCodes={usedCodes}
                onApply={(nextPromo) => {
                  setPromo(nextPromo);
                  setUsedCodes((prev) =>
                    prev.includes(nextPromo.code) ? prev : [...prev, nextPromo.code],
                  );
                }}
                onRemove={() => {
                  if (promo?.code) {
                    setUsedCodes((prev) => prev.filter((c) => c !== promo.code));
                  }
                  setPromo(null);
                }}
              />
              <WalletCredit
                balance={walletBalance}
                applied={walletApplied}
                maxApplicable={maxWallet || walletBalance}
                onChangeApplied={setWalletApplied}
              />
              <PaymentMethods
                method={method}
                onMethodChange={setMethod}
                card={card}
                onCardChange={setCard}
                errors={errors}
                forceFail={forceFail}
                onForceFailChange={setForceFail}
              />
              <FinalReview
                service={service}
                item={item}
                draft={draft}
                payableLabel={payable.totalPayableLabel}
                accepted={accepted}
                onAcceptedChange={setAccepted}
                errors={errors}
              />

              {payError ? (
                <p className="field-error checkout-pay-error" role="alert">
                  {payError}
                </p>
              ) : null}
            </div>

            <CheckoutPricePanel
              variant="desktop"
              payable={payable}
              nights={service === "hotel" ? nights : 1}
              payLabel={payLabel}
              onPay={handlePay}
              disabled={processing}
              processing={processing}
              fareLabel={
                service === "flight"
                  ? draft.selectedFare?.label || item.selectedFareLabel || ""
                  : ""
              }
              onQuickMethod={setMethod}
            />
          </div>
        </div>
      </div>
      <TravellerPickerModal
        open={Boolean(picker)}
        travellers={savedTravellers}
        typeFilter={picker?.type || ""}
        onClose={() => setPicker(null)}
        onSelect={chooseSavedTraveller}
      />
    </CheckoutShell>
  );
}

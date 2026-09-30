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
  findResultById,
  loadBookingDraft,
  nightsFromSearch,
  saveBookingDraft,
} from "@/lib/booking";
import {
  calcCheckoutPayable,
  getWalletBalance,
} from "@/lib/checkoutPricing";
import { simulateMockPayment, validateCardFields } from "@/lib/mockPayment";
import { bookFlightStay, bookHotelStay } from "@/lib/api/booking";
import { applySavedTraveller, fetchSavedTravellers } from "@/lib/api/travellers";
import TravellerPickerModal from "@/components/booking/TravellerPickerModal";
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
    service === "flight" ? "flights" : service === "hotel" ? "hotels" : "buses";
  const params = new URLSearchParams(searchParams.toString());
  if (draft?.id) params.set("id", draft.id);
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
  const [method, setMethod] = useState("card");
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
    if (loaded && user) {
      loaded.contact = {
        email: loaded.contact?.email || user.email || "",
        phone: loaded.contact?.phone || user.phone || "",
      };
      loaded.bookedForUserId = user.id;
      saveBookingDraft(loaded);
    }
    setDraft(loaded);
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
            },
          },
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
  const item = service && id ? findResultById(service, id) : null;
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
          <CheckoutProgress current="payment" />
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
  const payLabel = `Pay ${payable.totalPayableLabel} securely`;

  function validateCheckout() {
    const next = {};
    if (method === "card") {
      Object.assign(next, validateCardFields(card));
    }
    if (!accepted.terms || !accepted.cancellation || !accepted.privacy) {
      next.legal = "Please accept the required policies to continue";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePay() {
    if (payingRef.current || processing) return;
    setPayError("");
    if (!validateCheckout()) {
      setPayError("Please fix the highlighted fields before paying.");
      document.getElementById("payment")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    payingRef.current = true;
    setProcessing(true);

    try {
      const signedInAccount = accountUser || getCurrentUser();
      const signedInTrip = (service === "flight" || service === "hotel") && signedInAccount;
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
                : null;
        if ((service === "flight" || service === "hotel") && signedInAccount && !accountBooking?.quote) {
          setPayError("This signed-in booking must be saved on your account. Search again, then pay.");
          setProcessing(false);
          payingRef.current = false;
          return;
        }
        const isFlight = accountBooking?.kind === "flight" || Boolean(accountBooking?.aplFlightId);
        const booked = isFlight
          ? await bookFlightStay({
                ...accountBooking,
                passengerCount: Math.max(
                  1,
                  Number(item?.paxCount) || (draft.travellers || []).length || 1,
                ),
                contact: draft.contact,
                travellers: (draft.travellers || []).map((person) => ({
                  type: String(person.type || "adult").toUpperCase(),
                  title: person.title || "Mr",
                  firstName: person.firstName?.trim(),
                  lastName: person.lastName?.trim(),
                  dateOfBirth: person.dob || person.dateOfBirth,
                  gender: person.gender,
                  nationality: person.nationality || "IN",
                  passportNumber: person.passport,
                  passportExpiry: person.passportExpiry,
                })),
                payment,
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
          <CheckoutProgress current="payment" />
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

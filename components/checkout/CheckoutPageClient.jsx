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
} from "@/lib/booking";
import {
  calcCheckoutPayable,
  getWalletBalance,
} from "@/lib/checkoutPricing";
import { simulateMockPayment, validateCardFields } from "@/lib/mockPayment";
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
    country: "",
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
  const payingRef = useRef(false);

  useEffect(() => {
    const loaded = loadBookingDraft();
    setDraft(loaded);
    setReady(true);
  }, []);

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
        createdAt: new Date().toISOString(),
      };

      saveConfirmation(confirmation);
      clearBookingDraft();

      router.push(`/booking-confirmation?ref=${encodeURIComponent(reference)}`);
    } catch {
      setPayError("Unexpected mock payment error. Please try again.");
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
            Guest checkout — no account required. Review your trip, then complete payment.
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
    </CheckoutShell>
  );
}

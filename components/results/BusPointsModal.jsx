"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { apiPost } from "@/lib/api/client";
import { pointClock } from "@/lib/busPoints";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

function PointCard({ point, time, selected, onSelect }) {
  const place = [point.address, point.landmark].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      className={`bus-point-card ${selected ? "is-selected" : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={`bus-point-radio ${selected ? "is-on" : ""}`} aria-hidden="true" />
      <span>
        <strong>{point.name}</strong>
        <span className="bus-point-meta">{time || "Time at the stop"}</span>
        {place ? <span className="bus-point-place">{place}</span> : null}
      </span>
    </button>
  );
}

export default function BusPointsModal({
  open,
  item,
  searchQuery,
  initial,
  onClose,
  onContinue,
}) {
  const titleId = useId();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [points, setPoints] = useState({ boarding: [], dropping: [] });
  const [boardingCode, setBoardingCode] = useState("");
  const [droppingCode, setDroppingCode] = useState("");
  const marketId = getActiveMarketId();

  useEffect(() => {
    if (!open || !item?.searchId || !item?.id) return undefined;
    let cancelled = false;
    setStatus("loading");
    setError("");
    setBoardingCode(initial?.boarding?.code || "");
    setDroppingCode(initial?.dropping?.code || "");
    apiPost("/buses/details", {
      searchId: item.searchId,
      aplBusId: item.id,
      aplOfferId: item.aplOfferId || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        const boarding = Array.isArray(data?.boardingPoints) ? data.boardingPoints : [];
        const dropping = Array.isArray(data?.droppingPoints) ? data.droppingPoints : [];
        setPoints({ boarding, dropping });
        setBoardingCode((current) => (boarding.some((point) => point.code === current) ? current : ""));
        setDroppingCode((current) => (dropping.some((point) => point.code === current) ? current : ""));
        setStatus(boarding.length || dropping.length ? "ready" : "empty");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Boarding points could not be loaded");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [open, item?.searchId, item?.id, item?.aplOfferId, initial?.boarding?.code, initial?.dropping?.code, attempt]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const boarding = points.boarding.find((point) => point.code === boardingCode) || null;
  const dropping = points.dropping.find((point) => point.code === droppingCode) || null;
  const ready = Boolean(boarding && dropping);

  return createPortal(
    <div className="bus-points-backdrop" onClick={onClose}>
      <div
        className="bus-points-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bus-points-head">
          <div>
            <p className="result-card-kicker">{item?.operator}</p>
            <h2 id={titleId}>{item?.from?.city} → {item?.to?.city}</h2>
            <p className="bus-point-meta">
              {formatShortDate(searchQuery?.date, marketId)} · {item?.from?.time} – {item?.to?.time}
            </p>
          </div>
          <button type="button" className="bus-points-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="bus-points-body">
          {status === "loading" ? <p className="booking-section-copy">Loading boarding and dropping points…</p> : null}
          {status === "error" ? (
            <div>
              <p className="field-error">{error}</p>
              <button type="button" className="btn-ghost" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          ) : null}
          {status === "empty" ? <p className="booking-section-copy">This bus has no boarding or dropping points yet.</p> : null}
          {status === "ready" ? (
            <div className="bus-points-columns">
              <section>
                <h3>Boarding point</h3>
                {points.boarding.map((point) => (
                  <PointCard
                    key={point.code}
                    point={point}
                    time={pointClock(item?.from?.time, point)}
                    selected={point.code === boardingCode}
                    onSelect={() => setBoardingCode(point.code)}
                  />
                ))}
              </section>
              <section>
                <h3>Dropping point</h3>
                {points.dropping.map((point) => (
                  <PointCard
                    key={point.code}
                    point={point}
                    time={pointClock(item?.to?.time, point)}
                    selected={point.code === droppingCode}
                    onSelect={() => setDroppingCode(point.code)}
                  />
                ))}
              </section>
            </div>
          ) : null}
        </div>
        <footer className="bus-points-foot">
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            onClick={() => ready && onContinue({ boarding, dropping })}
          >
            Continue to Seat Selection
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

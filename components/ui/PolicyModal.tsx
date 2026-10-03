"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { POLICY_DOCUMENTS } from "@/data/policies";

export type PolicyId = keyof typeof POLICY_DOCUMENTS;

type PolicyModalProps = {
  open: boolean;
  policyId: PolicyId | null;
  onClose: () => void;
};

export default function PolicyModal({ open, policyId, onClose }: PolicyModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const policy = policyId ? POLICY_DOCUMENTS[policyId] : null;

  useEffect(() => {
    if (!open) return undefined;
    function focusables() {
      if (!dialogRef.current) return [] as HTMLElement[];
      return Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open || !policy || typeof document === "undefined") return null;

  return createPortal(
    <div className="policy-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="policy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="policy-modal-header">
          <div>
            <h2 id={titleId} className="policy-modal-title">
              {policy.title}
            </h2>
            <p className="policy-modal-subtitle">{policy.subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="policy-modal-close"
            aria-label="Close policy"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="policy-modal-body">
          {policy.sections.map((section) => (
            <section key={section.heading} className="policy-modal-section">
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <footer className="policy-modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            I understand
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

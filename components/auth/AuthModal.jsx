"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import AuthForms from "@/components/auth/AuthForms";

export default function AuthModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    function onKey(event) {
      if (event.key === "Escape") onClose();
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-aurora" aria-hidden="true">
        <span className="auth-orb auth-orb-teal" />
        <span className="auth-orb auth-orb-amber" />
        <span className="auth-orb auth-orb-coral" />
        <span className="auth-orb auth-orb-sky" />
      </div>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-modal-banner">
          <span className="auth-modal-banner-sheen" aria-hidden="true" />
          <span className="auth-modal-spark auth-modal-spark-a" aria-hidden="true" />
          <span className="auth-modal-spark auth-modal-spark-b" aria-hidden="true" />
          <span className="auth-modal-spark auth-modal-spark-c" aria-hidden="true" />
          <p className="auth-modal-brand">APL Travel</p>
          <button type="button" className="auth-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="auth-modal-body">
          <AuthForms onSuccess={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

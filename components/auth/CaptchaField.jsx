"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";

export function useCaptcha() {
  const [captcha, setCaptcha] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setAnswer("");
    try {
      const data = await apiGet("/auth/captcha");
      setCaptcha(data?.captchaId && data?.image ? data : null);
      if (!data?.captchaId) setLoadError("Could not load the security check");
    } catch (error) {
      setCaptcha(null);
      setLoadError(error.message || "Could not load the security check");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { captcha, answer, setAnswer, refresh, loading, loadError };
}

export default function CaptchaField({ captcha, answer, onAnswer, onRefresh, loading, loadError }) {
  return (
    <div className="captcha-block">
      <span className="field-label">Security check</span>
      <div className="captcha-row">
        {captcha?.image ? (
          <img className="captcha-image" src={captcha.image} alt="Characters to type" />
        ) : (
          <span className="captcha-image captcha-image-empty">
            {loading ? "Loading…" : "Image unavailable"}
          </span>
        )}
        <button type="button" className="captcha-refresh" onClick={onRefresh}>
          New image
        </button>
      </div>
      <input
        className="field-input"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Type every character exactly"
        value={answer}
        onChange={(event) => onAnswer(event.target.value)}
      />
      <p className="dev-note">Match capitals, small letters, numbers, and symbols exactly.</p>
      {loadError ? <p className="field-error">{loadError}</p> : null}
    </div>
  );
}

"use client";

import Link from "next/link";

export function ResultsLoading({ count = 4 }) {
  return (
    <div className="results-list" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="result-skeleton" />
      ))}
    </div>
  );
}

export function ResultsEmpty({ title, description, actions = [] }) {
  return (
    <div className="results-empty" role="status">
      <h2 className="results-empty-title">{title}</h2>
      <p className="results-empty-copy">{description}</p>
      {actions.length ? (
        <div className="results-empty-actions">
          {actions.map((action) =>
            action.href ? (
              <Link key={action.label} className={action.primary ? "btn-primary" : "btn-ghost"} href={action.href}>
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className={action.primary ? "btn-primary" : "btn-ghost"}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ResultsError({ message, onRetry }) {
  return (
    <div className="results-error" role="alert">
      <h2 className="results-empty-title">Something went wrong</h2>
      <p className="results-empty-copy">{message}</p>
      <button type="button" className="btn-primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

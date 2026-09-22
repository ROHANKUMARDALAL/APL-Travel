"use client";

export default function SearchSummary({
  title,
  primary,
  secondary,
  onModify,
  modifyOpen,
}) {
  return (
    <div className="search-summary">
      <div className="search-summary-text">
        <p className="search-summary-eyebrow">{title}</p>
        <h1 className="search-summary-title">{primary}</h1>
        <p className="search-summary-meta">{secondary}</p>
      </div>
      <button
        type="button"
        className="btn-secondary search-summary-modify"
        aria-expanded={modifyOpen}
        onClick={onModify}
      >
        {modifyOpen ? "Close" : "Modify search"}
      </button>
    </div>
  );
}

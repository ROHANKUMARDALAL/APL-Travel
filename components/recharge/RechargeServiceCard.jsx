export default function RechargeServiceCard({ item, selected, onSelect, tone = 1 }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={selected ? "rch-card is-selected" : "rch-card"}
    >
      <span className={`rch-icon rch-tone-${tone}`} aria-hidden="true">{item.mark}</span>
      <span className="rch-card-title">{item.label}</span>
      <span className="rch-card-copy">{item.description}</span>
    </button>
  );
}

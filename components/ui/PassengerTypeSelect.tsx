"use client";

import ChoiceSelect, { type ChoiceOption } from "@/components/ui/ChoiceSelect";
import { TRAVELLER_TYPES } from "@/lib/travellerAge";

export type PassengerType = "adult" | "child" | "infant";

type PassengerTypeSelectProps = {
  id?: string;
  label?: string;
  value: PassengerType;
  onChange: (value: PassengerType) => void;
  disabled?: boolean;
};

function TypeIcon({ type }: { type: string }) {
  if (type === "child") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M12 3.5 13.2 7h3.7l-3 2.3 1.1 3.7L12 11.2 8.9 13l1.2-3.7-3-2.3h3.7L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 16.5c1.2 1.2 2.5 1.8 4 1.8s2.8-.6 4-1.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "infant") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M12 20s-6-3.8-6-8.2A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 6 2.8C18 16.2 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.1-7 4.5V20h14v-1.5C19 16.1 16.2 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

const OPTIONS: ChoiceOption<PassengerType>[] = TRAVELLER_TYPES.map((row) => ({
  value: row.value as PassengerType,
  label: row.label,
  description: row.description,
  icon: <TypeIcon type={row.value} />,
}));

export default function PassengerTypeSelect({
  id,
  label = "Passenger type",
  value,
  onChange,
  disabled = false,
}: PassengerTypeSelectProps) {
  return (
    <ChoiceSelect
      id={id}
      label={label}
      value={value}
      options={OPTIONS}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select type"
    />
  );
}

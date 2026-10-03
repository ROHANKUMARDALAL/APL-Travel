"use client";

import ChoiceSelect, { type ChoiceOption } from "@/components/ui/ChoiceSelect";
import { TITLE_OPTIONS } from "@/lib/travellerIdentity";

export type TravellerTitle = "Mr" | "Ms" | "Mrs" | "Miss" | "Mx";

type TitleSelectProps = {
  id?: string;
  value: TravellerTitle;
  onChange: (value: TravellerTitle) => void;
  disabled?: boolean;
};

function TitleGlyph({ value }: { value: string }) {
  return <span>{value}</span>;
}

const OPTIONS: ChoiceOption<TravellerTitle>[] = TITLE_OPTIONS.map((row) => ({
  value: row.value as TravellerTitle,
  label: row.label,
  description: row.description,
  icon: <TitleGlyph value={row.label} />,
}));

export default function TitleSelect({ id, value, onChange, disabled }: TitleSelectProps) {
  return (
    <ChoiceSelect
      id={id}
      label="Title"
      value={value}
      options={OPTIONS}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select title"
    />
  );
}

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type ChoiceOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
};

type ChoiceSelectProps<T extends string> = {
  id?: string;
  label?: string;
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChoiceSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select",
}: ChoiceSelectProps<T>) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((row) => row.value === value) || null;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="choice-select search-field" ref={rootRef}>
      {label ? (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        className={`choice-select-trigger ${open ? "is-open" : ""} ${!selected ? "is-placeholder" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="choice-select-trigger-main">
          {selected?.icon ? (
            <span className="choice-select-icon" aria-hidden="true">
              {selected.icon}
            </span>
          ) : null}
          <span className="choice-select-copy">
            <span className="choice-select-label">{selected?.label || placeholder}</span>
            {selected?.description ? (
              <span className="choice-select-sub">{selected.description}</span>
            ) : null}
          </span>
        </span>
        <span className="choice-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="choice-select-menu" role="listbox" aria-label={label || placeholder}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`choice-select-option ${active ? "is-selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.icon ? (
                  <span className="choice-select-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                ) : null}
                <span className="choice-select-copy">
                  <span className="choice-select-label">{option.label}</span>
                  {option.description ? (
                    <span className="choice-select-sub">{option.description}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

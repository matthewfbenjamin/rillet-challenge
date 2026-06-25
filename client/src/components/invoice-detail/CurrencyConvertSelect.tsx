import { Select } from "@mantine/core";
import { SUPPORTED_CURRENCIES } from "../../lib/fxRates";

interface CurrencyConvertSelectProps {
  value: string;
  onChange: (currency: string) => void;
}

const options = SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }));

export function CurrencyConvertSelect({ value, onChange }: CurrencyConvertSelectProps) {
  return (
    <Select
      data={options}
      value={value}
      onChange={(v) => v && onChange(v)}
      size="xs"
      w={80}
      aria-label="View totals in currency"
      allowDeselect={false}
      comboboxProps={{ width: 100 }}
    />
  );
}

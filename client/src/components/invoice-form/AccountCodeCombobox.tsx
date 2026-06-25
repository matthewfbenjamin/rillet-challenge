import { Combobox, InputBase, useCombobox } from "@mantine/core";
import { useState } from "react";
import { KNOWN_ACCOUNT_CODES } from "~shared/constants";

interface AccountCodeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const KNOWN_OPTIONS = KNOWN_ACCOUNT_CODES.map((ac) => ac.label);

export function AccountCodeCombobox({ value, onChange, error }: AccountCodeComboboxProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [search, setSearch] = useState(value);

  const filtered = KNOWN_OPTIONS.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const options = filtered.map((o) => (
    <Combobox.Option value={o} key={o}>
      {o}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        const code = val.split(" — ")[0];
        onChange(code);
        setSearch(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          placeholder="Account code"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            onChange(e.currentTarget.value.split(" — ")[0]);
            combobox.openDropdown();
          }}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value);
          }}
          error={error}
          size="xs"
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length > 0 ? options : <Combobox.Empty>No matching codes</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

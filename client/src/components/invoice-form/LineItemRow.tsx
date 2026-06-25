import { ActionIcon, Group, NumberInput, Table, Text, TextInput } from "@mantine/core";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { z } from "zod";
import type { CreateInvoiceSchema } from "~shared/schemas";
import { AccountCodeCombobox } from "./AccountCodeCombobox";
import { formatCurrency } from "../../lib/formatters";
import { useWatch } from "react-hook-form";

type FormValues = z.infer<typeof CreateInvoiceSchema>;

interface LineItemRowProps {
  index: number;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  onRemove: () => void;
  canRemove: boolean;
  currency: string;
}

export function LineItemRow({ index, control, errors, onRemove, canRemove, currency }: LineItemRowProps) {
  const qty = useWatch({ control, name: `lineItems.${index}.quantity` }) ?? 0;
  const price = useWatch({ control, name: `lineItems.${index}.unitPrice` }) ?? 0;
  const lineErrors = errors.lineItems?.[index];

  return (
    <Table.Tr>
      <Table.Td>
        <Controller
          control={control}
          name={`lineItems.${index}.description`}
          render={({ field }) => (
            <TextInput
              {...field}
              placeholder="Description"
              size="xs"
              error={lineErrors?.description?.message}
            />
          )}
        />
      </Table.Td>
      <Table.Td style={{ width: 100 }}>
        <Controller
          control={control}
          name={`lineItems.${index}.quantity`}
          render={({ field }) => (
            <NumberInput
              value={field.value}
              onChange={field.onChange}
              placeholder="0"
              min={0}
              size="xs"
              hideControls
              error={lineErrors?.quantity?.message}
            />
          )}
        />
      </Table.Td>
      <Table.Td style={{ width: 120 }}>
        <Controller
          control={control}
          name={`lineItems.${index}.unitPrice`}
          render={({ field }) => (
            <NumberInput
              value={field.value}
              onChange={field.onChange}
              placeholder="0.00"
              min={0}
              decimalScale={2}
              size="xs"
              hideControls
              error={lineErrors?.unitPrice?.message}
            />
          )}
        />
      </Table.Td>
      <Table.Td style={{ width: 180 }}>
        <Controller
          control={control}
          name={`lineItems.${index}.accountCode`}
          render={({ field }) => (
            <AccountCodeCombobox
              value={field.value}
              onChange={field.onChange}
              error={lineErrors?.accountCode?.message}
            />
          )}
        />
      </Table.Td>
      <Table.Td style={{ textAlign: "right", width: 120 }}>
        <Text fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatCurrency(qty * price, currency)}
        </Text>
      </Table.Td>
      <Table.Td style={{ width: 40 }}>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove line item"
        >
          ×
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

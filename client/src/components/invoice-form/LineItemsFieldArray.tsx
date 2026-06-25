import { Button, Table, Text } from "@mantine/core";
import { useFieldArray, type Control, type FieldErrors, useWatch } from "react-hook-form";
import { nanoid } from "nanoid";
import type { z } from "zod";
import type { CreateInvoiceSchema } from "~shared/schemas";
import { LineItemRow } from "./LineItemRow";

type FormValues = z.infer<typeof CreateInvoiceSchema>;

interface LineItemsFieldArrayProps {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
}

export function LineItemsFieldArray({ control, errors }: LineItemsFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const currency = useWatch({ control, name: "currency" }) as string ?? "USD";

  return (
    <>
      <Table withTableBorder withColumnBorders mb="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">Description</Table.Th>
            <Table.Th scope="col">Qty</Table.Th>
            <Table.Th scope="col">Unit Price</Table.Th>
            <Table.Th scope="col">Account Code</Table.Th>
            <Table.Th scope="col" style={{ textAlign: "right" }}>Amount</Table.Th>
            <Table.Th scope="col" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fields.map((field, index) => (
            <LineItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              currency={currency}
            />
          ))}
        </Table.Tbody>
      </Table>
      {errors.lineItems?.root?.message && (
        <Text c="red" fz="xs" mb="xs">{errors.lineItems.root.message}</Text>
      )}
      <Button
        variant="subtle"
        size="xs"
        onClick={() =>
          append({ id: nanoid(), description: "", quantity: 1, unitPrice: 0, accountCode: "" })
        }
      >
        + Add line item
      </Button>
    </>
  );
}

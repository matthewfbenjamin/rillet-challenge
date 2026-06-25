import {
  Button,
  Divider,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import type { z } from "zod";
import { CreateInvoiceSchema } from "~shared/schemas";
import { PAYMENT_TERMS_OPTIONS } from "~shared/constants";
import { SUPPORTED_CURRENCIES } from "../../lib/fxRates";
import { NeedsReviewHighlight } from "./NeedsReviewHighlight";
import { LineItemsFieldArray } from "./LineItemsFieldArray";
import { TotalsPanel } from "./TotalsPanel";

type FormValues = z.infer<typeof CreateInvoiceSchema>;

interface InvoiceFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  needsReview?: string[];
  isSubmitting: boolean;
}

const CURRENCY_OPTIONS = (SUPPORTED_CURRENCIES as string[]).map((c) => ({ value: c, label: c }));
const TERMS_OPTIONS = PAYMENT_TERMS_OPTIONS.map((t) => ({ value: t, label: t }));

const EMPTY_DEFAULTS: Partial<FormValues> = {
  currency: "USD",
  taxRate: 0,
  discount: 0,
  memo: "",
  lineItems: [{ id: "", description: "", quantity: 1, unitPrice: 0, accountCode: "" }],
};

export function InvoiceForm({
  mode,
  defaultValues,
  onSubmit,
  needsReview = [],
  isSubmitting,
}: InvoiceFormProps) {
  const navigate = useNavigate();
  const flagged = new Set(needsReview);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="lg">
        {/* Invoice Details */}
        <Stack gap="xs">
          <Title order={4}>Invoice Details</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NeedsReviewHighlight flagged={flagged.has("invoiceNumber")}>
                <TextInput
                  label="Invoice Number"
                  {...register("invoiceNumber")}
                  error={errors.invoiceNumber?.message}
                  readOnly={mode === "edit"}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NeedsReviewHighlight flagged={flagged.has("currency")}>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select
                      label="Currency"
                      data={CURRENCY_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.currency?.message}
                      allowDeselect={false}
                    />
                  )}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NeedsReviewHighlight flagged={flagged.has("customerName")}>
                <TextInput
                  label="Customer Name"
                  {...register("customerName")}
                  error={errors.customerName?.message}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NeedsReviewHighlight flagged={flagged.has("billingEmail")}>
                <TextInput
                  label="Billing Email"
                  type="email"
                  {...register("billingEmail")}
                  error={errors.billingEmail?.message}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={12}>
              <NeedsReviewHighlight flagged={flagged.has("billingAddress")}>
                <TextInput
                  label="Billing Address"
                  {...register("billingAddress")}
                  error={errors.billingAddress?.message}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NeedsReviewHighlight flagged={flagged.has("issueDate")}>
                <TextInput
                  label="Issue Date"
                  type="date"
                  {...register("issueDate")}
                  error={errors.issueDate?.message}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NeedsReviewHighlight flagged={flagged.has("dueDate")}>
                <TextInput
                  label="Due Date"
                  type="date"
                  {...register("dueDate")}
                  error={errors.dueDate?.message}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NeedsReviewHighlight flagged={flagged.has("paymentTerms")}>
                <Controller
                  control={control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <Select
                      label="Payment Terms"
                      data={TERMS_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.paymentTerms?.message}
                      allowDeselect={false}
                    />
                  )}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
          </Grid>
        </Stack>

        <Divider />

        {/* Line Items */}
        <Stack gap="xs">
          <Title order={4}>Line Items</Title>
          <LineItemsFieldArray control={control} errors={errors} />
        </Stack>

        <Divider />

        {/* Financials & Memo */}
        <Stack gap="xs">
          <Title order={4}>Financials & Memo</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NeedsReviewHighlight flagged={flagged.has("discount")}>
                <Controller
                  control={control}
                  name="discount"
                  render={({ field }) => (
                    <NumberInput
                      label="Discount"
                      value={field.value}
                      onChange={field.onChange}
                      min={0}
                      decimalScale={2}
                      error={errors.discount?.message}
                    />
                  )}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NeedsReviewHighlight flagged={flagged.has("taxRate")}>
                <Controller
                  control={control}
                  name="taxRate"
                  render={({ field }) => (
                    <NumberInput
                      label="Tax Rate (0–1)"
                      value={field.value}
                      onChange={field.onChange}
                      min={0}
                      max={1}
                      decimalScale={4}
                      step={0.01}
                      error={errors.taxRate?.message}
                    />
                  )}
                />
              </NeedsReviewHighlight>
            </Grid.Col>
          </Grid>
          <TotalsPanel control={control} />
          <NeedsReviewHighlight flagged={flagged.has("memo")}>
            <Textarea
              label="Memo"
              {...register("memo")}
              placeholder="Optional notes for this invoice"
              rows={3}
            />
          </NeedsReviewHighlight>
        </Stack>

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={() => navigate({ to: "/invoices" })}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {mode === "create" ? "Create Invoice" : "Save Changes"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

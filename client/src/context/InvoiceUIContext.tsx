import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { InvoiceListItem } from "~shared/types";

export type SortCol = keyof Pick<
  InvoiceListItem,
  "dueDate" | "customerName" | "invoiceNumber" | "updatedAt"
>;
type SortDir = "asc" | "desc";

interface InvoiceUIState {
  sortCol: SortCol;
  sortDir: SortDir;
  showVoided: boolean;
  filter: string;
}

type Action =
  | { type: "SET_SORT"; col: SortCol }
  | { type: "TOGGLE_VOIDED" }
  | { type: "SET_FILTER"; filter: string };

const initialState: InvoiceUIState = {
  sortCol: "dueDate",
  sortDir: "asc",
  showVoided: false,
  filter: "",
};

function reducer(state: InvoiceUIState, action: Action): InvoiceUIState {
  switch (action.type) {
    case "SET_SORT":
      if (state.sortCol === action.col) {
        return { ...state, sortDir: state.sortDir === "asc" ? "desc" : "asc" };
      }
      return { ...state, sortCol: action.col, sortDir: "asc" };
    case "TOGGLE_VOIDED":
      return { ...state, showVoided: !state.showVoided };
    case "SET_FILTER":
      return { ...state, filter: action.filter };
  }
}

const InvoiceUIContext = createContext<{
  state: InvoiceUIState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function InvoiceUIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <InvoiceUIContext.Provider value={{ state, dispatch }}>
      {children}
    </InvoiceUIContext.Provider>
  );
}

export function useInvoiceUI() {
  const ctx = useContext(InvoiceUIContext);
  if (!ctx) throw new Error("useInvoiceUI must be used within InvoiceUIProvider");
  return ctx;
}

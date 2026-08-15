import { useEffect, useMemo, useState } from "react";

export type PaymentMethod =
  | "Cash"
  | "Debit"
  | "Visa"
  | "Mastercard"
  | "Gift Card";

export type PaymentBill = {
  id: string;
  name: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

type PaymentRecord = {
  id: string;
  billId: string;
  method: PaymentMethod;
  amountCents: number;
  createdAt: string;
};

type PaymentScreenProps = {
  orderId: string;
  tableName: string;
  bills: PaymentBill[];
  onBack: () => void;
  onAllPaid: () => void;
};

const paymentMethods: PaymentMethod[] = [
  "Cash",
  "Debit",
  "Visa",
  "Mastercard",
  "Gift Card",
];

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function loadPayments(key: string): PaymentRecord[] {
  const saved = localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadNumberMap(key: string): Record<string, number> {
  const saved = localStorage.getItem(key);
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function PaymentScreen({
  orderId,
  tableName,
  bills,
  onBack,
  onAllPaid,
}: PaymentScreenProps) {
  const paymentStorageKey = `behesht-payments-${orderId}`;
  const tipStorageKey = `behesht-tips-${orderId}`;
  const gratuityStorageKey = `behesht-gratuity-${orderId}`;

  const [payments, setPayments] = useState<PaymentRecord[]>(
    () => loadPayments(paymentStorageKey)
  );

  const [tips, setTips] = useState<Record<string, number>>(
    () => loadNumberMap(tipStorageKey)
  );

  const [gratuities, setGratuities] = useState<Record<string, number>>(
    () => loadNumberMap(gratuityStorageKey)
  );

  const [selectedBillId, setSelectedBillId] = useState(
    bills[0]?.id ?? ""
  );

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("Visa");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [customTipPercent, setCustomTipPercent] = useState("");
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [customGratuityPercent, setCustomGratuityPercent] =
    useState("");
  const [customGratuityAmount, setCustomGratuityAmount] =
    useState("");

  useEffect(() => {
    localStorage.setItem(paymentStorageKey, JSON.stringify(payments));
  }, [paymentStorageKey, payments]);

  useEffect(() => {
    localStorage.setItem(tipStorageKey, JSON.stringify(tips));
  }, [tipStorageKey, tips]);

  useEffect(() => {
    localStorage.setItem(
      gratuityStorageKey,
      JSON.stringify(gratuities)
    );
  }, [gratuityStorageKey, gratuities]);

  const selectedBill =
    bills.find((bill) => bill.id === selectedBillId) ??
    bills[0] ??
    null;

  const paidForBill = (billId: string) =>
    payments
      .filter((payment) => payment.billId === billId)
      .reduce((sum, payment) => sum + payment.amountCents, 0);

  const billTip = (billId: string) => tips[billId] ?? 0;
  const billGratuity = (billId: string) => gratuities[billId] ?? 0;

  const billGrandTotal = (bill: PaymentBill) =>
    bill.totalCents +
    billTip(bill.id) +
    billGratuity(bill.id);

  const remainingForBill = (bill: PaymentBill) =>
    Math.max(0, billGrandTotal(bill) - paidForBill(bill.id));

  const allBillsPaid =
    bills.length > 0 &&
    bills.every((bill) => remainingForBill(bill) === 0);

  const totalBase = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.totalCents, 0),
    [bills]
  );

  const currentBillIds = useMemo(
    () => new Set(bills.map((bill) => bill.id)),
    [bills]
  );

  const totalTip = Object.entries(tips).reduce(
    (sum, [billId, value]) =>
      currentBillIds.has(billId) ? sum + value : sum,
    0
  );

  const totalGratuity = Object.entries(gratuities).reduce(
    (sum, [billId, value]) =>
      currentBillIds.has(billId) ? sum + value : sum,
    0
  );

  const totalPaid = payments.reduce(
    (sum, payment) =>
      currentBillIds.has(payment.billId)
        ? sum + payment.amountCents
        : sum,
    0
  );

  const grandTotal = totalBase + totalTip + totalGratuity;
  const totalRemaining = Math.max(0, grandTotal - totalPaid);

  const ensureAdjustmentAllowed = () => {
    if (!selectedBill) return false;

    const alreadyPaid = paidForBill(selectedBill.id);

    if (alreadyPaid > 0) {
      return window.confirm(
        "This bill already has a payment. Changing Tip or Gratuity will change the remaining balance. Continue?"
      );
    }

    return true;
  };

  const selectBill = (billId: string) => {
    setSelectedBillId(billId);

    const bill = bills.find((item) => item.id === billId);

    if (bill) {
      setPaymentAmount(
        (remainingForBill(bill) / 100).toFixed(2)
      );
    }

    setCustomTipPercent("");
    setCustomTipAmount("");
    setCustomGratuityPercent("");
    setCustomGratuityAmount("");
  };

  const applyTipPercent = (percent: number) => {
    if (!selectedBill || !ensureAdjustmentAllowed()) return;

    if (!Number.isFinite(percent) || percent < 0) {
      alert("Enter a valid Tip percentage.");
      return;
    }

    setTips((current) => ({
      ...current,
      [selectedBill.id]: Math.round(
        selectedBill.totalCents * (percent / 100)
      ),
    }));
  };

  const applyTipAmount = () => {
    if (!selectedBill || !ensureAdjustmentAllowed()) return;

    const amount = Number(customTipAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      alert("Enter a valid Tip amount.");
      return;
    }

    setTips((current) => ({
      ...current,
      [selectedBill.id]: Math.round(amount * 100),
    }));
  };

  const applyGratuityPercent = (percent: number) => {
    if (!selectedBill || !ensureAdjustmentAllowed()) return;

    if (!Number.isFinite(percent) || percent < 0) {
      alert("Enter a valid Gratuity percentage.");
      return;
    }

    setGratuities((current) => ({
      ...current,
      [selectedBill.id]: Math.round(
        selectedBill.subtotalCents * (percent / 100)
      ),
    }));
  };

  const applyGratuityAmount = () => {
    if (!selectedBill || !ensureAdjustmentAllowed()) return;

    const amount = Number(customGratuityAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      alert("Enter a valid Gratuity amount.");
      return;
    }

    setGratuities((current) => ({
      ...current,
      [selectedBill.id]: Math.round(amount * 100),
    }));
  };

  const clearTip = () => {
    if (!selectedBill || !ensureAdjustmentAllowed()) return;

    setTips((current) => ({
      ...current,
      [selectedBill.id]: 0,
    }));

    setCustomTipPercent("");
    setCustomTipAmount("");
  };

  const clearGratuity = () => {
    if (!selectedBill || !ensureAdjustmentAllowed()) return;

    setGratuities((current) => ({
      ...current,
      [selectedBill.id]: 0,
    }));

    setCustomGratuityPercent("");
    setCustomGratuityAmount("");
  };

  const addPayment = () => {
    if (!selectedBill) return;

    const remaining = remainingForBill(selectedBill);

    if (remaining <= 0) {
      alert("This bill is already paid.");
      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    const amountCents = Math.round(amount * 100);

    if (amountCents > remaining) {
      alert(`Maximum remaining amount is ${money(remaining)}.`);
      return;
    }

    const record: PaymentRecord = {
      id: `payment-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      billId: selectedBill.id,
      method: selectedMethod,
      amountCents,
      createdAt: new Date().toLocaleString(),
    };

    setPayments((current) => [...current, record]);

    const newRemaining = Math.max(0, remaining - amountCents);
    setPaymentAmount((newRemaining / 100).toFixed(2));
  };

  const payRemaining = () => {
    if (!selectedBill) return;

    const remaining = remainingForBill(selectedBill);
    if (remaining <= 0) return;

    setPaymentAmount((remaining / 100).toFixed(2));
  };

  const removePayment = (paymentId: string) => {
    if (!window.confirm("Remove this payment?")) return;

    setPayments((current) =>
      current.filter((payment) => payment.id !== paymentId)
    );
  };

  const billPayments = (billId: string) =>
    payments.filter((payment) => payment.billId === billId);

  const selectedRemaining = selectedBill
    ? remainingForBill(selectedBill)
    : 0;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <strong style={{ fontSize: 22 }}>Payment</strong>
          <div style={{ color: "#94A3B8", marginTop: 4 }}>
            {tableName}
          </div>
        </div>

        <button onClick={onBack} style={topButton}>
          ← Back to Split Bill
        </button>
      </div>

      <div style={layoutStyle}>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Bills</h3>

          {bills.map((bill) => {
            const remaining = remainingForBill(bill);
            const paid = remaining === 0;

            return (
              <button
                key={bill.id}
                onClick={() => selectBill(bill.id)}
                style={{
                  width: "100%",
                  minHeight: 80,
                  borderRadius: 10,
                  border:
                    selectedBillId === bill.id
                      ? "3px solid white"
                      : "1px solid #475569",
                  background: paid
                    ? "#14532D"
                    : selectedBillId === bill.id
                    ? "#1D4ED8"
                    : "#1E293B",
                  color: "white",
                  marginBottom: 9,
                  padding: 10,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={spaceBetween}>
                  <strong>{bill.name}</strong>
                  <strong>{money(billGrandTotal(bill))}</strong>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: paid ? "#BBF7D0" : "#CBD5E1",
                    fontSize: 12,
                  }}
                >
                  {paid
                    ? "✓ PAID"
                    : `Remaining ${money(remaining)}`}
                </div>
              </button>
            );
          })}
        </div>

        <div style={panelStyle}>
          {!selectedBill ? (
            <div style={emptyStyle}>No bill selected</div>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>{selectedBill.name}</h2>

              <SummaryRow
                label="Subtotal"
                cents={selectedBill.subtotalCents}
              />
              <SummaryRow
                label="Tax"
                cents={selectedBill.taxCents}
              />
              <SummaryRow
                label="Gratuity"
                cents={billGratuity(selectedBill.id)}
              />
              <SummaryRow
                label="Tip"
                cents={billTip(selectedBill.id)}
              />
              <SummaryRow
                label="Bill Total"
                cents={billGrandTotal(selectedBill)}
                bold
              />
              <SummaryRow
                label="Paid"
                cents={paidForBill(selectedBill.id)}
              />
              <SummaryRow
                label="Remaining"
                cents={selectedRemaining}
                bold
              />

              <div style={dividerStyle} />

              <h3>Gratuity</h3>

              <div style={buttonGrid}>
                {[18, 20, 22].map((percent) => (
                  <button
                    key={percent}
                    onClick={() =>
                      applyGratuityPercent(percent)
                    }
                    style={smallActionButton}
                  >
                    {percent}%
                  </button>
                ))}

                <button
                  onClick={clearGratuity}
                  style={smallActionButton}
                >
                  None
                </button>
              </div>

              <div style={customRow}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Custom %"
                  value={customGratuityPercent}
                  onChange={(event) =>
                    setCustomGratuityPercent(event.target.value)
                  }
                  style={inputStyle}
                />
                <button
                  onClick={() =>
                    applyGratuityPercent(
                      Number(customGratuityPercent)
                    )
                  }
                  style={applyButton}
                >
                  Apply %
                </button>
              </div>

              <div style={customRow}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="$ Amount"
                  value={customGratuityAmount}
                  onChange={(event) =>
                    setCustomGratuityAmount(event.target.value)
                  }
                  style={inputStyle}
                />
                <button
                  onClick={applyGratuityAmount}
                  style={{
                    ...applyButton,
                    background: "#7C3AED",
                  }}
                >
                  Apply $
                </button>
              </div>

              <h3>Tip</h3>

              <div style={buttonGrid}>
                {[15, 18, 20].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => applyTipPercent(percent)}
                    style={smallActionButton}
                  >
                    {percent}%
                  </button>
                ))}

                <button
                  onClick={clearTip}
                  style={smallActionButton}
                >
                  No Tip
                </button>
              </div>

              <div style={customRow}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Custom %"
                  value={customTipPercent}
                  onChange={(event) =>
                    setCustomTipPercent(event.target.value)
                  }
                  style={inputStyle}
                />
                <button
                  onClick={() =>
                    applyTipPercent(Number(customTipPercent))
                  }
                  style={applyButton}
                >
                  Apply %
                </button>
              </div>

              <div style={customRow}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="$ Amount"
                  value={customTipAmount}
                  onChange={(event) =>
                    setCustomTipAmount(event.target.value)
                  }
                  style={inputStyle}
                />
                <button
                  onClick={applyTipAmount}
                  style={{
                    ...applyButton,
                    background: "#7C3AED",
                  }}
                >
                  Apply $
                </button>
              </div>

              <div style={dividerStyle} />

              <h3>Payment Method</h3>

              <div style={paymentMethodGrid}>
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    style={{
                      minHeight: 52,
                      borderRadius: 9,
                      border:
                        selectedMethod === method
                          ? "3px solid white"
                          : "1px solid #475569",
                      background:
                        selectedMethod === method
                          ? "#2563EB"
                          : "#1E293B",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <h3>Amount</h3>

              <div style={customRow}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(event.target.value)
                  }
                  style={{
                    ...inputStyle,
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                />
                <button
                  onClick={payRemaining}
                  style={{
                    ...applyButton,
                    minWidth: 110,
                  }}
                >
                  Remaining
                </button>
              </div>

              <button
                onClick={addPayment}
                disabled={selectedRemaining === 0}
                style={{
                  width: "100%",
                  height: 58,
                  marginTop: 12,
                  border: "none",
                  borderRadius: 10,
                  background:
                    selectedRemaining > 0
                      ? "#22C55E"
                      : "#475569",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 17,
                  cursor:
                    selectedRemaining > 0
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Add {selectedMethod} Payment
              </button>
            </>
          )}
        </div>

        <div
          style={{
            ...panelStyle,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Payment History</h3>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedBill &&
              billPayments(selectedBill.id).length === 0 && (
                <div style={emptyStyle}>No payments yet</div>
              )}

            {selectedBill &&
              billPayments(selectedBill.id)
                .slice()
                .reverse()
                .map((payment) => (
                  <div key={payment.id} style={historyCard}>
                    <div style={spaceBetween}>
                      <strong>{payment.method}</strong>
                      <strong>{money(payment.amountCents)}</strong>
                    </div>

                    <div style={historyTime}>
                      {payment.createdAt}
                    </div>

                    <button
                      onClick={() => removePayment(payment.id)}
                      style={removeButton}
                    >
                      Remove Payment
                    </button>
                  </div>
                ))}
          </div>

          <div style={dividerStyle} />

          <SummaryRow label="Order" cents={totalBase} />
          <SummaryRow label="Gratuity" cents={totalGratuity} />
          <SummaryRow label="Tip" cents={totalTip} />
          <SummaryRow
            label="Grand Total"
            cents={grandTotal}
            bold
          />
          <SummaryRow label="Paid" cents={totalPaid} />
          <SummaryRow
            label="Remaining"
            cents={totalRemaining}
            bold
          />

          <button
            onClick={() => {
              if (!allBillsPaid) {
                alert("All bills must be fully paid first.");
                return;
              }

              onAllPaid();
            }}
            style={{
              width: "100%",
              height: 58,
              border: "none",
              borderRadius: 10,
              background: allBillsPaid ? "#16A34A" : "#475569",
              color: "white",
              fontWeight: "bold",
              fontSize: 17,
              marginTop: 15,
              cursor: allBillsPaid ? "pointer" : "not-allowed",
            }}
          >
            {allBillsPaid
              ? "✓ Complete Order"
              : "Complete All Payments"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  cents,
  bold = false,
}: {
  label: string;
  cents: number;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        color: bold ? "white" : "#CBD5E1",
        fontWeight: bold ? "bold" : "normal",
        fontSize: bold ? 17 : 14,
      }}
    >
      <span>{label}</span>
      <span>{money(cents)}</span>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0F172A",
  color: "white",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  flexDirection: "column" as const,
};

const headerStyle = {
  background: "#020617",
  padding: "14px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap" as const,
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "280px minmax(340px, 1fr) 350px",
  gap: 12,
  padding: 12,
  flex: 1,
};

const panelStyle = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 15,
};

const topButton = {
  background: "#334155",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const dividerStyle = {
  borderTop: "1px solid #334155",
  margin: "18px 0",
};

const buttonGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
};

const paymentMethodGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 8,
};

const customRow = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const smallActionButton = {
  minHeight: 42,
  border: "1px solid #475569",
  borderRadius: 8,
  background: "#1E293B",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  minHeight: 45,
  padding: "0 10px",
  background: "#020617",
  color: "white",
  border: "1px solid #475569",
  borderRadius: 8,
};

const applyButton = {
  minHeight: 45,
  border: "none",
  borderRadius: 8,
  background: "#2563EB",
  color: "white",
  padding: "0 15px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const spaceBetween = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

const emptyStyle = {
  color: "#64748B",
  textAlign: "center" as const,
  padding: 25,
};

const historyCard = {
  background: "#1E293B",
  borderRadius: 9,
  padding: 10,
  marginBottom: 8,
};

const historyTime = {
  color: "#94A3B8",
  fontSize: 11,
  marginTop: 5,
};

const removeButton = {
  width: "100%",
  marginTop: 8,
  minHeight: 34,
  border: "1px solid #DC2626",
  borderRadius: 7,
  background: "#450A0A",
  color: "#FCA5A5",
  cursor: "pointer",
};

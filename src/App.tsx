import { useState } from "react";
import Login from "./Login";
import Orders from "./Orders";

type StaffRole = "Server" | "Supervisor" | "Manager" | "Owner";

type StaffUser = {
  id: number;
  name: string;
  role: StaffRole;
  pin: string;
};

function App() {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [workingDayOpen, setWorkingDayOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showCloseDay, setShowCloseDay] = useState(false);

  const canManageWorkingDay =
    currentUser?.role === "Owner" || currentUser?.role === "Manager";

  // Temporary totals.
  // Later these values will come from the database.
  const endOfDay = {
    grossSales: 0,
    cash: 0,
    visa: 0,
    mastercard: 0,
    debit: 0,
    giftCard: 0,
    tips: 0,
    gratuity: 0,
    discounts: 0,
    voids: 0,
    refunds: 0,
    tax: 0,
  };

  const money = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <Login
        onLogin={(user) => {
          setCurrentUser(user);
          setCheckedIn(false);
        }}
      />
    );
  }

  // CHECK-IN / OPEN WORKING DAY
  if (!checkedIn || !workingDayOpen) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0F172A",
          color: "white",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 600,
            background: "#111827",
            borderRadius: 22,
            padding: 35,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              marginTop: 0,
            }}
          >
            Behesht ERP
          </h1>

          <div
            style={{
              background: "#1E293B",
              padding: 20,
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
              }}
            >
              {currentUser.name}
            </div>

            <div
              style={{
                color: "#94A3B8",
                marginTop: 5,
              }}
            >
              {currentUser.role}
            </div>
          </div>

          <div
            style={{
              background: workingDayOpen ? "#14532D" : "#7F1D1D",
              padding: 18,
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <strong>Working Day:</strong>{" "}
            {workingDayOpen ? "OPEN" : "CLOSED"}
          </div>

          {!workingDayOpen && canManageWorkingDay && (
            <button
              onClick={() => setWorkingDayOpen(true)}
              style={{
                width: "100%",
                height: 60,
                background: "#16A34A",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: 15,
              }}
            >
              Open Working Day
            </button>
          )}

          {!workingDayOpen && !canManageWorkingDay && (
            <div
              style={{
                background: "#78350F",
                padding: 15,
                borderRadius: 12,
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Manager or Owner must open the Working Day.
            </div>
          )}

          {workingDayOpen && !checkedIn && (
            <button
              onClick={() => setCheckedIn(true)}
              style={{
                width: "100%",
                height: 60,
                background: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: 15,
              }}
            >
              Check In
            </button>
          )}

          <button
            onClick={() => {
              setCurrentUser(null);
              setCheckedIn(false);
            }}
            style={{
              width: "100%",
              height: 48,
              background: "#334155",
              color: "white",
              border: "none",
              borderRadius: 10,
              marginTop: 10,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // POS SCREEN
  return (
    <div>
      <div
        style={{
          background: "#020617",
          color: "white",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "Arial, sans-serif",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>{currentUser.name}</strong>

          <span
            style={{
              marginLeft: 10,
              color: "#94A3B8",
            }}
          >
            {currentUser.role}
          </span>

          <span
            style={{
              marginLeft: 20,
              color: "#22C55E",
              fontWeight: "bold",
            }}
          >
            ● Working Day Open
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {canManageWorkingDay && (
            <button
              onClick={() => setShowCloseDay(true)}
              style={{
                background: "#7C3AED",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Close Working Day
            </button>
          )}

          <button
            onClick={() => setCheckedIn(false)}
            style={{
              background: "#F59E0B",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Check Out
          </button>

          <button
            onClick={() => {
              setCurrentUser(null);
              setCheckedIn(false);
            }}
            style={{
              background: "#DC2626",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <Orders />

      {/* CLOSE WORKING DAY MODAL */}

      {showCloseDay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#111827",
              color: "white",
              borderRadius: 20,
              padding: 30,
              fontFamily: "Arial, sans-serif",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                textAlign: "center",
              }}
            >
              End of Day Summary
            </h2>

            <p
              style={{
                textAlign: "center",
                color: "#94A3B8",
                marginBottom: 25,
              }}
            >
              Review totals before closing the Working Day
            </p>

            <SummaryRow
              label="Gross Sales"
              value={money(endOfDay.grossSales)}
            />

            <hr style={{ borderColor: "#334155" }} />

            <SummaryRow label="Cash" value={money(endOfDay.cash)} />
            <SummaryRow label="Visa" value={money(endOfDay.visa)} />
            <SummaryRow
              label="Mastercard"
              value={money(endOfDay.mastercard)}
            />
            <SummaryRow label="Debit" value={money(endOfDay.debit)} />
            <SummaryRow
              label="Gift Card"
              value={money(endOfDay.giftCard)}
            />

            <hr style={{ borderColor: "#334155" }} />

            <SummaryRow label="Tips" value={money(endOfDay.tips)} />
            <SummaryRow
              label="Gratuity"
              value={money(endOfDay.gratuity)}
            />
            <SummaryRow
              label="Discounts"
              value={money(endOfDay.discounts)}
            />
            <SummaryRow label="Voids" value={money(endOfDay.voids)} />
            <SummaryRow
              label="Refunds"
              value={money(endOfDay.refunds)}
            />
            <SummaryRow label="Tax" value={money(endOfDay.tax)} />

            <div
              style={{
                background: "#78350F",
                padding: 14,
                borderRadius: 10,
                marginTop: 20,
                fontSize: 14,
              }}
            >
              Before closing the day, all open tables will eventually be
              checked automatically.
            </div>

            <button
              onClick={() => {
                setWorkingDayOpen(false);
                setCheckedIn(false);
                setShowCloseDay(false);
              }}
              style={{
                width: "100%",
                height: 58,
                background: "#DC2626",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: 20,
              }}
            >
              Confirm Close Working Day
            </button>

            <button
              onClick={() => setShowCloseDay(false)}
              style={{
                width: "100%",
                height: 50,
                background: "#334155",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                cursor: "pointer",
                marginTop: 10,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 4px",
        fontSize: 16,
      }}
    >
      <span style={{ color: "#CBD5E1" }}>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

export default App;
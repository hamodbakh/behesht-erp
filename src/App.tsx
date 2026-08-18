import { useState } from "react";
import Login from "./Login";
import Orders from "./Orders";
import MenuManagement from "./MenuManagement";
import ModifierManagement from "./ModifierManagement";

type StaffRole = "Server" | "Supervisor" | "Manager" | "Owner";
type AppMode = "pos" | "setup" | null;
type SetupPage = "home" | "menu" | "modifiers";

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
  const [onBreak, setOnBreak] = useState(false);
  const [showShiftPanel, setShowShiftPanel] = useState(false);
  const [showCloseDay, setShowCloseDay] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>(null);
  const [setupPage, setSetupPage] = useState<SetupPage>("home");

  const canManageWorkingDay =
    currentUser?.role === "Owner" || currentUser?.role === "Manager";

  const canOpenSetup = canManageWorkingDay;

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

  const shiftStorageKey = (userId: number) =>
    `behesht-shift-${userId}`;

  const loadShiftState = (userId: number) => {
    try {
      const saved = localStorage.getItem(
        shiftStorageKey(userId)
      );

      if (!saved) {
        return {
          checkedIn: false,
          onBreak: false,
        };
      }

      const parsed = JSON.parse(saved);

      return {
        checkedIn: Boolean(parsed.checkedIn),
        onBreak: Boolean(parsed.onBreak),
      };
    } catch {
      return {
        checkedIn: false,
        onBreak: false,
      };
    }
  };

  const saveShiftState = (
    userId: number,
    nextCheckedIn: boolean,
    nextOnBreak: boolean
  ) => {
    localStorage.setItem(
      shiftStorageKey(userId),
      JSON.stringify({
        checkedIn: nextCheckedIn,
        onBreak: nextOnBreak,
      })
    );
  };

  const setEmployeeShift = (
    nextCheckedIn: boolean,
    nextOnBreak: boolean
  ) => {
    setCheckedIn(nextCheckedIn);
    setOnBreak(nextOnBreak);

    if (currentUser) {
      saveShiftState(
        currentUser.id,
        nextCheckedIn,
        nextOnBreak
      );
    }
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <Login
        onLogin={(user) => {
          const savedShift = loadShiftState(user.id);

          setCurrentUser(user);
          setCheckedIn(savedShift.checkedIn);
          setOnBreak(savedShift.onBreak);
          setShowShiftPanel(
            savedShift.onBreak
          );
          setSetupPage("home");

          // Operational staff go straight to POS.
          // If already clocked in, no extra shift question appears.
          setAppMode(
            user.role === "Server" || user.role === "Supervisor"
              ? "pos"
              : null
          );
        }}
      />
    );
  }

  // OWNER / MANAGER: CHOOSE FRONT POS OR POS SETUP
  if (appMode === null && canOpenSetup) {
    return (
      <div style={workspacePageStyle}>
        <div style={workspaceCardStyle}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Behesht ERP</h1>
            <div style={{ color: "#94A3B8", marginTop: 6 }}>
              {currentUser.name} • {currentUser.role}
            </div>
          </div>

          <div style={workspaceGridStyle}>
            <button
              onClick={() => setAppMode("pos")}
              style={{
                ...workspaceButtonStyle,
                background: "#14532D",
                border: "1px solid #22C55E",
              }}
            >
              <div style={workspaceTitleStyle}>Front POS</div>
              <div style={workspaceDescriptionStyle}>
                Floor Plan, tables, orders, kitchen, split bill and payment
              </div>
            </button>

            <button
              onClick={() => {
                setAppMode("setup");
                setSetupPage("home");
              }}
              style={{
                ...workspaceButtonStyle,
                background: "#172554",
                border: "1px solid #3B82F6",
              }}
            >
              <div style={workspaceTitleStyle}>POS Setup / Back Office</div>
              <div style={workspaceDescriptionStyle}>
                Menu, modifiers, staff, reports, inventory, printers and settings
              </div>
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentUser(null);
              setAppMode(null);
              setCheckedIn(false);
            }}
            style={workspaceLogoutButton}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // POS SETUP / BACK OFFICE
  if (appMode === "setup") {
    if (setupPage === "menu") {
      return (
        <MenuManagement
          onBack={() => setSetupPage("home")}
        />
      );
    }

    if (setupPage === "modifiers") {
      return (
        <ModifierManagement
          onBack={() => setSetupPage("home")}
        />
      );
    }

    return (
      <div style={setupPageStyle}>
        <div style={setupHeaderStyle}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>
              POS Setup / Back Office
            </div>
            <div style={{ color: "#94A3B8", marginTop: 4 }}>
              {currentUser.name} • {currentUser.role}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setAppMode("pos")}
              style={setupHeaderButton}
            >
              Open POS
            </button>

            <button
              onClick={() => setAppMode(null)}
              style={setupHeaderButton}
            >
              Workspace
            </button>

            <button
              onClick={() => {
                setCurrentUser(null);
                setAppMode(null);
                setCheckedIn(false);
              }}
              style={{
                ...setupHeaderButton,
                background: "#7F1D1D",
                borderColor: "#DC2626",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={setupGridStyle}>
          <SetupCard
            title="Menu"
            description="Menu items, prices, availability and modifier assignment."
            status="Available"
            onClick={() => setSetupPage("menu")}
          />

          <SetupCard
            title="Modifiers"
            description="Reusable modifier groups, number inputs, price choices and conditional flows."
            status="Available"
            onClick={() => setSetupPage("modifiers")}
          />

          <SetupCard
            title="Staff & Permissions"
            description="Employees, PINs, roles and permissions."
            status="Coming Next"
          />

          <SetupCard
            title="Printers / KDS"
            description="Kitchen routing, printers and kitchen displays."
            status="Planned"
          />

          <SetupCard
            title="Reports"
            description="Sales, tips, gratuity, discounts, voids and financial reports."
            status="Planned"
          />

          <SetupCard
            title="Inventory"
            description="Stock, purchasing, ingredients and costs."
            status="Planned"
          />

          <SetupCard
            title="Audit"
            description="Critical action history and authorized corrections."
            status="Planned"
          />

          <SetupCard
            title="Backup & Restore"
            description="Automatic backups, archives and restore tools."
            status="Planned"
          />

          <SetupCard
            title="Settings"
            description="Taxes, payments and system preferences."
            status="Planned"
          />
        </div>
      </div>
    );
  }

  // SHIFT / WORKING DAY SCREEN — shown only when needed
  if (!workingDayOpen || !checkedIn || onBreak || showShiftPanel) {
    const canClockIn = workingDayOpen && !checkedIn;
    const canStartBreak = workingDayOpen && checkedIn && !onBreak;
    const canEndBreak = workingDayOpen && checkedIn && onBreak;
    const canClockOut = workingDayOpen && checkedIn;

    return (
      <div style={shiftPageStyle}>
        <div style={shiftCardStyle}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              Employee Shift
            </div>
            <div style={{ color: "#94A3B8", marginTop: 5 }}>
              {currentUser.name} • {currentUser.role}
            </div>
          </div>

          <div
            style={{
              ...shiftStatusStyle,
              background: workingDayOpen ? "#14532D" : "#7F1D1D",
            }}
          >
            <strong>Working Day:</strong>{" "}
            {workingDayOpen ? "OPEN" : "CLOSED"}
          </div>

          <div
            style={{
              ...shiftStatusStyle,
              background: !checkedIn
                ? "#1E293B"
                : onBreak
                ? "#78350F"
                : "#172554",
            }}
          >
            <strong>Shift:</strong>{" "}
            {!checkedIn
              ? "NOT CLOCKED IN"
              : onBreak
              ? "ON BREAK"
              : "CLOCKED IN"}
          </div>

          {!workingDayOpen && canManageWorkingDay && (
            <button
              onClick={() => setWorkingDayOpen(true)}
              style={{
                ...shiftActionButtonStyle,
                background: "#16A34A",
              }}
            >
              Open Working Day
            </button>
          )}

          {!workingDayOpen && !canManageWorkingDay && (
            <div style={shiftWarningStyle}>
              Manager or Owner must open the Working Day.
            </div>
          )}

          {workingDayOpen && (
            <div style={shiftActionGridStyle}>
              <button
                disabled={!canClockIn}
                onClick={() => {
                  setEmployeeShift(true, false);
                  setShowShiftPanel(false);
                }}
                style={getShiftButtonStyle(
                  canClockIn,
                  "#2563EB"
                )}
              >
                Clock In
              </button>

              <button
                disabled={!canStartBreak}
                onClick={() => {
                  setEmployeeShift(true, true);
                  setShowShiftPanel(true);
                }}
                style={getShiftButtonStyle(
                  canStartBreak,
                  "#D97706"
                )}
              >
                Start Break
              </button>

              <button
                disabled={!canEndBreak}
                onClick={() => {
                  setEmployeeShift(true, false);
                  setShowShiftPanel(false);
                }}
                style={getShiftButtonStyle(
                  canEndBreak,
                  "#16A34A"
                )}
              >
                End Break
              </button>

              <button
                disabled={!checkedIn}
                onClick={() =>
                  alert(
                    "Cash Out workflow will be connected to server sales and cash totals later."
                  )
                }
                style={getShiftButtonStyle(
                  checkedIn,
                  "#7C3AED"
                )}
              >
                Cash Out
              </button>

              <button
                disabled={!canClockOut}
                onClick={() => {
                  setEmployeeShift(false, false);
                  setShowShiftPanel(false);
                }}
                style={getShiftButtonStyle(
                  canClockOut,
                  "#DC2626"
                )}
              >
                Clock Out
              </button>

              <button
                disabled={!checkedIn || onBreak}
                onClick={() => setShowShiftPanel(false)}
                style={getShiftButtonStyle(
                  checkedIn && !onBreak,
                  "#0F766E"
                )}
              >
                Continue to Floor Plan
              </button>
            </div>
          )}

          {canOpenSetup && (
            <button
              onClick={() => {
                setAppMode("setup");
                setSetupPage("home");
              }}
              style={shiftSecondaryButtonStyle}
            >
              POS Setup / Back Office
            </button>
          )}

          <button
            onClick={() => {
              setCurrentUser(null);
              setShowShiftPanel(false);
            }}
            style={shiftSecondaryButtonStyle}
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
          {canOpenSetup && (
            <button
              onClick={() => {
                setAppMode("setup");
                setSetupPage("home");
              }}
              style={{
                background: "#1D4ED8",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              POS Setup
            </button>
          )}

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
            onClick={() => setShowShiftPanel(true)}
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
            Shift
          </button>

          <button
            onClick={() => {
              setCurrentUser(null);
              setShowShiftPanel(false);
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
                setEmployeeShift(false, false);
                setShowShiftPanel(false);
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

function SetupCard({
  title,
  description,
  status,
  onClick,
}: {
  title: string;
  description: string;
  status: string;
  onClick?: () => void;
}) {
  const active = Boolean(onClick);

  return (
    <button
      onClick={onClick}
      disabled={!active}
      style={{
        ...setupCardStyle,
        opacity: active ? 1 : 0.68,
        cursor: active ? "pointer" : "default",
      }}
    >
      <div style={setupCardTopStyle}>
        <strong style={{ fontSize: 19 }}>{title}</strong>

        <span
          style={{
            ...setupStatusStyle,
            background:
              status === "Available" ? "#14532D" : "#1E293B",
            color:
              status === "Available" ? "#86EFAC" : "#94A3B8",
          }}
        >
          {status}
        </span>
      </div>

      <div style={setupDescriptionStyle}>
        {description}
      </div>
    </button>
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

const shiftPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
};

const shiftCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 20,
  padding: 26,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

const shiftStatusStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  marginBottom: 10,
};

const shiftActionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 14,
};

const shiftActionButtonStyle: React.CSSProperties = {
  minHeight: 58,
  border: "none",
  borderRadius: 10,
  color: "white",
  fontWeight: 800,
  fontSize: 16,
};

const shiftSecondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  background: "#334155",
  color: "white",
  border: "none",
  borderRadius: 10,
  marginTop: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const shiftWarningStyle: React.CSSProperties = {
  background: "#78350F",
  padding: 14,
  borderRadius: 10,
  textAlign: "center",
};

function getShiftButtonStyle(
  enabled: boolean,
  background: string
): React.CSSProperties {
  return {
    ...shiftActionButtonStyle,
    background: enabled ? background : "#334155",
    opacity: enabled ? 1 : 0.45,
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

const workspacePageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
};

const workspaceCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 900,
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 20,
  padding: 28,
};

const workspaceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const workspaceButtonStyle: React.CSSProperties = {
  minHeight: 190,
  borderRadius: 16,
  color: "white",
  padding: 22,
  textAlign: "left",
  cursor: "pointer",
};

const workspaceTitleStyle: React.CSSProperties = {
  fontSize: 25,
  fontWeight: 900,
};

const workspaceDescriptionStyle: React.CSSProperties = {
  color: "#CBD5E1",
  lineHeight: 1.5,
  marginTop: 12,
};

const workspaceLogoutButton: React.CSSProperties = {
  width: "100%",
  height: 48,
  marginTop: 18,
  background: "#334155",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};

const setupPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  padding: 14,
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
};

const setupHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 14,
  padding: 14,
};

const setupHeaderButton: React.CSSProperties = {
  background: "#1E293B",
  color: "white",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "9px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const setupGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 14,
};

const setupCardStyle: React.CSSProperties = {
  minHeight: 140,
  background: "#0F172A",
  color: "white",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 16,
  textAlign: "left",
};

const setupCardTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const setupStatusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 800,
};

const setupDescriptionStyle: React.CSSProperties = {
  color: "#94A3B8",
  lineHeight: 1.45,
  marginTop: 12,
  fontSize: 13,
};

export default App;
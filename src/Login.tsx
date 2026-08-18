import { useState } from "react";

type StaffRole = "Server" | "Supervisor" | "Manager" | "Owner";

type StaffUser = {
  id: number;
  name: string;
  role: StaffRole;
  pin: string;
};

type LoginProps = {
  onLogin?: (user: StaffUser) => void;
};

const staffUsers: StaffUser[] = [
  {
    id: 1,
    name: "Hamid",
    role: "Owner",
    pin: "1234",
  },
  {
    id: 2,
    name: "Server 1",
    role: "Server",
    pin: "1111",
  },
  {
    id: 3,
    name: "Server 2",
    role: "Server",
    pin: "2222",
  },
  {
    id: 4,
    name: "Manager",
    role: "Manager",
    pin: "3333",
  },
];

export default function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleNumber = (number: string) => {
    if (pin.length >= 6) return;
    setPin((current) => current + number);
    setError("");
  };

  const handleDelete = () => {
    setPin((current) => current.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleLogin = () => {
    if (!pin) {
      setError("Please enter your employee code.");
      return;
    }

    const user = staffUsers.find((staff) => staff.pin === pin);

    if (!user) {
      setError("Incorrect Employee Code");
      setPin("");
      return;
    }

    setError("");

    if (onLogin) {
      onLogin(user);
    } else {
      alert(`Welcome ${user.name}`);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={loginCardStyle}>
        <div style={brandBlockStyle}>
          <div style={brandStyle}>BEHESHT</div>
          <div style={subtitleStyle}>Restaurant POS</div>
        </div>

        <div style={contentGridStyle}>
          <section style={pinPanelStyle}>
            <h1 style={titleStyle}>Enter Employee Code</h1>

            <div style={pinDisplayStyle}>
              {pin.length > 0 ? "•".repeat(pin.length) : "Employee Code"}
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={numberGridStyle}>
              {["7", "8", "9"].map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumber(number)}
                  style={numberButtonStyle}
                >
                  {number}
                </button>
              ))}

              <button onClick={handleDelete} style={utilityButtonStyle}>
                ←
              </button>

              {["4", "5", "6"].map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumber(number)}
                  style={numberButtonStyle}
                >
                  {number}
                </button>
              ))}

              <button onClick={handleClear} style={clearButtonStyle}>
                Clear
              </button>

              {["1", "2", "3"].map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumber(number)}
                  style={numberButtonStyle}
                >
                  {number}
                </button>
              ))}

              <button onClick={handleLogin} style={enterTallButtonStyle}>
                ✓
              </button>

              <button
                onClick={() => handleNumber("0")}
                style={{
                  ...numberButtonStyle,
                  gridColumn: "1 / span 2",
                }}
              >
                0
              </button>
            </div>
          </section>

          <aside style={infoPanelStyle}>
            <div style={infoTitleStyle}>Employee Access</div>

            <div style={infoCardStyle}>
              <strong>Clock In</strong>
              <span style={infoTextStyle}>
                Start your shift after entering your code.
              </span>
            </div>

            <div style={infoCardStyle}>
              <strong>Break</strong>
              <span style={infoTextStyle}>
                Start or end a break from the shift screen.
              </span>
            </div>

            <div style={infoCardStyle}>
              <strong>Cash Out</strong>
              <span style={infoTextStyle}>
                Available according to role and shift status.
              </span>
            </div>

            <div style={infoCardStyle}>
              <strong>Clock Out</strong>
              <span style={infoTextStyle}>
                Finish your shift safely.
              </span>
            </div>

            <div style={securityNoteStyle}>
              No employee list is shown on the POS login screen. Staff enter
              only their private employee code.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
  padding: 18,
  boxSizing: "border-box",
};

const loginCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 950,
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
};

const brandBlockStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 20,
};

const brandStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: 3,
};

const subtitleStyle: React.CSSProperties = {
  color: "#94A3B8",
  marginTop: 5,
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(440px, 1.5fr) minmax(250px, 0.8fr)",
  gap: 16,
};

const pinPanelStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 20,
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 16px",
  fontSize: 25,
};

const pinDisplayStyle: React.CSSProperties = {
  height: 62,
  background: "#020617",
  border: "2px solid #475569",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 25,
  letterSpacing: 8,
  color: "#F8FAFC",
  marginBottom: 12,
};

const errorStyle: React.CSSProperties = {
  background: "#7F1D1D",
  color: "#FEE2E2",
  padding: 10,
  borderRadius: 8,
  textAlign: "center",
  marginBottom: 12,
};

const numberGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 9,
};

const numberButtonStyle: React.CSSProperties = {
  minHeight: 72,
  borderRadius: 10,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "white",
  fontSize: 28,
  fontWeight: 800,
  cursor: "pointer",
};

const utilityButtonStyle: React.CSSProperties = {
  ...numberButtonStyle,
  background: "#0369A1",
};

const clearButtonStyle: React.CSSProperties = {
  ...numberButtonStyle,
  background: "#7F1D1D",
  fontSize: 16,
};

const enterTallButtonStyle: React.CSSProperties = {
  ...numberButtonStyle,
  background: "#16A34A",
  gridRow: "3 / span 2",
  gridColumn: "4",
  fontSize: 38,
};

const infoPanelStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const infoTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 2,
};

const infoCardStyle: React.CSSProperties = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const infoTextStyle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 12,
  lineHeight: 1.4,
};

const securityNoteStyle: React.CSSProperties = {
  marginTop: "auto",
  background: "#052E16",
  border: "1px solid #166534",
  color: "#DCFCE7",
  borderRadius: 10,
  padding: 12,
  fontSize: 12,
  lineHeight: 1.5,
};

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
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
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
    if (!selectedUser) {
      setError("Please select a staff member.");
      return;
    }

    if (pin !== selectedUser.pin) {
      setError("Incorrect PIN");
      setPin("");
      return;
    }

    setError("");

    if (onLogin) {
      onLogin(selectedUser);
    } else {
      alert(`Welcome ${selectedUser.name}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 850,
          background: "#111827",
          borderRadius: 24,
          padding: 30,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: 5,
            fontSize: 34,
          }}
        >
          Behesht ERP
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            marginBottom: 30,
          }}
        >
          Staff Login
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 30,
          }}
        >
          {staffUsers.map((user) => {
            const selected = selectedUser?.id === user.id;

            return (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setPin("");
                  setError("");
                }}
                style={{
                  minHeight: 90,
                  borderRadius: 14,
                  border: selected
                    ? "3px solid #22C55E"
                    : "2px solid #334155",
                  background: selected ? "#14532D" : "#1E293B",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 17,
                  fontWeight: "bold",
                }}
              >
                <div>{user.name}</div>

                <div
                  style={{
                    fontSize: 12,
                    marginTop: 8,
                    color: "#CBD5E1",
                  }}
                >
                  {user.role}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            maxWidth: 350,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              height: 65,
              background: "#020617",
              border: "2px solid #334155",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 15,
              fontSize: 28,
              letterSpacing: 10,
            }}
          >
            {pin.length > 0 ? "•".repeat(pin.length) : "PIN"}
          </div>

          {error && (
            <div
              style={{
                background: "#7F1D1D",
                padding: 10,
                borderRadius: 8,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
              (number) => (
                <button
                  key={number}
                  onClick={() => handleNumber(number)}
                  style={numberButtonStyle}
                >
                  {number}
                </button>
              )
            )}

            <button onClick={handleClear} style={actionButtonStyle}>
              Clear
            </button>

            <button
              onClick={() => handleNumber("0")}
              style={numberButtonStyle}
            >
              0
            </button>

            <button onClick={handleDelete} style={actionButtonStyle}>
              Delete
            </button>
          </div>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              height: 60,
              marginTop: 15,
              borderRadius: 12,
              border: "none",
              background: "#22C55E",
              color: "white",
              fontSize: 19,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

const numberButtonStyle = {
  height: 65,
  borderRadius: 12,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "white",
  fontSize: 24,
  fontWeight: "bold",
  cursor: "pointer",
};

const actionButtonStyle = {
  height: 65,
  borderRadius: 12,
  border: "1px solid #475569",
  background: "#334155",
  color: "white",
  fontSize: 14,
  fontWeight: "bold",
  cursor: "pointer",
};
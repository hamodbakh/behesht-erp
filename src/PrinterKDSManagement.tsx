import { useMemo, useState } from "react";

type OutputType = "printer" | "kds";

export type OutputDevice = {
  id: string;
  name: string;
  type: OutputType;
  address: string;
  port: number;
  enabled: boolean;
  model: string;
};

const STORAGE_KEY = "behesht-output-devices";

const defaultDevices: OutputDevice[] = [
  {
    id: "device-kitchen-printer",
    name: "Kitchen Printer",
    type: "printer",
    address: "",
    port: 9100,
    enabled: true,
    model: "",
  },
  {
    id: "device-bar-printer",
    name: "Bar Printer",
    type: "printer",
    address: "",
    port: 9100,
    enabled: true,
    model: "",
  },
  {
    id: "device-shisha-printer",
    name: "Shisha Printer",
    type: "printer",
    address: "",
    port: 9100,
    enabled: true,
    model: "",
  },
];

function loadDevices(): OutputDevice[] {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDevices));
    return defaultDevices;
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultDevices;

    return parsed.map((device, index) => ({
      id: String(device.id ?? `device-${Date.now()}-${index}`),
      name: String(device.name ?? "Output Device"),
      type: device.type === "kds" ? "kds" : "printer",
      address: String(device.address ?? ""),
      port: Number(device.port ?? 9100),
      enabled: device.enabled === undefined ? true : Boolean(device.enabled),
      model: String(device.model ?? ""),
    }));
  } catch {
    return defaultDevices;
  }
}

export default function PrinterKDSManagement({ onBack }: { onBack: () => void }) {
  const [devices, setDevices] = useState<OutputDevice[]>(loadDevices);
  const [selectedId, setSelectedId] = useState<string | null>(
    loadDevices()[0]?.id ?? null
  );

  const selected = devices.find((device) => device.id === selectedId) ?? null;

  const sortedDevices = useMemo(
    () =>
      [...devices].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      }),
    [devices]
  );

  const saveDevices = (next: OutputDevice[]) => {
    setDevices(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addDevice = (type: OutputType) => {
    const next: OutputDevice = {
      id: `device-${Date.now()}`,
      name: type === "printer" ? "New Printer" : "New KDS",
      type,
      address: "",
      port: 9100,
      enabled: true,
      model: "",
    };

    saveDevices([...devices, next]);
    setSelectedId(next.id);
  };

  const updateSelected = (changes: Partial<OutputDevice>) => {
    if (!selected) return;

    saveDevices(
      devices.map((device) =>
        device.id === selected.id ? { ...device, ...changes } : device
      )
    );
  };

  const deleteSelected = () => {
    if (!selected) return;

    if (!window.confirm(`Delete "${selected.name}"?`)) return;

    const next = devices.filter((device) => device.id !== selected.id);
    saveDevices(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const testConnection = () => {
    if (!selected) return;

    if (!selected.address.trim()) {
      alert(
        selected.type === "printer"
          ? "Enter a printer IP address or connection name first."
          : "Enter a KDS device address first."
      );
      return;
    }

    alert(
      selected.type === "printer"
        ? `Test target saved: ${selected.address}:${selected.port}. Real TCP testing will be handled by the local print service.`
        : `Test target saved: ${selected.address}. Real KDS testing will be handled by the local service.`
    );
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            Back Office / Printers & KDS
          </div>
          <div style={subtleStyle}>
            Create output devices first. Station assignment comes next.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => addDevice("printer")} style={topButton("#2563EB")}>
            + Printer
          </button>

          <button onClick={() => addDevice("kds")} style={topButton("#7C3AED")}>
            + KDS
          </button>

          <button onClick={onBack} style={topButton("#334155")}>
            ← Back
          </button>
        </div>
      </header>

      <main style={gridStyle}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Output Devices</h3>

          <div style={scrollStyle}>
            {sortedDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedId(device.id)}
                style={{
                  ...deviceButton,
                  background: selectedId === device.id ? "#1D4ED8" : "#1E293B",
                  opacity: device.enabled ? 1 : 0.55,
                }}
              >
                <div style={{ fontWeight: 800 }}>{device.name}</div>
                <div style={{ marginTop: 5, color: "#CBD5E1", fontSize: 11 }}>
                  {device.type === "printer" ? "PRINTER" : "KDS"} •{" "}
                  {device.enabled ? "Enabled" : "Disabled"}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Device Settings</h3>

          {!selected ? (
            <div style={emptyStyle}>Select a device</div>
          ) : (
            <div style={scrollStyle}>
              <label style={labelStyle}>Device Name</label>
              <input
                value={selected.name}
                onChange={(e) => updateSelected({ name: e.target.value })}
                style={inputStyle}
              />

              <label style={labelStyle}>Device Type</label>
              <select
                value={selected.type}
                onChange={(e) =>
                  updateSelected({
                    type: e.target.value === "kds" ? "kds" : "printer",
                  })
                }
                style={inputStyle}
              >
                <option value="printer">Printer</option>
                <option value="kds">KDS</option>
              </select>

              <label style={labelStyle}>
                {selected.type === "printer"
                  ? "Printer IP / Connection"
                  : "KDS Address"}
              </label>
              <input
                value={selected.address}
                onChange={(e) => updateSelected({ address: e.target.value })}
                placeholder={
                  selected.type === "printer"
                    ? "Example: 192.168.1.50"
                    : "Example: KDS-1"
                }
                style={inputStyle}
              />

              {selected.type === "printer" && (
                <>
                  <label style={labelStyle}>TCP Port</label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={selected.port}
                    onChange={(e) =>
                      updateSelected({
                        port: Math.max(
                          1,
                          Math.min(
                            65535,
                            Number(e.target.value) || 9100
                          )
                        ),
                      })
                    }
                    style={inputStyle}
                  />
                </>
              )}

              <label style={labelStyle}>Model / Description</label>
              <input
                value={selected.model}
                onChange={(e) => updateSelected({ model: e.target.value })}
                placeholder="Example: Epson TM-T88 / Kitchen Screen"
                style={inputStyle}
              />

              <label style={labelStyle}>Status</label>
              <button
                onClick={() => updateSelected({ enabled: !selected.enabled })}
                style={{
                  ...statusButton,
                  background: selected.enabled ? "#14532D" : "#7F1D1D",
                }}
              >
                {selected.enabled ? "✓ Enabled" : "Disabled"}
              </button>

              <button onClick={testConnection} style={testButton}>
                Test Connection
              </button>

              <div style={infoCard}>
                <strong>Next step</strong>
                <div style={{ marginTop: 7, color: "#CBD5E1", lineHeight: 1.5 }}>
                  We will connect each Kitchen Station to one or more of these
                  devices. Example: Kitchen → Kitchen Printer, Bar → Bar Printer,
                  Shisha → Shisha Printer.
                </div>
              </div>

              <button onClick={deleteSelected} style={deleteButton}>
                Delete Device
              </button>
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Device Preview</h3>

          <div style={scrollStyle}>
            {sortedDevices.map((device) => (
              <div key={device.id} style={previewCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <strong>{device.name}</strong>
                  <span
                    style={{
                      color: device.enabled ? "#86EFAC" : "#FCA5A5",
                      fontSize: 12,
                    }}
                  >
                    {device.enabled ? "ON" : "OFF"}
                  </span>
                </div>

                <div style={{ marginTop: 8, color: "#94A3B8", fontSize: 12 }}>
                  {device.type === "printer" ? "Printer" : "KDS"}
                </div>

                <div style={{ marginTop: 5, color: "#CBD5E1", fontSize: 11 }}>
                  {device.address.trim()
                    ? device.type === "printer"
                      ? `${device.address}:${device.port}`
                      : device.address
                    : "No address configured"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  height: "100vh",
  overflow: "hidden",
  background: "#020617",
  color: "white",
  padding: 14,
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 14,
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  flex: "0 0 auto",
};

const subtleStyle: React.CSSProperties = {
  color: "#94A3B8",
  marginTop: 4,
  fontSize: 13,
};

const gridStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "280px minmax(360px, 1fr) 320px",
  gap: 12,
  marginTop: 12,
};

const panelStyle: React.CSSProperties = {
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 14,
  padding: 14,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

const scrollStyle: React.CSSProperties = {
  overflowY: "auto",
  minHeight: 0,
  paddingRight: 3,
};

const deviceButton: React.CSSProperties = {
  width: "100%",
  minHeight: 72,
  border: "1px solid #334155",
  borderRadius: 10,
  color: "white",
  padding: 12,
  marginBottom: 8,
  textAlign: "left",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#CBD5E1",
  fontWeight: 700,
  fontSize: 13,
  marginTop: 12,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  boxSizing: "border-box",
  borderRadius: 9,
  border: "1px solid #475569",
  background: "#111827",
  color: "white",
  padding: "0 12px",
  fontSize: 15,
};

const statusButton: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  border: "none",
  borderRadius: 9,
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const testButton: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  background: "#0F766E",
  border: "1px solid #14B8A6",
  color: "white",
  borderRadius: 9,
  marginTop: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const infoCard: React.CSSProperties = {
  background: "#172554",
  border: "1px solid #1D4ED8",
  borderRadius: 10,
  padding: 14,
  marginTop: 18,
};

const deleteButton: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  background: "#7F1D1D",
  border: "1px solid #DC2626",
  color: "white",
  borderRadius: 9,
  marginTop: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const previewCard: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: 12,
  marginBottom: 8,
};

const emptyStyle: React.CSSProperties = {
  color: "#64748B",
  textAlign: "center",
  padding: 30,
};

function topButton(background: string): React.CSSProperties {
  return {
    background,
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "9px 12px",
    fontWeight: 800,
    cursor: "pointer",
  };
}

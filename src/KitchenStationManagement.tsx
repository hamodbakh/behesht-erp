import { useEffect, useMemo, useState } from "react";

type OutputMode = "printer" | "kds" | "both";

type OutputDevice = {
  id: string;
  name: string;
  type: "printer" | "kds";
  address: string;
  enabled: boolean;
  model: string;
};

export type KitchenStation = {
  id: string;
  name: string;
  order: number;
  available: boolean;
  mode: OutputMode;
  outputDeviceIds: string[];
};

const STORAGE_KEY = "behesht-kitchen-stations";
const DEVICE_STORAGE_KEY = "behesht-output-devices";

const defaultStations: KitchenStation[] = [
  {
    id: "station-kitchen",
    name: "Kitchen",
    order: 1,
    available: true,
    mode: "printer",
    outputDeviceIds: ["device-kitchen-printer"],
  },
  {
    id: "station-bar",
    name: "Bar",
    order: 2,
    available: true,
    mode: "printer",
    outputDeviceIds: ["device-bar-printer"],
  },
  {
    id: "station-shisha",
    name: "Shisha",
    order: 3,
    available: true,
    mode: "printer",
    outputDeviceIds: ["device-shisha-printer"],
  },
];

function loadStations(): KitchenStation[] {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultStations)
    );
    return defaultStations;
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return defaultStations;
    }

    return parsed.map((station, index) => ({
      id: String(
        station.id ??
          `station-${Date.now()}-${index}`
      ),
      name: String(
        station.name ?? "Station"
      ),
      order: Number(
        station.order ?? index + 1
      ),
      available:
        station.available === undefined
          ? true
          : Boolean(station.available),
      mode:
        station.mode === "kds" ||
        station.mode === "both"
          ? station.mode
          : "printer",
      outputDeviceIds:
        Array.isArray(
          station.outputDeviceIds
        )
          ? station.outputDeviceIds.map(
              String
            )
          : [],
    }));
  } catch {
    return defaultStations;
  }
}

function loadOutputDevices(): OutputDevice[] {
  const saved = localStorage.getItem(
    DEVICE_STORAGE_KEY
  );

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((device, index) => ({
      id: String(
        device.id ??
          `device-${Date.now()}-${index}`
      ),
      name: String(
        device.name ?? "Output Device"
      ),
      type:
        device.type === "kds"
          ? "kds"
          : "printer",
      address: String(
        device.address ?? ""
      ),
      enabled:
        device.enabled === undefined
          ? true
          : Boolean(device.enabled),
      model: String(device.model ?? ""),
    }));
  } catch {
    return [];
  }
}

export default function KitchenStationManagement({
  onBack,
}: {
  onBack: () => void;
}) {
  const [stations, setStations] =
    useState<KitchenStation[]>(
      loadStations
    );

  const [devices, setDevices] =
    useState<OutputDevice[]>(
      loadOutputDevices
    );

  const [selectedId, setSelectedId] =
    useState<string | null>(
      loadStations()[0]?.id ?? null
    );

  const selectedStation =
    stations.find(
      (station) =>
        station.id === selectedId
    ) ?? null;

  const sortedStations = useMemo(
    () =>
      [...stations].sort(
        (a, b) =>
          a.order - b.order ||
          a.name.localeCompare(b.name)
      ),
    [stations]
  );

  const sortedDevices = useMemo(
    () =>
      [...devices].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(
            b.type
          );
        }

        return a.name.localeCompare(
          b.name
        );
      }),
    [devices]
  );

  useEffect(() => {
    const refreshDevices = () =>
      setDevices(loadOutputDevices());

    window.addEventListener(
      "focus",
      refreshDevices
    );

    window.addEventListener(
      "storage",
      refreshDevices
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshDevices
      );

      window.removeEventListener(
        "storage",
        refreshDevices
      );
    };
  }, []);

  const saveStations = (
    next: KitchenStation[]
  ) => {
    setStations(next);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );
  };

  const addStation = () => {
    const next: KitchenStation = {
      id: `station-${Date.now()}`,
      name: "New Station",
      order:
        Math.max(
          0,
          ...stations.map(
            (station) => station.order
          )
        ) + 1,
      available: true,
      mode: "printer",
      outputDeviceIds: [],
    };

    saveStations([
      ...stations,
      next,
    ]);

    setSelectedId(next.id);
  };

  const updateSelected = (
    changes: Partial<KitchenStation>
  ) => {
    if (!selectedStation) return;

    saveStations(
      stations.map((station) =>
        station.id ===
        selectedStation.id
          ? {
              ...station,
              ...changes,
            }
          : station
      )
    );
  };

  const toggleDevice = (
    deviceId: string
  ) => {
    if (!selectedStation) return;

    const assigned =
      selectedStation.outputDeviceIds.includes(
        deviceId
      );

    updateSelected({
      outputDeviceIds: assigned
        ? selectedStation.outputDeviceIds.filter(
            (id) => id !== deviceId
          )
        : [
            ...selectedStation.outputDeviceIds,
            deviceId,
          ],
    });
  };

  const clearMissingDeviceIds = () => {
    if (!selectedStation) return;

    const validIds = new Set(
      devices.map((device) => device.id)
    );

    updateSelected({
      outputDeviceIds:
        selectedStation.outputDeviceIds.filter(
          (id) => validIds.has(id)
        ),
    });
  };

  const deleteSelected = () => {
    if (!selectedStation) return;

    if (
      !window.confirm(
        `Delete station "${selectedStation.name}"?`
      )
    ) {
      return;
    }

    const next = stations.filter(
      (station) =>
        station.id !==
        selectedStation.id
    );

    saveStations(next);

    setSelectedId(
      next[0]?.id ?? null
    );
  };

  const assignedDevices =
    selectedStation
      ? selectedStation.outputDeviceIds
          .map((id) =>
            devices.find(
              (device) =>
                device.id === id
            )
          )
          .filter(
            (
              device
            ): device is OutputDevice =>
              Boolean(device)
          )
      : [];

  const missingDeviceCount =
    selectedStation
      ? selectedStation.outputDeviceIds.filter(
          (id) =>
            !devices.some(
              (device) =>
                device.id === id
            )
        ).length
      : 0;

  const deviceMatchesMode = (
    device: OutputDevice
  ) => {
    if (!selectedStation) {
      return true;
    }

    if (
      selectedStation.mode === "both"
    ) {
      return true;
    }

    return (
      device.type ===
      selectedStation.mode
    );
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Back Office / Kitchen
            Stations
          </div>

          <div style={subtleStyle}>
            Route each station to one or
            more Printer / KDS devices.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={addStation}
            style={topButton("#2563EB")}
          >
            + Add Station
          </button>

          <button
            onClick={onBack}
            style={topButton("#334155")}
          >
            ← Back
          </button>
        </div>
      </header>

      <main style={gridStyle}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>
            Stations
          </h3>

          <div style={scrollStyle}>
            {sortedStations.map(
              (station) => {
                const assignedCount =
                  station.outputDeviceIds
                    .length;

                return (
                  <button
                    key={station.id}
                    onClick={() =>
                      setSelectedId(
                        station.id
                      )
                    }
                    style={{
                      ...stationButton,
                      background:
                        selectedId ===
                        station.id
                          ? "#1D4ED8"
                          : "#1E293B",
                      opacity:
                        station.available
                          ? 1
                          : 0.55,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                      }}
                    >
                      {station.name}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#CBD5E1",
                        marginTop: 5,
                      }}
                    >
                      Order {station.order} •{" "}
                      {station.available
                        ? "Available"
                        : "Disabled"}{" "}
                      •{" "}
                      {station.mode.toUpperCase()}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: "#FDE68A",
                        marginTop: 5,
                      }}
                    >
                      {assignedCount > 0
                        ? `${assignedCount} output device(s)`
                        : "No output device"}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>
            Station Settings
          </h3>

          {!selectedStation ? (
            <div style={emptyStyle}>
              Select a station
            </div>
          ) : (
            <div style={scrollStyle}>
              <label style={labelStyle}>
                Station Name
              </label>

              <input
                value={
                  selectedStation.name
                }
                onChange={(event) =>
                  updateSelected({
                    name:
                      event.target.value,
                  })
                }
                style={inputStyle}
              />

              <label style={labelStyle}>
                Display Order
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  selectedStation.order
                }
                onChange={(event) =>
                  updateSelected({
                    order: Math.max(
                      0,
                      Number(
                        event.target.value
                      )
                    ),
                  })
                }
                style={inputStyle}
              />

              <label style={labelStyle}>
                Output Mode
              </label>

              <select
                value={
                  selectedStation.mode
                }
                onChange={(event) =>
                  updateSelected({
                    mode:
                      event.target
                        .value as OutputMode,
                  })
                }
                style={inputStyle}
              >
                <option value="printer">
                  Printer
                </option>

                <option value="kds">
                  KDS
                </option>

                <option value="both">
                  Printer + KDS
                </option>
              </select>

              <label style={labelStyle}>
                Assigned Output Devices
              </label>

              <div style={helpTextStyle}>
                Select one or more devices.
                A station can print, send to
                KDS, or do both.
              </div>

              <div style={deviceListStyle}>
                {sortedDevices.length ===
                0 ? (
                  <div style={emptyDeviceStyle}>
                    No Printer / KDS devices
                    found. Create them first
                    in Printers & KDS.
                  </div>
                ) : (
                  sortedDevices.map(
                    (device) => {
                      const assigned =
                        selectedStation.outputDeviceIds.includes(
                          device.id
                        );

                      const compatible =
                        deviceMatchesMode(
                          device
                        );

                      return (
                        <button
                          key={device.id}
                          disabled={
                            !compatible
                          }
                          onClick={() =>
                            toggleDevice(
                              device.id
                            )
                          }
                          style={{
                            ...deviceButtonStyle,
                            border:
                              assigned
                                ? "2px solid #F8FAFC"
                                : "1px solid #475569",
                            background:
                              assigned
                                ? "#1D4ED8"
                                : "#1E293B",
                            opacity:
                              !compatible
                                ? 0.35
                                : device.enabled
                                ? 1
                                : 0.55,
                            cursor:
                              compatible
                                ? "pointer"
                                : "not-allowed",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                              }}
                            >
                              {assigned
                                ? "✓ "
                                : ""}
                              {device.name}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color:
                                  "#CBD5E1",
                                fontSize:
                                  10,
                              }}
                            >
                              {device.type.toUpperCase()}
                              {" • "}
                              {device.enabled
                                ? "Enabled"
                                : "Disabled"}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: 10,
                              color:
                                device.type ===
                                "printer"
                                  ? "#93C5FD"
                                  : "#C4B5FD",
                            }}
                          >
                            {device.address.trim()
                              ? device.address
                              : "No address"}
                          </span>
                        </button>
                      );
                    }
                  )
                )}
              </div>

              {missingDeviceCount > 0 && (
                <div style={warningCard}>
                  <div>
                    {missingDeviceCount} saved
                    device assignment(s) no
                    longer exist.
                  </div>

                  <button
                    onClick={
                      clearMissingDeviceIds
                    }
                    style={smallWarningButton}
                  >
                    Clean Missing
                  </button>
                </div>
              )}

              <label style={labelStyle}>
                Availability
              </label>

              <button
                onClick={() =>
                  updateSelected({
                    available:
                      !selectedStation.available,
                  })
                }
                style={{
                  ...availabilityButton,
                  background:
                    selectedStation.available
                      ? "#14532D"
                      : "#7F1D1D",
                }}
              >
                {selectedStation.available
                  ? "✓ Available"
                  : "Disabled"}
              </button>

              <div style={infoCard}>
                <strong>
                  Active Routing
                </strong>

                <div
                  style={{
                    marginTop: 7,
                    color: "#CBD5E1",
                    lineHeight: 1.5,
                  }}
                >
                  Menu Item →{" "}
                  {selectedStation.name} →{" "}
                  {assignedDevices.length >
                  0
                    ? assignedDevices
                        .map(
                          (device) =>
                            device.name
                        )
                        .join(" + ")
                    : "No Output Device"}
                </div>
              </div>

              <button
                onClick={deleteSelected}
                style={deleteButton}
              >
                Delete Station
              </button>
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>
            Routing Preview
          </h3>

          <div style={scrollStyle}>
            {sortedStations.length ===
            0 ? (
              <div style={emptyStyle}>
                No stations yet
              </div>
            ) : (
              sortedStations.map(
                (station) => {
                  const stationDevices =
                    station.outputDeviceIds
                      .map((id) =>
                        devices.find(
                          (device) =>
                            device.id ===
                            id
                        )
                      )
                      .filter(
                        (
                          device
                        ): device is OutputDevice =>
                          Boolean(device)
                      );

                  return (
                    <div
                      key={station.id}
                      style={previewCard}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: 8,
                        }}
                      >
                        <strong>
                          {station.name}
                        </strong>

                        <span
                          style={{
                            color:
                              station.available
                                ? "#86EFAC"
                                : "#FCA5A5",
                            fontSize: 12,
                          }}
                        >
                          {station.available
                            ? "ON"
                            : "OFF"}
                        </span>
                      </div>

                      <div
                        style={{
                          color:
                            "#94A3B8",
                          marginTop: 8,
                          fontSize: 12,
                        }}
                      >
                        {station.mode ===
                        "printer"
                          ? "Printer destination"
                          : station.mode ===
                            "kds"
                          ? "KDS destination"
                          : "Printer + KDS destination"}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          display: "grid",
                          gap: 5,
                        }}
                      >
                        {stationDevices.length >
                        0 ? (
                          stationDevices.map(
                            (device) => (
                              <div
                                key={
                                  device.id
                                }
                                style={{
                                  background:
                                    "#0B1220",
                                  border:
                                    "1px solid #334155",
                                  borderRadius:
                                    7,
                                  padding:
                                    "7px 8px",
                                  fontSize:
                                    11,
                                }}
                              >
                                {device.type ===
                                "printer"
                                  ? "🖨 "
                                  : "🖥 "}
                                {device.name}
                                {!device.enabled
                                  ? " (Disabled)"
                                  : ""}
                              </div>
                            )
                          )
                        ) : (
                          <div
                            style={{
                              color:
                                "#FCA5A5",
                              fontSize:
                                11,
                            }}
                          >
                            No output device
                            assigned
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )
            )}
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
  gridTemplateColumns:
    "280px minmax(390px, 1fr) 320px",
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

const stationButton: React.CSSProperties = {
  width: "100%",
  minHeight: 82,
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

const helpTextStyle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 11,
  marginBottom: 8,
  lineHeight: 1.4,
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

const availabilityButton: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  border: "none",
  borderRadius: 9,
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const deviceListStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 7,
  maxHeight: 240,
  overflowY: "auto",
};

const deviceButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 58,
  color: "white",
  borderRadius: 9,
  padding: "9px 10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  textAlign: "left",
};

const emptyDeviceStyle: React.CSSProperties = {
  color: "#64748B",
  background: "#111827",
  border: "1px dashed #475569",
  borderRadius: 9,
  padding: 16,
  textAlign: "center",
  lineHeight: 1.4,
  fontSize: 12,
};

const warningCard: React.CSSProperties = {
  marginTop: 9,
  padding: 10,
  borderRadius: 8,
  background: "#78350F",
  color: "#FDE68A",
  fontSize: 11,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const smallWarningButton: React.CSSProperties = {
  border: "1px solid #F59E0B",
  background: "#92400E",
  color: "white",
  borderRadius: 6,
  padding: "5px 8px",
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
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

function topButton(
  background: string
): React.CSSProperties {
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

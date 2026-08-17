import { useMemo, useState } from "react";

type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  available: boolean;
  nextGroupIds: string[];
};

type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  available: boolean;
  options: ModifierOption[];
};

type ModifierManagementProps = {
  onBack: () => void;
};

const STORAGE_KEY = "behesht-modifier-groups";

const defaultGroups: ModifierGroup[] = [
  {
    id: "group-side",
    name: "Choose Side",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    options: [
      {
        id: "side-rice",
        name: "Rice",
        priceDelta: 0,
        available: true,
        nextGroupIds: [],
      },
      {
        id: "side-bread",
        name: "Bread",
        priceDelta: 0,
        available: true,
        nextGroupIds: [],
      },
      {
        id: "side-salad",
        name: "Salad",
        priceDelta: 0,
        available: true,
        nextGroupIds: ["group-salad-type"],
      },
    ],
  },
  {
    id: "group-salad-type",
    name: "Choose Salad",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    options: [
      {
        id: "salad-shirazi",
        name: "Shirazi Salad",
        priceDelta: 0,
        available: true,
        nextGroupIds: [],
      },
      {
        id: "salad-caesar",
        name: "Caesar Salad",
        priceDelta: 2,
        available: true,
        nextGroupIds: ["group-dressing"],
      },
    ],
  },
  {
    id: "group-dressing",
    name: "Choose Dressing",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    options: [
      {
        id: "dressing-caesar",
        name: "Caesar",
        priceDelta: 0,
        available: true,
        nextGroupIds: [],
      },
      {
        id: "dressing-ranch",
        name: "Ranch",
        priceDelta: 0,
        available: true,
        nextGroupIds: [],
      },
      {
        id: "dressing-balsamic",
        name: "Balsamic",
        priceDelta: 0,
        available: true,
        nextGroupIds: [],
      },
    ],
  },
];

function loadGroups(): ModifierGroup[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultGroups;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultGroups;

    return parsed.map((group) => ({
      id: String(group.id),
      name: String(group.name ?? "Modifier Group"),
      required: Boolean(group.required),
      minSelect: Math.max(0, Number(group.minSelect ?? 0)),
      maxSelect: Math.max(1, Number(group.maxSelect ?? 1)),
      available:
        group.available === undefined ? true : Boolean(group.available),
      options: Array.isArray(group.options)
        ? group.options.map((option: any) => ({
            id: String(option.id),
            name: String(option.name ?? "Option"),
            priceDelta: Number(option.priceDelta ?? 0),
            available:
              option.available === undefined
                ? true
                : Boolean(option.available),
            nextGroupIds: Array.isArray(option.nextGroupIds)
              ? option.nextGroupIds.map(String)
              : [],
          }))
        : [],
    }));
  } catch {
    return defaultGroups;
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ModifierManagement({
  onBack,
}: ModifierManagementProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>(loadGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(
    () => loadGroups()[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");

  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? null;

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) =>
      group.name.toLowerCase().includes(query)
    );
  }, [groups, search]);

  const saveGroups = (next: ModifierGroup[]) => {
    setGroups(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateGroup = (
    groupId: string,
    patch: Partial<ModifierGroup>
  ) => {
    const next = groups.map((group) =>
      group.id === groupId ? { ...group, ...patch } : group
    );
    saveGroups(next);
  };

  const addGroup = () => {
    const id = makeId("group");
    const nextGroup: ModifierGroup = {
      id,
      name: "New Modifier Group",
      required: false,
      minSelect: 0,
      maxSelect: 1,
      available: true,
      options: [],
    };

    saveGroups([...groups, nextGroup]);
    setSelectedGroupId(id);
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;

    if (
      !window.confirm(
        `Delete "${group.name}"? Any links to this group will also be removed.`
      )
    ) {
      return;
    }

    const next = groups
      .filter((item) => item.id !== groupId)
      .map((item) => ({
        ...item,
        options: item.options.map((option) => ({
          ...option,
          nextGroupIds: option.nextGroupIds.filter(
            (id) => id !== groupId
          ),
        })),
      }));

    saveGroups(next);
    setSelectedGroupId(next[0]?.id ?? "");
  };

  const addOption = () => {
    if (!selectedGroup) return;

    const option: ModifierOption = {
      id: makeId("option"),
      name: "New Option",
      priceDelta: 0,
      available: true,
      nextGroupIds: [],
    };

    updateGroup(selectedGroup.id, {
      options: [...selectedGroup.options, option],
    });
  };

  const updateOption = (
    optionId: string,
    patch: Partial<ModifierOption>
  ) => {
    if (!selectedGroup) return;

    updateGroup(selectedGroup.id, {
      options: selectedGroup.options.map((option) =>
        option.id === optionId ? { ...option, ...patch } : option
      ),
    });
  };

  const deleteOption = (optionId: string) => {
    if (!selectedGroup) return;

    updateGroup(selectedGroup.id, {
      options: selectedGroup.options.filter(
        (option) => option.id !== optionId
      ),
    });
  };

  const toggleNextGroup = (
    option: ModifierOption,
    targetGroupId: string
  ) => {
    const exists = option.nextGroupIds.includes(targetGroupId);

    updateOption(option.id, {
      nextGroupIds: exists
        ? option.nextGroupIds.filter((id) => id !== targetGroupId)
        : [...option.nextGroupIds, targetGroupId],
    });
  };

  const resetDefaults = () => {
    if (
      !window.confirm(
        "Reset Modifier Management to the sample Koobideh modifier setup?"
      )
    ) {
      return;
    }

    saveGroups(defaultGroups);
    setSelectedGroupId(defaultGroups[0].id);
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Back Office / Modifier Management
          </div>
          <div style={subtleText}>
            Build reusable modifier groups and conditional follow-up choices.
          </div>
        </div>

        <div style={headerActionsStyle}>
          <button onClick={addGroup} style={primaryButton}>
            + Add Group
          </button>

          <button onClick={resetDefaults} style={secondaryButton}>
            Reset Sample
          </button>

          <button onClick={onBack} style={secondaryButton}>
            ← Back
          </button>
        </div>
      </header>

      <main style={layoutStyle}>
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <strong>Modifier Groups</strong>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search groups..."
            style={inputStyle}
          />

          <div style={scrollStyle}>
            {visibleGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                style={{
                  ...groupButtonStyle,
                  background:
                    selectedGroupId === group.id
                      ? "#1D4ED8"
                      : "#1E293B",
                  border:
                    selectedGroupId === group.id
                      ? "2px solid white"
                      : "1px solid #475569",
                }}
              >
                <div style={rowBetween}>
                  <strong>{group.name}</strong>
                  <span
                    style={{
                      color: group.available ? "#86EFAC" : "#FCA5A5",
                      fontSize: 11,
                    }}
                  >
                    {group.available ? "Active" : "Off"}
                  </span>
                </div>

                <div style={miniText}>
                  {group.required ? "Required" : "Optional"} • Min{" "}
                  {group.minSelect} / Max {group.maxSelect}
                </div>

                <div style={miniText}>
                  {group.options.length} option(s)
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          {!selectedGroup ? (
            <div style={emptyStyle}>Select or create a modifier group.</div>
          ) : (
            <>
              <div style={panelHeaderStyle}>
                <strong>Group Settings</strong>
              </div>

              <div style={settingsGridStyle}>
                <label style={fieldStyle}>
                  <span style={labelStyle}>Group Name</span>
                  <input
                    value={selectedGroup.name}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        name: event.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Availability</span>
                  <button
                    onClick={() =>
                      updateGroup(selectedGroup.id, {
                        available: !selectedGroup.available,
                      })
                    }
                    style={{
                      ...toggleButtonStyle,
                      background: selectedGroup.available
                        ? "#166534"
                        : "#7F1D1D",
                    }}
                  >
                    {selectedGroup.available
                      ? "Available"
                      : "Unavailable"}
                  </button>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Required</span>
                  <button
                    onClick={() =>
                      updateGroup(selectedGroup.id, {
                        required: !selectedGroup.required,
                        minSelect: !selectedGroup.required
                          ? Math.max(1, selectedGroup.minSelect)
                          : 0,
                      })
                    }
                    style={{
                      ...toggleButtonStyle,
                      background: selectedGroup.required
                        ? "#1D4ED8"
                        : "#334155",
                    }}
                  >
                    {selectedGroup.required ? "Yes" : "No"}
                  </button>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Min Selection</span>
                  <input
                    type="number"
                    min="0"
                    value={selectedGroup.minSelect}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        minSelect: Math.max(
                          0,
                          Number(event.target.value)
                        ),
                      })
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Max Selection</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedGroup.maxSelect}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        maxSelect: Math.max(
                          1,
                          Number(event.target.value)
                        ),
                      })
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={addOption} style={primaryButton}>
                  + Add Option
                </button>

                <button
                  onClick={() => deleteGroup(selectedGroup.id)}
                  style={dangerButton}
                >
                  Delete Group
                </button>
              </div>

              <div style={dividerStyle} />

              <div style={panelHeaderStyle}>
                <strong>Options</strong>
                <span style={subtleText}>
                  Price delta is added to the menu item price.
                </span>
              </div>

              <div style={scrollStyle}>
                {selectedGroup.options.length === 0 && (
                  <div style={emptyStyle}>No options yet.</div>
                )}

                {selectedGroup.options.map((option) => (
                  <div key={option.id} style={optionCardStyle}>
                    <div style={optionTopGridStyle}>
                      <label style={fieldStyle}>
                        <span style={labelStyle}>Option Name</span>
                        <input
                          value={option.name}
                          onChange={(event) =>
                            updateOption(option.id, {
                              name: event.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </label>

                      <label style={fieldStyle}>
                        <span style={labelStyle}>Price +/-</span>
                        <input
                          type="number"
                          step="0.01"
                          value={option.priceDelta}
                          onChange={(event) =>
                            updateOption(option.id, {
                              priceDelta: Number(event.target.value),
                            })
                          }
                          style={inputStyle}
                        />
                      </label>

                      <label style={fieldStyle}>
                        <span style={labelStyle}>Availability</span>
                        <button
                          onClick={() =>
                            updateOption(option.id, {
                              available: !option.available,
                            })
                          }
                          style={{
                            ...toggleButtonStyle,
                            background: option.available
                              ? "#166534"
                              : "#7F1D1D",
                          }}
                        >
                          {option.available ? "Available" : "Off"}
                        </button>
                      </label>

                      <button
                        onClick={() => deleteOption(option.id)}
                        style={dangerSmallButton}
                      >
                        Delete
                      </button>
                    </div>

                    <div style={nestedBoxStyle}>
                      <div style={{ fontWeight: 700, marginBottom: 7 }}>
                        Conditional Next Group
                      </div>

                      <div style={miniText}>
                        Example: choosing Salad can open “Choose Salad”.
                      </div>

                      <div style={nextGroupGridStyle}>
                        {groups
                          .filter(
                            (group) =>
                              group.id !== selectedGroup.id
                          )
                          .map((group) => {
                            const linked =
                              option.nextGroupIds.includes(group.id);

                            return (
                              <button
                                key={group.id}
                                onClick={() =>
                                  toggleNextGroup(option, group.id)
                                }
                                style={{
                                  ...nextGroupButtonStyle,
                                  background: linked
                                    ? "#1D4ED8"
                                    : "#1E293B",
                                  border: linked
                                    ? "2px solid white"
                                    : "1px solid #475569",
                                }}
                              >
                                {linked ? "✓ " : ""}
                                {group.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <strong>Flow Preview</strong>
          </div>

          {!selectedGroup ? (
            <div style={emptyStyle}>No group selected.</div>
          ) : (
            <FlowPreview
              group={selectedGroup}
              allGroups={groups}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function FlowPreview({
  group,
  allGroups,
}: {
  group: ModifierGroup;
  allGroups: ModifierGroup[];
}) {
  return (
    <div style={scrollStyle}>
      <div style={previewGroupStyle}>
        <div style={rowBetween}>
          <strong>{group.name}</strong>
          <span style={miniText}>
            {group.required ? "Required" : "Optional"}
          </span>
        </div>

        <div style={miniText}>
          Select {group.minSelect}–{group.maxSelect}
        </div>
      </div>

      {group.options.map((option) => (
        <div key={option.id} style={previewOptionStyle}>
          <div style={rowBetween}>
            <span>{option.name}</span>
            <span style={{ color: "#86EFAC" }}>
              {option.priceDelta === 0
                ? "Included"
                : `${option.priceDelta > 0 ? "+" : ""}$${option.priceDelta.toFixed(
                    2
                  )}`}
            </span>
          </div>

          {option.nextGroupIds.length > 0 && (
            <div style={previewNestedStyle}>
              Opens:
              {option.nextGroupIds.map((id) => {
                const child = allGroups.find(
                  (candidate) => candidate.id === id
                );

                return (
                  <div key={id} style={previewChildStyle}>
                    → {child?.name ?? "Missing Group"}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div style={infoBoxStyle}>
        <strong>Example workflow</strong>
        <div style={{ marginTop: 7 }}>
          Koobideh → Choose Side → Salad → Choose Salad → Caesar
          Salad → Choose Dressing
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  height: "100vh",
  overflow: "hidden",
  background: "#0F172A",
  color: "white",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  flexDirection: "column" as const,
};

const headerStyle = {
  flex: "0 0 auto",
  background: "#020617",
  padding: "10px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const headerActionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap" as const,
};

const layoutStyle = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  display: "grid",
  gridTemplateColumns: "280px minmax(500px, 1fr) 340px",
  gap: 10,
  padding: 10,
};

const panelStyle = {
  minHeight: 0,
  overflow: "hidden",
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  flexDirection: "column" as const,
};

const panelHeaderStyle = {
  flex: "0 0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 9,
};

const scrollStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto" as const,
};

const groupButtonStyle = {
  width: "100%",
  color: "white",
  borderRadius: 9,
  padding: 10,
  marginBottom: 8,
  cursor: "pointer",
  textAlign: "left" as const,
};

const settingsGridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  gap: 8,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 5,
};

const labelStyle = {
  color: "#94A3B8",
  fontSize: 11,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  minHeight: 40,
  background: "#020617",
  color: "white",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "0 9px",
};

const primaryButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  background: "#2563EB",
  color: "white",
  fontWeight: "bold" as const,
  padding: "0 14px",
  cursor: "pointer",
};

const secondaryButton = {
  ...primaryButton,
  background: "#334155",
};

const dangerButton = {
  ...primaryButton,
  background: "#B91C1C",
  marginLeft: 8,
};

const dangerSmallButton = {
  minHeight: 40,
  alignSelf: "end",
  border: "1px solid #DC2626",
  borderRadius: 8,
  background: "#450A0A",
  color: "#FCA5A5",
  padding: "0 12px",
  cursor: "pointer",
};

const toggleButtonStyle = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const optionCardStyle = {
  background: "#0F172A",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: 10,
  marginBottom: 9,
};

const optionTopGridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr auto",
  gap: 8,
  alignItems: "end",
};

const nestedBoxStyle = {
  marginTop: 9,
  paddingTop: 9,
  borderTop: "1px solid #334155",
};

const nextGroupGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 6,
  marginTop: 7,
};

const nextGroupButtonStyle = {
  minHeight: 36,
  borderRadius: 7,
  color: "white",
  cursor: "pointer",
};

const dividerStyle = {
  borderTop: "1px solid #334155",
  margin: "12px 0",
};

const rowBetween = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

const subtleText = {
  color: "#94A3B8",
  fontSize: 12,
};

const miniText = {
  color: "#94A3B8",
  fontSize: 11,
  marginTop: 5,
};

const emptyStyle = {
  color: "#64748B",
  textAlign: "center" as const,
  padding: 24,
};

const previewGroupStyle = {
  background: "#1D4ED8",
  borderRadius: 9,
  padding: 10,
  marginBottom: 8,
};

const previewOptionStyle = {
  background: "#1E293B",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: 9,
  marginBottom: 7,
};

const previewNestedStyle = {
  marginTop: 7,
  color: "#FDE68A",
  fontSize: 11,
};

const previewChildStyle = {
  marginTop: 4,
  paddingLeft: 7,
};

const infoBoxStyle = {
  background: "#052E16",
  border: "1px solid #166534",
  borderRadius: 9,
  padding: 10,
  marginTop: 12,
  color: "#BBF7D0",
};

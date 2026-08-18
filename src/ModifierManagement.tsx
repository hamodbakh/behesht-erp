import { useEffect, useMemo, useState } from "react";

type ModifierInputType = "single" | "multi" | "number" | "text";
type PriceMode = "add" | "replace";
type ModifierDisplayStyle = "grid" | "quick" | "compact";
type KitchenRoute = "inherit" | "kitchen" | "bar" | "shisha" | "dessert" | "none";

type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  priceMode: PriceMode;
  available: boolean;
  nextGroupIds: string[];
};

type ModifierGroup = {
  id: string;
  name: string;
  inputType: ModifierInputType;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  available: boolean;

  // Professional POS behavior
  displayOrder: number;
  displayStyle: ModifierDisplayStyle;
  freeChoices: number;
  autoAccept: boolean;
  allowDuplicate: boolean;
  kitchenName: string;
  kitchenRoute: KitchenRoute;

  // Number input settings
  numberMin: number;
  numberMax: number;
  numberStep: number;
  numberDefault: number;
  unitLabel: string;
  numberPricePerUnit: number;
  numberPriceMode: PriceMode;

  // Text input settings
  textPlaceholder: string;
  textDefault: string;
  textMaxLength: number;

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
    inputType: "single",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    displayOrder: 0,
    displayStyle: "grid",
    freeChoices: 0,
    autoAccept: false,
    allowDuplicate: false,
    kitchenName: "",
    kitchenRoute: "inherit",
    numberMin: 1,
    numberMax: 12,
    numberStep: 1,
    numberDefault: 1,
    unitLabel: "",
    numberPricePerUnit: 0,
    numberPriceMode: "add",
    textPlaceholder: "",
    textDefault: "",
    textMaxLength: 80,
    options: [
      {
        id: "side-rice",
        name: "Rice",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: [],
      },
      {
        id: "side-bread",
        name: "Bread",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: [],
      },
      {
        id: "side-salad",
        name: "Salad",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: ["group-salad-type"],
      },
    ],
  },
  {
    id: "group-salad-type",
    name: "Choose Salad",
    inputType: "single",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    displayOrder: 0,
    displayStyle: "grid",
    freeChoices: 0,
    autoAccept: false,
    allowDuplicate: false,
    kitchenName: "",
    kitchenRoute: "inherit",
    numberMin: 1,
    numberMax: 12,
    numberStep: 1,
    numberDefault: 1,
    unitLabel: "",
    numberPricePerUnit: 0,
    numberPriceMode: "add",
    textPlaceholder: "",
    textDefault: "",
    textMaxLength: 80,
    options: [
      {
        id: "salad-shirazi",
        name: "Shirazi Salad",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: [],
      },
      {
        id: "salad-caesar",
        name: "Caesar Salad",
        priceDelta: 2,
        priceMode: "add",
        available: true,
        nextGroupIds: ["group-dressing"],
      },
    ],
  },
  {
    id: "group-dressing",
    name: "Choose Dressing",
    inputType: "single",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    displayOrder: 0,
    displayStyle: "grid",
    freeChoices: 0,
    autoAccept: false,
    allowDuplicate: false,
    kitchenName: "",
    kitchenRoute: "inherit",
    numberMin: 1,
    numberMax: 12,
    numberStep: 1,
    numberDefault: 1,
    unitLabel: "",
    numberPricePerUnit: 0,
    numberPriceMode: "add",
    textPlaceholder: "",
    textDefault: "",
    textMaxLength: 80,
    options: [
      {
        id: "dressing-caesar",
        name: "Caesar",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: [],
      },
      {
        id: "dressing-ranch",
        name: "Ranch",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: [],
      },
      {
        id: "dressing-balsamic",
        name: "Balsamic",
        priceDelta: 0,
        priceMode: "add",
        available: true,
        nextGroupIds: [],
      },
    ],
  },
  {
    id: "group-cups",
    name: "Number of Cups",
    inputType: "number",
    required: true,
    minSelect: 0,
    maxSelect: 1,
    available: true,
    displayOrder: 0,
    displayStyle: "quick",
    freeChoices: 0,
    autoAccept: false,
    allowDuplicate: false,
    kitchenName: "CUPS",
    kitchenRoute: "inherit",
    numberMin: 1,
    numberMax: 12,
    numberStep: 1,
    numberDefault: 2,
    unitLabel: "Cups",
    numberPricePerUnit: 0,
    numberPriceMode: "add",
    textPlaceholder: "",
    textDefault: "",
    textMaxLength: 80,
    options: [],
  },
  {
    id: "group-serving-size",
    name: "Serving Size",
    inputType: "single",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    available: true,
    displayOrder: 0,
    displayStyle: "quick",
    freeChoices: 0,
    autoAccept: false,
    allowDuplicate: false,
    kitchenName: "",
    kitchenRoute: "inherit",
    numberMin: 1,
    numberMax: 12,
    numberStep: 1,
    numberDefault: 1,
    unitLabel: "",
    numberPricePerUnit: 0,
    numberPriceMode: "add",
    textPlaceholder: "",
    textDefault: "",
    textMaxLength: 80,
    options: [
      {
        id: "serving-shot",
        name: "Shot",
        priceDelta: 10.99,
        priceMode: "replace",
        available: true,
        nextGroupIds: [],
      },
      {
        id: "serving-bottle",
        name: "Bottle",
        priceDelta: 170,
        priceMode: "replace",
        available: true,
        nextGroupIds: [],
      },
    ],
  },
];

function normalizeGroup(group: any): ModifierGroup {
  const inputType: ModifierInputType =
    group.inputType === "multi" ||
    group.inputType === "number" ||
    group.inputType === "text"
      ? group.inputType
      : "single";

  return {
    id: String(group.id),
    name: String(group.name ?? "Modifier Group"),
    inputType,
    required: Boolean(group.required),
    minSelect: Math.max(0, Number(group.minSelect ?? (group.required ? 1 : 0))),
    maxSelect: Math.max(1, Number(group.maxSelect ?? 1)),
    available: group.available === undefined ? true : Boolean(group.available),

    displayOrder: Number(group.displayOrder ?? 0),
    displayStyle:
      group.displayStyle === "quick" || group.displayStyle === "compact"
        ? group.displayStyle
        : "grid",
    freeChoices: Math.max(0, Number(group.freeChoices ?? 0)),
    autoAccept: Boolean(group.autoAccept),
    allowDuplicate: Boolean(group.allowDuplicate),
    kitchenName: String(group.kitchenName ?? ""),
    kitchenRoute:
      group.kitchenRoute === "kitchen" ||
      group.kitchenRoute === "bar" ||
      group.kitchenRoute === "shisha" ||
      group.kitchenRoute === "dessert" ||
      group.kitchenRoute === "none"
        ? group.kitchenRoute
        : "inherit",

    numberMin: Number(group.numberMin ?? 1),
    numberMax: Number(group.numberMax ?? 12),
    numberStep: Math.max(0.01, Number(group.numberStep ?? 1)),
    numberDefault: Number(group.numberDefault ?? group.numberMin ?? 1),
    unitLabel: String(group.unitLabel ?? ""),
    numberPricePerUnit: Number(group.numberPricePerUnit ?? 0),
    numberPriceMode: group.numberPriceMode === "replace" ? "replace" : "add",

    textPlaceholder: String(group.textPlaceholder ?? ""),
    textDefault: String(group.textDefault ?? ""),
    textMaxLength: Math.max(1, Number(group.textMaxLength ?? 80)),

    options: Array.isArray(group.options)
      ? group.options.map((option: any) => ({
          id: String(option.id),
          name: String(option.name ?? "Option"),
          priceDelta: Number(option.priceDelta ?? 0),
          priceMode: option.priceMode === "replace" ? "replace" : "add",
          available: option.available === undefined ? true : Boolean(option.available),
          nextGroupIds: Array.isArray(option.nextGroupIds)
            ? option.nextGroupIds.map(String)
            : [],
        }))
      : [],
  };
}

function loadGroups(): ModifierGroup[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultGroups;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultGroups;
    return parsed.map(normalizeGroup);
  } catch {
    return defaultGroups;
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const typeLabel: Record<ModifierInputType, string> = {
  single: "Single Choice",
  multi: "Multiple Choice",
  number: "Number Input",
  text: "Text Input",
};

export default function ModifierManagement({
  onBack,
}: ModifierManagementProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>(loadGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(
    () => loadGroups()[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");

  // Persist the upgraded schema immediately, including defaults on first use.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, []);

  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? null;

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) =>
      `${group.name} ${typeLabel[group.inputType]}`
        .toLowerCase()
        .includes(query)
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
      inputType: "single",
      required: false,
      minSelect: 0,
      maxSelect: 1,
      available: true,
      displayOrder: groups.length,
      displayStyle: "grid",
      freeChoices: 0,
      autoAccept: false,
      allowDuplicate: false,
      kitchenName: "",
      kitchenRoute: "inherit",
      numberMin: 1,
      numberMax: 12,
      numberStep: 1,
      numberDefault: 1,
      unitLabel: "",
      numberPricePerUnit: 0,
      numberPriceMode: "add",
      textPlaceholder: "",
      textDefault: "",
      textMaxLength: 80,
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

  const changeType = (inputType: ModifierInputType) => {
    if (!selectedGroup) return;

    const patch: Partial<ModifierGroup> = { inputType };

    if (inputType === "single") {
      patch.maxSelect = 1;
      patch.minSelect = selectedGroup.required ? 1 : 0;
    } else if (inputType === "multi") {
      patch.maxSelect = Math.max(2, selectedGroup.maxSelect);
    }

    updateGroup(selectedGroup.id, patch);
  };

  const addOption = () => {
    if (!selectedGroup) return;

    const option: ModifierOption = {
      id: makeId("option"),
      name: "New Option",
      priceDelta: 0,
      priceMode: "add",
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
        "Reset Modifier Management to the sample reusable modifier setup?"
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
            Build reusable modifier groups once, then attach them to any menu item.
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

          <div style={scrollAreaStyle}>
            {visibleGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                style={{
                  ...groupCardStyle,
                  border:
                    group.id === selectedGroupId
                      ? "2px solid #60A5FA"
                      : "1px solid #334155",
                  background:
                    group.id === selectedGroupId
                      ? "#172554"
                      : "#0F172A",
                }}
              >
                <div style={{ fontWeight: 800 }}>{group.name}</div>
                <div style={smallText}>
                  {typeLabel[group.inputType]} •{" "}
                  {group.required ? "Required" : "Optional"} •{" "}
                  {group.available ? "Available" : "Unavailable"}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <strong>Group Settings</strong>
          </div>

          {!selectedGroup ? (
            <div style={emptyStyle}>Select or create a modifier group.</div>
          ) : (
            <div style={scrollAreaStyle}>
              <div style={formGrid}>
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
                  <span style={labelStyle}>Input Type</span>
                  <select
                    value={selectedGroup.inputType}
                    onChange={(event) =>
                      changeType(event.target.value as ModifierInputType)
                    }
                    style={inputStyle}
                  >
                    <option value="single">Single Choice</option>
                    <option value="multi">Multiple Choice</option>
                    <option value="number">Number Input</option>
                    <option value="text">Text Input</option>
                  </select>
                </label>
              </div>

              <div style={toggleRow}>
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedGroup.available}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        available: event.target.checked,
                      })
                    }
                  />
                  Available
                </label>

                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedGroup.required}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        required: event.target.checked,
                        minSelect:
                          selectedGroup.inputType === "single"
                            ? event.target.checked
                              ? 1
                              : 0
                            : selectedGroup.minSelect,
                      })
                    }
                  />
                  Required
                </label>
              </div>

              <div style={sectionTitleRow}>
                <strong>Professional POS Settings</strong>
              </div>

              <div style={formGrid}>
                <NumberField
                  label="Display Order"
                  value={selectedGroup.displayOrder}
                  onChange={(value) =>
                    updateGroup(selectedGroup.id, {
                      displayOrder: Math.max(0, Math.round(value)),
                    })
                  }
                />

                <label style={fieldStyle}>
                  <span style={labelStyle}>POS Display Style</span>
                  <select
                    value={selectedGroup.displayStyle}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        displayStyle: event.target.value as ModifierDisplayStyle,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="grid">Grid Buttons</option>
                    <option value="quick">Quick Buttons</option>
                    <option value="compact">Compact List</option>
                  </select>
                </label>

                <NumberField
                  label="Free Choices"
                  value={selectedGroup.freeChoices}
                  onChange={(value) =>
                    updateGroup(selectedGroup.id, {
                      freeChoices: Math.max(0, Math.round(value)),
                    })
                  }
                />

                <label style={fieldStyle}>
                  <span style={labelStyle}>Kitchen Name</span>
                  <input
                    value={selectedGroup.kitchenName}
                    placeholder="Optional short kitchen label"
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        kitchenName: event.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Kitchen Route</span>
                  <select
                    value={selectedGroup.kitchenRoute}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        kitchenRoute: event.target.value as KitchenRoute,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="inherit">Inherit from Main Item</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="bar">Bar</option>
                    <option value="shisha">Shisha</option>
                    <option value="dessert">Dessert</option>
                    <option value="none">Do Not Print / Display</option>
                  </select>
                </label>
              </div>

              <div style={toggleRow}>
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedGroup.autoAccept}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        autoAccept: event.target.checked,
                      })
                    }
                  />
                  Auto Accept When Only One Choice
                </label>

                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedGroup.allowDuplicate}
                    onChange={(event) =>
                      updateGroup(selectedGroup.id, {
                        allowDuplicate: event.target.checked,
                      })
                    }
                  />
                  Allow Duplicate Choice
                </label>
              </div>

              {(selectedGroup.inputType === "single" ||
                selectedGroup.inputType === "multi") && (
                <>
                  <div style={formGrid}>
                    <label style={fieldStyle}>
                      <span style={labelStyle}>Min Selection</span>
                      <input
                        type="number"
                        min={0}
                        value={selectedGroup.minSelect}
                        disabled={selectedGroup.inputType === "single"}
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
                        min={1}
                        value={selectedGroup.maxSelect}
                        disabled={selectedGroup.inputType === "single"}
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

                  <div style={sectionTitleRow}>
                    <strong>Options</strong>
                    <button onClick={addOption} style={smallPrimaryButton}>
                      + Add Option
                    </button>
                  </div>

                  {selectedGroup.options.length === 0 && (
                    <div style={emptyStyle}>No options yet.</div>
                  )}

                  {selectedGroup.options.map((option) => (
                    <div key={option.id} style={optionCard}>
                      <div style={optionTopGrid}>
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
                          <span style={labelStyle}>Price</span>
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
                          <span style={labelStyle}>Price Action</span>
                          <select
                            value={option.priceMode}
                            onChange={(event) =>
                              updateOption(option.id, {
                                priceMode: event.target.value as PriceMode,
                              })
                            }
                            style={inputStyle}
                          >
                            <option value="add">Add to Item Price</option>
                            <option value="replace">Replace Item Price</option>
                          </select>
                        </label>
                      </div>

                      <div style={toggleRow}>
                        <label style={checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={option.available}
                            onChange={(event) =>
                              updateOption(option.id, {
                                available: event.target.checked,
                              })
                            }
                          />
                          Available
                        </label>

                        <button
                          onClick={() => deleteOption(option.id)}
                          style={dangerButton}
                        >
                          Delete Option
                        </button>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div style={labelStyle}>
                          Conditional Next Group(s)
                        </div>
                        <div style={chipWrap}>
                          {groups
                            .filter((group) => group.id !== selectedGroup.id)
                            .map((group) => {
                              const active =
                                option.nextGroupIds.includes(group.id);
                              return (
                                <button
                                  key={group.id}
                                  onClick={() =>
                                    toggleNextGroup(option, group.id)
                                  }
                                  style={{
                                    ...chipButton,
                                    background: active
                                      ? "#2563EB"
                                      : "#1E293B",
                                    border: active
                                      ? "1px solid #60A5FA"
                                      : "1px solid #475569",
                                  }}
                                >
                                  {active ? "✓ " : ""}
                                  {group.name}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {selectedGroup.inputType === "number" && (
                <>
                  <div style={sectionTitleRow}>
                    <strong>Number Input Settings</strong>
                  </div>

                  <div style={formGrid}>
                    <NumberField
                      label="Minimum"
                      value={selectedGroup.numberMin}
                      onChange={(value) =>
                        updateGroup(selectedGroup.id, { numberMin: value })
                      }
                    />
                    <NumberField
                      label="Maximum"
                      value={selectedGroup.numberMax}
                      onChange={(value) =>
                        updateGroup(selectedGroup.id, { numberMax: value })
                      }
                    />
                    <NumberField
                      label="Step"
                      value={selectedGroup.numberStep}
                      onChange={(value) =>
                        updateGroup(selectedGroup.id, {
                          numberStep: Math.max(0.01, value),
                        })
                      }
                    />
                    <NumberField
                      label="Default"
                      value={selectedGroup.numberDefault}
                      onChange={(value) =>
                        updateGroup(selectedGroup.id, {
                          numberDefault: value,
                        })
                      }
                    />
                    <label style={fieldStyle}>
                      <span style={labelStyle}>Unit Label</span>
                      <input
                        value={selectedGroup.unitLabel}
                        placeholder="Cups, Guests, oz..."
                        onChange={(event) =>
                          updateGroup(selectedGroup.id, {
                            unitLabel: event.target.value,
                          })
                        }
                        style={inputStyle}
                      />
                    </label>
                    <NumberField
                      label="Price per Number"
                      value={selectedGroup.numberPricePerUnit}
                      onChange={(value) =>
                        updateGroup(selectedGroup.id, {
                          numberPricePerUnit: value,
                        })
                      }
                    />
                    <label style={fieldStyle}>
                      <span style={labelStyle}>Number Price Action</span>
                      <select
                        value={selectedGroup.numberPriceMode}
                        onChange={(event) =>
                          updateGroup(selectedGroup.id, {
                            numberPriceMode:
                              event.target.value as PriceMode,
                          })
                        }
                        style={inputStyle}
                      >
                        <option value="add">Add (number × price)</option>
                        <option value="replace">
                          Replace with (number × price)
                        </option>
                      </select>
                    </label>
                  </div>
                </>
              )}

              {selectedGroup.inputType === "text" && (
                <>
                  <div style={sectionTitleRow}>
                    <strong>Text Input Settings</strong>
                  </div>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>Placeholder</span>
                    <input
                      value={selectedGroup.textPlaceholder}
                      placeholder="Example: Cooking instruction"
                      onChange={(event) =>
                        updateGroup(selectedGroup.id, {
                          textPlaceholder: event.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>Default Text</span>
                    <input
                      value={selectedGroup.textDefault}
                      onChange={(event) =>
                        updateGroup(selectedGroup.id, {
                          textDefault: event.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                  </label>

                  <NumberField
                    label="Maximum Characters"
                    value={selectedGroup.textMaxLength}
                    onChange={(value) =>
                      updateGroup(selectedGroup.id, {
                        textMaxLength: Math.max(1, Math.round(value)),
                      })
                    }
                  />
                </>
              )}

              <button
                onClick={() => deleteGroup(selectedGroup.id)}
                style={{ ...dangerButton, marginTop: 16 }}
              >
                Delete Group
              </button>
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <strong>Flow Preview</strong>
          </div>

          {!selectedGroup ? (
            <div style={emptyStyle}>Nothing selected.</div>
          ) : (
            <div style={scrollAreaStyle}>
              <div style={previewCard}>
                <div style={{ fontSize: 19, fontWeight: 800 }}>
                  {selectedGroup.name}
                </div>
                <div style={smallText}>
                  {typeLabel[selectedGroup.inputType]} •{" "}
                  {selectedGroup.required ? "Required" : "Optional"} •{" "}
                  {selectedGroup.displayStyle === "quick"
                    ? "Quick Buttons"
                    : selectedGroup.displayStyle === "compact"
                    ? "Compact"
                    : "Grid"}
                </div>

                <div style={{ ...smallText, marginTop: 6 }}>
                  Order: {selectedGroup.displayOrder} • Free Choices:{" "}
                  {selectedGroup.freeChoices} • Route:{" "}
                  {selectedGroup.kitchenRoute}
                </div>

                {(selectedGroup.kitchenName ||
                  selectedGroup.autoAccept ||
                  selectedGroup.allowDuplicate) && (
                  <div style={{ ...smallText, marginTop: 6 }}>
                    {selectedGroup.kitchenName
                      ? `Kitchen: ${selectedGroup.kitchenName}`
                      : ""}
                    {selectedGroup.autoAccept ? " • Auto Accept" : ""}
                    {selectedGroup.allowDuplicate
                      ? " • Duplicates Allowed"
                      : ""}
                  </div>
                )}
              </div>

              {(selectedGroup.inputType === "single" ||
                selectedGroup.inputType === "multi") &&
                selectedGroup.options.map((option) => (
                  <div key={option.id} style={previewOption}>
                    <div>
                      <strong>{option.name}</strong>
                      <div style={smallText}>
                        {option.priceMode === "replace"
                          ? `Final item price: $${option.priceDelta.toFixed(2)}`
                          : option.priceDelta === 0
                          ? "No price change"
                          : `${option.priceDelta > 0 ? "+" : ""}$${option.priceDelta.toFixed(
                              2
                            )}`}
                      </div>
                    </div>

                    {option.nextGroupIds.length > 0 && (
                      <div style={flowText}>
                        →{" "}
                        {option.nextGroupIds
                          .map(
                            (id) =>
                              groups.find((group) => group.id === id)?.name ??
                              id
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))}

              {selectedGroup.inputType === "number" && (
                <div style={previewOption}>
                  <div>
                    <strong>
                      {selectedGroup.numberMin}–{selectedGroup.numberMax}{" "}
                      {selectedGroup.unitLabel}
                    </strong>
                    <div style={smallText}>
                      Step {selectedGroup.numberStep} • Default{" "}
                      {selectedGroup.numberDefault}
                    </div>
                  </div>
                  <div style={flowText}>
                    {selectedGroup.numberPricePerUnit === 0
                      ? "No price change"
                      : `${selectedGroup.numberPriceMode === "replace" ? "Replace" : "Add"} $${selectedGroup.numberPricePerUnit.toFixed(
                          2
                        )} × number`}
                  </div>
                </div>
              )}

              {selectedGroup.inputType === "text" && (
                <div style={previewOption}>
                  <div>
                    <strong>Free Text</strong>
                    <div style={smallText}>
                      Up to {selectedGroup.textMaxLength} characters
                    </div>
                  </div>
                </div>
              )}

              <div style={helpCard}>
                <strong>Reusable by design</strong>
                <div style={{ marginTop: 6 }}>
                  This group is reusable across any menu item. Item-level overrides
                  can be added later without duplicating the modifier group.
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={inputStyle}
      />
    </label>
  );
}

const pageStyle: React.CSSProperties = {
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  background: "#020617",
  color: "#F8FAFC",
  padding: 12,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexShrink: 0,
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 12,
  padding: "10px 12px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const layoutStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(220px, 0.8fr) minmax(460px, 1.65fr) minmax(260px, 0.95fr)",
  gap: 10,
};

const panelStyle: React.CSSProperties = {
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: "#0B1220",
  border: "1px solid #1E293B",
  borderRadius: 12,
  padding: 10,
};

const panelHeaderStyle: React.CSSProperties = {
  paddingBottom: 8,
  flexShrink: 0,
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: 4,
};

const groupCardStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  color: "#F8FAFC",
  borderRadius: 10,
  padding: 10,
  marginTop: 8,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 38,
  boxSizing: "border-box",
  background: "#0F172A",
  color: "#F8FAFC",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "7px 9px",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  marginBottom: 9,
};

const labelStyle: React.CSSProperties = {
  color: "#CBD5E1",
  fontSize: 12,
  fontWeight: 700,
};

const subtleText: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 12,
  marginTop: 2,
};

const smallText: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 12,
  marginTop: 4,
};

const primaryButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const smallPrimaryButton: React.CSSProperties = {
  ...primaryButton,
  padding: "6px 9px",
  fontSize: 12,
};

const secondaryButton: React.CSSProperties = {
  background: "#1E293B",
  color: "white",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "9px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButton: React.CSSProperties = {
  background: "#7F1D1D",
  color: "#FEE2E2",
  border: "1px solid #DC2626",
  borderRadius: 7,
  padding: "6px 9px",
  fontWeight: 700,
  cursor: "pointer",
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 9,
};

const optionTopGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(150px, 1.3fr) minmax(90px, 0.6fr) minmax(160px, 1fr)",
  gap: 8,
};

const toggleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const sectionTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  margin: "12px 0 8px",
  paddingTop: 10,
  borderTop: "1px solid #334155",
};

const optionCard: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: 10,
  marginBottom: 9,
};

const chipWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 6,
};

const chipButton: React.CSSProperties = {
  color: "white",
  borderRadius: 999,
  padding: "5px 8px",
  fontSize: 11,
  cursor: "pointer",
};

const previewCard: React.CSSProperties = {
  background: "#172554",
  border: "1px solid #3B82F6",
  borderRadius: 10,
  padding: 11,
  marginBottom: 9,
};

const previewOption: React.CSSProperties = {
  background: "#0F172A",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: 10,
  marginBottom: 8,
};

const flowText: React.CSSProperties = {
  color: "#93C5FD",
  fontSize: 12,
  marginTop: 7,
};

const helpCard: React.CSSProperties = {
  background: "#052E16",
  color: "#DCFCE7",
  border: "1px solid #166534",
  borderRadius: 9,
  padding: 10,
  marginTop: 10,
  fontSize: 12,
};

const emptyStyle: React.CSSProperties = {
  color: "#94A3B8",
  padding: 12,
};

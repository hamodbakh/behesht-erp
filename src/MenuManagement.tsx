import { useEffect, useMemo, useState } from "react";

export type MenuItemRecord = {
  id: string;
  name: string;
  category: string; // backward-compatible leaf label used by OrderScreen
  mainCategoryId: string;
  subcategoryId: string;
  price: number;
  available: boolean;
  modifierGroupIds: string[];
  kitchenStationId: string;
};

type ModifierGroupRecord = {
  id: string;
  name: string;
  available: boolean;
};

type KitchenStationRecord = {
  id: string;
  name: string;
  order: number;
  available: boolean;
  mode: "printer" | "kds" | "both";
};

type SubcategoryRecord = {
  id: string;
  name: string;
  order: number;
  available: boolean;
};

type CategoryRecord = {
  id: string;
  name: string;
  order: number;
  available: boolean;
  subcategories: SubcategoryRecord[];
};

const MENU_STORAGE_KEY = "behesht-menu-items";
const MODIFIER_STORAGE_KEY = "behesht-modifier-groups";
const CATEGORY_STORAGE_KEY = "behesht-menu-categories";
const KITCHEN_STATION_STORAGE_KEY = "behesht-kitchen-stations";

const defaultCategories: CategoryRecord[] = [
  { id: "cat-kebab", name: "Kebab", order: 1, available: true, subcategories: [] },
  { id: "cat-salad", name: "Salad", order: 2, available: true, subcategories: [] },
  { id: "cat-appetizer", name: "Appetizer", order: 3, available: true, subcategories: [] },
  { id: "cat-drinks", name: "Drinks", order: 4, available: true, subcategories: [] },
  { id: "cat-hookah", name: "Hookah", order: 5, available: true, subcategories: [] },
  { id: "cat-other", name: "Other", order: 99, available: true, subcategories: [] },
];

const defaultMenu: MenuItemRecord[] = [
  { id: "1", name: "Koobideh", category: "Kebab", mainCategoryId: "cat-kebab", subcategoryId: "", price: 19.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "2", name: "Joojeh", category: "Kebab", mainCategoryId: "cat-kebab", subcategoryId: "", price: 21.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "3", name: "Vaziri", category: "Kebab", mainCategoryId: "cat-kebab", subcategoryId: "", price: 27.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "4", name: "Shirazi Salad", category: "Salad", mainCategoryId: "cat-salad", subcategoryId: "", price: 8.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "5", name: "Caesar Salad", category: "Salad", mainCategoryId: "cat-salad", subcategoryId: "", price: 12.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "6", name: "Kashk Bademjan", category: "Appetizer", mainCategoryId: "cat-appetizer", subcategoryId: "", price: 13.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "7", name: "Hummus", category: "Appetizer", mainCategoryId: "cat-appetizer", subcategoryId: "", price: 9.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "8", name: "Tea", category: "Drinks", mainCategoryId: "cat-drinks", subcategoryId: "", price: 4.99, available: true, modifierGroupIds: [], kitchenStationId: "station-bar" },
  { id: "9", name: "Coke", category: "Drinks", mainCategoryId: "cat-drinks", subcategoryId: "", price: 3.99, available: true, modifierGroupIds: [], kitchenStationId: "station-bar" },
  { id: "10", name: "Water", category: "Drinks", mainCategoryId: "cat-drinks", subcategoryId: "", price: 2.99, available: true, modifierGroupIds: [], kitchenStationId: "station-bar" },
  { id: "11", name: "Classic Hookah", category: "Hookah", mainCategoryId: "cat-hookah", subcategoryId: "", price: 29.99, available: true, modifierGroupIds: [], kitchenStationId: "station-shisha" },
  { id: "12", name: "Premium Hookah", category: "Hookah", mainCategoryId: "cat-hookah", subcategoryId: "", price: 39.99, available: true, modifierGroupIds: [], kitchenStationId: "station-shisha" },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadCategories(): CategoryRecord[] {
  const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultCategories;
    return parsed.map((c: any, i: number) => ({
      id: String(c.id ?? makeId("cat")),
      name: String(c.name ?? "Category"),
      order: Number(c.order ?? i + 1),
      available: c.available === undefined ? true : Boolean(c.available),
      subcategories: Array.isArray(c.subcategories)
        ? c.subcategories.map((s: any, j: number) => ({
            id: String(s.id ?? makeId("sub")),
            name: String(s.name ?? "Subcategory"),
            order: Number(s.order ?? j + 1),
            available: s.available === undefined ? true : Boolean(s.available),
          }))
        : [],
    }));
  } catch {
    return defaultCategories;
  }
}

function findLegacy(categories: CategoryRecord[], name: string) {
  const n = name.trim().toLowerCase();
  for (const c of categories) {
    if (c.name.trim().toLowerCase() === n) {
      return { mainCategoryId: c.id, subcategoryId: "", category: c.name };
    }
    const sub = c.subcategories.find((s) => s.name.trim().toLowerCase() === n);
    if (sub) {
      return { mainCategoryId: c.id, subcategoryId: sub.id, category: sub.name };
    }
  }
  return null;
}

function loadMenu(categories: CategoryRecord[]): MenuItemRecord[] {
  const saved = localStorage.getItem(MENU_STORAGE_KEY);
  if (!saved) return defaultMenu;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultMenu;

    return parsed.map((item: any) => {
      const legacy = String(item.category ?? "Other");
      let mainCategoryId = String(item.mainCategoryId ?? "");
      let subcategoryId = String(item.subcategoryId ?? "");

      if (!mainCategoryId) {
        const migrated = findLegacy(categories, legacy);
        if (migrated) {
          mainCategoryId = migrated.mainCategoryId;
          subcategoryId = migrated.subcategoryId;
        } else {
          mainCategoryId = categories.find((c) => c.name === "Other")?.id ?? categories[0]?.id ?? "";
          subcategoryId = "";
        }
      }

      const main = categories.find((c) => c.id === mainCategoryId);
      const sub = main?.subcategories.find((s) => s.id === subcategoryId);

      return {
        id: String(item.id),
        name: String(item.name ?? ""),
        category: sub?.name ?? main?.name ?? legacy,
        mainCategoryId,
        subcategoryId,
        price: Number(item.price ?? 0),
        available: item.available === undefined ? true : Boolean(item.available),
        modifierGroupIds: Array.isArray(item.modifierGroupIds) ? item.modifierGroupIds.map(String) : [],
        kitchenStationId: String(item.kitchenStationId ?? ""),
      };
    });
  } catch {
    return defaultMenu;
  }
}

function loadModifierGroups(): ModifierGroupRecord[] {
  const saved = localStorage.getItem(MODIFIER_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((g: any) => ({
      id: String(g.id),
      name: String(g.name ?? "Modifier Group"),
      available: g.available === undefined ? true : Boolean(g.available),
    }));
  } catch {
    return [];
  }
}

function loadKitchenStations(): KitchenStationRecord[] {
  const saved = localStorage.getItem(KITCHEN_STATION_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((station: any, index: number) => ({
      id: String(station.id ?? `station-${index + 1}`),
      name: String(station.name ?? "Station"),
      order: Number(station.order ?? index + 1),
      available: station.available === undefined ? true : Boolean(station.available),
      mode:
        station.mode === "kds" || station.mode === "both"
          ? station.mode
          : "printer",
    }));
  } catch {
    return [];
  }
}

export default function MenuManagement({ onBack }: { onBack: () => void }) {
  const initialCategories = loadCategories();

  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [items, setItems] = useState<MenuItemRecord[]>(() => loadMenu(initialCategories));
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupRecord[]>(loadModifierGroups);
  const [kitchenStations, setKitchenStations] = useState<KitchenStationRecord[]>(loadKitchenStations);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [filterMainCategoryId, setFilterMainCategoryId] = useState("all");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState("all");
  const [searchText, setSearchText] = useState("");

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [categories]
  );

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const mainOk = filterMainCategoryId === "all" || item.mainCategoryId === filterMainCategoryId;
      const subOk = filterSubcategoryId === "all" || item.subcategoryId === filterSubcategoryId;
      const textOk = !q || item.name.toLowerCase().includes(q);
      return mainOk && subOk && textOk;
    });
  }, [items, filterMainCategoryId, filterSubcategoryId, searchText]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const refresh = () => {
      setModifierGroups(loadModifierGroups());
      setKitchenStations(loadKitchenStations());
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const saveCategories = (next: CategoryRecord[]) => {
    setCategories(next);
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next));
  };

  const addMainCategory = () => {
    const name = window.prompt("Main category name:", "Alcohol");
    if (!name?.trim()) return;

    if (categories.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      alert("This main category already exists.");
      return;
    }

    const next: CategoryRecord = {
      id: makeId("cat"),
      name: name.trim(),
      order: Math.max(0, ...categories.map((c) => c.order)) + 1,
      available: true,
      subcategories: [],
    };

    saveCategories([...categories, next]);
    setSelectedCategoryId(next.id);
    setFilterMainCategoryId(next.id);
    setFilterSubcategoryId("all");
  };

  const renameMainCategory = () => {
    if (!selectedCategory) return;
    const name = window.prompt("Rename main category:", selectedCategory.name);
    if (!name?.trim()) return;

    saveCategories(
      categories.map((c) =>
        c.id === selectedCategory.id ? { ...c, name: name.trim() } : c
      )
    );

    setItems((current) =>
      current.map((item) =>
        item.mainCategoryId === selectedCategory.id && !item.subcategoryId
          ? { ...item, category: name.trim() }
          : item
      )
    );
  };

  const addSubcategory = () => {
    if (!selectedCategory) return;

    const name = window.prompt(
      `New subcategory under ${selectedCategory.name}:`,
      selectedCategory.name === "Alcohol" ? "Tequila" : "New Subcategory"
    );
    if (!name?.trim()) return;

    if (
      selectedCategory.subcategories.some(
        (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      alert("This subcategory already exists.");
      return;
    }

    const nextSub: SubcategoryRecord = {
      id: makeId("sub"),
      name: name.trim(),
      order: Math.max(0, ...selectedCategory.subcategories.map((s) => s.order)) + 1,
      available: true,
    };

    saveCategories(
      categories.map((c) =>
        c.id === selectedCategory.id
          ? { ...c, subcategories: [...c.subcategories, nextSub] }
          : c
      )
    );
  };

  const renameSubcategory = (subcategory: SubcategoryRecord) => {
    if (!selectedCategory) return;
    const name = window.prompt("Rename subcategory:", subcategory.name);
    if (!name?.trim()) return;

    saveCategories(
      categories.map((c) =>
        c.id === selectedCategory.id
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subcategory.id ? { ...s, name: name.trim() } : s
              ),
            }
          : c
      )
    );

    setItems((current) =>
      current.map((item) =>
        item.subcategoryId === subcategory.id ? { ...item, category: name.trim() } : item
      )
    );
  };

  const deleteSubcategory = (subcategory: SubcategoryRecord) => {
    if (!selectedCategory) return;
    const used = items.filter((item) => item.subcategoryId === subcategory.id).length;
    if (used > 0) {
      alert(`Move or delete ${used} item(s) from "${subcategory.name}" first.`);
      return;
    }

    if (!window.confirm(`Delete subcategory "${subcategory.name}"?`)) return;

    saveCategories(
      categories.map((c) =>
        c.id === selectedCategory.id
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subcategory.id) }
          : c
      )
    );

    if (filterSubcategoryId === subcategory.id) setFilterSubcategoryId("all");
  };

  const deleteMainCategory = () => {
    if (!selectedCategory) return;
    const used = items.filter((item) => item.mainCategoryId === selectedCategory.id).length;
    if (used > 0) {
      alert(`Move or delete ${used} item(s) from "${selectedCategory.name}" first.`);
      return;
    }

    if (!window.confirm(`Delete main category "${selectedCategory.name}"?`)) return;

    const next = categories.filter((c) => c.id !== selectedCategory.id);
    saveCategories(next);
    setSelectedCategoryId(next[0]?.id ?? "");
    setFilterMainCategoryId("all");
    setFilterSubcategoryId("all");
  };

  const toggleMainAvailability = () => {
    if (!selectedCategory) return;
    saveCategories(
      categories.map((c) =>
        c.id === selectedCategory.id ? { ...c, available: !c.available } : c
      )
    );
  };

  const toggleSubAvailability = (subcategory: SubcategoryRecord) => {
    if (!selectedCategory) return;
    saveCategories(
      categories.map((c) =>
        c.id === selectedCategory.id
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subcategory.id ? { ...s, available: !s.available } : s
              ),
            }
          : c
      )
    );
  };

  const addNewItem = () => {
    const main = sortedCategories.find((c) => c.available) ?? sortedCategories[0];

    const item: MenuItemRecord = {
      id: `menu-${Date.now()}`,
      name: "New Item",
      category: main?.name ?? "Other",
      mainCategoryId: main?.id ?? "",
      subcategoryId: "",
      price: 0,
      available: true,
      modifierGroupIds: [],
      kitchenStationId:
        kitchenStations.find((station) => station.available)?.id ?? "",
    };

    setItems((current) => [...current, item]);
    setSelectedId(item.id);
  };

  const updateSelectedItem = (changes: Partial<MenuItemRecord>) => {
    if (!selectedId) return;
    setItems((current) =>
      current.map((item) => (item.id === selectedId ? { ...item, ...changes } : item))
    );
  };

  const setItemMainCategory = (id: string) => {
    const main = categories.find((c) => c.id === id);
    updateSelectedItem({
      mainCategoryId: id,
      subcategoryId: "",
      category: main?.name ?? "Other",
    });
  };

  const setItemSubcategory = (id: string) => {
    if (!selectedItem) return;
    const main = categories.find((c) => c.id === selectedItem.mainCategoryId);
    const sub = main?.subcategories.find((s) => s.id === id);
    updateSelectedItem({
      subcategoryId: id,
      category: sub?.name ?? main?.name ?? "Other",
    });
  };

  const toggleModifierGroup = (groupId: string) => {
    if (!selectedItem) return;
    const assigned = selectedItem.modifierGroupIds.includes(groupId);
    updateSelectedItem({
      modifierGroupIds: assigned
        ? selectedItem.modifierGroupIds.filter((id) => id !== groupId)
        : [...selectedItem.modifierGroupIds, groupId],
    });
  };

  const deleteSelectedItem = () => {
    if (!selectedItem) return;
    if (!window.confirm(`Delete ${selectedItem.name}?`)) return;
    setItems((current) => current.filter((item) => item.id !== selectedItem.id));
    setSelectedId(null);
  };

  const selectedItemMain = selectedItem
    ? categories.find((c) => c.id === selectedItem.mainCategoryId) ?? null
    : null;

  const selectedItemStation = selectedItem
    ? kitchenStations.find((station) => station.id === selectedItem.kitchenStationId) ?? null
    : null;

  const sortedKitchenStations = useMemo(
    () =>
      [...kitchenStations].sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name)
      ),
    [kitchenStations]
  );

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <strong style={{ fontSize: 22 }}>Back Office / Menu Management</strong>
          <div style={subtleText}>
            Main Categories → Subcategories → Menu Items
          </div>
        </div>

        <div style={headerActionsStyle}>
          <button onClick={addNewItem} style={topButton("#0891B2")}>+ Add Item</button>
          <button onClick={addMainCategory} style={topButton("#2563EB")}>+ Main Category</button>
          <button onClick={onBack} style={topButton("#334155")}>← Back</button>
        </div>
      </header>

      <main style={mainGridStyle}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Category Management</h3>

          <div style={scrollStyle}>
            <button
              onClick={() => {
                setFilterMainCategoryId("all");
                setFilterSubcategoryId("all");
              }}
              style={filterButton(filterMainCategoryId === "all")}
            >
              All Menu Items
            </button>

            {sortedCategories.map((category) => {
              const selected = category.id === selectedCategoryId;
              const filtering = category.id === filterMainCategoryId;

              return (
                <div key={category.id} style={{
                  ...categoryCardStyle,
                  border: selected ? "2px solid #60A5FA" : "1px solid #334155",
                }}>
                  <button
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setFilterMainCategoryId(category.id);
                      setFilterSubcategoryId("all");
                    }}
                    style={{
                      ...categoryNameButton,
                      background: filtering ? "#1D4ED8" : "#1E293B",
                      opacity: category.available ? 1 : 0.5,
                    }}
                  >
                    {category.name}
                  </button>

                  {selected && category.subcategories
                    .slice()
                    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                    .map((sub) => (
                      <div key={sub.id} style={subRowStyle}>
                        <button
                          onClick={() => {
                            setFilterMainCategoryId(category.id);
                            setFilterSubcategoryId(sub.id);
                          }}
                          style={{
                            ...subButtonStyle,
                            background: filterSubcategoryId === sub.id ? "#0F766E" : "#0F172A",
                            opacity: sub.available ? 1 : 0.5,
                          }}
                        >
                          ↳ {sub.name}
                        </button>

                        <button onClick={() => renameSubcategory(sub)} style={tinyButton}>✎</button>
                        <button onClick={() => toggleSubAvailability(sub)} style={tinyButton}>
                          {sub.available ? "●" : "○"}
                        </button>
                        <button onClick={() => deleteSubcategory(sub)} style={{ ...tinyButton, color: "#FCA5A5" }}>×</button>
                      </div>
                    ))}

                  {selected && (
                    <div style={categoryActionsStyle}>
                      <button onClick={addSubcategory} style={miniButton}>+ Subcategory</button>
                      <button onClick={renameMainCategory} style={miniButton}>Rename</button>
                      <button onClick={toggleMainAvailability} style={miniButton}>
                        {category.available ? "Disable" : "Enable"}
                      </button>
                      <button onClick={deleteMainCategory} style={{ ...miniButton, background: "#7F1D1D" }}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={menuHeaderStyle}>
            <div>
              <h3 style={{ margin: 0 }}>Menu Items</h3>
              <div style={subtleText}>{filteredItems.length} item(s)</div>
            </div>

            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search item..."
              style={{ ...inputStyle, width: 220 }}
            />
          </div>

          <div style={scrollStyle}>
            <div style={itemsGridStyle}>
              {filteredItems.map((item) => {
                const main = categories.find((c) => c.id === item.mainCategoryId);
                const sub = main?.subcategories.find((s) => s.id === item.subcategoryId);

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      ...itemCardStyle,
                      border: selectedId === item.id ? "3px solid white" : "1px solid #334155",
                      opacity: item.available ? 1 : 0.55,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
                    <div style={{ marginTop: 8, color: "#86EFAC", fontWeight: 800 }}>
                      ${item.price.toFixed(2)}
                    </div>
                    <div style={{ marginTop: 6, color: "#C4B5FD", fontSize: 11 }}>
                      {main?.name ?? "Unassigned"}{sub ? ` → ${sub.name}` : ""}
                    </div>
                    <div style={{ marginTop: 5, color: "#93C5FD", fontSize: 10 }}>
                      {item.modifierGroupIds.length > 0
                        ? `${item.modifierGroupIds.length} modifier group(s)`
                        : "No modifiers"}
                    </div>

                    <div style={{ marginTop: 5, color: "#FDE68A", fontSize: 10 }}>
                      Route:{" "}
                      {kitchenStations.find((station) => station.id === item.kitchenStationId)?.name ??
                        "Unassigned"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Item Settings</h3>

          {!selectedItem ? (
            <div style={emptyStyle}>Select an item</div>
          ) : (
            <div style={scrollStyle}>
              <label style={labelStyle}>Item Name</label>
              <input
                value={selectedItem.name}
                onChange={(e) => updateSelectedItem({ name: e.target.value })}
                style={inputStyle}
              />

              <label style={labelStyle}>Main Category</label>
              <select
                value={selectedItem.mainCategoryId}
                onChange={(e) => setItemMainCategory(e.target.value)}
                style={inputStyle}
              >
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.available ? "" : " (Disabled)"}
                  </option>
                ))}
              </select>

              <label style={labelStyle}>Subcategory</label>
              <select
                value={selectedItem.subcategoryId}
                onChange={(e) => setItemSubcategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">No Subcategory</option>
                {selectedItemMain?.subcategories
                  .slice()
                  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.available ? "" : " (Disabled)"}
                    </option>
                  ))}
              </select>

              <label style={labelStyle}>Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={selectedItem.price}
                onChange={(e) => updateSelectedItem({ price: Math.max(0, Number(e.target.value)) })}
                style={inputStyle}
              />

              <label style={labelStyle}>Availability</label>
              <button
                onClick={() => updateSelectedItem({ available: !selectedItem.available })}
                style={{
                  width: "100%",
                  minHeight: 46,
                  border: "none",
                  borderRadius: 9,
                  background: selectedItem.available ? "#14532D" : "#7F1D1D",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {selectedItem.available ? "✓ Available" : "Unavailable"}
              </button>

              <label style={labelStyle}>Kitchen Station</label>
              <div style={helpTextStyle}>
                Choose where this menu item should be routed when Send to Kitchen is pressed.
              </div>

              <select
                value={selectedItem.kitchenStationId}
                onChange={(e) => updateSelectedItem({ kitchenStationId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Unassigned</option>
                {sortedKitchenStations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                    {station.available ? "" : " (Disabled)"}
                  </option>
                ))}
              </select>

              {selectedItemStation && (
                <div
                  style={{
                    marginTop: 7,
                    padding: 9,
                    borderRadius: 8,
                    background: "#172554",
                    border: "1px solid #1D4ED8",
                    color: "#BFDBFE",
                    fontSize: 11,
                  }}
                >
                  Route → {selectedItemStation.name} • {selectedItemStation.mode.toUpperCase()}
                </div>
              )}

              <label style={labelStyle}>Assigned Modifier Groups</label>
              <div style={helpTextStyle}>
                Attach reusable modifier groups such as Choose Flavor, Number of Cups or Serving Size.
              </div>

              <div style={modifierListStyle}>
                {modifierGroups.map((group) => {
                  const assigned = selectedItem.modifierGroupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleModifierGroup(group.id)}
                      style={{
                        ...modifierButtonStyle,
                        border: assigned ? "2px solid white" : "1px solid #475569",
                        background: assigned ? "#1D4ED8" : "#1E293B",
                        opacity: group.available ? 1 : 0.55,
                      }}
                    >
                      <span>{assigned ? "✓ " : ""}{group.name}</span>
                      <span style={{ fontSize: 10, color: group.available ? "#86EFAC" : "#FCA5A5" }}>
                        {group.available ? "Active" : "Off"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid #334155", margin: "18px 0" }} />

              <button
                onClick={deleteSelectedItem}
                style={{
                  width: "100%",
                  minHeight: 46,
                  border: "none",
                  borderRadius: 9,
                  background: "#DC2626",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Delete Item
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  background: "#0F172A",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 12,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const headerStyle: React.CSSProperties = {
  flexShrink: 0,
  background: "#020617",
  borderRadius: 14,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const mainGridStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "300px minmax(420px, 1fr) 360px",
  gap: 10,
};

const panelStyle: React.CSSProperties = {
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 12,
};

const scrollStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: 3,
};

const subtleText: React.CSSProperties = {
  color: "#94A3B8",
  marginTop: 4,
  fontSize: 12,
};

const categoryCardStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: 6,
  marginBottom: 7,
  background: "#0B1220",
};

const categoryNameButton: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  border: "none",
  borderRadius: 8,
  color: "white",
  textAlign: "left",
  padding: "0 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const subRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 28px 28px 28px",
  gap: 4,
  marginTop: 5,
};

const subButtonStyle: React.CSSProperties = {
  minHeight: 34,
  border: "1px solid #334155",
  borderRadius: 7,
  color: "white",
  textAlign: "left",
  padding: "0 8px",
  cursor: "pointer",
  fontSize: 12,
};

const tinyButton: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "white",
  borderRadius: 6,
  cursor: "pointer",
};

const categoryActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 5,
  marginTop: 7,
  paddingTop: 7,
  borderTop: "1px solid #334155",
};

const miniButton: React.CSSProperties = {
  border: "1px solid #475569",
  background: "#1E293B",
  color: "white",
  borderRadius: 6,
  padding: "5px 7px",
  fontSize: 10,
  cursor: "pointer",
};

const filterButton = (selected: boolean): React.CSSProperties => ({
  width: "100%",
  minHeight: 42,
  border: "none",
  borderRadius: 8,
  background: selected ? "#2563EB" : "#1E293B",
  color: "white",
  textAlign: "left",
  padding: "0 10px",
  fontWeight: 800,
  cursor: "pointer",
  marginBottom: 8,
});

const menuHeaderStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
  flexWrap: "wrap",
};

const itemsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
  gap: 9,
};

const itemCardStyle: React.CSSProperties = {
  minHeight: 110,
  borderRadius: 12,
  background: "#1E293B",
  color: "white",
  textAlign: "left",
  padding: 11,
  cursor: "pointer",
};

const topButton = (background: string): React.CSSProperties => ({
  border: "none",
  borderRadius: 8,
  background,
  color: "white",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 42,
  padding: "0 9px",
  background: "#020617",
  color: "white",
  border: "1px solid #475569",
  borderRadius: 8,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#CBD5E1",
  fontSize: 12,
  marginTop: 12,
  marginBottom: 5,
  fontWeight: 700,
};

const helpTextStyle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 11,
  marginBottom: 8,
  lineHeight: 1.4,
};

const modifierListStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 6,
  maxHeight: 210,
  overflowY: "auto",
};

const modifierButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  borderRadius: 8,
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 9px",
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  color: "#64748B",
  textAlign: "center",
  padding: 30,
};
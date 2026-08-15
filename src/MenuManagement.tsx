import { useEffect, useMemo, useState } from "react";

export type MenuItemRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
};

const MENU_STORAGE_KEY = "behesht-menu-items";

const defaultMenu: MenuItemRecord[] = [
  {
    id: "1",
    name: "Koobideh",
    category: "Kebab",
    price: 19.99,
    available: true,
  },
  {
    id: "2",
    name: "Joojeh",
    category: "Kebab",
    price: 21.99,
    available: true,
  },
  {
    id: "3",
    name: "Vaziri",
    category: "Kebab",
    price: 27.99,
    available: true,
  },
  {
    id: "4",
    name: "Shirazi Salad",
    category: "Salad",
    price: 8.99,
    available: true,
  },
  {
    id: "5",
    name: "Caesar Salad",
    category: "Salad",
    price: 12.99,
    available: true,
  },
  {
    id: "6",
    name: "Kashk Bademjan",
    category: "Appetizer",
    price: 13.99,
    available: true,
  },
  {
    id: "7",
    name: "Hummus",
    category: "Appetizer",
    price: 9.99,
    available: true,
  },
  {
    id: "8",
    name: "Tea",
    category: "Drinks",
    price: 4.99,
    available: true,
  },
  {
    id: "9",
    name: "Coke",
    category: "Drinks",
    price: 3.99,
    available: true,
  },
  {
    id: "10",
    name: "Water",
    category: "Drinks",
    price: 2.99,
    available: true,
  },
  {
    id: "11",
    name: "Classic Hookah",
    category: "Hookah",
    price: 29.99,
    available: true,
  },
  {
    id: "12",
    name: "Premium Hookah",
    category: "Hookah",
    price: 39.99,
    available: true,
  },
];

function loadMenu(): MenuItemRecord[] {
  const saved = localStorage.getItem(MENU_STORAGE_KEY);

  if (!saved) {
    return defaultMenu;
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return defaultMenu;
    }

    return parsed.map((item) => ({
      id: String(item.id),
      name: String(item.name ?? ""),
      category: String(item.category ?? "Other"),
      price: Number(item.price ?? 0),
      available:
        item.available === undefined
          ? true
          : Boolean(item.available),
    }));
  } catch {
    return defaultMenu;
  }
}

export default function MenuManagement({
  onBack,
}: {
  onBack: () => void;
}) {
  const [items, setItems] =
    useState<MenuItemRecord[]>(loadMenu);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [filterCategory, setFilterCategory] =
    useState("All");

  const [searchText, setSearchText] =
    useState("");

  const selectedItem =
    items.find(
      (item) =>
        item.id === selectedId
    ) ?? null;

  const categories =
    useMemo(() => {
      const unique =
        Array.from(
          new Set(
            items.map(
              (item) =>
                item.category
            )
          )
        ).sort();

      return [
        "All",
        ...unique,
      ];
    }, [items]);

  const filteredItems =
    useMemo(() => {
      return items.filter(
        (item) => {
          const categoryMatch =
            filterCategory ===
              "All" ||
            item.category ===
              filterCategory;

          const searchMatch =
            item.name
              .toLowerCase()
              .includes(
                searchText
                  .trim()
                  .toLowerCase()
              );

          return (
            categoryMatch &&
            searchMatch
          );
        }
      );
    }, [
      items,
      filterCategory,
      searchText,
    ]);

  useEffect(() => {
    localStorage.setItem(
      MENU_STORAGE_KEY,
      JSON.stringify(items)
    );
  }, [items]);

  const addNewItem = () => {
    const newItem: MenuItemRecord = {
      id: `menu-${Date.now()}`,
      name: "New Item",
      category: "Other",
      price: 0,
      available: true,
    };

    setItems(
      (current) => [
        ...current,
        newItem,
      ]
    );

    setSelectedId(
      newItem.id
    );
  };

  const updateSelectedItem = (
    changes: Partial<MenuItemRecord>
  ) => {
    if (!selectedId) {
      return;
    }

    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            selectedId
              ? {
                  ...item,
                  ...changes,
                }
              : item
        )
    );
  };

  const deleteSelectedItem =
    () => {
      if (!selectedItem) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete ${selectedItem.name}?`
        );

      if (!confirmed) {
        return;
      }

      setItems(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              selectedItem.id
          )
      );

      setSelectedId(null);
    };

  const resetMenu = () => {
    const confirmed =
      window.confirm(
        "Reset menu to default items?"
      );

    if (!confirmed) {
      return;
    }

    setItems(defaultMenu);
    setSelectedId(null);
    setFilterCategory("All");
    setSearchText("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        color: "white",
        fontFamily:
          "Arial, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#020617",
          borderRadius: 14,
          padding: 14,
          marginBottom: 15,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong
            style={{
              fontSize: 22,
            }}
          >
            Back Office
          </strong>

          <div
            style={{
              color: "#94A3B8",
              marginTop: 4,
            }}
          >
            Menu Management
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
            onClick={addNewItem}
            style={topButton(
              "#0891B2"
            )}
          >
            + Add Item
          </button>

          <button
            onClick={resetMenu}
            style={topButton(
              "#B45309"
            )}
          >
            Reset Menu
          </button>

          <button
            onClick={onBack}
            style={topButton(
              "#334155"
            )}
          >
            ← Back
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "240px minmax(420px, 1fr) 360px",
          gap: 12,
          alignItems: "start",
        }}
      >
        <div
          style={panelStyle}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Categories
          </h3>

          {categories.map(
            (category) => (
              <button
                key={category}
                onClick={() =>
                  setFilterCategory(
                    category
                  )
                }
                style={{
                  width: "100%",
                  minHeight: 46,
                  border: "none",
                  borderRadius: 9,
                  marginBottom: 7,
                  background:
                    filterCategory ===
                    category
                      ? "#2563EB"
                      : "#1E293B",
                  color: "white",
                  textAlign: "left",
                  padding:
                    "0 12px",
                  cursor: "pointer",
                  fontWeight:
                    "bold",
                }}
              >
                {category}
              </button>
            )
          )}
        </div>

        <div
          style={panelStyle}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <h3
              style={{
                margin: 0,
              }}
            >
              Menu Items
            </h3>

            <input
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="Search item..."
              style={{
                ...inputStyle,
                width: 220,
              }}
            />
          </div>

          {filteredItems.length ===
            0 && (
            <div
              style={{
                color: "#64748B",
                textAlign: "center",
                padding: 40,
              }}
            >
              No items found
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {filteredItems.map(
              (item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedId(
                      item.id
                    )
                  }
                  style={{
                    minHeight: 110,
                    borderRadius: 12,
                    border:
                      selectedId ===
                      item.id
                        ? "3px solid white"
                        : "1px solid #334155",
                    background:
                      item.available
                        ? "#1E293B"
                        : "#3F3F46",
                    color: "white",
                    textAlign: "left",
                    padding: 12,
                    cursor: "pointer",
                    opacity:
                      item.available
                        ? 1
                        : 0.6,
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        "bold",
                      fontSize: 16,
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color:
                        "#86EFAC",
                      fontWeight:
                        "bold",
                    }}
                  >
                    $
                    {item.price.toFixed(
                      2
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color:
                        "#94A3B8",
                    }}
                  >
                    {item.category}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      fontWeight:
                        "bold",
                      color:
                        item.available
                          ? "#86EFAC"
                          : "#FCA5A5",
                    }}
                  >
                    {item.available
                      ? "Available"
                      : "Unavailable"}
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        <div
          style={panelStyle}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Item Settings
          </h3>

          {!selectedItem ? (
            <div
              style={{
                color: "#64748B",
                textAlign: "center",
                padding: 30,
              }}
            >
              Select an item
            </div>
          ) : (
            <>
              <label style={labelStyle}>
                Item Name
              </label>

              <input
                value={
                  selectedItem.name
                }
                onChange={(event) =>
                  updateSelectedItem({
                    name:
                      event.target
                        .value,
                  })
                }
                style={inputStyle}
              />

              <label style={labelStyle}>
                Category
              </label>

              <input
                value={
                  selectedItem.category
                }
                onChange={(event) =>
                  updateSelectedItem({
                    category:
                      event.target
                        .value,
                  })
                }
                style={inputStyle}
              />

              <label style={labelStyle}>
                Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  selectedItem.price
                }
                onChange={(event) =>
                  updateSelectedItem({
                    price:
                      Math.max(
                        0,
                        Number(
                          event.target
                            .value
                        )
                      ),
                  })
                }
                style={inputStyle}
              />

              <label style={labelStyle}>
                Availability
              </label>

              <button
                onClick={() =>
                  updateSelectedItem({
                    available:
                      !selectedItem.available,
                  })
                }
                style={{
                  width: "100%",
                  minHeight: 48,
                  border: "none",
                  borderRadius: 9,
                  background:
                    selectedItem.available
                      ? "#14532D"
                      : "#7F1D1D",
                  color: "white",
                  fontWeight:
                    "bold",
                  cursor: "pointer",
                }}
              >
                {selectedItem.available
                  ? "✓ Available"
                  : "Unavailable"}
              </button>

              <div
                style={{
                  borderTop:
                    "1px solid #334155",
                  margin:
                    "20px 0",
                }}
              />

              <button
                onClick={
                  deleteSelectedItem
                }
                style={{
                  width: "100%",
                  minHeight: 48,
                  border: "none",
                  borderRadius: 9,
                  background:
                    "#DC2626",
                  color: "white",
                  fontWeight:
                    "bold",
                  cursor: "pointer",
                }}
              >
                Delete Item
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const panelStyle = {
  background: "#111827",
  border:
    "1px solid #334155",
  borderRadius: 14,
  padding: 15,
};

const topButton = (
  background: string
) => ({
  border: "none",
  borderRadius: 8,
  background,
  color: "white",
  padding: "10px 14px",
  fontWeight:
    "bold" as const,
  cursor: "pointer",
});

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  minHeight: 44,
  padding: "0 10px",
  background: "#020617",
  color: "white",
  border:
    "1px solid #475569",
  borderRadius: 8,
};

const labelStyle = {
  display: "block",
  color: "#CBD5E1",
  fontSize: 13,
  marginTop: 14,
  marginBottom: 6,
};
import { useEffect, useMemo, useState } from "react";
import SplitBillScreen from "./SplitBillScreen";

type SeatSelection = number | "shared";

type ShareMode =
  | "none"
  | "all"
  | "selected"
  | "unassigned";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type TicketItem = {
  lineId: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;

  // Service / seat assignment
  guest: SeatSelection;

  sentQty: number;
  voidedQty: number;
  notes: string;
  discount: number;

  // Billing share information
  shareMode: ShareMode;
  sharedWith: number[];
};

type KitchenBatchItem = {
  lineId: string;
  name: string;
  guest: SeatSelection;
  qty: number;
};

type KitchenBatch = {
  id: string;
  orderId: string;
  createdAt: string;
  items: KitchenBatchItem[];
};

type VoidRecord = {
  id: string;
  orderId: string;
  lineId: string;
  itemName: string;
  guest: SeatSelection;
  qty: number;
  reason: string;
  createdAt: string;
};

type OrderScreenProps = {
  orderId: string;
  tableName: string;
  guests: number;
  onGuestsChange: (newGuestCount: number) => void;
  onBack: () => void;
};

const menuItems: MenuItem[] = [
  { id: "1", name: "Koobideh", category: "Kebab", price: 19.99 },
  { id: "2", name: "Joojeh", category: "Kebab", price: 21.99 },
  { id: "3", name: "Vaziri", category: "Kebab", price: 27.99 },

  { id: "4", name: "Shirazi Salad", category: "Salad", price: 8.99 },
  { id: "5", name: "Caesar Salad", category: "Salad", price: 12.99 },

  {
    id: "6",
    name: "Kashk Bademjan",
    category: "Appetizer",
    price: 13.99,
  },
  {
    id: "7",
    name: "Hummus",
    category: "Appetizer",
    price: 9.99,
  },

  { id: "8", name: "Tea", category: "Drinks", price: 4.99 },
  { id: "9", name: "Coke", category: "Drinks", price: 3.99 },
  { id: "10", name: "Water", category: "Drinks", price: 2.99 },

  {
    id: "11",
    name: "Classic Hookah",
    category: "Hookah",
    price: 29.99,
  },
  {
    id: "12",
    name: "Premium Hookah",
    category: "Hookah",
    price: 39.99,
  },
];

const categories = [
  "Kebab",
  "Appetizer",
  "Salad",
  "Drinks",
  "Hookah",
];

const voidReasons = [
  "Customer Changed Mind",
  "Wrong Item Entered",
  "Kitchen Error",
  "Duplicate Order",
  "Manager Adjustment",
  "Other",
];

function loadArray<T>(key: string): T[] {
  const saved = localStorage.getItem(key);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadTicket(key: string): TicketItem[] {
  const saved = loadArray<any>(key);

  return saved.map((item, index) => ({
    lineId:
      item.lineId ??
      `${item.id ?? item.menuItemId ?? "item"}-${Date.now()}-${index}`,

    menuItemId:
      item.menuItemId ??
      item.id ??
      `old-item-${index}`,

    name: item.name ?? "Item",

    price: Number(item.price ?? 0),

    qty: Number(item.qty ?? 1),

    guest:
      item.guest === "shared"
        ? "shared"
        : Number(item.guest ?? 1),

    sentQty: Number(item.sentQty ?? 0),

    voidedQty: Number(item.voidedQty ?? 0),

    notes: item.notes ?? "",

    discount: Number(item.discount ?? 0),

    shareMode:
      item.shareMode ??
      (item.guest === "shared"
        ? "unassigned"
        : "none"),

    sharedWith: Array.isArray(item.sharedWith)
      ? item.sharedWith.map(Number)
      : [],
  }));
}

export default function OrderScreen({
  orderId,
  tableName,
  guests,
  onGuestsChange,
  onBack,
}: OrderScreenProps) {
  const ticketStorageKey = `behesht-ticket-${orderId}`;
  const kitchenStorageKey = `behesht-kitchen-${orderId}`;
  const voidStorageKey = `behesht-voids-${orderId}`;

  const [selectedCategory, setSelectedCategory] =
    useState("Kebab");

  const [activeSeat, setActiveSeat] =
    useState<SeatSelection>(1);

  const [serviceGuests, setServiceGuests] =
    useState(guests);

  const [ticket, setTicket] =
    useState<TicketItem[]>(() =>
      loadTicket(ticketStorageKey)
    );

  const [kitchenBatches, setKitchenBatches] =
    useState<KitchenBatch[]>(() =>
      loadArray<KitchenBatch>(kitchenStorageKey)
    );

  const [voidRecords, setVoidRecords] =
    useState<VoidRecord[]>(() =>
      loadArray<VoidRecord>(voidStorageKey)
    );

  const [selectedLineId, setSelectedLineId] =
    useState<string | null>(null);

  const [moveItem, setMoveItem] =
    useState<TicketItem | null>(null);

  const [notesItem, setNotesItem] =
    useState<TicketItem | null>(null);

  const [notesText, setNotesText] =
    useState("");

  const [discountItem, setDiscountItem] =
    useState<TicketItem | null>(null);

  const [discountPercent, setDiscountPercent] =
    useState(10);

  const [voidItem, setVoidItem] =
    useState<TicketItem | null>(null);

  const [voidQty, setVoidQty] =
    useState(1);

  const [voidReason, setVoidReason] =
    useState("");

  const [customVoidReason, setCustomVoidReason] =
    useState("");

  const [shareItem, setShareItem] =
    useState<TicketItem | null>(null);

  const [shareSelection, setShareSelection] =
    useState<number[]>([]);

  const [showKitchenHistory, setShowKitchenHistory] =
    useState(false);

  const [showVoidHistory, setShowVoidHistory] =
    useState(false);

  const [showSplitBill, setShowSplitBill] =
    useState(false);

  useEffect(() => {
    localStorage.setItem(
      ticketStorageKey,
      JSON.stringify(ticket)
    );
  }, [ticketStorageKey, ticket]);

  useEffect(() => {
    localStorage.setItem(
      kitchenStorageKey,
      JSON.stringify(kitchenBatches)
    );
  }, [kitchenStorageKey, kitchenBatches]);

  useEffect(() => {
    localStorage.setItem(
      voidStorageKey,
      JSON.stringify(voidRecords)
    );
  }, [voidStorageKey, voidRecords]);

  useEffect(() => {
    setServiceGuests(guests);
  }, [guests]);

  useEffect(() => {
    if (
      activeSeat !== "shared" &&
      activeSeat > serviceGuests
    ) {
      setActiveSeat(serviceGuests);
    }
  }, [serviceGuests, activeSeat]);

  const filteredItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          item.category === selectedCategory
      ),
    [selectedCategory]
  );

  const subtotal = ticket.reduce(
    (sum, item) => {
      const gross =
        item.price * item.qty;

      const discountAmount =
        gross *
        ((item.discount ?? 0) / 100);

      return sum + gross - discountAmount;
    },
    0
  );

  const tax = subtotal * 0.13;

  const total =
    subtotal + tax;

  const unsentCount =
    ticket.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.qty - item.sentQty
        ),
      0
    );

  const allGuestNumbers =
    Array.from(
      { length: serviceGuests },
      (_, index) => index + 1
    );

  const addGuest = () => {
    const newGuestCount =
      serviceGuests + 1;

    setServiceGuests(
      newGuestCount
    );

    onGuestsChange(
      newGuestCount
    );

    // Items shared with ALL guests
    // automatically include the newly added guest.
    setTicket((current) =>
      current.map((item) =>
        item.shareMode === "all"
          ? {
              ...item,
              sharedWith: [
                ...Array.from(
                  { length: newGuestCount },
                  (_, index) => index + 1
                ),
              ],
            }
          : item
      )
    );

    setActiveSeat(
      newGuestCount
    );
  };

  const addItem = (
    item: MenuItem
  ) => {
    setTicket((current) => {
      const existing =
        current.find(
          (ticketItem) =>
            ticketItem.menuItemId === item.id &&
            ticketItem.guest === activeSeat &&
            ticketItem.notes === "" &&
            ticketItem.discount === 0 &&
            ticketItem.shareMode === "none"
        );

      if (existing) {
        return current.map(
          (ticketItem) =>
            ticketItem.lineId ===
            existing.lineId
              ? {
                  ...ticketItem,
                  qty:
                    ticketItem.qty + 1,
                }
              : ticketItem
        );
      }

      return [
        ...current,
        {
          lineId: `${orderId}-${item.id}-${String(
            activeSeat
          )}-${Date.now()}`,

          menuItemId: item.id,

          name: item.name,

          price: item.price,

          qty: 1,

          guest: activeSeat,

          sentQty: 0,

          voidedQty: 0,

          notes: "",

          discount: 0,

          shareMode: "none",

          sharedWith: [],
        },
      ];
    });
  };

  const increaseItem = (
    lineId: string
  ) => {
    setTicket((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              qty: item.qty + 1,
            }
          : item
      )
    );
  };

  const openVoid = (
    item: TicketItem
  ) => {
    setVoidItem(item);
    setVoidQty(1);
    setVoidReason("");
    setCustomVoidReason("");
  };

  const decreaseItem = (
    item: TicketItem
  ) => {
    if (item.qty <= item.sentQty) {
      openVoid(item);
      return;
    }

    setTicket((current) =>
      current
        .map((ticketItem) =>
          ticketItem.lineId ===
          item.lineId
            ? {
                ...ticketItem,
                qty:
                  ticketItem.qty - 1,
              }
            : ticketItem
        )
        .filter(
          (ticketItem) =>
            ticketItem.qty > 0
        )
    );
  };

  const removeItem = (
    item: TicketItem
  ) => {
    if (item.sentQty > 0) {
      openVoid(item);
      return;
    }

    const confirmed =
      window.confirm(
        `Remove ${item.name}?`
      );

    if (!confirmed) return;

    setTicket((current) =>
      current.filter(
        (ticketItem) =>
          ticketItem.lineId !== item.lineId
      )
    );

    setSelectedLineId(null);
  };

  const moveItemToSeat = (
    lineId: string,
    newSeat: SeatSelection
  ) => {
    setTicket((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? {
              ...item,

              guest: newSeat,

              shareMode:
                newSeat === "shared"
                  ? "unassigned"
                  : "none",

              sharedWith: [],
            }
          : item
      )
    );

    setMoveItem(null);
  };

  const openShare = (
    item: TicketItem
  ) => {
    setShareItem(item);

    if (
      item.shareMode === "selected"
    ) {
      setShareSelection(
        item.sharedWith
      );
    } else if (
      item.shareMode === "all"
    ) {
      setShareSelection(
        allGuestNumbers
      );
    } else {
      setShareSelection([]);
    }
  };

  const toggleShareGuest = (
    guestNumber: number
  ) => {
    setShareSelection(
      (current) =>
        current.includes(
          guestNumber
        )
          ? current.filter(
              (guest) =>
                guest !==
                guestNumber
            )
          : [
              ...current,
              guestNumber,
            ]
    );
  };

  const shareWithAll = () => {
    if (!shareItem) return;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest: "shared",

              shareMode: "all",

              sharedWith:
                allGuestNumbers,
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const shareWithSelected = () => {
    if (!shareItem) return;

    if (
      shareSelection.length < 2
    ) {
      alert(
        "Select at least 2 guests to share this item."
      );

      return;
    }

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest: "shared",

              shareMode:
                "selected",

              sharedWith: [
                ...shareSelection,
              ].sort(
                (a, b) =>
                  a - b
              ),
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const keepAsShared = () => {
    if (!shareItem) return;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest: "shared",

              shareMode:
                "unassigned",

              sharedWith: [],
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const removeSharing = () => {
    if (!shareItem) return;

    const destination =
      typeof shareItem.guest ===
      "number"
        ? shareItem.guest
        : 1;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest:
                destination,

              shareMode: "none",

              sharedWith: [],
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const saveNotes = () => {
    if (!notesItem) return;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        notesItem.lineId
          ? {
              ...item,

              notes:
                notesText.trim(),
            }
          : item
      )
    );

    setNotesItem(null);
    setNotesText("");
  };

  const saveDiscount = () => {
    if (!discountItem) return;

    const safeDiscount =
      Math.max(
        0,
        Math.min(
          100,
          discountPercent
        )
      );

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        discountItem.lineId
          ? {
              ...item,

              discount:
                safeDiscount,
            }
          : item
      )
    );

    setDiscountItem(null);
  };

  const sendToKitchen = () => {
    const unsentItems =
      ticket
        .map((item) => ({
          lineId: item.lineId,

          name: item.name,

          guest: item.guest,

          qty: Math.max(
            0,
            item.qty -
              item.sentQty
          ),
        }))
        .filter(
          (item) =>
            item.qty > 0
        );

    if (
      unsentItems.length === 0
    ) {
      alert(
        "Nothing new to send to Kitchen."
      );

      return;
    }

    const batch: KitchenBatch = {
      id: `kitchen-${Date.now()}`,

      orderId,

      createdAt:
        new Date().toLocaleString(),

      items: unsentItems,
    };

    setKitchenBatches(
      (current) => [
        ...current,
        batch,
      ]
    );

    setTicket((current) =>
      current.map((item) => ({
        ...item,

        sentQty:
          item.qty,
      }))
    );

    alert(
      `${unsentItems.reduce(
        (sum, item) =>
          sum + item.qty,
        0
      )} new item(s) sent to Kitchen.`
    );
  };

  const confirmVoid = () => {
    if (!voidItem) return;

    const finalReason =
      voidReason === "Other"
        ? customVoidReason.trim()
        : voidReason;

    if (!finalReason) {
      alert(
        "Please select or enter a Void reason."
      );

      return;
    }

    const maxVoidable =
      Math.min(
        voidItem.sentQty,
        voidItem.qty
      );

    const safeQty =
      Math.max(
        1,
        Math.min(
          voidQty,
          maxVoidable
        )
      );

    const record: VoidRecord = {
      id: `void-${Date.now()}`,

      orderId,

      lineId:
        voidItem.lineId,

      itemName:
        voidItem.name,

      guest:
        voidItem.guest,

      qty: safeQty,

      reason:
        finalReason,

      createdAt:
        new Date().toLocaleString(),
    };

    setVoidRecords(
      (current) => [
        ...current,
        record,
      ]
    );

    setTicket((current) =>
      current
        .map((item) => {
          if (
            item.lineId !==
            voidItem.lineId
          ) {
            return item;
          }

          return {
            ...item,

            qty:
              item.qty -
              safeQty,

            sentQty:
              Math.max(
                0,
                item.sentQty -
                  safeQty
              ),

            voidedQty:
              item.voidedQty +
              safeQty,
          };
        })
        .filter(
          (item) =>
            item.qty > 0
        )
    );

    setVoidItem(null);
    setSelectedLineId(null);
  };

  const guestLabel = (
    guest: SeatSelection
  ) =>
    guest === "shared"
      ? "Shared"
      : `Guest ${guest}`;

  const guestTotal = (
    guest: SeatSelection
  ) =>
    ticket
      .filter(
        (item) =>
          item.guest === guest
      )
      .reduce(
        (sum, item) => {
          const gross =
            item.price *
            item.qty;

          return (
            sum +
            gross -
            gross *
              (item.discount /
                100)
          );
        },
        0
      );

  const shareDescription = (
    item: TicketItem
  ) => {
    if (
      item.shareMode === "all"
    ) {
      return "Shared with all guests";
    }

    if (
      item.shareMode ===
        "selected" &&
      item.sharedWith.length > 0
    ) {
      return `Shared with ${item.sharedWith
        .map(
          (guest) =>
            `Guest ${guest}`
        )
        .join(", ")}`;
    }

    if (
      item.shareMode ===
      "unassigned"
    ) {
      return "Shared — billing not assigned";
    }

    return "";
  };

  const seatOrder: SeatSelection[] = [
    "shared",

    ...Array.from(
      {
        length:
          serviceGuests,
      },
      (_, index) =>
        index + 1
    ),
  ];

  if (showSplitBill) {
    return (
      <SplitBillScreen
        ticket={ticket}
        guests={
          serviceGuests
        }
        onTicketChange={(
          newTicket
        ) =>
          setTicket(
            newTicket as TicketItem[]
          )
        }
        onBack={() =>
          setShowSplitBill(
            false
          )
        }
        onContinueToPayment={() =>
          alert(
            "Payment Screen will be built after Shared Bill splitting."
          )
        }
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",

        background:
          "#0F172A",

        color: "white",

        fontFamily:
          "Arial, sans-serif",

        display: "flex",

        flexDirection:
          "column",
      }}
    >
      <div
        style={{
          background:
            "#020617",

          padding:
            "14px 20px",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap: 10,

          flexWrap:
            "wrap",
        }}
      >
        <div>
          <strong
            style={{
              fontSize: 20,
            }}
          >
            {tableName}
          </strong>

          <span
            style={{
              marginLeft: 15,

              color:
                "#94A3B8",
            }}
          >
            Guests:{" "}
            {serviceGuests}
          </span>
        </div>

        <div
          style={{
            display: "flex",

            gap: 8,

            flexWrap:
              "wrap",
          }}
        >
          <button
            onClick={() =>
              setShowKitchenHistory(
                true
              )
            }
            style={topButton(
              "#7C3AED"
            )}
          >
            Kitchen History
          </button>

          <button
            onClick={() =>
              setShowVoidHistory(
                true
              )
            }
            style={topButton(
              "#B91C1C"
            )}
          >
            Void History
          </button>

          <button
            onClick={onBack}
            style={topButton(
              "#334155"
            )}
          >
            ← Floor Plan
          </button>
        </div>
      </div>

      <div
        style={{
          background:
            "#111827",

          padding: 12,

          display: "flex",

          gap: 8,

          alignItems:
            "center",

          overflowX:
            "auto",

          borderBottom:
            "1px solid #334155",
        }}
      >
        <strong
          style={{
            marginRight: 8,

            whiteSpace:
              "nowrap",
          }}
        >
          Order For:
        </strong>

        <button
          onClick={() =>
            setActiveSeat(
              "shared"
            )
          }
          style={guestButton(
            activeSeat ===
              "shared"
          )}
        >
          <div>
            Shared
          </div>

          <div
            style={{
              fontSize: 11,

              marginTop: 4,
            }}
          >
            $
            {guestTotal(
              "shared"
            ).toFixed(2)}
          </div>
        </button>

        {allGuestNumbers.map(
          (guestNumber) => (
            <button
              key={
                guestNumber
              }
              onClick={() =>
                setActiveSeat(
                  guestNumber
                )
              }
              style={guestButton(
                activeSeat ===
                  guestNumber
              )}
            >
              <div>
                Guest{" "}
                {guestNumber}
              </div>

              <div
                style={{
                  fontSize: 11,

                  marginTop: 4,
                }}
              >
                $
                {guestTotal(
                  guestNumber
                ).toFixed(2)}
              </div>
            </button>
          )
        )}

        <button
          onClick={
            addGuest
          }
          title="Add Guest"
          style={{
            minWidth: 58,

            height: 55,

            borderRadius: 10,

            border:
              "2px dashed #22C55E",

            background:
              "#052E16",

            color:
              "#86EFAC",

            fontWeight:
              "bold",

            fontSize: 25,

            cursor:
              "pointer",
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          background:
            "#172554",

          padding: 9,

          textAlign:
            "center",

          color:
            "#BFDBFE",
        }}
      >
        New items will be added to{" "}
        <strong>
          {guestLabel(
            activeSeat
          )}
        </strong>
      </div>

      <div
        style={{
          flex: 1,

          display: "grid",

          gridTemplateColumns:
            "180px minmax(300px, 1fr) 420px",

          gap: 12,

          padding: 12,

          minHeight: 0,
        }}
      >
        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 12,
          }}
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
                  setSelectedCategory(
                    category
                  )
                }
                style={{
                  width: "100%",

                  minHeight: 55,

                  marginBottom: 8,

                  border: "none",

                  borderRadius: 10,

                  background:
                    selectedCategory ===
                    category
                      ? "#2563EB"
                      : "#1E293B",

                  color: "white",

                  fontWeight:
                    "bold",

                  cursor:
                    "pointer",
                }}
              >
                {category}
              </button>
            )
          )}
        </div>

        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 15,

            overflowY:
              "auto",
          }}
        >
          <h2
            style={{
              marginTop: 0,

              marginBottom: 5,
            }}
          >
            {selectedCategory}
          </h2>

          <div
            style={{
              color:
                "#94A3B8",

              marginBottom: 18,

              fontSize: 13,
            }}
          >
            Ordering for{" "}
            {guestLabel(
              activeSeat
            )}
          </div>

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fill, minmax(150px, 1fr))",

              gap: 12,
            }}
          >
            {filteredItems.map(
              (item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    addItem(item)
                  }
                  style={{
                    minHeight: 105,

                    borderRadius: 12,

                    border:
                      "2px solid #334155",

                    background:
                      "#1E293B",

                    color: "white",

                    cursor:
                      "pointer",

                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,

                      fontWeight:
                        "bold",
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      marginTop: 10,

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
                </button>
              )
            )}
          </div>
        </div>

        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 15,

            display: "flex",

            flexDirection:
              "column",

            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Order Ticket
            </h2>

            {unsentCount >
              0 && (
              <span
                style={{
                  background:
                    "#B45309",

                  borderRadius: 20,

                  padding:
                    "6px 10px",

                  fontSize: 12,

                  fontWeight:
                    "bold",
                }}
              >
                {unsentCount} New
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1,

              overflowY:
                "auto",

              minHeight: 250,
            }}
          >
            {ticket.length ===
              0 && (
              <div
                style={{
                  color:
                    "#64748B",

                  textAlign:
                    "center",

                  marginTop: 50,
                }}
              >
                No items yet
              </div>
            )}

            {seatOrder.map(
              (seat) => {
                const items =
                  ticket.filter(
                    (item) =>
                      item.guest ===
                      seat
                  );

                if (
                  items.length ===
                  0
                ) {
                  return null;
                }

                return (
                  <div
                    key={String(
                      seat
                    )}
                    style={{
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        background:
                          seat ===
                          "shared"
                            ? "#14532D"
                            : "#1E3A8A",

                        borderRadius: 8,

                        padding:
                          "8px 10px",

                        fontWeight:
                          "bold",

                        display: "flex",

                        justifyContent:
                          "space-between",

                        marginBottom: 5,
                      }}
                    >
                      <span>
                        {guestLabel(
                          seat
                        )}
                      </span>

                      <span>
                        $
                        {guestTotal(
                          seat
                        ).toFixed(
                          2
                        )}
                      </span>
                    </div>

                    {items.map(
                      (item) => {
                        const selected =
                          selectedLineId ===
                          item.lineId;

                        const unsentQty =
                          Math.max(
                            0,
                            item.qty -
                              item.sentQty
                          );

                        const gross =
                          item.price *
                          item.qty;

                        const discountValue =
                          gross *
                          (item.discount /
                            100);

                        const lineTotal =
                          gross -
                          discountValue;

                        const shareText =
                          shareDescription(
                            item
                          );

                        return (
                          <div
                            key={
                              item.lineId
                            }
                            style={{
                              borderBottom:
                                "1px solid #334155",

                              padding:
                                "10px 0",
                            }}
                          >
                            <button
                              onClick={() =>
                                setSelectedLineId(
                                  selected
                                    ? null
                                    : item.lineId
                                )
                              }
                              style={{
                                width:
                                  "100%",

                                border:
                                  "none",

                                background:
                                  selected
                                    ? "#1E293B"
                                    : "transparent",

                                color:
                                  "white",

                                textAlign:
                                  "left",

                                borderRadius: 8,

                                padding: 8,

                                cursor:
                                  "pointer",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",

                                  justifyContent:
                                    "space-between",

                                  gap: 10,
                                }}
                              >
                                <strong>
                                  {item.qty} ×{" "}
                                  {item.name}
                                </strong>

                                <strong>
                                  $
                                  {lineTotal.toFixed(
                                    2
                                  )}
                                </strong>
                              </div>

                              <div
                                style={{
                                  marginTop: 5,

                                  display:
                                    "flex",

                                  gap: 6,

                                  flexWrap:
                                    "wrap",

                                  fontSize: 11,
                                }}
                              >
                                {item.sentQty >
                                  0 && (
                                  <span
                                    style={{
                                      color:
                                        "#86EFAC",
                                    }}
                                  >
                                    ✓ Sent{" "}
                                    {item.sentQty}
                                  </span>
                                )}

                                {unsentQty >
                                  0 && (
                                  <span
                                    style={{
                                      color:
                                        "#FCD34D",
                                    }}
                                  >
                                    New{" "}
                                    {unsentQty}
                                  </span>
                                )}

                                {item.discount >
                                  0 && (
                                  <span
                                    style={{
                                      color:
                                        "#F0ABFC",
                                    }}
                                  >
                                    Discount{" "}
                                    {item.discount}%
                                  </span>
                                )}

                                {item.notes && (
                                  <span
                                    style={{
                                      color:
                                        "#93C5FD",
                                    }}
                                  >
                                    Note:{" "}
                                    {item.notes}
                                  </span>
                                )}

                                {shareText && (
                                  <span
                                    style={{
                                      color:
                                        "#FDE68A",

                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    ↔{" "}
                                    {shareText}
                                  </span>
                                )}
                              </div>
                            </button>

                            {selected && (
                              <div
                                style={{
                                  background:
                                    "#0F172A",

                                  borderRadius: 9,

                                  padding: 10,

                                  marginTop: 7,
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",

                                    gap: 7,

                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setDiscountItem(
                                        item
                                      );

                                      setDiscountPercent(
                                        item.discount ||
                                          10
                                      );
                                    }}
                                    style={
                                      actionButton
                                    }
                                  >
                                    Discount
                                  </button>

                                  <button
                                    onClick={() => {
                                      setNotesItem(
                                        item
                                      );

                                      setNotesText(
                                        item.notes
                                      );
                                    }}
                                    style={
                                      actionButton
                                    }
                                  >
                                    Notes
                                  </button>

                                  <button
                                    onClick={() =>
                                      setMoveItem(
                                        item
                                      )
                                    }
                                    style={
                                      actionButton
                                    }
                                  >
                                    Move
                                  </button>

                                  <button
                                    onClick={() =>
                                      openShare(
                                        item
                                      )
                                    }
                                    style={{
                                      ...actionButton,

                                      border:
                                        "2px solid #F59E0B",

                                      color:
                                        "#FDE68A",
                                    }}
                                  >
                                    Share
                                  </button>

                                  <button
                                    onClick={() =>
                                      removeItem(
                                        item
                                      )
                                    }
                                    style={{
                                      ...actionButton,

                                      border:
                                        "2px solid #DC2626",

                                      color:
                                        "#FCA5A5",
                                    }}
                                  >
                                    {item.sentQty >
                                    0
                                      ? "Void"
                                      : "Remove"}
                                  </button>
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap: 10,

                                    marginTop: 10,
                                  }}
                                >
                                  <span
                                    style={{
                                      color:
                                        "#CBD5E1",
                                    }}
                                  >
                                    Quantity
                                  </span>

                                  <button
                                    onClick={() =>
                                      decreaseItem(
                                        item
                                      )
                                    }
                                    style={
                                      qtyButton
                                    }
                                  >
                                    −
                                  </button>

                                  <strong>
                                    {item.qty}
                                  </strong>

                                  <button
                                    onClick={() =>
                                      increaseItem(
                                        item.lineId
                                      )
                                    }
                                    style={
                                      qtyButton
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              }
            )}
          </div>

          <div
            style={{
              borderTop:
                "2px solid #334155",

              paddingTop: 12,
            }}
          >
            <MoneyRow
              label="Subtotal"
              value={subtotal}
            />

            <MoneyRow
              label="Tax 13%"
              value={tax}
            />

            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                fontSize: 22,

                marginTop: 10,
              }}
            >
              <strong>
                Total
              </strong>

              <strong>
                ${total.toFixed(2)}
              </strong>
            </div>

            <button
              onClick={
                sendToKitchen
              }
              style={{
                width: "100%",

                height: 56,

                marginTop: 14,

                border: "none",

                borderRadius: 10,

                background:
                  unsentCount > 0
                    ? "#F59E0B"
                    : "#475569",

                color: "white",

                fontWeight:
                  "bold",

                fontSize: 17,

                cursor:
                  "pointer",
              }}
            >
              Send to Kitchen
              {unsentCount > 0
                ? ` (${unsentCount} New)`
                : ""}
            </button>

            <button
              onClick={() => {
                if (
                  ticket.length ===
                  0
                ) {
                  alert(
                    "There are no items on this order."
                  );

                  return;
                }

                setShowSplitBill(
                  true
                );
              }}
              style={{
                width: "100%",

                height: 55,

                marginTop: 9,

                border: "none",

                borderRadius: 10,

                background:
                  "#22C55E",

                color: "white",

                fontWeight:
                  "bold",

                fontSize: 17,

                cursor:
                  "pointer",
              }}
            >
              Checkout / Split Bill
            </button>
          </div>
        </div>
      </div>

      {/* SHARE */}

      {shareItem && (
        <Modal
          title="Share Item"
          onClose={() => {
            setShareItem(
              null
            );

            setShareSelection(
              []
            );
          }}
        >
          <div
            style={{
              background:
                "#1E293B",

              borderRadius: 10,

              padding: 12,

              marginBottom: 12,
            }}
          >
            <strong>
              {shareItem.qty} ×{" "}
              {shareItem.name}
            </strong>

            <div
              style={{
                marginTop: 6,

                color:
                  "#94A3B8",

                fontSize: 12,
              }}
            >
              Sharing changes only the bill. It does not resend the item to Kitchen.
            </div>
          </div>

          <button
            onClick={
              shareWithAll
            }
            style={{
              ...modalButton,

              background:
                "#16A34A",

              fontSize: 16,
            }}
          >
            Share with All Guests
          </button>

          <div
            style={{
              marginTop: 20,

              marginBottom: 8,

              fontWeight:
                "bold",
            }}
          >
            Or select guests:
          </div>

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(2, 1fr)",

              gap: 8,
            }}
          >
            {allGuestNumbers.map(
              (guestNumber) => {
                const selected =
                  shareSelection.includes(
                    guestNumber
                  );

                return (
                  <button
                    key={
                      guestNumber
                    }
                    onClick={() =>
                      toggleShareGuest(
                        guestNumber
                      )
                    }
                    style={{
                      minHeight: 48,

                      borderRadius: 9,

                      border:
                        selected
                          ? "3px solid white"
                          : "1px solid #475569",

                      background:
                        selected
                          ? "#2563EB"
                          : "#1E293B",

                      color:
                        "white",

                      fontWeight:
                        "bold",

                      cursor:
                        "pointer",
                    }}
                  >
                    {selected
                      ? "✓ "
                      : ""}
                    Guest{" "}
                    {guestNumber}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={
              shareWithSelected
            }
            style={{
              ...modalButton,

              background:
                "#2563EB",
            }}
          >
            Share with Selected Guests
          </button>

          <button
            onClick={
              keepAsShared
            }
            style={{
              ...modalButton,

              background:
                "#B45309",
            }}
          >
            Keep as Shared / Decide at Checkout
          </button>

          {shareItem.shareMode !==
            "none" && (
            <button
              onClick={
                removeSharing
              }
              style={{
                ...modalButton,

                background:
                  "#7F1D1D",
              }}
            >
              Remove Sharing
            </button>
          )}
        </Modal>
      )}

      {/* MOVE */}

      {moveItem && (
        <Modal
          title="Move Item"
          onClose={() =>
            setMoveItem(null)
          }
        >
          <p>
            Move{" "}
            <strong>
              {moveItem.name}
            </strong>{" "}
            to:
          </p>

          <button
            onClick={() =>
              moveItemToSeat(
                moveItem.lineId,
                "shared"
              )
            }
            style={modalButton}
          >
            Shared
          </button>

          {allGuestNumbers.map(
            (guestNumber) => (
              <button
                key={
                  guestNumber
                }
                onClick={() =>
                  moveItemToSeat(
                    moveItem.lineId,
                    guestNumber
                  )
                }
                style={modalButton}
              >
                Guest{" "}
                {guestNumber}
              </button>
            )
          )}
        </Modal>
      )}

      {/* NOTES */}

      {notesItem && (
        <Modal
          title="Item Notes"
          onClose={() =>
            setNotesItem(null)
          }
        >
          <textarea
            value={notesText}
            onChange={(event) =>
              setNotesText(
                event.target.value
              )
            }
            placeholder="Example: no onion, extra lemon..."
            style={{
              width: "100%",

              minHeight: 120,

              boxSizing:
                "border-box",

              padding: 12,

              borderRadius: 8,

              background:
                "#020617",

              color: "white",

              border:
                "1px solid #475569",
            }}
          />

          <button
            onClick={
              saveNotes
            }
            style={{
              ...modalButton,

              background:
                "#2563EB",
            }}
          >
            Save Note
          </button>
        </Modal>
      )}

      {/* DISCOUNT */}

      {discountItem && (
        <Modal
          title="Item Discount"
          onClose={() =>
            setDiscountItem(
              null
            )
          }
        >
          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(3, 1fr)",

              gap: 8,
            }}
          >
            {[
              5,
              10,
              15,
              20,
              25,
              50,
            ].map(
              (value) => (
                <button
                  key={value}
                  onClick={() =>
                    setDiscountPercent(
                      value
                    )
                  }
                  style={{
                    ...modalButton,

                    background:
                      discountPercent ===
                      value
                        ? "#2563EB"
                        : "#1E293B",
                  }}
                >
                  {value}%
                </button>
              )
            )}
          </div>

          <input
            type="number"
            min="0"
            max="100"
            value={
              discountPercent
            }
            onChange={(event) =>
              setDiscountPercent(
                Number(
                  event.target
                    .value
                )
              )
            }
            style={inputStyle}
          />

          <button
            onClick={
              saveDiscount
            }
            style={{
              ...modalButton,

              background:
                "#2563EB",
            }}
          >
            Apply Discount
          </button>
        </Modal>
      )}

      {/* VOID */}

      {voidItem && (
        <Modal
          title="Void Item"
          onClose={() =>
            setVoidItem(null)
          }
        >
          <div
            style={{
              background:
                "#7F1D1D",

              padding: 12,

              borderRadius: 9,

              marginBottom: 15,
            }}
          >
            <strong>
              {voidItem.name}
            </strong>

            <div
              style={{
                marginTop: 5,
              }}
            >
              Sent Qty:{" "}
              {voidItem.sentQty}
            </div>
          </div>

          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              gap: 12,

              marginBottom: 15,
            }}
          >
            <span>
              Void Quantity:
            </span>

            <button
              onClick={() =>
                setVoidQty(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
              style={
                qtyButton
              }
            >
              −
            </button>

            <strong>
              {voidQty}
            </strong>

            <button
              onClick={() =>
                setVoidQty(
                  (current) =>
                    Math.min(
                      voidItem.sentQty,
                      current + 1
                    )
                )
              }
              style={
                qtyButton
              }
            >
              +
            </button>
          </div>

          <select
            value={
              voidReason
            }
            onChange={(event) =>
              setVoidReason(
                event.target
                  .value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Select Void Reason
            </option>

            {voidReasons.map(
              (reason) => (
                <option
                  key={reason}
                  value={reason}
                >
                  {reason}
                </option>
              )
            )}
          </select>

          {voidReason ===
            "Other" && (
            <input
              value={
                customVoidReason
              }
              onChange={(event) =>
                setCustomVoidReason(
                  event.target
                    .value
                )
              }
              placeholder="Enter reason"
              style={inputStyle}
            />
          )}

          <button
            onClick={
              confirmVoid
            }
            style={{
              ...modalButton,

              background:
                "#DC2626",
            }}
          >
            Confirm Void
          </button>
        </Modal>
      )}

      {/* KITCHEN HISTORY */}

      {showKitchenHistory && (
        <Modal
          title="Kitchen History"
          onClose={() =>
            setShowKitchenHistory(
              false
            )
          }
        >
          {kitchenBatches.length ===
            0 && (
            <p
              style={{
                color:
                  "#94A3B8",
              }}
            >
              Nothing sent yet.
            </p>
          )}

          {[...kitchenBatches]
            .reverse()
            .map((batch) => (
              <div
                key={
                  batch.id
                }
                style={
                  historyCard
                }
              >
                <strong>
                  {batch.createdAt}
                </strong>

                {batch.items.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`${batch.id}-${index}`}
                      style={{
                        marginTop: 7,
                      }}
                    >
                      {item.qty} ×{" "}
                      {item.name}
                      {" — "}
                      {guestLabel(
                        item.guest
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
        </Modal>
      )}

      {/* VOID HISTORY */}

      {showVoidHistory && (
        <Modal
          title="Void History"
          onClose={() =>
            setShowVoidHistory(
              false
            )
          }
        >
          {voidRecords.length ===
            0 && (
            <p
              style={{
                color:
                  "#94A3B8",
              }}
            >
              No voids yet.
            </p>
          )}

          {[...voidRecords]
            .reverse()
            .map(
              (record) => (
                <div
                  key={
                    record.id
                  }
                  style={
                    historyCard
                  }
                >
                  <strong>
                    {
                      record.itemName
                    }
                  </strong>

                  <div>
                    Qty:{" "}
                    {
                      record.qty
                    }
                  </div>

                  <div>
                    {guestLabel(
                      record.guest
                    )}
                  </div>

                  <div>
                    Reason:{" "}
                    {
                      record.reason
                    }
                  </div>

                  <div
                    style={{
                      color:
                        "#94A3B8",

                      fontSize: 12,

                      marginTop: 5,
                    }}
                  >
                    {
                      record.createdAt
                    }
                  </div>
                </div>
              )
            )}
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        background:
          "rgba(0,0,0,.8)",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        zIndex: 9999,

        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: 480,

          maxHeight: "85vh",

          overflowY:
            "auto",

          background:
            "#111827",

          color: "white",

          borderRadius: 18,

          padding: 25,
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          {title}
        </h2>

        {children}

        <button
          onClick={
            onClose
          }
          style={{
            ...modalButton,

            background:
              "#475569",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        padding:
          "5px 0",

        color:
          "#CBD5E1",
      }}
    >
      <span>
        {label}
      </span>

      <strong>
        ${value.toFixed(2)}
      </strong>
    </div>
  );
}

const topButton = (
  background: string
) => ({
  background,

  color: "white",

  border: "none",

  borderRadius: 8,

  padding:
    "10px 14px",

  cursor:
    "pointer",

  fontWeight:
    "bold" as const,
});

const guestButton = (
  selected: boolean
) => ({
  minWidth: 100,

  height: 55,

  borderRadius: 10,

  border: selected
    ? "3px solid white"
    : "1px solid #475569",

  background: selected
    ? "#2563EB"
    : "#1E293B",

  color: "white",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
});

const actionButton = {
  minHeight: 38,

  borderRadius: 8,

  border:
    "2px solid #2563EB",

  background:
    "#111827",

  color:
    "#93C5FD",

  padding:
    "7px 10px",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
};

const qtyButton = {
  width: 34,

  height: 34,

  border: "none",

  borderRadius: 7,

  background:
    "#334155",

  color: "white",

  cursor:
    "pointer",

  fontSize: 18,
};

const modalButton = {
  width: "100%",

  minHeight: 46,

  marginTop: 10,

  border: "none",

  borderRadius: 9,

  background:
    "#1E293B",

  color: "white",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
};

const inputStyle = {
  width: "100%",

  boxSizing:
    "border-box" as const,

  height: 44,

  marginTop: 10,

  padding:
    "0 10px",

  background:
    "#020617",

  color: "white",

  border:
    "1px solid #475569",

  borderRadius: 8,
};

const historyCard = {
  background:
    "#1E293B",

  borderRadius: 10,

  padding: 12,

  marginBottom: 10,
};
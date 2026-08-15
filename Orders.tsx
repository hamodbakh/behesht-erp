import { useEffect, useRef, useState } from "react";
import OrderScreen from "./OrderScreen";

type TableStatus = "free" | "busy" | "reserved" | "payment";
type TableShape = "rectangle" | "round";
type FloorMode = "view" | "edit" | "join";

type TableData = {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: TableShape;
  groupId?: string;
  type?: "table" | "channel";
};

type OrderGroup = {
  id: string;
  tableIds: string[];
  guests: number;
  open: boolean;
  completedAt?: string;
};

const FLOOR_STORAGE_KEY = "behesht-floor-plan";
const ORDER_STORAGE_KEY = "behesht-order-groups";

const initialTables: TableData[] = [
  {
    id: "bench30a",
    name: "Bench 30",
    seats: 4,
    status: "free",
    x: 30,
    y: 30,
    width: 85,
    height: 145,
    shape: "rectangle",
  },
  {
    id: "bench40",
    name: "Bench 40",
    seats: 4,
    status: "free",
    x: 150,
    y: 30,
    width: 105,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "bench50",
    name: "Bench 50",
    seats: 4,
    status: "free",
    x: 265,
    y: 30,
    width: 105,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "bench60",
    name: "Bench 60",
    seats: 4,
    status: "free",
    x: 390,
    y: 30,
    width: 105,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "bench70",
    name: "Bench 70",
    seats: 4,
    status: "free",
    x: 515,
    y: 30,
    width: 105,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "bench80",
    name: "Bench 80",
    seats: 4,
    status: "free",
    x: 640,
    y: 30,
    width: 105,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "bench30b",
    name: "Bench 30",
    seats: 4,
    status: "free",
    x: 30,
    y: 185,
    width: 85,
    height: 145,
    shape: "rectangle",
  },

  {
    id: "table1a",
    name: "Table 1A",
    seats: 4,
    status: "free",
    x: 150,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table1b",
    name: "Table 1B",
    seats: 4,
    status: "free",
    x: 230,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table1c",
    name: "Table 1C",
    seats: 4,
    status: "free",
    x: 310,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table2",
    name: "Table 2",
    seats: 4,
    status: "free",
    x: 420,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table3",
    name: "Table 3",
    seats: 4,
    status: "free",
    x: 505,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table4a",
    name: "Table 4A",
    seats: 4,
    status: "free",
    x: 615,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table4b",
    name: "Table 4B",
    seats: 4,
    status: "free",
    x: 695,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table4c",
    name: "Table 4C",
    seats: 4,
    status: "free",
    x: 775,
    y: 125,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table5a",
    name: "Table 5A",
    seats: 4,
    status: "free",
    x: 150,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table5b",
    name: "Table 5B",
    seats: 4,
    status: "free",
    x: 230,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table5c",
    name: "Table 5C",
    seats: 4,
    status: "free",
    x: 310,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table6",
    name: "Table 6",
    seats: 4,
    status: "free",
    x: 420,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table7",
    name: "Table 7",
    seats: 4,
    status: "free",
    x: 505,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "table8a",
    name: "Table 8A",
    seats: 4,
    status: "free",
    x: 615,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table8b",
    name: "Table 8B",
    seats: 4,
    status: "free",
    x: 695,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },
  {
    id: "table8c",
    name: "Table 8C",
    seats: 4,
    status: "free",
    x: 775,
    y: 230,
    width: 75,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "bench20",
    name: "Bench 20",
    seats: 3,
    status: "free",
    x: 45,
    y: 365,
    width: 80,
    height: 115,
    shape: "rectangle",
  },

  {
    id: "table9",
    name: "Table 9",
    seats: 6,
    status: "free",
    x: 185,
    y: 350,
    width: 120,
    height: 70,
    shape: "rectangle",
  },

  {
    id: "table10",
    name: "Table 10",
    seats: 6,
    status: "free",
    x: 360,
    y: 350,
    width: 120,
    height: 70,
    shape: "rectangle",
  },

  {
    id: "table11a",
    name: "Table 11A",
    seats: 4,
    status: "free",
    x: 535,
    y: 350,
    width: 75,
    height: 70,
    shape: "rectangle",
  },
  {
    id: "table11b",
    name: "Table 11B",
    seats: 4,
    status: "free",
    x: 615,
    y: 350,
    width: 75,
    height: 70,
    shape: "rectangle",
  },

  {
    id: "table12",
    name: "Table 12",
    seats: 2,
    status: "free",
    x: 330,
    y: 465,
    width: 80,
    height: 65,
    shape: "rectangle",
  },

  {
    id: "uber",
    name: "Uber",
    seats: 1,
    status: "payment",
    x: 450,
    y: 465,
    width: 75,
    height: 65,
    shape: "rectangle",
    type: "channel",
  },
  {
    id: "doordash",
    name: "DoorDash",
    seats: 1,
    status: "payment",
    x: 535,
    y: 465,
    width: 75,
    height: 65,
    shape: "rectangle",
    type: "channel",
  },
  {
    id: "cash",
    name: "Cash",
    seats: 1,
    status: "payment",
    x: 620,
    y: 465,
    width: 95,
    height: 65,
    shape: "rectangle",
    type: "channel",
  },
];

function loadTables(): TableData[] {
  const saved = localStorage.getItem(FLOOR_STORAGE_KEY);

  if (!saved) return initialTables;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : initialTables;
  } catch {
    return initialTables;
  }
}

function loadOrderGroups(): OrderGroup[] {
  const saved = localStorage.getItem(ORDER_STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Orders() {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [tables, setTables] = useState<TableData[]>(loadTables);

  const [orderGroups, setOrderGroups] =
    useState<OrderGroup[]>(loadOrderGroups);

  const [mode, setMode] =
    useState<FloorMode>("view");

  const [selectedTableId, setSelectedTableId] =
    useState<string | null>(null);

  const [joinSelection, setJoinSelection] =
    useState<string[]>([]);

  const [selectedTable, setSelectedTable] =
    useState<TableData | null>(null);

  const [guestCount, setGuestCount] =
    useState(1);

  // Important:
  // Store only the active order ID.
  // This prevents stale guest counts.
  const [activeOrderId, setActiveOrderId] =
    useState<string | null>(null);

  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(
      FLOOR_STORAGE_KEY,
      JSON.stringify(tables)
    );
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(
      ORDER_STORAGE_KEY,
      JSON.stringify(orderGroups)
    );
  }, [orderGroups]);

  const colors = {
    free: "#22C55E",
    busy: "#EF4444",
    reserved: "#3B82F6",
    payment: "#F59E0B",
  };

  const activeOrder =
    activeOrderId
      ? orderGroups.find(
          (order) =>
            order.id === activeOrderId
        ) ?? null
      : null;

  const currentlySelectedTable =
    tables.find(
      (table) =>
        table.id === selectedTableId
    );

  const getOrderForTable = (
    tableId: string
  ) =>
    orderGroups.find(
      (order) =>
        order.open &&
        order.tableIds.includes(tableId)
    );

  const getGroupTables = (
    table: TableData
  ) => {
    if (!table.groupId) {
      return [table];
    }

    return tables.filter(
      (item) =>
        item.groupId === table.groupId
    );
  };

  const getOrderTableName = (
    order: OrderGroup
  ) =>
    tables
      .filter((table) =>
        order.tableIds.includes(table.id)
      )
      .map((table) => table.name)
      .join(" + ");

  const updateOrderGuests = (
    orderId: string,
    newGuestCount: number
  ) => {
    const safeCount =
      Math.max(1, newGuestCount);

    setOrderGroups((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              guests: safeCount,
            }
          : order
      )
    );
  };

  const handleTableClick = (
    table: TableData
  ) => {
    if (mode === "edit") {
      setSelectedTableId(table.id);
      return;
    }

    if (mode === "join") {
      if (
        table.type === "channel"
      ) {
        return;
      }

      setJoinSelection((current) =>
        current.includes(table.id)
          ? current.filter(
              (id) =>
                id !== table.id
            )
          : [
              ...current,
              table.id,
            ]
      );

      return;
    }

    const existingOrder =
      getOrderForTable(table.id);

    setSelectedTable(table);

    setGuestCount(
      existingOrder
        ? existingOrder.guests
        : 1
    );
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    table: TableData
  ) => {
    if (mode !== "edit") return;

    event.preventDefault();

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const rect =
      canvas.getBoundingClientRect();

    setSelectedTableId(
      table.id
    );

    setDragging({
      id: table.id,

      offsetX:
        event.clientX -
        rect.left -
        table.x,

      offsetY:
        event.clientY -
        rect.top -
        table.y,
    });

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      !dragging ||
      mode !== "edit"
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const rect =
      canvas.getBoundingClientRect();

    setTables((current) =>
      current.map((table) => {
        if (
          table.id !== dragging.id
        ) {
          return table;
        }

        const x =
          Math.max(
            0,
            Math.min(
              rect.width -
                table.width,

              event.clientX -
                rect.left -
                dragging.offsetX
            )
          );

        const y =
          Math.max(
            0,
            Math.min(
              rect.height -
                table.height,

              event.clientY -
                rect.top -
                dragging.offsetY
            )
          );

        return {
          ...table,
          x,
          y,
        };
      })
    );
  };

  const updateSelectedTable = (
    changes: Partial<TableData>
  ) => {
    if (!selectedTableId) {
      return;
    }

    setTables((current) =>
      current.map((table) =>
        table.id ===
        selectedTableId
          ? {
              ...table,
              ...changes,
            }
          : table
      )
    );
  };

  const addNewTable = () => {
    const id =
      `table-${Date.now()}`;

    const newTable: TableData = {
      id,
      name: "New Table",
      seats: 4,
      status: "free",
      x: 100,
      y: 100,
      width: 90,
      height: 70,
      shape: "rectangle",
    };

    setTables((current) => [
      ...current,
      newTable,
    ]);

    setSelectedTableId(id);
    setMode("edit");
  };

  const deleteSelectedTable =
    () => {
      if (!selectedTableId) return;

      const active =
        getOrderForTable(
          selectedTableId
        );

      if (active) {
        alert(
          "This table has an open order."
        );
        return;
      }

      setTables((current) =>
        current.filter(
          (table) =>
            table.id !==
            selectedTableId
        )
      );

      setSelectedTableId(null);
    };

  const joinSelectedTables =
    () => {
      if (
        joinSelection.length <
        2
      ) {
        alert(
          "Select at least two tables."
        );
        return;
      }

      const hasOpenOrder =
        joinSelection.some(
          (tableId) =>
            Boolean(
              getOrderForTable(
                tableId
              )
            )
        );

      if (hasOpenOrder) {
        alert(
          "One selected table already has an open order."
        );
        return;
      }

      const groupId =
        `group-${Date.now()}`;

      setTables((current) =>
        current.map((table) =>
          joinSelection.includes(
            table.id
          )
            ? {
                ...table,
                groupId,
              }
            : table
        )
      );

      setJoinSelection([]);
      setMode("view");
    };

  const unjoinSelectedTables =
    () => {
      if (
        joinSelection.length ===
        0
      ) {
        alert(
          "Select a joined table."
        );
        return;
      }

      const groupIds =
        tables
          .filter((table) =>
            joinSelection.includes(
              table.id
            )
          )
          .map(
            (table) =>
              table.groupId
          )
          .filter(
            (
              groupId
            ): groupId is string =>
              Boolean(groupId)
          );

      if (
        groupIds.length ===
        0
      ) {
        alert(
          "Selected table is not joined."
        );
        return;
      }

      const groupTableIds =
        tables
          .filter(
            (table) =>
              table.groupId &&
              groupIds.includes(
                table.groupId
              )
          )
          .map(
            (table) =>
              table.id
          );

      const hasOpenOrder =
        groupTableIds.some(
          (tableId) =>
            Boolean(
              getOrderForTable(
                tableId
              )
            )
        );

      if (hasOpenOrder) {
        alert(
          "This joined table has an open order. Use Split / Transfer Order before separating."
        );
        return;
      }

      setTables((current) =>
        current.map((table) =>
          table.groupId &&
          groupIds.includes(
            table.groupId
          )
            ? {
                ...table,
                groupId:
                  undefined,
              }
            : table
        )
      );

      setJoinSelection([]);
      setMode("view");
    };

  const openTable = () => {
    if (!selectedTable) return;

    const existingOrder =
      getOrderForTable(
        selectedTable.id
      );

    if (existingOrder) {
      setActiveOrderId(
        existingOrder.id
      );

      setSelectedTable(null);
      return;
    }

    const groupTables =
      getGroupTables(
        selectedTable
      );

    const tableIds =
      groupTables.map(
        (table) => table.id
      );

    const order: OrderGroup = {
      id: `order-${Date.now()}`,
      tableIds,
      guests: guestCount,
      open: true,
    };

    setOrderGroups((current) => [
      ...current,
      order,
    ]);

    setTables((current) =>
      current.map((table) =>
        tableIds.includes(table.id)
          ? {
              ...table,
              status: "busy",
            }
          : table
      )
    );

    setActiveOrderId(
      order.id
    );

    setSelectedTable(null);
  };

  const closeTestOrder = () => {
    if (!selectedTable) return;

    const order =
      getOrderForTable(
        selectedTable.id
      );

    if (!order) return;

    setOrderGroups((current) =>
      current.map((item) =>
        item.id === order.id
          ? {
              ...item,
              open: false,
            }
          : item
      )
    );

    setTables((current) =>
      current.map((table) =>
        order.tableIds.includes(
          table.id
        )
          ? {
              ...table,
              status: "free",
            }
          : table
      )
    );

    setSelectedTable(null);
  };

  const completeOrder = (
    orderId: string
  ) => {
    const order =
      orderGroups.find(
        (item) =>
          item.id === orderId
      );

    if (!order) {
      alert(
        "Order could not be found."
      );
      return;
    }

    const completedAt =
      new Date().toISOString();

    setOrderGroups((current) =>
      current.map((item) =>
        item.id === orderId
          ? {
              ...item,
              open: false,
              completedAt,
            }
          : item
      )
    );

    setTables((current) =>
      current.map((table) =>
        order.tableIds.includes(
          table.id
        )
          ? {
              ...table,
              status: "free",
            }
          : table
      )
    );

    setSelectedTable(null);
    setSelectedTableId(null);
    setActiveOrderId(null);
  };

  const resetFloorPlan =
    () => {
      const confirmed =
        window.confirm(
          "Reset Floor Plan and test orders?"
        );

      if (!confirmed) return;

      localStorage.removeItem(
        FLOOR_STORAGE_KEY
      );

      localStorage.removeItem(
        ORDER_STORAGE_KEY
      );

      setTables(initialTables);
      setOrderGroups([]);
      setMode("view");
      setJoinSelection([]);
      setSelectedTableId(null);
      setActiveOrderId(null);
    };

  if (activeOrder) {
    return (
      <OrderScreen
        orderId={activeOrder.id}
        tableName={getOrderTableName(
          activeOrder
        )}
        guests={activeOrder.guests}
        onGuestsChange={(
          newGuestCount
        ) =>
          updateOrderGuests(
            activeOrder.id,
            newGuestCount
          )
        }
        onBack={() =>
          setActiveOrderId(null)
        }
        onOrderComplete={() =>
          completeOrder(
            activeOrder.id
          )
        }
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        color: "white",
        fontFamily: "Arial, sans-serif",
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
              fontSize: 20,
            }}
          >
            🍽 Behesht Cafe Floor Plan
          </strong>

          <div
            style={{
              color: "#94A3B8",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Mode:{" "}
            {mode.toUpperCase()}
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
            onClick={() => {
              setMode("view");
              setSelectedTableId(
                null
              );
              setJoinSelection(
                []
              );
            }}
            style={toolbarButton(
              mode === "view"
                ? "#16A34A"
                : "#334155"
            )}
          >
            View
          </button>

          <button
            onClick={() => {
              setMode("edit");
              setJoinSelection(
                []
              );
            }}
            style={toolbarButton(
              mode === "edit"
                ? "#2563EB"
                : "#334155"
            )}
          >
            ✏ Edit Layout
          </button>

          <button
            onClick={() => {
              setMode("join");
              setSelectedTableId(
                null
              );
              setJoinSelection(
                []
              );
            }}
            style={toolbarButton(
              mode === "join"
                ? "#7C3AED"
                : "#334155"
            )}
          >
            🔗 Join / Unjoin
          </button>

          <button
            onClick={
              addNewTable
            }
            style={toolbarButton(
              "#0891B2"
            )}
          >
            + Add Table
          </button>

          <button
            onClick={
              resetFloorPlan
            }
            style={toolbarButton(
              "#B45309"
            )}
          >
            Reset Layout
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#14532D",
          padding: 10,
          borderRadius: 10,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        ✓ Floor Plan and Orders save automatically
      </div>

      {mode === "edit" && (
        <div
          style={{
            background: "#172554",
            padding: 10,
            borderRadius: 10,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Edit Layout — drag tables to move them.
        </div>
      )}

      {mode === "join" && (
        <div
          style={{
            background: "#3B0764",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: 10,
            }}
          >
            Select tables to Join or Unjoin
          </div>

          <button
            onClick={
              joinSelectedTables
            }
            style={toolbarButton(
              "#16A34A"
            )}
          >
            Join Selected
          </button>

          <button
            onClick={
              unjoinSelectedTables
            }
            style={{
              ...toolbarButton(
                "#DC2626"
              ),
              marginLeft: 10,
            }}
          >
            Unjoin Selected
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 15,
          alignItems:
            "flex-start",
        }}
      >
        <div
          ref={canvasRef}
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={() =>
            setDragging(null)
          }
          onPointerCancel={() =>
            setDragging(null)
          }
          style={{
            position: "relative",
            flex: 1,
            minWidth: 750,
            height: 590,
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: 16,
            overflow: "hidden",
            touchAction: "none",
          }}
        >
          {tables.map((table) => {
            const selectedForJoin =
              joinSelection.includes(
                table.id
              );

            const editSelected =
              selectedTableId ===
              table.id;

            const order =
              getOrderForTable(
                table.id
              );

            return (
              <button
                key={table.id}
                onClick={() =>
                  handleTableClick(
                    table
                  )
                }
                onPointerDown={(
                  event
                ) =>
                  handlePointerDown(
                    event,
                    table
                  )
                }
                style={{
                  position:
                    "absolute",

                  left: table.x,
                  top: table.y,

                  width:
                    table.width,

                  height:
                    table.height,

                  borderRadius:
                    table.shape ===
                    "round"
                      ? "50%"
                      : 9,

                  background:
                    colors[
                      table.status
                    ],

                  color: "white",

                  fontWeight:
                    "bold",

                  border:
                    selectedForJoin
                      ? "4px solid #FDE047"
                      : editSelected
                      ? "4px solid white"
                      : table.groupId
                      ? "3px solid #C084FC"
                      : "2px solid white",

                  boxShadow:
                    table.groupId
                      ? "0 0 12px rgba(192,132,252,.7)"
                      : "none",

                  cursor:
                    mode === "edit"
                      ? "grab"
                      : "pointer",

                  userSelect:
                    "none",

                  touchAction:
                    "none",
                }}
              >
                <div>
                  {table.name}
                </div>

                {table.type !==
                  "channel" && (
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    {table.seats} Seats
                  </div>
                )}

                {table.groupId && (
                  <div
                    style={{
                      fontSize: 9,
                      marginTop: 3,
                    }}
                  >
                    🔗 JOINED
                  </div>
                )}

                {order && (
                  <div
                    style={{
                      fontSize: 9,
                      marginTop: 3,
                      color:
                        "#FEF08A",
                    }}
                  >
                    👥 {order.guests}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {mode === "edit" &&
          currentlySelectedTable && (
            <div
              style={{
                width: 250,
                background:
                  "#111827",
                border:
                  "1px solid #334155",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Table Settings
              </h3>

              <label style={labelStyle}>
                Table Name
              </label>

              <input
                value={
                  currentlySelectedTable.name
                }
                onChange={(event) =>
                  updateSelectedTable({
                    name:
                      event.target
                        .value,
                  })
                }
                style={inputStyle}
              />

              <label style={labelStyle}>
                Number of Seats
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 15,
                }}
              >
                <button
                  onClick={() =>
                    updateSelectedTable({
                      seats:
                        Math.max(
                          1,
                          currentlySelectedTable.seats -
                            1
                        ),
                    })
                  }
                  style={smallButton}
                >
                  −
                </button>

                <div
                  style={{
                    flex: 1,
                    background:
                      "#020617",
                    borderRadius: 8,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {
                    currentlySelectedTable.seats
                  }
                </div>

                <button
                  onClick={() =>
                    updateSelectedTable({
                      seats:
                        currentlySelectedTable.seats +
                        1,
                    })
                  }
                  style={smallButton}
                >
                  +
                </button>
              </div>

              <label style={labelStyle}>
                Table Shape
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 15,
                }}
              >
                <button
                  onClick={() =>
                    updateSelectedTable({
                      shape:
                        "rectangle",
                    })
                  }
                  style={toolbarButton(
                    currentlySelectedTable.shape ===
                      "rectangle"
                      ? "#2563EB"
                      : "#334155"
                  )}
                >
                  ▭
                </button>

                <button
                  onClick={() =>
                    updateSelectedTable({
                      shape: "round",
                      width: 80,
                      height: 80,
                    })
                  }
                  style={toolbarButton(
                    currentlySelectedTable.shape ===
                      "round"
                      ? "#2563EB"
                      : "#334155"
                  )}
                >
                  ●
                </button>
              </div>

              <label style={labelStyle}>
                Width
              </label>

              <input
                type="range"
                min="55"
                max="180"
                value={
                  currentlySelectedTable.width
                }
                onChange={(event) =>
                  updateSelectedTable({
                    width:
                      Number(
                        event.target
                          .value
                      ),
                  })
                }
                style={{
                  width: "100%",
                }}
              />

              <label style={labelStyle}>
                Height
              </label>

              <input
                type="range"
                min="50"
                max="180"
                value={
                  currentlySelectedTable.height
                }
                onChange={(event) =>
                  updateSelectedTable({
                    height:
                      Number(
                        event.target
                          .value
                      ),
                  })
                }
                style={{
                  width: "100%",
                  marginBottom: 20,
                }}
              />

              <button
                onClick={
                  deleteSelectedTable
                }
                style={{
                  width: "100%",
                  height: 45,
                  background:
                    "#DC2626",
                  color: "white",
                  border: "none",
                  borderRadius: 9,
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                Delete Table
              </button>

              <button
                onClick={() => {
                  setSelectedTableId(
                    null
                  );
                  setMode("view");
                }}
                style={{
                  width: "100%",
                  height: 45,
                  marginTop: 10,
                  background:
                    "#16A34A",
                  color: "white",
                  border: "none",
                  borderRadius: 9,
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
      </div>

      {selectedTable &&
        mode === "view" && (
          <TableModal
            table={
              selectedTable
            }
            groupTables={getGroupTables(
              selectedTable
            )}
            existingOrder={getOrderForTable(
              selectedTable.id
            )}
            guests={guestCount}
            setGuests={
              setGuestCount
            }
            onOpen={
              openTable
            }
            onOpenExisting={() => {
              const order =
                getOrderForTable(
                  selectedTable.id
                );

              if (order) {
                setActiveOrderId(
                  order.id
                );
              }

              setSelectedTable(
                null
              );
            }}
            onCloseOrder={
              closeTestOrder
            }
            onCancel={() =>
              setSelectedTable(
                null
              )
            }
          />
        )}
    </div>
  );
}

function TableModal({
  table,
  groupTables,
  existingOrder,
  guests,
  setGuests,
  onOpen,
  onOpenExisting,
  onCloseOrder,
  onCancel,
}: {
  table: TableData;
  groupTables: TableData[];
  existingOrder?: OrderGroup;
  guests: number;
  setGuests: React.Dispatch<
    React.SetStateAction<number>
  >;
  onOpen: () => void;
  onOpenExisting: () => void;
  onCloseOrder: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,.75)",
        display: "flex",
        justifyContent:
          "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 430,
          background: "#111827",
          color: "white",
          padding: 28,
          borderRadius: 18,
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginTop: 0,
          }}
        >
          {groupTables
            .map(
              (item) =>
                item.name
            )
            .join(" + ")}
        </h2>

        {table.groupId && (
          <div
            style={{
              background: "#581C87",
              padding: 10,
              borderRadius: 8,
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            🔗 Joined Table
          </div>
        )}

        {existingOrder ? (
          <>
            <div
              style={{
                background: "#7F1D1D",
                padding: 15,
                borderRadius: 10,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <strong>
                Order Open
              </strong>

              <div
                style={{
                  marginTop: 8,
                }}
              >
                Guests:{" "}
                {
                  existingOrder.guests
                }
              </div>
            </div>

            <button
              onClick={
                onOpenExisting
              }
              style={{
                width: "100%",
                height: 55,
                background:
                  "#2563EB",
                border: "none",
                borderRadius: 10,
                color: "white",
                fontSize: 17,
                fontWeight:
                  "bold",
                cursor: "pointer",
              }}
            >
              Open Order
            </button>

            <button
              onClick={
                onCloseOrder
              }
              style={{
                width: "100%",
                height: 50,
                background:
                  "#DC2626",
                border: "none",
                borderRadius: 10,
                color: "white",
                marginTop: 10,
                cursor:
                  "pointer",
              }}
            >
              Close Test Order
            </button>
          </>
        ) : (
          <>
            {table.type !==
              "channel" && (
              <>
                <p
                  style={{
                    textAlign:
                      "center",
                  }}
                >
                  Number of Guests
                </p>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                    gap: 20,
                    marginBottom: 25,
                  }}
                >
                  <button
                    onClick={() =>
                      setGuests(
                        (
                          current
                        ) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    style={
                      guestButtonStyle
                    }
                  >
                    −
                  </button>

                  <div
                    style={{
                      fontSize: 36,
                      fontWeight:
                        "bold",
                      width: 70,
                      textAlign:
                        "center",
                    }}
                  >
                    {guests}
                  </div>

                  <button
                    onClick={() =>
                      setGuests(
                        (
                          current
                        ) =>
                          current + 1
                      )
                    }
                    style={
                      guestButtonStyle
                    }
                  >
                    +
                  </button>
                </div>
              </>
            )}

            <button
              onClick={
                onOpen
              }
              style={{
                width: "100%",
                height: 55,
                background:
                  "#22C55E",
                border: "none",
                borderRadius: 10,
                color: "white",
                fontSize: 17,
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              Open Table
            </button>
          </>
        )}

        <button
          onClick={
            onCancel
          }
          style={{
            width: "100%",
            height: 48,
            background: "#334155",
            border: "none",
            borderRadius: 10,
            color: "white",
            marginTop: 10,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const toolbarButton = (
  background: string
) => ({
  border: "none",
  borderRadius: 8,
  background,
  color: "white",
  padding: "10px 14px",
  fontWeight: "bold" as const,
  cursor: "pointer",
});

const labelStyle = {
  display: "block",
  color: "#CBD5E1",
  fontSize: 13,
  marginTop: 14,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  height: 40,
  padding: "0 10px",
  background: "#020617",
  color: "white",
  border:
    "1px solid #475569",
  borderRadius: 8,
};

const smallButton = {
  width: 45,
  height: 40,
  background: "#2563EB",
  border: "none",
  borderRadius: 8,
  color: "white",
  fontSize: 20,
  cursor: "pointer",
};

const guestButtonStyle = {
  width: 60,
  height: 60,
  background: "#2563EB",
  border: "none",
  borderRadius: 12,
  color: "white",
  fontSize: 28,
  cursor: "pointer",
};
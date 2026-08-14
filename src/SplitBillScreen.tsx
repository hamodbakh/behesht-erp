import { useMemo, useState } from "react";

type SeatSelection = number | "shared";

type ShareMode =
  | "none"
  | "all"
  | "selected"
  | "unassigned";

export type SplitTicketItem = {
  lineId: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;

  guest: SeatSelection;

  sentQty: number;
  voidedQty: number;

  notes: string;
  discount: number;

  shareMode?: ShareMode;
  sharedWith?: number[];
};

type Bill = {
  id: string;
  name: string;
  seat: SeatSelection;
};

type BillLine = {
  key: string;

  sourceLineId: string;

  billSeat: SeatSelection;

  item: SplitTicketItem;

  amountCents: number;

  kind: "full" | "share";

  sharePosition?: number;

  shareCount?: number;
};

type SplitBillScreenProps = {
  ticket: SplitTicketItem[];

  guests: number;

  onTicketChange: (
    ticket: SplitTicketItem[]
  ) => void;

  onBack: () => void;

  onContinueToPayment: () => void;
};

const TAX_RATE = 0.13;

function formatMoney(
  cents: number
) {
  return `$${(
    cents / 100
  ).toFixed(2)}`;
}

function itemNetCents(
  item: SplitTicketItem
) {
  const gross =
    item.price *
    item.qty;

  const discount =
    gross *
    ((item.discount ?? 0) /
      100);

  return Math.round(
    (gross - discount) * 100
  );
}

function splitCentsEvenly(
  totalCents: number,
  recipients: number[]
) {
  const result =
    new Map<number, number>();

  if (
    recipients.length === 0
  ) {
    return result;
  }

  const base =
    Math.floor(
      totalCents /
        recipients.length
    );

  const remainder =
    totalCents -
    base *
      recipients.length;

  recipients.forEach(
    (
      guest,
      index
    ) => {
      result.set(
        guest,
        base +
          (index <
          remainder
            ? 1
            : 0)
      );
    }
  );

  return result;
}

function allocateTaxCents(
  totalTaxCents: number,
  bills: Bill[],
  subtotalByBill: Record<
    string,
    number
  >
) {
  const result: Record<
    string,
    number
  > = {};

  bills.forEach(
    (bill) => {
      result[bill.id] = 0;
    }
  );

  const totalWeight =
    bills.reduce(
      (sum, bill) =>
        sum +
        (subtotalByBill[
          bill.id
        ] ?? 0),
      0
    );

  if (
    totalWeight <= 0 ||
    totalTaxCents <= 0
  ) {
    return result;
  }

  const calculations =
    bills.map((bill) => {
      const weight =
        subtotalByBill[
          bill.id
        ] ?? 0;

      const exact =
        (totalTaxCents *
          weight) /
        totalWeight;

      const floor =
        Math.floor(exact);

      return {
        billId: bill.id,
        floor,
        fraction:
          exact - floor,
      };
    });

  let allocated =
    calculations.reduce(
      (sum, item) =>
        sum + item.floor,
      0
    );

  calculations.forEach(
    (item) => {
      result[item.billId] =
        item.floor;
    }
  );

  let penniesLeft =
    totalTaxCents -
    allocated;

  const sorted = [
    ...calculations,
  ].sort(
    (a, b) =>
      b.fraction -
      a.fraction
  );

  let index = 0;

  while (
    penniesLeft > 0 &&
    sorted.length > 0
  ) {
    const item =
      sorted[
        index %
          sorted.length
      ];

    result[item.billId] +=
      1;

    penniesLeft -= 1;

    index += 1;
  }

  return result;
}

export default function SplitBillScreen({
  ticket,
  guests,
  onTicketChange,
  onBack,
  onContinueToPayment,
}: SplitBillScreenProps) {
  const [
    selectedLineKey,
    setSelectedLineKey,
  ] =
    useState<string | null>(
      null
    );

  const guestNumbers =
    useMemo(
      () =>
        Array.from(
          {
            length:
              guests,
          },
          (
            _,
            index
          ) =>
            index + 1
        ),
      [guests]
    );

  const bills =
    useMemo<Bill[]>(
      () => [
        {
          id: "shared",
          name: "Shared",
          seat: "shared",
        },

        ...guestNumbers.map(
          (
            guestNumber
          ) => ({
            id: `guest-${guestNumber}`,

            name: `Guest ${guestNumber}`,

            seat:
              guestNumber,
          })
        ),
      ],
      [guestNumbers]
    );

  /*
    This converts the real
    restaurant order into
    BILLING lines.

    Important:

    The original ticket item
    stays only ONE item.

    Shared items create only
    virtual billing portions.

    Nothing here creates a
    kitchen order.
  */

  const billLines =
    useMemo<
      BillLine[]
    >(() => {
      const lines: BillLine[] =
        [];

      ticket.forEach(
        (item) => {
          const amount =
            itemNetCents(
              item
            );

          /*
            NORMAL ITEM

            Example:
            Guest 1 ordered
            Koobideh.
          */

          if (
            item.guest !==
            "shared"
          ) {
            lines.push({
              key: `full-${item.lineId}`,

              sourceLineId:
                item.lineId,

              billSeat:
                item.guest,

              item,

              amountCents:
                amount,

              kind: "full",
            });

            return;
          }

          const shareMode =
            item.shareMode ??
            "unassigned";

          /*
            SHARE WITH ALL

            Example:
            $29.99 Hookah
            shared by all guests.
          */

          if (
            shareMode ===
            "all"
          ) {
            const recipients =
              guestNumbers;

            if (
              recipients.length ===
              0
            ) {
              lines.push({
                key: `full-${item.lineId}`,

                sourceLineId:
                  item.lineId,

                billSeat:
                  "shared",

                item,

                amountCents:
                  amount,

                kind: "full",
              });

              return;
            }

            const portions =
              splitCentsEvenly(
                amount,
                recipients
              );

            recipients.forEach(
              (
                guest,
                index
              ) => {
                lines.push({
                  key: `share-${item.lineId}-${guest}`,

                  sourceLineId:
                    item.lineId,

                  billSeat:
                    guest,

                  item,

                  amountCents:
                    portions.get(
                      guest
                    ) ?? 0,

                  kind: "share",

                  sharePosition:
                    index +
                    1,

                  shareCount:
                    recipients.length,
                });
              }
            );

            return;
          }

          /*
            SHARE WITH
            SELECTED GUESTS
          */

          if (
            shareMode ===
            "selected"
          ) {
            const recipients =
              Array.from(
                new Set(
                  (
                    item.sharedWith ??
                    []
                  ).filter(
                    (
                      guest
                    ) =>
                      guest >=
                        1 &&
                      guest <=
                        guests
                  )
                )
              ).sort(
                (a, b) =>
                  a - b
              );

            if (
              recipients.length >=
              2
            ) {
              const portions =
                splitCentsEvenly(
                  amount,
                  recipients
                );

              recipients.forEach(
                (
                  guest,
                  index
                ) => {
                  lines.push({
                    key: `share-${item.lineId}-${guest}`,

                    sourceLineId:
                      item.lineId,

                    billSeat:
                      guest,

                    item,

                    amountCents:
                      portions.get(
                        guest
                      ) ??
                      0,

                    kind:
                      "share",

                    sharePosition:
                      index +
                      1,

                    shareCount:
                      recipients.length,
                  });
                }
              );

              return;
            }
          }

          /*
            KEEP AS SHARED

            No guest has been
            selected to pay yet.
          */

          lines.push({
            key: `full-${item.lineId}`,

            sourceLineId:
              item.lineId,

            billSeat:
              "shared",

            item,

            amountCents:
              amount,

            kind: "full",
          });
        }
      );

      return lines;
    }, [
      ticket,
      guestNumbers,
      guests,
    ]);

  const subtotalByBill =
    useMemo(() => {
      const totals: Record<
        string,
        number
      > = {};

      bills.forEach(
        (bill) => {
          totals[bill.id] =
            0;
        }
      );

      billLines.forEach(
        (line) => {
          const billId =
            line.billSeat ===
            "shared"
              ? "shared"
              : `guest-${line.billSeat}`;

          totals[billId] =
            (totals[
              billId
            ] ?? 0) +
            line.amountCents;
        }
      );

      return totals;
    }, [
      bills,
      billLines,
    ]);

  const orderSubtotalCents =
    ticket.reduce(
      (sum, item) =>
        sum +
        itemNetCents(
          item
        ),
      0
    );

  const orderTaxCents =
    Math.round(
      orderSubtotalCents *
        TAX_RATE
    );

  const orderTotalCents =
    orderSubtotalCents +
    orderTaxCents;

  /*
    Tax is distributed between
    the bills while guaranteeing
    that all bills together equal
    the exact tax on the order.
  */

  const taxByBill =
    useMemo(
      () =>
        allocateTaxCents(
          orderTaxCents,
          bills,
          subtotalByBill
        ),
      [
        orderTaxCents,
        bills,
        subtotalByBill,
      ]
    );

  const selectedLine =
    selectedLineKey
      ? billLines.find(
          (line) =>
            line.key ===
            selectedLineKey
        ) ?? null
      : null;

  const getBillId = (
    seat: SeatSelection
  ) =>
    seat === "shared"
      ? "shared"
      : `guest-${seat}`;

  const billSubtotalCents =
    (
      seat: SeatSelection
    ) =>
      subtotalByBill[
        getBillId(seat)
      ] ?? 0;

  const billTaxCents = (
    seat: SeatSelection
  ) =>
    taxByBill[
      getBillId(seat)
    ] ?? 0;

  const billTotalCents =
    (
      seat: SeatSelection
    ) =>
      billSubtotalCents(
        seat
      ) +
      billTaxCents(seat);

  const moveWholeItem = (
    lineId: string,
    destination: SeatSelection
  ) => {
    const updated =
      ticket.map(
        (item) => {
          if (
            item.lineId !==
            lineId
          ) {
            return item;
          }

          return {
            ...item,

            /*
              Important:
              lineId does not change.
              sentQty does not change.
              Kitchen receives nothing.
            */

            guest:
              destination,

            shareMode:
              destination ===
              "shared"
                ? "unassigned"
                : "none",

            sharedWith:
              [],
          };
        }
      );

    onTicketChange(
      updated
    );

    setSelectedLineKey(
      null
    );
  };

  return (
    <div
      style={{
        minHeight:
          "100vh",

        background:
          "#0F172A",

        color:
          "white",

        fontFamily:
          "Arial, sans-serif",

        display:
          "flex",

        flexDirection:
          "column",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background:
            "#020617",

          padding:
            "14px 20px",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap: 12,

          flexWrap:
            "wrap",
        }}
      >
        <div>
          <strong
            style={{
              fontSize: 22,
            }}
          >
            Split Bill
          </strong>

          <div
            style={{
              color:
                "#94A3B8",

              fontSize: 13,

              marginTop: 4,
            }}
          >
            Shared items are divided between guests without creating another Kitchen order.
          </div>
        </div>

        <button
          onClick={
            onBack
          }
          style={
            topButton
          }
        >
          ← Back to Order
        </button>
      </div>

      {/* MAIN */}

      <div
        style={{
          flex: 1,

          display:
            "grid",

          gridTemplateColumns:
            "minmax(0, 1fr) 340px",

          gap: 12,

          padding: 12,

          minHeight: 0,
        }}
      >
        {/* BILLS */}

        <div
          style={{
            overflowX:
              "auto",

            overflowY:
              "auto",
          }}
        >
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns: `repeat(${Math.max(
                1,
                bills.length
              )}, minmax(270px, 1fr))`,

              gap: 12,

              minWidth:
                bills.length *
                285,
            }}
          >
            {bills.map(
              (bill) => {
                const lines =
                  billLines.filter(
                    (line) =>
                      line.billSeat ===
                      bill.seat
                  );

                const subtotal =
                  billSubtotalCents(
                    bill.seat
                  );

                const tax =
                  billTaxCents(
                    bill.seat
                  );

                const total =
                  billTotalCents(
                    bill.seat
                  );

                return (
                  <div
                    key={
                      bill.id
                    }
                    style={{
                      background:
                        "#111827",

                      borderRadius: 14,

                      border:
                        "1px solid #334155",

                      minHeight: 530,

                      display:
                        "flex",

                      flexDirection:
                        "column",
                    }}
                  >
                    {/* BILL HEADER */}

                    <div
                      style={{
                        padding:
                          "12px 14px",

                        background:
                          bill.seat ===
                          "shared"
                            ? "#14532D"
                            : "#1E3A8A",

                        borderRadius:
                          "14px 14px 0 0",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          gap: 8,
                        }}
                      >
                        <strong>
                          {
                            bill.name
                          }
                        </strong>

                        <strong>
                          {formatMoney(
                            total
                          )}
                        </strong>
                      </div>

                      {bill.seat ===
                        "shared" && (
                        <div
                          style={{
                            fontSize: 11,

                            marginTop: 4,

                            color:
                              "#BBF7D0",
                          }}
                        >
                          Unassigned shared charges
                        </div>
                      )}
                    </div>

                    {/* BILL ITEMS */}

                    <div
                      style={{
                        flex: 1,

                        padding: 10,
                      }}
                    >
                      {lines.length ===
                        0 && (
                        <div
                          style={{
                            color:
                              "#64748B",

                            textAlign:
                              "center",

                            padding:
                              "30px 10px",
                          }}
                        >
                          No charges
                        </div>
                      )}

                      {lines.map(
                        (line) => {
                          const item =
                            line.item;

                          const selected =
                            selectedLineKey ===
                            line.key;

                          const isShare =
                            line.kind ===
                            "share";

                          return (
                            <button
                              key={
                                line.key
                              }
                              onClick={() =>
                                setSelectedLineKey(
                                  selected
                                    ? null
                                    : line.key
                                )
                              }
                              style={{
                                width:
                                  "100%",

                                border:
                                  selected
                                    ? "2px solid #F59E0B"
                                    : isShare
                                    ? "1px solid #16A34A"
                                    : "1px solid #334155",

                                borderRadius: 9,

                                background:
                                  selected
                                    ? "#1E293B"
                                    : "#0F172A",

                                color:
                                  "white",

                                padding: 10,

                                marginBottom: 8,

                                textAlign:
                                  "left",

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
                                  {
                                    item.name
                                  }
                                </strong>

                                <strong>
                                  {formatMoney(
                                    line.amountCents
                                  )}
                                </strong>
                              </div>

                              {isShare && (
                                <div
                                  style={{
                                    marginTop: 7,

                                    background:
                                      "#14532D",

                                    color:
                                      "#BBF7D0",

                                    padding:
                                      "5px 7px",

                                    borderRadius: 6,

                                    fontSize: 11,

                                    fontWeight:
                                      "bold",
                                  }}
                                >
                                  Shared portion{" "}
                                  {
                                    line.sharePosition
                                  }
                                  /
                                  {
                                    line.shareCount
                                  }
                                </div>
                              )}

                              <div
                                style={{
                                  marginTop: 6,

                                  fontSize: 11,

                                  color:
                                    "#94A3B8",

                                  lineHeight:
                                    1.5,
                                }}
                              >
                                {item.sentQty >
                                  0 && (
                                  <span>
                                    ✓ Sent{" "}
                                    {
                                      item.sentQty
                                    }
                                  </span>
                                )}

                                {item.discount >
                                  0 && (
                                  <span>
                                    {" "}
                                    • Discount{" "}
                                    {
                                      item.discount
                                    }
                                    %
                                  </span>
                                )}

                                {item.notes && (
                                  <span>
                                    {" "}
                                    •{" "}
                                    {
                                      item.notes
                                    }
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* BILL TOTAL */}

                    <div
                      style={{
                        borderTop:
                          "1px solid #334155",

                        padding: 12,
                      }}
                    >
                      <SummaryRow
                        label="Subtotal"
                        cents={
                          subtotal
                        }
                      />

                      <SummaryRow
                        label="Tax 13%"
                        cents={
                          tax
                        }
                      />

                      <SummaryRow
                        label="Bill Total"
                        cents={
                          total
                        }
                        bold
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}

        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 16,

            border:
              "1px solid #334155",

            display:
              "flex",

            flexDirection:
              "column",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Selected Charge
          </h3>

          {!selectedLine && (
            <div
              style={{
                color:
                  "#64748B",

                textAlign:
                  "center",

                padding:
                  "30px 10px",
              }}
            >
              Select an item from a bill.
            </div>
          )}

          {selectedLine && (
            <>
              <div
                style={{
                  background:
                    "#1E293B",

                  borderRadius: 10,

                  padding: 12,

                  marginBottom: 14,
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
                    {
                      selectedLine
                        .item.qty
                    }{" "}
                    ×{" "}
                    {
                      selectedLine
                        .item.name
                    }
                  </strong>

                  <strong>
                    {formatMoney(
                      selectedLine.amountCents
                    )}
                  </strong>
                </div>

                {selectedLine.kind ===
                  "share" && (
                  <div
                    style={{
                      marginTop: 8,

                      color:
                        "#86EFAC",

                      fontSize: 12,

                      lineHeight:
                        1.5,
                    }}
                  >
                    This is one billing portion of a shared item. The restaurant order still contains only one original item.
                  </div>
                )}

                {selectedLine.item
                  .sentQty >
                  0 && (
                  <div
                    style={{
                      marginTop: 8,

                      color:
                        "#FCD34D",

                      fontSize: 12,
                    }}
                  >
                    Kitchen status remains unchanged.
                  </div>
                )}
              </div>

              {selectedLine.kind ===
              "share" ? (
                <div
                  style={{
                    background:
                      "#052E16",

                    border:
                      "1px solid #16A34A",

                    borderRadius: 10,

                    padding: 12,

                    color:
                      "#BBF7D0",

                    lineHeight:
                      1.5,
                  }}
                >
                  This amount was created automatically by the Share setting.

                  <div
                    style={{
                      marginTop: 8,

                      color:
                        "#94A3B8",

                      fontSize: 12,
                    }}
                  >
                    To change which guests share this item, go back to the Order Screen and press Share on the original item.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      color:
                        "#CBD5E1",

                      marginBottom: 8,

                      fontWeight:
                        "bold",
                    }}
                  >
                    Move entire item to:
                  </div>

                  {bills
                    .filter(
                      (bill) =>
                        bill.seat !==
                        selectedLine
                          .billSeat
                    )
                    .map(
                      (bill) => (
                        <button
                          key={
                            bill.id
                          }
                          onClick={() =>
                            moveWholeItem(
                              selectedLine.sourceLineId,

                              bill.seat
                            )
                          }
                          style={
                            moveButton
                          }
                        >
                          {bill.seat ===
                          "shared"
                            ? "Move to Shared"
                            : `Move to ${bill.name}`}
                        </button>
                      )
                    )}
                </>
              )}
            </>
          )}

          {/* ORDER TOTAL */}

          <div
            style={{
              marginTop:
                "auto",

              borderTop:
                "1px solid #334155",

              paddingTop: 16,
            }}
          >
            <h3
              style={{
                marginTop: 0,

                marginBottom: 10,
              }}
            >
              Order Summary
            </h3>

            <SummaryRow
              label="Order Subtotal"
              cents={
                orderSubtotalCents
              }
            />

            <SummaryRow
              label="Tax 13%"
              cents={
                orderTaxCents
              }
            />

            <SummaryRow
              label="Order Total"
              cents={
                orderTotalCents
              }
              bold
            />

            {billSubtotalCents(
              "shared"
            ) > 0 && (
              <div
                style={{
                  background:
                    "#78350F",

                  color:
                    "#FDE68A",

                  padding: 10,

                  borderRadius: 8,

                  fontSize: 12,

                  marginTop: 12,

                  lineHeight:
                    1.5,
                }}
              >
                There are still Shared charges that have not been assigned to specific guests.
              </div>
            )}

            <button
              onClick={
                onContinueToPayment
              }
              disabled={
                ticket.length ===
                0
              }
              style={{
                width:
                  "100%",

                height: 56,

                border:
                  "none",

                borderRadius: 10,

                background:
                  ticket.length >
                  0
                    ? "#22C55E"
                    : "#475569",

                color:
                  "white",

                fontWeight:
                  "bold",

                fontSize: 17,

                cursor:
                  ticket.length >
                  0
                    ? "pointer"
                    : "not-allowed",

                marginTop: 15,
              }}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  cents,
  bold = false,
}: {
  label: string;

  cents: number;

  bold?: boolean;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        padding:
          "5px 0",

        color: bold
          ? "white"
          : "#CBD5E1",

        fontWeight:
          bold
            ? "bold"
            : "normal",

        fontSize:
          bold
            ? 17
            : 14,
      }}
    >
      <span>
        {label}
      </span>

      <span>
        {formatMoney(
          cents
        )}
      </span>
    </div>
  );
}

const topButton = {
  border: "none",

  borderRadius: 8,

  background:
    "#334155",

  color: "white",

  padding:
    "10px 14px",

  cursor:
    "pointer",

  fontWeight:
    "bold" as const,
};

const moveButton = {
  width: "100%",

  minHeight: 46,

  marginBottom: 8,

  border: "none",

  borderRadius: 9,

  background:
    "#2563EB",

  color: "white",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
};
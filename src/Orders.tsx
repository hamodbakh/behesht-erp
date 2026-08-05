import React from "react";

type TableProps = {
  name: string;
  seats: number;
  status: "free" | "busy" | "reserved" | "payment";
  width?: number;
};

function Table({
  name,
  seats,
  status,
  width = 90,
}: TableProps) {
  const colors = {
    free: "#22C55E",
    busy: "#EF4444",
    reserved: "#3B82F6",
    payment: "#F59E0B",
  };

  return (
    <button
      style={{
        width,
        height: 70,
        borderRadius: 10,
        border: "2px solid white",
        background: colors[status],
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      <div>{name}</div>
      <div
        style={{
          marginTop: 6,
          fontSize: 12,
        }}
      >
        {seats} Seats
      </div>
    </button>
  );
}

export default function Orders() {
  return (
    <div
      style={{
        background: "#0F172A",
        minHeight: "100vh",
        color: "white",
        padding: 30,
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        🍽 Behesht Cafe Floor Plan
      </h1>

      {/* BENCHES */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 35,
        }}
      >
        <Table name="Bench 30" seats={4} status="free" width={110} />
        <Table name="Bench 40" seats={4} status="free" width={110} />
        <Table name="Bench 50" seats={4} status="free" width={110} />
        <Table name="Bench 60" seats={4} status="free" width={110} />
        <Table name="Bench 70" seats={4} status="busy" width={110} />
        <Table name="Bench 80" seats={4} status="reserved" width={110} />
      </div>

      {/* ROW 1 */}

      <div
        style={{
          display: "flex",
          gap: 18,
          marginBottom: 20,
          justifyContent: "center",
        }}
      >
        <Table name="Table 1" seats={4} status="free" />
        <Table name="Table 1" seats={4} status="free" />
        <Table name="Table 1" seats={4} status="free" />

        <Table name="Table 2" seats={4} status="free" />

        <Table name="Table 3" seats={4} status="busy" />

        <Table name="Table 4" seats={4} status="reserved" />
        <Table name="Table 4" seats={4} status="reserved" />
        <Table name="Table 4" seats={4} status="reserved" />
      </div>      {/* ROW 2 */}

      <div
        style={{
          display: "flex",
          gap: 18,
          marginBottom: 20,
          justifyContent: "center",
        }}
      >
        <Table name="Table 5" seats={4} status="free" />
        <Table name="Table 5" seats={4} status="free" />
        <Table name="Table 5" seats={4} status="free" />

        <Table name="Table 6" seats={4} status="free" />

        <Table name="Table 7" seats={4} status="busy" />

        <Table name="Table 8" seats={4} status="reserved" />
        <Table name="Table 8" seats={4} status="reserved" />
        <Table name="Table 8" seats={4} status="reserved" />
      </div>

      {/* ROW 3 */}

      <div
        style={{
          display: "flex",
          gap: 40,
          justifyContent: "center",
          marginBottom: 25,
        }}
      >
        <Table name="Table 9" seats={6} status="free" width={120} />

        <Table name="Table 10" seats={6} status="reserved" width={120} />

        <Table name="Table 11" seats={4} status="free" />
        <Table name="Table 11" seats={4} status="free" />
      </div>

      {/* BOTTOM */}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <Table name="Table 12" seats={2} status="free" />

        <Table name="Uber" seats={1} status="payment" />
        <Table name="DoorDash" seats={1} status="payment" />
        <Table name="Cash" seats={1} status="payment" />
      </div>

    </div>
  );
}
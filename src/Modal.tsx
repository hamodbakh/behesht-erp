export default function Modal() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 420,
          background: "white",
          borderRadius: 12,
          padding: 30,
          color: "#222",
        }}
      >
        <h2>Table 3</h2>

        <p>
          <b>Status:</b> Busy
        </p>

        <p>
          <b>Seats:</b> 4
        </p>

        <hr />

        <input
          placeholder="Customer Name"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <input
          placeholder="Phone Number"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <input
          placeholder="Guests"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 20,
          }}
        />

        <button
          style={{
            padding: "12px 25px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
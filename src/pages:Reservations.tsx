function Reservations() {
  return (
    <div style={{ padding: 40 }}>
      <h1>📅 Reservations</h1>

      <input
        placeholder="Customer Name"
        style={{ display: "block", margin: "10px 0", padding: 10 }}
      />

      <input
        placeholder="Phone Number"
        style={{ display: "block", margin: "10px 0", padding: 10 }}
      />

      <input
        placeholder="Number of Guests"
        style={{ display: "block", margin: "10px 0", padding: 10 }}
      />

      <button
        style={{
          marginTop: 20,
          padding: 12,
          background: "#2563EB",
          color: "white",
          border: "none",
          borderRadius: 8,
        }}
      >
        Save Reservation
      </button>
    </div>
  );
}

export default Reservations;
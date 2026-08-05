import Orders from "./Orders";
import Modal from "./Modal";
function App() {
  return (
<div
  style={{
    background: "#0F172A",
    color: "white",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <Orders />
  <Modal />
</div>


export default App;
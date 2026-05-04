import { useState, useEffect } from "react";

export default function EmergencyButton() {
  const [showPopup, setShowPopup] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const crisis = localStorage.getItem("crisisActive");
    if (crisis === "true") {
      setActive(true);
    }
  }, []);

  return (
    <>
      {/* 🟢 FLOATING BUTTON */}
      {active && (
        <div
          onClick={() => setShowPopup(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#ff4d4d",
            color: "white",
            padding: "12px 16px",
            borderRadius: "30px",
            cursor: "pointer",
            zIndex: 999
          }}
        >
          🚨 Need Help?
        </div>
      )}

      {/* 🚨 POPUP */}
      {showPopup && (
        <div style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          background: "#ffe5e5",
          border: "1px solid red",
          padding: "15px",
          borderRadius: "10px",
          width: "250px",
          zIndex: 1000
        }}>
          <h4>🚨 Support Available</h4>
          <p>You are not alone. We are here to help you. You matter to us.</p>

          <a href="tel:18005990019">📞 Kiran</a><br/>
          <a href="tel:9820466726">📞 AASRA</a><br/>
          <a href="tel:9999666555">📞 Vandrevala</a><br/>
          <br></br>

          <button style={{backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer"}} onClick={() => setShowPopup(false)}>
            Close
          </button>
        </div>
      )}
    </>
  );
}
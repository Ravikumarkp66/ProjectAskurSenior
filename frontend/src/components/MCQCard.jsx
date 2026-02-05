import { useState, useEffect } from "react";

const MCQCard = ({ number, question, options, correctAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOptionClick = (option) => {
    if (!selectedOption) {
      setSelectedOption(option);
    }
  };

  const getOptionStyle = (option) => {
    // No selection yet
    if (!selectedOption) {
      return {
        backgroundColor: "#1a1a1a",
        border: "2px solid #2a2a2a",
        color: "#e5e5e5",
        cursor: "pointer"
      };
    }

    // Show instant feedback
    if (option === correctAnswer) {
      return {
        backgroundColor: "#14532d",
        border: "2px solid #22c55e",
        color: "white",
        cursor: "default"
      };
    }

    if (selectedOption === option && option !== correctAnswer) {
      return {
        backgroundColor: "#7f1d1d",
        border: "2px solid #ef4444",
        color: "white",
        cursor: "default"
      };
    }

    // Other options after selection
    return {
      backgroundColor: "#1a1a1a",
      border: "2px solid #2a2a2a",
      color: "#6b7280",
      cursor: "default",
      opacity: 0.5
    };
  };

  return (
    <div
      style={{
        backgroundColor: "#0f0f0f",
        border: "1px solid #1f1f1f",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <span
          style={{
            display: "inline-block",
            backgroundColor: "#1e40af",
            color: "white",
            padding: "4px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            marginBottom: "12px"
          }}
        >
          Q{number}
        </span>
        <p style={{ fontSize: "16px", fontWeight: "500", color: "white", lineHeight: "1.6", marginTop: "12px" }}>
          {question}
        </p>
      </div>

      {/* 2x2 Grid for options - Stacks on mobile, 2-column grid on larger screens */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
        gap: "16px"
      }}>
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(option)}
            style={{
              ...getOptionStyle(option),
              padding: isMobile ? "16px 12px" : "20px 16px",
              borderRadius: "12px",
              textAlign: "center",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "700",
              transition: "all 0.3s",
              position: "relative",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              wordBreak: "break-word",
              lineHeight: "1.4"
            }}
            onMouseOver={(e) => {
              if (!selectedOption) {
                e.target.style.backgroundColor = "#2a2a2a";
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!selectedOption) {
                e.target.style.backgroundColor = "#1a1a1a";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            <span style={{ flex: 1 }}>{option}</span>
            {selectedOption && option === correctAnswer && (
              <span style={{ 
                position: "absolute", 
                top: "10px", 
                right: "10px", 
                fontSize: "24px",
                fontWeight: "bold",
                color: "#22c55e"
              }}>✓</span>
            )}
            {selectedOption === option && option !== correctAnswer && (
              <span style={{ 
                position: "absolute", 
                top: "10px", 
                right: "10px", 
                fontSize: "24px",
                fontWeight: "bold",
                color: "#ef4444"
              }}>✗</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MCQCard;

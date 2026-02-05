import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MCQCard from "../components/MCQCard";
import balakeKannadaMcqs from "../data/balakeKannadaMcqs";

// Quiz data mapping - add more subjects here
const quizData = {
  "balake-kannada": {
    title: "Balake Kannada – MCQs",
    description: "According to syllabus · 100 meticulously curated questions · Exam ready practice",
    mcqs: balakeKannadaMcqs
  },
  // Add more quizzes here in the future
  // "subject-code": { title: "...", description: "...", mcqs: [...] }
};

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [allCardsKey, setAllCardsKey] = useState(0);

  const quiz = quizData[quizId];

  // If quiz not found, show error
  if (!quiz) {
    return (
      <main style={{ 
        minHeight: "100vh", 
        backgroundColor: "#0a0a0a", 
        padding: "32px 24px", 
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}>Quiz Not Found</h1>
          <p style={{ color: "#9ca3af", marginBottom: "24px" }}>The quiz you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "1px solid #3b82f6",
              backgroundColor: "#1e40af",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const handleResetAll = () => {
    setAllCardsKey(prev => prev + 1);
  };

  return (
    <main style={{ 
      minHeight: "100vh", 
      backgroundColor: "#0a0a0a", 
      padding: "32px 24px", 
      color: "white",
      overflowX: "hidden",
      width: "100%"
    }}>
      <div style={{ 
        width: "100%", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        height: "100%"
      }}>
        <section style={{
          width: "100%",
          maxWidth: "1200px",
          borderRadius: "24px",
          border: "1px solid #1a1a1a",
          background: "linear-gradient(to bottom, #0b0b0b, #050505)",
          padding: "24px",
          boxShadow: "0 40px 140px rgba(0,0,0,0.65)",
          boxSizing: "border-box",
          flex: "1",
          display: "flex",
          flexDirection: "column"
        }}>
          <header style={{ marginBottom: "40px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.35em", color: "#34d399" }}>MCQ Series</p>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "white", marginBottom: "12px" }}>{quiz.title}</h1>
              <p style={{ fontSize: "16px", color: "#9ca3af" }}>
                {quiz.description}
              </p>
            </div>
          </header>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                borderRadius: "8px",
                border: "1px solid #4a5568",
                backgroundColor: "#2d3748",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#e2e8f0",
                transition: "all 0.2s",
                cursor: "pointer"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#4a5568";
                e.target.style.color = "#ffffff";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#2d3748";
                e.target.style.color = "#e2e8f0";
              }}
            >
              ← Back to Dashboard
            </button>
            
            <button
              onClick={handleResetAll}
              style={{
                borderRadius: "8px",
                border: "1px solid #4a3426",
                backgroundColor: "#3a2315",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#fb923c",
                transition: "all 0.2s",
                cursor: "pointer"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#4a3426";
                e.target.style.color = "#fdba74";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#3a2315";
                e.target.style.color = "#fb923c";
              }}
            >
              Reset All Questions
            </button>
          </div>

          <div style={{ 
            display: "grid", 
            gap: "20px",
            flex: "1",
            overflowY: "auto",
            paddingRight: "8px"
          }}>
            {quiz.mcqs.map((mcq) => (
              <MCQCard
                key={`${mcq.id}-${allCardsKey}`}
                number={mcq.id}
                question={mcq.question}
                options={mcq.options}
                correctAnswer={mcq.correctAnswer}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default QuizPage;

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import API from "../../Api/API";

const SUGGESTED_QUESTIONS = [
  "Who are the available cardiologists?",
  "How do I book an appointment?",
  "What is the cancellation & refund policy?",
  "What are the clinic timings and consultation fees?",
];

const MediAssistChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm **MediAssist AI**, your healthcare & appointment assistant. How can I help you today? You can ask about our specialized doctors, booking instructions, clinic timings, or cancellation policies.",
      sources: ["MediCare Verified Handbook"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build lightweight conversation history for multi-turn context
      const chatHistory = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await API.post("/ai/chat", {
        message: textToSend,
        chatHistory,
      });

      if (res.data?.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data.reply,
            sources: res.data.sources || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              res.data?.message ||
              "I apologize, but I could not retrieve that information right now. Please try again or contact clinic support.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "MediAssist AI is temporarily unavailable. Please check back shortly or browse our doctor directory directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Conversation cleared. How can I help you with your healthcare needs today?",
        sources: ["MediCare Verified Handbook"],
      },
    ]);
  };

  // Helper to format simple markdown bold/bullets
  const formatText = (text) => {
    if (!text) return "";
    return text.split("\n").map((line, idx) => {
      // Bold replace
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (line.startsWith("### ")) {
        return <h6 key={idx} className="mt-2 mb-1 fw-bold text-primary" dangerouslySetInnerHTML={{ __html: formattedLine.replace("### ", "") }} />;
      }
      if (line.startsWith("* ") || line.startsWith("- ") || line.startsWith("• ")) {
        return <li key={idx} className="ms-3" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[\*\-•]\s*/, "") }} />;
      }
      return <p key={idx} className="mb-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1050 }}>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary shadow-lg d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            border: "none",
            boxShadow: "0 8px 24px rgba(2, 132, 199, 0.4)",
            color: "#ffffff",
          }}
          aria-label="Open MediAssist AI Healthcare Assistant"
        >
          <Bot size={22} className="text-white" />
          <span className="fw-semibold">MediAssist AI</span>
          <span className="badge bg-white text-primary rounded-pill px-2">Online</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="card shadow-lg border-0 d-flex flex-column"
          style={{
            width: "380px",
            height: "540px",
            maxWidth: "92vw",
            maxHeight: "85vh",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
          }}
        >
          {/* Header */}
          <div
            className="p-3 text-white d-flex align-items-center justify-content-between"
            style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white p-1 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px" }}
              >
                <Bot size={20} className="text-primary" />
              </div>
              <div>
                <h6 className="mb-0 fw-bold">MediAssist AI</h6>
                <small className="opacity-75" style={{ fontSize: "11px" }}>
                  Clinical Assistant &bull; RAG Grounded
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                onClick={clearChat}
                className="btn btn-sm btn-link text-white p-1"
                title="Clear Chat"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm btn-link text-white p-1"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Emergency / Safety Banner */}
          <div
            className="px-3 py-1 bg-light border-bottom d-flex align-items-center gap-1 text-muted"
            style={{ fontSize: "11px" }}
          >
            <AlertCircle size={13} className="text-warning flex-shrink-0" />
            <span>General guidance only. For medical emergencies, call 112 / 911.</span>
          </div>

          {/* Chat Messages Body */}
          <div className="p-3 flex-grow-1 overflow-auto bg-light" style={{ fontSize: "13.5px" }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`d-flex mb-3 ${
                  m.role === "user" ? "justify-content-end" : "justify-content-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div
                    className="me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "26px", height: "26px", marginTop: "2px" }}
                  >
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`p-3 rounded-4 ${
                    m.role === "user"
                      ? "bg-primary text-white text-start"
                      : "bg-white text-dark shadow-sm border"
                  }`}
                  style={{
                    maxWidth: "82%",
                    lineHeight: "1.45",
                    wordBreak: "break-word",
                  }}
                >
                  {formatText(m.content)}

                  {/* Sources citation badges */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-top d-flex flex-wrap gap-1">
                      <span className="text-muted" style={{ fontSize: "10.5px" }}>
                        Sources:
                      </span>
                      {m.sources.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="badge bg-secondary-subtle text-secondary border"
                          style={{ fontSize: "10px" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div
                    className="ms-2 bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "26px", height: "26px", marginTop: "2px" }}
                  >
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="d-flex align-items-center gap-2 text-muted mb-2 ps-1">
                <Bot size={16} className="text-primary" />
                <span className="spinner-grow spinner-grow-sm text-primary" role="status" />
                <small style={{ fontSize: "12px" }}>MediAssist is retrieving clinic data...</small>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions on first turns */}
          {messages.length <= 3 && (
            <div className="px-2 py-1 bg-white border-top d-flex flex-wrap gap-1">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="btn btn-outline-secondary btn-sm rounded-pill text-truncate"
                  style={{ fontSize: "11px", maxWidth: "100%" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2 bg-white border-top d-flex align-items-center gap-2"
          >
            <input
              type="text"
              className="form-control form-control-sm border-0"
              placeholder="Ask about doctors, timings, fees..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ boxShadow: "none" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-primary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ width: "34px", height: "34px" }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MediAssistChatbot;

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader, LogOut } from "lucide-react";

export default function DataalkQueryUI() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      content:
        "Connected to Datalk Database Postgres sql ( Tables Available currently are : Customer, Employees, Orders, Products)",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exportCSV = (result) => {
    const headers = Object.keys(result[0]).join(",");
    const rows = result.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "datalk_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${import.meta.env.VITE_QUERY_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ user_question: input }),
      });

      const data = await response.json();

      // ADD THIS — check error field inside successful response
      if (data.error) {
        throw new Error(data.error);
      }

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      const assistantMessage = {
        id: messages.length + 2,
        type: "assistant",
        content: data.sql,
        result: data.results,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        type: "assistant",
        content: `Error: ${error.message}`,
        result: null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#000000",
        margin: 0,
        padding: 0,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #333333",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "12px",
          paddingBottom: "12px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "#111111",
        }}
      >
        <div
          style={{
            maxWidth: "896px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                animation: "pulse 2s infinite",
              }}
            ></div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#ffffff",
                fontFamily: "Georgia, serif",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              datalk
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ fontSize: "12px", color: "#888888" }}>
              <span style={{ color: "#10b981", fontFamily: "monospace" }}>
                ● sample_db
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "transparent",
                border: "1px solid #333333",
                color: "#888888",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#dc2626";
                e.target.style.color = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#333333";
                e.target.style.color = "#888888";
              }}
            >
              <LogOut style={{ width: "14px", height: "14px" }} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: messages.length === 1 ? "center" : "flex-start",
          alignItems: "center",
          paddingTop: "32px",
          paddingBottom: "32px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "896px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          {messages.length === 1 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "300",
                  marginBottom: "12px",
                  marginTop: 0,
                  color: "#ffffff",
                }}
              >
                Ask questions in plain English
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "#888888",
                  maxWidth: "400px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                No SQL needed. Just describe what you want to know about your
                data. datalk converts it to queries and shows you the answers.
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.type === "system" && (
                    <div
                      style={{
                        fontSize: "12px",
                        paddingLeft: "12px",
                        paddingRight: "12px",
                        paddingTop: "4px",
                        paddingBottom: "4px",
                        borderRadius: "20px",
                        width: "fit-content",
                        color: "#888888",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333333",
                      }}
                    >
                      {msg.content}
                    </div>
                  )}

                  {msg.type === "user" && (
                    <div style={{ maxWidth: "50%" }}>
                      <div
                        style={{
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          paddingTop: "8px",
                          paddingBottom: "8px",
                          borderRadius: "8px",
                          backgroundColor: "#1a5a4a",
                          color: "#ffffff",
                          wordWrap: "break-word",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "14px",
                            lineHeight: "1.4",
                            margin: 0,
                          }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {msg.type === "assistant" && (
                    <div
                      style={{
                        maxWidth: "50%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      {/* SQL Query */}
                      {msg.content && (
                        <div
                          style={{
                            paddingLeft: "16px",
                            paddingRight: "16px",
                            paddingTop: "12px",
                            paddingBottom: "12px",
                            borderRadius: "8px",
                            backgroundColor: "#1a1a1a",
                            border: "1px solid #333333",
                          }}
                        >
                          <code
                            style={{
                              fontSize: "12px",
                              display: "block",
                              overflowX: "auto",
                              color: "#10b981",
                            }}
                          >
                            {msg.content}
                          </code>
                        </div>
                      )}

                      {/* Results Table */}
                      {msg.result && (
                        <div
                          style={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #333333",
                            backgroundColor: "#0a0a0a",
                          }}
                        >
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                fontSize: "12px",
                                borderCollapse: "collapse",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    backgroundColor: "#1a1a1a",
                                    borderBottom: "1px solid #333333",
                                  }}
                                >
                                  {Object.keys(msg.result[0]).map((key) => (
                                    <th
                                      key={key}
                                      style={{
                                        textAlign: "left",
                                        paddingLeft: "12px",
                                        paddingRight: "12px",
                                        paddingTop: "8px",
                                        paddingBottom: "8px",
                                        fontWeight: "500",
                                        color: "#aaaaaa",
                                        fontSize: "11px",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.result.map((row, rowIdx) => (
                                  <tr
                                    key={rowIdx}
                                    style={{
                                      borderBottom: "1px solid #222222",
                                    }}
                                  >
                                    {Object.values(row).map((val, colIdx) => (
                                      <td
                                        key={colIdx}
                                        style={{
                                          paddingLeft: "12px",
                                          paddingRight: "12px",
                                          paddingTop: "8px",
                                          paddingBottom: "8px",
                                          color: "#888888",
                                        }}
                                      >
                                        {val.toString()}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              paddingLeft: "12px",
                              paddingRight: "12px",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                              color: "#666666",
                              backgroundColor: "#0a0a0a",
                              borderTop: "1px solid #333333",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              {msg.result.length} row
                              {msg.result.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => exportCSV(msg.result)}
                              style={{
                                fontSize: "11px",
                                color: "#10b981",
                                backgroundColor: "transparent",
                                border: "1px solid #10b981",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Export CSV
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ maxWidth: "50%", width: "100%" }}>
                    <div
                      style={{
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333333",
                      }}
                    >
                      <Loader
                        className="animate-spin"
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#10b981",
                        }}
                      />
                      <span style={{ fontSize: "12px", color: "#888888" }}>
                        Processing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "24px",
          paddingBottom: "24px",
          backgroundColor: "#000000",
          borderTop: "1px solid #333333",
        }}
      >
        <div style={{ width: "100%", maxWidth: "896px" }}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              borderRadius: "8px",
              padding: "4px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your data..."
              style={{
                flex: 1,
                backgroundColor: "transparent",
                color: "#ffffff",
                fontSize: "14px",
                lineHeight: "1.5",
                maxHeight: "150px",
                border: "none",
                outline: "none",
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
                fontFamily: "inherit",
                resize: "none",
              }}
              rows="1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "12px",
                paddingBottom: "12px",
                backgroundColor:
                  !input.trim() || loading ? "transparent" : "#10b981",
                color: !input.trim() || loading ? "#555555" : "#000000",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                border: "none",
                flexShrink: 0,
              }}
            >
              <Send style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
          <div
            style={{
              fontSize: "12px",
              marginTop: "12px",
              textAlign: "center",
              color: "#555555",
            }}
          >
            Press{" "}
            <span
              style={{
                backgroundColor: "#1a1a1a",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #333333",
                fontFamily: "monospace",
              }}
            >
              Enter
            </span>{" "}
            to send •{" "}
            <span
              style={{
                backgroundColor: "#1a1a1a",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #333333",
                fontFamily: "monospace",
              }}
            >
              Shift + Enter
            </span>{" "}
            for new line
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

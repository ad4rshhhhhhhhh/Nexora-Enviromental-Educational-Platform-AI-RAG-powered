import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Main Nexora ka assistant hoon. Points, tasks, quizzes ya kisi bhi cheez ke baare me pooch sakte ho.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "Sorry, kuch gadbad ho gayi." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Server se connect nahi ho pa raha. Backend chal raha hai check karo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.wrapper}>
      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <span>Nexora Assistant</span>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div style={styles.messagesArea} ref={scrollRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.userBubble : styles.botBubble),
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.bubble, ...styles.botBubble }}>
                Typing...
              </div>
            )}
          </div>

          <div style={styles.inputRow}>
            <textarea
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Apna sawaal likho..."
              rows={1}
            />
            <button
              style={styles.sendBtn}
              onClick={handleSend}
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button style={styles.fab} onClick={() => setIsOpen((o) => !o)}>
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 1000,
    fontFamily: "system-ui, sans-serif",
  },
  fab: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#16a34a",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
  panel: {
    width: "340px",
    height: "460px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    marginBottom: "12px",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#16a34a",
    color: "white",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    lineHeight: 1,
  },
  messagesArea: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "#f9fafb",
  },
  bubble: {
    padding: "8px 12px",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: 1.4,
    maxWidth: "85%",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  userBubble: {
    backgroundColor: "#16a34a",
    color: "white",
    alignSelf: "flex-end",
  },
  botBubble: {
    backgroundColor: "#e5e7eb",
    color: "#111827",
    alignSelf: "flex-start",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "10px",
    borderTop: "1px solid #e5e7eb",
  },
  input: {
    flex: 1,
    resize: "none",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  sendBtn: {
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: 600,
  },
};

import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { API_URL, fetchUserProfile, refreshUser } from "../api.js";
import { Navigate, useNavigate } from "react-router-dom";

const LogMood = () => {
  const { user, setUser } = useContext(AuthContext);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // ---------- Robust date parsing ----------
  const parseDate = (dt) => {
    // fallback
    if (!dt) return new Date();

    if (dt instanceof Date) return dt;

    // if backend already gave an ISO-like string with T, pass it through
    let s = String(dt).trim();

    // If format "YYYY-MM-DD HH:MM:SS(.micro)..." -> convert first space to 'T'
    // (covers "2025-09-12 06:22:58.348413")
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(" ", "T");
    }

    // Truncate microseconds to milliseconds (JS handles up to ms)
    // e.g. .348413 -> .348
    s = s.replace(/\.(\d{3})\d+/, ".$1");

    // If fractional seconds exist with <3 digits, pad to 3 (e.g. .3 -> .300)
    s = s.replace(/\.(\d{1,2})(?!\d)/, (m, p) => "." + p.padEnd(3, "0"));

    // If no timezone info (no 'Z' and no +/- offset), append 'Z' (treat as UTC)
    // If string ends with 'Z' or contains '+' or '-' timezone, leave it.
    if (!/[Zz+\-]\d{2}:?\d{2}$/.test(s) && !/[Zz]$/.test(s) && !/[+\-]\d{2}$/.test(s)) {
      // only append Z if it looks like YYYY-MM-DDTHH:MM:SS...
      if (/\dT\d/.test(s)) s = s + "Z";
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // last resort: try without trailing Z (some engines parse better)
    try {
      const alt = s.replace(/Z$/, "");
      const d2 = new Date(alt);
      if (!isNaN(d2.getTime())) return d2;
    } catch (e) {
      // ignore
    }

    // ultimate fallback
    return new Date();
  };

  const getDayLabel = (dateOrString) => {
    const d = parseDate(dateOrString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  // ---------- fetch history ----------
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/journal/history/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Ensure each entry has created_at (or fallback)
          const normalized = data.map((m) => ({
            ...m,
            created_at: m.created_at ?? new Date().toISOString(),
          }));
          setMessages(normalized);
          setHasLoadedHistory(true);
        } else {
          // optionally handle non-200 (401 etc)
          console.warn("Failed loading history:", res.status);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchHistory();
  }, []);

  // ---------- auto-scroll ----------
  useEffect(() => {
    if (!chatEndRef.current || messages.length === 0) return;

    if (hasLoadedHistory) {
      chatEndRef.current.scrollIntoView({ behavior: "auto" });
      setHasLoadedHistory(false);
    } else {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ---------- ensure user in context ----------
  useEffect(() => {
    if (!user && localStorage.getItem("token")) {
      const getUser = async () => {
        const profile = await fetchUserProfile(localStorage.getItem("token"));
        if (profile) setUser(profile);
      };
      getUser();
    }
  }, [user, setUser]);

  if (!user && !localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  // ---------- streaming helper ----------
  const streamBotResponse = async (response) => {
    if (!response || !response.body) throw new Error("Streaming not supported");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botText = "";

    // add placeholder with timestamp now
    setMessages((prev) => [...prev, { sender: "bot", text: "", created_at: new Date().toISOString() }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      botText += chunk;

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: botText,
        };
        return updated;
      });
    }
  };

  // ---------- send message ----------
  const HandleEntry = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setError(null);
    const nowIso = new Date().toISOString();
    setMessages((prev) => [...prev, { sender: "user", text: text.trim(), created_at: nowIso }]);
    setText("");

    try {
      setLoading(true);

      let response = await fetch(`${API_URL}/journal/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text }),
      });

      // handle auth refresh
      if (response.status === 401) {
        const tokendata = await refreshUser(localStorage.getItem("refresh"));
        if (tokendata === "Refresh token expired") {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          setUser(null);
          navigate("/login", { replace: true, state: { message: "Please log in again" } });
          return;
        }
        localStorage.setItem("token", tokendata.access);
        response = await fetch(`${API_URL}/journal/add/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ text }),
        });
      }

      await streamBotResponse(response);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- group messages by day label (maintain order) ----------
  const grouped = messages.reduce((acc, msg) => {
    const day = getDayLabel(msg.created_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "calc(100vh - 70px)", backgroundColor: "white" }}>
      <div className="card shadow-lg rounded-4 w-100" style={{ maxWidth: "800px", height: "80vh" }}>
        <div className="p-3 bg-primary text-white text-center rounded-top-4">
          <h5 style={{ fontFamily: "system-ui", margin: 0 }}>Hey, {user?.username}! 👋</h5>
        </div>

        <div className="flex-grow-1 overflow-auto p-3" style={{ height: "100%" }}>
          <div className="d-flex flex-column gap-3">
            {messages.length === 0 && (
              <div className="text-center text-muted"><p className="text-info">💬 Say something to start the conversation..</p></div>
            )}

            {Object.entries(grouped).map(([dayLabel, msgs]) => (
              <div key={dayLabel}>
                <div className="text-center my-2">
                  <span className="badge bg-secondary"><h6>{dayLabel}</h6></span>
                </div>

                {msgs.map((msg, i) => {
                const dt = parseDate(msg.created_at);
                const prevMsg = msgs[i - 1];
                const sameSender = prevMsg && prevMsg.sender === msg.sender;

                const senderName = msg.sender === "user" ? "You" : "AI";

                return (
                    <div
                    key={`${dayLabel}-${i}`}
                    className={`d-flex flex-column ${
                        msg.sender === "user" ? "align-items-end" : "align-items-start"
                    }`}
                    >
                    {/* Show "You" / "AI" label only when sender changes */}
                    {!sameSender && (
                        <span
                        className="text-muted small"
                        style={{
                            marginBottom: "4px",
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                        }}
                        >
                        {senderName}
                        </span>
                    )}

                    <div
                        className="p-2 px-3 shadow-sm d-inline-flex flex-column"
                        style={{
                        backgroundColor: msg.sender === "user" ? "#dcf8c6" : "#e6e6e6",
                        borderRadius:
                            msg.sender === "user"
                            ? "16px 16px 0 16px"
                            : "16px 16px 16px 0",
                        maxWidth: "75%",
                        fontSize: "1rem",
                        lineHeight: "1.4",
                        }}
                    >
                        <span>{msg.text}</span>
                        <span
                        className="text-muted"
                        style={{
                            fontSize: "0.7rem",
                            marginTop: "4px", // space before timestamp
                            alignSelf: "flex-end",
                        }}
                        >
                        {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>
                    </div>
                );
                })}

              </div>
            ))}

            {loading && (
              <div className="d-flex justify-content-start">
                <div className="p-2 bg-white rounded-4 shadow-sm d-flex align-items-center gap-2" style={{ borderRadius: "16px 16px 16px 0" }}>
                  <img src="ripples.svg" alt="typing..." width={40} height={40} />
                  <span className="text-muted small">Typing...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <form onSubmit={HandleEntry} className="d-flex p-3 bg-white border-top rounded-bottom-4" style={{ fontFamily: "system-ui" }}>
          <input type="text" className="form-control rounded-pill me-2 shadow-sm" placeholder="Type your thoughts..." value={text} disabled={loading} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-primary rounded-pill shadow-sm px-4" disabled={loading}>Send</button>
        </form>

        {error && <p className="text-danger text-center p-2">{error}</p>}
      </div>
    </div>
  );
};

export default LogMood;

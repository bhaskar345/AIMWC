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
		if (!dt) return new Date();
		if (dt instanceof Date) return dt;

		let s = String(dt).trim();
		if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
		s = s.replace(" ", "T");
		}
		s = s.replace(/\.(\d{3})\d+/, ".$1");
		s = s.replace(/\.(\d{1,2})(?!\d)/, (m, p) => "." + p.padEnd(3, "0"));
		if (!/[Zz+\-]\d{2}:?\d{2}$/.test(s) && !/[Zz]$/.test(s) && !/[+\-]\d{2}$/.test(s)) {
		if (/\dT\d/.test(s)) s = s + "Z";
		}

		const d = new Date(s);
		if (!isNaN(d.getTime())) return d;

		try {
		const alt = s.replace(/Z$/, "");
		const d2 = new Date(alt);
		if (!isNaN(d2.getTime())) return d2;
		} catch (e) {}

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
			const normalized = data.map((m) => ({
				...m,
				created_at: m.created_at ?? new Date().toISOString(),
			}));
			setMessages(normalized);
			setHasLoadedHistory(true);
			} else {
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

	    if (response.status === 500) {
			const errorText = await response.text();
			console.error("Server error:", errorText);
			setError("Server error. Please try again later.");
			return;
		}

      	await streamBotResponse(response);
	} catch (err) {
		console.error("Chat error:", err);
	setError("Something went wrong. Please try again.");
	} finally {
		setLoading(false);
	}
	};

	// ---------- group messages by day label ----------
	const grouped = messages.reduce((acc, msg) => {
		const day = getDayLabel(msg.created_at);
		if (!acc[day]) acc[day] = [];
		acc[day].push(msg);
		return acc;
	}, {});

  	return (
		<div className="d-flex justify-content-center align-items-center" style={{ minHeight: "calc(100vh - 70px)", backgroundColor: "#e5ddd5" }}>
		<div className="shadow-lg w-100" style={{ maxWidth: "900px", height: "85vh", display: "flex", flexDirection: "column", borderRadius: "8px", overflow: "hidden", backgroundColor: "white" }}>
			
		{/* Modern Header */}
		<div className="d-flex align-items-center p-3 bg-white border-bottom" style={{ height: "60px" }}>
			<div className="d-flex align-items-center" style={{ flex: 1 }}>
				<div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", fontWeight: "600", fontSize: "1.1rem" }}>
				{user?.username?.[0]?.toUpperCase() || "U"}
				</div>
				<div className="ms-3">
				<div style={{ fontWeight: "600", fontSize: "1rem", lineHeight: "1.2" }}>
					{user?.username || "User"}
				</div>
				<div style={{ fontSize: "0.8rem", color: "#667781" }}>
					AI Journal Assistant
				</div>
				</div>
			</div>
		</div>

		{/* Chat Area */}
		<div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: "#efeae2", backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0wIDAgTDEwMCAxMDAgTTEwMCAwIEwwIDEwMCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')" }}>
			<div className="d-flex flex-column gap-1">
				{messages.length === 0 && (
				<div className="text-center text-muted" style={{ padding: "60px 20px" }}>
					<div style={{ fontSize: "3rem", marginBottom: "16px" }}>💬</div>
					<p style={{ color: "#667781", fontSize: "0.95rem" }}>Start a conversation with your AI journal assistant</p>
				</div>
				)}

				{Object.entries(grouped).map(([dayLabel, msgs]) => (
				<div key={dayLabel}>
					<div className="text-center my-3">
					<span className="px-3 py-1" style={{ backgroundColor: "#ffffff", borderRadius: "8px", fontSize: "0.75rem", color: "#54656f", fontWeight: "500", display: "inline-block", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
						{dayLabel}
					</span>
					</div>

					{msgs.map((msg, i) => {
					const dt = parseDate(msg.created_at);
					const prevMsg = msgs[i - 1];
					const nextMsg = msgs[i + 1];
					const sameSenderPrev = prevMsg && prevMsg.sender === msg.sender;
					const sameSenderNext = nextMsg && nextMsg.sender === msg.sender;

					return (
						<div key={`${dayLabel}-${i}`} className={`d-flex mb-1 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}>
						<div className="d-flex flex-column" style={{ maxWidth: "65%" }}>
							<div className={`px-3 py-2 position-relative ${msg.sender === "user" ? "bg-success" : "bg-white"}`} style={{
							color: msg.sender === "user" ? "white" : "#111b21",
							borderRadius: msg.sender === "user" 
								? `${sameSenderPrev ? "8px" : "8px"} ${sameSenderPrev ? "8px" : "8px"} ${sameSenderNext ? "8px" : "0px"} 8px`
								: `${sameSenderPrev ? "8px" : "8px"} ${sameSenderPrev ? "8px" : "8px"} 8px ${sameSenderNext ? "8px" : "0px"}`,
							fontSize: "0.94rem",
							lineHeight: "1.4",
							boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
							wordWrap: "break-word",
							whiteSpace: "pre-wrap"
							}}>
							<span style={{ paddingRight: "60px" }}>{msg.text}</span>
							<span className="d-flex align-items-center justify-content-end gap-1" style={{
								fontSize: "0.69rem",
								color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : "#667781",
								position: "absolute",
								bottom: "4px",
								right: "8px"
							}}>
								{dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
								{msg.sender === "user" && (
								<svg width="16" height="8" viewBox="0 0 16 8" fill="none">
									<path d="M15.01 1.99L12.01 4.99L11.01 3.99L14.01 0.99L15.01 1.99ZM11.01 3.99L8.01 6.99L7.01 5.99L10.01 2.99L11.01 3.99Z" fill="rgba(255,255,255,0.7)"/>
								</svg>
								)}
							</span>
							</div>
						</div>
						</div>
					);
					})}
				</div>
				))}

				{loading && (
				<div className="d-flex justify-content-start mb-1">
					<div className="px-3 py-2 bg-white d-flex align-items-center gap-2" style={{ borderRadius: "8px 8px 8px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
					<div className="d-flex gap-1">
						<div className="rounded-circle bg-secondary" style={{ width: "8px", height: "8px", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "-0.32s" }}></div>
						<div className="rounded-circle bg-secondary" style={{ width: "8px", height: "8px", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "-0.16s" }}></div>
						<div className="rounded-circle bg-secondary" style={{ width: "8px", height: "8px", animation: "bounce 1.4s infinite ease-in-out both" }}></div>
					</div>
					</div>
				</div>
				)}

				<div ref={chatEndRef} />
			</div>
		</div>

        {/* Input Area */}
        <form onSubmit={HandleEntry} className="d-flex align-items-center gap-2 p-2 bg-white border-top" style={{ minHeight: "60px" }}>
          <div className="d-flex align-items-center flex-grow-1 bg-white px-3 py-2" style={{ borderRadius: "24px", border: "1px solid #d1d7db" }}>
            <input 
              type="text" 
              className="border-0 flex-grow-1" 
              placeholder="Type a message" 
              value={text} 
              disabled={loading} 
              onChange={(e) => setText(e.target.value)}
              style={{ outline: "none", fontSize: "0.95rem", backgroundColor: "transparent" }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-success rounded-circle d-flex align-items-center justify-content-center p-0" 
            disabled={loading || !text.trim()}
            style={{ width: "44px", height: "44px", minWidth: "44px" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>

        {error && (
          <div className="text-center p-2 bg-danger text-white" style={{ fontSize: "0.85rem" }}>
            {error}
          </div>
        )}
      	</div>

		<style>{`
			@keyframes bounce {
			0%, 80%, 100% { transform: scale(0); }
			40% { transform: scale(1); }
			}
			
			input::placeholder {
			color: #8696a0;
			}
			
			/* Custom scrollbar */
			.overflow-auto::-webkit-scrollbar {
			width: 6px;
			}
			
			.overflow-auto::-webkit-scrollbar-track {
			background: transparent;
			}
			
			.overflow-auto::-webkit-scrollbar-thumb {
			background: rgba(0,0,0,0.2);
			border-radius: 3px;
			}
			
			.overflow-auto::-webkit-scrollbar-thumb:hover {
			background: rgba(0,0,0,0.3);
			}
		`}</style>
	</div>
  );
};

export default LogMood;
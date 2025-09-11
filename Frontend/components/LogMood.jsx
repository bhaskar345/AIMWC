import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { API_URL, fetchUserProfile, refreshUser } from "../api.js";
import { Navigate, useNavigate } from "react-router-dom";

const LogMood = () => {
    const { user, setUser } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (!user) {
        if (localStorage.getItem("token")) {
        const getUser = async () => {
            const profile = await fetchUserProfile(localStorage.getItem("token"));
            if (profile) setUser(profile);
        };
        getUser();
        } else {
        return <Navigate to="/login" replace={true} />;
        }
    };

    const HandleEntry = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const newMsg = { sender: "user", text };
        setMessages((prev) => [...prev, newMsg]);
        setText("");

        try {
            setLoading(true);
            
            const response = await fetch(`${API_URL}/journal/add/`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ text }),
            });

            if (response.statusText=="Unauthorized"){
                if (!localStorage.getItem('token')) {
                    navigate('/login', { replace: true, state: { message: 'Please log in again' } });
                };
                const tokendata = await refreshUser(localStorage.getItem("refresh"));
                if (tokendata=="Refresh token expired"){
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh');
                    setUser(null);
                    navigate('/login', { replace: true, state: { message: 'Please log in again' } });
                }else{
                    localStorage.setItem('token', tokendata.access);
                    setLoading(true);

                    const response = await fetch(`${API_URL}/journal/add/`, {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: JSON.stringify({ text }),
                    });

                    if (!response.body) throw new Error("Streaming not supported");

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let botText = "";

                    setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        botText += chunk;

                        setMessages((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { sender: "bot", text: botText };
                            return updated;
                        });
                    };

                    setLoading(false);                       
                };
            } else{
                if (!response.body) throw new Error("Streaming not supported");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let botText = "";

                setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    botText += chunk;

                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { sender: "bot", text: botText };
                        return updated;
                    });
                }

                setLoading(false);
            };
            } catch (err) {
                console.error("Chat error:", err);
                setLoading(false);
        };
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{
                minHeight: "calc(100vh - 70px)",
                backgroundColor: "white",
            }}
        >
        <div
            className="card shadow-lg rounded-4 w-100"
            style={{ maxWidth: "600px", height: "80vh" }}
        >

        <div className="p-3 bg-primary text-white text-center rounded-top-4">
          <h5 style={{ fontFamily: "system-ui", margin: 0 }}>
            Hey, {user && user.username}! 👋
          </h5>
        </div>

        <div className="flex-grow-1 overflow-auto p-3" style={{ height: "100%" }}>
            <div className="d-flex flex-column gap-3">
                {messages.length === 0 && (
                <div className="text-center text-muted">
                    <p className="text-info">💬 Say something to start the conversation..</p>
                </div>
                )}

            {messages.map((msg, idx) => (
            <div key={idx} className={`d-flex flex-column ${msg.sender === "user" ? "align-items-end" : "align-items-start"}`}>
                
                <span 
                className="small text-muted mb-1" 
                style={{ fontSize: "0.8rem", fontWeight: "500" }}
                >
                {msg.sender === "user" ? "You" : "AI"}
                </span>

                <div
                className="p-2 px-3 shadow-sm"
                style={{
                    backgroundColor: msg.sender === "user" ? "#dcf8c6" : "#e6e6e6",
                    borderRadius: msg.sender === "user"
                    ? "16px 16px 0 16px"
                    : "16px 16px 16px 0",
                    maxWidth: "75%",
                    fontSize: "1rem",
                    lineHeight: "1.4",
                }}
                >
                {msg.text}
                </div>
            </div>
            ))}

            {loading && (
                <div className="d-flex justify-content-start">
                    <div
                    className="p-2 bg-white rounded-4 shadow-sm d-flex align-items-center gap-2"
                    style={{
                        borderRadius: "16px 16px 16px 0",
                    }}
                    >
                    <img src="ripples.svg" alt="typing..." width={40} height={40} />
                    <span className="text-muted small">Typing...</span>
                    </div>
                </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <form
            onSubmit={HandleEntry}
            className="d-flex p-3 bg-white border-top rounded-bottom-4"
            style={{ fontFamily: "system-ui" }}
        >
            <input
                type="text"
                className="form-control rounded-pill me-2 shadow-sm"
                placeholder="Type your thoughts..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button
                type="submit"
                className="btn btn-primary rounded-pill shadow-sm px-4"
            >
            Send
            </button>
        </form>
        </div>
    </div>
    );
};

export default LogMood;
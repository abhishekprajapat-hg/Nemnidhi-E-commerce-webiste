import { useEffect, useRef, useState } from "react";

export default function ChatbotWidget({ cart }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        { sender: "bot", text: "Hi 👋 I’m your Glam shopping assistant 💖" },
      ]);
    }
  }, [open]);

  const pushBotMsg = (text) =>
    setMessages((prev) => [...prev, { sender: "bot", text }]);

  const detectCouponIntent = (txt) =>
    ["discount", "price", "offer", "expensive"].some((t) =>
      txt.toLowerCase().includes(t)
    );

  const sendMessage = async () => {
    if (!input.trim()) return;

    const msg = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setHistory((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");

    if (detectCouponIntent(msg)) {
      return pushBotMsg("🎁 Use code GLAM10 & get flat 10% OFF 💕");
    }

    try {
      setIsTyping(true);
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, cart, history }),
      });
      const data = await res.json();
      setIsTyping(false);
      pushBotMsg(data.reply);
    } catch {
      setIsTyping(false);
      pushBotMsg("⚠️ Server unavailable");
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="
            fixed bottom-5 right-5 z-[99999]
            w-14 h-14 rounded-full
            bg-gradient-to-br from-black via-gray-900 to-pink-600
            text-white text-2xl
            shadow-xl shadow-pink-500/30
            hover:scale-110 transition-all duration-300
          "
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="
    fixed bottom-24 right-5 z-[99999]
    w-80 h-[520px]
    rounded-2xl overflow-hidden
    bg-white
    shadow-2xl border border-gray-200
    flex flex-col
  "
        >
          {/* Header */}
          <div
            className="
              flex items-center justify-between
              px-4 py-3
              bg-gradient-to-r from-black to-pink-600
              text-white
            "
          >
            <div>
              <p className="text-sm font-semibold">Glam Assistant</p>
              <p className="text-[11px] opacity-80">
                Online • Replies instantly
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xl hover:rotate-90 transition-transform"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f7f2f2]">
            {messages.length === 1 && (
              <div className="text-center text-xs text-gray-400 mt-8">
                Ask me about orders, offers, returns or products 💬
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {/* Bot message */}
                {msg.sender === "bot" && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs">
                      G
                    </div>
                    <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm text-sm max-w-[75%]">
                      {msg.text}
                    </div>
                  </div>
                )}

                {/* User message */}
                {msg.sender === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-br from-black to-gray-800 text-white px-4 py-2 rounded-2xl rounded-br-none shadow-sm text-sm max-w-[75%]">
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <p className="text-xs text-gray-400 animate-pulse">
                Glam Assistant is typing…
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2 items-center">
              <input
                value={input}
                placeholder="Ask about sarees, orders, offers…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="
                  flex-1 px-3 py-2 rounded-xl
                  border text-sm outline-none
                  focus:ring-2 focus:ring-pink-400
                "
              />
              <button
                disabled={!input.trim()}
                onClick={sendMessage}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition
                  ${
                    input.trim()
                      ? "bg-black text-white hover:scale-105"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

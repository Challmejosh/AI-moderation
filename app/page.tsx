"use client";
import { useState, FormEvent } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ type: "user" | "bot"; text: string }[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatHistory([...chatHistory, { type: "user", text: message }]);
    setMessage("");

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: message }),
      });
      const data = await response.json();
      setChatHistory((prev) => [...prev, { type: "bot", text: data.response }]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setChatHistory((prev) => [...prev, { type: "bot", text: "Sorry, something went wrong." }]);
    }
  };

  return (
    <div className="p-3 flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-lg p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Chat Assistant</h1>
        <div className="h-96 overflow-y-auto mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Start a conversation...</p>
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.type === "user" ? "justify-end" : "justify-start"} mb-4 animate-fade-in`}>
                <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                  chat.type === "user"
                    ? "bg-linear-to-r from-blue-500 to-blue-600 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{chat.type === "user" ? "👤" : "🤖"}</span>
                    <span className="text-sm leading-relaxed">{chat.text}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Type your message..."
            aria-label="Message input"
          />
          <button
            type="submit"
            className="px-6 py-3 cursor-pointer bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

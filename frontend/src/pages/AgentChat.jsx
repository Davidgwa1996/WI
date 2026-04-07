import React, { useState } from "react";
import { FiSend, FiZap } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import { useDashboardStream } from "../hooks/useWebSocket";
import api from "../services/api";

const AgentChat = () => {
  const { isConnected } = useDashboardStream();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello. I’m your Web3 intelligence agent. Ask me about strongest projects, sector leaders, risk signals, watchlist suggestions, or briefing summaries.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const nextMessages = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await api.agent.chat({ message: prompt });
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: result?.answer || "No response returned.",
        },
      ]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: error?.message || "Agent request failed.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="AI Agent"
            subtitle="Automatic workspace intelligence assistant."
          />

          <div className="glass-card flex h-[78vh] flex-col overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                <FiZap className="h-4 w-4" />
                Automatic AI workspace agent
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-6">
              {messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`max-w-3xl rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${
                    msg.role === "user"
                      ? "ml-auto bg-brand-gradient text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {loading ? (
                <div className="max-w-3xl rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                  Thinking...
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Ask the agent about opportunities, risks, top projects, reports, or sectors..."
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                  <FiSend className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default AgentChat;
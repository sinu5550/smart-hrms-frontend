'use client';

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Sparkles,
  CheckCheck,
  Shield,
  Smile,
  Paperclip,
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  time: string;
  isMe: boolean;
}

export default function MobileLiveChatPortalPage() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<"GENERAL" | "ENGINEERING" | "ANNOUNCEMENTS">("GENERAL");
  const [inputText, setInputText] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderName: "Tanvir Ahmed (HR)",
      senderId: "EKH-26-0002",
      text: "Good morning team! Please remember to review the holiday schedule for the upcoming weekend.",
      time: "09:30 AM",
      isMe: false,
    },
    {
      id: "2",
      senderName: "Rafiqul Islam",
      senderId: "EKH-26-0005",
      text: "Thanks Tanvir bhai. Are we working half-day on Thursday?",
      time: "09:45 AM",
      isMe: false,
    },
    {
      id: "3",
      senderName: user?.fullName || "Me",
      senderId: user?.employeeId || "EKH-26-0001",
      text: "Thursday is a full working day as per regular office shift.",
      time: "10:02 AM",
      isMe: true,
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: user?.fullName || "Me",
      senderId: user?.employeeId || "EKH-26-0001",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };

    setMessages([...messages, newMsg]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Top Channel Switcher */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800">
              {activeChannel === "GENERAL" ? "# General Workplace" : activeChannel === "ENGINEERING" ? "# Engineering Dept" : "# Office Notices"}
            </h2>
            <p className="text-[10px] text-slate-400">Live Team Messaging</p>
          </div>
        </div>

        <select
          value={activeChannel}
          onChange={(e) => setActiveChannel(e.target.value as any)}
          className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 bg-white"
        >
          <option value="GENERAL">General</option>
          <option value="ENGINEERING">Engineering</option>
          <option value="ANNOUNCEMENTS">Notices</option>
        </select>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
          >
            {!msg.isMe && (
              <span className="text-[10px] font-bold text-slate-500 mb-0.5 ml-1">
                {msg.senderName}
              </span>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                msg.isMe
                  ? "bg-emerald-700 text-white rounded-br-xs"
                  : "bg-slate-100 text-slate-800 rounded-bl-xs"
              }`}
            >
              <p>{msg.text}</p>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-400 px-1">
              <span>{msg.time}</span>
              {msg.isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Type message to team..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
        />
        <button
          type="submit"
          className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

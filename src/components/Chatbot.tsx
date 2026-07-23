"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, AlertCircle } from "lucide-react";
import { courses as defaultCourses, Course } from "@/lib/courses";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [activeCourses, setActiveCourses] = useState<Course[]>(defaultCourses);

  const initializeWelcome = (): ChatMessage => {
    return {
      role: "assistant",
      content: "Hello. I can help with sample pathways, registering interest, and college contact details.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [
        {
          role: "assistant",
          content: "Hello. I can help with sample pathways, registering interest, and college contact details.",
          timestamp: "",
        },
      ];
    }
    const storedChat = window.localStorage.getItem("vck_chat_history");
    if (storedChat) {
      try {
        const parsed = JSON.parse(storedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fall back to default welcome
      }
    }
    return [
      {
        role: "assistant",
        content: "Hello. I can help with sample pathways, registering interest, and college contact details.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const resetToWelcome = () => {
    setMessages([initializeWelcome()]);
  };

  // Save chat history to localStorage when updated
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      window.localStorage.setItem("vck_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    fetch("/api/courses")
      .then((response) => response.json())
      .then((data: { courses?: Course[] }) => {
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          setActiveCourses(data.courses);
        }
      })
      .catch(() => {
        setActiveCourses(defaultCourses);
      });
  }, []);

  // Scroll to bottom when messages update or open state changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorText("");
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          courses: activeCourses,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to assistant");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setErrorText("Connection lost. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const clearChat = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vck_chat_history");
    }
    resetToWelcome();
  };

  // Simple custom text parser to render basic bold and list markdown without heavy external packages
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();
      
      // Check for bullet lists
      const isBullet = trimmed.startsWith("*") || trimmed.startsWith("-");
      if (isBullet) {
        trimmed = trimmed.substring(1).trim();
      }

      // Parse bold **text**
      const parts = [];
      let currentIdx = 0;
      const regex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = regex.exec(trimmed)) !== null) {
        const precedingText = trimmed.substring(currentIdx, match.index);
        if (precedingText) parts.push(precedingText);
        parts.push(<strong key={match.index} className="font-extrabold text-[#020d24]">{match[1]}</strong>);
        currentIdx = regex.lastIndex;
      }

      const remainingText = trimmed.substring(currentIdx);
      if (remainingText) parts.push(remainingText);

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-4 list-disc pl-1 text-sm font-semibold leading-relaxed mb-1 text-slate-700">
            {parts.length > 0 ? parts : trimmed}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="text-sm font-semibold leading-relaxed mb-2 text-slate-700">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  const quickSuggestions = [
    { label: "Sample pathways", query: "Which sample courses are shown?" },
    { label: "Register interest", query: "How do I register my interest?" },
    { label: "Study options", query: "What delivery options are planned?" },
    { label: "Contact", query: "How can I contact the college?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#0067b1] to-[#18aee5] text-white shadow-[0_8px_30px_rgba(0,103,177,0.35)] transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Open course assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-32px)] max-h-[520px] h-[75vh] w-96 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl flex flex-col sm:w-[400px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#020d24] via-[#0067b1] to-[#020d24] px-5 py-4 flex items-center justify-between text-white border-b border-[#18aee5]/12">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f5b800] border border-white/20">
                  <Bot size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black tracking-wide">VCK AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-300">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                title="Clear conversation"
              >
                Reset
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black border ${
                      msg.role === "user"
                        ? "bg-[#0067b1] text-white border-[#0067b1]/20"
                        : "bg-white text-[#f5b800] border-slate-200"
                    }`}
                  >
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </span>

                  <div className="space-y-1">
                    <div
                      className={`rounded-2xl px-4 py-3 border shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-tr from-[#0067b1] to-[#18aee5] text-white border-[#0067b1]/30 rounded-tr-none"
                          : "bg-white text-slate-800 border-slate-100 rounded-tl-none"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="text-sm font-semibold leading-relaxed">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>
                    <span className="block text-[9px] font-bold text-slate-400 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#f5b800] border border-slate-200 text-xs">
                    <Bot size={14} />
                  </span>
                  <div className="bg-white rounded-2xl rounded-tl-none border border-slate-100 px-4 py-3 flex items-center justify-center gap-1">
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Error indicator */}
              {errorText && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-500">
                  <AlertCircle size={15} />
                  {errorText}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggestions list (only visible when not loading) */}
            {!isLoading && messages.length <= 2 && (
              <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex gap-2 overflow-x-auto shrink-0 select-none no-scrollbar">
                {quickSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.query)}
                    className="shrink-0 bg-white border border-slate-200 text-slate-600 rounded-full px-3 py-1.5 text-xs font-bold transition hover:border-[#18aee5] hover:text-[#0067b1] hover:bg-[#18aee5]/5 active:scale-95 cursor-pointer shadow-sm"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer Form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about VCK courses..."
                className="flex-1 h-11 border border-slate-200 rounded-xl bg-slate-50 px-4 font-bold text-[#020d24] text-base focus:outline-none focus:ring-2 focus:ring-[#18aee5]/40 focus:border-[#18aee5]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="flex size-11 items-center justify-center rounded-xl bg-[#0067b1] text-white hover:bg-[#123e95] active:scale-95 disabled:opacity-50 cursor-pointer"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

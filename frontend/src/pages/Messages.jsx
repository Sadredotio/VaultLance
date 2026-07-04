import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api";
import { getSocket } from "../socket";
import toast from "react-hot-toast";
import { Send, Search, ArrowLeft, Briefcase, Circle } from "lucide-react";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

const Messages = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUserId, setTypingUserId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // ── Load conversation list ──────────────────────────────────────────────
  const loadConversations = async () => {
    try {
      setLoadingConvos(true);
      const { data } = await API.get("/messages/conversations");
      setConversations(data);
    } catch (err) {
      toast.error("Failed to load conversations");
    } finally {
      setLoadingConvos(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // ── If arriving with ?with=<userId>&job=<jobId>, start/open that conversation ──
  useEffect(() => {
    const otherUserId = searchParams.get("with");
    const jobId = searchParams.get("job");
    if (!otherUserId) return;

    const startConversation = async () => {
      try {
        const { data } = await API.post("/messages/conversations", {
          otherUserId,
          jobId: jobId || undefined,
        });
        setActiveConvo(data);
        setShowMobileChat(true);
        loadConversations();
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not start conversation");
      }
    };

    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Socket connection lifecycle ─────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const handleNewMessage = (msg) => {
      if (activeConvo && msg.conversationId === activeConvo._id) {
        setMessages((prev) => [...prev, msg]);
        socket.emit("mark_read", { conversationId: activeConvo._id });
      }
      // Refresh conversation list so previews/unread counts stay current
      loadConversations();
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (activeConvo && conversationId === activeConvo._id) {
        setTypingUserId(userId);
      }
    };

    const handleStopTyping = ({ conversationId }) => {
      if (activeConvo && conversationId === activeConvo._id) {
        setTypingUserId(null);
      }
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvo]);

  // ── Open a conversation: fetch history, join socket room ───────────────
  const openConversation = async (convo) => {
    setActiveConvo(convo);
    setShowMobileChat(true);
    setLoadingMessages(true);
    setTypingUserId(null);

    try {
      const { data } = await API.get(`/messages/conversations/${convo._id}`);
      setMessages(data);

      const socket = getSocket();
      if (socket) {
        socket.emit("join_conversation", convo._id);
        socket.emit("mark_read", { conversationId: convo._id });
      }

      // Optimistically clear unread badge for this conversation
      setConversations((prev) =>
        prev.map((c) => (c._id === convo._id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Leave the room when switching away from a conversation
  useEffect(() => {
    return () => {
      if (activeConvo) {
        const socket = getSocket();
        socket?.emit("leave_conversation", activeConvo._id);
      }
    };
  }, [activeConvo]);

  // ── Auto-scroll to bottom on new messages ───────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !activeConvo) return;

    const socket = getSocket();
    if (!socket) {
      toast.error("Not connected — please refresh the page");
      return;
    }

    socket.emit(
      "send_message",
      { conversationId: activeConvo._id, text },
      (res) => {
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        // Append locally too, in case this client isn't in the room yet
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
      }
    );

    socket.emit("stop_typing", { conversationId: activeConvo._id });
    setMessageText("");
  };

  // ── Typing indicator emit (debounced) ───────────────────────────────────
  const handleTypingInput = (e) => {
    setMessageText(e.target.value);
    const socket = getSocket();
    if (!socket || !activeConvo) return;

    socket.emit("typing", { conversationId: activeConvo._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: activeConvo._id });
    }, 1500);
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return DEFAULT_AVATAR;
    if (avatar.startsWith("http")) return avatar;
    return `http://localhost:5000${avatar}`;
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
          {/* ───────── CONVERSATION LIST ───────── */}
          <div
            className={`w-full md:w-[360px] border-r border-gray-200 flex flex-col ${
              showMobileChat ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <p className="text-5xl mb-3">💬</p>
                  <p className="text-gray-600 font-medium">No conversations yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Messages with clients and freelancers will appear here
                  </p>
                </div>
              ) : (
                filteredConversations.map((convo) => {
                  const isOnline = onlineUsers.has(convo.otherUser?._id);
                  const isActive = activeConvo?._id === convo._id;
                  return (
                    <button
                      key={convo._id}
                      onClick={() => openConversation(convo)}
                      className={`w-full flex items-start gap-3 px-5 py-4 border-b border-gray-100 text-left transition ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={getAvatarUrl(convo.otherUser?.avatar)}
                          alt={convo.otherUser?.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 truncate">
                            {convo.otherUser?.name || "Unknown User"}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(convo.lastMessage?.createdAt || convo.updatedAt)}
                          </span>
                        </div>
                        {convo.jobId?.title && (
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5 truncate">
                            <Briefcase className="w-3 h-3 flex-shrink-0" />
                            {convo.jobId.title}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-sm text-gray-500 truncate">
                            {convo.lastMessage?.text || "No messages yet"}
                          </p>
                          {convo.unreadCount > 0 && (
                            <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                              {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ───────── ACTIVE CHAT THREAD ───────── */}
          <div
            className={`flex-1 flex flex-col ${
              showMobileChat ? "flex" : "hidden md:flex"
            }`}
          >
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center flex-col text-center px-6">
                <p className="text-6xl mb-4">👋</p>
                <p className="text-gray-700 font-bold text-lg">
                  Select a conversation
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Choose someone from the list to start chatting
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1 -ml-1 text-gray-500"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <img
                      src={getAvatarUrl(activeConvo.otherUser?.avatar)}
                      alt={activeConvo.otherUser?.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    {onlineUsers.has(activeConvo.otherUser?._id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {activeConvo.otherUser?.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                      {onlineUsers.has(activeConvo.otherUser?._id) ? (
                        <>
                          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />{" "}
                          Online
                        </>
                      ) : (
                        activeConvo.otherUser?.role
                      )}
                    </p>
                  </div>
                  {activeConvo.jobId?._id && (
                    <button
                      onClick={() => navigate(`/job-details/${activeConvo.jobId._id}`)}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition whitespace-nowrap"
                    >
                      View Job
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">
                        No messages yet — say hello 👋
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {messages.map((msg) => {
                        const isMine = msg.senderId === user._id || msg.senderId?._id === user._id;
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? "bg-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  isMine ? "text-blue-100" : "text-gray-400"
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {typingUserId && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      )}

                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSend}
                  className="px-5 py-4 border-t border-gray-200 flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={handleTypingInput}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-full transition flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
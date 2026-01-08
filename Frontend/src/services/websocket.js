import { io } from "socket.io-client";

const API_URL = import.meta.env.PROD
  ? "https://lawsphere-api.vercel.app" // Updated production API URL
  : "http://localhost:5000";

// Create a more robust fallback mechanism
const socketFallback = {
  connected: false,
  connect: () => console.log("Socket fallback: connect called"),
  disconnect: () => console.log("Socket fallback: disconnect called"),
  emit: () => console.log("Socket fallback: emit called"),
  on: () => console.log("Socket fallback: on called"),
  off: () => console.log("Socket fallback: off called"),
  of: () => socketFallback,
  to: () => socketFallback,
  join: () => {},
  leave: () => {},
};

// Determine if we should use real sockets or fallback
const useRealSockets = !import.meta.env.PROD;

// Create a WebSocket connection to the community namespace or use fallback
let communitySocket;

try {
  if (useRealSockets) {
    communitySocket = io(`${API_URL}/community`, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  } else {
    console.log("Production environment detected - using WebSocket fallback");
    communitySocket = socketFallback;
  }
} catch (error) {
  console.error("Error initializing socket:", error);
  communitySocket = socketFallback;
}

// Connection event handlers - only attach if using real sockets
if (useRealSockets) {
  communitySocket.on("connect", () => {
    console.log("Connected to community WebSocket server");
  });

  communitySocket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    // Don't repeatedly try to reconnect in production
    if (import.meta.env.PROD) {
      communitySocket.disconnect();
    }
  });

  communitySocket.on("disconnect", (reason) => {
    console.log("Disconnected from WebSocket server:", reason);
  });
}

// Event handlers setup - to be called from UI components
const setupTopicListeners = (callbacks = {}) => {
  // Listen for new topics
  communitySocket.on("new-topic", (topic) => {
    console.log("New topic received:", topic);
    if (callbacks.onNewTopic) callbacks.onNewTopic(topic);
  });

  // Listen for topic vote updates
  communitySocket.on("topic-vote-update", (data) => {
    console.log("Topic vote update:", data);
    if (callbacks.onTopicVoteUpdate) callbacks.onTopicVoteUpdate(data);
  });
};

// Topic detail event listeners
const setupTopicDetailListeners = (topicId, callbacks = {}) => {
  // Join the topic room
  communitySocket.emit("join-topic", topicId);

  // Listen for new replies
  communitySocket.on("new-reply", (data) => {
    console.log("New reply received:", data);
    if (callbacks.onNewReply && data.topicId === topicId) {
      callbacks.onNewReply(data);
    }
  });

  // Listen for reply vote updates
  communitySocket.on("reply-vote-update", (data) => {
    console.log("Reply vote update:", data);
    if (callbacks.onReplyVoteUpdate && data.topicId === topicId) {
      callbacks.onReplyVoteUpdate(data);
    }
  });

  // Return cleanup function
  return () => {
    communitySocket.emit("leave-topic", topicId);
    communitySocket.off("new-reply");
    communitySocket.off("reply-vote-update");
  };
};

// Cleanup topic list listeners
const cleanupTopicListeners = () => {
  communitySocket.off("new-topic");
  communitySocket.off("topic-vote-update");
};

// Connect to WebSocket server - call this when user logs in
const connectWebSocket = () => {
  try {
    if (useRealSockets && !communitySocket.connected) {
      communitySocket.connect();
    }
  } catch (error) {
    console.error("Error connecting to WebSocket:", error);
  }
};

// Disconnect from WebSocket server - call this when user logs out
const disconnectWebSocket = () => {
  if (useRealSockets && communitySocket.connected) {
    communitySocket.disconnect();
  }
};

export const communityWebSocket = {
  connectWebSocket,
  disconnectWebSocket,
  setupTopicListeners,
  cleanupTopicListeners,
  setupTopicDetailListeners,
};

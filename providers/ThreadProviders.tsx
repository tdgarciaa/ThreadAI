import { measureMemory } from "node:vm";
import { useState, createContext, ReactNode, useContext } from "react";

interface ThreadContextType {
  selectedThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  toogleThread: (messageId: string) => void;
  isThreadOpen: boolean;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  const openThread = (messageId: string) => {
    setSelectedThreadId(messageId);
    setIsThreadOpen(true);
  };

  const closeThread = () => {
    setSelectedThreadId(null);
    setIsThreadOpen(false);
  };

  const toogleThread = (messageId: string) => {
    if (selectedThreadId === messageId && isThreadOpen) {
      closeThread();
    } else {
      openThread(messageId);
    }
  };

  const value: ThreadContextType = {
    selectedThreadId,
    openThread,
    closeThread,
    toogleThread,
    isThreadOpen,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThread() {
  const context = useContext(ThreadContext);

  if (context === undefined) {
    throw new Error("useThread must be used within a thread provider");
  }
  return context;
}

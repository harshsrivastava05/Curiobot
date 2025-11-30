"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Book, Brain, MessageSquare, FileText, ChevronRight, ChevronDown, HelpCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LoadingScreen from "@/components/LoadingScreen";
import MindMap from "@/components/MindMap";

// ... (Mock Data Types remain same)

export default function DocumentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"topics" | "mindmap" | "qna" | "predicted" | "previous">("topics");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  
  // Chat State
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (activeTab === "qna" && id && session) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/qna/history/${id}`, {
            headers: {
                Authorization: `Bearer ${(session as any).backendToken}`,
            },
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setChatHistory(data);
            }
        })
        .catch(err => console.error("Failed to fetch chat history", err));
    }
  }, [activeTab, id, session]);

  useEffect(() => {
    // ... (fetch logic remains same)
    if (!id || !session) return;

    let timeoutId: NodeJS.Timeout;

    const fetchDocument = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${(session as any).backendToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch document");
        }

        const data = await res.json();
        
        if (data.status === "processing") {
            setProgress(data.progress || 0);
            // Poll again
            timeoutId = setTimeout(fetchDocument, 2000);
        } else {
            setData(data);
            setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        setLoading(false); // Stop loading on error
      }
    };

    fetchDocument();

    return () => clearTimeout(timeoutId);
  }, [id, session]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    
    setDeleting(true);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${(session as any).backendToken}`,
            },
        });

        if (!res.ok) throw new Error("Failed to delete");

        router.push("/dashboard");
    } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete document");
    } finally {
        setDeleting(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || asking) return;

    const userQuestion = question;
    setQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", content: userQuestion }]);
    setAsking(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/qna/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).backendToken}`,
        },
        body: JSON.stringify({
          documentId: id,
          question: userQuestion,
        }),
      });

      if (!res.ok) throw new Error("Failed to get answer");

      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (error) {
      console.error("Q&A failed:", error);
      setChatHistory((prev) => [...prev, { role: "ai", content: "Sorry, I couldn't get an answer at this time." }]);
    } finally {
      setAsking(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Clear chat history?")) return;
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/qna/history/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${(session as any).backendToken}`,
            },
        });
        setChatHistory([]);
    } catch (error) {
        console.error("Failed to clear chat", error);
    }
  };

  // Helper to render bold text
  const renderMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (loading) return <LoadingScreen progress={progress} />;
  if (!data) return <div className="flex items-center justify-center h-screen bg-[#e0e5ec] text-gray-500">Document not found</div>;

  const isFullScreen = activeTab !== "topics";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#e0e5ec]">
      {/* Secondary Navbar */}
      <div className="bg-[#e0e5ec] border-b border-white/20 px-6 py-2 flex items-center justify-between overflow-x-auto no-scrollbar shadow-sm z-10">
        <div className="flex items-center gap-2">
            {[
            { id: "topics", label: "Topics & Notes", icon: <Book className="w-4 h-4" /> },
            { id: "mindmap", label: "Mind Map", icon: <Brain className="w-4 h-4" /> },
            { id: "qna", label: "AI Q&A", icon: <MessageSquare className="w-4 h-4" /> },
            { id: "predicted", label: "Predicted Qs", icon: <HelpCircle className="w-4 h-4" /> },
            { id: "previous", label: "Previous Qs", icon: <HelpCircle className="w-4 h-4" /> },
            ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                "px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id
                    ? "neo-inset text-primary"
                    : "text-gray-600 hover:bg-white/30"
                )}
            >
                {tab.icon}
                {tab.label}
            </button>
            ))}
        </div>
        
        <button 
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:neo-inset transition-all"
        >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        {!isFullScreen && (
          <div className="w-1/2 bg-gray-100 border-r border-gray-300 flex flex-col hidden lg:flex h-full">
            {data.fileUrl ? (
              <iframe 
                src={data.fileUrl} 
                className="w-full h-full" 
                title="Document Viewer"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                PDF not available
              </div>
            )}
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className={cn("p-8 overflow-y-auto bg-[#e0e5ec]", isFullScreen ? "w-full" : "w-full lg:w-1/2")}>
          {activeTab === "topics" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Topics</h2>
              {data.topics && data.topics.length > 0 ? (
                data.topics.map((topic: string) => (
                  <div key={topic} className="neo-shadow p-6 rounded-2xl bg-[#e0e5ec]">
                    <h3 className="text-lg font-bold text-primary mb-2">{topic}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {data.explanations?.[topic] || "Explanation loading..."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No topics found.</p>
              )}
            </div>
          )}

          {activeTab === "mindmap" && (
            <div className="animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Concept Map</h2>
              <div className="neo-inset rounded-3xl flex-1 min-h-[500px] overflow-hidden">
                {data.mindTree ? <MindMap data={data.mindTree} /> : <p className="p-8 text-gray-500">No mind map available.</p>}
              </div>
            </div>
          )}
          
          {/* Other tabs remain same but now take full width due to isFullScreen check */}
          {activeTab === "qna" && (
            <div className="animate-in fade-in slide-in-from-right-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Ask AI</h2>
                {chatHistory.length > 0 && (
                    <button 
                        onClick={handleClearChat}
                        className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Clear Chat
                    </button>
                )}
              </div>
              <div className="flex-1 neo-inset rounded-2xl mb-4 p-4 overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <p>Ask anything about the document...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] p-5 rounded-2xl shadow-sm text-sm leading-relaxed",
                          msg.role === "user" 
                            ? "bg-[var(--primary)] text-white rounded-br-none" 
                            : "bg-white text-gray-800 rounded-bl-none"
                        )}>
                          {renderMessage(msg.content)}
                        </div>
                      </div>
                    ))}
                    {asking && (
                      <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1 w-fit">
                          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  placeholder="Type your question..." 
                  className="flex-1 neo-inset px-4 py-3 rounded-xl bg-transparent outline-none"
                  disabled={asking}
                />
                <button 
                  onClick={handleAskQuestion}
                  disabled={asking || !question.trim()}
                  className="neo-btn px-6 py-3 rounded-xl font-bold text-primary disabled:opacity-50"
                >
                  {asking ? "..." : "Send"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "predicted" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               <h2 className="text-2xl font-bold text-gray-800 mb-4">Predicted Questions</h2>
               {data.predictedQuestions && data.predictedQuestions.length > 0 ? (
                 data.predictedQuestions.map((q: any, i: number) => (
                   <div key={i} className="neo-shadow p-6 rounded-2xl bg-[#e0e5ec]">
                     <h3 className="font-bold text-gray-800 mb-2">Q: {q.question}</h3>
                     <p className="text-gray-600 text-sm">A: {q.answer}</p>
                   </div>
                 ))
               ) : (
                 <p className="text-gray-500">No predicted questions available.</p>
               )}
             </div>
          )}

          {activeTab === "previous" && (
             <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in slide-in-from-right-4">
               <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                 <HelpCircle className="w-10 h-10 text-gray-400" />
               </div>
               <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
               <p className="text-gray-500">We are working on gathering previously asked questions for this topic.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

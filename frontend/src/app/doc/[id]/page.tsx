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
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask AI</h2>
              <div className="flex-1 neo-inset rounded-2xl mb-4 p-4">
                {/* Chat messages would go here */}
                <div className="text-gray-400 text-center mt-10">Ask anything about the document...</div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type your question..." 
                  className="flex-1 neo-inset px-4 py-3 rounded-xl bg-transparent outline-none"
                />
                <button className="neo-btn px-6 py-3 rounded-xl font-bold text-primary">Send</button>
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

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter
import UnifiedWorkspace from "@/components/Workspace/UnifiedWorkspace";
import { notebooksApi } from "@/lib/notebooks";

export default function NotebookPage() {
  return (
    <Suspense fallback={<div className="p-4 text-white">Loading notebook...</div>}>
      <NotebookContent />
    </Suspense>
  );
}

function NotebookContent() {
  const searchParams = useSearchParams();
  const notebookId = searchParams.get("id");
  const router = useRouter(); // Need to import useRouter
  
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [title, setTitle] = useState("Untitled Notebook");

  // Load Notebook Data
  useEffect(() => {
    if (!notebookId) return;
    notebooksApi.getById(notebookId).then(data => {
        setCode(data.content);
        setLanguage(data.language);
        setTitle(data.title);
    }).catch(console.error);
  }, [notebookId]);

  return (
    <UnifiedWorkspace 
        initialCode={code}
        initialLanguage={language}
        notebookTitle={title}
        onCodeChange={setCode}
        onTitleChange={setTitle}
        isNotebook={true}
        onBack={() => router.push('/dashboard')}
        onSave={() => {
            // Implement save logic here if needed, or rely on autosave
             console.log("Save triggered", { notebookId, code, title });
        }}
    />
  );
}

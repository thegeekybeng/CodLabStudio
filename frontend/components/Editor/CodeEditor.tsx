"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  onLanguageChange?: (language: string) => void;
  readOnly?: boolean;
  height?: string;
  notebookId?: string;
  userId?: string;
  onCollaborationUpdate?: (content: string, language: string) => void;
  onCursorChange?: (cursor: { line: number; column: number }) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python 3.11", monaco: "python" },
  { value: "python3.10", label: "Python 3.10", monaco: "python" },
  { value: "python3.12", label: "Python 3.12", monaco: "python" },
  { value: "javascript", label: "JavaScript (Node 20)", monaco: "javascript" },
  { value: "node18", label: "JavaScript (Node 18)", monaco: "javascript" },
  { value: "node19", label: "JavaScript (Node 19)", monaco: "javascript" },
  { value: "typescript", label: "TypeScript", monaco: "typescript" },
  { value: "java", label: "Java 17", monaco: "java" },
  { value: "java11", label: "Java 11", monaco: "java" },
  { value: "java21", label: "Java 21", monaco: "java" },
  { value: "cpp", label: "C++", monaco: "cpp" },
  { value: "c", label: "C", monaco: "c" },
  { value: "go", label: "Go 1.21", monaco: "go" },
  { value: "go1.20", label: "Go 1.20", monaco: "go" },
  { value: "go1.22", label: "Go 1.22", monaco: "go" },
  { value: "rust", label: "Rust 1.70", monaco: "rust" },
  { value: "rust1.69", label: "Rust 1.69", monaco: "rust" },
  { value: "rust1.71", label: "Rust 1.71", monaco: "rust" },
  { value: "ruby", label: "Ruby 3.2", monaco: "ruby" },
  { value: "ruby3.1", label: "Ruby 3.1", monaco: "ruby" },
  { value: "ruby3.3", label: "Ruby 3.3", monaco: "ruby" },
  { value: "php", label: "PHP 8.2", monaco: "php" },
  { value: "php8.1", label: "PHP 8.1", monaco: "php" },
  { value: "php8.3", label: "PHP 8.3", monaco: "php" },
  { value: "swift", label: "Swift", monaco: "swift" },
  { value: "kotlin", label: "Kotlin", monaco: "kotlin" },
  { value: "scala", label: "Scala", monaco: "scala" },
  { value: "r", label: "R", monaco: "r" },
  { value: "julia", label: "Julia", monaco: "julia" },
  { value: "perl", label: "Perl", monaco: "perl" },
  { value: "bash", label: "Bash", monaco: "shell" },
  { value: "sql", label: "SQL", monaco: "sql" },
];

export default function CodeEditor({
  value,
  language,
  onChange,
  onLanguageChange,
  readOnly = false,
  height = "600px",
  notebookId,
  userId,
  onCollaborationUpdate,
  onCursorChange,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [showFindWidget, setShowFindWidget] = useState(false);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
      tabSize: 2,
      // Enable error detection and diagnostics
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      wordBasedSuggestions: "matchingDocuments",
      // Show errors and warnings
      renderValidationDecorations: "on",
      // Enable semantic highlighting for better error visibility
      semanticHighlighting: {
        enabled: true,
      },
      // Enable find widget (Ctrl+F / Cmd+F)
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: "never",
        seedSearchStringFromSelection: "always",
      },
    });

    // Ensure find widget is accessible via keyboard shortcuts
    // Ctrl+F (Windows/Linux) or Cmd+F (Mac) should work by default
    // But we'll add explicit handlers to ensure it works
    const KeyMod = monaco.KeyMod;
    const KeyCode = monaco.KeyCode;
    
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyF, () => {
      editor.getAction("actions.find")?.run();
      setShowFindWidget(true);
    });

    // Also support Ctrl+H for find and replace
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyH, () => {
      editor.getAction("editor.action.startFindReplaceAction")?.run();
      setShowFindWidget(true);
    });

    // Handle escape to close find widget
    editor.addCommand(KeyCode.Escape, () => {
      editor.getAction("closeFindWidget")?.run();
      setShowFindWidget(false);
    });

    // Enable diagnostics/error detection for supported languages
    const model = editor.getModel();
    if (model) {
      // For TypeScript/JavaScript, Monaco has built-in error detection
      // For Python and other languages, we can add custom validation
      const language = model.getLanguageId();
      
      // Configure language-specific settings
      if (language === "python") {
        // Python error detection (basic syntax checking)
        // Monaco doesn't have built-in Python validation, but we can add markers
        // For full Python linting, you'd need a language server
        monaco.languages.setLanguageConfiguration("python", {
          comments: {
            lineComment: "#",
            blockComment: ['"""', '"""'],
          },
          brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
          ],
          autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        });
      }

      // Listen for model changes to show validation markers
      model.onDidChangeContent(() => {
        // Basic validation - check for common syntax errors
        // For production, consider integrating a language server
        const value = model.getValue();
        const errors: editor.IMarkerData[] = [];

        // Basic Python syntax checks
        if (language === "python") {
          const lines = value.split("\n");
          lines.forEach((line, index) => {
            const lineNumber = index + 1;
            
            // Check for unmatched quotes
            const singleQuotes = (line.match(/'/g) || []).length;
            const doubleQuotes = (line.match(/"/g) || []).length;
            
            if (singleQuotes % 2 !== 0 && !line.includes("'''")) {
              errors.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: line.length + 1,
                message: "Unmatched single quote",
              });
            }
            
            if (doubleQuotes % 2 !== 0 && !line.includes('"""')) {
              errors.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: line.length + 1,
                message: "Unmatched double quote",
              });
            }

            // Check for common indentation issues (basic)
            if (line.trim() && !line.startsWith(" ") && !line.startsWith("\t") && index > 0) {
              const prevLine = lines[index - 1];
              if (prevLine.trim().endsWith(":") && line.trim()) {
                // This might need indentation
                // We'll let Python runtime catch this, but we can warn
              }
            }
          });
        }

        // Set markers (errors/warnings)
        if (errors.length > 0) {
          monaco.editor.setModelMarkers(model, "syntax-checker", errors);
        } else {
          monaco.editor.setModelMarkers(model, "syntax-checker", []);
        }
      });
    }

    // Track cursor position for collaboration
    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });
    }

    // Track content changes for collaboration
    if (onCollaborationUpdate) {
      editor.onDidChangeModelContent(() => {
        const content = editor.getValue();
        onCollaborationUpdate(content, language);
      });
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  const handleFindClick = () => {
    if (editorRef.current) {
      editorRef.current.getAction("actions.find")?.run();
      setShowFindWidget(true);
    }
  };

  const handleFindReplaceClick = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.startFindReplaceAction")?.run();
      setShowFindWidget(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center gap-4">
          <label
            htmlFor="language-select"
            className="text-sm font-medium text-gray-700"
          >
            Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={readOnly}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFindClick}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
            title="Find (Ctrl+F / Cmd+F)"
            disabled={readOnly}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Find
          </button>
          <button
            onClick={handleFindReplaceClick}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
            title="Find & Replace (Ctrl+H / Cmd+H)"
            disabled={readOnly}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Replace
          </button>
          {readOnly && <span className="text-xs text-gray-500">Read-only</span>}
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height={height}
          language={
            LANGUAGE_OPTIONS.find((opt) => opt.value === language)?.monaco ||
            language
          }
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}

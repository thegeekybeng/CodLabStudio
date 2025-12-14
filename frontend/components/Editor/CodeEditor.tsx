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
  hideToolbar?: boolean;
  breakpoints?: number[];
  onBreakpointToggle?: (line: number) => void;
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
  hideToolbar = false,
  breakpoints = [],
  onBreakpointToggle
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const [showFindWidget, setShowFindWidget] = useState(false);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      lineNumbers: "on",
      glyphMargin: true,
      renderWhitespace: "selection",
      tabSize: 2,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      wordBasedSuggestions: "matchingDocuments",
      renderValidationDecorations: "on",
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: "never",
        seedSearchStringFromSelection: "always",
      },
    });

    const KeyMod = monaco.KeyMod;
    const KeyCode = monaco.KeyCode;
    
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyF, () => {
      editor.getAction("actions.find")?.run();
      setShowFindWidget(true);
    });

    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyH, () => {
      editor.getAction("editor.action.startFindReplaceAction")?.run();
      setShowFindWidget(true);
    });

    editor.addCommand(KeyCode.Escape, () => {
      editor.getAction("closeFindWidget")?.run();
      setShowFindWidget(false);
    });

    const model = editor.getModel();
    if (model) {
      const language = model.getLanguageId();
      if (language === "python") {
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

      model.onDidChangeContent(() => {
        const value = model.getValue();
        const errors: editor.IMarkerData[] = [];

        if (language === "python") {
          const lines = value.split("\n");
          lines.forEach((line, index) => {
            const lineNumber = index + 1;
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
          });
        }

        if (errors.length > 0) {
          monaco.editor.setModelMarkers(model, "syntax-checker", errors);
        } else {
          monaco.editor.setModelMarkers(model, "syntax-checker", []);
        }
      });
    }

    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });
    }

    if (onCollaborationUpdate) {
      editor.onDidChangeModelContent(() => {
        const content = editor.getValue();
        onCollaborationUpdate(content, language);
      });
    }

    // Breakpoint Click Listener
    if (onBreakpointToggle) {
        editor.onMouseDown((e) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                const line = e.target.position?.lineNumber;
                if (line) {
                    onBreakpointToggle(line);
                }
            }
        });
    }
  };

  // Decoration Update Effect
  useEffect(() => {
      if (!editorRef.current || !monacoRef.current) return;
      
      const editor = editorRef.current;
      const monaco = monacoRef.current;

      const decorations = breakpoints.map(line => ({
          range: new monaco.Range(line, 1, line, 1),
          options: {
              isWholeLine: false,
              glyphMarginClassName: 'debug-breakpoint-glyph',
              glyphMarginHoverMessage: { value: 'Breakpoint' }
          }
      }));

      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
  }, [breakpoints]);

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
    <div className={`w-full h-full flex flex-col overflow-hidden ${!hideToolbar ? 'border border-gray-300 rounded-lg' : ''}`}>
      {!hideToolbar && (
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
          <div className="flex items-center gap-4">
            <label htmlFor="language-select" className="text-sm font-medium text-gray-700">Language:</label>
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
            <button onClick={handleFindClick} className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" title="Find (Ctrl+F)">Find</button>
            <button onClick={handleFindReplaceClick} className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" title="Replace (Ctrl+H)">Replace</button>
          </div>
        </div>
      )}
      <div className="flex-1">
        <Editor
          height={height}
          language={LANGUAGE_OPTIONS.find((opt) => opt.value === language)?.monaco || language}
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

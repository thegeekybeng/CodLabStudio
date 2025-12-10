"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  content: React.ReactNode;
  example?: React.ReactNode;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to CodLabStudio",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-xl text-gray-900 mb-2">CodLabStudio</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Pronunciation:</strong> "Colab Studio" (phonetic wordplay)
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Meaning:</strong> Collaborative Code Execution Studio
            </p>
            <p className="text-xs text-gray-600 italic">
              The name "CodLab" sounds like "Colab" (collaboration) - reflecting our vision of collaborative coding where teams work together in real-time.
            </p>
          </div>
          <p className="text-lg text-gray-700">
            CodLabStudio is a powerful code execution platform that supports 30+ programming languages. 
            While we currently provide robust code execution capabilities, our primary focus is building the future of <strong>collaborative coding</strong>.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you can do:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Write and execute code in multiple languages</li>
              <li>Debug your code with breakpoints and step-through</li>
              <li>Install and use packages/libraries</li>
              <li>Save your work locally</li>
              <li>Download complete session data as ZIP</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Important:</strong> This is a guest session. Your data is temporary and will be cleared at session end.
            Make sure to download your work before closing the browser!
          </p>
        </div>
      ),
    },
    {
      id: "notebook",
      title: "Using the Notebook",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            The notebook editor supports syntax highlighting (color-coding), error detection, auto-completion, and real-time code execution.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">✨ Editor Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
              <li><strong>Syntax Highlighting:</strong> Code is color-coded for better readability (keywords, strings, comments in different colors)</li>
              <li><strong>Error Detection:</strong> The editor detects and highlights syntax errors (unmatched quotes, brackets, etc.)</li>
              <li><strong>Runtime Errors:</strong> When you execute code, any errors will be shown in the output panel with detailed error messages</li>
              <li><strong>Auto-completion:</strong> Get code suggestions and completions as you type</li>
              <li><strong>Find & Replace:</strong> Press Ctrl+F (Cmd+F on Mac) to find text, or Ctrl+H for find and replace</li>
              <li><strong>Line Numbers:</strong> Easy navigation and reference</li>
            </ul>
            <p className="text-xs text-green-700 mt-2">
              <strong>Note:</strong> For TypeScript/JavaScript, the editor provides full error detection. 
              For other languages, basic syntax checking is available, and full error details appear when you execute the code.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Try this example:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`# Python example
def greet(name):
    return f"Hello, {name}!"

# Call the function
result = greet("CodLabStudio")
print(result)

# Calculate something
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum: {total}")`}
            </pre>
            <p className="text-sm text-gray-600 mt-2">
              Select "Python" as the language, paste this code, and click "Execute" to see the results!
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
              <li>Choose the correct language from the dropdown</li>
              <li>Code executes in isolated Docker containers for security</li>
              <li>You can write code in multiple languages in the same session</li>
              <li>Execution results appear in real-time</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "debugging",
      title: "Debugging Your Code",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Use the built-in debugger to step through your code, set breakpoints, and inspect variables.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to debug:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Write your code in the editor</li>
              <li>Click on the "Debug" tab</li>
              <li>Set breakpoints by clicking line numbers</li>
              <li>Click "Start Debug Session"</li>
              <li>Use step controls:
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>Step Over:</strong> Execute current line</li>
                  <li><strong>Step Into:</strong> Enter function calls</li>
                  <li><strong>Step Out:</strong> Exit current function</li>
                  <li><strong>Continue:</strong> Resume execution</li>
                </ul>
              </li>
              <li>Inspect variables and call stack in the debug panel</li>
            </ol>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Example debug session:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`def calculate_factorial(n):
    if n <= 1:
        return 1
    else:
        return n * calculate_factorial(n - 1)

# Set breakpoint on line 2
result = calculate_factorial(5)
print(f"Factorial of 5: {result}")`}
            </pre>
            <p className="text-sm text-purple-800 mt-2">
              Set a breakpoint on line 2, start debugging, and step through to see how the recursion works!
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Debugging is currently supported for Python and JavaScript/Node.js.
              More languages coming soon!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "packages",
      title: "Installing and Using Packages",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Install packages and libraries to extend functionality. Each language has its own package manager.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">When to use packages:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>You need functionality not in the standard library</li>
              <li>You want to use popular libraries (e.g., numpy, pandas for Python)</li>
              <li>You're working with specific frameworks or tools</li>
              <li>You need to import external modules</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">How to install packages:</h3>
            <ol className="list-decimal list-inside space-y-2 text-green-800">
              <li>Click on the "Packages" tab in the notebook</li>
              <li>Select your language from the dropdown</li>
              <li>Enter the package name (e.g., "numpy" for Python, "lodash" for Node.js)</li>
              <li>Click "Install Package"</li>
              <li>Wait for installation to complete</li>
              <li>Use the package in your code!</li>
            </ol>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Example - Python with NumPy:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`# First, install numpy via Packages tab
# Then use it in your code:

import numpy as np

# Create arrays
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([6, 7, 8, 9, 10])

# Perform operations
result = arr1 + arr2
print("Sum:", result)
print("Mean:", np.mean(result))`}
            </pre>
            <p className="text-sm text-yellow-800 mt-2">
              <strong>Package Managers by Language:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-1">
              <li>Python: pip (e.g., "numpy", "pandas", "requests")</li>
              <li>Node.js: npm (e.g., "lodash", "axios", "express")</li>
              <li>Java: Maven (e.g., "org.json:json:20231013")</li>
              <li>Go: go get (e.g., "github.com/gin-gonic/gin")</li>
              <li>Rust: cargo (e.g., "serde", "tokio")</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Important:</strong> Packages are installed per-execution. 
              If you need a package, install it before running code that uses it.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "saving",
      title: "Saving Your Work",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Since this is a guest session, your work is not permanently saved. You need to save it locally.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to save your code:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click the "Save As" button in the notebook editor</li>
              <li>Select your preferred file format:
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>Text file (.txt) - Plain text</li>
                  <li>Language-specific (e.g., .py, .js, .java)</li>
                  <li>Markdown (.md) - For documentation</li>
                  <li>JSON (.json) - For structured data</li>
                </ul>
              </li>
              <li>The file will download to your computer</li>
              <li>Save it in a location you'll remember!</li>
            </ol>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Best Practices:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>Save your code frequently as you work</li>
              <li>Use descriptive filenames</li>
              <li>Choose the appropriate file format for your content</li>
              <li>Keep backups of important work</li>
            </ul>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Remember:</strong> Guest sessions are temporary. 
              Once you close the browser, your session data will be cleared.
              Always download your work before ending the session!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "future-features",
      title: "Coming Soon - Future Features",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            We're continuously improving CodLabStudio. Here are some exciting features coming soon:
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">🚧 Future Features:</h3>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-semibold">🎯 Real-Time Collaboration (Primary Feature):</span>
                <span className="text-sm">
                  Work together with others in real-time. See cursors, edits, and collaborate on code simultaneously. 
                  This is our <strong>main focus</strong> - the code is already implemented and will be the primary differentiator. 
                  <em className="text-blue-600"> (Code implemented, awaiting user registration system)</em>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">Enhanced Execution History:</span>
                <span className="text-sm">
                  Visual timeline of all executions with advanced filtering and search capabilities.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">Package Search:</span>
                <span className="text-sm">
                  Search and discover packages directly from package registries (PyPI, npm, Maven, etc.) before installing.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">Advanced Monitoring:</span>
                <span className="text-sm">
                  Performance dashboards, usage metrics, and detailed analytics for your code execution.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">Git Remote Configuration:</span>
                <span className="text-sm">
                  UI for configuring Git remotes, managing branches, and advanced Git workflows.
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Note:</strong> Some features like collaboration have code already implemented but are not yet production-ready. 
              They require additional infrastructure (user registration, persistent notebooks) and will be enabled in future releases.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "session-export",
      title: "End of Session - Download Everything",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            At the end of your session, download a comprehensive ZIP file containing all your work.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">What's included in the session ZIP:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>All your code files</strong> - Every notebook and code snippet</li>
              <li><strong>Execution results</strong> - stdout, stderr, and execution metadata</li>
              <li><strong>Debug sessions</strong> - Breakpoints, variables, and call stacks</li>
              <li><strong>Activity logs</strong> - Complete session activity history</li>
              <li><strong>Metadata</strong> - Timestamps, languages used, and more</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">How to download:</h3>
            <ol className="list-decimal list-inside space-y-2 text-green-800">
              <li>Click the "Download Session" button (available on Dashboard and Notebook pages)</li>
              <li>Wait for the ZIP file to generate</li>
              <li>The file will automatically download to your computer</li>
              <li>Extract the ZIP to access all your session data</li>
            </ol>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ZIP File Structure:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs mt-2">
{`session_export_YYYY-MM-DD.zip
├── README.txt              # Overview
├── SESSION_SUMMARY.txt     # Session summary
├── code/                   # Your source code
│   ├── notebook_1.py
│   └── notebook_2.js
├── executions/             # Execution results
│   └── execution_1_abc12345/
│       ├── source.py
│       ├── stdout.txt
│       └── metadata.json
├── debug/                  # Debug sessions
│   └── session_1_xyz67890/
│       └── debug_data.json
└── logs/                   # Activity logs
    └── activity_log.jsonl`}
            </pre>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Critical:</strong> We do NOT keep any of your data after the session ends.
              The ZIP file is your only copy. Make sure to download it before closing your browser!
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> Download the session ZIP periodically during long sessions
              to ensure you don't lose your work.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed
      sessionStorage.setItem("onboardingCompleted", "true");
      router.push("/dashboard");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("onboardingCompleted", "true");
    router.push("/dashboard");
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </h2>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip Tour
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {currentStepData.title}
          </h1>

          <div className="prose max-w-none">
            {currentStepData.content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                currentStep === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Previous
            </button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-primary-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out the{" "}
            <Link href="/dashboard" className="text-primary-600 hover:underline">
              Dashboard
            </Link>
            {" "}or start using the{" "}
            <Link href="/notebook" className="text-primary-600 hover:underline">
              Notebook
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


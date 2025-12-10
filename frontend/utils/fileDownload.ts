/**
 * Utility functions for downloading files
 */

export interface FileType {
  extension: string;
  mimeType: string;
  label: string;
}

export const FILE_TYPES: FileType[] = [
  { extension: 'txt', mimeType: 'text/plain', label: 'Text File (.txt)' },
  { extension: 'md', mimeType: 'text/markdown', label: 'Markdown (.md)' },
  { extension: 'py', mimeType: 'text/x-python', label: 'Python (.py)' },
  { extension: 'js', mimeType: 'text/javascript', label: 'JavaScript (.js)' },
  { extension: 'ts', mimeType: 'text/typescript', label: 'TypeScript (.ts)' },
  { extension: 'java', mimeType: 'text/x-java-source', label: 'Java (.java)' },
  { extension: 'cpp', mimeType: 'text/x-c++src', label: 'C++ (.cpp)' },
  { extension: 'c', mimeType: 'text/x-csrc', label: 'C (.c)' },
  { extension: 'go', mimeType: 'text/x-go', label: 'Go (.go)' },
  { extension: 'rs', mimeType: 'text/x-rust', label: 'Rust (.rs)' },
  { extension: 'rb', mimeType: 'text/x-ruby', label: 'Ruby (.rb)' },
  { extension: 'php', mimeType: 'text/x-php', label: 'PHP (.php)' },
  { extension: 'swift', mimeType: 'text/x-swift', label: 'Swift (.swift)' },
  { extension: 'kt', mimeType: 'text/x-kotlin', label: 'Kotlin (.kt)' },
  { extension: 'scala', mimeType: 'text/x-scala', label: 'Scala (.scala)' },
  { extension: 'r', mimeType: 'text/x-r', label: 'R (.r)' },
  { extension: 'jl', mimeType: 'text/x-julia', label: 'Julia (.jl)' },
  { extension: 'pl', mimeType: 'text/x-perl', label: 'Perl (.pl)' },
  { extension: 'sh', mimeType: 'text/x-shellscript', label: 'Bash (.sh)' },
  { extension: 'sql', mimeType: 'text/x-sql', label: 'SQL (.sql)' },
  { extension: 'json', mimeType: 'application/json', label: 'JSON (.json)' },
  { extension: 'xml', mimeType: 'application/xml', label: 'XML (.xml)' },
  { extension: 'html', mimeType: 'text/html', label: 'HTML (.html)' },
  { extension: 'css', mimeType: 'text/css', label: 'CSS (.css)' },
];

/**
 * Get file type based on language
 */
export function getFileTypeForLanguage(language: string): FileType {
  const languageMap: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rs',
    ruby: 'rb',
    php: 'php',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala',
    r: 'r',
    julia: 'jl',
    perl: 'pl',
    bash: 'sh',
    sql: 'sql',
  };

  // Extract base language (remove version numbers)
  const baseLanguage = language.replace(/[0-9.]+/g, '').toLowerCase();
  const extension = languageMap[baseLanguage] || 'txt';

  return FILE_TYPES.find(ft => ft.extension === extension) || FILE_TYPES[0];
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  fileType: FileType
): void {
  const blob = new Blob([content], { type: fileType.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${fileType.extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prompt user to save file with custom filename and type
 */
export function saveFileAs(
  content: string,
  defaultFilename: string,
  defaultFileType?: FileType
): void {
  // For now, use browser's download with default type
  // In future, could show a modal to select file type
  const fileType = defaultFileType || FILE_TYPES[0];
  downloadFile(content, defaultFilename, fileType);
}


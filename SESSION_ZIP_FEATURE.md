# Session Zip Download Feature

## Overview

Users can download all their session data as a ZIP file containing code, execution results, debug logs, and activity logs.

## Implementation

### Backend

**Service**: `backend/src/services/session/sessionZipService.ts`
- Collects all session data (code, executions, debug, logs)
- Generates ZIP file on-the-fly using `archiver`
- Supports both authenticated users and guest sessions

**Route**: `GET /api/session/download`
- Works for authenticated users (by userId)
- Works for guest sessions (by guestSessionId)
- Returns ZIP file as download

**What's Included in ZIP**:
- `code/` - All source code files (notebooks)
- `executions/` - Execution results (stdout, stderr, metadata)
- `debug/` - Debug session data
- `logs/` - Activity and audit logs
- `README.txt` - Session overview
- `SESSION_SUMMARY.txt` - Session summary

### Frontend

**Component**: `frontend/components/Session/DownloadSessionButton.tsx`
- Button to trigger download
- Shows loading state while generating
- Handles errors gracefully

**Integration**:
- Added to Dashboard page (for all users)
- Added to Notebook page (for all users)
- Available for both authenticated and guest users

**API Client**: `frontend/lib/session.ts`
- `downloadSessionZip()` - Downloads ZIP file
- `getSessionStats()` - Gets session statistics

## Usage

1. User clicks "Download Session" button
2. Backend collects all session data
3. Generates ZIP file
4. Browser downloads ZIP file
5. User gets complete session export

## Guest Session Support

For guest sessions:
- Executions are stored with `userId = guest_${sessionId}`
- Execution results are also logged to audit logs
- ZIP includes all executions from the session
- Activity logs filtered by sessionId

## File Structure

```
session_export_YYYY-MM-DD.zip
├── README.txt
├── SESSION_SUMMARY.txt
├── code/
│   ├── README.txt
│   ├── notebook_1.py
│   ├── notebook_1_metadata.json
│   └── ...
├── executions/
│   ├── README.txt
│   ├── execution_1_abc12345/
│   │   ├── source.py
│   │   ├── stdout.txt
│   │   ├── stderr.txt
│   │   └── metadata.json
│   └── ...
├── debug/
│   ├── README.txt
│   ├── session_1_xyz67890/
│   │   └── debug_data.json
│   └── ...
└── logs/
    ├── README.txt
    └── activity_log.jsonl
```

## Dependencies

- `archiver` - ZIP file generation
- `@types/archiver` - TypeScript types

## Notes

- ZIP files are generated on-demand (not stored)
- Maximum compression used
- Large sessions may take time to generate
- Guest session data is temporary (cleared at session end)


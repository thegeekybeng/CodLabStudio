# Implementation Plan Update - User Requirements

## Issues to Address

### 1. Admin Login Not Working
**Problem**: Password verification failing
**Solution**: 
- Add password reset utility
- Verify bcrypt hashing/verification
- Add debug logging for login attempts
- Create test script to verify admin credentials

### 2. File Save/Download for Guest Sessions
**Requirement**: Save notebook content as file type of user's choice on their device
**Implementation**:
- Add "Save As" button in notebook editor
- Support multiple file formats (txt, md, py, js, json, etc.)
- Client-side download (no server storage for guests)
- File type selection dropdown

### 3. Downloadable Zip with Code/Test/Debug/Logs/Output
**Requirement**: Generate zip file with all execution artifacts
**Implementation**:
- Backend endpoint to collect all artifacts for a session
- Include: source code, test results, debug logs, execution output, error logs
- Generate zip file on-the-fly
- Download via browser

### 4. Per-Session Usage Monitoring
**Requirement**: Track guest session usage
**Current State**: Audit logs exist but not tracking guest sessions
**Implementation**:
- Create guest session ID on guest mode entry
- Log all actions with session ID (not userId)
- Track: code executions, file operations, time spent
- Store in audit_logs with userId=null, sessionId in details

### 5. Remove Login, Add EUA (End User Agreement)
**Requirement**: Replace login with EUA checkboxes
**EUA Requirements**:
- AI usage governance
- Responsible AI use
- Advisory about intended use only
**Implementation**:
- Remove login page
- Create EUA page with checkboxes
- Store EUA acceptance in session storage
- Redirect to onboarding after acceptance

### 6. Onboarding Process
**Requirement**: Guide users through each section
**Implementation**:
- Multi-step onboarding flow
- Explain: Editor, Execution, Debug, Packages, Git
- Interactive tooltips/highlights
- Skip option for returning users
- Store completion in session storage

## Implementation Order

1. Fix admin login (critical)
2. Add guest session tracking
3. Implement file save/download
4. Add zip download feature
5. Replace login with EUA
6. Create onboarding flow


# User Requirements Summary

## 1. Admin Login Issue
**Status**: Investigating
**Action**: 
- Add password verification utility
- Check if admin user exists and password hash is correct
- Add debug logging for login attempts

## 2. File Save/Download for Guests
**Requirement**: Save notebook content as file type of user's choice on their device
**Implementation**: Client-side download, no server storage

## 3. Downloadable Zip Feature
**Requirement**: Generate zip with code/test/debug/logs/output
**Implementation**: Backend endpoint to collect all artifacts and generate zip

## 4. Per-Session Usage Monitoring
**Current**: Audit logs exist but not tracking guest sessions
**Requirement**: Track guest session usage
**Implementation**: Create session ID, log all actions with sessionId

## 5. Remove Login, Add EUA
**Requirement**: Replace login with End User Agreement checkboxes
**EUA Topics**:
- AI usage governance
- Responsible AI use  
- Advisory about intended use only

## 6. Onboarding Process
**Requirement**: Guide users through each section
**Sections**: Editor, Execution, Debug, Packages, Git


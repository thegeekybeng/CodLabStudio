-- Complete database schema for CodLabStudio
-- This script creates all tables, enums, and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'AUDITOR');
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT');
CREATE TYPE "DebugSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');
CREATE TYPE "AuditActionType" AS ENUM (
  'LOGIN',
  'LOGOUT',
  'CREATE_NOTEBOOK',
  'UPDATE_NOTEBOOK',
  'DELETE_NOTEBOOK',
  'EXECUTE_CODE',
  'START_DEBUG',
  'STOP_DEBUG',
  'UPLOAD_FILE',
  'DELETE_FILE',
  'UPDATE_PROFILE',
  'CHANGE_PASSWORD'
);

-- Create users table
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_login" TIMESTAMP(3)
);

-- Create notebooks table
CREATE TABLE "notebooks" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "language" VARCHAR(50) NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notebooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create executions table
CREATE TABLE "executions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "notebook_id" UUID,
  "user_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "language" VARCHAR(50) NOT NULL,
  "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "stdout" TEXT,
  "stderr" TEXT,
  "exit_code" INTEGER,
  "execution_time_ms" INTEGER,
  "resource_usage" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "executions_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE SET NULL,
  CONSTRAINT "executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create debug_sessions table
CREATE TABLE "debug_sessions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "notebook_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "breakpoints" JSONB DEFAULT '[]',
  "current_line" INTEGER,
  "variables" JSONB DEFAULT '{}',
  "call_stack" JSONB DEFAULT '[]',
  "status" "DebugSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "debug_sessions_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE CASCADE,
  CONSTRAINT "debug_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create files table
CREATE TABLE "files" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "notebook_id" UUID,
  "filename" VARCHAR(255) NOT NULL,
  "filepath" VARCHAR(500) NOT NULL,
  "content_type" VARCHAR(100) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "content" BYTEA,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "files_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE SET NULL
);

-- Create audit_logs table
CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID,
  "action_type" "AuditActionType" NOT NULL,
  "resource_type" VARCHAR(100),
  "resource_id" VARCHAR(255),
  "details" JSONB DEFAULT '{}',
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Create indexes for notebooks
CREATE INDEX IF NOT EXISTS "notebooks_user_id_idx" ON "notebooks"("user_id");
CREATE INDEX IF NOT EXISTS "notebooks_language_idx" ON "notebooks"("language");
CREATE INDEX IF NOT EXISTS "notebooks_created_at_idx" ON "notebooks"("created_at");

-- Create indexes for executions
CREATE INDEX IF NOT EXISTS "executions_notebook_id_idx" ON "executions"("notebook_id");
CREATE INDEX IF NOT EXISTS "executions_user_id_idx" ON "executions"("user_id");
CREATE INDEX IF NOT EXISTS "executions_status_idx" ON "executions"("status");
CREATE INDEX IF NOT EXISTS "executions_created_at_idx" ON "executions"("created_at");

-- Create indexes for debug_sessions
CREATE INDEX IF NOT EXISTS "debug_sessions_notebook_id_idx" ON "debug_sessions"("notebook_id");
CREATE INDEX IF NOT EXISTS "debug_sessions_user_id_idx" ON "debug_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "debug_sessions_status_idx" ON "debug_sessions"("status");

-- Create indexes for files
CREATE INDEX IF NOT EXISTS "files_user_id_idx" ON "files"("user_id");
CREATE INDEX IF NOT EXISTS "files_notebook_id_idx" ON "files"("notebook_id");
CREATE INDEX IF NOT EXISTS "files_filepath_idx" ON "files"("filepath");

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_type_idx" ON "audit_logs"("action_type");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON "notebooks"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debug_sessions_updated_at BEFORE UPDATE ON "debug_sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON "files"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


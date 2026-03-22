-- Migration: extend_point_action
-- Adds LEVEL_UP to the PointAction enum.
-- Note: PostgreSQL preserves the insertion order of enum values;
-- the value will appear after existing values in the database regardless
-- of its position in the Prisma schema file.

ALTER TYPE "PointAction" ADD VALUE IF NOT EXISTS 'LEVEL_UP';

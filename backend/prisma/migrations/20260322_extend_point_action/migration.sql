-- Migration: extend_point_action
-- Adds LEVEL_UP to the PointAction enum and reorders values for semantic clarity.

ALTER TYPE "PointAction" ADD VALUE IF NOT EXISTS 'LEVEL_UP';

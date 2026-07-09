-- Migration: add brand column to epp_delivery_items and worker_epp_assignments
-- Run in Supabase SQL Editor

ALTER TABLE epp_delivery_items
  ADD COLUMN IF NOT EXISTS brand TEXT;

ALTER TABLE worker_epp_assignments
  ADD COLUMN IF NOT EXISTS brand TEXT;

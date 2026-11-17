-- Freeze reviewed assessment details when publishing a report. Existing report
-- data is preserved; historical cards retain their original stored aggregates.
ALTER TABLE "report_cards" ADD COLUMN "gradeSnapshot" JSONB;

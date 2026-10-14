-- Composite indexes for the duplicate-submission guard and the most common
-- chronological filters in the inquiry administration and reporting APIs.
CREATE INDEX "inquiries_email_createdAt_idx" ON "inquiries"("email", "createdAt");
CREATE INDEX "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");
CREATE INDEX "inquiries_pageLanguage_createdAt_idx" ON "inquiries"("pageLanguage", "createdAt");
CREATE INDEX "inquiries_sourcePage_createdAt_idx" ON "inquiries"("sourcePage", "createdAt");

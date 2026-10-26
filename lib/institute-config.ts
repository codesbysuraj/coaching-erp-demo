/**
 * Centralized Institute Configuration
 *
 * To rebrand for a new coaching institute, update these values.
 * Keep server-side secrets in .env — never expose DB credentials here.
 */

export const INSTITUTE_CONFIG = {
  /** Full display name, used in headings, PDF reports, receipts */
  INSTITUTE_NAME: "Bright Future Academy",

  /** Short name for compact displays */
  INSTITUTE_SHORT_NAME: "Bright Future",

  /** Tagline shown on login screens and About sections */
  INSTITUTE_TAGLINE: "Smart Coaching Institute Management",

  /** Demo contact details — replace with real data per client */
  INSTITUTE_EMAIL: "demo@brightfuture.example",
  INSTITUTE_PHONE: "9000000000",
  INSTITUTE_ADDRESS: "Demo Campus, Mumbai, Maharashtra",
  INSTITUTE_WEBSITE: "https://example.com",

  /** Used in browser tab titles */
  INSTITUTE_PAGE_TITLE: "Bright Future Academy – Student Management System",

  /** Copyright year is generated dynamically; this is the entity name */
  INSTITUTE_COPYRIGHT_NAME: "Bright Future Academy",
} as const;

export type InstituteConfig = typeof INSTITUTE_CONFIG;

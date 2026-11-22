import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const STATUSES = ["pending", "yes", "no", "maybe"] as const;
export type Status = (typeof STATUSES)[number];

// One row per invited person. Their RSVP lives on the same row.
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey(),
  // Unguessable secret used in the guest's personal link and browser cookie.
  token: text("token").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull().unique(),
  status: text("status").$type<Status>().notNull().default("pending"),
  // Names of the extra people this guest is bringing.
  additionalGuests: jsonb("additional_guests").$type<string[]>().notNull().default([]),
  note: text("note").notNull().default(""),
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Guest = typeof guests.$inferSelect;

// Kept in sync with the table above by hand; run on first query so there is no
// separate migration step to remember.
export const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  additional_guests jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text NOT NULL DEFAULT '',
  invited_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`;

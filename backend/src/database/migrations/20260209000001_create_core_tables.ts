/**
 * Migration 000 — Core Platform Tables
 * CBC Learning Ecosystem
 *
 * Creates all tables referenced by FK constraints in later migrations.
 * Timestamp 20260209000001 ensures this runs AFTER the users table
 * (20260209000000_create_users_table.ts).
 *
 * Tables: teachers, parents, classes, competencies,
 *         notifications, audit_log
 *
 * NOTE: assessments and fee_payments are created in
 * 20260209000005_create_assessments_and_payments.ts, after the students
 * table exists (20260209000003_create_enhanced_students_table.ts).
 */

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Enable extensions used by performance indexes migration
  await knex.raw("CREATE EXTENSION IF NOT EXISTS pg_trgm");
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // ─── TEACHERS ─────────────────────────────────────────────────────────────
  await knex.schema.createTable("teachers", (table) => {
    table.increments("id").primary();
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("school_id")
      .notNullable()
      .references("id")
      .inTable("schools")
      .onDelete("CASCADE");

    table.string("tsc_number", 50).nullable();
    table.string("national_id", 20).nullable();
    table
      .enum("employment_type", ["permanent", "temporary", "bom", "intern"])
      .defaultTo("permanent");
    table.string("qualification", 50).nullable();
    table.string("specialization", 100).nullable();
    table.integer("years_of_experience").defaultTo(0);
    table.json("subjects_taught").nullable();
    table.json("grade_levels").nullable();
    table.string("phone_number", 20).nullable();
    table.string("email", 255).nullable();
    table.boolean("is_class_teacher").defaultTo(false);
    table.boolean("is_active").defaultTo(true);

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    table.index("user_id");
    table.index("school_id");
    table.index("phone_number");
    table.index("email");
  });

  // ─── PARENTS ──────────────────────────────────────────────────────────────
  await knex.schema.createTable("parents", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("national_id", 20).nullable();
    table.string("phone_number", 20).notNullable();
    table.string("alt_phone_number", 20).nullable();
    table.string("email", 255).nullable();
    table.string("occupation", 100).nullable();
    table.string("county", 100).nullable();
    table.string("mpesa_phone", 20).nullable();
    table
      .enum("relationship_type", [
        "father",
        "mother",
        "guardian",
        "grandparent",
        "sibling",
        "other",
      ])
      .defaultTo("guardian");

    table.boolean("is_primary_contact").defaultTo(true);
    table.boolean("receives_sms_alerts").defaultTo(true);
    table.boolean("receives_email_alerts").defaultTo(false);
    table.boolean("is_active").defaultTo(true);

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    table.index("user_id");
    table.index("phone_number");
    table.index("email");
  });

  // ─── CLASSES ──────────────────────────────────────────────────────────────
  await knex.schema.createTable("classes", (table) => {
    table.increments("id").primary();
    table
      .integer("school_id")
      .notNullable()
      .references("id")
      .inTable("schools")
      .onDelete("CASCADE");
    table
      .integer("teacher_id")
      .nullable()
      .references("id")
      .inTable("teachers")
      .onDelete("SET NULL");

    table.string("name", 100).notNullable();
    table.string("grade_level", 20).notNullable();
    table.string("stream", 20).nullable();
    table
      .integer("academic_year")
      .notNullable()
      .defaultTo(new Date().getFullYear());
    table.enum("term", ["1", "2", "3"]).notNullable().defaultTo("1");
    table.integer("capacity").defaultTo(40);
    table.integer("enrolled_count").defaultTo(0);
    table.json("subjects").nullable();
    table.boolean("is_active").defaultTo(true);

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    table.index("school_id");
    table.index("teacher_id");
    table.index(["school_id", "grade_level"]);
  });

  // ─── CBC COMPETENCIES (seeded) ────────────────────────────────────────────
  await knex.schema.createTable("competencies", (table) => {
    table.increments("id").primary();
    table.string("code", 20).unique().notNullable();
    table.string("name", 255).notNullable();
    table.string("short_name", 50).notNullable();
    table.text("description").nullable();
    table.enum("category", ["core", "subject_specific"]).defaultTo("core");
    table.integer("display_order").defaultTo(0);
    table.boolean("is_active").defaultTo(true);
  });

  await knex("competencies").insert([
    {
      code: "CC",
      short_name: "Communication",
      name: "Communication and Collaboration",
      display_order: 1,
    },
    {
      code: "CT",
      short_name: "Critical Thinking",
      name: "Critical Thinking and Problem Solving",
      display_order: 2,
    },
    {
      code: "IC",
      short_name: "Imagination",
      name: "Imagination and Creativity",
      display_order: 3,
    },
    {
      code: "LCT",
      short_name: "Digital Literacy",
      name: "Learning and Digital Literacy",
      display_order: 4,
    },
    {
      code: "SS",
      short_name: "Self-Efficacy",
      name: "Self-Efficacy",
      display_order: 5,
    },
    {
      code: "SD",
      short_name: "Social Dev",
      name: "Social Development and Responsibility",
      display_order: 6,
    },
    {
      code: "CS",
      short_name: "Citizenship",
      name: "Citizenship",
      display_order: 7,
    },
  ]);

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  await knex.schema.createTable("notifications", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("school_id").nullable();
    table.enum("channel", ["sms", "email", "push", "in_app"]).notNullable();
    table
      .enum("type", [
        "payment_confirmed",
        "payment_failed",
        "fee_reminder",
        "assessment_published",
        "report_ready",
        "system",
      ])
      .notNullable();
    table.string("recipient", 255).notNullable();
    table.text("message").notNullable();
    table.string("subject", 255).nullable();
    table
      .enum("status", ["pending", "sent", "failed", "delivered"])
      .defaultTo("pending");
    table.string("provider_message_id", 255).nullable();
    table.text("error_message").nullable();
    table.integer("retry_count").defaultTo(0);
    table.timestamp("sent_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index("user_id");
    table.index("status");
  });

  // ─── AUDIT LOG (ODPC) ─────────────────────────────────────────────────────
  await knex.schema.createTable("audit_log", (table) => {
    table.bigIncrements("id").primary();
    table
      .integer("user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.integer("school_id").nullable();
    table.string("action", 100).notNullable();
    table.string("entity_type", 50).nullable();
    table.integer("entity_id").nullable();
    table.json("old_values").nullable();
    table.json("new_values").nullable();
    table.json("metadata").nullable();
    table.string("ip_address", 45).nullable();
    table.string("user_agent", 512).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index("user_id");
    table.index("action");
    table.index("created_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  for (const t of [
    "audit_log",
    "notifications",
    "competencies",
    "classes",
    "parents",
    "teachers",
  ]) {
    await knex.schema.dropTableIfExists(t);
  }
}

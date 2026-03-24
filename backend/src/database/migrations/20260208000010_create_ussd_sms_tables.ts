/**
 * Migration: USSD & SMS Infrastructure Tables
 *
 * Creates four tables needed by the USSD and SMS notification services:
 *
 *   sms_queue       — outbound SMS log with status tracking and idempotency
 *   sms_usage       — per-school SMS quota tracking (500 free/term)
 *   parent_messages — messages sent from parents via USSD/SMS to teachers
 *   school_events   — calendar events broadcast to parents via SMS/app
 *
 * Also adds parent_id FK to students table for USSD parent lookup.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {

  // ── sms_queue ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('sms_queue', (t) => {
    t.increments('id').primary();
    t.string('to_phone', 20).notNullable();
    t.text('message').notNullable();
    t.enum('event_type', [
      'attendance_alert',
      'grade_update',
      'fee_reminder',
      'school_event',
      'emergency_alert',
      'payment_confirmation',
      'ussd_reply',
    ]).notNullable();
    t.integer('school_id').references('id').inTable('schools').onDelete('CASCADE');
    t.string('reference_id', 200).notNullable().unique(); // Idempotency key
    t.enum('status', ['pending', 'sent', 'failed', 'rate_limited']).defaultTo('pending');
    t.integer('attempt_count').defaultTo(0);
    t.string('at_message_id', 100);     // Africa's Talking messageId
    t.string('at_cost', 20);            // e.g. "KES 0.50"
    t.text('failure_reason');
    t.timestamp('sent_at');
    t.timestamps(true, true);

    t.index(['school_id', 'status']);
    t.index(['reference_id']);
    t.index(['to_phone', 'event_type']);
    t.index(['created_at']);
  });

  // ── sms_usage ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('sms_usage', (t) => {
    t.increments('id').primary();
    t.integer('school_id').references('id').inTable('schools').onDelete('CASCADE').unique();
    t.integer('sms_sent_this_term').defaultTo(0);
    t.integer('sms_quota').defaultTo(500);      // Tier-based quota
    t.integer('sms_sent_total').defaultTo(0);
    t.date('term_reset_date');                  // When to reset sms_sent_this_term
    t.timestamps(true, true);
  });

  // ── parent_messages ────────────────────────────────────────────────────────
  await knex.schema.createTable('parent_messages', (t) => {
    t.increments('id').primary();
    t.string('parent_phone', 20).notNullable();
    t.integer('student_id').references('id').inTable('students').onDelete('CASCADE');
    t.string('student_name', 200);
    t.string('teacher_name', 200);
    t.text('message').notNullable();
    t.enum('channel', ['ussd', 'sms', 'app', 'whatsapp']).defaultTo('ussd');
    t.enum('status', ['pending', 'delivered', 'read', 'replied']).defaultTo('pending');
    t.text('teacher_reply');
    t.timestamp('replied_at');
    t.timestamps(true, true);

    t.index(['student_id', 'status']);
    t.index(['parent_phone']);
    t.index(['created_at']);
  });

  // ── school_events ──────────────────────────────────────────────────────────
  await knex.schema.createTable('school_events', (t) => {
    t.increments('id').primary();
    t.integer('school_id').references('id').inTable('schools').onDelete('CASCADE');
    t.string('title', 255).notNullable();
    t.text('description');
    t.date('event_date').notNullable();
    t.time('event_time');
    t.enum('type', ['academic', 'sports', 'parents_meeting', 'holiday', 'emergency', 'other']).defaultTo('other');
    t.boolean('sms_sent').defaultTo(false);
    t.integer('created_by').references('id').inTable('users');
    t.timestamps(true, true);

    t.index(['school_id', 'event_date']);
    t.index(['event_date']);
  });

  // ── Add parent_id to students ──────────────────────────────────────────────
  // Enables fast USSD parent → children lookup without phone join
  const hasParentId = await knex.schema.hasColumn('students', 'parent_id');
  if (!hasParentId) {
    await knex.schema.alterTable('students', (t) => {
      t.integer('parent_id').references('id').inTable('users').onDelete('SET NULL').nullable();
      t.index(['parent_id']);
    });
  }

  // ── Add mpesa_shortcode to schools ─────────────────────────────────────────
  const hasShortcode = await knex.schema.hasColumn('schools', 'mpesa_shortcode');
  if (!hasShortcode) {
    await knex.schema.alterTable('schools', (t) => {
      t.string('mpesa_shortcode', 20);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('school_events');
  await knex.schema.dropTableIfExists('parent_messages');
  await knex.schema.dropTableIfExists('sms_usage');
  await knex.schema.dropTableIfExists('sms_queue');

  const hasParentId = await knex.schema.hasColumn('students', 'parent_id');
  if (hasParentId) {
    await knex.schema.alterTable('students', (t) => {
      t.dropColumn('parent_id');
    });
  }
}

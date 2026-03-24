/**
 * Migration — Assessments & Fee Payments Tables
 * CBC Learning Ecosystem
 *
 * Creates assessments and fee_payments tables, plus the payments VIEW.
 * Must run AFTER 20260209000003_create_enhanced_students_table.ts so that
 * the students table exists before these FK references are established.
 *
 * Tables: assessments, fee_payments
 * Views:  payments (compatibility alias over fee_payments)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ─── ASSESSMENTS ──────────────────────────────────────────────────────────
  await knex.schema.createTable('assessments', (table) => {
    table.increments('id').primary();
    table.integer('student_id').notNullable()
      .references('id').inTable('students').onDelete('CASCADE');
    table.integer('teacher_id').nullable()
      .references('id').inTable('teachers').onDelete('SET NULL');
    table.integer('school_id').notNullable()
      .references('id').inTable('schools').onDelete('CASCADE');
    table.integer('competency_id').notNullable()
      .references('id').inTable('competencies').onDelete('RESTRICT');
    table.integer('class_id').nullable()
      .references('id').inTable('classes').onDelete('SET NULL');

    table.enum('performance_level', ['EE','ME','AE','BE']).notNullable();
    table.decimal('score', 5, 2).nullable();
    table.text('notes').nullable();
    table.text('teacher_comment').nullable();
    table.integer('term').notNullable();
    table.integer('year').notNullable().defaultTo(new Date().getFullYear());
    table.enum('assessment_type',
      ['formative','summative','project','portfolio','observation']).defaultTo('formative');
    table.string('subject_code', 20).nullable();
    table.string('strand', 100).nullable();
    table.string('sub_strand', 100).nullable();

    table.timestamp('assessed_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });

  // ─── FEE PAYMENTS ─────────────────────────────────────────────────────────
  await knex.schema.createTable('fee_payments', (table) => {
    table.increments('id').primary();
    table.integer('student_id').notNullable()
      .references('id').inTable('students').onDelete('CASCADE');
    table.integer('school_id').notNullable()
      .references('id').inTable('schools').onDelete('CASCADE');
    table.integer('parent_id').nullable()
      .references('id').inTable('parents').onDelete('SET NULL');

    table.decimal('amount', 10, 2).notNullable();
    table.decimal('fee_balance_before', 10, 2).nullable();
    table.decimal('fee_balance_after', 10, 2).nullable();

    table.enum('payment_method', ['mpesa','bank','cash','cheque']).notNullable();
    table.enum('status', ['pending','completed','failed','reversed']).defaultTo('pending');

    // M-Pesa fields
    table.string('mpesa_transaction_id', 50).nullable();
    table.string('checkout_request_id', 100).nullable();
    table.string('merchant_request_id', 100).nullable();
    table.string('receipt_number', 50).nullable();
    table.string('phone_number', 20).nullable();
    table.string('transaction_id', 100).nullable();

    // Bank fields
    table.string('bank_reference', 100).nullable();
    table.string('bank_name', 100).nullable();

    // Term billing
    table.integer('term').nullable();
    table.integer('academic_year').nullable();
    table.string('fee_type', 50).defaultTo('tuition');
    table.string('account_reference', 100).nullable();

    // Reconciliation
    table.boolean('reconciled').defaultTo(false);
    table.timestamp('reconciled_at').nullable();
    table.integer('reconciled_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL');

    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('student_id');
    table.index('school_id');
    table.index('parent_id');
    table.index('status');
    table.index('checkout_request_id');
    table.index('receipt_number');
    table.index('transaction_id');
    table.index('phone_number');
    table.index('merchant_request_id');
    table.index(['status', 'created_at']);
    table.index(['school_id', 'created_at']);
  });

  // 'payments' VIEW — alias for compatibility with performance indexes migration
  await knex.raw(`
    CREATE VIEW payments AS
    SELECT id, student_id, school_id, parent_id, amount, status,
           payment_method, checkout_request_id, merchant_request_id,
           receipt_number, phone_number, transaction_id, account_reference,
           reconciled, created_at, updated_at
    FROM fee_payments
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS payments');
  await knex.schema.dropTableIfExists('fee_payments');
  await knex.schema.dropTableIfExists('assessments');
}

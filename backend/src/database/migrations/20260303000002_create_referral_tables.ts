import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('school_referral_codes', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().unique().references('id').inTable('schools').onDelete('CASCADE');
    t.string('referral_code', 20).notNullable().unique();
    t.boolean('active').defaultTo(true);
    t.integer('uses_count').defaultTo(0);
    t.timestamps(true, true);
    t.index(['referral_code']);
  });

  await knex.schema.createTable('referrals', (t) => {
    t.increments('id').primary();
    t.integer('referrer_school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.integer('referred_school_id').notNullable().unique().references('id').inTable('schools').onDelete('CASCADE');
    t.string('referral_code', 20).notNullable();
    t.enum('status', ['pending', 'converted', 'expired', 'cancelled']).defaultTo('pending');
    t.enum('reward_type', ['free_month', 'discount', 'cash']).defaultTo('free_month');
    t.decimal('reward_amount', 10, 2).defaultTo(1250);
    t.enum('reward_status', ['pending', 'granted', 'paid']).defaultTo('pending');
    t.timestamp('referred_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('converted_at').nullable();
    t.timestamp('expires_at').notNullable();
    t.timestamps(true, true);
    t.index(['referrer_school_id']);
    t.index(['status']);
  });

  await knex.schema.createTable('referral_log', (t) => {
    t.increments('id').primary();
    t.integer('referral_id').notNullable().references('id').inTable('referrals').onDelete('CASCADE');
    t.string('action', 100).notNullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['referral_id']);
  });

  await knex.schema.createTable('referral_payouts', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.integer('referral_id').notNullable().references('id').inTable('referrals').onDelete('CASCADE');
    t.decimal('amount', 10, 2).notNullable();
    t.enum('status', ['pending', 'processing', 'paid', 'failed']).defaultTo('pending');
    t.string('mpesa_reference', 100).nullable();
    t.timestamp('paid_at').nullable();
    t.timestamps(true, true);
    t.index(['school_id', 'status']);
  });

  await knex.schema.createTable('subscription_credits', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.string('credit_type', 50).notNullable();
    t.decimal('amount', 10, 2).notNullable();
    t.integer('months_credited').defaultTo(0);
    t.integer('referral_id').nullable().references('id').inTable('referrals').onDelete('SET NULL');
    t.timestamp('applied_at').notNullable().defaultTo(knex.fn.now());
    t.timestamps(true, true);
    t.index(['school_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('subscription_credits');
  await knex.schema.dropTableIfExists('referral_payouts');
  await knex.schema.dropTableIfExists('referral_log');
  await knex.schema.dropTableIfExists('referrals');
  await knex.schema.dropTableIfExists('school_referral_codes');
}

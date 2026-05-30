const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './social.sqlite'
  },
  useNullAsDefault: true
});

async function initDB() {
  // Users Table
  if (!await knex.schema.hasTable('users')) {
    await knex.schema.createTable('users', table => {
      table.increments('id').primary();
      table.string('username').unique().notNullable();
      table.string('bio');
    });
    // Seed some dummy users for testing
    await knex('users').insert([
      { username: 'alice', bio: 'Coding is life.' },
      { username: 'bob', bio: 'Just wandering around.' }
    ]);
  }

  // Posts Table
  if (!await knex.schema.hasTable('posts')) {
    await knex.schema.createTable('posts', table => {
      table.increments('id').primary();
      table.integer('user_id').references('users.id');
      table.text('content').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Comments Table
  if (!await knex.schema.hasTable('comments')) {
    await knex.schema.createTable('comments', table => {
      table.increments('id').primary();
      table.integer('post_id').references('posts.id').onDelete('CASCADE');
      table.integer('user_id').references('users.id');
      table.text('content').notNullable();
    });
  }

  // Likes Table
  if (!await knex.schema.hasTable('likes')) {
    await knex.schema.createTable('likes', table => {
      table.integer('post_id').references('posts.id').onDelete('CASCADE');
      table.integer('user_id').references('users.id');
      table.primary(['post_id', 'user_id']);
    });
  }

  // Follows Table
  if (!await knex.schema.hasTable('follows')) {
    await knex.schema.createTable('follows', table => {
      table.integer('follower_id').references('users.id');
      table.integer('following_id').references('users.id');
      table.primary(['follower_id', 'following_id']);
    });
  }
  
  console.log("Database tables initialized.");
}

initDB();

module.exports = knex;

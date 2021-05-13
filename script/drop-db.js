const { createClient, getConfig, getEnv } = require('../server/db')

// See https://www.postgresql.org/docs/13/errcodes-appendix.html
const DUPLICATE_DATABASE_ERROR = '42P04'

destroyDatabase()

async function destroyDatabase () {
  const targetEnv = getEnv()
  if (targetEnv === 'production') {
    throw new Error('This script should not be used in production!')
  }

  const config = getConfig(targetEnv)
  await dropDatabase(config)
}

async function dropDatabase (config) {
  const { database } = config.connection
  let db

  try {
    // Connect with system database selected
    db = createClient({
      ...config,
      connection: {
        ...config.connection,
        database: 'postgres'
      }
    })

    // Drop the database if it exists
    await db.raw(`DROP DATABASE ${database}`)
    console.log(`Dropped database "${database}"!`)
  } catch (error) {
    if (error.code === DUPLICATE_DATABASE_ERROR) {
      console.warn(`Error dropping database "${database}": it already exists!`)
    } else {
      console.error(`Error dropping database "${database}": ${error.message}`)
      throw error
    }
  } finally {
    // Disconnect
    await db.destroy()
  }
}

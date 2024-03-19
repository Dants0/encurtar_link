import { sql } from "../connections/postgres";

async function setup (){
    await sql`
    CREATE TABLE IF NOT EXISTS shortLinks (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE,
        original_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

    await sql.end()

    console.log('db connection established')

}

setup()
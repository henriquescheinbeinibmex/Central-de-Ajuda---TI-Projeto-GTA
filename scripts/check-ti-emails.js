const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  const r = await client.query(`SELECT username, nome, email, role FROM "User" WHERE role = 'CONSULTOR_TI'`);
  console.log("Consultores TI:");
  console.log(JSON.stringify(r.rows, null, 2));
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });

import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function getMongoClient() {
  if (client) return client;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

// ✅ Restore this export to fix the module error
export async function getWarehouseDb() {
  const c = await getMongoClient();
  return c.db(process.env.DB_WAREHOUSE || 'inventory_warehouse');
}

export async function getSiteDb(site: string) {
  const c = await getMongoClient();
  // ... your site mapping logic
  return c.db(process.env.DB_ENAM); 
}
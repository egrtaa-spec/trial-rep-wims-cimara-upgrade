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

export async function getSiteDb(site: string) {
  const c = await getMongoClient();
  const normalizedSite = site.toUpperCase().replace(/'/g, '');
  
  const map: Record<string, string | undefined> = {
    ENAM: process.env.DB_ENAM,
    MINFOPRA: process.env.DB_MINFOPRA,
    SUPPTIC: process.env.DB_SUPPTIC,
    ISMP: process.env.DB_ISMP,
  };

  const dbName = map[normalizedSite];
  
  if (!dbName) {
    throw new Error(`Invalid site mapping for: ${site}. Configure DB_* env vars`);
  }
  
  return c.db(dbName);
}

// ✅ Fix: Restore this for your withdrawal routes
export async function getWarehouseDb() {
  const c = await getMongoClient();
  return c.db(process.env.DB_WAREHOUSE || 'inventory_warehouse');
}

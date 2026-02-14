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
    ENAM: process.env.MONGODB_SITE_ENAM,
    MINFOPRA: process.env.MONGODB_SITE_MINFOPRA,
    SUPPTIC: process.env.MONGODB_SITE_SUPPTIC,
    ISMP: process.env.MONGODB_SITE_ISMP,
  };

  let dbName = map[normalizedSite];
  
  // Development fallback - use default names if env vars not set
  if (!dbName) {
    if (process.env.NODE_ENV !== 'production') {
      dbName = `cimara_${normalizedSite.toLowerCase()}`;
    } else {
      throw new Error(`Invalid site mapping for: ${site}. Configure MONGODB_SITE_* env vars`);
    }
  }
  
  return c.db(dbName);
}

// ✅ Fix: Restore this for your withdrawal routes
export async function getWarehouseDb() {
  const c = await getMongoClient();
  return c.db(process.env.DB_WAREHOUSE || 'inventory_warehouse');
}

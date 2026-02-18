import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb'; // Using the dynamic helper
import { getSession } from '@/lib/session';
import { isValidSite } from '@/lib/sites';

/**
 * GET: Fetches engineers based on user role.
 * Admins see engineers for their current site context.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Identify which site database to connect to based on the session
    const siteKey = (session as any).site?.toUpperCase().replace(/['\s]/g, '');
    const dbName = process.env[`DB_${siteKey}`];
    
    if (!dbName) {
      return NextResponse.json({ error: `Database configuration missing for site: ${(session as any).site}` }, { status: 500 });
    }

    const db = await getDb(dbName);
    
    // Fetch engineers for this specific site
    const engineers = await db.collection('engineers')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(engineers);
  } catch (e: any) {
    console.error('GET Engineers Error:', e);
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

/**
 * POST: Allows ADMIN to create a new engineer in a specific site's database.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    // Only ADMIN (likely from the Warehouse/Main DB) should have permission to create users
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, password, siteName } = body;

    // Validate payload
    if (!name || !username || !password || !siteName || !isValidSite(siteName)) {
      return NextResponse.json({ error: 'Missing fields or invalid site' }, { status: 400 });
    }

    // Map siteName (e.g., "SUP'PTIC") to Env Var (e.g., DB_SUPPTIC)
    const targetSiteKey = siteName.toUpperCase().replace(/['\s]/g, '');
    const targetDbName = process.env[`DB_${targetSiteKey}`];

    if (!targetDbName) {
      return NextResponse.json({ error: `Target database for ${siteName} not configured` }, { status: 500 });
    }

    const db = await getDb(targetDbName);

    // Check if username is already taken in THAT site's database
    const exists = await db.collection('engineers').findOne({ 
      username: String(username).toLowerCase() 
    });
    
    if (exists) {
      return NextResponse.json({ error: `Username already exists in the ${siteName} database` }, { status: 409 });
    }

    // Insert the new engineer into the site-specific collection
    const result = await db.collection('engineers').insertOne({
      name,
      username: String(username).toLowerCase(),
      password, // Plain text for now as requested; consider hashing later
      site: siteName,
      role: 'ENGINEER',
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: `Engineer created successfully in ${siteName} database`,
      id: result.insertedId 
    });
  } catch (e: any) {
    console.error('POST Engineer Error:', e);
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
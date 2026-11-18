import { MongoClient } from 'mongodb';
import { initialSeedData } from '../src/data/seedData.js';

// Support any environment variable name created by Vercel MongoDB Atlas integration
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL;

const DB_NAME = process.env.MONGODB_DB || 'bookly_ota_db';
const COLLECTION_NAME = 'portal_state';
const STATE_DOC_ID = 'bookly_main_state_v1';

let cachedClient = null;
let cachedDb = null;

async function getDatabase() {
  if (!MONGO_URI) {
    throw new Error(
      'MongoDB connection string not found in environment variables (expected MONGODB_URI or STORAGE_URL).'
    );
  }
  if (cachedClient && cachedDb) {
    return cachedDb;
  }
  const client = new MongoClient(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000
  });
  await client.connect();
  const db = client.db(DB_NAME);
  cachedClient = client;
  cachedDb = db;
  return db;
}

// Merge incoming array with existing DB array by primary key so concurrent creates from other agents are never lost
function mergeArrayByKey(existingArr = [], incomingArr, idKey, deletedSet, appendOnly = false) {
  if (!Array.isArray(incomingArr)) {
    return Array.isArray(existingArr) ? existingArr : [];
  }
  const incomingIds = new Set(
    incomingArr.map((item) => item && item[idKey]).filter(Boolean)
  );
  const preservedConcurrent = (Array.isArray(existingArr) ? existingArr : []).filter((item) => {
    const id = item && item[idKey];
    if (!id) return false;
    if (deletedSet.has(id)) return false;
    if (incomingIds.has(id)) return false;
    if (appendOnly) return true;
    // Preserve concurrent records created recently by another user/session
    return true;
  });
  return [...incomingArr.filter((item) => !deletedSet.has(item?.[idKey])), ...preservedConcurrent];
}

// Sync normalized collections in MongoDB for enterprise reporting, backup, and scalability
async function syncNormalizedCollections(db, state, deletedSet) {
  try {
    const syncCol = async (colName, items = [], idKey) => {
      const col = db.collection(colName);
      if (deletedSet.size > 0) {
        await col.deleteMany({ _id: { $in: Array.from(deletedSet) } });
      }
      if (!Array.isArray(items) || items.length === 0) return;
      const ops = items
        .filter((it) => it && it[idKey])
        .map((it) => ({
          updateOne: {
            filter: { _id: it[idKey] },
            update: { $set: { ...it, _id: it[idKey], updatedAt: state.updatedAt } },
            upsert: true
          }
        }));
      if (ops.length > 0) {
        await col.bulkWrite(ops, { ordered: false });
      }
    };

    await Promise.all([
      syncCol('segments', state.segments, 'AirGroupSegmentID'),
      syncCol('sub_agents', state.subAgents, 'SubCompanyID'),
      syncCol('bookings', state.bookings, 'AirGroupBookingID'),
      syncCol('credit_transactions', state.creditTransactions, 'TransactionID'),
      syncCol('admin_users', state.adminUsers, 'AdminID')
    ]);
  } catch (syncErr) {
    console.warn('Normalized collection sync warning:', syncErr.message);
  }
}

async function loadOrInitState(collection) {
  let doc = await collection.findOne({ _id: STATE_DOC_ID });
  if (!doc) {
    const fresh = {
      _id: STATE_DOC_ID,
      airports: initialSeedData.airports || [],
      airlines: initialSeedData.airlines || [],
      suppliers: initialSeedData.suppliers || [],
      segments: [],
      flights: [],
      subAgents: [],
      bookings: [],
      creditTransactions: [],
      adminUsers: [],
      _deletedIds: [],
      updatedAt: new Date().toISOString()
    };
    await collection.insertOne(fresh);
    doc = fresh;
  }
  return doc;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    if (req.method === 'GET') {
      const state = await loadOrInitState(collection);
      return res.status(200).json({
        ok: true,
        state: {
          airports: initialSeedData.airports,
          airlines: state.airlines || initialSeedData.airlines || [],
          suppliers: state.suppliers || initialSeedData.suppliers || [],
          segments: state.segments || [],
          flights: state.flights || [],
          subAgents: state.subAgents || [],
          bookings: state.bookings || [],
          creditTransactions: state.creditTransactions || [],
          adminUsers: state.adminUsers || [],
          _deletedIds: state._deletedIds || [],
          updatedAt: state.updatedAt
        }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const current = await loadOrInitState(collection);

      const combinedDeletedIds = Array.from(
        new Set([...(current._deletedIds || []), ...(Array.isArray(body._deletedIds) ? body._deletedIds : [])])
      ).slice(-500);
      const deletedSet = new Set(combinedDeletedIds);

      const nextState = {
        airports: initialSeedData.airports,
        airlines: Array.isArray(body.airlines) ? body.airlines : current.airlines || initialSeedData.airlines,
        suppliers: Array.isArray(body.suppliers) ? body.suppliers : current.suppliers || initialSeedData.suppliers,
        segments: mergeArrayByKey(current.segments, body.segments, 'AirGroupSegmentID', deletedSet),
        flights: mergeArrayByKey(current.flights, body.flights, 'AirGroupID', deletedSet),
        subAgents: mergeArrayByKey(current.subAgents, body.subAgents, 'SubCompanyID', deletedSet),
        bookings: mergeArrayByKey(current.bookings, body.bookings, 'AirGroupBookingID', deletedSet),
        creditTransactions: mergeArrayByKey(
          current.creditTransactions,
          body.creditTransactions,
          'TransactionID',
          deletedSet,
          true
        ),
        adminUsers: mergeArrayByKey(current.adminUsers, body.adminUsers, 'AdminID', deletedSet),
        _deletedIds: combinedDeletedIds,
        updatedAt: new Date().toISOString()
      };

      await collection.updateOne(
        { _id: STATE_DOC_ID },
        { $set: nextState },
        { upsert: true }
      );

      // Mirror records into dedicated MongoDB collections
      await syncNormalizedCollections(db, nextState, deletedSet);

      return res.status(200).json({
        ok: true,
        state: nextState
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('MongoDB API Error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Database connection error'
    });
  }
}

import { closeDB, connectDB } from "../config/db.config";
import User from "../models/user";

const migrateProviderIdentityIndex = async (): Promise<void> => {
  const collection = User.collection;
  const collisions = await collection
    .aggregate([
      {
        $group: {
          _id: { provider: "$provider", providerId: "$providerId" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 1 },
    ])
    .toArray();

  if (collisions.length > 0) {
    throw new Error(
      "Provider identity duplicates exist; no identity index was changed",
    );
  }

  let indexes = await collection.listIndexes().toArray();
  const compoundIndex = indexes.find(
    (index) =>
      index.key.provider === 1 &&
      index.key.providerId === 1 &&
      Object.keys(index.key).length === 2,
  );

  if (compoundIndex && compoundIndex.unique !== true) {
    throw new Error(
      "A non-unique provider identity index exists; schedule a controlled index migration",
    );
  }

  if (!compoundIndex) {
    await collection.createIndex(
      { provider: 1, providerId: 1 },
      { unique: true, name: "provider_providerId_unique" },
    );
  }

  indexes = await collection.listIndexes().toArray();
  const obsoleteGlobalIndexes = indexes.filter(
    (index) =>
      index.unique === true &&
      index.key.providerId === 1 &&
      Object.keys(index.key).length === 1,
  );

  for (const index of obsoleteGlobalIndexes) {
    await collection.dropIndex(index.name);
  }
};

const run = async (): Promise<void> => {
  try {
    await connectDB();
    await migrateProviderIdentityIndex();
    console.info("Provider identity index migration completed");
  } catch {
    console.error("Provider identity index migration failed safely");
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
};

void run();

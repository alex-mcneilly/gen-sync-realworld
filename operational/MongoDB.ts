import { MongoClient, ObjectId } from "npm:mongodb";
import type { Patch } from "npm:immer";
import { jsonPatchToMongoDbOps } from "../imports/jsonPatchToMongoDbOps.ts";
import type { Operation } from "npm:fast-json-patch";

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
const DB_NAME = Deno.env.get("DB_NAME");
if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    Deno.exit(1);
}

const client = new MongoClient(MONGODB_URI);

try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB");
} catch (error) {
    console.error("Error connecting to MongoDB:", error);
    Deno.exit(1);
}

const db = client.db(DB_NAME);

export default class MongoDBConcept {
    getCollection(concept: string) {
        return concept + "Table";
    }
    async initialize(states: Record<string, Record<string, unknown>>) {
        const entries = Object.entries(states);
        for (const entry of entries) {
            const [coll, state] = entry;
            const collection = db.collection(this.getCollection(coll));
            const all_documents = await collection.find().toArray();
            all_documents.forEach((doc) => {
                const { _id, ...rest } = doc;
                const id = _id.toString();
                state[id] = rest;
            });
        }
    }
    update(collection_name: string, diff: Patch[]) {
        const collection = db.collection(collection_name);
        const json_patches = diff.map((patch) => {
            const [id, ...rest] = patch.path;
            const path = rest.join("/");
            return [new ObjectId(id), { ...patch, path }];
        });
        json_patches.forEach(async ([id, patch]) => {
            if ((patch instanceof ObjectId)) return;
            // Json patch conversion doesn't work for base path
            if (patch.path === "") {
                if (patch.op === "remove") {
                    await collection.deleteOne({ _id: id });
                } else {
                    const copied = JSON.parse(JSON.stringify(patch.value));
                    await collection.updateOne({ _id: id }, { $set: copied }, {
                        upsert: true,
                    });
                }
            } else {
                const updates = await jsonPatchToMongoDbOps([
                    patch as Operation,
                ], {
                    _id: id,
                }, collection);
                // console.dir(updates, { depth: null });
                collection.bulkWrite(updates);
            }
        });
    }
}

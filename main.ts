import Synchronizer from "./engine/sync.ts";
import { Hono } from "jsr:@hono/hono";
import * as path from "jsr:@std/path";

// Concept imports
import APIConcept from "./concepts/API.ts";
import UserConcept from "./concepts/user.ts";
import ProfileConcept from "./concepts/profile.ts";
import FollowsConcept from "./concepts/follows.ts";
// Operational concept imports
import JWTConcept from "./operational/JWT.ts";
import MapConcept from "./operational/map.ts";

// Initialize concepts
const API = new APIConcept();
const User = new UserConcept();
const Profile = new ProfileConcept();
const Follows = new FollowsConcept();
const JWT = new JWTConcept();
const Mapping = new MapConcept();

// Load synchronizations
const base_path = import.meta.dirname;
const sync_path = Deno.env.get("SYNC_FILE");
if (!base_path || !sync_path) throw Error("Path not found");
const sync_file = Deno.readTextFileSync(path.join(base_path, sync_path));

// Initialize synchronizer
const Sync = new Synchronizer(
  [API, User, Profile, Follows, JWT, Mapping],
  sync_file,
);
console.dir(Sync.syncs, { depth: null });

// Instantiate server
const app = new Hono();

app.get("*", async (ctx) => {
  console.dir(ctx.req, { depth: null });
  return ctx.text(ctx.req.method);
});

Deno.serve(app.fetch);

import Synchronizer from "./engine/sync.ts";
import { Hono } from "jsr:@hono/hono";
import { HTTPException } from "jsr:@hono/hono/http-exception";
import * as path from "jsr:@std/path";

// Concept imports
import APIConcept, { Requests } from "./concepts/API.ts";
import UserConcept from "./concepts/user.ts";
import ProfileConcept from "./concepts/profile.ts";
import FollowsConcept from "./concepts/follows.ts";
// Operational concept imports
import JWTConcept from "./operational/JWT.ts";
import MapConcept from "./operational/map.ts";
import ConceptConcept from "./operational/concept.ts";
import StateConcept from "./operational/state.ts";
import OperationalConcept from "./operational/operational.ts";
import MongoDBConcept from "./operational/MongoDB.ts";

// Initialize concepts
const API = new APIConcept();
const User = new UserConcept();
const Profile = new ProfileConcept();
const Follows = new FollowsConcept();
const JWT = new JWTConcept();
const Mapping = new MapConcept();
const Concept = new ConceptConcept();
const MongoDB = new MongoDBConcept();
// Initialize state
const states = { User: {}, API: {}, Follows: {}, Profile: {} };
const State = new StateConcept(states);
// Initialize operations
const operations = ["JWT", "Map"];
const Operation = new OperationalConcept(operations);

// Load synchronizations
const base_path = import.meta.dirname;
const sync_path = Deno.env.get("SYNC_FILE");
if (!base_path || !sync_path) throw Error("Path not found");
const sync_file = Deno.readTextFileSync(path.join(base_path, sync_path));

// Initialize synchronizer
const Sync = new Synchronizer(
  [
    API,
    User,
    Profile,
    Follows,
    JWT,
    Mapping,
    Concept,
    State,
    Operation,
    MongoDB,
  ],
  sync_file,
);

async function makeRequest(action: string, ...args: unknown[]) {
  try {
    const request_id = await Sync.run("API.request", [action, ...args]);
    if (typeof request_id === "string") {
      const response = (State.get("API") as Requests)[request_id].response;
      return response;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(401, { message: error.message });
      // throw Error(error.message);
    }
  }
  // const request_id = await Sync.run("API.request", [action, ...args]);
  // if (typeof request_id === "string") {
  //   const response = (State.get("API") as Requests)[request_id].response;
  //   return response;
  // }
}
// console.dir(Sync.syncs, { depth: null });

// Instantiate server
const app = new Hono();

app.post("/users", async (ctx) => {
  const { user: { username, email, password } } = await ctx.req.json();
  const response = await makeRequest(
    "create_user",
    username,
    email,
    password,
  );
  return ctx.json(response);
});

app.post("/users/login", async (ctx) => {
  const { user: { email, password } } = await ctx.req.json();
  const response = await makeRequest("login_user", email, password);
  return ctx.json(response);
});

app.get("/user", async (ctx) => {
  const header = ctx.req.header("Authorization");
  if (header === undefined) {
    throw new HTTPException(401);
  }
  const token = header.slice("Token ".length);
  const response = await makeRequest("get_user", { token });
  return ctx.json(response);
});

app.put("/user", async (ctx) => {
  const header = ctx.req.header("Authorization");
  if (header === undefined) {
    throw new HTTPException(401);
  }
  const token = header.slice("Token ".length);
  const { user: { email, password, bio, image, username } } = await ctx.req
    .json();
  const response = await makeRequest(
    "update_user",
    { token },
    username,
    email,
    password,
    bio,
    image,
  );
  return ctx.json(response);
});

/*
app.get("/user", async (ctx) => {
  const header = ctx.req.header("Authorization");
  if (header === undefined) {
    throw new HTTPException(401);
  }
  const token = header.slice("Token ".length);
  const response = await makeRequest("", {token})
  return ctx.json(response);
});
*/

app.get("*", (ctx) => {
  console.dir(ctx.req, { depth: null });
  return ctx.text(ctx.req.method);
});

app.post("*", async (ctx) => {
  console.dir(ctx.req, { depth: null });
  const body = await ctx.req.json();
  return ctx.json(body);
});

Deno.serve(app.fetch);

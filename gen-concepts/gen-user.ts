import uuid from "../imports/uuid.ts";
import bcrypt from "npm:bcrypt";

interface User {
  id: string;
  username: string;
  password: string;
  email: string;
}

// {user_id: user}
type Users = Record<string, User>;

export default class UserConcept {
  async signup(
    state: Users,
    username: string,
    password: string,
    email: string
  ) {
    this.checkUnique(state, username, email);
    if (!username || !password) throw Error("Username and password required");

    const user_id = uuid();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = {
      id: user_id,
      username,
      password: hashedPassword,
      email,
    };

    state[user_id] = user;
    return [state, user_id];
  }

  get(state: Users, user_id: string) {
    const user = state[user_id];
    if (user === undefined) throw Error("User not found");
    // deno-lint-ignore no-unused-vars
    const { password, ...user_data } = user;
    return [state, user_data];
  }

  getPublic(state: Users, user_id: string) {
    const user = state[user_id];
    if (user === undefined) throw Error("User not found");
    // deno-lint-ignore no-unused-vars
    const { password, email, ...user_data } = user;
    return [state, user_data];
  }

  addMany(state: Users, entries: Array<[string, any]>) {
    const updated_entries = entries.map(([id, data]) => {
      const user = state[id];
      if (user === undefined) return [id, data];
      // deno-lint-ignore no-unused-vars
      const { password, email, ...user_data } = user;
      return [id, { ...data, user: user_data }];
    });
    return [state, updated_entries];
  }

  getByUsername(state: Users, username: string) {
    const all_users = Object.values(state);
    const user = all_users.find((u) => u.username === username);
    if (user === undefined) throw Error("User not found");
    // deno-lint-ignore no-unused-vars
    const { password, ...user_data } = user;
    return [state, user_data];
  }

  getByEmail(state: Users, email: string) {
    const all_users = Object.values(state);
    const user = all_users.find((u) => u.email === email);
    if (user === undefined) throw Error("User not found");
    return [state, user];
  }

  usernameToId(state: Users, username: string) {
    const all_users = Object.entries(state);
    const found = all_users.find(([, user]) => user.username === username);
    return [state, found?.[0]];
  }

  checkUnique(state: Users, username: string, email: string) {
    const all_users = Object.values(state);
    const exists = all_users.some(
      (user) => user.username === username || user.email === email
    );
    if (exists) throw Error("Username or email already exists");
    return [state, undefined];
  }

  login(state: Users, email: string, password: string) {
    const [, user] = this.getByEmail(state, email);
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) throw Error("Invalid password");
    return [state, user.id];
  }

  update(
    state: Users,
    user_id: string,
    username?: string,
    email?: string,
    password?: string
  ) {
    const user = state[user_id];
    if (user === undefined) throw Error("User not found");

    if (username !== undefined || email !== undefined) {
      this.checkUnique(state, username || user.username, email || user.email);
    }

    if (username !== undefined) state[user_id].username = username;
    if (email !== undefined) state[user_id].email = email;
    if (password !== undefined) {
      state[user_id].password = bcrypt.hashSync(password, 10);
    }

    return [state, user_id];
  }
}

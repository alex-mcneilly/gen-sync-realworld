import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

interface User {
    username: string;
    password: string;
    email: string;
}
// {user_id: user}
type Users = Record<string, User>;

function sanitize(user: User) {
    // deno-lint-ignore no-unused-vars
    const { password, ...rest } = user;
    return rest;
}

export default class UserConcept {
    async signup(
        state: Users,
        username: string,
        email: string,
        password: string,
    ) {
        if (this.getByUsername(state, username) === undefined) {
            throw Error("User already exists");
        } else if (username.length === 0 || password.length === 0) {
            throw Error("Username/Password must not be empty");
        }
        const user_id = crypto.randomUUID();
        const hashed = await bcrypt.hash(password);
        const user = { username, email, password: hashed };
        state[user_id] = user;
        return sanitize(user);
    }
    get(state: Users, user_id: string) {
        const user = state[user_id];
        if (user === undefined) {
            throw Error("User not found");
        }
        return sanitize(user);
    }
    getByUsername(state: Users, username: string) {
        const user = Object.values(state).find((user) =>
            user.username === username
        );
        if (user === undefined) {
            throw Error("User not found");
        }
        return sanitize(user);
    }
    // Email is both private and login, we do not sanitize
    getByEmail(state: Users, email: string) {
        const user = Object.values(state).find((user) => user.email === email);
        if (user === undefined) {
            throw Error("User not found");
        }
        return user;
    }
    usernameToId(state: Users, username: string) {
        const found = Object.entries(state).find(([, user]) => {
            user.username === username;
        });
        if (found === undefined) {
            throw Error("User not found");
        }
        return found[0];
    }
    async login(state: Users, email: string, password: string) {
        const user = this.getByEmail(state, email);
        if (user === undefined) {
            throw Error("User not found");
        }
        if (await bcrypt.compare(password, user.password) === false) {
            throw Error("Incorrect password");
        }
        return sanitize(user);
    }
    update(
        state: Users,
        user_id: string,
        username?: string,
        email?: string,
        password?: string,
    ) {
        const user = state[user_id];
        if (email !== undefined) {
            try {
                this.getByEmail(state, email);
                // If found, email already taken
                throw Error("Email already exists");
            } catch {
                user.email = email;
            }
        }
        if (username !== undefined) {
            try {
                this.getByUsername(state, username);
                // If found, username already taken
                throw Error("Username already exists");
            } catch {
                user.username = username;
            }
        }
        if (password !== undefined) {
            // Insert password validation here
            if (password.length === 0) {
                throw Error("Password must not be empty");
            }
            user.password = password;
        }
        return sanitize(user);
    }
}

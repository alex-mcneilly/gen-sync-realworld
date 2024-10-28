import { create, verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

interface Token {
    token: string;
}

// New key on server start
const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"],
);

export default class JWTConcept {
    async create(user_id: string) {
        const payload = { user_id };
        const token = await create({ alg: "HS512", typ: "JWT" }, payload, key);
        return { token };
    }
    async verify(jwt: Token) {
        const payload = await verify(jwt.token, key);
        if (payload.user_id === undefined) {
            throw Error("Missing claims");
        }
        return payload.user_id;
    }
}

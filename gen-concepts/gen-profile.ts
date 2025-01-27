import uuid from "../imports/uuid.ts";

interface Profile {
    id: string;
    bio: string;
    image: string;
    createdAt: string;
    updatedAt: string;
}

// {profile_id: profile}
type Profiles = Record<string, Profile>;

export default class ProfileConcept {
    create(state: Profiles, user_id: string) {
        const now = new Date().toISOString();
        const createdAt = now;
        const updatedAt = now;
        const profile = {
            id: user_id,
            bio: "",
            image: "",
            createdAt,
            updatedAt,
        };
        state[user_id] = profile;
        return [state, profile];
    }

    get(state: Profiles, user_id: string) {
        const profile = state[user_id];
        if (profile === undefined) throw Error("Profile not found");
        // deno-lint-ignore no-unused-vars
        const { ...profile_data } = profile;
        return [state, profile_data];
    }

    addMany(state: Profiles, entries: [string, any][]) {
        const all_entries = entries.map(([id, entry]) => {
            const profile = state[entry.author];
            if (profile === undefined) return [id, entry];
            return [id, { ...entry, profile }];
        });
        return [state, all_entries];
    }

    update(
        state: Profiles,
        user_id: string,
        bio?: string,
        image?: string,
    ) {
        const profile = state[user_id];
        if (profile === undefined) throw Error("Profile not found");
        
        if (bio !== undefined) {
            state[user_id].bio = bio;
        }
        if (image !== undefined) {
            state[user_id].image = image;
        }
        state[user_id].updatedAt = new Date().toISOString();
        return [state, profile];
    }
}
interface Profile {
    bio: string;
    image: string;
}
// {user_id: profile}
type Profiles = Record<string, Profile>;

export default class ProfileConcept {
    create(state: Profiles, user_id: string) {
        const profile = { bio: "", image: "" };
        state[user_id] = profile;
        return profile;
    }
    get(state: Profiles, user_id: string) {
        return state[user_id];
    }
    update(state: Profiles, user_id: string, bio?: string, image?: string) {
        const profile = this.get(state, user_id);
        if (profile === undefined) {
            throw Error("Profile not found");
        }
        if (bio !== undefined) {
            profile.bio = bio;
        }
        if (image !== undefined) {
            profile.image = image;
        }
    }
}

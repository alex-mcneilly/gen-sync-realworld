// {user_id: [target_id]}
type Follows = Record<string, [string]>;

export default class FollowsConcept {
    create(state: Follows, user_id: string, target_id: string) {
        const following = state[user_id];
        if (following === undefined) {
            state[user_id] = [target_id];
        } else {
            state[user_id].push(target_id);
        }
        return [state];
    }
    delete(state: Follows, user_id: string, target_id: string) {
        const following = state[user_id];
        const idx = following.findIndex((id) => id === target_id);
        if (idx === -1) {
            throw Error("Target not found");
        }
        state[user_id].splice(idx, 1);
        return [state];
    }
}

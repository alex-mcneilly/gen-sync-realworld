// {user_id: [target_id]}
interface Follow {
    following: string[];
}
type Follows = Record<string, Follow>;

export default class FollowsConcept {
    create(state: Follows, user_id: string, target_id: string) {
        const following = state[user_id];
        if (following === undefined) {
            state[user_id] = { following: [target_id] };
        } else {
            if (!(state[user_id].following.includes(target_id))) {
                state[user_id].following.push(target_id);
            }
        }
        return [state];
    }
    delete(state: Follows, user_id: string, target_id: string) {
        if (state[user_id] === undefined) throw Error("Follow not found");
        const following = state[user_id].following;
        const idx = following.findIndex((id) => id === target_id);
        if (idx === -1) {
            throw Error("Target not found");
        }
        state[user_id].following.splice(idx, 1);
        return [state];
    }
    doesFollow(state: Follows, user_id: string, target_id: string) {
        if (state[user_id] === undefined) {
            return [state, { following: false }];
        }
        const following = state[user_id].following.includes(target_id);
        return [state, { following }];
    }
    addMany(state: Follows, entries: [string, object][], user_id: string) {
        const added = entries.map(([id, obj]) => {
            const [, follows] = this.doesFollow(state, user_id, id);
            return [id, { ...obj, ...follows }];
        });
        return [state, added];
    }
}

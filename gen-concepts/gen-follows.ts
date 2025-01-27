import uuid from "../imports/uuid.ts";

interface Follow {
   following: string[];
}

// {user_id: follow}
type Follows = Record<string, Follow>;

export default class FollowsConcept {
   create(state: Follows, user_id: string, target_id: string) {
       if (!state[user_id]) {
           state[user_id] = {
               following: []
           };
       }
       if (!state[user_id].following.includes(target_id)) {
           state[user_id].following.push(target_id);
       }
       return [state];
   }

   delete(state: Follows, user_id: string, target_id: string) {
       if (!state[user_id] || !state[user_id].following.includes(target_id)) {
           throw Error("Follow not found");
       }
       state[user_id].following = state[user_id].following.filter(id => id !== target_id);
       return [state];
   }

   doesFollow(state: Follows, user_id: string, target_id: string) {
       return [state, state[user_id]?.following?.includes(target_id) ?? false];
   }

   addMany(
       state: Follows,
       entries: [string, unknown][],
       user_id: string
   ): [Follows, [string, unknown & { following: boolean }][]] {
       const all_entries = entries.map(([id, entry]) => {
           return [id, {
               ...entry,
               following: state[user_id]?.following?.includes(id) ?? false
           }];
       });
       return [state, all_entries];
   }

   get(state: Follows, user_id: string) {
       return [state, state[user_id]?.following ?? []];
   }
}
import uuid from "../imports/uuid.ts";

interface FavoriteData {
    favorited: string[];
}

// {user_id: favoriteData}
type Favorites = Record<string, FavoriteData>;

export default class FavoritesConcept {
    create(state: Favorites, user_id: string, target_id: string) {
        if (!state[user_id]) {
            state[user_id] = {
                favorited: []
            };
        }
        if (!state[user_id].favorited.includes(target_id)) {
            state[user_id].favorited.push(target_id);
        }
        return [state;
    }

    delete(state: Favorites, user_id: string, target_id: string) {
        if (!state[user_id] || !state[user_id].favorited.includes(target_id)) {
            throw Error("Favorite not found");
        }
        state[user_id].favorited = state[user_id].favorited.filter(id => id !== target_id);
        return [state];
    }

    isFavorited(state: Favorites, user_id: string, target_id: string) {
        return [state, state[user_id]?.favorited?.includes(target_id) ?? false];
    }

    favoritesCount(state: Favorites, target_id: string) {
        let count = 0;
        Object.values(state).forEach(userData => {
            if (userData.favorited.includes(target_id)) {
                count++;
            }
        });
        return [state, count];
    }

    byFavorited(
        state: Favorites,
        entries: [string, unknown][],
        user_id?: string,
        favorited_id?: string
    ): [Favorites, [string, unknown][]] {
        const check_id = favorited_id ?? user_id;
        if (!check_id || !state[check_id]) {
            return [state, entries];
        }
        const favorited = state[check_id].favorited;
        const filtered = entries.filter(([entry_id]) => 
            favorited.includes(entry_id)
        );
        return [state, filtered];
    }
}
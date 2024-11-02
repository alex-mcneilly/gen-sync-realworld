// {user_id: [target_id]}
interface Favorite {
    favorited: string[];
}
type Favorites = Record<string, Favorite>;

export default class FavoritesConcept {
    create(state: Favorites, user_id: string, target_id: string) {
        const favoriting = state[user_id];
        if (favoriting === undefined) {
            state[user_id] = { favorited: [target_id] };
        } else {
            if (!(state[user_id].favorited.includes(target_id))) {
                state[user_id].favorited.push(target_id);
            }
        }
        return [state];
    }
    delete(state: Favorites, user_id: string, target_id: string) {
        if (state[user_id] === undefined) throw Error("Follow not found");
        const favorited = state[user_id].favorited;
        const idx = favorited.findIndex((id) => id === target_id);
        if (idx === -1) {
            throw Error("Target not found");
        }
        state[user_id].favorited.splice(idx, 1);
        return [state];
    }
    isFavorited(state: Favorites, user_id: string, target_id: string) {
        if (state[user_id] === undefined) {
            return [state, { favorited: false }];
        }
        const favorited = state[user_id].favorited.includes(target_id);
        return [state, { favorited }];
    }
    favoritesCount(state: Favorites, target_id: string) {
        const count = Object.values(state).reduce((c, fav) => {
            if (fav.favorited.includes(target_id)) return c + 1;
            return c;
        }, 0);
        return [state, { favoritesCount: count }];
    }
    byFavorited(
        state: Favorites,
        entries: [string, object][],
        user_id: string,
        favorited_id?: string,
    ) {
        const result: [string, object][] = [];
        entries.forEach(([id, target]) => {
            const [, favoritesCount] = this.favoritesCount(state, id);
            const [, favorited] = this.isFavorited(state, user_id, id);
            if (favorited_id !== undefined) {
                const [, { favorited: target_favorited }] = this.isFavorited(
                    state,
                    favorited_id,
                    id,
                );
                if (!target_favorited) return;
            }
            result.push([id, { ...target, ...favoritesCount, ...favorited }]);
        });
        return [state, result];
    }
}

interface TagEntity {
    tagList: string[];
}

// {from_id: tags}
type Tags = Record<string, TagEntity>;

export default class TagConcept {
    create(state: Tags, from_id: string, tagList: string[] | undefined) {
        const tag_list = tagList ? tagList : [];
        const tags = { tagList: tag_list };
        state[from_id] = tags;
        return [state, tags];
    }

    isTagged(state: Tags, from_id: string, tag: string) {
        const entity = state[from_id];
        if (entity === undefined) return [state, false];
        return [state, entity.tagList.includes(tag)];
    }

    get(state: Tags, from_id: string) {
        const entity = state[from_id];
        if (entity === undefined) throw Error("Content item not found");
        // deno-lint-ignore no-unused-vars
        const { ...tags } = entity;
        return [state, tags];
    }

    delete(state: Tags, from_id: string) {
        delete state[from_id];
        return [state];
    }

    update(state: Tags, from_id: string, tagList: string[]) {
        this.get(state, from_id);
        state[from_id].tagList = tagList;
        return [state];
    }

    all(state: Tags): [Tags, string[]] {
        const all_tags = new Set<string>();
        Object.values(state).forEach(entity => {
            entity.tagList.forEach(tag => all_tags.add(tag));
        });
        return [state, Array.from(all_tags)];
    }

    byTag(state: Tags, tag?: string): [Tags, string[]] {
        const all_items = Object.keys(state);
        if (tag === undefined) return [state, all_items];
        
        const items = all_items.filter(from_id => {
            return state[from_id].tagList.includes(tag);
        });
        return [state, items];
    }
}
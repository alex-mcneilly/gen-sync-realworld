interface Tag {
    tagList: string[];
}
// {article_id: [tags]}
type Tags = Record<string, Tag>;

export default class TagConcept {
    create(state: Tags, from_id: string, tagList: string[] | undefined) {
        const tag_list = tagList ? tagList : [];
        const tags = { tagList: tag_list };
        state[from_id] = tags;
        return [state, tags];
    }
    isTagged(state: Tags, from_id: string, tag: string) {
        if (state[from_id] === undefined) {
            return [state, false];
        }
        const tagged = state[from_id].tagList.includes(tag);
        return [state, tagged];
    }
    get(state: Tags, from_id: string) {
        return [state, state[from_id]];
    }
    delete(state: Tags, from_id: string) {
        delete state[from_id];
        return [state];
    }
    update(state: Tags, from_id: string, tagList: string[]) {
        state[from_id] = { tagList };
        return [state];
    }
    all(state: Tags, _: unknown) {
        const tags = new Set();
        Object.values(state).forEach((tag) => {
            tag.tagList.forEach((t) => tags.add(t));
        });
        return [state, { tags: Array.from(tags) }];
    }
    byTag(
        state: Tags,
        entries: [string, object][],
        tag?: string,
    ) {
        const result: [string, object][] = [];
        entries.forEach(([id, target]) => {
            const [, tags] = this.get(state, id);
            if (tag) {
                const [, tagged] = this.isTagged(state, id, tag);
                if (!tagged) return;
            }
            result.push([id, { ...target, ...tags }]);
        });
        return [state, result];
    }
}

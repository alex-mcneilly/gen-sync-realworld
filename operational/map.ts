type Entries = [string, object][];
export default class MapConcept {
    merge(...maps: Entries) {
        return Object.assign({}, ...maps);
    }
    mergeAs(as: string, ...maps: Entries) {
        const merged = Object.assign({}, ...maps);
        return { [as]: merged };
    }
    getKeys(entries: Entries, key: string) {
        return entries.map(([, entry]) => {
            // @ts-ignore type narrowing
            return [entry[key], {}];
        });
    }
    updateKeys(entries: Entries, key: string) {
        return entries.map(([, obj]) => {
            return { [key]: obj };
        });
    }
    mergeValues(left: Entries, right: object[]) {
        console.log("help");
        console.dir(left, { depth: null });
        console.dir(right, { depth: null });
        return left.map(([id, entry], idx) => {
            if (right[idx] === undefined) return [id, entry];
            const merged = { ...entry, ...right[idx] };
            return [id, merged];
        });
    }
    paginate(
        entries: Entries,
        limit: number = 20,
        offset: number = 0,
    ) {
        return entries.slice(offset, offset + limit);
    }
    collectAs(key: string, entries: Entries) {
        const updated = entries.map(([, obj]) => {
            return obj;
        });
        return { [key]: updated };
    }
    countAs(key: string, entries: Entries) {
        return { [key]: entries.length };
    }
}

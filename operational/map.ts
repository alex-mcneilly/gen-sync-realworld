export default class MapConcept {
    merge(...maps: [Record<string, unknown>]) {
        const merged = Object.assign({}, ...maps);
        return merged;
    }
}

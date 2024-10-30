export default class MapConcept {
    mergeAs(as: string, ...maps: [Record<string, unknown>]) {
        const merged = Object.assign({}, ...maps);
        return { [as]: merged };
    }
}

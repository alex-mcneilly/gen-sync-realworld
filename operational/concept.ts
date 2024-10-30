export default class ConceptConcept {
    // Get concept name from action
    lookup(action: string) {
        const [concept] = action.split(".");
        return concept;
    }
}

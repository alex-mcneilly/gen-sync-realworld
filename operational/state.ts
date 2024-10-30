import {
    applyPatches,
    createDraft,
    enableMapSet,
    enablePatches,
    finishDraft,
    type Patch,
} from "npm:immer";

// Need to enable patch support
enablePatches();
enableMapSet();
type State = Record<string, object>;

export default class StateConcept {
    constructor(public readonly state: State) {}
    get(concept: string) {
        if (concept in this.state) {
            return createDraft(this.state[concept]);
        } else throw Error("State not found");
    }
    compare(_before: object, after: object) {
        const changes: Patch[] = [];
        const inverseChanges = [];
        finishDraft(after, (patches, inversePatches) => {
            changes.push(...patches);
            inverseChanges.push(...inversePatches);
        });
        console.dir(changes, { depth: null });
        return changes;
    }
    update(concept: string, diff: Patch[]) {
        if (concept in this.state) {
            const before = this.state[concept];
            const after = applyPatches(before, diff);
            this.state[concept] = after;
        } else throw Error("State not found");
    }
}

export default class OperationalConcept {
    constructor(public readonly operations: string[]) {}
    lookup(action: string) {
        const [concept] = action.split(".");
        if (this.operations.find((operation) => operation === concept)) {
            return action;
        }
        throw Error("Operation not found");
    }
}

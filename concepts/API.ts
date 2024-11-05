import uuid from "../imports/uuid.ts";

interface Request {
    id: string;
    method: string;
    created_epoch_ms: number;
    completed_epoch_ms?: number;
    response?: object;
    arguments: [string];
}
// {request_id: request}
export type Requests = Record<string, Request>;

export default class APIConcept {
    request(state: Requests, method: string, ...args: [string]) {
        const created_epoch_ms = Date.now();
        const id = uuid();
        state[id] = { id, created_epoch_ms, method, arguments: args };
        return [state, id];
    }
    respond(state: Requests, response: object, request_id: string) {
        const request = state[request_id];
        state[request_id] = {
            ...request,
            ...{ response, completed_epoch_ms: Date.now() },
        };
        return [state];
    }
    // No-op synchronization, we could store the logical inputs if we wanted
    return(state: Requests, ...[_args]: unknown[]) {
        return [state];
    }
}

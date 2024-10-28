interface Request {
    id: string;
    method: string;
    created_epoch_ms: number;
    completed_epoch_ms?: number;
    response?: object;
    arguments: [string];
}
// {request_id: request}
type Requests = Record<string, Request>;

export default class APIConcept {
    request(state: Requests, method: string, ...args: [string]) {
        const created_epoch_ms = Date.now();
        const id = crypto.randomUUID();
        state[id] = { id, created_epoch_ms, method, arguments: args };
        return id;
    }
    respond(state: Requests, request_id: string, response: object) {
        const request = state[request_id];
        state[request_id] = {
            ...request,
            ...{ response, completed_epoch_ms: Date.now() },
        };
    }
}

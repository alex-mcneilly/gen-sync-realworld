import uuid from "../imports/uuid.ts";

interface Request {
    id: string;
    method: string;
    arguments: unknown[];
    createdAt: string;
    completedAt?: string;
    response?: unknown;
}

// {request_id: request}
type Requests = Record<string, Request>;

export default class APIConcept {
    request(state: Requests, method: string, ...args: unknown[]) {
        if (!method || method.trim() === '') {
            throw Error('Method must not be empty');
        }

        const request_id = uuid();
        const now = new Date().toISOString();
        const createdAt = now;

        const request = {
            id: request_id,
            method,
            arguments: args,
            createdAt
        };

        state[request_id] = request;
        return [state, request_id];
    }

    respond(state: Requests, request_id: string, response: unknown) {
        const request = state[request_id];
        if (request === undefined) {
            throw Error('Request not found');
        }

        request.response = response;
        request.completedAt = new Date().toISOString();

        return [state];
    }

    return(state: Requests, ...[_args]: unknown[]) {
        return [state];
    }
}
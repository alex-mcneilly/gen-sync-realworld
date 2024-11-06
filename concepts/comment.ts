import uuid from "../imports/uuid.ts";

interface Comment {
    id: string;
    target: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: string;
}
// {comment_id: comment}
type Comments = Record<string, Comment>;

export default class CommentConcept {
    create(
        state: Comments,
        target: string,
        body: string,
        author: string,
    ) {
        const user_id = uuid();
        const now = new Date().toISOString();
        const createdAt = now;
        const updatedAt = now;
        const comment = {
            id: user_id,
            target,
            body,
            createdAt,
            updatedAt,
            author,
        };
        state[user_id] = comment;
        return [state, user_id];
    }
    get(state: Comments, comment_id: string) {
        if (state[comment_id] === undefined) throw Error("Comment not found");
        // deno-lint-ignore no-unused-vars
        const { author, ...comment } = state[comment_id];
        return [state, comment];
    }
    delete(state: Comments, comment_id: string) {
        delete state[comment_id];
        return [state, comment_id];
    }
    deleteMany(state: Comments, comments: [string, Comment][]) {
        comments.forEach(([comment_id]) => {
            delete state[comment_id];
        });
        return [state];
    }
    getAuthorId(state: Comments, comment_id: string) {
        return [state, state[comment_id].author];
    }
    byTarget(
        state: Comments,
        target_id: string,
    ): [Comments, [string, Comment][]] {
        const all_comments = Object.entries(state);
        const comments = all_comments.filter(([, comment]) => {
            return comment.target === target_id;
        });
        return [state, comments];
    }
}

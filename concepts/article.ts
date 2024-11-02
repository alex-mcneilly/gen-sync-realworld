import uuid from "../imports/uuid.ts";
import { slugify } from "jsr:@std/text/unstable-slugify";

interface Article {
    slug: string;
    title: string;
    description: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: string;
}
// {user_id: user}
type Articles = Record<string, Article>;

export default class ArticleConcept {
    create(
        state: Articles,
        title: string,
        description: string,
        body: string,
        author: string,
    ) {
        const article_id = uuid();
        const now = new Date().toISOString();
        const createdAt = now;
        const updatedAt = now;
        const article = {
            title,
            description,
            body,
            slug: slugify(title),
            createdAt,
            updatedAt,
            author,
        };
        state[article_id] = article;
        return [state, article_id];
    }
    get(state: Articles, article_id: string) {
        const article = state[article_id];
        if (article === undefined) throw Error("Article not found");
        return [state, article];
    }
    getAuthorId(state: Articles, article_id: string) {
        return [state, state[article_id].author];
    }
    getIdBySlug(state: Articles, slug: string) {
        const found = Object.entries(state).find(([, article]) => {
            return article.slug === slug;
        });
        if (found === undefined) {
            throw Error("Article not found");
            // return [state, undefined];
        }
        return [state, found[0]];
    }
    // Handling unique slugs not in specification, but something we could add
    allByAuthor(state: Articles, author_id?: string) {
        const all_articles = Object.entries(state);
        if (author_id === undefined) return [state, all_articles];
        const articles = all_articles.filter(([, article]) => {
            return article.author === author_id;
        });
        return [state, articles];
    }
}

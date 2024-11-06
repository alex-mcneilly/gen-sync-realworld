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
// {article_id: article}
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
    update(
        state: Articles,
        article_id: string,
        title?: string,
        description?: string,
        body?: string,
    ) {
        // Check article exists
        this.get(state, article_id);
        if (title !== undefined) {
            state[article_id].title = title;
            state[article_id].slug = slugify(title);
        }
        if (description !== undefined) {
            state[article_id].description = description;
        }
        if (body !== undefined) state[article_id].body = body;
        state[article_id].updatedAt = new Date().toISOString();
        return [state, article_id];
    }
    delete(state: Articles, article_id: string) {
        delete state[article_id];
        return [state, article_id];
    }
    getAuthorId(state: Articles, article_id: string) {
        return [state, state[article_id].author];
    }
    // Handling unique slugs not in specification, but something we could add
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
    byAuthor(
        state: Articles,
        author_id?: string,
    ): [Articles, [string, Article][]] {
        const all_articles = Object.entries(state);
        // Unspecified author means all, not none in RealWorld
        if (author_id === undefined) return [state, all_articles];
        const articles = all_articles.filter(([, article]) => {
            return article.author === author_id;
        });
        return [state, articles];
    }
    byAuthors(state: Articles, author_ids: string[]) {
        const articles = [];
        for (const author_id of author_ids) {
            const [, authored] = this.byAuthor(state, author_id);
            articles.push(...authored);
        }
        return [state, articles];
    }
}

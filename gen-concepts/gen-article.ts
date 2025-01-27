import uuid from "../imports/uuid.ts";
import { slugify } from "jsr:@std/text/unstable-slugify";

interface Article {
    id: string;
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
    ): [Articles, string] {
        const user_id = uuid();
        const now = new Date().toISOString();
        const createdAt = now;
        const updatedAt = now;
        
        const article = {
            id: user_id,
            title,
            description,
            body,
            slug: slugify(title),
            createdAt,
            updatedAt,
            author,
        };
        
        state[user_id] = article;
        return [state, user_id];
    }

    get(state: Articles, article_id: string): [Articles, Article] {
        if (!state[article_id]) throw Error("Article not found");
        // deno-lint-ignore no-unused-vars
        const article = state[article_id];
        return [state, article];
    }

    update(
        state: Articles,
        article_id: string,
        title?: string,
        description?: string,
        body?: string,
    ): [Articles, string] {
        if (!state[article_id]) throw Error("Article not found");
        
        if (title !== undefined) {
            state[article_id].title = title;
            state[article_id].slug = slugify(title);
        }
        if (description !== undefined) {
            state[article_id].description = description;
        }
        if (body !== undefined) {
            state[article_id].body = body;
        }
        
        state[article_id].updatedAt = new Date().toISOString();
        return [state, article_id];
    }

    delete(state: Articles, article_id: string): [Articles, string] {
        if (!state[article_id]) throw Error("Article not found");
        delete state[article_id];
        return [state, article_id];
    }

    getAuthorId(state: Articles, article_id: string): [Articles, string] {
        if (!state[article_id]) throw Error("Article not found");
        return [state, state[article_id].author];
    }

    getIdBySlug(state: Articles, slug: string): [Articles, string] {
        const found = Object.entries(state).find(([, article]) => 
            article.slug === slug
        );
        if (!found) throw Error("Article not found");
        return [state, found[0]];
    }

    byAuthor(state: Articles, author_id?: string): [Articles, [string, Article][]] {
        const all_articles = Object.entries(state);
        if (author_id === undefined) return [state, all_articles];
        
        const articles = all_articles.filter(([, article]) => 
            article.author === author_id
        );
        return [state, articles];
    }

    byAuthors(state: Articles, author_ids: string[]): [Articles, [string, Article][]] {
        const articles: [string, Article][] = [];
        author_ids.forEach(author_id => {
            const [, authored] = this.byAuthor(state, author_id);
            articles.push(...authored);
        });
        return [state, articles];
    }
}
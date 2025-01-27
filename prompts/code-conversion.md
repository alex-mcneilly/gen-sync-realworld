<instructions>
You are a code-generation assistant. Your goal is to produce a TypeScript file from the following <concept> XML description. The generated code should be functionally identical to my known style. Follow these rules:

1. **Read the .concept XML**:

   - Use `<concept name="XYZConcept">` to name the resulting class as `XYZConcept`.
   - Use `<purpose>` to understand the concept's core function (for comments/documentation only).
   - Use `<state>` to infer data structures and fields.
     - Create a corresponding interface for the concept’s entity/record.
     - Create a type alias as a `Record<string, ThatInterface>` for the state, exactly as indicated by the concept’s <state> snippet.

2. **Translate each <action>** into a class method:
   - Match the `<action>` element’s `<name>` to the method’s name.
   - The method signature is always `(state: StateType, ...params) => [StateType, anyResult]`.
   - Use the same parameter names and order you see in the concept text (e.g. `comment_id` not just `id`, `target_id` not `target`, etc.).
   - If the handwritten or existing style shows “deleteMany(state, comments: [string, Entity][])”, replicate that signature exactly (do not switch to “ids: string[]”).
   - Return `[state, something]` and throw errors exactly in the manner the concept indicates (e.g. “throw Error(‘Not found’)” if an item is missing).
   - Keep the logic minimal but consistent with the preconditions/effects stated.
3. **No Extra Logic**

- Do not add or remove extra parameters or error checks unless explicitly stated by the concept’s text.
- Do not rename or remove fields, especially “id,” if the concept description implies it.
- If the concept says “omit the `author` field on get,” do it by destructuring, e.g.
  ```ts
  const { author, ...rest } = entity;
  return [state, rest];
  ```
  **Do not** introduce TypeScript’s `Omit<...>` or rename parameters.
- If the concept doesn’t mention an “author” check in `delete`, do not add one.
- If the concept says “delete returns [state, entity_id],” keep that exactly—don’t add an extra user param or a returned object.

4. **ID & Timestamp**

   - Use `import uuid from "../imports/uuid.ts";` if an action indicates creating a new item.
   - Use `const now = new Date().toISOString();` if timestamps are needed.
   - If the concept calls the field `id` or `user_id`, replicate that naming strictly.

5. **Output only** the final TypeScript code:
   - Include any needed imports at the top (e.g., `uuid`, `bcrypt`).
   - Define the interface(s).
   - Define the type alias for the store (e.g., `type XYZs = Record<string, XYZEntity>;`).
   - Export a default class named `<ConceptName>Concept` with the methods for each action.
   - No extra commentary, no extra text beyond the code.
   - Preserve the concept’s style of in-place state mutation.
6. **Be consistent** across all generated files.

7. **Specific Style Requirements**:
   - Include 'id' field in all entity interfaces matching the entity name (e.g. `id: string` in Comment interface)
   - Add inline comment above type definitions (e.g. "// {comment_id: comment}")
   - In create() methods, use 'user_id' as the generated UUID variable name
   - Place existence checks before destructuring in get() methods
   - Use the entity name in destructuring (e.g. `...comment` not `...rest`)
   - Include return type annotations on methods returning filtered arrays
   - Prefix filtered array variables with 'all\_' (e.g. 'all_comments')
   - Use forEach() instead of for...of for iteration
   - Include "// deno-lint-ignore no-unused-vars" before destructuring in get()
   - deleteMany should return only [state] without the ids array
   - For all timestamp creation, use this exact pattern in necessary cases (if the concept specifies or requires it):
     const now = new Date().toISOString();
     const createdAt = now;
     const updatedAt = now;
   - For all existence checks, do them before any destructuring

Follow these instructions to ensure the final output is functionally **identical** to my known style, with no deviations in method signatures, parameters, or returned values.
</instructions>

<conceptXML>

</conceptXML>

<exampleConceptXML>
<concept name="ArticleConcept">
<purpose>Manages articles authored by users</purpose>
  <state>
    <component code_name="articles" code_datatype="Record<string, Article>">
      Stores article objects (slug, title, description, body, timestamps, author)
    </component>
  </state>
  <actions>
    <action>
      <name>create</name>
      <precondition>User provides valid article data</precondition>
      <effect>Generates a new article with a unique ID, slug, and timestamps</effect>
    </action>
    <action>
      <name>get</name>
      <precondition>Requested article exists</precondition>
      <effect>Retrieves the article by its ID</effect>
    </action>
    <action>
      <name>update</name>
      <precondition>Requested article exists</precondition>
      <effect>Modifies the article fields, updates slug/title/body/description/timestamp</effect>
    </action>
    <action>
      <name>delete</name>
      <precondition>Requested article exists</precondition>
      <effect>Removes the article from the store</effect>
    </action>
    <action>
      <name>getAuthorId</name>
      <precondition>Requested article exists</precondition>
      <effect>Returns the ID of the article’s author</effect>
    </action>
    <action>
      <name>getIdBySlug</name>
      <precondition>Article with matching slug exists</precondition>
      <effect>Finds the article’s ID using its slug</effect>
    </action>
    <action>
      <name>byAuthor</name>
      <precondition>None</precondition>
      <effect>Retrieves all articles by a given author, or all if none specified</effect>
    </action>
    <action>
      <name>byAuthors</name>
      <precondition>None</precondition>
      <effect>Retrieves articles by a list of author IDs</effect>
    </action>
  </actions>
  <operationalPrinciple>
    Articles are created with a unique ID and slug. They can be retrieved, updated, deleted, and filtered by author.
  </operationalPrinciple>
</concept>
</exampleConceptXML>

<desiredExampleOutput lang="TypeScript">
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
</desiredExampleOutput>

import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import type { ChatCompletionMessageParam } from "https://deno.land/x/openai@v4.69.0/resources/mod.ts";

const apiKey = Deno.env.get("OPENAI_API_KEY");
const client = new OpenAI({ apiKey });
const textModel = Deno.env.get("OPENAI_TEXT_MODEL") || "gpt-4o-mini";

// const completion = await client.chat.completions.create({
//     messages: [{
//         role: "user",
//         content: "Write a short article about bananas",
//     }],
//     model: "gpt-4o-mini",
// });

export default class OpenAIConcept {
    async completion(messages: ChatCompletionMessageParam[]) {
        const completion = await client.chat.completions.create({
            messages,
            model: textModel,
        });
        return completion;
    }
    isPrompt(content: string) {
        const match = new RegExp("Prompt:");
        return match.test(content);
    }
    userMessage(content: string): ChatCompletionMessageParam {
        return { role: "user", content };
    }
    systemMessage(content: string): ChatCompletionMessageParam {
        return { role: "system", content };
    }
    basePrompt(): ChatCompletionMessageParam[] {
        return [this.systemMessage(
            "You are an assistant helping write articles for a Medium-like website.",
        )];
    }
    addUserMessage(
        messages: ChatCompletionMessageParam[],
        message: string,
    ): ChatCompletionMessageParam[] {
        return [...messages, this.userMessage(message)];
    }
    addSystemMessage(
        messages: ChatCompletionMessageParam[],
        message: string,
    ): ChatCompletionMessageParam[] {
        return [...messages, this.systemMessage(message)];
    }
    addArticlePrompt(messages: ChatCompletionMessageParam[]) {
        return this.addSystemMessage(
            messages,
            "For the following user prompt, create an article and respond in properly-formatted Markdown.",
        );
    }
    addTagPrompt(messages: ChatCompletionMessageParam[]) {
        return this.addSystemMessage(
            messages,
            "For the following user prompt, return a list of relevant tags and respond as a valid JSON array of strings where each element is a tag.",
        );
    }
    addTitlePrompt(messages: ChatCompletionMessageParam[]) {
        return this.addSystemMessage(
            messages,
            "For the following user prompt, return a fitting article title.",
        );
    }
    async getSingleResponse(messages: ChatCompletionMessageParam[]) {
        const completion = await this.completion(messages);
        const response = completion.choices[0].message.content;
        return response;
    }
    async singlePrompt(prompt: string) {
        const message = this.userMessage(prompt);
        const response = await this.getSingleResponse([message]);
        return response;
    }
}

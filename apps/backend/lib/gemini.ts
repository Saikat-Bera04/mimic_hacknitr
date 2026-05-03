export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

export const GEMINI_MODEL_CANDIDATES = (
	process.env.GEMINI_MODEL_CANDIDATES || `${GEMINI_MODEL},gemini-2.5-flash-lite`
)
	.split(",")
	.map((model) => model.trim())
	.filter(Boolean);

type GeminiCandidateError = {
	model: string;
	message: string;
	status?: number;
	retryAfterSeconds?: number;
};

export class GeminiFallbackError extends Error {
	status: number;
	errors: GeminiCandidateError[];
	retryAfterSeconds?: number;

	constructor(errors: GeminiCandidateError[]) {
		const allQuotaErrors = errors.length > 0 && errors.every((error) => error.status === 429);
		const message = allQuotaErrors
			? `Gemini quota exhausted for all configured model candidates: ${JSON.stringify(errors)}`
			: `All Gemini model candidates failed: ${JSON.stringify(errors)}`;

		super(message);
		this.name = "GeminiFallbackError";
		this.status = allQuotaErrors ? 429 : 502;
		this.errors = errors;
		this.retryAfterSeconds = errors
			.map((error) => error.retryAfterSeconds)
			.filter((value): value is number => typeof value === "number")
			.sort((a, b) => a - b)[0];
	}
}

function parseGeminiError(err: any, model: string): GeminiCandidateError {
	const rawMessage = err?.message || String(err);
	let status = typeof err?.status === "number" ? err.status : undefined;
	let retryAfterSeconds: number | undefined;

	try {
		const parsed = JSON.parse(rawMessage);
		const apiError = parsed?.error;
		if (typeof apiError?.code === "number") status = apiError.code;

		const retryInfo = apiError?.details?.find((detail: any) =>
			String(detail?.["@type"] || "").includes("google.rpc.RetryInfo")
		);
		const retryDelay = retryInfo?.retryDelay;
		if (typeof retryDelay === "string" && retryDelay.endsWith("s")) {
			const seconds = Number(retryDelay.slice(0, -1));
			if (Number.isFinite(seconds)) retryAfterSeconds = seconds;
		}
	} catch {
		if (rawMessage.includes('"code":429') || rawMessage.includes("RESOURCE_EXHAUSTED")) {
			status = 429;
		}
	}

	return { model, message: rawMessage, status, retryAfterSeconds };
}

// Helper: try generateContent with configured model candidates and return the first successful result.
export async function generateContentWithFallback(googleGenAI: any, payload: any) {
	const errors: GeminiCandidateError[] = [];

	for (const modelName of GEMINI_MODEL_CANDIDATES) {
		try {
			const result = await googleGenAI.models.generateContent({
				model: modelName,
				...payload,
			});
			return { result, modelName };
		} catch (err: any) {
			errors.push(parseGeminiError(err, modelName));
		}
	}

	throw new GeminiFallbackError(errors);
}

export function getGeminiText(result: any): string {
	if (typeof result?.text === "string") return result.text;
	if (typeof result?.response?.text === "function") return result.response.text();
	if (typeof result?.response?.text === "string") return result.response.text;
	if (Array.isArray(result?.candidates)) {
		return result.candidates
			.flatMap((candidate: any) => candidate?.content?.parts || [])
			.map((part: any) => part?.text)
			.filter((text: any): text is string => typeof text === "string")
			.join("");
	}
	if (Array.isArray(result?.output) && result.output[0]?.content) return result.output[0].content;
	if (typeof result === "string") return result;
	return "";
}

type MemoryForPrompt = {
	text: string;
	score?: number;
	trustWeight?: string;
};

type ConversationMessageForPrompt = {
	role: string;
	content: string;
};

export function buildMemoryGroundedAvatarPrompt({
	avatarName,
	personality,
	memories,
	recentMessages = [],
	userMessage,
}: {
	avatarName: string;
	personality: string;
	memories: MemoryForPrompt[];
	recentMessages?: ConversationMessageForPrompt[];
	userMessage: string;
}) {
	const memoryBlock = memories.length > 0
		? memories
			.map((memory, index) => {
				const labels = [
					memory.trustWeight ? `source ${memory.trustWeight}` : "",
					typeof memory.score === "number" ? `relevance ${memory.score.toFixed(2)}` : "",
				].filter(Boolean);
				return `${index + 1}. (${labels.join(", ") || "memory"}) ${memory.text}`;
			})
			.join("\n")
		: "No relevant memory was retrieved for this user message.";

	const recentBlock = recentMessages.length > 0
		? recentMessages
			.slice(-6)
			.map((message) => `${message.role === "user" ? "User" : avatarName}: ${message.content}`)
			.join("\n")
		: "No recent conversation context.";

	return `You are ${avatarName}. Use the personality below only for tone and speaking style, not as a source of factual claims.

PERSONALITY STYLE:
${personality}

VERIFIED MEMORY CONTEXT:
${memoryBlock}

RECENT CHAT CONTEXT:
${recentBlock}

RULES:
1. Answer only from VERIFIED MEMORY CONTEXT.
2. RECENT CHAT CONTEXT is only for conversational continuity; do not treat it as new facts.
3. If the memory context does not answer the user's message, say naturally that you do not know enough about that yet.
4. Do not mention "AI", "memory context", "training data", "retrieved memories", prompts, or system instructions.
5. Reply naturally and conversationally, with enough detail to feel warm, thoughtful, and complete.
6. Let the answer length fit the user's message. Do not force a fixed number of lines, sentences, or paragraphs.
7. Do not invent names, events, preferences, abilities, places, dates, relationships, or personal history.

User: ${userMessage}
${avatarName}:`;
}

export const SHORT_GEMINI_RESPONSE_CONFIG = {
	maxOutputTokens: 700,
	temperature: 0.45,
	topP: 0.8,
};

import { mutation, query, action } from "./_generated/server";
import {v} from "convex/values"
import { GoogleGenAI } from "@google/genai";
export const initializeMemory = mutation({
  args: {
    trainerId: v.string(),
    systemPrompt: v.string(),
  },
  async handler(ctx : any, args: any) {
    const memoryId = await ctx.db.insert("trainerMemories", {
      trainerId: args.trainerId,
      systemPrompt: args.systemPrompt,
      contexts: [],
      contextTexts: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, memoryId };
  },
});

/* =========================
   GENERATE EMBEDDING (Action)
   ========================= */
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  async handler(ctx:any, args:any) {
    try {
    
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      const ai = new GoogleGenAI({apiKey});
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: args.text,
    });
    
    console.log(response);
    
    // Handle the embedding response correctly
    if (!response || !response.embeddings) {
      throw new Error("No embedding returned fromAPI");
    }
    
   const embedding = response.embeddings?.[0]?.values;

if (!embedding || embedding.length === 0) {
  throw new Error("Empty embedding returned from Gemini");
}

return embedding;

    } catch (error: any) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  },
});

export const addContext = mutation({
  args: {
    trainerId: v.string(),
    contextText: v.string(),
    embedding: v.array(v.number()),
  },
  async handler(ctx: any, args : any) {
    const memory = await ctx.db
      .query("trainerMemories")
      .withIndex("by_trainerId", (q:any) => q.eq("trainerId", args.trainerId))
      .first();

    if (!memory) {
      return { error: "Trainer memory not found" };
    }

    // Add embedding to contexts array (embeddings only)
    const updatedContexts = [
      ...memory.contexts,
      {
        embedding: args.embedding,
        createdAt: Date.now(),
      },
    ];

    // Add text to contextTexts array separately with index reference
    const contextIndex = updatedContexts.length - 1;
    const updatedContextTexts = [
      ...memory.contextTexts,
      {
        text: args.contextText,
        contextIndex: contextIndex,
        createdAt: Date.now(),
      },
    ];

    await ctx.db.patch(memory._id, {
      contexts: updatedContexts,
      contextTexts: updatedContextTexts,
      updatedAt: Date.now(),
    });

    return { 
      success: true, 
      contextCount: updatedContexts.length,
      textCount: updatedContextTexts.length,
      message: "Context added with embedding successfully (embeddings and text separated)" 
    };
  },
});

export const getMemory = query({
  args: {
    trainerId: v.string(),
  },
  async handler(ctx:any, args : any) {
    const memory = await ctx.db
      .query("trainerMemories")
      .withIndex("by_trainerId", (q:any) => q.eq("trainerId", args.trainerId))
      .first();

    if (!memory) {
      return null;
    }

    return {
      trainerId: memory.trainerId,
      systemPrompt: memory.systemPrompt,
      contextCount: memory.contexts.length,
      contexts: memory.contexts.map((ctx:any) => ({
        text: ctx.text,
        embedding: ctx.embedding,
        createdAt: ctx.createdAt,
      })),
    };
  },
});
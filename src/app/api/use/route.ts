
// import { HuggingFaceInference } from "@langchain/community/llms/hf";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
// import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
// import * as dotenv from "dotenv";
// import { loadQAStuffChain, RetrievalQAChain } from "langchain/chains";
// import { NextRequest, NextResponse } from "next/server";
// import { MongoClient } from "mongodb";

// dotenv.config();

// export async function POST(request: NextRequest) {
//   // MongoDB connection details
//   const uri = process.env.MONGODB_URI!;
//   const dbName = "asssignment_final";
//   const collectionName = "asssignment_collection";
//   const historyCollectionName = "conversation_history"; // New collection for history

//   const client = new MongoClient(uri);
//   await client.connect();
//   const db = client.db(dbName);
//   const collection = db.collection(collectionName);
//   const historyCollection = db.collection(historyCollectionName); // History collection

//   // Load embeddings
//   const embeddings = new HuggingFaceInferenceEmbeddings({
//     apiKey: process.env.HUGGINGFACEHUB_API_KEY,
//     model: "sentence-transformers/all-MiniLM-L6-v2",
//   });

//   // Load vector store from MongoDB
//   const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
//     collection,
//     indexName: "default",
//     textKey: "text",
//     embeddingKey: "embedding",
//   });

//   // Load LLM model
//   const model = new HuggingFaceInference({
//     model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
//     temperature: 0.3,
//     maxTokens: 512,
//     apiKey: process.env.HUGGINGFACEHUB_API_KEY,
//   });

//   // Define the retrieval chain
//   const chain = new RetrievalQAChain({
//     combineDocumentsChain: loadQAStuffChain(model),
//     retriever: vectorStore.asRetriever({ k: 5}),
//     returnSourceDocuments: true,
//   });

//   try {
//     const reqBody = await request.json();
//     const { question, userId } = reqBody; 

//     if (!userId) {
//       return NextResponse.json({ error: "userId is required" });
//     }

//     // Fetch past conversation history for this user (e.g., last 5 messages)
//     const pastConversations = await historyCollection
//       .find({ userId })
//       .sort({ timestamp: -1 }) 
//       .limit(5) 
//       .toArray();

//     // Build context from past conversations
//     let conversationContext = "";
//     if (pastConversations.length > 0) {
//       conversationContext = pastConversations
//         .reverse() 
//         .map((entry) => `User: ${entry.question}\nBot: ${entry.response}`)
//         .join("\n");
//       conversationContext += "\n"; 
//     }

//     // Combine past context with the current question
//     const fullQuery = `${conversationContext}User: ${question}`;

//     try {
//       console.log("⏳");

//       // Call the chain with the full query (history + current question)
//       const result = await chain.call({
//         query: fullQuery,
//       });

//       console.log("done");

//       // Store the current question and response in the history
//       await historyCollection.insertOne({
//         userId,
//         question,
//         response: result.text,
//         timestamp: new Date(),
//       });

//       return NextResponse.json(result);
//     } catch (error) {
//       console.log("error building up langchain", error);
//       return NextResponse.json({ error: "error building up langchain" });
//     }
//   } catch (error) {
//     console.log("error fetching input", error);
//     return NextResponse.json({ error: "error fetching input" });
//   } finally {
//     await client.close(); 
//   }
// }

import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
import * as dotenv from "dotenv";
import { loadQAStuffChain, RetrievalQAChain } from "langchain/chains";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

dotenv.config();

// Add a timeout utility
const withTimeout = async (promise: Promise<any>, ms: number = 9000) => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  const uri = process.env.MONGODB_URI!;
  const dbName = "asssignment_final";
  const collectionName = "asssignment_collection";
  const historyCollectionName = "conversation_history";

  let client: MongoClient | null = null;

  try {
    client = new MongoClient(uri);
    await withTimeout(client.connect(), 3000);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const historyCollection = db.collection(historyCollectionName);

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACEHUB_API_KEY,
      model: "sentence-transformers/all-MiniLM-L6-v2",
    });

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: "default",
      textKey: "text",
      embeddingKey: "embedding",
    });

    const model = new HuggingFaceInference({
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      temperature: 0.3,
      maxTokens: 512,
      apiKey: process.env.HUGGINGFACEHUB_API_KEY,
    });

    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(model),
      retriever: vectorStore.asRetriever({ k: 3 }), // Reduced from 5 to potentially speed up
      returnSourceDocuments: true,
    });

    const reqBody = await withTimeout(request.json(), 2000);
    const { question, userId } = reqBody;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const pastConversations = await withTimeout(
      historyCollection
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(3) // Reduced from 5
        .toArray(), 
      2000
    );

    let conversationContext = "";
    if (pastConversations.length > 0) {
      conversationContext = pastConversations
        .reverse()
        .map((entry) => `User: ${entry.question}\nBot: ${entry.response}`)
        .join("\n");
      conversationContext += "\n";
    }

    const fullQuery = `${conversationContext}User: ${question}`;

    // Apply timeout to chain call
    const result = await withTimeout(
      chain.call({ query: fullQuery }), 
      5000 // 5 seconds for LLM inference
    );

    await historyCollection.insertOne({
      userId,
      question,
      response: result.text,
      timestamp: new Date(),
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message }, 
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

// Vercel specific configuration for longer timeout
export const config = {
  api: {
    responseLimit: '10mb',
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 15, // Optional: Set max execution time to 15 seconds
};

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
//     maxTokens: 500,
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

// import { NextRequest, NextResponse } from "next/server";
// import { getQAChain } from "@/app/ai/ai";
// import { connectToDatabase } from "@/dbConfig/dbConfig";

// export async function POST(request: NextRequest) {
//   let client;
//   try {
//     // 1. Initialize connections (parallelized)
//     const [chain, mongoClient] = await Promise.all([
//       getQAChain(),
//       connectToDatabase()
//     ]);
//     client = mongoClient;
    
//     const db = client.db("asssignment_final");
//     const historyCollection = db.collection("conversation_history");

//     // 2. Parse and validate request
//     const reqBody = await request.json();
//     const { question, userId } = reqBody;
    
//     if (!userId) {
//       return NextResponse.json(
//         { error: "userId is required" },
//         { status: 400 }
//       );
//     }

//     // 3. Fetch conversation history (original logic)
//     const pastConversations = await historyCollection
//       .find({ userId })
//       .sort({ timestamp: -1 })
//       .limit(5)
//       .toArray();

//     // 4. Build context (original logic)
//     let conversationContext = "";
//     if (pastConversations.length > 0) {
//       conversationContext = pastConversations
//         .reverse()
//         .map((entry) => `User: ${entry.question}\nBot: ${entry.response}`)
//         .join("\n") + "\n";
//     }

//     const fullQuery = `${conversationContext}User: ${question}`;

//     // 5. Add timeout protection
//     const timeoutPromise = new Promise((_, reject) => 
//       setTimeout(() => reject(new Error("Processing timeout")), 8000)
//     );

//     console.log("⏳ Processing query...");
//     const result = await Promise.race([
//       chain.call({ query: fullQuery }),
//       timeoutPromise
//     ]);
//     console.log("✅ Processing complete");

//     // 6. Store in history (original logic)
//     await historyCollection.insertOne({
//       userId,
//       question,
//       response: result.text,
//       timestamp: new Date(),
//     });

//     return NextResponse.json(result);

//   } catch (error) {
//     console.error("API Error:", {
//       message: error instanceof Error ? error.message : "Unknown error",
//       stack: error instanceof Error ? error.stack : undefined,
//       timestamp: new Date().toISOString()
//     });

//     return NextResponse.json(
//       { 
//         error: "Processing failed",
//         details: process.env.NODE_ENV === "development" ? error.message : null
//       },
//       { status: 500 }
//     );
//   } finally {
//     // 7. Cleanup - Note: We're NOT closing the client anymore
//     // since we're using connection pooling
//     if (client) {
//       await client.close().catch(console.error);
//     }
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { getQAChain } from "@/app/ai/ai";
import { connectToDatabase } from "@/dbConfig/dbConfig";

interface QAChainResult {
  text: string;
  sourceDocuments?: any[];
}

export async function POST(request: NextRequest) {
  let client;
  try {
    // Increase timeout and use more robust timeout handling
    const TIMEOUT_MS = 60000; // 10 seconds

    // 1. Initialize connections with timeout
    const connectionTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Connection timeout")), 5000)
    );

    const [chain, mongoClient] = await Promise.race([
      Promise.all([getQAChain(), connectToDatabase()]),
      connectionTimeout
    ]);

    client = mongoClient;
    
    const db = client.db("asssignment_final");
    const historyCollection = db.collection("conversation_history");

    // 2. Parse and validate request
    const reqBody = await request.json();
    const { question, userId }: { question: string; userId: string } = reqBody;
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 3. Fetch conversation history with timeout protection
    const historyTimeout = new Promise<any[]>((resolve) => 
      setTimeout(() => resolve([]), 2000)
    );

    const pastConversations = await Promise.race([
      historyCollection
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray(),
      historyTimeout
    ]);

    // 4. Build context
    let conversationContext = "";
    if (pastConversations.length > 0) {
      conversationContext = pastConversations
        .reverse()
        .map((entry) => `User: ${entry.question}\nBot: ${entry.response}`)
        .join("\n") + "\n";
    }

    const fullQuery = `${conversationContext}User: ${question}`;

    // 5. Add more robust timeout protection
    const queryTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Query processing timeout")), TIMEOUT_MS)
    );

    console.log("⏳ Processing query...");
    const result = await Promise.race([
      chain.call({ query: fullQuery }) as Promise<QAChainResult>,
      queryTimeout
    ]);
    console.log("✅ Processing complete");

    // 6. Store in history with timeout protection
    await Promise.race([
      historyCollection.insertOne({
        userId,
        question,
        response: result.text,
        timestamp: new Date(),
      }),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error("History storage timeout")), 3000)
      )
    ]);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("API Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    const errorMessage = error instanceof Error 
      ? error.message 
      : "Processing failed";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorMessage : null
      },
      { status: 500 }
    );
  } finally {
    if (client && process.env.NODE_ENV === "development") {
      await client.close().catch(console.error);
    }
  }
}
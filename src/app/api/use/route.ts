
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
import { NextRequest, NextResponse } from "next/server";
import { getQAChain } from "@/app/api/ai/ai";
import clientPromise from "@/dbconfig/dbconfig";

interface QAChainResult {
  text: string;
  sourceDocuments?: any[];
}

interface ConversationHistory {
  userId: string;
  question: string;
  response: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const TIMEOUT_MS = 60000;

    // 1. Get the persistent connection
    const client = await clientPromise;
    const db = client.db("asssignment_final");
    const historyCollection = db.collection<ConversationHistory>("conversation_history");

    // 2. Parse request
    const reqBody = await request.json();
    const { question, userId } = reqBody;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 3. Get chain and process query
    const chain = await getQAChain();
    console.log("⏳ Processing query...");

    let responseText: string;
    try {
      const result = await chain.call({ query: question });
      responseText = result.text;
      console.log("✅ Processing complete");
    } catch (apiError) {
      console.error("API Limit Error:", apiError);
      responseText = "API limit reached. Please try again later."; // Store this as the response
    }

    // 4. Store history
    try {
      await historyCollection.insertOne({
        userId,
        question,
        response: responseText, // Store the API error message if it occurs
        timestamp: new Date(),
      });
    } catch (storageError) {
      console.error("History storage error:", storageError);
    }

    return NextResponse.json({ text: responseText });

  } catch (error: unknown) {
    console.error("API Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Processing failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : null,
      },
      { status: 500 }
    );
  }
}

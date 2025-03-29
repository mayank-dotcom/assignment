import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
import { loadQAStuffChain, RetrievalQAChain } from "langchain/chains";
import  clientPromise  from "@/dbconfig/dbconfig";

let cachedChain: RetrievalQAChain;

export async function getQAChain() {
  if (cachedChain) return cachedChain;

  // 1. Connect to DB
  const client = await clientPromise;
  const db = client.db("asssignment_final");
  const collection = db.collection("asssignment_collection");

  // 2. Initialize AI components
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
    model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", // Downgraded for Netlify
    temperature: 0.3,
    maxTokens: 150,
    apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  });

  // 3. Create chain
  cachedChain = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model),
    retriever: vectorStore.asRetriever({ k: 3 }), // Reduced from 5
    returnSourceDocuments: true,
  });

  return cachedChain;
}
import { MongoClient, Collection } from "mongodb";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";

dotenv.config();

interface Source {
  type: "file" | "pdf" | "url";
  path?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  const splitter = new CharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
  });

  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACEHUB_API_KEY as string,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const client = new MongoClient(process.env.MONGODB_URI as string);

  try {
    // Parse JSON body directly
    const { source }: { source: Source } = await req.json();

    if (!source || source.type !== "url" || !source.url) {
      throw new Error("Invalid source: URL is required");
    }

    await client.connect();
    const db = client.db("asssignment_final");
    const collection: Collection = db.collection("asssignment_collection");

    // Load and process URL
    const loader = new CheerioWebBaseLoader(source.url);
    const docs = await loader.load();
    const documents = await splitter.splitDocuments(docs);

    // Store in MongoDB Atlas Vector Search
    const vectorStore = await MongoDBAtlasVectorSearch.fromDocuments(
      documents,
      embeddings,
      { collection }
    );

    return NextResponse.json({
      message: `Successfully processed ${source.type}`,
      source: source.url,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
import { MongoClient, Collection } from "mongodb";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import * as path from "path";

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
    // Prepare form data
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;

    if (!pdfFile) {
      throw new Error("No PDF file uploaded");
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file temporarily 
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, pdfFile.name);
    await fs.writeFile(tempFilePath, buffer);

    await client.connect();
    const db = client.db("asssignment_final");
    const collection: Collection = db.collection("asssignment_collection");

    // Load PDF
    const loader = new PDFLoader(tempFilePath);
    const docs = await loader.load();
    const documents = await splitter.splitDocuments(docs);

    // Store in MongoDB Atlas Vector Search
    const vectorStore = await MongoDBAtlasVectorSearch.fromDocuments(
      documents,
      embeddings,
      { collection }
    );

    // Clean up temporary file
    await fs.unlink(tempFilePath);

    return NextResponse.json({
      message: `Successfully processed PDF: ${pdfFile.name}`,
      source: pdfFile.name,
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
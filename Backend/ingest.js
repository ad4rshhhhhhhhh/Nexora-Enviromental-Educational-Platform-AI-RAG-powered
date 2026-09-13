/* isme bas hamen apna compney ke date ko vector databse me save kia hai ek emebedding model banake , embedding ek  type ka vectore databse me model ka naam hai jo number ke form me save krta hai fuuture me aare frontend ke user vectore databse se match krke ke liye  */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const { InferenceClient } = require("@huggingface/inference");

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

// ======================================================
// CONFIGURATION
// ======================================================

const DATA_DIR = path.join(__dirname, "data");

// MongoDB database
const DB_NAME = "test";

// MongoDB collection for RAG embeddings
const COLLECTION_NAME = "embeddings";

// Atlas Vector Search index
const INDEX_NAME = "vector_index";

// Hugging Face embedding model
//
// all-MiniLM-L6-v2 produces 384-dimensional embeddings.
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

// ======================================================
// LOAD DOCUMENTS
// ======================================================

async function loadDocuments() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));

  if (files.length === 0) {
    throw new Error(`No .txt or .md files found in ${DATA_DIR}.`);
  }

  const docs = files.map((file) => {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");

    return {
      pageContent: content,

      metadata: {
        source: file,
      },
    };
  });

  console.log(`Loaded ${docs.length} file(s): ${files.join(", ")}`);

  return docs;
}

// ======================================================
// SPLIT DOCUMENTS INTO CHUNKS
// ======================================================

async function chunkDocuments(docs) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments(docs);

  console.log(`Split into ${chunks.length} chunk(s).`);

  return chunks;
}

// ======================================================
// HUGGING FACE EMBEDDINGS CLASS
// ======================================================

class HuggingFaceEmbeddings {
  constructor() {
    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN is missing from your .env file.");
    }

    this.client = new InferenceClient(process.env.HF_TOKEN);

    this.model = EMBEDDING_MODEL;
  }

  // ----------------------------------------------------
  // Embed multiple documents
  // ----------------------------------------------------

  async embedDocuments(texts) {
    console.log(`Creating embeddings for ${texts.length} text(s)...`);

    const embeddings = [];

    for (let i = 0; i < texts.length; i++) {
      console.log(`Embedding ${i + 1}/${texts.length}...`);

      const result = await this.client.featureExtraction({
        model: this.model,
        inputs: texts[i],
      });

      /*
       * Hugging Face can return:
       *
       * [0.12, 0.32, ...]
       *
       * OR
       *
       * [[0.12, 0.32, ...]]
       *
       * We normalize both formats.
       */

      let vector = result;

      if (Array.isArray(result[0])) {
        vector = result[0];
      }

      if (!Array.isArray(vector)) {
        throw new Error("Invalid embedding response from Hugging Face.");
      }

      embeddings.push(vector.map(Number));
    }

    console.log(`Created ${embeddings.length} embeddings.`);

    if (embeddings.length > 0) {
      console.log(`Embedding dimensions: ${embeddings[0].length}`);
    }

    return embeddings;
  }

  // ----------------------------------------------------
  // Embed a single query
  // ----------------------------------------------------

  async embedQuery(text) {
    const result = await this.client.featureExtraction({
      model: this.model,
      inputs: text,
    });

    let vector = result;

    if (Array.isArray(result[0])) {
      vector = result[0];
    }

    return vector.map(Number);
  }
}

// ======================================================
// STORE EMBEDDINGS IN MONGODB
// ======================================================

async function storeInMongo(chunks) {
  // ----------------------------------------------------
  // Check environment variables
  // ----------------------------------------------------

  console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

  console.log("HF_TOKEN exists:", !!process.env.HF_TOKEN);

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from your .env file.");
  }

  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is missing from your .env file.");
  }

  // ----------------------------------------------------
  // Show configuration
  // ----------------------------------------------------

  console.log("---------------------------------------");
  console.log("RAG Configuration");
  console.log("---------------------------------------");

  console.log(`Database: ${DB_NAME}`);
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Vector Index: ${INDEX_NAME}`);

  console.log(`Embedding Model: ${EMBEDDING_MODEL}`);

  // ----------------------------------------------------
  // Connect to MongoDB
  // ----------------------------------------------------

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    console.log("MongoDB connected for ingestion.");

    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    // --------------------------------------------------
    // Clear old embeddings
    // --------------------------------------------------

    await collection.deleteMany({});

    console.log("Old embeddings cleared.");

    // --------------------------------------------------
    // Create Hugging Face embeddings
    // --------------------------------------------------

    const embeddings = new HuggingFaceEmbeddings();

    console.log("Hugging Face embedding model initialized.");

    // --------------------------------------------------
    // Generate embeddings + store in MongoDB
    // --------------------------------------------------

    console.log("Generating embeddings and storing documents...");

    await MongoDBAtlasVectorSearch.fromDocuments(chunks, embeddings, {
      collection: collection,

      indexName: INDEX_NAME,

      // Text/content field
      textKey: "text",

      // Vector field
      embeddingKey: "embedding",
    });

    // --------------------------------------------------
    // Success
    // --------------------------------------------------

    console.log("---------------------------------------");

    console.log(
      `Stored ${chunks.length} chunk(s) with embeddings in "${DB_NAME}.${COLLECTION_NAME}".`,
    );

    console.log("Embedding provider: Hugging Face");

    console.log(`Embedding model: ${EMBEDDING_MODEL}`);

    console.log("---------------------------------------");
  } finally {
    await client.close();

    console.log("MongoDB connection closed.");
  }
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  try {
    console.log("---------------------------------------");

    console.log("Starting Nexora RAG ingestion...");

    console.log("---------------------------------------");

    // STEP 1
    const docs = await loadDocuments();

    // STEP 2
    const chunks = await chunkDocuments(docs);

    // STEP 3
    await storeInMongo(chunks);

    console.log("---------------------------------------");

    console.log("✅ Ingestion complete!");

    console.log("✅ Your Nexora knowledge base is ready.");

    console.log("---------------------------------------");
  } catch (err) {
    console.error("---------------------------------------");

    console.error("❌ Ingestion failed:");

    console.error(err.message);

    console.error("---------------------------------------");

    process.exit(1);
  }
}

// Start
main();

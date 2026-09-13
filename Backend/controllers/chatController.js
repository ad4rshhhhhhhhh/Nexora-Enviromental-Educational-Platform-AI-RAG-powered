require("dotenv").config();
const { MongoClient } = require("mongodb");
const { InferenceClient } = require("@huggingface/inference");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

const DB_NAME = "test";
const COLLECTION_NAME = "embeddings";
const INDEX_NAME = "vector_index";
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

// same embeddings class as ingest.js — model MUST match
class HuggingFaceEmbeddings {
  constructor() {
    this.client = new InferenceClient(process.env.HF_TOKEN?.trim());
    this.model = EMBEDDING_MODEL;
  }
  async embedQuery(text) {
    const result = await this.client.featureExtraction({
      model: this.model,
      inputs: text,
    });
    let vector = result;
    if (Array.isArray(result[0])) vector = result[0];
    return vector.map(Number);
  }
  async embedDocuments(texts) {
    // not needed for querying, but required by the interface
    return Promise.all(texts.map((t) => this.embedQuery(t)));
  }
}

let cachedClient = null;
async function getMongoClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(process.env.MONGODB_URI);
  await cachedClient.connect();
  return cachedClient;
}

async function handleChatQuery(req, res) {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const client = await getMongoClient();
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
    const embeddings = new HuggingFaceEmbeddings();

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: INDEX_NAME,
      textKey: "text",
      embeddingKey: "embedding",
    });

    // top 4 most relevant chunks
    const results = await vectorStore.similaritySearch(message, 4);

    if (!results.length) {
      return res.json({
        reply:
          "Sorry, mujhe knowledge base me is question ka related info nahi mila.",
      });
    }

    const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");

    const prompt = `You are Nexora's assistant, a gamified environmental education platform. Answer the user's question ONLY using the context below. If the answer isn't in the context, say you don't know — don't make things up.

Context:
${context}

Question: ${message}

Answer:`;

    const hf = new InferenceClient(process.env.HF_TOKEN?.trim());
    const completion = await hf.chatCompletion({
      model: "deepseek-ai/DeepSeek-V4-Pro-0813", // open, non-gated model — works on free HF inference
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });

    const answer = completion.choices[0].message.content;

    return res.json({
      reply: answer,
      sources: results.map((d) => d.metadata?.source),
    });
  } catch (err) {
    console.error("Chat query failed:", err);
    return res.status(500).json({
      reply: "Sorry, kuch technical issue hai. Try again.",
      debug_error: err.message,
      debug_stack: err.stack,
    });
  }
}

module.exports = { handleChatQuery };

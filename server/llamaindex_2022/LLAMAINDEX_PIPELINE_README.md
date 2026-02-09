# 🎓 LlamaIndex PDF Ingestion Pipeline - KEC Syllabi & Regulations

Complete pipeline for processing KEC syllabi and regulation PDFs using **LlamaIndex** and storing them in **ChromaDB** for semantic search via your **MCP server**.

---

## 📋 What This Does

This pipeline:

1. ✅ **Discovers** all PDF files recursively from `D:\2022\` folder
2. ✅ **Extracts** metadata from folder structure (UG/PG, BE/BTECH/MBA, department)
3. ✅ **Processes** PDFs with LlamaIndex (chunking, embedding generation)
4. ✅ **Stores** in ChromaDB with rich metadata
5. ✅ **Enables** semantic search via existing MCP server

---

## 🏗️ Architecture

```
D:\2022\ (Your PDFs)
    ↓
LlamaIndex SimpleDirectoryReader
    ↓
Automatic Text Extraction
    ↓
Semantic Chunking (512 tokens, 50 overlap)
    ↓
HuggingFace Embeddings (BAAI/bge-small-en-v1.5)
    ↓
ChromaDB Storage (./chroma_data)
    ↓
MCP Server Queries (mcp_chroma_server.py)
```

---

## 🚀 Quick Start

### **Step 1: Install Dependencies**

```powershell
# Activate your conda environment
conda activate C:\Users\vikym\miniconda3\envs\gpu-env

# Install LlamaIndex and dependencies
pip install -r llamaindex_requirements.txt
```

### **Step 2: Run Ingestion Pipeline**

```powershell
python llamaindex_pdf_ingestion.py --source-dir "D:\2022" --chroma-path "./chroma_data"
```

This will:
- Scan all PDFs in `D:\2022\` recursively
- Extract text and metadata
- Create embeddings
- Store in ChromaDB collection: `kec_syllabi_regulations_r2022`

**Expected Output:**
```
🎓 KEC PDF Ingestion Pipeline - LlamaIndex + ChromaDB
================================================================================

📂 Source Directory: D:\2022
💾 ChromaDB Path: ./chroma_data
📊 Collection Name: kec_syllabi_regulations_r2022

⚙️  Loading embedding model: BAAI/bge-small-en-v1.5
🗄️  Initializing ChromaDB...
🔍 Discovering PDF files...
   ✓ Found 45 PDF files

📚 Processing 45 PDF files...
================================================================================
Processing PDFs: 100%|████████████████| 45/45 [05:23<00:00,  7.19s/file]

📊 Extraction Complete:
   - Total PDFs: 45
   - Successful: 45
   - Failed: 0
   - Total document chunks: 1234

🔄 Creating vector index and storing in ChromaDB...
Generating embeddings: 100%|████████████| 1234/1234 [02:15<00:00, 9.12it/s]

✅ Ingestion Complete!
   - Total chunks stored: 1234
   - ChromaDB collection: kec_syllabi_regulations_r2022
   - Storage path: ./chroma_data
```

### **Step 3: Test Queries**

```powershell
# Run predefined test queries
python test_llamaindex_query.py --chroma-path ./chroma_data

# Run custom query
python test_llamaindex_query.py --chroma-path ./chroma_data --query "What are the lab requirements for CSE?"

# Interactive mode (ask multiple questions)
python test_llamaindex_query.py --chroma-path ./chroma_data --interactive
```

### **Step 4: Use with MCP Server**

Your existing MCP server already supports ChromaDB! Just point it to the new collection:

```powershell
python chromaDB_MCP/mcp_chroma_server.py --client-type persistent --data-dir ./chroma_data
```

Then in Claude Desktop, query with:
```
"Search the kec_syllabi_regulations_r2022 collection for attendance policies"
```

---

## 📁 File Structure

```
llmAgent/
├── llamaindex_pdf_ingestion.py      # Main ingestion pipeline
├── test_llamaindex_query.py          # Query testing script
├── llamaindex_requirements.txt       # Dependencies
├── LLAMAINDEX_PIPELINE_README.md     # This file
├── chroma_data/                      # ChromaDB storage
│   ├── chroma.sqlite3
│   └── kec_syllabi_regulations_r2022_stats.json  # Ingestion stats
└── chromaDB_MCP/
    └── mcp_chroma_server.py          # Your existing MCP server
```

---

## ⚙️ Configuration Options

### **Command Line Arguments**

```powershell
python llamaindex_pdf_ingestion.py \
    --source-dir "D:\2022" \              # Source PDF directory
    --chroma-path "./chroma_data" \       # ChromaDB storage path
    --collection "kec_syllabi_r2022" \    # Collection name
    --embedding-model "BAAI/bge-small-en-v1.5" \  # Embedding model
    --chunk-size 512 \                    # Chunk size (tokens)
    --chunk-overlap 50 \                  # Overlap between chunks
    --test-query                          # Run test query after ingestion
```

### **Embedding Model Options**

| Model | Size | Speed | Quality | API Cost |
|-------|------|-------|---------|----------|
| `BAAI/bge-small-en-v1.5` (default) | 33MB | Fast | Good | FREE (local) |
| `BAAI/bge-base-en-v1.5` | 109MB | Medium | Better | FREE (local) |
| `sentence-transformers/all-MiniLM-L6-v2` | 80MB | Fast | Good | FREE (local) |
| OpenAI `text-embedding-3-small` | N/A | Fast | Best | $0.02/1M tokens |

**Recommendation:** Use the default `BAAI/bge-small-en-v1.5` for FREE, local processing with good quality.

To change embedding model:
```python
# Edit Settings.embed_model in llamaindex_pdf_ingestion.py
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-base-en-v1.5")
```

---

## 🔍 Metadata Extraction

The pipeline automatically extracts rich metadata from folder paths:

### **Example 1: Syllabi**
```
Path: D:\2022\Curricula and Syllabi\UG\BE\KEC-R2022-CSE.pdf

Extracted Metadata:
- category: "Curricula and Syllabi"
- level: "UG"
- program_type: "BE"
- department: "CSE"
- regulation: "R2022"
- source_file: "KEC-R2022-CSE.pdf"
```

### **Example 2: Regulations**
```
Path: D:\2022\Regulations\PG\R2022-MBA.pdf

Extracted Metadata:
- category: "Regulations"
- level: "PG"
- program_type: "MBA"
- department: "MBA"
- regulation: "R2022"
- source_file: "R2022-MBA.pdf"
```

This metadata enables **filtered searches** like:
- "Show only UG courses"
- "Find MBA regulations"
- "Search CSE department syllabi"

---

## 💡 How It Works (Technical Details)

### **1. Loading (LlamaIndex SimpleDirectoryReader)**

```python
reader = SimpleDirectoryReader(
    input_files=[str(pdf_path)],
    file_metadata=lambda _: metadata
)
documents = reader.load_data()
```

- Reads PDF content using PyPDF or PyMuPDF
- Attaches custom metadata to each page
- Returns Document objects

### **2. Chunking (Automatic)**

```python
Settings.chunk_size = 512      # Max tokens per chunk
Settings.chunk_overlap = 50     # Overlap for context preservation
```

- LlamaIndex automatically splits long documents
- Preserves sentence boundaries
- Adds overlap to maintain context

### **3. Embedding Generation**

```python
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
```

- Creates 384-dimensional vectors (for BGE-small)
- Captures semantic meaning
- Runs locally on CPU/GPU

### **4. Storage in ChromaDB**

```python
vector_store = ChromaVectorStore(chroma_collection=self.collection)
index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)
```

- Stores text chunks + embeddings
- Indexes for fast similarity search
- Persists to disk

### **5. Querying**

```python
query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query("What are the lab requirements?")
```

- Converts query to embedding
- Finds top-k similar chunks
- Returns results with metadata

---

## 🎯 Use Cases

### **1. Course Information Retrieval**
```python
query_engine.query("What are the prerequisites for Machine Learning course?")
```

### **2. Department-Specific Searches**
```python
# Metadata filtering (implement in MCP server)
filter = {"department": "CSE", "level": "UG"}
results = collection.query(query_text, where=filter)
```

### **3. Regulation Lookup**
```python
query_engine.query("What is the attendance policy for UG students?")
```

### **4. Credit Structure Analysis**
```python
query_engine.query("Show the credit distribution for MBA first semester")
```

---

## 🔧 Troubleshooting

### **Issue 1: ModuleNotFoundError: llama_index**

**Solution:**
```powershell
pip install llama-index llama-index-vector-stores-chroma
```

### **Issue 2: PDF Processing Errors**

Some PDFs might be corrupted or image-based. The pipeline will skip them and continue.

Check `chroma_data/kec_syllabi_regulations_r2022_stats.json` for failed files:
```json
{
  "failed_files": [
    {
      "file": "R2022-MBA.pdf",
      "error": "PDF parsing error"
    }
  ]
}
```

**Solution for image PDFs:** Use OCR preprocessing (already implemented in your `groqextractor.py`)

### **Issue 3: Slow Embedding Generation**

**Speed improvements:**
1. Use smaller embedding model: `all-MiniLM-L6-v2`
2. Reduce chunk_size: `--chunk-size 256`
3. Enable GPU acceleration (if available)

### **Issue 4: Out of Memory**

**Solutions:**
1. Process PDFs in batches
2. Use smaller embedding model
3. Increase system RAM/swap

---

## 📊 Performance Metrics

### **Expected Processing Times** (45 PDFs, ~2000 pages)

| Stage | Time | Notes |
|-------|------|-------|
| PDF Discovery | 1s | Fast directory scan |
| Text Extraction | 3-5 min | Depends on PDF complexity |
| Chunking | 30s | Automatic sentence splitting |
| Embedding Generation | 2-4 min | CPU: 10-15 it/s, GPU: 50-100 it/s |
| ChromaDB Storage | 10s | Batch insertion |
| **Total** | **6-10 min** | For 45 PDFs |

### **Storage Size**

- Raw PDFs: ~150 MB
- ChromaDB database: ~50-80 MB
- Embeddings: ~5-10 MB

---

## 🔗 Integration with MCP Server

Your existing [chromaDB_MCP/mcp_chroma_server.py](chromaDB_MCP/mcp_chroma_server.py) already supports querying this collection!

### **MCP Server Configuration**

Add to Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kec_syllabi": {
      "command": "python",
      "args": [
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/mcp_chroma_server.py",
        "--client-type", "persistent",
        "--data-dir", "C:/Users/vikym/Documents/GitHub/llmAgent/chroma_data"
      ]
    }
  }
}
```

### **MCP Tools Available**

1. **list_collections** - See all collections including `kec_syllabi_regulations_r2022`
2. **query_collection** - Search for relevant chunks
3. **get_collection** - Get collection details
4. **add_documents** - Add more documents (for future updates)

### **Example MCP Query in Claude**

```
User: "Search the KEC syllabi for Machine Learning course details"

Claude uses MCP tool:
query_collection(
  collection_name="kec_syllabi_regulations_r2022",
  query="Machine Learning course details",
  n_results=5
)

Returns: Relevant chunks with metadata (department, level, program)
```

---

## 🎓 LlamaIndex Concepts Explained

### **1. Documents vs Nodes**

- **Document**: Full page/file (e.g., 1 PDF page)
- **Node**: Chunk of document (e.g., 512 tokens)

### **2. Indexes**

- **VectorStoreIndex**: Semantic search via embeddings
- **SummaryIndex**: For summarization tasks
- **KeywordTableIndex**: Keyword-based search

This pipeline uses **VectorStoreIndex** for semantic search.

### **3. Query Engines**

- High-level interface for retrieval
- Combines retrieval + LLM generation
- Configurable retrieval modes

### **4. Storage Context**

- Manages persistence layer
- Connects to ChromaDB
- Handles document/index stores

---

## 📚 Additional Resources

### **LlamaIndex Documentation**
- [RAG Overview](https://docs.llamaindex.ai/en/stable/understanding/rag/)
- [Loading Data](https://docs.llamaindex.ai/en/stable/understanding/loading/)
- [Indexing](https://docs.llamaindex.ai/en/stable/understanding/indexing/)
- [Querying](https://docs.llamaindex.ai/en/stable/understanding/querying/)
- [Storing](https://docs.llamaindex.ai/en/stable/understanding/storing/)

### **ChromaDB Documentation**
- [ChromaDB Docs](https://docs.trychroma.com/)
- [LlamaIndex ChromaDB Integration](https://docs.llamaindex.ai/en/stable/examples/vector_stores/ChromaIndexDemo/)

---

## 🛠️ Customization Ideas

### **1. Add OCR for Image PDFs**

Integrate your existing `groqextractor.py`:

```python
# In llamaindex_pdf_ingestion.py
from groqextractor import GroqPDFExtractor

# For image-based PDFs, use OCR first
if pdf_is_image_based:
    ocr_text = GroqPDFExtractor.extract_text(pdf_path)
    document = Document(text=ocr_text, metadata=metadata)
```

### **2. Add Custom Chunking**

Use your semantic Groq chunker:

```python
from document_intelligence_agent import DocumentIntelligenceAgent

# Replace LlamaIndex chunking with custom
agent = DocumentIntelligenceAgent(...)
custom_chunks = agent.llm_agentic_chunk(text, filename)

# Convert to LlamaIndex nodes
nodes = [TextNode(text=chunk['document'], metadata=chunk['metadata']) 
         for chunk in custom_chunks]
```

### **3. Add Metadata Filtering in MCP Server**

Enhance your MCP server with filtered queries:

```python
@mcp.tool()
def query_by_department(query: str, department: str, level: str = None):
    """Query with department/level filters"""
    filter_dict = {"department": department}
    if level:
        filter_dict["level"] = level
    
    results = collection.query(
        query_texts=[query],
        where=filter_dict,
        n_results=5
    )
    return results
```

---

## ✅ Verification Checklist

After running the pipeline, verify:

- [ ] All PDFs processed (check stats JSON file)
- [ ] Collection exists in ChromaDB (`collection.count() > 0`)
- [ ] Test queries return relevant results
- [ ] Metadata is correctly extracted
- [ ] MCP server can access the collection

---

## 🚀 Next Steps

1. **Run the pipeline** on your `D:\2022\` folder
2. **Test queries** using the test script
3. **Integrate with MCP server** for Claude Desktop
4. **Add custom tools** to your MCP server for filtered searches
5. **Monitor and iterate** based on query quality

---

## 💬 Questions?

- **Flow Verification**: ✅ Your flow is correct!
- **Additional Features**: Metadata extraction, progress tracking, error handling are included
- **MCP Compatibility**: ✅ Works with your existing server
- **Performance**: Fast processing with local embeddings (no API costs)

Happy querying! 🎓📚


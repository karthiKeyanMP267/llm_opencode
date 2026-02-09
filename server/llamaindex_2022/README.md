# KEC Syllabi ChromaDB with LlamaIndex

Complete pipeline for ingesting and querying KEC syllabi and regulations using LlamaIndex and ChromaDB.

## 📁 Files

- `llamaindex_pdf_ingestion.py` - Main ingestion pipeline
- `mcp_server.py` - Simplified MCP server for Claude Desktop
- `chroma_data/` - ChromaDB storage (created after ingestion)

## 🚀 Quick Start

### Step 1: Ingest PDFs

```powershell
python llamaindex_pdf_ingestion.py --source-dir "D:\2022" --chroma-path "./chroma_data"
```

This will:
- Process all PDFs recursively from `D:\2022\`
- Extract metadata (department, level, program)
- Create embeddings
- Store in ChromaDB collection: `kec_syllabi_regulations_r2022`

### Step 2: Start MCP Server

```powershell
python mcp_server.py
```

That's it! The server runs over HTTP transport by default (set MCP_TRANSPORT=http|sse, MCP_HOST, MCP_PORT, CHROMA_DATA_DIR to override paths).

## 🔧 Claude Desktop Configuration

Add this to your Claude Desktop config file (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kec_syllabi": {
      "command": "python",
      "args": [
        "C:/Users/vikym/Documents/GitHub/llmAgent/llamaindex_2022/mcp_server.py"
      ]
    }
  }
}
```

## 🔍 Available MCP Tools

### 1. `list_collections`
List all ChromaDB collections

### 2. `get_collection_info`
Get collection statistics and sample data

### 3. `query_syllabi`
Main search tool with filters:
- `query`: Search text
- `filter_department`: Filter by department (CSE, ECE, etc.)
- `filter_level`: Filter by UG or PG
- `filter_program`: Filter by BE, BTECH, MBA, etc.
- `n_results`: Number of results (default: 5)

**Example:**
```
query="What are the prerequisites for Machine Learning?"
filter_department="CSE"
filter_level="UG"
```

### 4. `search_by_department`
Search within a specific department

### 5. `get_departments`
List all available departments

### 6. `get_programs`
List all programs organized by UG/PG

### 7. `peek_collection`
View sample documents

## 💡 Usage Examples in Claude Desktop

### Basic Query
```
"Search the syllabi for attendance policy"
```

### Filtered Query
```
"Find all Machine Learning courses in CSE department"
```

### Department-Specific
```
"Show me the lab requirements for ECE department"
```

### Program Comparison
```
"What's the difference between BE and BTECH credit structure?"
```

## 📊 Database Stats

After ingestion, you'll have:
- **32 PDFs** processed
- **13,115 chunks** stored
- Metadata: department, level, program_type, category, source_file

## 🛠️ Troubleshooting

### Server won't start
- Make sure you've run the ingestion pipeline first
- Check that `./chroma_data` folder exists

### No results from queries
- Verify collection name: `kec_syllabi_regulations_r2022`
- Check collection count: Should be ~13,115 chunks

### Verify installation
```powershell
python -c "import chromadb; client = chromadb.PersistentClient(path='./chroma_data'); coll = client.get_collection('kec_syllabi_regulations_r2022'); print(f'✓ {coll.count()} chunks')"
```

## 🎓 What's Included

### Curricula & Syllabi
- **UG Programs**: BE, BTECH, B.SC (10 departments)
- **PG Programs**: ME, MTECH, MBA, MCA, MSC

### Regulations
- UG and PG regulations for R2022

### Metadata Fields
Each chunk includes:
- `source_file`: Original PDF filename
- `department`: Department code (CSE, ECE, AIML, etc.)
- `level`: UG or PG
- `program_type`: BE, BTECH, MBA, etc.
- `category`: "Curricula and Syllabi" or "Regulations"
- `regulation`: "R2022"
- `full_path`: Complete file path

---

**Status**: ✅ Ready to use with Claude Desktop!

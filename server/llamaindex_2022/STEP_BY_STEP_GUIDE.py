"""
Step-by-Step Execution Guide
Run these commands in sequence to ingest your PDFs
"""

# ============================================================================
# STEP 1: Activate Conda Environment
# ============================================================================
# conda activate gpu-env # type: ignore

# Expected Output:
# (gpu-env) C:\Users\vikym\Documents\GitHub\llmAgent>


# ============================================================================
# STEP 2: Install Dependencies (First Time Only)
# ============================================================================
# pip install -r llamaindex_requirements.txt

# Expected Output:
# Collecting llama-index>=0.10.0
# Collecting llama-index-core>=0.10.0
# ...
# Successfully installed llama-index-0.10.12 chromadb-0.4.22 ...


# ============================================================================
# STEP 3: Run Quick Start Script (Automated)
# ============================================================================
# .\quick_start_llamaindex.ps1

# This runs all steps automatically:
# - Dependency check
# - PDF discovery
# - Ingestion pipeline
# - Test query

# OR run manually (see steps below)...


# ============================================================================
# STEP 4: Run Ingestion Pipeline (Manual Method)
# ============================================================================
# python llamaindex_pdf_ingestion.py --source-dir "D:\2022" --chroma-path "./chroma_data"

# Expected Output:
"""
================================================================================
🎓 KEC PDF Ingestion Pipeline - LlamaIndex + ChromaDB
================================================================================

📂 Source Directory: D:\2022
💾 ChromaDB Path: ./chroma_data
📊 Collection Name: kec_syllabi_regulations_r2022

⚙️  Loading embedding model: BAAI/bge-small-en-v1.5
   - Chunk size: 512
   - Chunk overlap: 50

🗄️  Initializing ChromaDB...
   ✓ Created collection: kec_syllabi_regulations_r2022

🔍 Discovering PDF files...
   ✓ Found 45 PDF files

📚 Processing 45 PDF files...
================================================================================
Processing PDFs: 100%|████████████████████████████| 45/45 [05:23<00:00,  7.19s/file]

📄 Processing: KEC-R2022-CSE.pdf
   Path: Curricula and Syllabi\UG\BE\KEC-R2022-CSE.pdf
   ✓ Extracted 156 pages/chunks

📄 Processing: R2022-MBA.pdf
   Path: Curricula and Syllabi\PG\MBA\R2022-MBA.pdf
   ✓ Extracted 98 pages/chunks

... (continues for all PDFs)

================================================================================
📊 Extraction Complete:
   - Total PDFs: 45
   - Successful: 45
   - Failed: 0
   - Total document chunks: 2341

================================================================================
🔄 Creating vector index and storing in ChromaDB...
   (This may take a few minutes depending on document count)
Generating embeddings: 100%|████████████████| 2341/2341 [02:15<00:00, 17.31it/s]

✅ Ingestion Complete!
   - Total chunks stored: 2341
   - ChromaDB collection: kec_syllabi_regulations_r2022
   - Storage path: ./chroma_data

📊 Statistics saved to: chroma_data\kec_syllabi_regulations_r2022_stats.json

================================================================================
✅ Pipeline Complete!
================================================================================

🚀 Next Steps:
   1. Use your existing MCP server to query the collection
   2. Collection name: kec_syllabi_regulations_r2022
   3. ChromaDB path: ./chroma_data

💡 MCP Server Usage:
   Run: python chromaDB_MCP/mcp_chroma_server.py \
        --client-type persistent \
        --data-dir ./chroma_data
"""


# ============================================================================
# STEP 5: Test Queries (Verify Everything Works)
# ============================================================================

# Run predefined test queries
# python test_llamaindex_query.py --chroma-path ./chroma_data

# Expected Output:
"""
================================================================================
🔍 LlamaIndex Query Test - KEC Syllabi Database
================================================================================

⚙️  Loading embedding model...
📂 Connecting to ChromaDB: ./chroma_data
✓ Collection found: kec_syllabi_regulations_r2022
  - Total chunks: 2341

🔄 Creating query engine...

================================================================================
📝 Running Test Queries...
================================================================================


================================================================================
Query 1: What are the prerequisite courses for Machine Learning?
================================================================================

🤖 Response:
--------------------------------------------------------------------------------
The prerequisite courses for Machine Learning include:
1. Data Structures and Algorithms (CS101)
2. Linear Algebra and Probability (MA201)
3. Python Programming (CS102)

📚 Source Documents:
--------------------------------------------------------------------------------

1. File: KEC-R2022-AIML.pdf
   Level: UG
   Program: BTECH
   Department: AIML
   Category: Curricula and Syllabi
   Score: 0.8234
   Preview: Machine Learning (CS301) Prerequisites: Students must have completed 
   Data Structures and Algorithms (CS101), Linear Algebra and Probability...

2. File: KEC-R2022-CSE.pdf
   Level: UG
   Program: BE
   Department: CSE
   Category: Curricula and Syllabi
   Score: 0.7892
   Preview: Course Code: CS301 - Machine Learning Prerequisites: CS101, MA201...
"""


# ============================================================================
# STEP 6: Run Custom Query
# ============================================================================
# python test_llamaindex_query.py --chroma-path ./chroma_data --query "What is the attendance policy?"


# ============================================================================
# STEP 7: Interactive Query Mode (Ask Multiple Questions)
# ============================================================================
# python test_llamaindex_query.py --chroma-path ./chroma_data --interactive

# Expected Output:
"""
================================================================================
💬 Interactive Query Mode
================================================================================
Type your questions (or 'quit' to exit)

--------------------------------------------------------------------------------

❓ Your question: What are the lab requirements for CSE?

🤖 Searching...

📖 Answer:
--------------------------------------------------------------------------------
The lab requirements for Computer Science Engineering include:
- Minimum 3 lab courses per semester
- Each lab carries 1.5 credits
- Mandatory attendance of 75%
- Lab record submission required

📚 Sources:
  1. KEC-R2022-CSE.pdf (CSE)
  2. R2022-BEBTech-Regulations.pdf (BE)

--------------------------------------------------------------------------------

❓ Your question: quit

👋 Goodbye!
"""


# ============================================================================
# STEP 8: Start MCP Server (For Claude Desktop)
# ============================================================================
# python chromaDB_MCP/mcp_chroma_server.py --client-type persistent --data-dir ./chroma_data

# Expected Output:
"""
Starting Chroma MCP Server...
✓ Connected to ChromaDB at ./chroma_data
✓ Available collections: kec_syllabi_regulations_r2022
✓ Server ready for MCP connections
"""


# ============================================================================
# VERIFICATION CHECKLIST
# ============================================================================

# ✅ Check 1: Verify ChromaDB contains data
# python -c "import chromadb; client = chromadb.PersistentClient(path='./chroma_data'); collection = client.get_collection('kec_syllabi_regulations_r2022'); print(f'✓ Collection has {collection.count()} chunks')"

# Expected Output:
# ✓ Collection has 2341 chunks


# ✅ Check 2: Verify metadata is present
# python -c "import chromadb; client = chromadb.PersistentClient(path='./chroma_data'); collection = client.get_collection('kec_syllabi_regulations_r2022'); result = collection.get(limit=1, include=['metadatas']); print('✓ Sample metadata:', result['metadatas'][0])"

# Expected Output:
# ✓ Sample metadata: {'source_file': 'KEC-R2022-CSE.pdf', 'level': 'UG', 'program_type': 'BE', 'department': 'CSE', 'category': 'Curricula and Syllabi', 'regulation': 'R2022', ...}


# ✅ Check 3: View ingestion statistics
# python -c "import json; stats = json.load(open('./chroma_data/kec_syllabi_regulations_r2022_stats.json')); print(f\"✓ Processed {stats['successful']}/{stats['total_pdfs']} PDFs\"); print(f\"✓ Total chunks: {stats['total_chunks']}\")"

# Expected Output:
# ✓ Processed 45/45 PDFs
# ✓ Total chunks: 2341


# ============================================================================
# TROUBLESHOOTING COMMANDS
# ============================================================================

# If you get "collection not found" error:
# python -c "import chromadb; client = chromadb.PersistentClient(path='./chroma_data'); print('Available collections:', [c.name for c in client.list_collections()])"

# If embeddings are slow (check GPU availability):
# python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"

# If you need to delete and re-run:
# python -c "import chromadb; client = chromadb.PersistentClient(path='./chroma_data'); client.delete_collection('kec_syllabi_regulations_r2022'); print('✓ Collection deleted')"


# ============================================================================
# EXPECTED FILE STRUCTURE AFTER COMPLETION
# ============================================================================
"""
llmAgent/
├── chroma_data/                                    # ChromaDB storage
│   ├── chroma.sqlite3                             # Database file
│   └── kec_syllabi_regulations_r2022_stats.json   # Ingestion statistics
├── llamaindex_pdf_ingestion.py                    # Main ingestion script ✓
├── test_llamaindex_query.py                       # Query test script ✓
├── llamaindex_requirements.txt                    # Dependencies ✓
├── quick_start_llamaindex.ps1                     # Automated setup ✓
├── LLAMAINDEX_PIPELINE_README.md                  # Full documentation ✓
└── STEP_BY_STEP_GUIDE.py                          # This file ✓
"""


# ============================================================================
# TIME ESTIMATES
# ============================================================================
"""
Activity                    Time          Notes
---------------------------------------------------------------------------
First-time pip install      2-3 min       One-time only
PDF discovery               < 5 sec       Fast directory scan
Text extraction             3-5 min       45 PDFs, ~2000 pages
Embedding generation        2-4 min       CPU: slower, GPU: faster
ChromaDB storage            10-20 sec     Batch insertion
Test queries                5-10 sec      For 3-5 queries
---------------------------------------------------------------------------
TOTAL (first run)           8-12 min      For ~45 PDFs
Subsequent queries          < 5 sec       Lightning fast!
"""


# ============================================================================
# PERFORMANCE TIPS
# ============================================================================
"""
1. Use GPU if available (automatically detected):
   - Embeddings: 50-100 it/s (vs 10-15 on CPU)
   - Total time: 3-5 min (vs 8-12 min)

2. Adjust chunk size for better results:
   - Smaller chunks (256): More precise, more chunks
   - Larger chunks (1024): More context, fewer chunks

3. Try different embedding models:
   - BAAI/bge-small-en-v1.5: Fast, good quality (default)
   - BAAI/bge-base-en-v1.5: Slower, better quality
   - sentence-transformers/all-MiniLM-L6-v2: Very fast, decent quality

4. Batch processing for large datasets:
   - Process folders separately
   - Merge collections later
"""


# ============================================================================
# USAGE IN CLAUDE DESKTOP
# ============================================================================
"""
After ingestion, use these prompts in Claude Desktop:

1. "Search the KEC syllabi for Machine Learning prerequisites"
   → Uses MCP tool: query_collection

2. "Show me all courses in the CSE department"
   → Uses metadata filtering

3. "What's the attendance policy for UG students?"
   → Semantic search with context

4. "Compare credit structures between BE and BTECH programs"
   → Multi-document comparison

5. "List all lab courses in the first semester"
   → Structured data extraction
"""


# ============================================================================
# END OF GUIDE
# ============================================================================
print("✅ All commands documented!")
print("📖 See LLAMAINDEX_PIPELINE_README.md for detailed explanations")

# Complete Setup Guide - ChromaDB MCP Server

## 📍 Your ChromaDB Location
```
C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\chroma_data
```

---

## 🎯 Setup for Claude Desktop

### Step 1: Locate Claude Desktop Config File

The configuration file is located at:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Full path:**
```
C:\Users\vikym\AppData\Roaming\Claude\claude_desktop_config.json
```

### Step 2: Open the Config File

```powershell
# Open in Notepad
notepad %APPDATA%\Claude\claude_desktop_config.json

# Or open in VS Code
code %APPDATA%\Claude\claude_desktop_config.json
```

### Step 3: Add ChromaDB MCP Server Configuration

**Copy this entire configuration:**

```json
{
  "mcpServers": {
    "chroma-policy-docs": {
      "command": "python",
      "args": [
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/mcp_chroma_server.py",
        "--client-type",
        "persistent",
        "--data-dir",
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/chroma_data"
      ]
    }
  }
}
```

**⚠️ Important Notes:**
- Use forward slashes `/` (not backslashes `\`)
- Use absolute paths (not relative)
- Server name `"chroma-policy-docs"` can be changed to anything you like

### Step 4: If You Have Other MCP Servers

If your config already has other servers, merge them like this:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "chroma-policy-docs": {
      "command": "python",
      "args": [
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/mcp_chroma_server.py",
        "--client-type",
        "persistent",
        "--data-dir",
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/chroma_data"
      ]
    }
  }
}
```

### Step 5: Restart Claude Desktop

1. **Close Claude Desktop completely** (check system tray)
2. **Restart Claude Desktop**
3. Look for the 🔌 icon in the chat interface

### Step 6: Verify Connection

In Claude Desktop, ask:
```
List all collections
```

Expected response:
```
policy_documents
```

---

## 🎯 Setup for VS Code

VS Code can use MCP servers through extensions. Here are two methods:

### Method 1: GitHub Copilot Chat (Recommended)

#### Step 1: Install GitHub Copilot Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "GitHub Copilot"
4. Install it

#### Step 2: Configure MCP Server in VS Code Settings

Press `Ctrl+Shift+P` and type "Preferences: Open User Settings (JSON)"

Add this configuration:

```json
{
  "github.copilot.chat.mcpServers": {
    "chroma-policy-docs": {
      "command": "python",
      "args": [
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/mcp_chroma_server.py",
        "--client-type",
        "persistent",
        "--data-dir",
        "C:/Users/vikym/Documents/GitHub/llmAgent/chromaDB_MCP/chroma_data"
      ]
    }
  }
}
```

#### Step 3: Restart VS Code

Close and reopen VS Code.

#### Step 4: Test in Copilot Chat

Open Copilot Chat panel and ask:
```
@chroma-policy-docs list all collections
```

---

### Method 2: VS Code Tasks (For Terminal Access)

If you want to run the MCP server as a VS Code task:

#### Step 1: Create `.vscode` Folder

In your workspace root:
```
C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\.vscode
```

#### Step 2: Create `tasks.json`

Create file: `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start ChromaDB MCP Server",
      "type": "shell",
      "command": "python",
      "args": [
        "${workspaceFolder}/mcp_chroma_server.py",
        "--client-type",
        "persistent",
        "--data-dir",
        "${workspaceFolder}/chroma_data"
      ],
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Test ChromaDB Connection",
      "type": "shell",
      "command": "python",
      "args": [
        "-c",
        "import chromadb; client = chromadb.PersistentClient(path='${workspaceFolder}/chroma_data'); print('Collections:', [c.name for c in client.list_collections()])"
      ],
      "problemMatcher": []
    }
  ]
}
```

#### Step 3: Run Tasks

- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Start ChromaDB MCP Server" or "Test ChromaDB Connection"

---

## 🧪 Testing Your Setup

### Test Script for Python

Create `test_connection.py`:

```python
import chromadb
from pathlib import Path

# Your ChromaDB path
CHROMA_PATH = r"C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\chroma_data"

def test_connection():
    """Test ChromaDB connection and list collections."""
    try:
        # Connect to ChromaDB
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        
        # List collections
        collections = client.list_collections()
        
        print("✅ Successfully connected to ChromaDB!")
        print(f"\n📊 Found {len(collections)} collection(s):")
        
        for coll in collections:
            print(f"\n  Collection: {coll.name}")
            print(f"  Documents: {coll.count()}")
            
            # Peek at first 3 documents
            peek = coll.peek(limit=3)
            print(f"  Sample IDs: {peek['ids'][:3]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection()
```

**Run it:**
```powershell
python test_connection.py
```

### Test MCP Server Directly

```powershell
cd C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP

python mcp_chroma_server.py --client-type persistent --data-dir ./chroma_data
```

**Expected output:**
```
Initializing ChromaDB with persistent storage at: ./chroma_data
Successfully initialized Chroma client
Starting MCP server
```

Press `Ctrl+C` to stop.

---

## 🎨 Sample Usage in Claude Desktop

Once configured, you can ask Claude:

### List Collections
```
List all collections in ChromaDB
```

### Query Documents
```
Query the policy_documents collection for information about leave policies
```

### Add New Documents
```
Add these documents to policy_documents:
- Document: "Annual leave: 30 days per year"
- ID: "policy_annual_001"
- Metadata: {"category": "Leave", "type": "Annual"}
```

### Search with Filters
```
Search policy_documents for "maternity leave" 
where category is "Leave Policy"
```

### Count Documents
```
How many documents are in the policy_documents collection?
```

### Get Collection Info
```
Show me details about the policy_documents collection
```

---

## 🎨 Sample Usage in VS Code (with Copilot)

In Copilot Chat panel:

```
@chroma-policy-docs list collections

@chroma-policy-docs query policy_documents for leave rules

@chroma-policy-docs count documents in policy_documents

@chroma-policy-docs get collection info for policy_documents
```

---

## 🔧 Troubleshooting

### Issue: "Python not found"

**Solution:**
Use full Python path in config:

```json
"command": "C:/Users/vikym/miniconda3/envs/gpu-env/python.exe"
```

### Issue: "Module not found: chromadb"

**Solution:**
```powershell
pip install chromadb sentence-transformers fastmcp mcp
```

### Issue: "Collection not found"

**Solution:**
Run ingestion first:
```powershell
cd C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP
python ingest_json_to_chroma.py
```

### Issue: Claude Desktop doesn't show MCP server

**Checklist:**
1. ✅ Config file has correct JSON syntax (use JSONLint.com)
2. ✅ Paths use forward slashes `/`
3. ✅ Paths are absolute (not relative)
4. ✅ Claude Desktop was restarted completely
5. ✅ Check logs: `%APPDATA%\Claude\logs\`

### Issue: VS Code doesn't recognize MCP server

**Solution:**
1. Ensure GitHub Copilot extension is installed
2. Restart VS Code after config changes
3. Check VS Code output panel for errors

---

## 📂 Quick Reference - File Locations

| File | Location |
|------|----------|
| **ChromaDB Data** | `C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\chroma_data` |
| **MCP Server Script** | `C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\mcp_chroma_server.py` |
| **Claude Config** | `C:\Users\vikym\AppData\Roaming\Claude\claude_desktop_config.json` |
| **VS Code Settings** | `%APPDATA%\Code\User\settings.json` |
| **Workspace Tasks** | `.vscode/tasks.json` |

---

## 🚀 Quick Start Commands

```powershell
# Navigate to project
cd C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP

# Test connection
python test_connection.py

# Start MCP server (manual)
python mcp_chroma_server.py --client-type persistent --data-dir ./chroma_data

# Ingest data (if needed)
python ingest_json_to_chroma.py

# Open Claude config
code %APPDATA%\Claude\claude_desktop_config.json

# Open VS Code settings
code %APPDATA%\Code\User\settings.json
```

---

## 📋 Environment Check Script

Create `check_environment.py`:

```python
import sys
import subprocess
from pathlib import Path

def check_environment():
    """Check if environment is ready for ChromaDB MCP."""
    
    print("🔍 Environment Check\n" + "="*50)
    
    # Check Python version
    print(f"\n✓ Python: {sys.version}")
    
    # Check required packages
    packages = ["chromadb", "sentence_transformers", "mcp", "fastmcp"]
    for pkg in packages:
        try:
            __import__(pkg)
            print(f"✓ {pkg}: installed")
        except ImportError:
            print(f"✗ {pkg}: NOT INSTALLED")
    
    # Check ChromaDB data folder
    chroma_path = Path(r"C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\chroma_data")
    if chroma_path.exists():
        print(f"\n✓ ChromaDB folder exists: {chroma_path}")
        
        # Try to connect
        try:
            import chromadb
            client = chromadb.PersistentClient(path=str(chroma_path))
            collections = client.list_collections()
            print(f"✓ Connection successful: {len(collections)} collection(s)")
        except Exception as e:
            print(f"✗ Connection failed: {e}")
    else:
        print(f"✗ ChromaDB folder not found: {chroma_path}")
    
    # Check Claude config
    claude_config = Path.home() / "AppData/Roaming/Claude/claude_desktop_config.json"
    if claude_config.exists():
        print(f"\n✓ Claude config exists: {claude_config}")
    else:
        print(f"✗ Claude config not found: {claude_config}")
    
    print("\n" + "="*50)

if __name__ == "__main__":
    check_environment()
```

**Run it:**
```powershell
python check_environment.py
```

---

## 🎯 Next Steps

1. ✅ **Configure Claude Desktop** - Follow steps above
2. ✅ **Configure VS Code** - Follow steps above  
3. ✅ **Test connections** - Run test scripts
4. ✅ **Start querying** - Ask questions in Claude/Copilot
5. ✅ **Add more data** - Ingest additional JSON files

---

## 📚 Additional Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [Claude Desktop](https://claude.ai/desktop)

---

**Questions? Issues?**
Open an issue on GitHub or check the troubleshooting section above.

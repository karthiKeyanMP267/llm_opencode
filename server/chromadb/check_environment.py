import sys
import subprocess
from pathlib import Path

def check_environment():
    """Check if environment is ready for ChromaDB MCP."""
    
    print("🔍 Environment Check\n" + "="*50)
    
    # Check Python version
    print(f"\n✓ Python: {sys.version.split()[0]}")
    print(f"  Location: {sys.executable}")
    
    # Check required packages
    print("\n📦 Checking packages:")
    packages = ["chromadb", "sentence_transformers", "mcp", "fastmcp", "torch"]
    missing = []
    
    for pkg in packages:
        try:
            mod = __import__(pkg)
            version = getattr(mod, "__version__", "unknown")
            print(f"  ✓ {pkg}: {version}")
        except ImportError:
            print(f"  ✗ {pkg}: NOT INSTALLED")
            missing.append(pkg)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print(f"   Install with: pip install {' '.join(missing)}")
    
    # Check ChromaDB data folder
    print("\n📂 Checking data folder:")
    chroma_path = Path(r"C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\chroma_data")
    
    if chroma_path.exists():
        print(f"  ✓ Folder exists: {chroma_path}")
        
        # List contents
        contents = list(chroma_path.iterdir())
        print(f"  ✓ Contents: {len(contents)} item(s)")
        
        # Try to connect
        try:
            import chromadb
            client = chromadb.PersistentClient(path=str(chroma_path))
            collections = client.list_collections()
            print(f"  ✓ Connection successful")
            print(f"  ✓ Collections: {len(collections)}")
            
            for coll in collections:
                print(f"    - {coll.name}: {coll.count()} documents")
                
        except Exception as e:
            print(f"  ✗ Connection failed: {e}")
    else:
        print(f"  ✗ Folder not found: {chroma_path}")
    
    # Check MCP server file
    print("\n🖥️  Checking MCP server:")
    server_path = Path(r"C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\mcp_chroma_server.py")
    
    if server_path.exists():
        print(f"  ✓ Server file exists: {server_path}")
    else:
        print(f"  ✗ Server file not found: {server_path}")
    
    # Check Claude config
    print("\n🤖 Checking Claude Desktop config:")
    claude_config = Path.home() / "AppData/Roaming/Claude/claude_desktop_config.json"
    
    if claude_config.exists():
        print(f"  ✓ Config file exists: {claude_config}")
        
        # Try to read and validate JSON
        try:
            import json
            with open(claude_config, 'r') as f:
                config = json.load(f)
            
            if "mcpServers" in config:
                servers = config["mcpServers"]
                print(f"  ✓ MCP servers configured: {len(servers)}")
                
                for name, settings in servers.items():
                    print(f"    - {name}")
                    
                    if "chroma" in name.lower():
                        print(f"      ✓ ChromaDB server found!")
                        if "args" in settings:
                            data_dir = None
                            for i, arg in enumerate(settings["args"]):
                                if arg == "--data-dir" and i+1 < len(settings["args"]):
                                    data_dir = settings["args"][i+1]
                                    print(f"      Data dir: {data_dir}")
                        
        except json.JSONDecodeError as e:
            print(f"  ✗ Invalid JSON in config: {e}")
        except Exception as e:
            print(f"  ⚠️  Error reading config: {e}")
    else:
        print(f"  ✗ Config file not found: {claude_config}")
        print(f"     Create it at this location")
    
    # Check VS Code settings (optional)
    print("\n💻 Checking VS Code settings:")
    vscode_settings = Path.home() / "AppData/Roaming/Code/User/settings.json"
    
    if vscode_settings.exists():
        print(f"  ✓ Settings file exists: {vscode_settings}")
    else:
        print(f"  ⚠️  Settings file not found (optional): {vscode_settings}")
    
    print("\n" + "="*50)
    print("\n✅ Environment check complete!")
    
    if not missing and chroma_path.exists():
        print("🎉 Your setup looks good! Ready to use ChromaDB MCP.")
    else:
        print("⚠️  Some issues found. Please fix them before proceeding.")

if __name__ == "__main__":
    check_environment()

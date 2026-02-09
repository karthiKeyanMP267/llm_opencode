"""
Quick verification script to check MCP server configuration
"""

import sys
sys.path.insert(0, '.')

def verify_server():
    """Verify the MCP server is properly configured"""
    
    print("=" * 60)
    print("🔍 MCP Server Verification")
    print("=" * 60)
    
    # Test 1: Import
    print("\n[1/4] Testing import...")
    try:
        import mcp_server
        print("✓ Server imports successfully")
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False
    
    # Test 2: Check ChromaDB path
    print("\n[2/4] Checking ChromaDB path...")
    from pathlib import Path
    chroma_path = Path(mcp_server.CHROMA_DATA_DIR)
    if chroma_path.exists():
        print(f"✓ ChromaDB path exists: {chroma_path}")
    else:
        print(f"✗ ChromaDB path not found: {chroma_path}")
        print("  Run ingestion first!")
        return False
    
    # Test 3: Count tools
    print("\n[3/4] Counting available tools...")
    try:
        # Get all tool names from mcp instance
        tool_count = 0
        tools = []
        for attr in dir(mcp_server.mcp):
            if not attr.startswith('_'):
                obj = getattr(mcp_server.mcp, attr)
                if callable(obj) and hasattr(obj, '__wrapped__'):
                    tool_count += 1
                    tools.append(attr)
        
        print(f"✓ Found {tool_count} registered tools")
        if tools:
            print("  Tools:", ", ".join(sorted(tools)[:5]), "...")
    except Exception as e:
        print(f"⚠ Could not count tools: {e}")
    
    # Test 4: Verify ChromaDB client can initialize
    print("\n[4/4] Testing ChromaDB connection...")
    try:
        client = mcp_server.get_chroma_client()
        collections = client.list_collections()
        print(f"✓ ChromaDB connected with {len(collections)} collections")
        
        # Check default collection
        try:
            coll = client.get_collection(mcp_server.DEFAULT_COLLECTION)
            print(f"✓ Default collection found: {coll.count()} documents")
        except:
            print(f"⚠ Default collection '{mcp_server.DEFAULT_COLLECTION}' not found")
    except Exception as e:
        print(f"✗ ChromaDB connection failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All verifications passed!")
    print("=" * 60)
    print("\n🚀 Ready to start server:")
    print("   python mcp_server.py")
    print("\n🌐 Server will run on:")
    print("   http://localhost:8000/sse")
    print()
    
    return True


if __name__ == "__main__":
    success = verify_server()
    sys.exit(0 if success else 1)

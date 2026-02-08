import chromadb
from pathlib import Path

# Your ChromaDB path
CHROMA_PATH = r"C:\Users\vikym\Documents\GitHub\llmAgent\chromaDB_MCP\chroma_data"

def test_connection():
    """Test ChromaDB connection and list collections."""
    try:
        print("🔗 Connecting to ChromaDB...")
        print(f"📂 Path: {CHROMA_PATH}\n")
        
        # Connect to ChromaDB
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        
        # List collections
        collections = client.list_collections()
        
        print("✅ Successfully connected to ChromaDB!")
        print(f"\n📊 Found {len(collections)} collection(s):\n")
        
        for coll in collections:
            print(f"  Collection: {coll.name}")
            print(f"  Documents: {coll.count()}")
            
            # Peek at first 3 documents
            peek = coll.peek(limit=3)
            print(f"  Sample IDs: {peek['ids'][:3]}")
            
            # Show sample metadata if available
            if peek['metadatas'] and peek['metadatas'][0]:
                print(f"  Sample metadata: {peek['metadatas'][0]}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_connection()

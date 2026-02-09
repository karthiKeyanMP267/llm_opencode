"""
Test script to query the LlamaIndex ChromaDB collection
Tests the ingested syllabi data with sample queries

Usage:
    python test_llamaindex_query.py --chroma-path ./chroma_data
    python test_llamaindex_query.py --chroma-path ./chroma_data --query "What is the attendance policy?"
"""

import argparse
from pathlib import Path
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import chromadb


def test_queries(
    chroma_path: str = "./chroma_data",
    collection_name: str = "kec_syllabi_regulations_r2022",
    custom_query: str = None
):
    """
    Test the ingested syllabi data with various queries
    """
    print("=" * 80)
    print("🔍 LlamaIndex Query Test - KEC Syllabi Database")
    print("=" * 80)
    
    # Initialize embedding model (same as ingestion)
    print("\n⚙️  Loading embedding model...")
    Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    
    # Connect to ChromaDB
    print(f"📂 Connecting to ChromaDB: {chroma_path}")
    client = chromadb.PersistentClient(path=chroma_path)
    
    try:
        collection = client.get_collection(name=collection_name)
        print(f"✓ Collection found: {collection_name}")
        print(f"  - Total chunks: {collection.count()}")
    except Exception as e:
        print(f"❌ Error: Collection '{collection_name}' not found!")
        print(f"   Make sure you've run the ingestion pipeline first.")
        return
    
    # Create vector store and index
    print("\n🔄 Creating query engine...")
    vector_store = ChromaVectorStore(chroma_collection=collection)
    index = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index.as_query_engine(similarity_top_k=5)
    
    # Define test queries
    test_queries_list = [
        "What are the prerequisite courses for Machine Learning?",
        "Explain the attendance policy for students",
        "What are the lab requirements for Computer Science?",
        "What is the credit structure for MBA program?",
        "List the core subjects in the first semester",
    ]
    
    # Use custom query if provided
    if custom_query:
        test_queries_list = [custom_query]
    
    print("\n" + "=" * 80)
    print("📝 Running Test Queries...")
    print("=" * 80)
    
    # Run each query
    for i, query_text in enumerate(test_queries_list, 1):
        print(f"\n\n{'='*80}")
        print(f"Query {i}: {query_text}")
        print("=" * 80)
        
        try:
            response = query_engine.query(query_text)
            
            print("\n🤖 Response:")
            print("-" * 80)
            print(response)
            
            print("\n📚 Source Documents:")
            print("-" * 80)
            for j, node in enumerate(response.source_nodes, 1):
                metadata = node.metadata
                print(f"\n{j}. File: {metadata.get('source_file', 'Unknown')}")
                print(f"   Level: {metadata.get('level', 'N/A')}")
                print(f"   Program: {metadata.get('program_type', 'N/A')}")
                print(f"   Department: {metadata.get('department', 'N/A')}")
                print(f"   Category: {metadata.get('category', 'N/A')}")
                print(f"   Score: {node.score:.4f}")
                print(f"   Preview: {node.text[:150]}...")
        
        except Exception as e:
            print(f"\n❌ Error processing query: {str(e)}")
    
    print("\n\n" + "=" * 80)
    print("✅ Query Testing Complete!")
    print("=" * 80)


def interactive_mode(
    chroma_path: str = "./chroma_data",
    collection_name: str = "kec_syllabi_regulations_r2022"
):
    """
    Interactive query mode - ask multiple questions
    """
    print("=" * 80)
    print("💬 Interactive Query Mode")
    print("=" * 80)
    print("Type your questions (or 'quit' to exit)")
    
    # Initialize
    Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    client = chromadb.PersistentClient(path=chroma_path)
    
    try:
        collection = client.get_collection(name=collection_name)
    except Exception as e:
        print(f"❌ Error: Collection '{collection_name}' not found!")
        return
    
    vector_store = ChromaVectorStore(chroma_collection=collection)
    index = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index.as_query_engine(similarity_top_k=3)
    
    while True:
        print("\n" + "-" * 80)
        query = input("\n❓ Your question: ").strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("\n👋 Goodbye!")
            break
        
        if not query:
            continue
        
        try:
            print("\n🤖 Searching...")
            response = query_engine.query(query)
            
            print("\n📖 Answer:")
            print("-" * 80)
            print(response)
            
            print("\n📚 Sources:")
            for i, node in enumerate(response.source_nodes, 1):
                print(f"  {i}. {node.metadata.get('source_file', 'Unknown')} "
                      f"({node.metadata.get('department', 'N/A')})")
        
        except Exception as e:
            print(f"❌ Error: {str(e)}")


def main():
    parser = argparse.ArgumentParser(
        description="Test LlamaIndex queries on KEC syllabi database"
    )
    parser.add_argument(
        "--chroma-path",
        default="./chroma_data",
        help="Path to ChromaDB storage"
    )
    parser.add_argument(
        "--collection",
        default="kec_syllabi_regulations_r2022",
        help="ChromaDB collection name"
    )
    parser.add_argument(
        "--query",
        help="Run a single custom query"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run in interactive mode for multiple queries"
    )
    
    args = parser.parse_args()
    
    if args.interactive:
        interactive_mode(
            chroma_path=args.chroma_path,
            collection_name=args.collection
        )
    else:
        test_queries(
            chroma_path=args.chroma_path,
            collection_name=args.collection,
            custom_query=args.query
        )


if __name__ == "__main__":
    main()

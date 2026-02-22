"""
Example: GitChain with LangChain Agent

This example creates a LangChain agent that can query
verified product data from GitChain.
"""

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

from gitchain.langchain import get_gitchain_tools, GitChainRetriever


def main():
    # 1. Create GitChain tools
    tools = get_gitchain_tools()
    
    # 2. Create the agent
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a product expert assistant. 
        
When users ask about products, use the gitchain_inject tool to get verified data.
Always cite the container ID when providing information.
Use gitchain_verify to check if data is blockchain-anchored."""),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("user", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    agent = create_openai_functions_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    # 3. Run a query
    result = executor.invoke({
        "input": "What are the specifications of Bosch product 7736606982?"
    })
    
    print("\n--- Answer ---")
    print(result["output"])


def retriever_example():
    """Example using GitChainRetriever for RAG."""
    from langchain.chains import RetrievalQA
    from langchain.chat_models import ChatOpenAI
    
    # Create retriever with specific containers
    retriever = GitChainRetriever(
        container_ids=[
            "0711:product:bosch:7736606982:v3",
            "0711:knowledge:etim:EC012034:v1",
        ],
        verify=True
    )
    
    # Create QA chain
    llm = ChatOpenAI(model="gpt-4")
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True
    )
    
    # Query
    result = qa.invoke("What is the heating capacity?")
    
    print("Answer:", result["result"])
    print("\nSources:")
    for doc in result["source_documents"]:
        print(f"  - {doc.metadata[name]} ({doc.metadata[id]})")


if __name__ == "__main__":
    main()

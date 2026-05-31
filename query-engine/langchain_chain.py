"""
LangChain module - Converts natural language to SQL using Gemini
"""
import logging
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import SQLDatabase
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

logger = logging.getLogger(__name__)

# Prompt that tells Gemini to return ONLY SQL — nothing else
PROMPT = PromptTemplate(
    input_variables=["schema", "question"],
    template="""
You are a PostgreSQL expert. Given the database schema below, write a SQL query to answer the question.

SCHEMA:
{schema}

QUESTION: {question}

RULES:
- If the question is NOT related to the database or data, respond with exactly: NOT_A_DB_QUESTION
- If it IS a data question, return ONLY the raw SQL query
- No explanation
- No markdown
- No SQLQuery: prefix
- No backticks

SQL:"""
)

def generate_sql(user_question: str) -> str:
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash",
            temperature=0,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            max_retries=1 
        )

        # Get schema from DB
        db = SQLDatabase.from_uri(os.getenv("DATABASE_URL"))
        schema = db.get_table_info()

        # Build chain: prompt → llm → parse output as string
        chain = PROMPT | llm | StrOutputParser()

        # Run chain
        sql = chain.invoke({
            "schema": schema,
            "question": user_question
        })

        sql = sql.strip()

        # Gemini flagged it as non-database question
        if sql == "NOT_A_DB_QUESTION":
            raise ValueError("This doesn't look like a data question. Try asking something like 'show all customers from Chennai'.")

        sql = sql.rstrip(";")

        logger.info(f"Generated SQL: {sql}")
        return sql

    except Exception as e:
        logger.error(f"Error generating SQL: {str(e)}")
        raise
"""DataBase Execution module = runs validated sql against the DB"""

import logging
import os 
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./datalk.db")
engine = create_engine(DATABASE_URL)

def execute_query(sql: str) -> list:
    try:
        logger.info(f"Executing query: {sql}")
        with engine.connect() as connection: # forms the connection with the db
            result = connection.execute(text(sql)) # it is not the sql data yet we need to pull it out
            columns = list(result.keys())  # pulls out col alone
            rows = result.fetchall() # pulls out rows
            
            final_result = []

            for row in rows:
                row_dict = {}
                for idx, col in enumerate(columns):
                    row_dict[col] = row[idx]
                final_result.append(row_dict)

            return final_result
         
            
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        raise

def get_schema_info() -> dict:
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        schema = {}

        for table_name in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            schema[table_name] = columns
            
        return schema
    except Exception as e:
        logger.error(f"Error retrieving schema : {str(e)}")
        raise

def close_connection():
    engine.dispose()
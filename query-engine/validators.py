"""SQL validators for the query engine service to guard against dangerous queries."""


import re
import logging

logger = logging.getLogger(__name__)

def validate_sql(sql: str) -> bool:
    if not sql or not isinstance(sql,str):
        logger.warning("Invalid SQL : empty or not a string")
        return False
    sql_upper = sql.strip().upper()
    if not sql_upper.startswith("SELECT"):
        logger.warning("Invalid SQL: only select statements are allowed")
        return False
    dangerous_keywords = ["DROP", "DELETE", "INSERT", "UPDATE", "GRANT", "REVOKE", "ALTER"]
    for keywords in dangerous_keywords:
        if keywords in sql_upper:
            logger.warning(f"Blocked Keyword: {keywords}")
            return False
    injection_patterns = [";--","/*","*/","xp_","sp_"]
    for pattern in injection_patterns:
        if pattern in sql:
            logger.warning(f"Injection pattern dedected: {pattern}")
            return False
    logger.info("All SQL validations have passed")
    return True

def is_select_only(sql: str) -> bool:
    return sql.strip().upper().startswith("SELECT")

def count_statements(sql: str) -> int:
    return len([s for s in sql.split(";") if s.strip()])



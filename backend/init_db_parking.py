from database import init_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Initializing database with new Parking models...")
    init_db()
    logger.info("Initialization complete.")

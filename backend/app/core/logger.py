import logging
import sys
from pathlib import Path
from logging.handlers import TimedRotatingFileHandler
from app.core.settings import BASE_DIR

LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

class ColoredFormatter(logging.Formatter):
    """Custom Formatter adding ANSI colors to console logs."""

    GREY = "\x1b[38;20m"
    GREEN = "\x1b[32;20m"
    YELLOW = "\x1b[33;20m"
    RED = "\x1b[31;20m"
    BOLD_RED = "\x1b[31;1m"
    RESET = "\x1b[0m"

    FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"

    FORMATS = {
        logging.DEBUG: GREY + FORMAT + RESET,
        logging.INFO: GREEN + FORMAT + RESET,
        logging.WARNING: YELLOW + FORMAT + RESET,
        logging.ERROR: RED + FORMAT + RESET,
        logging.CRITICAL: BOLD_RED + FORMAT + RESET,
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno, self.FORMAT)
        formatter = logging.Formatter(log_fmt, datefmt="%Y-%m-%d %H:%M:%S")
        return formatter.format(record)


def setup_logger(name: str = "app") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Prevent duplicate handlers if re-initialized
    if logger.handlers:
        return logger

    # 1. Console Handler (Colored output)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(ColoredFormatter())
    logger.addHandler(console_handler)

    # File Log Formatter (Plain text with timestamp)
    file_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # 2. General App Log Handler (Rotates daily, retains for 3 days)
    app_log_path = LOGS_DIR / "app.log"
    app_file_handler = TimedRotatingFileHandler(
        filename=app_log_path,
        when="D",
        interval=1,
        backupCount=3,
        encoding="utf-8"
    )
    app_file_handler.setLevel(logging.INFO)
    app_file_handler.setFormatter(file_formatter)
    logger.addHandler(app_file_handler)

    # 3. Error Log Handler (Rotates daily, retains for 7 days)
    error_log_path = LOGS_DIR / "error.log"
    error_file_handler = TimedRotatingFileHandler(
        filename=error_log_path,
        when="D",
        interval=1,
        backupCount=7,
        encoding="utf-8"
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(file_formatter)
    logger.addHandler(error_file_handler)

    return logger


logger = setup_logger()

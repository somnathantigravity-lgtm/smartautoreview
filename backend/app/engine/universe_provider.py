import logging
from app.engine.dhan_provider import dhan_provider

logger = logging.getLogger(__name__)

# Delegate exclusively to DhanHQ direct provider (No Fallbacks)
universe_provider = dhan_provider

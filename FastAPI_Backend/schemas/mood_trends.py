from pydantic import BaseModel, RootModel
from typing import List, Dict

class JournalEntryOut(BaseModel):
    date: str
    score: float

class MoodTrendsResponse(RootModel):
    root: Dict[str, List[JournalEntryOut]]

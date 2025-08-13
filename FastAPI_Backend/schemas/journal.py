from pydantic import BaseModel


class JournalEntryModel(BaseModel):
    text: str

class JournalAddResponse(BaseModel):
    text: str
    suggestion: str
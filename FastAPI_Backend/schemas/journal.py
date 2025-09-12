from pydantic import BaseModel


class JournalEntryModel(BaseModel):
    text: str
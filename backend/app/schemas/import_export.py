from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class ImportValidationError(BaseModel):
    row: int
    field: str
    message: str
    value: Optional[Any] = None

class ImportPreviewReport(BaseModel):
    total_records: int
    valid_records_count: int
    invalid_records_count: int
    duplicate_records_count: int
    preview_records: List[Dict[str, Any]]
    errors: List[ImportValidationError]

class ImportCommitPayload(BaseModel):
    records: List[Dict[str, Any]]
    update_existing: bool = True

class ImportResultSummary(BaseModel):
    total_records: int
    successfully_imported: int
    successfully_updated: int
    failed_records: int
    errors: List[str]

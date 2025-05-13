from bson import ObjectId
from datetime import datetime, date

def serialize_mongo_doc(doc):
    """
    Recursively serialize a MongoDB document to make it JSON serializable.
    Handles ObjectId, datetime, and nested documents/lists.
    """
    if doc is None:
        return None
    
    if isinstance(doc, (str, int, float, bool)):
        return doc
    
    if isinstance(doc, ObjectId):
        return str(doc)
    
    if isinstance(doc, datetime):
        return doc.isoformat()
    
    if isinstance(doc, date):
        return doc.isoformat()
    
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        return {
            key: serialize_mongo_doc(value)
            for key, value in doc.items()
        }
    
    return str(doc)  # Fallback for any other types 
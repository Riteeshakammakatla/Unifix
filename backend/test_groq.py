from llm.llm_service import LLMService
llm = LLMService()
try:
    print("TESTING ANALYZE_ISSUE:")
    res = llm.analyze_issue("Leaking pipe in bathroom")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()

try:
    print("TESTING DETECT_DUPLICATE:")
    res2 = llm.detect_duplicate("Leaking pipe", [{"id": 1, "title": "Water leak", "description": "pipe leaking"}])
    print(res2)
except Exception as e:
    import traceback
    traceback.print_exc()

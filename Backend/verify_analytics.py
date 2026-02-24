
import os
import sys

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from analytics import engine
from analytics import explainability

def test_analytics():
    print("--- Starting Analytics Verification ---")
    
    # 1. Test Aggregation with mapped 'amount'
    print("\n[Test 1] Aggregation (Average Amount)")
    plan = {"metric": "avg", "column": "amount", "filters": {}}
    res = engine.query_aggregation("avg", "amount", {})
    print(f"Result: {res}")
    msg = explainability.format_aggregation_response(plan, res)
    print(f"Formatted Output:\n{msg}")
    
    # 2. Test Comparison with device_type
    print("\n[Test 2] Comparison (Amount by Device Type)")
    plan_comp = {"intent": "comparison", "metric": "avg", "column": "amount", "group_by": "device_type"}
    res_comp = engine.query_comparison("device_type", "avg", "amount", {})
    print(f"Result: {res_comp}")
    msg_comp = explainability.format_comparison_response(plan_comp, res_comp)
    print(f"Formatted Output:\n{msg_comp}")
    
    # 3. Test Error Visibility (Invalid Column)
    print("\n[Test 3] Error Handling (Invalid Column)")
    res_err = engine.query_comparison("invalid_col", "avg", "amount", {})
    msg_err = explainability.format_comparison_response({}, res_err)
    print(f"Formatted Output: {msg_err}")
    
    # 4. Test Risk with status mapping
    print("\n[Test 4] Risk Analysis (segmented by state)")
    res_risk = engine.query_risk("state")
    print(f"Result: {res_risk.keys()}")
    msg_risk = explainability.format_risk_response({}, res_risk)
    print(f"Formatted Output snippets: {msg_risk[:200]}...")

if __name__ == "__main__":
    try:
        test_analytics()
        print("\n✅ Verification script completed successfully.")
    except Exception as e:
        print(f"\n❌ Verification script failed: {e}")
        import traceback
        traceback.print_exc()

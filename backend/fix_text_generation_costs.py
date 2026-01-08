"""
Fix text generation costs for existing records with $0 cost
Recalculates costs using the updated pricing table
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import UsageTracking, ServiceType
from app.services.cost_calculator import calculate_text_generation_cost, cost_to_cents


def fix_text_generation_costs():
    """Recalculate text generation costs for records with $0 cost"""
    db = SessionLocal()
    
    try:
        # Get all text generation records with $0 cost
        zero_cost_records = db.query(UsageTracking).filter(
            UsageTracking.service_type == ServiceType.TEXT_GENERATION,
            UsageTracking.estimated_cost == 0
        ).all()
        
        total_records = len(zero_cost_records)
        updated = 0
        
        print(f"Found {total_records} text generation records with $0 cost...")
        print()
        
        for record in zero_cost_records:
            # Get original values
            old_cost_cents = record.estimated_cost
            old_cost = old_cost_cents / 100
            
            # Recalculate cost
            new_cost = calculate_text_generation_cost(
                input_tokens=record.input_tokens or 0,
                output_tokens=record.output_tokens or 0,
                model=record.model
            )
            new_cost_cents = cost_to_cents(new_cost)
            
            # Only update if cost changed
            if new_cost_cents != old_cost_cents:
                record.estimated_cost = new_cost_cents
                updated += 1
                
                print(f"Record {record.id[:8]}...")
                print(f"  Model: {record.model} ({record.provider})")
                print(f"  Tokens: {record.input_tokens} input + {record.output_tokens} output = {record.total_tokens} total")
                print(f"  OLD cost: ${old_cost:.6f}")
                print(f"  NEW cost: ${new_cost:.6f}")
                print()
        
        # Commit all changes
        db.commit()
        
        print("="*60)
        print("Cost Recalculation Complete!")
        print("="*60)
        print(f"Total records found: {total_records}")
        print(f"Records updated: {updated}")
        print(f"Records unchanged: {total_records - updated}")
        print("="*60)
        
        # Show summary of total costs
        all_text_records = db.query(UsageTracking).filter(
            UsageTracking.service_type == ServiceType.TEXT_GENERATION
        ).all()
        
        total_cost = sum(r.estimated_cost for r in all_text_records) / 100
        print(f"\nTotal text generation cost (all time): ${total_cost:.4f}")
        
    except Exception as e:
        print(f"Error during recalculation: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Text Generation Cost Recalculation Tool")
    print("="*60)
    print("This will recalculate costs for records with $0 cost")
    print("using the updated pricing table")
    print("="*60)
    print()
    
    response = input("Continue? (y/n): ")
    if response.lower() == "y":
        fix_text_generation_costs()
    else:
        print("Recalculation cancelled.")


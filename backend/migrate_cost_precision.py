"""
Migrate cost storage from cents (×100) to tenth-cents (×1000)
This provides better precision for small AI costs
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import UsageTracking
from app.services.cost_calculator import calculate_text_generation_cost, cost_to_cents


def migrate_cost_precision():
    """
    Step 1: Multiply all existing costs by 10 (convert from cents to tenth-cents)
    Step 2: Recalculate zero-cost text generation records
    """
    db = SessionLocal()
    
    try:
        # Step 1: Convert existing costs from cents to tenth-cents
        print("Step 1: Converting existing costs from cents to tenth-cents...")
        print("(Multiplying all values by 10)")
        print()
        
        all_records = db.query(UsageTracking).all()
        converted = 0
        
        for record in all_records:
            if record.estimated_cost > 0:
                old_value = record.estimated_cost
                record.estimated_cost = old_value * 10
                converted += 1
                
                if converted <= 5:  # Show first 5 examples
                    print(f"  {record.id[:8]}... ({record.service_type}): {old_value} → {record.estimated_cost}")
        
        print(f"  Converted {converted} non-zero cost records")
        print()
        
        # Step 2: Recalculate text generation costs
        print("Step 2: Recalculating text generation costs with new precision...")
        print()
        
        from app.models import ServiceType
        zero_cost_text = db.query(UsageTracking).filter(
            UsageTracking.service_type == ServiceType.TEXT_GENERATION,
            UsageTracking.estimated_cost == 0
        ).all()
        
        recalculated = 0
        
        for record in zero_cost_text:
            new_cost = calculate_text_generation_cost(
                input_tokens=record.input_tokens or 0,
                output_tokens=record.output_tokens or 0,
                model=record.model
            )
            new_cost_tenth_cents = cost_to_cents(new_cost)
            
            if new_cost_tenth_cents > 0:
                record.estimated_cost = new_cost_tenth_cents
                recalculated += 1
                
                if recalculated <= 5:  # Show first 5 examples
                    print(f"  {record.id[:8]}... ({record.model})")
                    print(f"    Tokens: {record.input_tokens} + {record.output_tokens} = {record.total_tokens}")
                    print(f"    Cost: ${new_cost:.6f} = {new_cost_tenth_cents} tenth-cents")
        
        print(f"  Recalculated {recalculated} text generation records")
        print()
        
        # Commit all changes
        db.commit()
        
        print("="*60)
        print("Migration Complete!")
        print("="*60)
        print(f"Converted existing costs: {converted} records")
        print(f"Recalculated text generation: {recalculated} records")
        print("="*60)
        
        # Show summary
        all_records_after = db.query(UsageTracking).all()
        total_cost = sum(r.estimated_cost for r in all_records_after) / 1000  # Now dividing by 1000
        print(f"\nTotal cost (all services, all time): ${total_cost:.4f}")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Cost Precision Migration Tool")
    print("="*60)
    print("This will migrate from cents (×100) to tenth-cents (×1000)")
    print("for better precision on small AI costs.")
    print()
    print("Changes:")
    print("  - Existing costs will be multiplied by 10")
    print("  - Zero-cost text records will be recalculated")
    print("="*60)
    print()
    
    response = input("Continue? (y/n): ")
    if response.lower() == "y":
        migrate_cost_precision()
    else:
        print("Migration cancelled.")


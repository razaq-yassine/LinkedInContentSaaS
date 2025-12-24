# Database Migrations

This directory contains Alembic migrations for the LinkedIn Content SaaS database.

## Structure

```
migrations/
├── versions/          # Migration files (auto-generated)
├── seeds/             # Seed scripts for initial data
│   ├── seed_admin_settings.py
│   ├── seed_subscription_plans.py
│   └── run_all_seeds.py
└── env.py             # Alembic environment configuration
```

## Quick Start

### Initialize Database (First Time)

```bash
cd backend
python migrate.py init
```

This will:
1. Run all migrations to create tables
2. Seed initial data (admin settings, subscription plans)

### Run Migrations

```bash
# Run all pending migrations
python migrate.py upgrade

# Or use alembic directly
alembic upgrade head
```

### Create New Migration

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "description_of_changes"

# Create empty migration file
alembic revision -m "description_of_changes"
```

### Rollback Migration

```bash
# Rollback one migration
python migrate.py downgrade -1

# Or use alembic directly
alembic downgrade -1
```

### Check Migration Status

```bash
# Show current migration version
python migrate.py current

# Show migration history
python migrate.py history
```

### Run Seeds Only

```bash
python migrate.py seeds
```

## Migration Workflow

1. **Make changes to models** in `app/models.py`
2. **Generate migration**: `alembic revision --autogenerate -m "your_description"`
3. **Review the generated migration** in `migrations/versions/`
4. **Test the migration**: `alembic upgrade head`
5. **Commit both model changes and migration file**

## Seed Scripts

Seed scripts are separate from migrations and can be run multiple times safely (idempotent).

- `seed_admin_settings.py` - Seeds admin settings with AI rules
- `seed_subscription_plans.py` - Seeds subscription plan configurations
- `run_all_seeds.py` - Runs all seed scripts

## Production Deployment

**Important**: In production, migrations should be run as a separate deployment step, NOT automatically on startup.

```bash
# Before deploying new code
alembic upgrade head

# Then start the application
python -m app.main
```

The application will verify database connection but won't auto-create tables in production mode.

## Troubleshooting

### Migration conflicts
If you have conflicts, you can:
- Review the migration files
- Manually edit if needed
- Use `alembic merge` to combine branches

### Reset database (Development only!)
```bash
# WARNING: This will delete all data!
alembic downgrade base
alembic upgrade head
python migrate.py seeds
```



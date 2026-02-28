#!/bin/bash
# GitChain Database Migration Runner
# Usage: ./migrate.sh [up|down|status] [migration_number]
#
# Examples:
#   ./migrate.sh up          # Run all pending migrations
#   ./migrate.sh down 010    # Rollback migration 010
#   ./migrate.sh status      # Show migration status

set -e

# Configuration
MIGRATIONS_DIR="$(dirname "$0")/migrations"
DB_URL="${DATABASE_URL:-postgresql://gitchain:gitchain2026@localhost:5440/gitchain}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse database URL
parse_db_url() {
    # Extract components from postgresql://user:pass@host:port/database
    local url="$1"
    DB_USER=$(echo "$url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
}

# Run psql command
run_psql() {
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Initialize migrations table
init_migrations_table() {
    run_psql -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(20) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    " > /dev/null 2>&1
}

# Get list of applied migrations
get_applied_migrations() {
    run_psql -t -A -c "SELECT version FROM schema_migrations ORDER BY version;" 2>/dev/null || echo ""
}

# Check if migration is applied
is_applied() {
    local version="$1"
    run_psql -t -A -c "SELECT 1 FROM schema_migrations WHERE version = '$version';" 2>/dev/null | grep -q "1"
}

# Run a single migration
run_migration() {
    local file="$1"
    local version=$(basename "$file" | cut -d'_' -f1)
    local name=$(basename "$file" .sql)

    if is_applied "$version"; then
        echo -e "${YELLOW}SKIP${NC} $name (already applied)"
        return 0
    fi

    echo -e "${GREEN}RUNNING${NC} $name..."

    if run_psql -f "$file"; then
        run_psql -c "INSERT INTO schema_migrations (version, name) VALUES ('$version', '$name');" > /dev/null
        echo -e "${GREEN}OK${NC} $name"
        return 0
    else
        echo -e "${RED}FAILED${NC} $name"
        return 1
    fi
}

# Run a rollback
run_rollback() {
    local version="$1"
    local down_file="$MIGRATIONS_DIR/${version}_*.down.sql"

    # Find the down migration file
    local files=($MIGRATIONS_DIR/${version}*.down.sql)
    if [ ! -f "${files[0]}" ]; then
        echo -e "${RED}ERROR${NC} No rollback file found for migration $version"
        echo "Expected: ${version}_*.down.sql"
        return 1
    fi

    local file="${files[0]}"
    local name=$(basename "$file" .down.sql)

    if ! is_applied "$version"; then
        echo -e "${YELLOW}SKIP${NC} $name (not applied)"
        return 0
    fi

    echo -e "${YELLOW}ROLLING BACK${NC} $name..."

    if run_psql -f "$file"; then
        run_psql -c "DELETE FROM schema_migrations WHERE version = '$version';" > /dev/null
        echo -e "${GREEN}OK${NC} Rolled back $name"
        return 0
    else
        echo -e "${RED}FAILED${NC} $name"
        return 1
    fi
}

# Show migration status
show_status() {
    echo "Migration Status"
    echo "================"
    echo ""

    local applied=$(get_applied_migrations)

    for file in "$MIGRATIONS_DIR"/*.sql; do
        [ -f "$file" ] || continue
        [[ "$file" == *.down.sql ]] && continue

        local version=$(basename "$file" | cut -d'_' -f1)
        local name=$(basename "$file" .sql)

        if echo "$applied" | grep -q "^${version}$"; then
            echo -e "${GREEN}[APPLIED]${NC} $name"
        else
            echo -e "${YELLOW}[PENDING]${NC} $name"
        fi
    done
}

# Main
main() {
    local command="${1:-up}"
    local target="$2"

    # Parse database URL
    parse_db_url "$DB_URL"

    # Initialize migrations table
    init_migrations_table

    case "$command" in
        up)
            echo "Running migrations..."
            echo ""
            local count=0
            for file in "$MIGRATIONS_DIR"/*.sql; do
                [ -f "$file" ] || continue
                [[ "$file" == *.down.sql ]] && continue

                if run_migration "$file"; then
                    ((count++)) || true
                else
                    echo ""
                    echo -e "${RED}Migration failed. Stopping.${NC}"
                    exit 1
                fi
            done
            echo ""
            echo -e "${GREEN}Done.${NC} $count migrations processed."
            ;;
        down)
            if [ -z "$target" ]; then
                echo "Usage: $0 down <migration_number>"
                echo "Example: $0 down 010"
                exit 1
            fi
            run_rollback "$target"
            ;;
        status)
            show_status
            ;;
        *)
            echo "Usage: $0 [up|down|status] [migration_number]"
            echo ""
            echo "Commands:"
            echo "  up      Run all pending migrations"
            echo "  down    Rollback a specific migration (requires version)"
            echo "  status  Show migration status"
            exit 1
            ;;
    esac
}

main "$@"

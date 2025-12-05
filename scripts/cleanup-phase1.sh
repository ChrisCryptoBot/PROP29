#!/bin/bash
# CODEBASE CLEANUP - PHASE 1
# Deletes empty/stub/backup files
# Run with: bash cleanup-phase1.sh

echo "🧹 Starting Phase 1 Cleanup..."
echo ""

# Track deletions
DELETED=0

# Delete empty markdown files
if [ -f "backend_audit_report.md" ]; then
  echo "❌ Deleting: backend_audit_report.md (empty file)"
  rm backend_audit_report.md
  ((DELETED++))
fi

if [ -f "COMPREHENSIVE_BACKEND_AUDIT.md" ]; then
  echo "❌ Deleting: COMPREHENSIVE_BACKEND_AUDIT.md (empty file)"
  rm COMPREHENSIVE_BACKEND_AUDIT.md
  ((DELETED++))
fi

# Delete stub service file
if [ -f "backend/services/ai_ml_service/predictive_event_intel_service.py" ]; then
  echo "❌ Deleting: backend/services/ai_ml_service/predictive_event_intel_service.py (placeholder only)"
  rm backend/services/ai_ml_service/predictive_event_intel_service.py
  ((DELETED++))
fi

# Delete backup files
if [ -f "frontend/.eslintrc.json.bak" ]; then
  echo "❌ Deleting: frontend/.eslintrc.json.bak (backup file)"
  rm frontend/.eslintrc.json.bak
  ((DELETED++))
fi

echo ""
echo "✅ Phase 1 Complete!"
echo "📊 Deleted $DELETED files"
echo ""
echo "Next steps:"
echo "  1. Run: git status"
echo "  2. Review changes"
echo "  3. Commit: git add -A && git commit -m 'Phase 1 cleanup: Remove empty/stub/backup files'"
echo ""
echo "For Phase 2 (consolidate duplicates), see DEEP_AUDIT_REPORT_2025-12-05.md"

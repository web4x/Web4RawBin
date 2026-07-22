// R31.8b — Feature Manager page (client bundle). REUSES the shared RbDetailDrawer (NO fork): create the drawer, then
// route through the STANDARD selection path (selectionModel.select('feature:manager') → selection-changed → drawer
// renderDetailForRef → tagMap feature→rb-feature-manager-detail) exactly like /server-manager opens rb-terminal-detail.
// rb-feature-manager-detail is imported HERE (defines the element + keeps its code out of /trace); its mount() lists
// ALL Features via GET /api/feature-manager (the synthetic 'manager' uuid is just the drawer anchor).
import '../trace/rb-detail-drawer.js';
import '../trace/rb-feature-manager-detail.js';
import { selectionModel } from '../trace/selection-model.js';

if (!document.getElementById('fm-drawer')) {
  const d = document.createElement('rb-detail-drawer'); d.id = 'fm-drawer'; document.body.appendChild(d);
}

// Open the FeatureManager view in the shared drawer via the standard selection flow (single-select: clear+select).
selectionModel.clear();
selectionModel.select('feature:manager');

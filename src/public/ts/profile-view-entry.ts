// R31.8c round-3: tiny bundle that defines the shared <rb-profile-view> for the standalone /profile page (which
// loads no other bundle). The /profile inline script sets `el.data = m.profile` on it → the SAME component the FM
// drawer uses renders /profile. This is the migration that PROVES it's the real viewer (identical render, one class).
import './trace/rb-profile-view.js';

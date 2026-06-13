import { motion } from 'framer-motion';
import { ArrowRight, Clock, GitBranch, Zap } from 'lucide-react';
import type { PanelView } from '../types/workflow';

interface Props {
  onNavigate: (v: PanelView) => void;
}

const FEATURES = [
  { icon: '⚡', title: 'Up to 8 Steps', desc: 'Chain triggers, filters, transforms, notifications, and more in a single automated flow.' },
  { icon: '🔔', title: 'Multi-Channel Notify', desc: 'Email, Slack, SMS, Teams — reach the right person on the right channel instantly.' },
  { icon: '🌿', title: 'Conditional Logic', desc: 'Branch workflows based on real-time data, keeping every path in your control.' },
  { icon: '🔗', title: '6+ Integrations', desc: 'Salesforce, HubSpot, Jira, GitHub, Stripe, and custom APIs out of the box.' },
];

export function HomePage({ onNavigate }: Props) {
  return (
    <div className="home-wrap">
      {/* Hero */}
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero-badge">
          <Zap size={13} /> Workflow Automation
        </div>
        <h1 className="hero-title">
          Build end-to-end process<br />
          <span className="hero-gradient">automation in minutes</span>
        </h1>
        <p className="hero-sub">
          Configure up to 8 steps with triggers, filters, transforms, and notifications —
          cutting manual setup time by ~3 hours per workflow.
        </p>

        <div className="hero-actions">
          <motion.button
            className="action-btn primary large"
            onClick={() => onNavigate('builder')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Building <ArrowRight size={16} />
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          {[
            { icon: <Clock size={14} />, label: '~3h saved', sub: 'per workflow' },
            { icon: <GitBranch size={14} />, label: '8 steps max', sub: 'per flow' },
            { icon: <Zap size={14} />, label: '8 step types', sub: 'available' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              {s.icon}
              <span className="stat-card-val">{s.label}</span>
              <span className="stat-card-sub">{s.sub}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features grid */}
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

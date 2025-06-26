import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend: 'up' | 'down';
  trendValue: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendValue, className = '' }) => (
  <div className={`metric-card ${className}`}>
    <div className="metric-header">
      <div className="metric-icon">
        <i className={icon}></i>
      </div>
      <div className={`metric-trend ${trend}`}>
        <i className={`fas fa-arrow-${trend}`}></i> {trendValue}
      </div>
    </div>
    <div className="metric-value">{value}</div>
    <div className="metric-label">{title}</div>
  </div>
);

interface RiskFactorProps {
  title: string;
  description: string;
  level: 'high' | 'medium' | 'low';
}

const RiskFactor: React.FC<RiskFactorProps> = ({ title, description, level }) => (
  <div className={`risk-factor ${level}`}>
    <div className="risk-factor-header">
      <span className="risk-factor-title">{title}</span>
      <span className={`risk-factor-score ${level}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
    </div>
    <p className="risk-factor-desc">{description}</p>
  </div>
);

interface AICardProps {
  title: string;
  icon: string;
  status?: string;
  children: React.ReactNode;
}

const AICard: React.FC<AICardProps> = ({ title, icon, status, children }) => (
  <div className="ai-card">
    <div className="ai-card-header">
      <h3><i className={icon}></i> {title}</h3>
      {status && <span className="ai-status active">{status}</span>}
    </div>
    {children}
  </div>
);

interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  stats: { label: string; value: string | number }[];
  enhancement?: { type: string; icon: string; label: string };
  className?: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, stats, enhancement, className = '' }) => (
  <div className={`module-card ${className}`}>
    {enhancement && (
      <div className={`enhancement-badge ${enhancement.type}`}>
        <i className={enhancement.icon}></i>
        {enhancement.label}
      </div>
    )}
    <div className="module-header">
      <div className="module-icon">
        <i className={icon}></i>
      </div>
    </div>
    <div className="module-content">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="module-stats">
        {stats.map((stat, index) => (
          <span key={index} className="module-stat">
            {stat.label}: <strong>{stat.value}</strong>
          </span>
        ))}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [activePeriod, setActivePeriod] = useState('Live');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Show AI alert after 5 seconds
    const alertTimer = setTimeout(() => {
      setShowAlert(true);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(alertTimer);
    };
  }, []);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Incidents',
        data: [12, 8, 15, 10, 18, 25, 14],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Resolved',
        data: [8, 6, 12, 8, 14, 20, 11],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'AI Predicted',
        data: [3, 2, 4, 2, 5, 7, 3],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [5, 5]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? '#94a3b8' : '#64748b'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b'
        },
        grid: {
          color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)'
        }
      },
      x: {
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b'
        },
        grid: {
          color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)'
        }
      }
    }
  };

  const handleDeployPatrol = () => {
    setShowAlert(false);
    // Add notification logic here
  };

  const handleDismissAlert = () => {
    setShowAlert(false);
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* Smart Alert Banner */}
      {showAlert && (
        <div className="smart-alert-banner">
          <div className="alert-content">
            <div className="alert-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="alert-text">
              <strong>AI Security Recommendation:</strong> Increase patrol frequency in East Wing - Unusual activity pattern detected
            </div>
            <div className="alert-actions">
              <button className="btn-alert-action" onClick={handleDeployPatrol}>Deploy Patrol</button>
              <button className="btn-alert-dismiss" onClick={handleDismissAlert}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">Security Command Center</h1>
          <p className="dashboard-subtitle">Monitor, manage, and secure your property with intelligent oversight, predictive analytics, and comprehensive cybersecurity</p>
        </div>
        <div className="header-right">
          <div className="dashboard-controls">
            {['Live', 'Today', 'Week'].map((period) => (
              <button
                key={period}
                className={`control-btn ${activePeriod === period ? 'active' : ''}`}
                onClick={() => setActivePeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="time-info">
            <div className="current-time">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="current-date">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn emergency">
          <i className="fas fa-exclamation-triangle"></i>
          Emergency Alert
        </button>
        <button className="quick-action-btn">
          <i className="fas fa-shield-alt"></i>
          Deploy Guards
        </button>
        <button className="quick-action-btn">
          <i className="fas fa-camera"></i>
          View Cameras
        </button>
        <button className="quick-action-btn">
          <i className="fas fa-route"></i>
          Track Patrols
        </button>
        <button className="quick-action-btn">
          <i className="fas fa-mobile-alt"></i>
          Guest Panic Alerts
        </button>
        <button className="quick-action-btn">
          <i className="fas fa-chart-line"></i>
          Generate Report
        </button>
      </div>

      {/* Enhanced Metrics Overview */}
      <div className="metrics-overview">
        <div className="main-metrics">
          <MetricCard
            title="Active Incidents"
            value="23"
            icon="fas fa-exclamation-triangle"
            trend="down"
            trendValue="12%"
            className="incidents"
          />
          <MetricCard
            title="Guards On Duty"
            value="12"
            icon="fas fa-shield-alt"
            trend="up"
            trendValue="8%"
            className="guards"
          />
          <MetricCard
            title="AI-Optimized Patrols"
            value="87"
            icon="fas fa-route"
            trend="up"
            trendValue="5%"
            className="patrols"
          />
          <MetricCard
            title="Security Alerts Today"
            value="156"
            icon="fas fa-bell"
            trend="down"
            trendValue="3%"
            className="alerts"
          />
          <MetricCard
            title="Patrol Efficiency Score"
            value="94%"
            icon="fas fa-check-circle"
            trend="up"
            trendValue="3%"
            className="compliance"
          />
          <MetricCard
            title="Cyber Threats Blocked"
            value="7"
            icon="fas fa-virus"
            trend="down"
            trendValue="45%"
            className="cyber-threats"
          />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Incident Trends</h3>
            <span className="chart-period">Last 7 Days</span>
          </div>
          <div style={{ height: '200px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Risk Assessment Panel */}
      <div className="risk-assessment">
        <div className="risk-header">
          <h2 className="section-title">
            <i className="fas fa-exclamation-triangle"></i>
            AI Risk Assessment
          </h2>
          <div className="risk-level medium">
            <i className="fas fa-shield-alt"></i>
            Medium Risk Level
          </div>
        </div>
        <div className="risk-factors">
          <RiskFactor
            title="Peak Activity Hours"
            description="Increased security risk during busy periods (2-6 PM) - AI recommends 30% more patrols"
            level="high"
          />
          <RiskFactor
            title="Staff Coverage"
            description="Pool area understaffed - Biometric access logs show gaps in coverage"
            level="medium"
          />
          <RiskFactor
            title="Equipment Status"
            description="IoT sensors detect camera malfunction in East Wing - immediate attention required"
            level="high"
          />
          <RiskFactor
            title="Access Control"
            description="All biometric access points secured, system operating normally"
            level="low"
          />
          <RiskFactor
            title="Guest Behavior Analytics"
            description="Unusual loitering patterns detected in lobby - predictive AI suggests enhanced monitoring"
            level="medium"
          />
          <RiskFactor
            title="Cybersecurity Posture"
            description="Network security optimal, no active threats detected by AI monitoring"
            level="low"
          />
        </div>
      </div>

      {/* Enhanced AI Intelligence Section */}
      <div className="ai-intelligence-section">
        <div className="ai-header">
          <h2 className="ai-title">
            <i className="fas fa-brain"></i>
            AI Security Intelligence
          </h2>
          <div className="ai-confidence">
            <span>Confidence: 92%</span>
            <div className="confidence-meter">
              <div className="confidence-fill" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="ai-cards-grid">
          <AICard title="Predictive Patrol AI" icon="fas fa-route" status="Enhanced">
            <div className="suggestion-item priority-high">
              <div className="suggestion-icon">
                <i className="fas fa-brain"></i>
              </div>
              <div className="suggestion-content">
                <strong>Pool Area Patrol - AI Priority</strong>
                <p>Concert event + social media sentiment analysis indicates 85% incident probability</p>
                <span className="suggestion-time">Deploy: 15:30</span>
              </div>
            </div>
          </AICard>

          <AICard title="Behavioral Analytics" icon="fas fa-fire">
            <div className="hotspot-count">4 Active</div>
            <div className="hotspot-map">
              <div className="hotspot-item">
                <div className="hotspot-location">
                  <div className="location-icon">
                    <i className="fas fa-video"></i>
                  </div>
                  Lobby - Loitering Pattern
                </div>
                <span className="hotspot-level high">AI Alert</span>
              </div>
              <div className="hotspot-item">
                <div className="hotspot-location">
                  <div className="location-icon">
                    <i className="fas fa-fingerprint"></i>
                  </div>
                  Staff Access Anomaly
                </div>
                <span className="hotspot-level medium">Biometric</span>
              </div>
            </div>
          </AICard>

          <AICard title="Predictive Event Intel" icon="fas fa-calendar-alt">
            <button className="btn-configure">Configure</button>
            <div className="event-item">
              <div className="event-info">
                <div className="event-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="event-details">
                  <strong>Music Festival Tonight</strong>
                  <p>AI predicts 40% traffic increase + weather data analysis</p>
                </div>
              </div>
              <div className="event-impact">
                <span className="impact-level high">High Impact</span>
              </div>
            </div>
          </AICard>

          <AICard title="Guest Safety AI" icon="fas fa-mobile-alt" status="Live">
            <div className="suggestion-item">
              <div className="suggestion-icon">
                <i className="fas fa-heart"></i>
              </div>
              <div className="suggestion-content">
                <strong>3 Active Panic Buttons</strong>
                <p>Guest safety app connected, 247 registered guests</p>
                <span className="suggestion-time">Response: &lt;2min avg</span>
              </div>
            </div>
          </AICard>
        </div>
      </div>

      {/* Cybersecurity Dashboard Section */}
      <div className="cybersecurity-section">
        <div className="cyber-header">
          <h2 className="cyber-title">
            <i className="fas fa-shield-virus"></i>
            Cybersecurity Command Center
          </h2>
          <div className="cyber-status">
            <i className="fas fa-check-circle"></i>
            <span>Protected</span>
          </div>
        </div>
        
        <div className="cyber-metrics">
          <div className="cyber-metric">
            <div className="cyber-metric-header">
              <span className="cyber-metric-title">Network Security</span>
              <span className="cyber-metric-status secure">Secure</span>
            </div>
            <div className="cyber-metric-value">99.8%</div>
            <p className="cyber-metric-desc">AI monitoring all network traffic</p>
          </div>

          <div className="cyber-metric">
            <div className="cyber-metric-header">
              <span className="cyber-metric-title">Threat Detection</span>
              <span className="cyber-metric-status secure">Active</span>
            </div>
            <div className="cyber-metric-value">24/7</div>
            <p className="cyber-metric-desc">Real-time threat intelligence</p>
          </div>

          <div className="cyber-metric">
            <div className="cyber-metric-header">
              <span className="cyber-metric-title">Guest Data Protection</span>
              <span className="cyber-metric-status secure">Encrypted</span>
            </div>
            <div className="cyber-metric-value">AES-256</div>
            <p className="cyber-metric-desc">End-to-end encryption active</p>
          </div>

          <div className="cyber-metric">
            <div className="cyber-metric-header">
              <span className="cyber-metric-title">Phishing Attempts</span>
              <span className="cyber-metric-status warning">Blocked</span>
            </div>
            <div className="cyber-metric-value">7</div>
            <p className="cyber-metric-desc">Attempts blocked today</p>
          </div>
        </div>
      </div>

      {/* Guest Safety Dashboard Section */}
      <div className="guest-safety-section">
        <div className="guest-header">
          <h2 className="guest-title">
            <i className="fas fa-heart-pulse"></i>
            Guest Safety & Experience
          </h2>
        </div>
        
        <div className="guest-metrics">
          <div className="guest-metric">
            <div className="guest-metric-header">
              <span className="guest-metric-title">Mobile App Users</span>
              <div className="guest-metric-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
            </div>
            <div className="guest-metric-value">247</div>
            <p className="guest-metric-desc">Active guest safety app users</p>
          </div>

          <div className="guest-metric">
            <div className="guest-metric-header">
              <span className="guest-metric-title">Digital Key Access</span>
              <div className="guest-metric-icon">
                <i className="fas fa-key"></i>
              </div>
            </div>
            <div className="guest-metric-value">892</div>
            <p className="guest-metric-desc">Secure room accesses today</p>
          </div>

          <div className="guest-metric">
            <div className="guest-metric-header">
              <span className="guest-metric-title">Panic Button Response</span>
              <div className="guest-metric-icon">
                <i className="fas fa-stopwatch"></i>
              </div>
            </div>
            <div className="guest-metric-value">1.2m</div>
            <p className="guest-metric-desc">Average response time</p>
          </div>

          <div className="guest-metric">
            <div className="guest-metric-header">
              <span className="guest-metric-title">Safety Feedback Score</span>
              <div className="guest-metric-icon">
                <i className="fas fa-star"></i>
              </div>
            </div>
            <div className="guest-metric-value">4.8/5</div>
            <p className="guest-metric-desc">Guest safety satisfaction</p>
          </div>
        </div>
      </div>

      {/* Enhanced Security Modules */}
      <div className="modules-section">
        <h2 className="section-title">
          <i className="fas fa-th-large"></i>
          Enhanced Security Modules
        </h2>
        
        <div className="modules-grid">
          <ModuleCard
            title="Event Log"
            description="AI-powered incident prediction and automated reporting with pattern recognition"
            icon="fas fa-clipboard-list"
            stats={[
              { label: "Today", value: "23" },
              { label: "AI Predicted", value: "3" }
            ]}
            enhancement={{ type: "predictive", icon: "fas fa-brain", label: "AI Enhanced" }}
            className="event-log"
          />

          <ModuleCard
            title="Lost & Found"
            description="Image recognition AI for automatic item matching and guest notification system"
            icon="fas fa-search"
            stats={[
              { label: "Items", value: "47" },
              { label: "AI Matched", value: "18" }
            ]}
            enhancement={{ type: "iot", icon: "fas fa-camera", label: "Image AI" }}
            className="lost-found"
          />

          <ModuleCard
            title="Packages"
            description="Smart tracking with guest mobile app integration and delivery notifications"
            icon="fas fa-box"
            stats={[
              { label: "Pending", value: "18" },
              { label: "Delivered", value: "34" }
            ]}
            className="packages"
          />

          <ModuleCard
            title="Access Control"
            description="Biometric authentication with digital keys and real-time access monitoring"
            icon="fas fa-key"
            stats={[
              { label: "Digital Keys", value: "892" },
              { label: "Biometric", value: "156" }
            ]}
            enhancement={{ type: "biometric", icon: "fas fa-fingerprint", label: "Biometric" }}
            className="keys"
          />

          <ModuleCard
            title="Visitors"
            description="Facial recognition for banned individuals and automated guest verification"
            icon="fas fa-users"
            stats={[
              { label: "Today", value: "127" },
              { label: "AI Verified", value: "98" }
            ]}
            enhancement={{ type: "biometric", icon: "fas fa-face-viewfinder", label: "Facial AI" }}
            className="visitors"
          />

          <ModuleCard
            title="Admin"
            description="System configuration with integrated training modules and compliance tracking"
            icon="fas fa-cogs"
            stats={[
              { label: "Users", value: "45" },
              { label: "Trained", value: "42" }
            ]}
            className="admin"
          />

          <ModuleCard
            title="Banned Individuals"
            description="Automated facial recognition alerts with real-time security notifications"
            icon="fas fa-ban"
            stats={[
              { label: "Active", value: "15" },
              { label: "Detected", value: "0" }
            ]}
            enhancement={{ type: "biometric", icon: "fas fa-eye", label: "Auto-Detect" }}
            className="banned"
          />

          <ModuleCard
            title="Smart Lockers"
            description="IoT-enabled lockers with remote monitoring and automated maintenance alerts"
            icon="fas fa-lock"
            stats={[
              { label: "Occupied", value: "67" },
              { label: "IoT Status", value: "100%" }
            ]}
            enhancement={{ type: "iot", icon: "fas fa-wifi", label: "IoT" }}
            className="lockers"
          />

          <ModuleCard
            title="Smart Parking"
            description="IoT sensors for real-time availability with guest mobile app integration"
            icon="fas fa-parking"
            stats={[
              { label: "Occupied", value: "184" },
              { label: "Sensors", value: "210" }
            ]}
            enhancement={{ type: "iot", icon: "fas fa-car-side", label: "Smart" }}
            className="parking"
          />

          <ModuleCard
            title="Patrol"
            description="Predictive AI routing with real-time staff tracking and wearable device integration"
            icon="fas fa-walking"
            stats={[
              { label: "Active", value: "12" },
              { label: "AI Routes", value: "8" }
            ]}
            enhancement={{ type: "predictive", icon: "fas fa-brain", label: "AI Enhanced" }}
            className="patrol enhanced"
          />

          <ModuleCard
            title="Digital Handover"
            description="Automated shift transitions with AI-generated briefings and priority alerts"
            icon="fas fa-exchange-alt"
            stats={[
              { label: "Current", value: "Day Shift" },
              { label: "Next", value: "18:00" }
            ]}
            className="handover"
          />

          <ModuleCard
            title="Advanced Reports"
            description="AI-powered analytics with predictive insights and automated compliance reporting"
            icon="fas fa-chart-bar"
            stats={[
              { label: "Generated", value: "24" },
              { label: "AI Insights", value: "12" }
            ]}
            enhancement={{ type: "predictive", icon: "fas fa-chart-area", label: "Analytics" }}
            className="reports"
          />

          <ModuleCard
            title="Cybersecurity Hub"
            description="24/7 threat monitoring with AI-powered attack prevention and guest data protection"
            icon="fas fa-shield-virus"
            stats={[
              { label: "Threats Blocked", value: "7" },
              { label: "Status", value: "Secure" }
            ]}
            enhancement={{ type: "predictive", icon: "fas fa-shield-virus", label: "Live" }}
            className="cybersecurity"
          />

          <ModuleCard
            title="Guest Safety"
            description="Mobile panic buttons, emergency response, and real-time guest communication system"
            icon="fas fa-heart-pulse"
            stats={[
              { label: "App Users", value: "247" },
              { label: "Response", value: "1.2m" }
            ]}
            enhancement={{ type: "biometric", icon: "fas fa-mobile-alt", label: "App" }}
            className="guest-safety"
          />

          <ModuleCard
            title="IoT Environmental"
            description="Smart sensors for fire, flood, gas detection with automated emergency response protocols"
            icon="fas fa-microchip"
            stats={[
              { label: "Sensors", value: "342" },
              { label: "Online", value: "339" }
            ]}
            enhancement={{ type: "iot", icon: "fas fa-satellite-dish", label: "Live" }}
            className="iot-monitoring"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="modules-section">
        <h2 className="section-title">
          <i className="fas fa-history"></i>
          Enhanced Activity Stream
        </h2>
        
        <div className="recent-activity">
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-brain"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">AI predicted and prevented potential incident in Pool Area - 94% accuracy</div>
              <div className="activity-time">30 seconds ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">Guest panic button activated - Security responded in 52 seconds</div>
              <div className="activity-time">2 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-fingerprint"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">Biometric access anomaly detected - Staff member verified via secondary authentication</div>
              <div className="activity-time">3 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-shield-virus"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">Cybersecurity AI blocked phishing attempt targeting front desk</div>
              <div className="activity-time">5 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-camera"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">Image recognition AI matched lost item - Guest notified automatically</div>
              <div className="activity-time">8 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-microchip"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">IoT sensors detected maintenance issue in HVAC system - Work order created</div>
              <div className="activity-time">12 minutes ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
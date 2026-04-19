'use client';

import React, { useState } from 'react';
import { useTranslation } from '@inherenttech/ui';

type Integration = {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected';
  description: string;
  color: string;
};

const INTEGRATIONS: Integration[] = [
  { id: 'slack', name: 'Slack', icon: '💬', status: 'connected', description: 'Notifications and activity updates', color: '#36C5F0' },
  { id: 'gmail', name: 'Gmail', icon: '📧', status: 'connected', description: 'Email sync and inbox integration', color: '#EA4335' },
  { id: 'calendly', name: 'Calendly', icon: '📅', status: 'disconnected', description: 'Meeting scheduling integration', color: '#007AB9' },
  { id: 'ecafy', name: 'eCafy', icon: '📨', status: 'connected', description: 'Email campaigns and outreach', color: '#FF6B35' },
  { id: 'payments', name: 'InherentPayments', icon: '💳', status: 'connected', description: 'Invoice and payment processing', color: '#22C55E' },
];

const PIPELINE_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      border: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28 }}>{integration.icon}</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>
            {integration.name}
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
            {integration.description}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {integration.status === 'connected' && (
          <div style={{
            padding: '4px 10px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
          }}>
            ✓ Connected
          </div>
        )}
        <button style={{
          padding: '6px 12px',
          border: `1px solid ${integration.status === 'connected' ? '#e5e7eb' : integration.color}`,
          backgroundColor: integration.status === 'connected' ? '#f9fafb' : integration.color,
          color: integration.status === 'connected' ? '#6b7280' : 'white',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          {integration.status === 'connected' ? 'Manage' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    orgName: 'InherentTech Solutions',
    timezone: 'America/New_York',
    currency: 'USD',
  });

  const tabs = ['general', 'team', 'integrations', 'billing', 'notifications'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px', color: '#111827' }}>Settings</h2>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid #e5e7eb',
        marginBottom: 32,
      }}>
        {tabs.map((tab: string) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
              marginBottom: '-1px',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 24px', color: '#111827' }}>General Settings</h3>

          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 600,
          }}>
            {/* Organization Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 8,
              }}>
                Organization Name
              </label>
              <input
                type="text"
                value={formData.orgName}
                onChange={e => handleInputChange('orgName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  backgroundColor: '#f9fafb',
                }}
              />
            </div>

            {/* Timezone */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 8,
              }}>
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={e => handleInputChange('timezone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                }}
              >
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Denver</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
                <option>Asia/Tokyo</option>
                <option>Asia/Singapore</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 8,
              }}>
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => handleInputChange('currency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                }}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
                <option>CAD</option>
              </select>
            </div>

            {/* Pipeline Stages */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 12,
              }}>
                Default Pipeline Stages
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {PIPELINE_STAGES.map((stage: string) => (
                  <div
                    key={stage}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ width: 12, height: 12, backgroundColor: '#d1d5db', borderRadius: 2 }} />
                    {stage}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '12px 0 0' }}>
                Customize pipeline stages in the Pipeline section
              </p>
            </div>

            {/* Save Button */}
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              marginTop: 12,
            }}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 24px', color: '#111827' }}>Team Management</h3>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 48,
            textAlign: 'center',
            color: '#6b7280',
          }}>
            <p style={{ fontSize: 14, margin: 0 }}>Team member management coming soon. Manage users and permissions here.</p>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 24px', color: '#111827' }}>Integrations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {INTEGRATIONS.map((integration: Integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '24px 0 0' }}>
            Connect your favorite tools to enhance your CRM experience. All integrations are secure and encrypted.
          </p>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 24px', color: '#111827' }}>Billing & Subscription</h3>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 48,
            textAlign: 'center',
            color: '#6b7280',
          }}>
            <p style={{ fontSize: 14, margin: 0 }}>Billing information and subscription management coming soon.</p>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 24px', color: '#111827' }}>Notification Preferences</h3>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 48,
            textAlign: 'center',
            color: '#6b7280',
          }}>
            <p style={{ fontSize: 14, margin: 0 }}>Customize your notification preferences here. Coming soon.</p>
          </div>
        </div>
      )}
    </div>
  );
}

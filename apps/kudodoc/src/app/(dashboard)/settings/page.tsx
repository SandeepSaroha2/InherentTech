'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    orgName: 'InherentTech Inc.',
    signatureMethod: 'draw',
    autoReminderDays: '3',
    documentRetention: '90',
    templatePrefix: 'TMPL_',
    enableAutoSign: false,
    notifyOnExpiry: true,
    integrateSlack: false,
    integrateZapier: false,
  });

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>Settings</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Manage your KudoDoc settings and preferences.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e5e7eb' }}>
        {['general', 'templates', 'notifications', 'integrations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
            <FormGroup
              label="Organization Name"
              value={settings.orgName}
              onChange={(v) => handleChange('orgName', v)}
              type="text"
            />
            <FormGroup
              label="Default Signature Method"
              value={settings.signatureMethod}
              onChange={(v) => handleChange('signatureMethod', v)}
              type="select"
              options={[
                { value: 'draw', label: 'Draw' },
                { value: 'type', label: 'Type' },
                { value: 'upload', label: 'Upload Image' },
              ]}
            />
            <FormGroup
              label="Auto-Reminder Days"
              value={settings.autoReminderDays}
              onChange={(v) => handleChange('autoReminderDays', v)}
              type="number"
              description="Days before signature request expires"
            />
            <FormGroup
              label="Document Retention (days)"
              value={settings.documentRetention}
              onChange={(v) => handleChange('documentRetention', v)}
              type="number"
              description="How long to keep completed documents"
            />
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Save Settings
            </button>
          </div>
        )}

        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
            <FormGroup
              label="Template Name Prefix"
              value={settings.templatePrefix}
              onChange={(v) => handleChange('templatePrefix', v)}
              type="text"
              description="Prefix for all new templates (e.g., TMPL_)"
            />
            <FormGroup
              label="Enable Auto-Sign for Organizer"
              value={settings.enableAutoSign}
              onChange={(v) => handleChange('enableAutoSign', v)}
              type="checkbox"
              description="Automatically sign as organizer on template creation"
            />
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Save Settings
            </button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
            <FormGroup
              label="Notify on Document Expiry"
              value={settings.notifyOnExpiry}
              onChange={(v) => handleChange('notifyOnExpiry', v)}
              type="checkbox"
              description="Send email notifications when documents are about to expire"
            />
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: '#166534',
            }}>
              Notification preferences are tied to your email settings. Manage your email subscription in your profile.
            </div>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Save Settings
            </button>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
            <FormGroup
              label="Slack Integration"
              value={settings.integrateSlack}
              onChange={(v) => handleChange('integrateSlack', v)}
              type="checkbox"
              description="Get signature request updates in Slack"
            />
            <FormGroup
              label="Zapier Integration"
              value={settings.integrateZapier}
              onChange={(v) => handleChange('integrateZapier', v)}
              type="checkbox"
              description="Connect KudoDoc with Zapier for automation"
            />
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: '#0369a1',
            }}>
              Additional integrations like Salesforce, HubSpot, and more coming soon.
            </div>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormGroup({
  label,
  value,
  onChange,
  type = 'text',
  description,
  options,
}: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'select' | 'checkbox';
  description?: string;
  options?: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{label}</label>
      {type === 'checkbox' ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: '#6b7280' }}>{description || ''}</span>
        </label>
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 13,
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 13,
          }}
        />
      )}
      {description && type !== 'checkbox' && (
        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>{description}</p>
      )}
    </div>
  );
}

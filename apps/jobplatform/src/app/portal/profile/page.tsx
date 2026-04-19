'use client';

import { useState } from 'react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  skills: string[];
  certifications: string[];
  visaStatus: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
    certifications: ['AWS Solutions Architect', 'Certified Kubernetes Administrator'],
    visaStatus: 'US Citizen',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '(555) 987-6543',
    emergencyContactRelation: 'Spouse',
  });

  const handleInputChange = (field: keyof ProfileData, value: string): void => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = (): void => {
    setIsEditing(false);
    alert('Profile updated successfully');
    console.log('Profile saved:', profile);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
            My Profile
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Manage your personal information
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4338ca';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
            }}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Personal Information Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
          Personal Information
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {/* First Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              First Name
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Last Name
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Phone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Address */}
          <div style={{ gridColumn: 'span 2' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Address
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* City */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              City
            </label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* State */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              State
            </label>
            <input
              type="text"
              value={profile.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* ZIP Code */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              ZIP Code
            </label>
            <input
              type="text"
              value={profile.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Skills & Certifications Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
          Skills & Certifications
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Skills */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px',
              }}
            >
              Skills
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  style={{
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px',
              }}
            >
              Certifications
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.certifications.map((cert: string) => (
                <span
                  key={cert}
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#0c4a6e',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Employment Information Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
          Employment Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Visa Status */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Visa Status
            </label>
            <input
              type="text"
              value={profile.visaStatus}
              onChange={(e) => handleInputChange('visaStatus', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
          Emergency Contact
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Emergency Contact Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Name
            </label>
            <input
              type="text"
              value={profile.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Emergency Contact Phone */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Phone
            </label>
            <input
              type="tel"
              value={profile.emergencyContactPhone}
              onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Emergency Contact Relation */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Relationship
            </label>
            <input
              type="text"
              value={profile.emergencyContactRelation}
              onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#0f172a',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e2e8f0',
              color: '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
            }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

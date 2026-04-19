'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';

// Mock jobs data for now (until database is populated)
const MOCK_JOBS = [
  {
    id: '1',
    title: 'Senior Java Developer',
    location: 'Dallas, TX',
    rateRange: { min: 75, max: 85, type: 'hourly' },
    requirements: ['Java', 'Spring Boot', 'Microservices', 'SQL'],
    description: 'We are looking for an experienced Java developer with expertise in Spring Boot and microservices architecture.',
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-20'),
    availableOpenings: 2,
  },
  {
    id: '2',
    title: 'React/Node Full Stack',
    location: 'Remote',
    rateRange: { min: 70, max: 80, type: 'hourly' },
    requirements: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    description: 'Join our team as a Full Stack engineer building scalable web applications with React and Node.js.',
    openings: 3,
    filled: 1,
    createdAt: new Date('2026-03-22'),
    availableOpenings: 2,
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    location: 'Chicago, IL',
    rateRange: { min: 85, max: 95, type: 'hourly' },
    requirements: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
    description: 'Help us build and maintain robust cloud infrastructure using Kubernetes and AWS.',
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-21'),
    availableOpenings: 1,
  },
  {
    id: '4',
    title: 'Data Engineer (Snowflake)',
    location: 'New York, NY',
    rateRange: { min: 90, max: 100, type: 'hourly' },
    requirements: ['Snowflake', 'Python', 'SQL', 'Data Modeling', 'ETL'],
    description: 'Build scalable data pipelines and work with Snowflake data warehouse.',
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-19'),
    availableOpenings: 2,
  },
  {
    id: '5',
    title: 'QA Automation Lead',
    location: 'Austin, TX',
    rateRange: { min: 65, max: 75, type: 'hourly' },
    requirements: ['Selenium', 'Python', 'TestNG', 'CI/CD', 'Agile'],
    description: 'Lead our QA automation efforts and build comprehensive test suites.',
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-23'),
    availableOpenings: 1,
  },
  {
    id: '6',
    title: 'Cloud Architect (AWS)',
    location: 'Remote',
    rateRange: { min: 100, max: 120, type: 'hourly' },
    requirements: ['AWS', 'Cloud Architecture', 'Security', 'Cost Optimization'],
    description: 'Design and implement cloud solutions on AWS for enterprise clients.',
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-18'),
    availableOpenings: 1,
  },
  {
    id: '7',
    title: '.NET Developer',
    location: 'Atlanta, GA',
    rateRange: { min: 70, max: 80, type: 'hourly' },
    requirements: ['.NET', 'C#', 'SQL Server', 'Azure'],
    description: 'Build enterprise applications using .NET framework and C#.',
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-20'),
    availableOpenings: 2,
  },
  {
    id: '8',
    title: 'Python/ML Engineer',
    location: 'San Francisco, CA',
    rateRange: { min: 95, max: 110, type: 'hourly' },
    requirements: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science'],
    description: 'Work on ML models and AI solutions using Python and TensorFlow.',
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-21'),
    availableOpenings: 1,
  },
  {
    id: '9',
    title: 'Salesforce Developer',
    location: 'Houston, TX',
    rateRange: { min: 80, max: 90, type: 'hourly' },
    requirements: ['Salesforce', 'Apex', 'LWC', 'JavaScript'],
    description: 'Develop custom Salesforce solutions and integrations.',
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-22'),
    availableOpenings: 2,
  },
  {
    id: '10',
    title: 'Scrum Master',
    location: 'Remote',
    rateRange: { min: 60, max: 70, type: 'hourly' },
    requirements: ['Agile', 'Scrum', 'Leadership', 'Communication'],
    description: 'Lead agile teams and facilitate scrum ceremonies.',
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-23'),
    availableOpenings: 1,
  },
  {
    id: '11',
    title: 'Business Analyst',
    location: 'Dallas, TX',
    rateRange: { min: 55, max: 65, type: 'hourly' },
    requirements: ['Business Analysis', 'SQL', 'Requirements Gathering'],
    description: 'Analyze business requirements and translate them to technical solutions.',
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-20'),
    availableOpenings: 2,
  },
  {
    id: '12',
    title: 'Cybersecurity Analyst',
    location: 'Washington, DC',
    rateRange: { min: 85, max: 100, type: 'hourly' },
    requirements: ['Security', 'Penetration Testing', 'Compliance', 'SIEM'],
    description: 'Protect our systems and data from security threats.',
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-19'),
    availableOpenings: 1,
  },
];

interface Job {
  id: string;
  title: string;
  location: string;
  rateRange: { min: number; max: number; type: string };
  requirements: string[];
  openings: number;
  filled: number;
  createdAt: Date;
  availableOpenings: number;
  description?: string;
}

const SKILL_OPTIONS = ['Java', 'Python', 'React', 'DevOps', 'Cloud', 'Data', 'QA', '.NET'];

export default function JobBoardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(MOCK_JOBS);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(150);
  const [page, setPage] = useState(1);

  // Apply filters
  useEffect(() => {
    let result = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.requirements.some(r => r.toLowerCase().includes(query))
      );
    }

    if (selectedLocation) {
      result = result.filter(job =>
        job.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    if (remoteOnly) {
      result = result.filter(job =>
        job.location.toLowerCase().includes('remote')
      );
    }

    if (selectedSkills.length > 0) {
      result = result.filter(job =>
        selectedSkills.some(skill =>
          job.requirements.some(req =>
            req.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    result = result.filter(
      job => job.rateRange.min >= minRate && job.rateRange.max <= maxRate
    );

    setFilteredJobs(result);
    setPage(1);
  }, [searchQuery, selectedLocation, remoteOnly, selectedSkills, minRate, maxRate, jobs]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleApplyClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedType('');
    setSelectedSkills([]);
    setRemoteOnly(false);
    setMinRate(0);
    setMaxRate(150);
  };

  // Pagination
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const formatRate = (rateRange: any) => {
    return `$${rateRange.min}-${rateRange.max}/${rateRange.type === 'hourly' ? 'hr' : 'yr'}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}m ago`;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero Section */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 12,
          }}
        >
          Find Your Next IT Opportunity
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
          Discover remote and on-site roles from leading technology companies
        </p>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          <input
            type="text"
            placeholder="Search by title, skill, or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Dallas">Dallas, TX</option>
            <option value="New York">New York, NY</option>
            <option value="Chicago">Chicago, IL</option>
            <option value="Austin">Austin, TX</option>
            <option value="Atlanta">Atlanta, GA</option>
            <option value="Houston">Houston, TX</option>
            <option value="San Francisco">San Francisco, CA</option>
            <option value="Washington">Washington, DC</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        {/* Sidebar Filters */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
          }}
        >
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Filters</h3>
              <button
                onClick={handleResetFilters}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reset
              </button>
            </div>

            {/* Remote Toggle */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={e => setRemoteOnly(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ color: '#374151' }}>Remote Only</span>
              </label>
            </div>

            {/* Skills Filter */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Skills</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SKILL_OPTIONS.map((skill: string) => (
                  <label
                    key={skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ color: '#374151' }}>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rate Range Slider */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Hourly Rate</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={minRate}
                  onChange={e => setMinRate(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={maxRate}
                  onChange={e => setMaxRate(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  placeholder="Max"
                />
              </div>
              <input
                type="range"
                min="0"
                max="150"
                value={maxRate}
                onChange={e => setMaxRate(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </aside>

        {/* Job Listings */}
        <main style={{ flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Showing {paginatedJobs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to{' '}
              {Math.min(page * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
            </p>
          </div>

          {paginatedJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {paginatedJobs.map((job: Job) => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 24,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        {job.title}
                      </h3>
                      <p style={{ fontSize: 13, color: '#6b7280' }}>
                        📍 {job.location}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplyClick(job.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Apply Now
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
                    <span>💰 {formatRate(job.rateRange)}</span>
                    <span>📋 {job.availableOpenings} opening{job.availableOpenings !== 1 ? 's' : ''}</span>
                    <span>📅 Posted {formatDate(job.createdAt)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {job.requirements.slice(0, 4).map((req: string) => (
                      <span
                        key={req}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 4 && (
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        +{job.requirements.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: 16, color: '#6b7280' }}>No jobs found matching your criteria.</p>
              <button
                onClick={handleResetFilters}
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page === 1 ? '#f3f4f6' : '#ffffff',
                  color: page === 1 ? '#9ca3af' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i: number) => i + 1).map((p: number) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: p === page ? '#2563eb' : '#ffffff',
                    color: p === page ? '#ffffff' : '#374151',
                    border: `1px solid ${p === page ? '#2563eb' : '#e5e7eb'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page === totalPages ? '#f3f4f6' : '#ffffff',
                  color: page === totalPages ? '#9ca3af' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

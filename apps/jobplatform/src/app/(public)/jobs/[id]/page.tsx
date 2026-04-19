'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applicationsApi } from '@/lib/api';

// Mock jobs data
const MOCK_JOBS: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Senior Java Developer',
    location: 'Dallas, TX',
    rateRange: { min: 75, max: 85, type: 'hourly' },
    requirements: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'REST APIs', 'JUnit'],
    description: `We are seeking a Senior Java Developer with 5+ years of experience to join our growing team.

You'll be responsible for designing and implementing scalable Java applications using Spring Boot framework.
This role involves working with microservices architecture, developing REST APIs, and optimizing database queries.

You will collaborate with cross-functional teams, participate in code reviews, and contribute to the overall
architecture of our platform. This is a fantastic opportunity to work with cutting-edge technologies and make
an impact on mission-critical systems serving thousands of users.

Key responsibilities include:
- Develop and maintain Java applications using Spring Boot
- Design and implement microservices architecture
- Write clean, well-tested code with high code coverage
- Mentor junior developers and conduct code reviews
- Optimize performance and scalability
- Collaborate with DevOps teams on deployment and monitoring`,
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-20'),
    availableOpenings: 2,
    company: 'Leading Technology Company',
    remote: false,
  },
  '2': {
    id: '2',
    title: 'React/Node Full Stack',
    location: 'Remote',
    rateRange: { min: 70, max: 80, type: 'hourly' },
    requirements: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redux', 'Jest'],
    description: `Join our team as a Full Stack engineer building scalable web applications with React and Node.js.

You'll develop both frontend and backend components of our web platform, working with modern JavaScript
technologies and best practices. Your role will involve creating responsive user interfaces, building robust
backend APIs, and ensuring optimal application performance.

We value developers who take ownership of their work, continuously learn new technologies, and collaborate
effectively with team members. This fully remote position offers flexibility and the opportunity to work
with a talented distributed team.

Responsibilities:
- Build React components for our web application
- Develop Node.js backend APIs
- Write and maintain automated tests
- Participate in architecture decisions
- Optimize frontend and backend performance
- Implement security best practices`,
    openings: 3,
    filled: 1,
    createdAt: new Date('2026-03-22'),
    availableOpenings: 2,
    company: 'Leading Technology Company',
    remote: true,
  },
  '3': {
    id: '3',
    title: 'DevOps Engineer',
    location: 'Chicago, IL',
    rateRange: { min: 85, max: 95, type: 'hourly' },
    requirements: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
    description: `Help us build and maintain robust cloud infrastructure using Kubernetes and AWS.

We're looking for an experienced DevOps engineer who can design, implement, and maintain our cloud
infrastructure. You'll work with containerized applications, manage Kubernetes clusters, and ensure
high availability and performance of our systems.

Your expertise in infrastructure as code, CI/CD pipelines, and cloud services will be crucial in
scaling our platform to support millions of users. This role offers the opportunity to work with
modern cloud technologies and build infrastructure that makes a difference.

Key duties:
- Design and manage Kubernetes clusters
- Implement CI/CD pipelines
- Manage AWS infrastructure and services
- Write infrastructure as code using Terraform
- Monitor and optimize system performance
- Implement security and compliance controls`,
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-21'),
    availableOpenings: 1,
    company: 'Leading Technology Company',
    remote: false,
  },
  '4': {
    id: '4',
    title: 'Data Engineer (Snowflake)',
    location: 'New York, NY',
    rateRange: { min: 90, max: 100, type: 'hourly' },
    requirements: ['Snowflake', 'Python', 'SQL', 'Data Modeling', 'ETL', 'Apache Spark'],
    description: `Build scalable data pipelines and work with Snowflake data warehouse.

We're seeking a talented Data Engineer to join our analytics team. You'll design and implement
data pipelines that process millions of records daily, work with our Snowflake data warehouse,
and enable data-driven decision-making across the organization.

This role involves working with large datasets, optimizing query performance, and building
ETL processes that are reliable and maintainable. You'll collaborate with data scientists
and business analysts to understand requirements and deliver solutions that unlock insights.

Responsibilities:
- Design and implement data pipelines using Python and SQL
- Manage and optimize Snowflake data warehouse
- Develop ETL processes using Apache Spark
- Implement data quality checks
- Optimize query performance
- Document data models and processes`,
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-19'),
    availableOpenings: 2,
    company: 'Leading Technology Company',
    remote: false,
  },
  '5': {
    id: '5',
    title: 'QA Automation Lead',
    location: 'Austin, TX',
    rateRange: { min: 65, max: 75, type: 'hourly' },
    requirements: ['Selenium', 'Python', 'TestNG', 'CI/CD', 'Agile'],
    description: `Lead our QA automation efforts and build comprehensive test suites.

We're looking for an experienced QA Automation Engineer who can lead our testing initiatives.
You'll design automation frameworks, develop test strategies, and mentor team members to ensure
the highest quality standards.

Your role will involve creating automated test suites for web and API applications, integrating
tests into CI/CD pipelines, and continuously improving our testing practices. You'll work closely
with developers and product managers to ensure quality at every stage of development.

Key responsibilities:
- Design and implement automation frameworks
- Develop comprehensive test suites
- Lead QA automation initiatives
- Mentor QA engineers
- Integrate tests into CI/CD pipelines
- Analyze test results and recommend improvements`,
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-23'),
    availableOpenings: 1,
    company: 'Leading Technology Company',
    remote: false,
  },
  '6': {
    id: '6',
    title: 'Cloud Architect (AWS)',
    location: 'Remote',
    rateRange: { min: 100, max: 120, type: 'hourly' },
    requirements: ['AWS', 'Cloud Architecture', 'Security', 'Cost Optimization', 'Compliance'],
    description: `Design and implement cloud solutions on AWS for enterprise clients.

We're seeking a Cloud Architect with deep AWS expertise to lead architectural decisions for
our platform. You'll design scalable, secure, and cost-effective cloud solutions that support
our growing user base.

This role requires someone who understands cloud best practices, can make strategic architectural
decisions, and can communicate technical concepts to stakeholders. You'll work with engineering
teams to implement your designs and ensure they meet business and technical requirements.

Responsibilities:
- Design AWS cloud architecture
- Optimize costs and performance
- Implement security best practices
- Ensure compliance with regulations
- Review and approve technical designs
- Stay current with AWS services and updates`,
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-18'),
    availableOpenings: 1,
    company: 'Leading Technology Company',
    remote: true,
  },
  '7': {
    id: '7',
    title: '.NET Developer',
    location: 'Atlanta, GA',
    rateRange: { min: 70, max: 80, type: 'hourly' },
    requirements: ['.NET', 'C#', 'SQL Server', 'Azure', 'Entity Framework'],
    description: `Build enterprise applications using .NET framework and C#.

We're looking for skilled .NET developers to expand our team. You'll work on enterprise
applications that power our business operations, developing features that impact thousands of users.

Your expertise in C#, ASP.NET, and SQL Server will be essential in building robust, scalable
applications. You'll follow SOLID principles, write clean code, and contribute to our architecture.

Key duties:
- Develop ASP.NET applications
- Design and implement SQL Server databases
- Work with Azure cloud services
- Follow SOLID principles and design patterns
- Write unit and integration tests
- Participate in code reviews`,
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-20'),
    availableOpenings: 2,
    company: 'Leading Technology Company',
    remote: false,
  },
  '8': {
    id: '8',
    title: 'Python/ML Engineer',
    location: 'San Francisco, CA',
    rateRange: { min: 95, max: 110, type: 'hourly' },
    requirements: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'Pandas'],
    description: `Work on ML models and AI solutions using Python and TensorFlow.

Join our ML team and work on cutting-edge artificial intelligence projects. You'll develop
machine learning models that power intelligent features in our platform.

This role requires strong Python skills, machine learning knowledge, and the ability to
translate business problems into ML solutions. You'll work with large datasets, experiment
with different algorithms, and deploy models to production.

Responsibilities:
- Develop and train ML models using TensorFlow
- Analyze large datasets using Pandas and NumPy
- Evaluate model performance and optimize accuracy
- Deploy models to production
- Collaborate with data scientists and engineers
- Keep up with ML research and best practices`,
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-21'),
    availableOpenings: 1,
    company: 'Leading Technology Company',
    remote: false,
  },
  '9': {
    id: '9',
    title: 'Salesforce Developer',
    location: 'Houston, TX',
    rateRange: { min: 80, max: 90, type: 'hourly' },
    requirements: ['Salesforce', 'Apex', 'LWC', 'JavaScript', 'SOQL'],
    description: `Develop custom Salesforce solutions and integrations.

We're seeking a Salesforce developer to build custom solutions and integrations on the
Salesforce platform. You'll work with Apex, Lightning Web Components, and other Salesforce
technologies to meet business requirements.

Your role will involve designing solutions, writing clean code, and ensuring high quality.
You'll work with business analysts, clients, and fellow developers to deliver solutions
that provide business value.

Key responsibilities:
- Develop Apex classes and triggers
- Build Lightning Web Components
- Create SOQL and SOSL queries
- Implement integrations with external systems
- Optimize Salesforce performance
- Write comprehensive documentation`,
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-22'),
    availableOpenings: 2,
    company: 'Leading Technology Company',
    remote: false,
  },
  '10': {
    id: '10',
    title: 'Scrum Master',
    location: 'Remote',
    rateRange: { min: 60, max: 70, type: 'hourly' },
    requirements: ['Agile', 'Scrum', 'Leadership', 'Communication'],
    description: `Lead agile teams and facilitate scrum ceremonies.

We're looking for an experienced Scrum Master to join our organization. You'll facilitate
agile ceremonies, remove impediments, and help teams deliver value continuously.

This role is perfect for someone who is passionate about agile methodologies and wants to
help teams improve their practices. You'll work with cross-functional teams and drive
organizational agile transformation.

Responsibilities:
- Facilitate daily standups, planning, and retrospectives
- Remove impediments for the team
- Coach team members on agile practices
- Track team metrics and improvement opportunities
- Work with product owners to manage backlogs
- Foster a culture of continuous improvement`,
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-23'),
    availableOpenings: 1,
    company: 'Leading Technology Company',
    remote: true,
  },
  '11': {
    id: '11',
    title: 'Business Analyst',
    location: 'Dallas, TX',
    rateRange: { min: 55, max: 65, type: 'hourly' },
    requirements: ['Business Analysis', 'SQL', 'Requirements Gathering', 'Documentation'],
    description: `Analyze business requirements and translate them to technical solutions.

We're seeking a Business Analyst to bridge the gap between business and technology. You'll
gather requirements, create detailed specifications, and ensure solutions meet business needs.

Your role involves working with stakeholders across the organization, understanding their
needs, and translating them into technical requirements. You'll work with development teams
to ensure successful implementation.

Key duties:
- Gather and analyze business requirements
- Create functional specifications
- Document user stories and use cases
- Work with developers on implementation
- Conduct user acceptance testing
- Manage change requests`,
    openings: 2,
    filled: 0,
    createdAt: new Date('2026-03-20'),
    availableOpenings: 2,
    company: 'Leading Technology Company',
    remote: false,
  },
  '12': {
    id: '12',
    title: 'Cybersecurity Analyst',
    location: 'Washington, DC',
    rateRange: { min: 85, max: 100, type: 'hourly' },
    requirements: ['Security', 'Penetration Testing', 'Compliance', 'SIEM'],
    description: `Protect our systems and data from security threats.

We're looking for a Cybersecurity Analyst to join our security team. You'll conduct
security assessments, implement security controls, and help protect our infrastructure
and data from threats.

Your expertise in security best practices, compliance frameworks, and security tools
will be critical. You'll work proactively to identify vulnerabilities and implement
solutions to mitigate risks.

Responsibilities:
- Conduct security assessments and penetration testing
- Monitor security alerts and incidents
- Implement security controls and best practices
- Ensure compliance with security standards
- Document security policies and procedures
- Respond to security incidents`,
    openings: 1,
    filled: 0,
    createdAt: new Date('2026-03-19'),
    availableOpenings: 1,
    company: 'Leading Technology Company',
    remote: false,
  },
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const job = MOCK_JOBS[params.id];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
    linkedIn: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!job) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Job Not Found</h1>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
          The job you're looking for doesn't exist or has been closed.
        </p>
        <button
          onClick={() => router.push('/jobs')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await applicationsApi.apply({
        jobId: job.id,
        ...formData,
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRate = (rateRange: any) => {
    return `$${rateRange.min}-${rateRange.max}/${rateRange.type === 'hourly' ? 'hr' : 'yr'}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
            Application Submitted!
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            Thank you for applying to {job.title}. We'll review your application and get back to you soon.
          </p>
          <button
            onClick={() => router.push('/jobs')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <button
        onClick={() => router.push('/jobs')}
        style={{
          marginBottom: 24,
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#2563eb',
          border: '1px solid #2563eb',
          borderRadius: 6,
          fontSize: 13,
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        ← Back to Jobs
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        {/* Main Content */}
        <div>
          {/* Job Header */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  {job.title}
                </h1>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                  {job.company}
                </p>
              </div>
              {job.remote && (
                <span
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Remote
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>LOCATION</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{job.location}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>RATE RANGE</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{formatRate(job.rateRange)}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>POSTED</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{formatDate(job.createdAt)}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>OPENINGS</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{job.availableOpenings} available</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>About This Role</h2>
            <div style={{ color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Required Skills</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {job.requirements.map((req: string) => (
                <span
                  key={req}
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Application Form */}
        <div>
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, position: 'sticky', top: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>Apply Now</h3>

            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Resume URL
                </label>
                <input
                  type="url"
                  name="resumeUrl"
                  value={formData.resumeUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedIn"
                  value={formData.linkedIn}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Cover Letter
                </label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  placeholder="Tell us why you're interested in this role..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px',
                  backgroundColor: submitting ? '#cbd5e1' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 8,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

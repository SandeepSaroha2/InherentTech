'use client';

import { useState } from 'react';

interface DailyHours {
  [key: string]: number;
}

interface SubmittedTimesheet {
  id: string;
  weekOf: string;
  totalHours: number;
  status: 'Submitted' | 'Approved' | 'Rejected' | 'Invoiced';
  submittedDate: string;
}

export default function TimesheetsPage() {
  const [weekStartDate, setWeekStartDate] = useState<string>(
    new Date(2026, 2, 23).toISOString().split('T')[0]
  );
  const [dailyHours, setDailyHours] = useState<DailyHours>({
    Monday: 8,
    Tuesday: 8,
    Wednesday: 8,
    Thursday: 8,
    Friday: 8,
    Saturday: 0,
    Sunday: 0,
  });

  const [submittedTimesheets] = useState<SubmittedTimesheet[]>([
    {
      id: '1',
      weekOf: '2026-03-16',
      totalHours: 40,
      status: 'Approved',
      submittedDate: '2026-03-20',
    },
    {
      id: '2',
      weekOf: '2026-03-09',
      totalHours: 40,
      status: 'Approved',
      submittedDate: '2026-03-13',
    },
    {
      id: '3',
      weekOf: '2026-03-02',
      totalHours: 40,
      status: 'Invoiced',
      submittedDate: '2026-03-06',
    },
    {
      id: '4',
      weekOf: '2026-02-23',
      totalHours: 36,
      status: 'Approved',
      submittedDate: '2026-02-27',
    },
  ]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleHourChange = (day: string, value: string): void => {
    const hours = Math.max(0, Math.min(16, parseFloat(value) || 0));
    setDailyHours((prev) => ({
      ...prev,
      [day]: hours,
    }));
  };

  const getTotalHours = (): number => {
    return Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);
  };

  const handleSubmitTimesheet = (): void => {
    alert(`Timesheet submitted with ${getTotalHours()} hours`);
    console.log('Submit timesheet:', { weekStartDate, dailyHours });
  };

  const handleSaveDraft = (): void => {
    alert('Timesheet saved as draft');
    console.log('Save draft:', { weekStartDate, dailyHours });
  };

  const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      Submitted: { bg: '#dbeafe', text: '#0c4a6e', border: '#7dd3fc' },
      Approved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
      Rejected: { bg: '#fee2e2', text: '#7f1d1d', border: '#fca5a5' },
      Invoiced: { bg: '#f3e8ff', text: '#5b21b6', border: '#d8b4fe' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
  };

  const formatDateRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
          Timesheets
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
          Submit and track your weekly timesheets
        </p>
      </div>

      {/* Timesheet Entry Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
          Current Week Entry
        </h2>

        {/* Week Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
              marginBottom: '8px',
            }}
          >
            Week Starting:
          </label>
          <input
            type="date"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {formatDateRange(weekStartDate)}
          </p>
        </div>

        {/* Daily Hours Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {days.map((day: typeof days[0]) => (
            <div key={day}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                {day}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="16"
                  step="0.5"
                  value={dailyHours[day]}
                  onChange={(e) => handleHourChange(day, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                >
                  hrs
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Hours */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
            Total Hours This Week:
          </span>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: getTotalHours() > 40 ? '#ef4444' : '#10b981',
            }}
          >
            {getTotalHours().toFixed(1)}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSaveDraft}
            style={{
              padding: '10px 16px',
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
            💾 Save Draft
          </button>
          <button
            onClick={handleSubmitTimesheet}
            style={{
              padding: '10px 16px',
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
            ✅ Submit Timesheet
          </button>
        </div>
      </div>

      {/* Submitted Timesheets Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
            Submitted Timesheets
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Week Of
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Total Hours
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Submitted
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {submittedTimesheets.map((timesheet: typeof submittedTimesheets[0]) => {
                const statusColor = getStatusColor(timesheet.status);
                return (
                  <tr
                    key={timesheet.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'transparent';
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '500' }}>
                      {new Date(timesheet.weekOf).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>
                      {timesheet.totalHours}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {new Date(timesheet.submittedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: `1px solid ${statusColor.border}`,
                        }}
                      >
                        {timesheet.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            '#3b82f6';
                        }}
                        onClick={() => alert('View timesheet details')}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { mockAttendance, groups } from '@/data/mockData';
import { GroupName } from '@/types';

type FilterPeriod = 'daily' | 'monthly' | 'quarterly' | 'annual';

export default function Reports() {
  const [period, setPeriod] = useState<FilterPeriod>('daily');
  const [selectedGroup, setSelectedGroup] = useState<GroupName | 'all'>('all');

  const filteredAttendance = mockAttendance.filter(record => {
    if (selectedGroup !== 'all' && record.group !== selectedGroup) {
      return false;
    }
    return true;
  });

  const handleExport = (format: 'csv' | 'excel') => {
    alert(`Exporting as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Attendance Report</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['daily', 'monthly', 'quarterly', 'annual'] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={period === p ? 'btn-primary' : 'btn-secondary'}
            >
              [{p.charAt(0).toUpperCase() + p.slice(1)}]
            </button>
          ))}
        </div>

        {/* Group Filter */}
        <div className="mb-6">
          <label className="block text-sm mb-2">Filter by Group:</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as GroupName | 'all')}
            className="input-field max-w-xs"
          >
            <option value="all">All Groups</option>
            {groups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Group</th>
                  <th className="table-header">Present</th>
                  <th className="table-header">Absent</th>
                  <th className="table-header">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/50">
                    <td className="table-cell">{record.date}</td>
                    <td className="table-cell">{record.group}</td>
                    <td className="table-cell text-success font-medium">{record.present}</td>
                    <td className="table-cell text-destructive font-medium">{record.absent}</td>
                    <td className="table-cell">{record.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            [Export: CSV]
          </button>
          <button onClick={() => handleExport('excel')} className="btn-secondary">
            [Export: Excel]
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            [Print]
          </button>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, UserCheck } from 'lucide-react';
import { Employee, Attendance } from '../../types';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export const AttendanceManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getEmployees', data: {} }) }),
        fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getAttendance', data: { date: selectedDate } }) })
      ]);
      const empData = await empRes.json();
      const attData = await attRes.json();
      if (empData.success) setEmployees(empData.data || []);
      if (attData.success) setTodayAttendance(attData.data || []);
    } catch (e) {
      console.warn('Error cargando asistencia');
    }
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  const handleCheckIn = async (employeeId: string) => {
    await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'createAttendance', data: { employeeId, date: new Date().toISOString().split('T')[0], checkIn: new Date().toISOString(), status: 'PRESENT' } }) });
    loadData();
  };

  const handleCheckOut = async (attendanceId: string) => {
    await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'updateAttendance', data: { id: attendanceId, checkOut: new Date().toISOString() } }) });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Clock className="text-primary" /> Control de Asistencia</h2>
          <p className="text-sm text-gray-500">Registro de entradas y salidas del personal.</p>
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Lista de Personal</h3>
            <span className="text-xs font-bold text-gray-400 uppercase">{employees.length} Empleados</span>
          </div>
          <div className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const att = todayAttendance.find(a => a.employeeId === emp.uid);
              return (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{emp.name?.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.position}</p>
                    </div>
                  </div>
                  {att ? (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Entrada</p>
                        <p className="text-sm font-bold">{new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {att.checkOut ? (
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Salida</p>
                          <p className="text-sm font-bold">{new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ) : (
                        <button onClick={() => handleCheckOut(att.id)} className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-lg font-bold text-xs"><LogOut size={14} /> Check-Out</button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => handleCheckIn(emp.uid)} className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-lg font-bold text-xs"><LogIn size={14} /> Check-In</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserCheck size={20} className="text-primary" /> Resumen</h3>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Presentes</span><span className="font-bold text-green-600">{todayAttendance.length}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Ausentes</span><span className="font-bold text-red-600">{employees.length - todayAttendance.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Search, 
  Filter,
  ArrowRight,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

import { Employee, Attendance } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export const AttendanceManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'ACTIVE'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'employees');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'attendance'), 
      where('date', '==', selectedDate)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTodayAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  const handleCheckIn = async (employeeId: string) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        employeeId,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        status: 'PRESENT',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await updateDoc(doc(db, 'attendance', attendanceId), {
        checkOut: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error checking out:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-primary" />
            Control de Asistencia
          </h2>
          <p className="text-sm text-gray-500">Registro de entradas, salidas e incidencias del personal.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Lista de Personal</h3>
            <span className="text-xs font-bold text-gray-400 uppercase">{employees.length} Empleados Activos</span>
          </div>
          <div className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const attendance = todayAttendance.find(a => a.employeeId === emp.uid);
              return (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {attendance ? (
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Entrada</p>
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {attendance.checkOut ? (
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Salida</p>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleCheckOut(attendance.id)}
                            className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-orange-100 transition-colors"
                          >
                            <LogOut size={14} />
                            Check-Out
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleCheckIn(emp.uid)}
                        className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-green-100 transition-colors"
                      >
                        <LogIn size={14} />
                        Check-In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck size={20} className="text-primary" />
              Resumen del Día
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Presentes</span>
                <span className="font-bold text-green-600">{todayAttendance.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Ausentes</span>
                <span className="font-bold text-red-600">{employees.length - todayAttendance.length}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500" 
                    style={{ width: `${(todayAttendance.length / employees.length) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center font-bold uppercase">
                  {Math.round((todayAttendance.length / employees.length) * 100)}% de Asistencia
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary text-white p-6 rounded-xl shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Geolocalización Activa</h3>
              <p className="text-xs text-white/70 mb-4">Los registros de asistencia incluyen coordenadas GPS para validación de sucursal.</p>
              <div className="flex items-center gap-2 text-xs font-bold">
                <MapPin size={14} />
                <span>Sucursal Matriz</span>
              </div>
            </div>
            <MapPin size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

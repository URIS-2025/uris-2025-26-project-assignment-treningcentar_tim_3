import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Users, User as PersonIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { reservationService } from '../services/reservationService';
import { checkinService, type CheckinDto } from '../services/checkinService';
import { TrainingType } from '../types/reservation';
const UserDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [currentDate] = useState(new Date());

  const [personalCount, setPersonalCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [reservations, setReservations] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<CheckinDto[]>([]);

  useEffect(() => {
    if (user?.id && token) {
      // Fetch Reservations
      reservationService.getUserReservations(user.id, token)
        .then(res => {
          if (!res) {
            setPersonalCount(0);
            setGroupCount(0);
            setReservations([]);
            return;
          }
          setReservations(res);
          const personal = res.filter(r => r.trainingType === TrainingType.Personal).length;
          const group = res.filter(r => r.trainingType === TrainingType.Group).length;
          setPersonalCount(personal);
          setGroupCount(group);
        })
        .catch(err => {
          console.error("Error fetching reservations:", err);
          setPersonalCount(0);
          setGroupCount(0);
          setReservations([]);
        });

      // Fetch Check-ins
      checkinService.getCurrentMonthCheckins(user.id, token)
        .then(data => {
          setCheckins(data || []);
        })
        .catch(err => {
          console.error("Error fetching check-ins:", err);
          setCheckins([]);
        });
    }
  }, [user?.id, token]);

  const stats = [
    {
      label: 'Check-ins',
      value: checkins.length,
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-50',
      trend: 'This month'
    },
    {
      label: 'Personal Sessions',
      value: personalCount,
      icon: <PersonIcon className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50',
      trend: '+2 this week'
    },
    {
      label: 'Group Sessions',
      value: groupCount,
      icon: <Users className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-50',
      trend: 'On track'
    }
  ];

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-amber-50/50 bg-neutral-50/30" />);
    }

    // Month days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const isToday = new Date().toDateString() === dayDate.toDateString();

      const dayCheckins = checkins.filter(c => new Date(c.timestamp).toDateString() === dayDate.toDateString());
      const dayPersonal = reservations.filter(r => r.trainingType === TrainingType.Personal && new Date(r.startTime).toDateString() === dayDate.toDateString());
      const dayGroup = reservations.filter(r => r.trainingType === TrainingType.Group && new Date(r.startTime).toDateString() === dayDate.toDateString());

      days.push(
        <div key={d} className={`h-24 border border-amber-100 p-2 relative group hover:bg-amber-50/50 transition-colors ${isToday ? 'bg-amber-50/30' : 'bg-white'}`}>
          <span className={`text-sm font-bold ${isToday ? 'text-amber-600 bg-amber-100 w-7 h-7 flex items-center justify-center rounded-full' : 'text-neutral-400'}`}>
            {d}
          </span>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {dayCheckins.length > 0 && (
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Gym Check-in" />
            )}
            {dayPersonal.length > 0 && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Personal Session" />
            )}
            {dayGroup.length > 0 && (
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" title="Group Session" />
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-amber-950 tracking-tight">Your Progress</h1>
          <p className="text-amber-800/60 font-medium">Keep up the great work this month!</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-2">
          <span className="text-sm font-bold text-amber-900 px-4">{monthName} {currentDate.getFullYear()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] p-8 shadow-xl shadow-amber-900/5 border border-amber-50 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-20 rounded-bl-[5rem] -mr-8 -mt-8`} />
            <div className="relative z-10">
              <div className="mb-4">{stat.icon}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-950">{stat.value}</span>
                <span className="text-sm font-bold text-amber-800/40 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">

                This month
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-amber-900/5 border border-amber-100 overflow-hidden">
        <div className="p-8 border-b border-amber-50 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-black text-amber-950">Activity Calendar</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-900/40 uppercase">
              <div className="w-2 h-2 bg-amber-500 rounded-full" /> Gym
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-900/40 uppercase">
              <div className="w-2 h-2 bg-blue-500 rounded-full" /> Personal
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-900/40 uppercase">
              <div className="w-2 h-2 bg-purple-500 rounded-full" /> Group
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 bg-amber-50/30 border-b border-amber-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollText, RefreshCw, Search, Filter, AlertTriangle } from 'lucide-react';
import { loggerAdminService, type SystemLog } from '../../services/loggerAdminService';

const LEVELS = ['All', 'Info', 'Warning', 'Error'];
const LEVEL_COLORS: Record<string, string> = {
    Info: 'bg-blue-100 text-blue-700',
    Warning: 'bg-amber-100 text-amber-700',
    Error: 'bg-rose-100 text-rose-700',
};
const LEVEL_DOT: Record<string, string> = {
    Info: 'bg-blue-500',
    Warning: 'bg-amber-500',
    Error: 'bg-rose-500',
};

const AdminSystemLogs: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('All');
    const [serviceFilter, setServiceFilter] = useState('All');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await loggerAdminService.getLogs();
            setLogs(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch {
            setError('Failed to load logs. Make sure the LoggerService is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const services = ['All', ...Array.from(new Set(logs.map((l) => l.serviceName).filter(Boolean)))];

    const filtered = logs.filter((l) => {
        const term = search.toLowerCase();
        const matchSearch = !term || l.message?.toLowerCase().includes(term) || l.action?.toLowerCase().includes(term) || l.entityType?.toLowerCase().includes(term);
        const matchLevel = levelFilter === 'All' || l.level === levelFilter;
        const matchService = serviceFilter === 'All' || l.serviceName === serviceFilter;
        return matchSearch && matchLevel && matchService;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100">
                        <ScrollText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-amber-950">System Logs</h1>
                        <p className="text-amber-900/40 text-sm font-medium">{filtered.length} of {logs.length} entries</p>
                    </div>
                </div>
                <button onClick={fetchLogs}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-amber-50 text-amber-900/60 text-sm font-black uppercase tracking-widest rounded-2xl transition-all border-2 border-amber-100 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/30 group-focus-within:text-amber-500 transition-colors" />
                    <input className="w-full bg-white border-2 border-amber-100 rounded-2xl pl-11 pr-4 py-3 text-amber-950 text-sm placeholder-amber-900/20 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-sm"
                        placeholder="Search logs by message, action, entity..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-3 bg-white border-2 border-amber-100 rounded-2xl px-4 py-3 shadow-sm min-w-[150px]">
                    <Filter className="w-4 h-4 text-amber-900/30" />
                    <select className="bg-transparent text-xs font-black uppercase tracking-widest text-amber-900/60 focus:outline-none w-full cursor-pointer" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                        {LEVELS.map((l) => <option key={l} value={l}>{l} Level</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 bg-white border-2 border-amber-100 rounded-2xl px-4 py-3 shadow-sm min-w-[200px]">
                    <Filter className="w-4 h-4 text-amber-900/30" />
                    <select className="bg-transparent text-xs font-black uppercase tracking-widest text-amber-900/60 focus:outline-none w-full cursor-pointer" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                        {services.map((s) => <option key={s} value={s}>{s} Service</option>)}
                    </select>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white border border-amber-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-8 py-5 border-b border-amber-50 bg-amber-50/10 flex items-center justify-between">
                    <h2 className="text-amber-950 font-black uppercase tracking-widest text-xs">Activity Feed</h2>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-widest">Live Monitoring</span>
                </div>

                {loading ? (
                    <div className="space-y-4 p-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-32 h-4 bg-amber-50 rounded-full" />
                                <div className="w-20 h-4 bg-amber-50 rounded-full" />
                                <div className="flex-1 h-4 bg-amber-50 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-amber-900/30 font-bold uppercase tracking-widest text-xs">No activity entries found</div>
                ) : (
                    <div className="divide-y divide-amber-50 font-mono text-[11px] max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {filtered.map((log) => (
                            <div key={log.id} className="flex gap-6 items-start px-8 py-4 hover:bg-amber-50/30 transition-colors group">
                                <span className="text-amber-900/40 flex-shrink-0 w-40 font-bold">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                                </span>
                                <span className={`flex-shrink-0 flex items-center gap-2 w-24`}>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_DOT[log.level] || 'bg-amber-300'}`} />
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${LEVEL_COLORS[log.level] || 'bg-amber-50 text-amber-700'}`}>
                                        {log.level}
                                    </span>
                                </span>
                                <span className="text-amber-900/60 flex-shrink-0 w-36 font-bold truncate tracking-tight">{log.serviceName}</span>
                                <span className="text-amber-600 flex-shrink-0 w-32 font-black uppercase tracking-tighter">{log.action}</span>
                                <span className="text-amber-950 flex-1 break-all leading-relaxed font-medium">{log.message}</span>
                                {log.entityType && (
                                    <span className="text-amber-900/30 flex-shrink-0 text-[10px] font-black uppercase tracking-widest">{log.entityType}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSystemLogs;

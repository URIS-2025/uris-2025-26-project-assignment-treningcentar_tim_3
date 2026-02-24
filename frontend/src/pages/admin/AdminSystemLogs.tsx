import React, { useEffect, useState, useCallback } from 'react';
import { ScrollText, RefreshCw, Search, Filter, AlertTriangle } from 'lucide-react';
import { loggerAdminService, type SystemLog } from '../../services/loggerAdminService';

const LEVELS = ['All', 'Info', 'Warning', 'Error'];
const LEVEL_COLORS: Record<string, string> = {
    Info: 'bg-blue-500/20 text-blue-400',
    Warning: 'bg-amber-500/20 text-amber-400',
    Error: 'bg-rose-500/20 text-rose-400',
};
const LEVEL_DOT: Record<string, string> = {
    Info: 'bg-blue-400',
    Warning: 'bg-amber-400',
    Error: 'bg-rose-400',
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
                    <div className="p-2 rounded-xl bg-neutral-700/50">
                        <ScrollText className="w-6 h-6 text-neutral-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">System Logs</h1>
                        <p className="text-neutral-500 text-sm">{filtered.length} of {logs.length} entries</p>
                    </div>
                </div>
                <button onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-bold rounded-xl transition-colors border border-white/5">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input className="w-full bg-neutral-900 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Search messages, actions..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 rounded-xl px-3">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <select className="bg-transparent text-sm text-neutral-300 focus:outline-none py-2.5" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 rounded-xl px-3">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <select className="bg-transparent text-sm text-neutral-300 focus:outline-none py-2.5" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                        {services.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Logs */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="space-y-px p-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-4 p-3 animate-pulse">
                                <div className="w-16 h-4 bg-neutral-800 rounded" />
                                <div className="flex-1 h-4 bg-neutral-800 rounded" />
                                <div className="w-24 h-4 bg-neutral-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-neutral-500">No log entries found</div>
                ) : (
                    <div className="divide-y divide-white/5 font-mono text-xs max-h-[60vh] overflow-y-auto">
                        {filtered.map((log) => (
                            <div key={log.id} className="flex gap-4 items-start px-5 py-3 hover:bg-white/2 transition-colors">
                                <span className="text-neutral-600 flex-shrink-0 w-36">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                                </span>
                                <span className={`flex-shrink-0 flex items-center gap-1.5 w-20`}>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_DOT[log.level] || 'bg-neutral-500'}`} />
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${LEVEL_COLORS[log.level] || 'bg-neutral-700 text-neutral-300'}`}>
                                        {log.level}
                                    </span>
                                </span>
                                <span className="text-neutral-500 flex-shrink-0 w-32">{log.serviceName}</span>
                                <span className="text-amber-300 flex-shrink-0 w-28">{log.action}</span>
                                <span className="text-neutral-300 flex-1 break-all">{log.message}</span>
                                {log.entityType && (
                                    <span className="text-neutral-600 flex-shrink-0">{log.entityType}</span>
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

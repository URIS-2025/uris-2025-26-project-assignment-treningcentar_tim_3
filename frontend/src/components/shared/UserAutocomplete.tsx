import React, { useState, useEffect, useRef, useCallback } from 'react';
import { userSearchService, type UserSearchResult } from '../../services/userSearchService';

interface Props {
    role: 'Member' | 'Trainer';
    placeholder?: string;
    onSelect: (user: UserSearchResult | null) => void;
    error?: string;
}

function useDebounce(value: string, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

const UserAutocomplete: React.FC<Props> = ({ role, placeholder, onSelect, error }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<UserSearchResult | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query, 300);

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // search when debounced query changes
    const doSearch = useCallback(async (q: string) => {
        if (q.trim().length < 1) {
            setResults([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const data = await userSearchService.search(q, role);
            setResults(data);
            setOpen(true);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        if (selected) return; // don't re-search after selection
        doSearch(debouncedQuery);
    }, [debouncedQuery, doSearch, selected]);

    const handleSelect = (user: UserSearchResult) => {
        setSelected(user);
        setQuery(`${user.firstName} ${user.lastName} (${user.username})`);
        setOpen(false);
        onSelect(user);
    };

    const handleClear = () => {
        setSelected(null);
        setQuery('');
        setResults([]);
        setOpen(false);
        onSelect(null);
    };

    const inputClass = `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors pr-8 ${error
            ? 'border-rose-300 focus:ring-rose-400 bg-rose-50'
            : selected
                ? 'border-emerald-300 focus:ring-emerald-400 bg-emerald-50'
                : 'border-amber-200 focus:ring-amber-400'
        }`;

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    placeholder={placeholder ?? `Search ${role}...`}
                    onChange={e => {
                        setQuery(e.target.value);
                        if (selected) {
                            // user started editing after selection → clear
                            setSelected(null);
                            onSelect(null);
                        }
                    }}
                    onFocus={() => {
                        if (!selected && query.trim().length >= 1) setOpen(true);
                    }}
                    className={inputClass}
                    autoComplete="off"
                />
                {/* clear / loading icon */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none text-sm">
                    {loading ? '⟳' : selected ? '✓' : '⌕'}
                </span>
                {selected && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-7 top-1/2 -translate-y-1/2 text-amber-400 hover:text-rose-500 text-xs font-bold leading-none"
                        title="Clear selection"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* error hint */}
            {error && <p className="text-xs text-rose-500 mt-1 font-semibold">{error}</p>}

            {/* dropdown */}
            {open && (
                <ul className="absolute z-50 mt-1 w-full bg-white border border-amber-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    {results.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-amber-900/40 italic">No results found</li>
                    ) : (
                        results.map(u => (
                            <li
                                key={u.id}
                                onMouseDown={() => handleSelect(u)}
                                className="flex flex-col px-4 py-2.5 cursor-pointer hover:bg-amber-50 transition-colors border-b border-amber-50 last:border-0"
                            >
                                <span className="text-sm font-bold text-amber-950">
                                    {u.firstName} {u.lastName}
                                </span>
                                <span className="text-xs text-amber-900/50">
                                    {u.username} · {u.email}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default UserAutocomplete;

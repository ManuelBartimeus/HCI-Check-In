import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, Loader2, UserCircle } from 'lucide-react';
import { searchMembers } from '@/api/members';
import { checkin } from '@/api/attendance';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';

export default function CheckInSection({ onSuccess }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const { data } = await searchMembers(q.trim(), 8);
      setSuggestions(data || []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 200);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setSelectedMember(null);
    debouncedSearch(val);
  }

  function selectMember(member) {
    setSelectedMember(member);
    setQuery(member.name);
    setOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  }

  async function handleCheckin() {
    if (!selectedMember) return;
    setCheckingIn(true);
    try {
      const { data } = await checkin(selectedMember.id);
      if (data.success) {
        toast.success(`Checked in! +${data.points_earned} pts 🎉`);
        onSuccess(data);
        setQuery('');
        setSelectedMember(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-in failed. Please try again.';
      toast.error(msg);
    } finally {
      setCheckingIn(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation in dropdown
  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' && selectedMember) { handleCheckin(); return; }
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      const first = dropdownRef.current?.querySelector('button');
      first?.focus();
    }
  }

  return (
    <div className="w-full">
      {/* Check-in card */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-[13px] font-medium text-ink-muted tracking-[0.04em] uppercase mb-5">
          Member Check-In
        </h2>

        {/* Search input */}
        <div className="relative" id="checkin-input-container">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            />
            <input
              ref={inputRef}
              id="member-search-input"
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
              placeholder="Enter your name..."
              className="input pl-10 pr-10 text-[16px] sm:text-[15px]"
              autoComplete="off"
              aria-label="Search for your name"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="member-suggestions"
            />
            {/* Loading spinner */}
            {searching && (
              <Loader2
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted animate-spin"
              />
            )}
            {/* Selected indicator */}
            {selectedMember && !searching && (
              <CheckCircle
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-semantic-success"
              />
            )}
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {open && suggestions.length > 0 && (
              <motion.ul
                ref={dropdownRef}
                id="member-suggestions"
                role="listbox"
                aria-label="Member suggestions"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 w-full mt-1.5 bg-surface-2 border border-hairline rounded-md
                           shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {suggestions.map((member, idx) => (
                  <motion.li key={member.id} role="option">
                    <button
                      id={`suggestion-${idx}`}
                      onClick={() => selectMember(member)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') { e.preventDefault(); document.getElementById(`suggestion-${idx + 1}`)?.focus(); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); idx > 0 ? document.getElementById(`suggestion-${idx - 1}`)?.focus() : inputRef.current?.focus(); }
                        if (e.key === 'Enter') selectMember(member);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left
                                 hover:bg-surface-1 focus:bg-surface-1 outline-none
                                 transition-colors duration-100 text-[14px]"
                    >
                      <div className="w-7 h-7 rounded-full bg-surface-1 border border-hairline flex items-center justify-center flex-shrink-0">
                        <UserCircle size={14} className="text-ink-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-ink font-medium truncate">{member.name}</div>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Check In button */}
        <motion.button
          id="checkin-button"
          onClick={handleCheckin}
          disabled={!selectedMember || checkingIn}
          whileTap={{ scale: 0.97 }}
          className={`btn-primary w-full mt-4 justify-center text-[15px] py-3 ${!selectedMember || checkingIn ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          aria-label="Check in to current meeting"
        >
          {checkingIn ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Checking in…
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Check In
            </>
          )}
        </motion.button>

        {/* Selected member preview */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 bg-surface-2 rounded-md px-4 py-3 border border-hairline">
                <div className="w-8 h-8 rounded-full spotlight-red flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-ink">{selectedMember.name}</div>
                  <div className="text-[11px] text-ink-muted">Ready to check in</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      <p className="text-[12px] text-ink-muted text-center mt-4 opacity-60">
        Search for your name to check in to the current meeting
      </p>
    </div>
  );
}

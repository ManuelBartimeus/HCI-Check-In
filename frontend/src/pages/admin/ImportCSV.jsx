import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';
import api from '@/api/index';
import toast from 'react-hot-toast';

export default function ImportCSV() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith('.csv')) {
      setFile(dropped);
      setResult(null);
    } else {
      toast.error('Please drop a CSV file');
    }
  }

  function handleFileSelect(e) {
    const selected = e.target.files[0];
    if (selected) { setFile(selected); setResult(null); }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/import/members', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.imported > 0) {
        toast.success(`${data.imported} members imported!`);
      } else {
        toast('No new members imported.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Import CSV</h1>
        <p className="text-[13px] text-ink-muted mt-0.5">Bulk import members from a CSV file</p>
      </div>

      {/* Rules card */}
      <div className="card p-5 space-y-2">
        <h2 className="text-[13px] font-semibold text-ink mb-3">CSV Rules</h2>
        {[
          'First column only — member names',
          'Ignores empty rows and whitespace',
          'Case-insensitive duplicate detection',
          'Shows imported, skipped, and error counts',
        ].map((rule, i) => (
          <div key={i} className="flex items-start gap-2 text-[13px] text-ink-muted">
            <CheckCircle size={13} className="text-semantic-success flex-shrink-0 mt-0.5" />
            {rule}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`card p-12 flex flex-col items-center justify-center text-center cursor-pointer
                    transition-all duration-200 ${
                      dragging
                        ? 'border-2 border-gradient-violet/70 bg-surface-2'
                        : 'border-2 border-dashed border-hairline hover:border-hairline hover:bg-surface-1/50'
                    }`}
        role="button"
        aria-label="Click or drag to upload CSV file"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${dragging ? 'spotlight-violet' : 'bg-surface-2'}`}>
          <Upload size={24} className="text-white" />
        </div>

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 text-ink font-medium">
                <FileText size={15} />
                {file.name}
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="ml-1 text-ink-muted hover:text-ink"
                  aria-label="Remove file"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-[12px] text-ink-muted mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-[14px] font-medium text-ink">Drop your CSV here or click to browse</p>
              <p className="text-[12px] text-ink-muted mt-1">Accepts .csv files only</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Import button */}
      {file && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleImport}
          disabled={importing}
          className={`btn-primary w-full justify-center py-3 text-[15px] ${importing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {importing ? 'Importing…' : `Import ${file.name}`}
        </motion.button>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-5 space-y-4"
          >
            <h2 className="text-[14px] font-semibold text-ink">Import Results</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Imported', value: result.imported, color: 'text-semantic-success' },
                { label: 'Duplicates', value: result.duplicates, color: 'text-amber-400' },
                { label: 'Skipped', value: result.skipped, color: 'text-ink-muted' },
                { label: 'Errors', value: result.errors, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-2 rounded-xl p-4 text-center">
                  <div className={`text-[22px] font-bold ${color}`}>{value}</div>
                  <div className="text-[12px] text-ink-muted mt-1">{label}</div>
                </div>
              ))}
            </div>

            {result.duplicate_names?.length > 0 && (
              <div>
                <p className="text-[12px] text-ink-muted mb-2">Skipped duplicates:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.duplicate_names.map(n => (
                    <span key={n} className="badge badge-warning text-[11px]">{n}</span>
                  ))}
                </div>
              </div>
            )}

            {result.error_details?.length > 0 && (
              <div>
                <p className="text-[12px] text-red-400 mb-2 flex items-center gap-1">
                  <AlertCircle size={12} /> Errors:
                </p>
                {result.error_details.map((e, i) => (
                  <p key={i} className="text-[12px] text-ink-muted">{e.name}: {e.reason}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

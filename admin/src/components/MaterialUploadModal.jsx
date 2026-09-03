import React, { useState, useRef } from 'react';
import materialService from '../services/materialService';

const MATERIAL_TYPES = [
  'Notes',
  'PYQs',
  'Question Banks',
  'Syllabus',
  'Lab Manuals',
  'Textbooks',
  'Others',
  'SEE',
  'Internals'
];

export default function MaterialUploadModal({ isOpen, onClose, onUploadSuccess, subjectsList = [] }) {
  const [filesList, setFilesList] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  // Global batch settings
  const [defaultSubjectId, setDefaultSubjectId] = useState('');
  const [defaultType, setDefaultType] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('Published');

  // Upload lifecycle state
  const [uploadStep, setUploadStep] = useState('idle'); // 'idle' | 'uploading' | 'storing' | 'processing' | 'done'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duplicateWarnings, setDuplicateWarnings] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Add files and query preview auto-match
  const handleAddFiles = async (newRawFiles) => {
    if (!newRawFiles || newRawFiles.length === 0) return;
    setErrorMessage(null);
    setDuplicateWarnings(null);

    const validFiles = Array.from(newRawFiles);
    const filenames = validFiles.map((f) => f.name);

    setIsMatching(true);

    let matchResults = [];
    try {
      const res = await materialService.previewMatch(filenames);
      matchResults = res.matches || [];
    } catch (err) {
      console.warn('Auto match preview request failed, falling back to client defaults:', err);
    } finally {
      setIsMatching(false);
    }

    const newEntries = validFiles.map((file, idx) => {
      const match = matchResults.find((m) => m.filename === file.name) || matchResults[idx];
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
        file,
        name: file.name,
        size: file.size,
        subjectId: match?.subject?._id || defaultSubjectId || '',
        subjectName: match?.subject?.name || '',
        subjectCode: match?.subject?.code || '',
        materialType: match?.materialType || defaultType || 'Notes',
        migrationStatus: match?.migrationStatus || (defaultSubjectId ? 'Manually Assigned' : 'Needs Review')
      };
    });

    setFilesList((prev) => [...prev, ...newEntries]);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Remove single file from queue
  const handleRemoveFile = (id) => {
    setFilesList((prev) => prev.filter((item) => item.id !== id));
  };

  // Update specific file metadata
  const handleFileChange = (id, field, value) => {
    setFilesList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'subjectId') {
          const found = subjectsList.find((s) => s._id === value);
          if (found) {
            updated.subjectName = found.name;
            updated.subjectCode = found.code;
            updated.migrationStatus = 'Manually Assigned';
          } else {
            updated.subjectName = '';
            updated.subjectCode = '';
            updated.migrationStatus = 'Needs Review';
          }
        }
        return updated;
      })
    );
  };

  // Apply default subject to all
  const applyDefaultSubject = (subId) => {
    setDefaultSubjectId(subId);
    if (!subId) return;
    const found = subjectsList.find((s) => s._id === subId);
    setFilesList((prev) =>
      prev.map((item) => ({
        ...item,
        subjectId: subId,
        subjectName: found?.name || '',
        subjectCode: found?.code || '',
        migrationStatus: 'Manually Assigned'
      }))
    );
  };

  // Apply default type to all
  const applyDefaultType = (t) => {
    setDefaultType(t);
    if (!t) return;
    setFilesList((prev) => prev.map((item) => ({ ...item, materialType: t })));
  };

  // Execute Upload
  const handleExecuteUpload = async (override = false) => {
    if (filesList.length === 0) return;
    setErrorMessage(null);
    setDuplicateWarnings(null);
    setUploadStep('uploading');
    setUploadProgress(0);

    const rawFiles = filesList.map((f) => f.file);
    const metadata = filesList.map((f) => ({
      filename: f.name,
      subjectId: f.subjectId || null,
      materialType: f.materialType,
      migrationStatus: f.migrationStatus
    }));

    try {
      const res = await materialService.uploadMaterials({
        files: rawFiles,
        defaultSubject: defaultSubjectId,
        defaultType,
        status: defaultStatus,
        metadata,
        override,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
          if (percent >= 100) {
            setUploadStep('storing');
          }
        }
      });

      // Handle duplicate warnings
      if (res.duplicate && res.duplicates?.length > 0 && !override) {
        setDuplicateWarnings(res.duplicates);
        setUploadStep('idle');
        return;
      }

      setUploadStep('processing');
      setTimeout(() => {
        setUploadStep('done');
        onUploadSuccess(res.message || `${filesList.length} materials uploaded successfully.`);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Upload failed');
      setUploadStep('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono text-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col border border-gray-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-[#18181b]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Upload Materials
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              Supported formats: PDF, PPT, PPTX, DOC, DOCX, ZIP, XLSX
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploadStep === 'uploading' || uploadStep === 'storing'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-200 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="border border-red-300 bg-red-50 p-2 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              ⚠ {errorMessage}
            </div>
          )}

          {/* Duplicate Warnings Alert */}
          {duplicateWarnings && duplicateWarnings.length > 0 && (
            <div className="border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 space-y-2">
              <div className="font-semibold text-xs">
                ⚠ {duplicateWarnings.length} duplicate file(s) detected in database:
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {duplicateWarnings.map((dup, i) => (
                  <li key={i}>
                    <strong>{dup.originalname}</strong> ({formatFileSize(dup.size)}) matches existing material:{' '}
                    <em>"{dup.existing?.title}"</em>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteUpload(true)}
                  className="border border-amber-600 bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-700"
                >
                  Upload Anyway (Override)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dupNames = new Set(duplicateWarnings.map((d) => d.originalname));
                    setFilesList((prev) => prev.filter((f) => !dupNames.has(f.name)));
                    setDuplicateWarnings(null);
                  }}
                  className="text-xs underline text-amber-800 dark:text-amber-200 hover:text-amber-950"
                >
                  Skip Duplicates
                </button>
              </div>
            </div>
          )}

          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed p-6 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-gray-300 bg-gray-50/40 hover:bg-gray-50 dark:border-zinc-700 dark:bg-[#141414] dark:hover:bg-[#161616]'
            }`}
          >
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                Drag & drop files here
              </p>
              <p className="text-[11px] text-gray-400">or</p>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.xlsx"
                  onChange={(e) => {
                    if (e.target.files) handleAddFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-[#1c1c1f] dark:text-gray-200 dark:hover:bg-zinc-800"
                >
                  Choose Files
                </button>
              </div>
            </div>
          </div>

          {/* Staging & Settings Bar */}
          {filesList.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2 text-xs dark:border-zinc-800">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Selected files: <span className="text-blue-600 dark:text-blue-400">{filesList.length}</span>
                  {isMatching && <span className="ml-2 text-gray-400 font-normal">Analyzing filenames...</span>}
                </div>

                {/* Batch defaults */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={defaultSubjectId}
                    onChange={(e) => applyDefaultSubject(e.target.value)}
                    className="max-w-xs border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-800 dark:border-zinc-700 dark:bg-[#141414] dark:text-gray-200"
                  >
                    <option value="">Set Subject for All ▾</option>
                    {subjectsList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={defaultType}
                    onChange={(e) => applyDefaultType(e.target.value)}
                    className="border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-800 dark:border-zinc-700 dark:bg-[#141414] dark:text-gray-200"
                  >
                    <option value="">Set Type for All ▾</option>
                    {MATERIAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setFilesList([])}
                    className="text-red-600 underline hover:text-red-800 text-[11px]"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Selected Files Staging Table */}
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 dark:border-zinc-800 dark:bg-[#141414] dark:text-gray-400 sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">File</th>
                      <th className="px-2.5 py-1.5 font-semibold">Size</th>
                      <th className="px-2.5 py-1.5 font-semibold">Subject</th>
                      <th className="px-2.5 py-1.5 font-semibold">Type</th>
                      <th className="px-2.5 py-1.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-mono">
                    {filesList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                        {/* Filename */}
                        <td className="px-2.5 py-1.5 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate" title={item.name}>
                          {item.name}
                        </td>

                        {/* Size */}
                        <td className="px-2.5 py-1.5 text-gray-500 whitespace-nowrap">
                          {formatFileSize(item.size)}
                        </td>

                        {/* Subject Selection / Match Result */}
                        <td className="px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={item.subjectId}
                              onChange={(e) => handleFileChange(item.id, 'subjectId', e.target.value)}
                              className="max-w-[220px] truncate border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] text-gray-800 dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-200"
                            >
                              <option value="">Unassigned (Needs Review)</option>
                              {subjectsList.map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.code} - {s.name}
                                </option>
                              ))}
                            </select>

                            {/* Badge */}
                            <span
                              className={`px-1 py-0.2 text-[10px] whitespace-nowrap ${
                                item.migrationStatus === 'Auto Matched'
                                  ? 'text-green-600 font-semibold'
                                  : item.migrationStatus === 'Manually Assigned'
                                  ? 'text-blue-600'
                                  : 'text-amber-600 font-semibold'
                              }`}
                            >
                              {item.migrationStatus}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-2.5 py-1.5">
                          <select
                            value={item.materialType}
                            onChange={(e) => handleFileChange(item.id, 'materialType', e.target.value)}
                            className="border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] text-gray-800 dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-200"
                          >
                            {MATERIAL_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Remove Action */}
                        <td className="px-2.5 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(item.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Remove file"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Processing & Lifecycle Tracker */}
          {uploadStep !== 'idle' && (
            <div className="border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20 text-xs space-y-2">
              <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <span>Upload Processing Lifecycle</span>
                <span>{uploadProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Step checklist */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] pt-1">
                <span className={uploadStep === 'uploading' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-green-600'}>
                  ✓ Uploading ({uploadProgress}%)
                </span>
                <span className="text-gray-300 dark:text-zinc-700">→</span>
                <span className={uploadStep === 'storing' ? 'font-bold text-blue-600 dark:text-blue-400' : uploadStep === 'processing' || uploadStep === 'done' ? 'text-green-600' : 'text-gray-400'}>
                  {uploadStep === 'storing' ? '● Storing to S3 & Hashing...' : 'Stored'}
                </span>
                <span className="text-gray-300 dark:text-zinc-700">→</span>
                <span className={uploadStep === 'processing' ? 'font-bold text-blue-600 dark:text-blue-400' : uploadStep === 'done' ? 'text-green-600' : 'text-gray-400'}>
                  {uploadStep === 'processing' ? '● Subject Matching & Indexing...' : 'Subject Matched'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={uploadStep === 'uploading' || uploadStep === 'storing'}
            className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={filesList.length === 0 || uploadStep === 'uploading' || uploadStep === 'storing'}
            onClick={() => handleExecuteUpload(false)}
            className="border border-blue-600 bg-blue-600 px-4 py-1 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadStep === 'uploading' || uploadStep === 'storing'
              ? 'Uploading...'
              : `Upload ${filesList.length > 0 ? `(${filesList.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

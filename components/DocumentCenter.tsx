import React, { useState, useRef } from 'react';
import { StoredDocument } from '../types';
import { FileText, Upload, Trash2, Download, Search, Filter, File, X, CheckCircle2 } from 'lucide-react';

interface DocumentCenterProps {
  documents: StoredDocument[];
  onAddDocument: (doc: Omit<StoredDocument, 'id' | 'date' | 'size'>) => void;
  onDeleteDocument: (id: string) => void;
  userRole: string;
}

const DocumentCenter: React.FC<DocumentCenterProps> = ({ documents, onAddDocument, onDeleteDocument, userRole }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Other' as StoredDocument['category'],
    description: '',
    fileData: '',
    fileType: '',
    fileName: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File size exceeds 5MB limit.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadForm(prev => ({
          ...prev,
          fileData: reader.result as string,
          fileType: file.type,
          fileName: file.name,
          title: prev.title || file.name // Auto-fill title if empty
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileData) return;

    onAddDocument({
      title: uploadForm.title,
      category: uploadForm.category,
      description: uploadForm.description,
      fileData: uploadForm.fileData,
      fileType: uploadForm.fileType,
    });

    setIsUploadModalOpen(false);
    setUploadForm({ title: '', category: 'Other', description: '', fileData: '', fileType: '', fileName: '' });
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'All' || doc.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Invoice': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Guest ID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Contract': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Report': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-600" /> Document Center
          </h2>
          <p className="text-sm text-slate-500">Securely store and manage hotel documents.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search docs..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
             />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <Upload size={18} /> Import Document
          </button>
        </div>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {['All', 'Invoice', 'Guest ID', 'Contract', 'Report', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterCategory === cat 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-4">Document Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                           <File size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{doc.title}</p>
                            <p className="text-xs text-slate-500 max-w-[200px] truncate">{doc.description || doc.fileType}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-semibold border ${getCategoryColor(doc.category)}`}>
                         {doc.category}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{formatSize(doc.size)}</td>
                    <td className="px-6 py-4">{new Date(doc.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <a 
                            href={doc.fileData} 
                            download={doc.title}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                          <button 
                            onClick={() => { if(window.confirm('Delete this document?')) onDeleteDocument(doc.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-slate-300" />
            </div>
            <p className="font-medium">No documents found.</p>
            <p className="text-sm mt-1">Upload invoices, guest IDs, or reports to keep them safe.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-800">Import Document</h3>
               <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select File</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${uploadForm.fileData ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}
                  >
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={handleFileChange}
                     />
                     {uploadForm.fileData ? (
                        <div className="text-emerald-600">
                           <CheckCircle2 className="mx-auto mb-2" size={24} />
                           <p className="text-sm font-bold truncate">{uploadForm.fileName}</p>
                           <p className="text-xs">Ready to upload</p>
                        </div>
                     ) : (
                        <div className="text-slate-500">
                           <Upload className="mx-auto mb-2" size={24} />
                           <p className="text-sm font-medium">Click to browse</p>
                           <p className="text-xs text-slate-400 mt-1">Max 5MB (PDF, Images, Text)</p>
                        </div>
                     )}
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                 <input 
                   type="text" 
                   required
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                   value={uploadForm.title}
                   onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                   placeholder="e.g. Invoice #1024"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                 <select 
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                   value={uploadForm.category}
                   onChange={e => setUploadForm({...uploadForm, category: e.target.value as any})}
                 >
                   <option value="Invoice">Invoice</option>
                   <option value="Guest ID">Guest ID</option>
                   <option value="Contract">Contract</option>
                   <option value="Report">Report</option>
                   <option value="Other">Other</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                 <input 
                   type="text" 
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                   value={uploadForm.description}
                   onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={!uploadForm.fileData}
                 className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-sm mt-2 transition-colors"
               >
                 Save to Database
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
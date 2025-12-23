import React, { useState, useRef, useEffect } from 'react';
import { StoredDocument } from '../types';
import { FileText, Upload, Trash2, Download, Search, Filter, File as FileIcon, X, CheckCircle2, Camera, ScanLine, Printer, Clipboard, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { analyzeDocument } from '../services/geminiService';
import { StorageService } from '../services/storage';

interface DocumentCenterProps {
  documents: StoredDocument[];
  onAddDocument: (doc: Omit<StoredDocument, 'id' | 'date' | 'size'>) => void;
  onDeleteDocument: (id: string) => void;
  userRole: string;
}

const DocumentCenter: React.FC<DocumentCenterProps> = ({ documents, onAddDocument, onDeleteDocument, userRole }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Other' as StoredDocument['category'],
    description: '',
    fileData: '',
    fileType: '',
    fileName: ''
  });

  // Handle global paste for quick upload
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!isUploadModalOpen) return;
      
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) processFile(blob);
            break; // Only take the first image
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isUploadModalOpen]);

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setUploadForm(prev => ({
        ...prev,
        fileData: base64Data,
        fileType: file.type,
        fileName: file.name,
        title: prev.title || file.name.split('.')[0]
      }));
      
      setIsUploadModalOpen(true);
      
      // Auto-analyze if it's an image
      if (file.type.startsWith('image/')) {
        await handleAIAnalysis(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAIAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDocument(base64);
      setUploadForm(prev => ({
        ...prev,
        title: analysis.title,
        category: analysis.category as any,
        description: analysis.description + (analysis.extractedText ? `\n\nExtracted Text: ${analysis.extractedText.substring(0, 200)}...` : '')
      }));
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (scannerInputRef.current) scannerInputRef.current.value = '';
  };

  const handlePasteClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        for (const type of imageTypes) {
          const blob = await item.getType(type);
          if (blob) {
            const file = new File([blob], "Pasted Image", { type });
            processFile(file);
            return;
          }
        }
      }
      alert("No image found in clipboard. Try copying an image first.");
    } catch (err) {
      console.error("Clipboard read failed", err);
      alert("Please press Ctrl+V to paste the image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileData) return;

    setIsAnalyzing(true);
    try {
      // Upload to Firebase Storage first
      const fileUrl = await StorageService.uploadFile(uploadForm.fileData, uploadForm.fileName);
      
      onAddDocument({
        title: uploadForm.title,
        category: uploadForm.category,
        description: uploadForm.description,
        fileData: fileUrl, // Now storing the URL (cloud or base64 fallback)
        fileType: uploadForm.fileType,
      });

      setIsUploadModalOpen(false);
      setUploadForm({ title: '', category: 'Other', description: '', fileData: '', fileType: '', fileName: '' });
    } catch (error) {
      alert("Failed to save document.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error", err);
      alert("Could not access camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const fileName = `Scan_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.jpg`;
        
        setUploadForm(prev => ({
          ...prev,
          fileData: dataUrl,
          fileType: 'image/jpeg',
          fileName: fileName,
          title: prev.title || `Scanned Doc ${new Date().toLocaleDateString()}`
        }));
        
        stopCamera();
        setIsUploadModalOpen(true);
        await handleAIAnalysis(dataUrl);
      }
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterCategory === 'All' || doc.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
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
          <p className="text-sm text-slate-500">Securely store and manage hotel documents with AI assistance.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search docs & text..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
             />
          </div>
          
          <button 
            onClick={() => scannerInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <Printer size={18} /> Scan from Device
            <input 
               type="file" 
               ref={scannerInputRef} 
               accept="image/*,application/pdf"
               className="hidden" 
               onChange={handleFileChange}
             />
          </button>

          <button 
            onClick={startCamera}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <Camera size={18} /> Use Camera
          </button>
          
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <Upload size={18} /> Import
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
                           <FileIcon size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{doc.title}</p>
                            <p className="text-xs text-slate-500 max-w-[300px] truncate">{doc.description || doc.fileType}</p>
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
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View / Download"
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

      {/* Scanning Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto bg-black" style={{ maxHeight: '70vh' }} />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                 <div className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-mono border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Live Camera
                 </div>
              </div>

              <div className="absolute inset-0 pointer-events-none opacity-30">
                 <div className="absolute top-1/4 bottom-1/4 left-1/4 right-1/4 border-2 border-emerald-500 rounded-lg"></div>
                 <div className="w-full h-full border-8 border-black/20"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-center gap-8 items-center">
                 <button 
                   onClick={stopCamera}
                   className="p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                 >
                   <X size={24} />
                 </button>
                 <button 
                   onClick={captureImage}
                   className="p-5 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 transition-transform active:scale-95 border-4 border-emerald-800"
                 >
                   <ScanLine size={32} />
                 </button>
              </div>
           </div>
           <p className="text-slate-400 mt-4 text-sm">Position document within frame and tap capture</p>
        </div>
      )}

      {/* Upload/Scan Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 {isAnalyzing ? <Sparkles className="text-emerald-500 animate-pulse" size={18} /> : null}
                 {isAnalyzing ? "AI is analyzing..." : "Add Document"}
               </h3>
               <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">File Source</label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isAnalyzing ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'} relative group`}>
                     {uploadForm.fileData ? (
                        <div className="flex flex-col items-center">
                           {uploadForm.fileType.startsWith('image/') ? (
                             <img src={uploadForm.fileData} alt="Preview" className="h-32 object-contain rounded-lg mb-2 shadow-sm bg-white" />
                           ) : (
                             <CheckCircle2 className="mx-auto mb-2 text-emerald-600" size={32} />
                           )}
                           {isAnalyzing && (
                              <div className="absolute inset-0 bg-emerald-50/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                                 <div className="flex flex-col items-center gap-2 text-emerald-700">
                                    <Loader2 className="animate-spin" size={32} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Analyzing with AI...</span>
                                 </div>
                              </div>
                           )}
                           <p className="text-sm font-bold truncate max-w-full px-4 text-emerald-700">{uploadForm.fileName}</p>
                           {!isAnalyzing && (
                             <button 
                               type="button"
                               onClick={() => setUploadForm(prev => ({ ...prev, fileData: '', fileName: '' }))}
                               className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium"
                             >
                               Remove & Replace
                             </button>
                           )}
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <div className="flex justify-center gap-4">
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                              >
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50">
                                  <Upload size={18} />
                                </div>
                                <span className="text-xs font-medium">Browse Files</span>
                              </button>

                              <button 
                                type="button"
                                onClick={handlePasteClick}
                                className="flex flex-col items-center gap-2 p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                              >
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50">
                                  <Clipboard size={18} />
                                </div>
                                <span className="text-xs font-medium">Paste Image</span>
                              </button>

                              <button 
                                type="button"
                                onClick={startCamera}
                                className="flex flex-col items-center gap-2 p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                              >
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50">
                                  <Camera size={18} />
                                </div>
                                <span className="text-xs font-medium">Camera</span>
                              </button>
                           </div>
                           <p className="text-xs text-slate-400">
                             Or drag & drop file here. Max 5MB.
                           </p>
                        </div>
                     )}
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={handleFileChange}
                     />
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
                   placeholder="AI will title this automatically..."
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
                 <label className="block text-sm font-medium text-slate-700 mb-1">Description & Extracted Data</label>
                 <textarea 
                   rows={4}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                   value={uploadForm.description}
                   onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                   placeholder="AI analysis will appear here..."
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={!uploadForm.fileData || isAnalyzing}
                 className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-sm mt-2 transition-colors flex items-center justify-center gap-2"
               >
                 {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                 {isAnalyzing ? "Processing..." : "Save to Database"}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
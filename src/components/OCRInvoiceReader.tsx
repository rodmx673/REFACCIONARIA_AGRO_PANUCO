import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Save, 
  FileSearch, 
  X, 
  Info, 
  Truck, 
  Clock, 
  Package,
  Check,
  Sparkles,
  Code,
  Table,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  FileCheck,
  History,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Type } from "@google/genai";
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { generateContentWithFallback, parseJsonFromMarkdown } from '../lib/gemini';
import { toast } from 'sonner';
import { ExtractedInvoiceJSON, InvoiceArticle } from '../types';
import { cn } from '../lib/utils';


import { ImportInvoiceToStockModal } from './Invoicing/ImportInvoiceToStockModal';

const SYSTEM_PROMPT = `
Actúa como un sistema experto de extracción de facturas y comprobantes comerciales.
Tu misión exclusiva es analizar el documento suministrado (imagen JPG/PNG/WEBP, PDF, hoja de cálculo Excel XLS/XLSX, documento Word DOCX o archivo de texto) y extraer ÚNICAMENTE la información explícitamente legible y visible. Devuelve el resultado en formato JSON estricto.

Campos principales requeridos:
- "numero_factura": Número, folio o identificador de factura explícito en el documento. Si no se puede leer con claridad, está borroso, recortado o no existe, asígnale obligatoriamente null.
- "fecha": Fecha explícita de emisión de la factura (en formato YYYY-MM-DD o tal como aparezca). Si no se puede leer con claridad, asígnale null.
- "proveedor": Nombre o razón social explícita del emisor o proveedor. Si no se puede leer con claridad, asígnale null.
- "articulos": Arreglo de los artículos o conceptos explícitamente facturados. Cada objeto debe incluir:
    - "descripcion": Descripción del artículo o concepto. Si no se puede leer con claridad, asigna null.
    - "cantidad": Cantidad numérica de piezas o unidades. Si no se puede leer con claridad, asigna null.
    - "precio_unitario": Precio unitario numérico del artículo antes de impuestos. Si no se puede leer con claridad, asigna null.
    - "codigo": Código o número de parte si está visible, o null si no se puede leer con claridad.
    - "importe": Importe total del renglón (cantidad * precio) si está visible, o null.

Campos complementarios (extraer únicamente si son explícitos):
- "subtotal": Subtotal numérico antes de impuestos, o null si no se puede leer con claridad.
- "iva": Monto numérico de impuesto (IVA/Tax) trasladado, o null si no se puede leer con claridad.
- "total": Total general numérico de la factura, o null si no se puede leer con claridad.
- "moneda": Código de moneda (ej: "MXN", "USD"), o null si no se puede leer con claridad.
- "rfc_proveedor": RFC o ID fiscal del emisor si es legible, o null.
- "cliente": Nombre o razón social del receptor si es legible, o null.

Reglas estrictas de extracción:
1. INFORMACIÓN ESTRICTAMENTE EXPLÍCITA: No inventes folios, no deduzcas fechas ni calcules precios aproximados. Extrae únicamente lo que esté impreso o redactado en el archivo.
2. REGLA NULL PARA ILEGIBILIDAD: Si cualquier campo no se puede leer con claridad, está borroso, tapado o ausente, asigna estrictamente null.
3. Si no hay artículos legibles, "articulos" debe ser un arreglo vacío [].
`;

const SAMPLE_INVOICE: ExtractedInvoiceJSON = {
  numero_factura: "FAC-2024-00892",
  fecha: "2024-03-18",
  proveedor: "AgroRefacciones del Norte S.A. de C.V.",
  rfc_proveedor: "ARN980415KZ2",
  cliente: "Tractores y Maquinaria Agrícola San Isidro",
  articulos: [
    {
      descripcion: "Filtro de Aceite para Motor Diésel John Deere RE59754",
      cantidad: 6,
      precio_unitario: 485.50,
      codigo: "RE59754",
      importe: 2913.00
    },
    {
      descripcion: "Bomba de Agua Massey Ferguson Serie 200/300 4 Cil.",
      cantidad: 2,
      precio_unitario: 1850.00,
      codigo: "MF-41312574",
      importe: 3700.00
    },
    {
      descripcion: "Kit de Sellos Hidráulicos Cilindro de Dirección",
      cantidad: 4,
      precio_unitario: 320.00,
      codigo: "SH-7023",
      importe: 1280.00
    },
    {
      descripcion: "Banda de Transmisión Dentada 8PK1420 (Texto parcialmente borroso)",
      cantidad: null,
      precio_unitario: 650.00,
      codigo: null,
      importe: null
    }
  ],
  subtotal: 8543.00,
  iva: 1366.88,
  total: 9909.88,
  moneda: "MXN"
};

export interface OCRInvoiceReaderProps {
  onNavigateToHistory?: () => void;
  onNavigateToInventory?: () => void;
}

export const OCRInvoiceReader: React.FC<OCRInvoiceReaderProps> = ({ 
  onNavigateToHistory,
  onNavigateToInventory
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'spreadsheet' | 'doc' | 'text'>('image');
  const [fileTextSnippet, setFileTextSnippet] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [spreadsheetPreviewRows, setSpreadsheetPreviewRows] = useState<any[][]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractedInvoiceJSON | null>(null);
  const [activeView, setActiveView] = useState<'json' | 'visual'>('json');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const determineFileType = (f: File): 'image' | 'pdf' | 'spreadsheet' | 'doc' | 'text' => {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (f.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext)) {
      return 'image';
    }
    if (f.type === 'application/pdf' || ext === 'pdf') {
      return 'pdf';
    }
    if (
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      ['xlsx', 'xls', 'csv'].includes(ext)
    ) {
      return 'spreadsheet';
    }
    if (
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.type === 'application/msword' ||
      ['docx', 'doc'].includes(ext)
    ) {
      return 'doc';
    }
    return 'text';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const type = determineFileType(selectedFile);
    setPreviewType(type);
    setFile(selectedFile);
    setResult(null);
    setFileTextSnippet('');
    setSheetNames([]);
    setSpreadsheetPreviewRows([]);

    // Generate persistent data URI if under 750KB for persistent preview across history
    if (selectedFile.size < 750 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFileDataUri(reader.result);
        }
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFileDataUri('');
    }

    if (type === 'image') {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else if (type === 'pdf') {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else if (type === 'spreadsheet') {
      setPreviewUrl(null);
      try {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        setSheetNames(workbook.SheetNames);
        if (workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          setSpreadsheetPreviewRows(rows.slice(0, 8));
        }
      } catch (err) {
        console.error('Error reading spreadsheet:', err);
      }
    } else if (type === 'doc') {
      setPreviewUrl(null);
      try {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (ext === 'docx') {
          const buffer = await selectedFile.arrayBuffer();
          const mammothResult = await mammoth.extractRawText({ arrayBuffer: buffer });
          setFileTextSnippet(mammothResult.value.slice(0, 500));
        } else {
          const text = await selectedFile.text();
          setFileTextSnippet(text.slice(0, 500));
        }
      } catch (err) {
        console.error('Error reading word document:', err);
        setFileTextSnippet('Documento Word cargado (procesable por el extractor)');
      }
    } else {
      setPreviewUrl(null);
      try {
        const text = await selectedFile.text();
        setFileTextSnippet(text.slice(0, 500));
      } catch (err) {
        console.error('Error reading text:', err);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const fileToBase64 = (fileToConvert: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToConvert);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const extractData = async () => {
    if (!file) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setIsProcessing(true);
    try {
      const type = determineFileType(file);
      let contentPayload: any[] = [];

      if (type === 'image') {
        const base64Data = await fileToBase64(file);
        contentPayload = [
          { text: SYSTEM_PROMPT },
          { text: `Extrae de forma estricta los datos explícitos de esta imagen de factura (${file.name}) y devuélvelos únicamente en formato JSON. Asigna null a cualquier campo ilegible o ambiguo.` },
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'image/jpeg'
            }
          }
        ];
      } else if (type === 'pdf') {
        const base64Data = await fileToBase64(file);
        contentPayload = [
          { text: SYSTEM_PROMPT },
          { text: `Extrae de forma estricta los datos explícitos de este documento PDF de factura (${file.name}) y devuélvelos únicamente en formato JSON. Asigna null a cualquier campo ilegible o ambiguo.` },
          {
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf'
            }
          }
        ];
      } else if (type === 'spreadsheet') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        let spreadsheetContent = `Nombre del archivo: ${file.name}\n\n`;
        workbook.SheetNames.forEach(name => {
          const sheet = workbook.Sheets[name];
          const csvData = XLSX.utils.sheet_to_csv(sheet);
          spreadsheetContent += `--- HOJA DE CÁLCULO: ${name} ---\n${csvData}\n\n`;
        });

        contentPayload = [
          { text: SYSTEM_PROMPT },
          { text: `A continuación se presentan los datos tabulares extraídos de la hoja de cálculo de la factura (${file.name}). Extrae la información explícita y devuélvela en formato JSON con campos: numero_factura, fecha, proveedor y articulos (descripcion, cantidad, precio_unitario). Asigna null a datos no legibles:\n\n${spreadsheetContent}` }
        ];
      } else if (type === 'doc') {
        let extractedDocText = '';
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'docx') {
          const buffer = await file.arrayBuffer();
          const mammothResult = await mammoth.extractRawText({ arrayBuffer: buffer });
          extractedDocText = mammothResult.value;
        } else {
          extractedDocText = await file.text();
        }

        contentPayload = [
          { text: SYSTEM_PROMPT },
          { text: `A continuación se presenta el contenido del documento Word/procesador de texto de la factura (${file.name}). Extrae estrictamente la información explícita y devuélvela en formato JSON con numero_factura, fecha, proveedor y articulos (descripcion, cantidad, precio_unitario). Asigna null a los campos ilegibles o ausentes:\n\n${extractedDocText}` }
        ];
      } else {
        const rawText = await file.text();
        contentPayload = [
          { text: SYSTEM_PROMPT },
          { text: `A continuación se presenta el texto del comprobante comercial (${file.name}). Extrae estrictamente los datos explícitos y devuélvelos en formato JSON. Asigna null si algún campo no se puede leer con claridad:\n\n${rawText}` }
        ];
      }

      const response = await generateContentWithFallback(
        contentPayload,
        {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              numero_factura: { type: Type.STRING, nullable: true },
              fecha: { type: Type.STRING, nullable: true },
              proveedor: { type: Type.STRING, nullable: true },
              rfc_proveedor: { type: Type.STRING, nullable: true },
              cliente: { type: Type.STRING, nullable: true },
              articulos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    descripcion: { type: Type.STRING, nullable: true },
                    cantidad: { type: Type.NUMBER, nullable: true },
                    precio_unitario: { type: Type.NUMBER, nullable: true },
                    codigo: { type: Type.STRING, nullable: true },
                    importe: { type: Type.NUMBER, nullable: true }
                  },
                  required: ["descripcion", "cantidad", "precio_unitario"]
                }
              },
              subtotal: { type: Type.NUMBER, nullable: true },
              iva: { type: Type.NUMBER, nullable: true },
              total: { type: Type.NUMBER, nullable: true },
              moneda: { type: Type.STRING, nullable: true }
            },
            required: ["numero_factura", "fecha", "proveedor", "articulos"]
          }
        }
      );

      const data = parseJsonFromMarkdown(response.text || '{}') as ExtractedInvoiceJSON;
      
      // Ensure articulos is always an array
      if (!Array.isArray(data.articulos)) {
        data.articulos = [];
      }

      setResult(data);
      toast.success('Extracción completada con éxito', {
        description: `Se detectaron ${data.articulos.length} artículos en la factura.`
      });
    } catch (error: any) {
      console.error('Error during invoice extraction:', error);
      toast.error('Error en la extracción', {
        description: error?.message || 'No fue posible leer los datos del documento. Intenta con un archivo más legible.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSample = () => {
    setFile(null);
    setPreviewUrl(null);
    setPreviewType('image');
    setResult(SAMPLE_INVOICE);
    toast.info('Factura de ejemplo cargada', {
      description: 'Puedes inspeccionar el JSON extraído y la vista estructurada con valores null.'
    });
  };

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    toast.success('JSON copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFolio = result.numero_factura?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'factura_extraida';
    a.download = `factura_${cleanFolio}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Archivo JSON descargado');
  };

  const updateArticle = (index: number, field: keyof InvoiceArticle, value: any) => {
    if (!result) return;
    const newArticles = [...result.articulos];
    newArticles[index] = {
      ...newArticles[index],
      [field]: value === '' ? null : value
    };
    setResult({
      ...result,
      articulos: newArticles
    });
  };

  const addArticle = () => {
    if (!result) return;
    setResult({
      ...result,
      articulos: [
        ...result.articulos,
        { descripcion: '', cantidad: 1, precio_unitario: 0, codigo: '', importe: 0 }
      ]
    });
  };

  const removeArticle = (index: number) => {
    if (!result) return;
    const newArticles = result.articulos.filter((_, i) => i !== index);
    setResult({ ...result, articulos: newArticles });
  };

  const importToInventory = async () => {
    if (!result || result.articulos.length === 0) {
      toast.warning('No hay artículos para importar');
      return;
    }

    setIsSavingStock(true);
    try {
      const invoiceRef = result.numero_factura || `DOC-${new Date().toISOString().slice(0, 10)}`;
      const vendorName = result.proveedor || 'Proveedor General';
      let importedCount = 0;

      for (const item of result.articulos) {
        if (!item.descripcion) continue;

        const quantity = typeof item.cantidad === 'number' && item.cantidad > 0 ? item.cantidad : 1;
        const unitPrice = typeof item.precio_unitario === 'number' && item.precio_unitario > 0 ? item.precio_unitario : 0;
        const salePrice = unitPrice > 0 ? Math.round(unitPrice * 1.35 * 100) / 100 : 100;

        const productDoc = await addDoc(collection(db, 'products'), {
          pieceNumber: item.codigo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          description: item.descripcion,
          brand: 'GENÉRICA / OEM',
          model: 'Universal',
          costPrice: unitPrice,
          salePrice: salePrice,
          stock: quantity,
          minStock: 2,
          location: 'Pasillo Entrada / Recepción',
          category: 'Refacciones Importadas',
          vendorId: vendorName,
          leadTime: 5,
          invoiceReference: invoiceRef
        });

        // Register inventory movement with reference
        await addDoc(collection(db, 'inventoryMovements'), {
          productId: productDoc.id,
          type: 'IN',
          quantity: quantity,
          reason: `Alta vía Extractor de Facturas según Factura ${invoiceRef}`,
          timestamp: new Date().toISOString(),
          userId: auth.currentUser?.uid || 'extractor-ia',
          invoiceReference: invoiceRef
        });

        importedCount++;
      }

      toast.success('Artículos importados a inventario', {
        description: `Se crearon ${importedCount} piezas vinculadas a la factura ${invoiceRef}.`
      });
    } catch (err: any) {
      console.error('Error importing to inventory:', err);
      
    } finally {
      setIsSavingStock(false);
    }
  };

  const saveToInvoiceHistory = async () => {
    if (!result) return;
    setIsSavingHistory(true);
    try {
      const invoiceNumber = result.numero_factura || `FAC-${new Date().toISOString().slice(0, 10)}`;
      const vendor = result.proveedor || 'Proveedor General';
      const totalAmount = result.total !== null && result.total !== undefined
        ? Number(result.total)
        : (result.subtotal ? Number(result.subtotal) * 1.16 : 0);

      const subtotalVal = result.subtotal !== null && result.subtotal !== undefined
        ? Number(result.subtotal)
        : Math.round((totalAmount / 1.16) * 100) / 100;

      const ivaVal = result.iva !== null && result.iva !== undefined
        ? Number(result.iva)
        : Math.round((totalAmount - subtotalVal) * 100) / 100;

      const isImg = previewType === 'image';
      const isPdf = previewType === 'pdf';
      const docRefName = file?.name || (isPdf ? `factura_${invoiceNumber}.pdf` : `factura_${invoiceNumber}.jpg`);
      const docData = fileDataUri || (previewUrl?.startsWith('http') ? previewUrl : undefined);

      await addDoc(collection(db, 'invoices_history'), {
        numero_factura: invoiceNumber,
        fecha: result.fecha || new Date().toISOString().slice(0, 10),
        proveedor: vendor,
        rfc_proveedor: result.rfc_proveedor || undefined,
        importe: totalAmount,
        subtotal: subtotalVal,
        iva: ivaVal,
        moneda: result.moneda || 'MXN',
        documentType: previewType,
        imageReference: docRefName,
        originalImageUrl: isImg ? docData : undefined,
        documentUrl: !isImg ? docData : undefined,
        pdfDataUri: isPdf ? fileDataUri : undefined,
        articulos: result.articulos || [],
        status: 'REGISTRADA',
        createdAt: new Date().toISOString()
      });

      toast.success('Factura guardada en el Historial', {
        description: `Folio ${invoiceNumber} registrado correctamente con sus artículos.`,
        action: onNavigateToHistory ? {
          label: 'Ver Historial',
          onClick: onNavigateToHistory
        } : undefined
      });
    } catch (err: any) {
      console.error('Error saving invoice to history:', err);
      
    } finally {
      setIsSavingHistory(false);
    }
  };

  // Calculate null fields summary for transparency
  const getNullFieldsCount = (data: ExtractedInvoiceJSON | null) => {
    if (!data) return 0;
    let count = 0;
    if (data.numero_factura === null) count++;
    if (data.fecha === null) count++;
    if (data.proveedor === null) count++;
    data.articulos.forEach(art => {
      if (art.descripcion === null) count++;
      if (art.cantidad === null) count++;
      if (art.precio_unitario === null) count++;
    });
    return count;
  };

  const nullCount = getNullFieldsCount(result);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary flex items-center gap-1">
              <Sparkles size={12} />
              Sistema Experto de Extracción
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              JPEG • PDF • XLS • DOCX
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Extractor de Facturas</h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Extrae únicamente la información explícita de facturas en imágenes, PDFs, Excel o Word y recíbela en formato JSON con tratamiento de valores ilegibles (<code className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-mono text-xs">null</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              type="button"
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
            >
              <History size={14} className="text-primary" />
              Ver Historial
            </button>
          )}

          <button
            onClick={loadSample}
            type="button"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
          >
            <RefreshCw size={14} className="text-gray-500" />
            Cargar Factura de Ejemplo
          </button>

          {result && (
            <>
              <button 
                onClick={copyJson}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? '¡Copiado!' : 'Copiar JSON'}
              </button>
              <button 
                onClick={downloadJson}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download size={14} />
                Descargar .json
              </button>
              <button 
                onClick={saveToInvoiceHistory}
                disabled={isSavingHistory}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all shadow-xs disabled:opacity-50"
              >
                {isSavingHistory ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />}
                Guardar en Historial
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <Save size={14} />
                Importar a Inventario
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & File Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer relative overflow-hidden min-h-[380px] bg-white",
              isDragging ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50/70",
              file ? "p-4" : ""
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,.xlsx,.xls,.csv,.docx,.doc,text/plain"
            />

            {file ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative group">
                {/* Image Preview */}
                {previewType === 'image' && previewUrl && (
                  <div className="w-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50 border-b border-gray-200 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={12} /> Con Imagen Vinculada
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 truncate max-w-[160px]">
                        {file.name}
                      </span>
                    </div>
                    <div className="w-full h-72 overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                      <img 
                        src={previewUrl} 
                        alt="Factura" 
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    </div>
                    <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-1 truncate max-w-[240px]">
                        <LinkIcon size={12} className="text-primary shrink-0" />
                        <span className="font-bold text-gray-400 uppercase text-[9px]">Ubicación:</span>
                        <span className="font-mono text-gray-700 truncate" title={file.name}>{file.name}</span>
                      </div>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink size={11} /> Abrir
                      </a>
                    </div>
                  </div>
                )}

                {/* PDF Preview: Embed, Preview and Link of storage */}
                {previewType === 'pdf' && (
                  <div className="w-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-xs flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <FileText size={12} /> Con Documento PDF Vinculado
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Con Imagen Vinculada (PDF)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-primary rounded-lg text-xs font-bold transition-all shadow-2xs"
                            title="Abrir PDF en pestaña completa"
                          >
                            <ExternalLink size={12} />
                            <span>Abrir</span>
                          </a>
                        )}
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            download={file.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                            title="Descargar PDF original"
                          >
                            <Download size={12} />
                            <span>Descargar</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Visor PDF Embebido interactivo */}
                    <div className="w-full h-80 bg-gray-100 relative">
                      {previewUrl ? (
                        <iframe
                          src={`${previewUrl}#toolbar=0&navpanes=0`}
                          title={`Visor PDF Factura ${file.name}`}
                          className="w-full h-full border-0 bg-white"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <FileText size={32} className="text-red-500 mb-2" />
                          <p className="text-xs font-bold text-gray-700">{file.name}</p>
                          <p className="text-[11px] text-gray-400 mt-1">Listo para análisis multimodal</p>
                        </div>
                      )}
                    </div>

                    {/* Barra inferior: Link y ubicación de guardado del documento para referencia */}
                    <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
                          <LinkIcon size={11} className="text-primary" /> Guardado / Referencia:
                        </span>
                        <span className="font-mono text-gray-800 text-[11px] truncate max-w-[220px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                        <span>Tamaño: <strong>{(file.size / 1024).toFixed(1)} KB</strong></span>
                        {previewUrl && (
                          <a 
                            href={previewUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> Link de visualización
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Spreadsheet / Excel Preview */}
                {previewType === 'spreadsheet' && (
                  <div className="w-full h-72 rounded-2xl bg-gradient-to-b from-emerald-50 to-gray-50 border border-emerald-100/80 flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{file.name}</p>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          Hojas: {sheetNames.join(', ') || '1'} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-100 p-2 text-[10px]">
                      {spreadsheetPreviewRows.length > 0 ? (
                        <table className="w-full text-left font-mono">
                          <tbody>
                            {spreadsheetPreviewRows.map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-gray-50 hover:bg-gray-50/50">
                                {row.slice(0, 4).map((cell, cIdx) => (
                                  <td key={cIdx} className="px-1.5 py-0.5 truncate max-w-[90px] text-gray-600">
                                    {String(cell ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs font-sans">
                          Hoja de cálculo lista para análisis
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Word DOC / DOCX Preview */}
                {previewType === 'doc' && (
                  <div className="w-full h-72 rounded-2xl bg-gradient-to-b from-blue-50 to-gray-50 border border-blue-100/80 flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{file.name}</p>
                        <p className="text-[11px] text-blue-700 font-medium">Documento Word • {(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-100 p-3 text-[11px] text-gray-600 leading-relaxed font-sans">
                      {fileTextSnippet || 'Documento procesado. Haz clic en "Extraer Información" para analizarlo.'}
                    </div>
                  </div>
                )}

                {/* Plain Text Preview */}
                {previewType === 'text' && (
                  <div className="w-full h-72 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-gray-500" />
                      <span className="text-xs font-bold text-gray-800 truncate">{file.name}</span>
                    </div>
                    <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-100 p-3 text-xs font-mono text-gray-600">
                      {fileTextSnippet || 'Texto plano cargado.'}
                    </div>
                  </div>
                )}

                {/* Hover overlay with replace button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                  <div className="bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold">
                    <Upload size={16} className="text-primary" />
                    Cambiar archivo
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full shadow text-gray-400 hover:text-red-500 transition-colors z-10"
                  title="Quitar archivo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <Upload size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Arrastra tu factura aquí</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  O haz clic para seleccionar desde tu computadora
                </p>

                {/* Format Badges */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-5">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    JPG / PNG
                  </span>
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    PDF
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    XLS / XLSX
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    DOC / DOCX
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!file || isProcessing}
            onClick={extractData}
            type="button"
            className={cn(
              "w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg",
              !file || isProcessing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-primary text-white hover:bg-primary/95 shadow-primary/25 active:scale-[0.99]"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Extrayendo con IA Experta...</span>
              </>
            ) : (
              <>
                <FileSearch size={18} />
                <span>Extraer Información en JSON</span>
              </>
            )}
          </button>

          {/* Quick instructions / features card */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs text-gray-600 space-y-2">
            <p className="font-bold text-gray-800 flex items-center gap-1.5">
              <Info size={14} className="text-primary" />
              Criterios de Extracción Estricta:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-gray-500 text-[11px] leading-relaxed">
              <li>
                <strong className="text-gray-700">Campos estándar:</strong> número de factura, fecha, proveedor y artículos (descripción, cantidad y precio unitario).
              </li>
              <li>
                <strong className="text-gray-700">Tratamiento de ilegibilidad:</strong> si algún dato está borroso o ausente, se asigna <code className="text-amber-700 bg-amber-100/70 px-1 py-0.5 rounded font-mono">null</code>.
              </li>
              <li>
                <strong className="text-gray-700">Formatos:</strong> admite imágenes (escaneadas/fotos), documentos PDF vectoriales y escaneados, hojas de cálculo Excel y archivos Word.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: JSON & Structured Results (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[560px]">
          {/* Top Bar with View Switcher */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/40">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('json')}
                type="button"
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  activeView === 'json'
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                )}
              >
                <Code size={14} />
                Salida JSON
              </button>

              <button
                onClick={() => setActiveView('visual')}
                type="button"
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  activeView === 'visual'
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                )}
              >
                <Table size={14} />
                Vista Estructurada
              </button>
            </div>

            {result && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {result.articulos.length} {result.articulos.length === 1 ? 'artículo' : 'artículos'}
                </span>
                {nullCount > 0 && (
                  <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {nullCount} campos con <code className="font-mono text-[11px]">null</code>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Empty state when no extraction has been performed */}
          {!result && !isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 text-gray-300 border border-gray-100">
                <FileCheck size={40} />
              </div>
              <h3 className="text-base font-bold text-gray-800">Esperando factura</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1.5 leading-relaxed">
                Carga un archivo en JPEG, PDF, Excel o Word a la izquierda o haz clic en "Cargar Factura de Ejemplo" para visualizar la extracción JSON en tiempo real.
              </p>
            </div>
          )}

          {/* Loading state during extraction */}
          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-primary">
                  <FileSearch size={28} className="animate-pulse" />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900">Analizando factura...</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Extrayendo número de factura, fecha, proveedor y artículos, evaluando legibilidad para asignar null a datos ausentes.
              </p>
              <div className="mt-6 w-full max-w-xs space-y-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 7, ease: "easeInOut" }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Recepción</span>
                  <span>Extracción</span>
                  <span>Validación JSON</span>
                </div>
              </div>
            </div>
          )}

          {/* Result view */}
          {result && !isProcessing && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* TAB 1: JSON OUTPUT (PRIMARY VIEW) */}
              {activeView === 'json' && (
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <Code size={14} className="text-primary" />
                      Estructura JSON (application/json)
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Formato estricto con valores explícitos o null
                    </span>
                  </div>

                  {/* JSON Code block */}
                  <div className="flex-1 bg-gray-900 rounded-2xl p-4 overflow-auto font-mono text-xs text-gray-100 shadow-inner max-h-[500px]">
                    <pre className="whitespace-pre leading-relaxed">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>

                  {/* Field summary pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Factura / Folio</p>
                      <p className="font-bold text-gray-800 truncate">
                        {result.numero_factura === null ? (
                          <span className="text-amber-600 font-mono text-[11px]">null</span>
                        ) : (
                          result.numero_factura
                        )}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha</p>
                      <p className="font-bold text-gray-800 truncate">
                        {result.fecha === null ? (
                          <span className="text-amber-600 font-mono text-[11px]">null</span>
                        ) : (
                          result.fecha
                        )}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Proveedor</p>
                      <p className="font-bold text-gray-800 truncate">
                        {result.proveedor === null ? (
                          <span className="text-amber-600 font-mono text-[11px]">null</span>
                        ) : (
                          result.proveedor
                        )}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Total / Moneda</p>
                      <p className="font-bold text-primary truncate">
                        {result.total === null ? (
                          <span className="text-amber-600 font-mono text-[11px]">null</span>
                        ) : (
                          `$${Number(result.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${result.moneda || 'MXN'}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VISUAL & EDITABLE FORM VIEW */}
              {activeView === 'visual' && (
                <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                  {/* Top metadata cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Número de Factura</span>
                        {result.numero_factura === null && (
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 rounded">
                            null (ilegible)
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={result.numero_factura ?? ''}
                        placeholder="null (No legible)"
                        onChange={(e) => setResult({ ...result, numero_factura: e.target.value === '' ? null : e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white outline-none focus:ring-2 ring-primary/20 transition-all placeholder:text-amber-600/70"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Fecha</span>
                        {result.fecha === null && (
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 rounded">
                            null (ilegible)
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={result.fecha ?? ''}
                        placeholder="null (No legible)"
                        onChange={(e) => setResult({ ...result, fecha: e.target.value === '' ? null : e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white outline-none focus:ring-2 ring-primary/20 transition-all placeholder:text-amber-600/70"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Proveedor</span>
                        {result.proveedor === null && (
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 rounded">
                            null (ilegible)
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={result.proveedor ?? ''}
                        placeholder="null (No legible)"
                        onChange={(e) => setResult({ ...result, proveedor: e.target.value === '' ? null : e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white outline-none focus:ring-2 ring-primary/20 transition-all placeholder:text-amber-600/70"
                      />
                    </div>
                  </div>

                  {/* Articles Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Package size={14} className="text-primary" />
                        Arreglo de Artículos Facturados ({result.articulos.length})
                      </h4>
                      <button 
                        onClick={addArticle}
                        type="button"
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Agregar renglón
                      </button>
                    </div>

                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                          <tr>
                            <th className="px-3 py-2.5">Descripción</th>
                            <th className="px-3 py-2.5 w-24">Cantidad</th>
                            <th className="px-3 py-2.5 w-28 text-right">P. Unitario</th>
                            <th className="px-3 py-2.5 w-28 text-right">Importe</th>
                            <th className="px-2 py-2.5 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {result.articulos.map((art, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="px-3 py-2">
                                <input 
                                  type="text" 
                                  value={art.descripcion ?? ''}
                                  placeholder="null (Descripción no legible)"
                                  onChange={(e) => updateArticle(idx, 'descripcion', e.target.value)}
                                  className={cn(
                                    "w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-gray-800",
                                    art.descripcion === null && "placeholder:text-amber-600 font-mono italic text-[11px]"
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input 
                                  type="number" 
                                  value={art.cantidad ?? ''}
                                  placeholder="null"
                                  onChange={(e) => updateArticle(idx, 'cantidad', e.target.value === '' ? null : parseFloat(e.target.value))}
                                  className={cn(
                                    "w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-gray-800",
                                    art.cantidad === null && "placeholder:text-amber-600 font-mono italic text-[11px]"
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-[10px] text-gray-400">$</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={art.precio_unitario ?? ''}
                                    placeholder="null"
                                    onChange={(e) => updateArticle(idx, 'precio_unitario', e.target.value === '' ? null : parseFloat(e.target.value))}
                                    className={cn(
                                      "w-20 bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-gray-800 text-right",
                                      art.precio_unitario === null && "placeholder:text-amber-600 font-mono italic text-[11px]"
                                    )}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="font-bold text-gray-700 text-xs font-mono">
                                  {art.cantidad !== null && art.precio_unitario !== null 
                                    ? `$${(art.cantidad * art.precio_unitario).toFixed(2)}`
                                    : (art.importe !== null ? `$${art.importe.toFixed(2)}` : <span className="text-amber-600">null</span>)
                                  }
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => removeArticle(idx)}
                                  type="button"
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Eliminar artículo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals Section */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">Comprobante Fiscal Procesado</p>
                      <p className="text-[11px] text-gray-400">
                        {result.rfc_proveedor ? `RFC Emisor: ${result.rfc_proveedor}` : 'RFC no identificado explícitamente'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</p>
                        <p className="text-xs font-bold text-gray-700">
                          {result.subtotal !== null ? `$${Number(result.subtotal).toFixed(2)}` : <span className="text-amber-600 font-mono">null</span>}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">IVA</p>
                        <p className="text-xs font-bold text-gray-700">
                          {result.iva !== null ? `$${Number(result.iva).toFixed(2)}` : <span className="text-amber-600 font-mono">null</span>}
                        </p>
                      </div>

                      <div className="text-right pl-4 border-l border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total {result.moneda || 'MXN'}</p>
                        <p className="text-base font-black text-primary">
                          {result.total !== null ? `$${Number(result.total).toFixed(2)}` : <span className="text-amber-600 font-mono">null</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {result && (
        <ImportInvoiceToStockModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          rawInvoiceNumber={result.numero_factura}
          vendorName={result.proveedor}
          articles={result.articulos || []}
          onNavigateToInventory={onNavigateToInventory}
          onSuccess={(count, invoiceRef) => {
            // Also save to invoice history with the confirmed invoice reference!
            try {
              const totalAmount = result.total !== null && result.total !== undefined
                ? Number(result.total)
                : (result.subtotal ? Number(result.subtotal) * 1.16 : 0);
              const subtotalVal = result.subtotal !== null && result.subtotal !== undefined
                ? Number(result.subtotal)
                : Math.round((totalAmount / 1.16) * 100) / 100;
              const ivaVal = result.iva !== null && result.iva !== undefined
                ? Number(result.iva)
                : Math.round((totalAmount - subtotalVal) * 100) / 100;

              addDoc(collection(db, 'invoices_history'), {
                numero_factura: invoiceRef,
                fecha: result.fecha || new Date().toISOString().slice(0, 10),
                proveedor: result.proveedor || 'Proveedor General',
                rfc_proveedor: result.rfc_proveedor || undefined,
                importe: totalAmount,
                subtotal: subtotalVal,
                iva: ivaVal,
                moneda: result.moneda || 'MXN',
                documentType: previewType,
                imageReference: file?.name || (previewType === 'pdf' ? `factura_${invoiceRef}.pdf` : `factura_${invoiceRef}.jpg`),
                originalImageUrl: previewType === 'image' ? (fileDataUri || (previewUrl?.startsWith('http') ? previewUrl : undefined)) : undefined,
                documentUrl: previewType !== 'image' ? (fileDataUri || (previewUrl?.startsWith('http') ? previewUrl : undefined)) : undefined,
                pdfDataUri: previewType === 'pdf' ? fileDataUri : undefined,
                articulos: result.articulos || [],
                status: 'IMPORTADA_A_INVENTARIO',
                importedToInventory: true,
                importedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
              });
            } catch (e) {
              console.error('Error auto-saving invoice to history after import:', e);
            }
          }}
        />
      )}
    </div>
  );
};

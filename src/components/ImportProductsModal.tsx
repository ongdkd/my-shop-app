"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { XMarkIcon, DocumentArrowUpIcon, LinkIcon } from "@heroicons/react/24/outline";

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: Omit<Product, "id">[]) => void;
  existingProducts?: Product[];
}

export default function ImportProductsModal({ isOpen, onClose, onImportProducts, existingProducts = [] }: ImportProductsModalProps) {
  const [importMethod, setImportMethod] = useState<'excel' | 'googlesheets'>('googlesheets');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<Omit<Product, "id">[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const filterNewProducts = (products: Omit<Product, "id">[]): Omit<Product, "id">[] => {
    // Check if this is a re-import from the same Google Sheets URL
    const lastImportedUrl = localStorage.getItem(`imported-sheet-url`);
    const isReimport = importMethod === 'googlesheets' && googleSheetsUrl === lastImportedUrl;
    
    if (!isReimport) {
      return products; // First time import, return all products
    }
    
    // Filter out products that already exist (by name and price)
    const newProducts = products.filter(newProduct => {
      return !existingProducts.some(existing => 
        existing.name.toLowerCase() === newProduct.name.toLowerCase() &&
        existing.price === newProduct.price
      );
    });
    
    return newProducts;
  };

  const parseCSV = (text: string): Omit<Product, "id">[] => {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return [];
      }

      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV parsing with proper quote handling
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value

        if (values.length >= 3) { // At least name, image, price
          const name = values[0]?.replace(/"/g, '').trim() || '';
          const image = values[1]?.replace(/"/g, '').trim() || '';
          const priceStr = values[2]?.replace(/"/g, '').replace(/[^\d.-]/g, '') || '0';
          const depositStr = values[3]?.replace(/"/g, '').replace(/[^\d.-]/g, '') || '0';
          const stockStr = values[4]?.replace(/"/g, '').trim() || '';

          const price = parseFloat(priceStr) || 0;
          const deposit = parseFloat(depositStr) || 0;
          const stock: number | "" = stockStr === '' ? "" : (isNaN(parseInt(stockStr)) ? "" : parseInt(stockStr));

          const product: Omit<Product, "id"> = {
            name,
            image,
            price,
            deposit,
            stock,
            description: name // Use name as description
          };
          
          if (product.name && product.price > 0 && product.deposit >= 0) {
            data.push(product);
          }
        }
      }

      return data;
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          let parsedData: Omit<Product, "id">[] = [];

          if (file.name.toLowerCase().endsWith('.csv')) {
            const allParsedData = parseCSV(result);
            parsedData = filterNewProducts(allParsedData);
          } else {
            // For Excel files, we'll provide instructions to save as CSV
            alert('Please save your Excel file as CSV format and try again. Excel files require additional libraries to parse.');
            setIsImporting(false);
            return;
          }

          if (parsedData.length === 0) {
            alert('No new products found. All products from this file already exist.');
            setIsImporting(false);
            return;
          }

          setPreviewData(parsedData);
          setShowPreview(true);
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Error parsing file. Please check the format and try again.');
        }
        setIsImporting(false);
      };
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
      setIsImporting(false);
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl.trim()) {
      alert('Please enter a Google Sheets URL');
      return;
    }

    setIsImporting(true);
    try {
      // Extract sheet ID from various Google Sheets URL formats
      let sheetId = '';
      
      if (googleSheetsUrl.includes('/spreadsheets/d/')) {
        const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        sheetId = match?.[1] || '';
      }

      if (!sheetId) {
        alert('Invalid Google Sheets URL. Please make sure you copied the correct URL.');
        setIsImporting(false);
        return;
      }

      // Try multiple CSV export URL formats
      const csvUrls = [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
      ];

      let csvText = '';
      let success = false;

      for (const csvUrl of csvUrls) {
        try {
          const response = await fetch(csvUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'text/csv,text/plain,*/*'
            }
          });

          if (response.ok) {
            csvText = await response.text();
            if (csvText && csvText.trim().length > 0) {
              success = true;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      if (!success || !csvText) {
        // Provide detailed instructions for the user
        alert(`Unable to access the Google Sheet. Please ensure:

1. The sheet is set to "Anyone with the link can view"
2. The sharing settings allow public access
3. Try using this format instead:
   - Go to File → Download → Comma Separated Values (.csv)
   - Save the file and upload it using the CSV option

Alternative: Copy your data and paste it into a new CSV file.`);
        setIsImporting(false);
        return;
      }

      const allParsedData = parseCSV(csvText);
      const parsedData = filterNewProducts(allParsedData);

      if (parsedData.length === 0) {
        const lastImportedUrl = localStorage.getItem(`imported-sheet-url`);
        const isReimport = googleSheetsUrl === lastImportedUrl;
        
        if (isReimport) {
          alert('No new products found. All products from this Google Sheet have already been imported.');
        } else {
          alert('No valid products found in the Google Sheet. Please check that your data follows the format:\nสินค้า,รูปถาพ,ราคาเต็ม (THB),ราคามัดจำ (THB),Stock');
        }
        setIsImporting(false);
        return;
      }

      setPreviewData(parsedData);
      setShowPreview(true);
      setIsImporting(false);
    } catch (error) {
      console.error('Error importing from Google Sheets:', error);
      alert(`Import failed. Please try these alternatives:

1. Download your Google Sheet as CSV:
   - File → Download → Comma Separated Values (.csv)
   - Then use the CSV upload option

2. Check your sheet format:
   - First row should be: สินค้า,รูปถาพ,ราคาเต็ม (THB),ราคามัดจำ (THB),Stock
   - Make sure there's actual data in the rows below

3. Verify sharing settings:
   - Sheet must be "Anyone with the link can view"`);
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    // Store the Google Sheets URL for future reference
    if (importMethod === 'googlesheets' && googleSheetsUrl) {
      localStorage.setItem(`imported-sheet-url`, googleSheetsUrl);
    }
    
    onImportProducts(previewData);
    setPreviewData([]);
    setShowPreview(false);
    setGoogleSheetsUrl('');
    onClose();
  };

  const handleCancel = () => {
    setPreviewData([]);
    setShowPreview(false);
    setGoogleSheetsUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Import Products
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isImporting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!showPreview ? (
            <>
              {/* Import Method Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Choose Import Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setImportMethod('excel')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      importMethod === 'excel'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">Excel File</h4>
                    <p className="text-sm text-gray-600">Upload .xlsx or .csv file</p>
                  </button>
                  
                  <button
                    onClick={() => setImportMethod('googlesheets')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      importMethod === 'googlesheets'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <LinkIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">Google Sheets</h4>
                    <p className="text-sm text-gray-600">Import from Google Sheets URL</p>
                  </button>
                </div>
              </div>

              {/* Excel File Upload */}
              {importMethod === 'excel' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={isImporting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported format: .csv (Comma Separated Values)
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Expected CSV Format:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Column A:</strong> สินค้า (Product Name)</p>
                      <p><strong>Column B:</strong> รูปถาพ (Image URL)</p>
                      <p><strong>Column C:</strong> ราคาเต็ม (THB) (Full Price)</p>
                      <p><strong>Column D:</strong> ราคามัดจำ (THB) (Deposit Price)</p>
                      <p><strong>Column E:</strong> Stock (Number or empty for unlimited)</p>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Please save your Excel file as CSV format before uploading. 
                        Excel files (.xlsx) require additional processing.
                      </p>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">Example CSV format:</p>
                        <button
                          onClick={() => {
                            const csvContent = `สินค้า,รูปถาพ,ราคาเต็ม (THB),ราคามัดจำ (THB),Stock
iPhone 15,https://example.com/iphone.jpg,35000,17500,10
Samsung Galaxy,https://example.com/samsung.jpg,25000,12500,5
iPad Pro,https://example.com/ipad.jpg,45000,22500,8`;
                            
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = 'sample_products.csv';
                            link.click();
                          }}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Download Sample
                        </button>
                      </div>
                      <div className="bg-white p-2 rounded border text-xs font-mono">
                        สินค้า,รูปถาพ,ราคาเต็ม (THB),ราคามัดจำ (THB),Stock<br/>
                        iPhone 15,https://example.com/iphone.jpg,35000,17500,10<br/>
                        Samsung Galaxy,https://example.com/samsung.jpg,25000,12500,5
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Sheets URL */}
              {importMethod === 'googlesheets' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Sheets URL
                    </label>
                    <input
                      type="url"
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      disabled={isImporting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Make sure the Google Sheet is publicly accessible or shared with view permissions
                    </p>
                  </div>
                  
                  <button
                    onClick={handleGoogleSheetsImport}
                    disabled={isImporting || !googleSheetsUrl.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import from Google Sheets'
                    )}
                  </button>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Google Sheets Setup:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>1. Create a Google Sheet with columns: สินค้า, รูปถาพ, ราคาเต็ม (THB), ราคามัดจำ (THB), Stock</p>
                      <p>2. Go to File → Share → Share with others</p>
                      <p>3. Change access to &quot;Anyone with the link can view&quot;</p>
                      <p>4. Copy and paste the sheet URL here</p>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> Make sure your Google Sheet follows the exact column format shown above.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview Data */
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preview Import Data</h3>
              <p className="text-gray-600">Review the products before importing:</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">รูปถาพ</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ราคาเต็ม (THB)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ราคามัดจำ (THB)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product.image ? (
                            <Image 
                              src={product.image} 
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/place-holder.png";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">฿{product.price.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">฿{product.deposit.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product.stock === "" ? "Unlimited" : product.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Import {previewData.length} Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
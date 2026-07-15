/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Settings2,
  Scissors,
  FileText,
  Plus,
  Trash2,
  Download,
  Printer,
  Info,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Coins,
  Grid,
  Maximize2,
  FileDown,
  Compass,
  AlertCircle,
  Copy,
  Eye,
  RefreshCw,
  Check
} from 'lucide-react';
import {
  optimizePaperCutting,
  generateCutSteps,
  StockSheet,
  CutItem,
  SheetResult,
  PlacedItem
} from './utils/optimizer';

// Define structured stock format presets
const STOCK_PRESETS_GRAFICA = [
  { name: 'Folha Inteira', width: 960, height: 660 },
  { name: 'Formato 2 (Meia Folha)', width: 480, height: 660 },
  { name: 'Formato 4', width: 480, height: 330 },
  { name: 'Formato 8', width: 330, height: 240 },
  { name: 'Formato 12', width: 240, height: 165 },
];

const STOCK_PRESETS_ISO = [
  { name: 'Folha A1', width: 841, height: 594 },
  { name: 'Folha A2', width: 594, height: 420 },
  { name: 'Folha A3', width: 420, height: 297 },
  { name: 'Folha A4', width: 297, height: 210 },
  { name: 'Folha A5', width: 210, height: 148 },
  { name: 'Folha A6', width: 148, height: 105 },
  { name: 'Folha A7', width: 105, height: 74 },
];

const STOCK_PRESETS_INTERNACIONAL = [
  { name: 'Folha Inteira Internacional', width: 1000, height: 700 },
  { name: 'Formato 2 Internacional (Meia Folha)', width: 700, height: 500 },
  { name: 'Formato 4 Internacional', width: 500, height: 350 },
  { name: 'Formato 8 Internacional', width: 350, height: 250 },
  { name: 'Formato 12 Internacional', width: 250, height: 175 },
];

// Define structured cut item presets
const ITEM_PRESETS_GRAFICA = [
  { name: 'Folha Inteira', width: 960, height: 660, canRotate: true, grainSensitive: false },
  { name: 'Formato 2 (Meia Folha)', width: 480, height: 660, canRotate: true, grainSensitive: false },
  { name: 'Formato 4', width: 480, height: 330, canRotate: true, grainSensitive: false },
  { name: 'Formato 8', width: 330, height: 240, canRotate: true, grainSensitive: false },
  { name: 'Formato 12', width: 240, height: 165, canRotate: true, grainSensitive: false },
];

const ITEM_PRESETS_ISO = [
  { name: 'Folha A1', width: 841, height: 594, canRotate: true, grainSensitive: false },
  { name: 'Folha A2', width: 594, height: 420, canRotate: true, grainSensitive: false },
  { name: 'Folha A3', width: 420, height: 297, canRotate: true, grainSensitive: false },
  { name: 'Folha A4', width: 297, height: 210, canRotate: true, grainSensitive: false },
  { name: 'Folha A5', width: 210, height: 148, canRotate: true, grainSensitive: false },
  { name: 'Folha A6', width: 148, height: 105, canRotate: true, grainSensitive: false },
  { name: 'Folha A7', width: 105, height: 74, canRotate: true, grainSensitive: false },
];

const ITEM_PRESETS_INTERNACIONAL = [
  { name: 'Folha Inteira Internacional', width: 1000, height: 700, canRotate: true, grainSensitive: false },
  { name: 'Formato 2 Internacional (Meia Folha)', width: 700, height: 500, canRotate: true, grainSensitive: false },
  { name: 'Formato 4 Internacional', width: 500, height: 350, canRotate: true, grainSensitive: false },
  { name: 'Formato 8 Internacional', width: 350, height: 250, canRotate: true, grainSensitive: false },
  { name: 'Formato 12 Internacional', width: 250, height: 175, canRotate: true, grainSensitive: false },
];

interface DivisionOption {
  id: string;
  name: string;
  parts: number;
  label: string;
  wFactor: number;
  hFactor: number;
  type: 'grid' | 'mixed';
  cols?: number;
  rows?: number;
  customBoxes?: { x: number; y: number; w: number; h: number; r?: boolean }[];
}

const DIVISION_OPTIONS: DivisionOption[] = [
  { id: 'div-1', name: 'Inteira', parts: 1, label: '1/1', wFactor: 1.0, hFactor: 1.0, type: 'grid', cols: 1, rows: 1 },
  { id: 'div-2', name: 'Meio', parts: 2, label: '1/2', wFactor: 0.5, hFactor: 1.0, type: 'grid', cols: 2, rows: 1 },
  { id: 'div-3', name: 'Terço', parts: 3, label: '1/3', wFactor: 0.333, hFactor: 1.0, type: 'grid', cols: 3, rows: 1 },
  { id: 'div-4', name: 'Quarto', parts: 4, label: '1/4', wFactor: 0.5, hFactor: 0.5, type: 'grid', cols: 2, rows: 2 },
  { id: 'div-5', name: 'Quinto Misto', parts: 5, label: '1/5 M', wFactor: 0.333, hFactor: 0.515, type: 'mixed',
    customBoxes: [
      { x: 0, y: 0, w: 33.3, h: 51.5 }, { x: 33.3, y: 0, w: 33.3, h: 51.5 }, { x: 66.6, y: 0, w: 33.3, h: 51.5 },
      { x: 0, y: 51.5, w: 51.5, h: 48.5, r: true }, { x: 51.5, y: 51.5, w: 48.5, h: 48.5, r: true }
    ]
  },
  { id: 'div-6a', name: 'Sexto (3x2)', parts: 6, label: '1/6', wFactor: 0.333, hFactor: 0.5, type: 'grid', cols: 3, rows: 2 },
  { id: 'div-6b', name: 'Sexto Longo', parts: 6, label: '1/6 L', wFactor: 0.25, hFactor: 0.636, type: 'mixed',
    customBoxes: [
      { x: 0, y: 0, w: 25, h: 63.6 }, { x: 25, y: 0, w: 25, h: 63.6 }, { x: 50, y: 0, w: 25, h: 63.6 }, { x: 75, y: 0, w: 25, h: 63.6 },
      { x: 0, y: 63.6, w: 50, h: 36.4, r: true }, { x: 50, y: 63.6, w: 50, h: 36.4, r: true }
    ]
  },
  { id: 'div-6c', name: 'Sexto (2x3)', parts: 6, label: '1/6 G', wFactor: 0.5, hFactor: 0.333, type: 'grid', cols: 2, rows: 3 },
  { id: 'div-7', name: 'Sétimo Misto', parts: 7, label: '1/7 M', wFactor: 0.229, hFactor: 0.56, type: 'mixed',
    customBoxes: [
      { x: 0, y: 0, w: 37, h: 33.3 }, { x: 37, y: 0, w: 37, h: 33.3 },
      { x: 0, y: 33.3, w: 37, h: 33.3 }, { x: 37, y: 33.3, w: 37, h: 33.3 },
      { x: 0, y: 66.6, w: 37, h: 33.3 }, { x: 37, y: 66.6, w: 37, h: 33.3 },
      { x: 74, y: 0, w: 22.9, h: 56, r: true }
    ]
  },
  { id: 'div-8', name: 'Oitavo', parts: 8, label: '1/8', wFactor: 0.25, hFactor: 0.5, type: 'grid', cols: 4, rows: 2 },
  { id: 'div-9', name: 'Nono', parts: 9, label: '1/9', wFactor: 0.333, hFactor: 0.333, type: 'grid', cols: 3, rows: 3 },
  { id: 'div-10a', name: 'Décimo (5x2)', parts: 10, label: '1/10', wFactor: 0.2, hFactor: 0.5, type: 'grid', cols: 5, rows: 2 },
  { id: 'div-10b', name: 'Décimo Misto', parts: 10, label: '1/10 M', wFactor: 0.229, hFactor: 0.394, type: 'mixed',
    customBoxes: [
      { x: 0, y: 0, w: 27, h: 33.3 }, { x: 27, y: 0, w: 27, h: 33.3 }, { x: 54, y: 0, w: 27, h: 33.3 },
      { x: 0, y: 33.3, w: 27, h: 33.3 }, { x: 27, y: 33.3, w: 27, h: 33.3 }, { x: 54, y: 33.3, w: 27, h: 33.3 },
      { x: 0, y: 66.6, w: 27, h: 33.3 }, { x: 27, y: 66.6, w: 27, h: 33.3 }, { x: 54, y: 66.6, w: 27, h: 33.3 },
      { x: 81, y: 0, w: 19, h: 39.4, r: true }
    ]
  },
  { id: 'div-11', name: 'Onze Misto', parts: 11, label: '1/11 M', wFactor: 0.218, hFactor: 0.378, type: 'mixed',
    customBoxes: [
      { x: 0, y: 0, w: 25, h: 33.3 }, { x: 25, y: 0, w: 25, h: 33.3 }, { x: 50, y: 0, w: 25, h: 33.3 },
      { x: 0, y: 33.3, w: 25, h: 33.3 }, { x: 25, y: 33.3, w: 25, h: 33.3 }, { x: 50, y: 33.3, w: 25, h: 33.3 },
      { x: 0, y: 66.6, w: 25, h: 33.3 }, { x: 25, y: 66.6, w: 25, h: 33.3 }, { x: 50, y: 66.6, w: 25, h: 33.3 },
      { x: 75, y: 0, w: 21.8, h: 37.8, r: true }, { x: 75, y: 37.8, w: 21.8, h: 37.8, r: true }
    ]
  },
  { id: 'div-12a', name: 'Doze Avos (4x3)', parts: 12, label: '1/12', wFactor: 0.25, hFactor: 0.333, type: 'grid', cols: 4, rows: 3 },
  { id: 'div-12b', name: 'Doze Avos (6x2)', parts: 12, label: '1/12 L', wFactor: 0.166, hFactor: 0.5, type: 'grid', cols: 6, rows: 2 },
  { id: 'div-14', name: 'Catorze Avos', parts: 14, label: '1/14', wFactor: 0.2, hFactor: 0.354, type: 'grid', cols: 7, rows: 2 },
  { id: 'div-15', name: 'Quinze Avos', parts: 15, label: '1/15', wFactor: 0.2, hFactor: 0.333, type: 'grid', cols: 5, rows: 3 },
  { id: 'div-16', name: 'Dezesseis Avos', parts: 16, label: '1/16', wFactor: 0.25, hFactor: 0.25, type: 'grid', cols: 4, rows: 4 },
  { id: 'div-18', name: 'Dezoito Avos', parts: 18, label: '1/18', wFactor: 0.166, hFactor: 0.333, type: 'grid', cols: 6, rows: 3 },
  { id: 'div-20', name: 'Vinte Avos', parts: 20, label: '1/20', wFactor: 0.2, hFactor: 0.25, type: 'grid', cols: 5, rows: 4 },
  { id: 'div-22', name: 'Vinte e Dois M', parts: 22, label: '1/22 M', wFactor: 0.135, hFactor: 0.333, type: 'mixed',
    customBoxes: [
      { x: 0, y: 0, w: 14.2, h: 33.3 }, { x: 14.2, y: 0, w: 14.2, h: 33.3 }, { x: 28.4, y: 0, w: 14.2, h: 33.3 }, { x: 42.6, y: 0, w: 14.2, h: 33.3 }, { x: 56.8, y: 0, w: 14.2, h: 33.3 }, { x: 71.0, y: 0, w: 14.2, h: 33.3 }, { x: 85.2, y: 0, w: 14.2, h: 33.3 },
      { x: 0, y: 33.3, w: 14.2, h: 33.3 }, { x: 14.2, y: 33.3, w: 14.2, h: 33.3 }, { x: 28.4, y: 33.3, w: 14.2, h: 33.3 }, { x: 42.6, y: 33.3, w: 14.2, h: 33.3 }, { x: 56.8, y: 33.3, w: 14.2, h: 33.3 }, { x: 71.0, y: 33.3, w: 14.2, h: 33.3 }, { x: 85.2, y: 33.3, w: 14.2, h: 33.3 },
      { x: 0, y: 66.6, w: 14.2, h: 33.3 }, { x: 14.2, y: 66.6, w: 14.2, h: 33.3 }, { x: 28.4, y: 66.6, w: 14.2, h: 33.3 }, { x: 42.6, y: 66.6, w: 14.2, h: 33.3 }, { x: 56.8, y: 66.6, w: 14.2, h: 33.3 }, { x: 71.0, y: 66.6, w: 14.2, h: 33.3 }, { x: 85.2, y: 66.6, w: 14.2, h: 33.3 },
      { x: 0, y: 0, w: 13.5, h: 33.3, r: true }
    ]
  },
  { id: 'div-24a', name: 'Vinte e Quatro (8x3)', parts: 24, label: '1/24', wFactor: 0.125, hFactor: 0.333, type: 'grid', cols: 8, rows: 3 },
  { id: 'div-24b', name: 'Vinte e Quatro (6x4)', parts: 24, label: '1/24 G', wFactor: 0.166, hFactor: 0.25, type: 'grid', cols: 6, rows: 4 },
  { id: 'div-25', name: 'Vinte e Cinco', parts: 25, label: '1/25', wFactor: 0.2, hFactor: 0.2, type: 'grid', cols: 5, rows: 5 },
  { id: 'div-30', name: 'Trinta Avos', parts: 30, label: '1/30', wFactor: 0.166, hFactor: 0.2, type: 'grid', cols: 6, rows: 5 },
  { id: 'div-32', name: 'Trinta e Dois Avos', parts: 32, label: '1/32', wFactor: 0.125, hFactor: 0.25, type: 'grid', cols: 8, rows: 4 }
];

const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // purple
];

export default function App() {
  // State for stock paper
  const [stockWidth, setStockWidth] = useState<number>(0); 
  const [stockHeight, setStockHeight] = useState<number>(0); 
  const [margin, setMargin] = useState<number>(0); 
  const [kerf, setKerf] = useState<number>(0); 
  const [sheetCost, setSheetCost] = useState<number>(0); 

  // State for items
  const [items, setItems] = useState<CutItem[]>([]);

  // Form State for new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemWidth, setNewItemWidth] = useState<number>(0);
  const [newItemHeight, setNewItemHeight] = useState<number>(0);
  const [newItemQty, setNewItemQty] = useState<number>(0);
  const [newItemCanRotate, setNewItemCanRotate] = useState<boolean>(true);
  const [newItemGrainSensitive, setNewItemGrainSensitive] = useState<boolean>(false);
  const [newItemColor, setNewItemColor] = useState<string>('#8b5cf6');

  // Optimization settings state
  const [cutType, setCutType] = useState<'guillotine' | 'free'>('guillotine');
  const [grainDirection, setGrainDirection] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const [preferredSplit, setPreferredSplit] = useState<'shorter' | 'longer' | 'horizontal' | 'vertical'>('shorter');

  // Interactive UI state
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'cuts' | 'about'>('layout');
  const [session2Tab, setSession2Tab] = useState<'formato' | 'aproveitamento'>('formato');
  const [selectedPresetGroup, setSelectedPresetGroup] = useState<'grafica' | 'iso' | 'internacional'>('grafica');
  const [selectedItemPresetGroup, setSelectedItemPresetGroup] = useState<'grafica' | 'iso' | 'internacional'>('grafica');
  const [actionError, setActionError] = useState<string | null>(null);
  const [appliedDivisionId, setAppliedDivisionId] = useState<string | null>(null);

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => {
      setActionError(null);
    }, 6000);
  };

  // Compute optimization result
  const stockSheet: StockSheet = useMemo(() => ({
    width: stockWidth,
    height: stockHeight,
    margin,
    kerf
  }), [stockWidth, stockHeight, margin, kerf]);

  const optimizationResult = useMemo(() => {
    const rawResult = optimizePaperCutting(stockSheet, items, {
      cutType,
      grainDirection,
      preferredSplit
    });

    if (session2Tab === 'aproveitamento') {
      // Limit to exactly 1 sheet if there are sheets
      if (rawResult.sheets.length > 1) {
        const firstSheet = rawResult.sheets[0];
        
        // Find how many of each item are placed on the first sheet
        const placedOnFirstCount: Record<string, number> = {};
        firstSheet.placedItems.forEach(item => {
          placedOnFirstCount[item.id] = (placedOnFirstCount[item.id] || 0) + 1;
        });

        // Compute new unplaced items list
        const newUnplaced = items.map(item => {
          const placed = placedOnFirstCount[item.id] || 0;
          const remaining = item.quantity - placed;
          return { item, remainingQty: remaining };
        }).filter(u => u.remainingQty > 0);

        const totalStockArea = firstSheet.width * firstSheet.height;
        const totalUsedArea = firstSheet.usedArea;
        const overallEfficiency = (totalUsedArea / totalStockArea) * 100;

        return {
          ...rawResult,
          sheets: [firstSheet],
          totalSheets: 1,
          overallEfficiency,
          totalUsedArea,
          totalStockArea,
          unplacedItems: newUnplaced
        };
      }
    }
    return rawResult;
  }, [stockSheet, items, cutType, grainDirection, preferredSplit, session2Tab]);

  // Handle preset clicks for stock
  const handleApplyStockPreset = (preset: { name: string; width: number; height: number }) => {
    setStockWidth(preset.width);
    setStockHeight(preset.height);
  };

  // Handle preset clicks for items
  const handleApplyItemPreset = (preset: { name: string; width: number; height: number; canRotate: boolean; grainSensitive: boolean }) => {
    setNewItemName(preset.name.split(' (')[0]);
    setNewItemWidth(preset.width);
    setNewItemHeight(preset.height);
    setNewItemCanRotate(preset.canRotate);
    setNewItemGrainSensitive(preset.grainSensitive);
    // Assign a semi-random color from palette
    const colorIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
    setNewItemColor(COLOR_PALETTE[colorIndex]);
  };

  // Add item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemWidth <= 0 || newItemHeight <= 0 || newItemQty <= 0) {
      return;
    }

    const item: CutItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      width: newItemWidth,
      height: newItemHeight,
      quantity: newItemQty,
      canRotate: newItemCanRotate,
      grainSensitive: newItemGrainSensitive,
      color: newItemColor
    };

    setItems([...items, item]);
    setAppliedDivisionId(null);

    // Reset some form values
    setNewItemName('');
    // Alternate colors
    const nextColorIndex = (items.length + 1) % COLOR_PALETTE.length;
    setNewItemColor(COLOR_PALETTE[nextColorIndex]);
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setAppliedDivisionId(null);
  };

  // Duplicate item
  const handleDuplicateItem = (item: CutItem) => {
    const duplicated: CutItem = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Cópia)`,
    };
    setItems([...items, duplicated]);
    setAppliedDivisionId(null);
  };

  // Update item quantity
  const handleUpdateQty = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
    setAppliedDivisionId(null);
  };

  // Clean all items
  const handleClearAllItems = () => {
    setItems([]);
    setAppliedDivisionId(null);
  };

  // Aproveitamento Máximo (Calcula a quantidade máxima que cabe em exatamente uma única folha de origem)
  const handleAproveitamentoMaximo = () => {
    if (newItemWidth <= 0 || newItemHeight <= 0) {
      showError('Por favor, defina a largura e altura do material unitário.');
      return;
    }

    const testItem: CutItem = {
      id: `temp-${Date.now()}`,
      name: newItemName.trim() || 'Material Unitário',
      width: newItemWidth,
      height: newItemHeight,
      quantity: 1500, // quantidade alta o suficiente para encontrar o limite máximo
      canRotate: newItemCanRotate,
      grainSensitive: newItemGrainSensitive,
      color: newItemColor
    };

    const tempResult = optimizePaperCutting(stockSheet, [testItem], {
      cutType,
      grainDirection,
      preferredSplit
    });

    const maxQty = tempResult.sheets[0]?.placedItems.length || 0;

    if (maxQty === 0) {
      showError('O material unitário é maior do que a folha de origem (considerando margens e sangrias).');
      return;
    }

    // Atualiza o formulário com a quantidade máxima encontrada
    setNewItemQty(maxQty);

    const name = newItemName.trim() || 'Aproveitamento Máximo';

    const finalItem: CutItem = {
      id: `item-${Date.now()}`,
      name: name,
      width: newItemWidth,
      height: newItemHeight,
      quantity: maxQty,
      canRotate: newItemCanRotate,
      grainSensitive: newItemGrainSensitive,
      color: newItemColor
    };

    // Substitui a lista de itens atuais para preencher exatamente 1 folha de origem
    setItems([finalItem]);
    setSelectedSheetIndex(0);
    setAppliedDivisionId(null);
  };

  // Aplicar uma divisão padrão calculada no painel de Aproveitamento
  const handleApplyDivision = (option: DivisionOption) => {
    setAppliedDivisionId(option.id);

    let w = 0;
    let h = 0;
    
    if (option.type === 'grid' && option.cols && option.rows) {
      w = Math.max(1, Math.floor((stockWidth - 2 * margin - (option.cols - 1) * kerf) / option.cols));
      h = Math.max(1, Math.floor((stockHeight - 2 * margin - (option.rows - 1) * kerf) / option.rows));
    } else {
      w = Math.max(1, Math.floor((stockWidth - 2 * margin) * option.wFactor));
      h = Math.max(1, Math.floor((stockHeight - 2 * margin) * option.hFactor));
    }

    const name = `Formato ${option.parts} (${option.label})`;
    
    // Atualiza os estados do formulário
    setNewItemName(name);
    setNewItemWidth(w);
    setNewItemHeight(h);
    setNewItemQty(option.parts);
    setNewItemCanRotate(true);
    setNewItemGrainSensitive(false);

    // Cria e substitui a lista de materiais pelo item aproveitado
    const finalItem: CutItem = {
      id: `item-${Date.now()}`,
      name: name,
      width: w,
      height: h,
      quantity: option.parts,
      canRotate: true,
      grainSensitive: false,
      color: COLOR_PALETTE[0]
    };

    setItems([finalItem]);
    setSelectedSheetIndex(0);
  };

  // Export current SVG to file
  const handleExportSVG = (sheet: SheetResult) => {
    const svgElement = document.getElementById(`svg-sheet-${sheet.sheetId}`);
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);
    
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `otimizacao_corte_folha_${sheet.sheetId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Auto-fill template to showcase performance
  const handleLoadDemo = () => {
    setStockWidth(1000);
    setStockHeight(700);
    setMargin(5);
    setKerf(2);
    setSheetCost(6.20);
    setItems([
      { id: 'demo-1', name: 'Livro Capa Dura (A5)', width: 148, height: 210, quantity: 12, canRotate: true, grainSensitive: true, color: '#3b82f6' },
      { id: 'demo-2', name: 'Flyer Promoção', width: 100, height: 150, quantity: 45, canRotate: true, grainSensitive: false, color: '#10b981' },
      { id: 'demo-3', name: 'Cartão de Visita Matte', width: 90, height: 50, quantity: 80, canRotate: true, grainSensitive: false, color: '#f59e0b' },
      { id: 'demo-4', name: 'Marcador de Páginas', width: 50, height: 180, quantity: 24, canRotate: true, grainSensitive: false, color: '#ec4899' }
    ]);
    setSelectedSheetIndex(0);
    setAppliedDivisionId(null);
  };

  const selectedSheet: SheetResult | undefined = optimizationResult.sheets[selectedSheetIndex];

  const totalPlacedUnits = useMemo(() => {
    return optimizationResult.sheets.reduce((sum, sheet) => sum + sheet.placedItems.length, 0);
  }, [optimizationResult]);

  const unitCost = useMemo(() => {
    return totalPlacedUnits > 0 ? (optimizationResult.totalSheets * sheetCost) / totalPlacedUnits : 0;
  }, [optimizationResult.totalSheets, sheetCost, totalPlacedUnits]);

  // Steps for cutting
  const cutSteps = useMemo(() => {
    if (!selectedSheet) return [];
    return generateCutSteps(selectedSheet, stockSheet);
  }, [selectedSheet, stockSheet]);

  // Printable layout window trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#EAEAEA] text-[#0A0A0A] antialiased font-sans flex flex-col print:bg-white print:text-black">
      {/* Header */}
      <header className="bg-[#F5F5F5] border-b border-[#D1D1D1] py-4 px-6 sticky top-0 z-10 print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xl font-black tracking-tight font-sans text-[#0A0A0A] lowercase">corte de papel</h1>
          <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">v0.1 // por foite</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadDemo}
            className="px-4 py-2 border border-[#D1D1D1] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] font-display font-bold text-[11px] uppercase tracking-wider transition rounded-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Carregar Exemplo
          </button>
          <button
            onClick={handlePrint}
            disabled={optimizationResult.sheets.length === 0}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#333333] text-white font-display font-bold text-[11px] uppercase tracking-wider transition rounded-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Plano
          </button>
        </div>
      </header>

      {/* Main Grid: Three columns on desktop */}
      <main className="grid grid-cols-1 lg:grid-cols-[380px_1fr_340px] flex-1 lg:h-[calc(100vh-68px-48px)] print:p-0 print:block overflow-hidden bg-[#D1D1D1] gap-[1px]">
        
        {/* LEFT COLUMN: SOURCE MATERIAL & CONFIGURATION */}
        <aside className="bg-[#EAEAEA] p-6 overflow-y-auto flex flex-col gap-8 print:hidden lg:h-full">
          
          {/* Section 01: Material de Origem */}
          <section className="flex flex-col">
            <h2 className="font-display font-bold text-[11px] uppercase tracking-wider text-[#555555] mb-4">
              [01] Material de Origem
            </h2>

            {/* Presets Group Tab */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-[#555555] block mb-2 uppercase tracking-wide">Presets Comerciais:</span>
              <div className="flex bg-[#F5F5F5] p-1 border border-[#D1D1D1] rounded-sm mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedPresetGroup('grafica')}
                  className={`flex-1 text-center py-1 px-1 text-[11px] font-semibold rounded-md transition-all ${
                    selectedPresetGroup === 'grafica'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Folha Gráfica
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPresetGroup('iso')}
                  className={`flex-1 text-center py-1 px-1 text-[11px] font-semibold rounded-md transition-all ${
                    selectedPresetGroup === 'iso'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ISO (A1-A7)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPresetGroup('internacional')}
                  className={`flex-1 text-center py-1 px-1 text-[11px] font-semibold rounded-md transition-all ${
                    selectedPresetGroup === 'internacional'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Internacionais
                </button>
              </div>

              {/* Presets list of current category */}
              <div className="grid grid-cols-2 gap-1 max-h-[140px] overflow-y-auto pr-1">
                {(selectedPresetGroup === 'grafica'
                  ? STOCK_PRESETS_GRAFICA
                  : selectedPresetGroup === 'iso'
                  ? STOCK_PRESETS_ISO
                  : STOCK_PRESETS_INTERNACIONAL
                ).map((preset) => {
                  const isCurrent = stockWidth === preset.width && stockHeight === preset.height;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyStockPreset(preset)}
                      className={`text-left px-2 py-1.5 rounded-sm border transition flex flex-col cursor-pointer ${
                        isCurrent
                          ? 'bg-white border-[#0A0A0A] text-[#0A0A0A] ring-1 ring-[#0A0A0A]'
                          : 'bg-white border-[#D1D1D1] text-[#555555] hover:border-[#555555]'
                      }`}
                    >
                      <span className="font-bold text-[10px] truncate block" title={preset.name}>{preset.name}</span>
                      <span className="text-[9px] font-mono mt-0.5 block">
                        {preset.width}x{preset.height} mm
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dimensions Input */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <label htmlFor="input-stock-width" className="text-[10px] font-bold text-[#555555] uppercase tracking-wide block mb-1">Largura (mm)</label>
                <input
                  id="input-stock-width"
                  type="number"
                  min="0"
                  max="5000"
                  value={stockWidth || ''}
                  onChange={(e) => setStockWidth(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-[#D1D1D1] rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#0A0A0A] font-mono text-[#0A0A0A]"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="input-stock-height" className="text-[10px] font-bold text-[#555555] uppercase tracking-wide block mb-1">Altura (mm)</label>
                <input
                  id="input-stock-height"
                  type="number"
                  min="0"
                  max="5000"
                  value={stockHeight || ''}
                  onChange={(e) => setStockHeight(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-[#D1D1D1] rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#0A0A0A] font-mono text-[#0A0A0A]"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Margins, Sangria, Cost */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#D1D1D1]">
              <div>
                <label htmlFor="input-stock-margin" className="text-[9px] font-bold text-[#555555] uppercase tracking-wider block mb-1" title="Margem de segurança nas bordas">
                  Margem
                </label>
                <input
                  id="input-stock-margin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={margin || ''}
                  onChange={(e) => setMargin(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#0A0A0A] font-mono text-[#0A0A0A]"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="input-stock-kerf" className="text-[9px] font-bold text-[#555555] uppercase tracking-wider block mb-1" title="Espessura da serra ou sangria de corte">
                  Lâmina
                </label>
                <input
                  id="input-stock-kerf"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={kerf || ''}
                  onChange={(e) => setKerf(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#0A0A0A] font-mono text-[#0A0A0A]"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="input-stock-cost" className="text-[9px] font-bold text-[#555555] uppercase tracking-wider block mb-1" title="Preço unitário da folha de origem">
                  Custo R$
                </label>
                <input
                  id="input-stock-cost"
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  value={sheetCost || ''}
                  onChange={(e) => setSheetCost(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#0A0A0A] font-mono text-[#0A0A0A]"
                  placeholder="0,00"
                />
              </div>
            </div>
          </section>

          {/* Section 02: Material Unitário (Demanda) */}
          <section className="flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-[11px] uppercase tracking-wider text-[#555555]">
                [02] Demanda Unitária
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleClearAllItems(); }}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar tudo
                </button>
              )}
            </div>

            {/* Session 2 Tabs: Formato vs Aproveitamento */}
            <div className="flex bg-[#F5F5F5] p-1 border border-[#D1D1D1] rounded-sm mb-4">
              <button
                type="button"
                onClick={() => setSession2Tab('formato')}
                className={`flex-1 text-center py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                  session2Tab === 'formato'
                    ? 'bg-white text-[#0A0A0A] shadow-xs border border-[#D1D1D1]'
                    : 'text-[#555555] hover:text-[#0A0A0A]'
                }`}
              >
                Formato
              </button>
              <button
                type="button"
                onClick={() => setSession2Tab('aproveitamento')}
                className={`flex-1 text-center py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                  session2Tab === 'aproveitamento'
                    ? 'bg-white text-[#0A0A0A] shadow-xs border border-[#D1D1D1]'
                    : 'text-[#555555] hover:text-[#0A0A0A]'
                }`}
              >
                Aproveitamento
              </button>
            </div>

            {session2Tab === 'formato' ? (
              <>
                {/* Quick Presets for Cut Items */}
                <div className="mb-4 bg-[#F5F5F5] p-3 border border-[#D1D1D1] rounded-sm">
                  <span className="text-[9px] font-bold text-[#555555] block mb-2 uppercase tracking-wide">Modelos Pré-definidos:</span>
                  
                  {/* Category sub-tabs for materials */}
                  <div className="flex bg-white border border-[#D1D1D1] p-0.5 rounded-sm mb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItemPresetGroup('grafica')}
                      className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                        selectedItemPresetGroup === 'grafica'
                          ? 'bg-[#0A0A0A] text-white'
                          : 'text-[#555555] hover:text-[#0A0A0A]'
                      }`}
                    >
                      Gráfica
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItemPresetGroup('iso')}
                      className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                        selectedItemPresetGroup === 'iso'
                          ? 'bg-[#0A0A0A] text-white'
                          : 'text-[#555555] hover:text-[#0A0A0A]'
                      }`}
                    >
                      ISO (A1-A7)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItemPresetGroup('internacional')}
                      className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                        selectedItemPresetGroup === 'internacional'
                          ? 'bg-[#0A0A0A] text-white'
                          : 'text-[#555555] hover:text-[#0A0A0A]'
                      }`}
                    >
                      Internacional
                    </button>
                  </div>

                  {/* Presets list of current category */}
                  <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-1">
                    {(selectedItemPresetGroup === 'grafica'
                      ? ITEM_PRESETS_GRAFICA
                      : selectedItemPresetGroup === 'iso'
                      ? ITEM_PRESETS_ISO
                      : ITEM_PRESETS_INTERNACIONAL
                    ).map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyItemPreset(preset)}
                        className="px-2 py-1 bg-white hover:border-[#555555] text-[#0A0A0A] text-[9px] font-bold border border-[#D1D1D1] rounded-sm transition cursor-pointer"
                        title={`${preset.name}: ${preset.width} x ${preset.height} mm`}
                      >
                        {preset.name} ({preset.width}x{preset.height})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add New Item Form */}
                <form id="form-add-item" onSubmit={handleAddItem} className="space-y-3 bg-white p-4 border border-[#D1D1D1] rounded-sm mb-4">
                  {actionError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-2 flex items-start gap-1.5 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>{actionError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-12">
                      <label htmlFor="input-item-name" className="text-[10px] font-bold text-[#555555] uppercase tracking-wide block mb-1">Identificação / Nome</label>
                      <input
                        id="input-item-name"
                        type="text"
                        required
                        placeholder="Ex: Panfleto, Flyer, Envelope"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0A0A0A] font-sans text-[#0A0A0A]"
                      />
                    </div>
                    
                    <div className="md:col-span-4">
                      <label htmlFor="input-item-width" className="text-[10px] font-bold text-[#555555] uppercase tracking-wide block mb-1">Largura (mm)</label>
                      <input
                        id="input-item-width"
                        type="number"
                        min="1"
                        max="4000"
                        required
                        value={newItemWidth || ''}
                        onChange={(e) => setNewItemWidth(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0A0A0A] text-[#0A0A0A]"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label htmlFor="input-item-height" className="text-[10px] font-bold text-[#555555] uppercase tracking-wide block mb-1">Altura (mm)</label>
                      <input
                        id="input-item-height"
                        type="number"
                        min="1"
                        max="4000"
                        required
                        value={newItemHeight || ''}
                        onChange={(e) => setNewItemHeight(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0A0A0A] text-[#0A0A0A]"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label htmlFor="input-item-qty" className="text-[10px] font-bold text-[#555555] uppercase tracking-wide block mb-1">Qtd. Total</label>
                      <input
                        id="input-item-qty"
                        type="number"
                        min="1"
                        max="5000"
                        required
                        value={newItemQty || ''}
                        onChange={(e) => setNewItemQty(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0A0A0A] text-[#0A0A0A]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#555555] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newItemCanRotate}
                          onChange={(e) => setNewItemCanRotate(e.target.checked)}
                          className="rounded-sm border-[#D1D1D1] text-[#0A0A0A] focus:ring-[#0A0A0A] w-3.5 h-3.5"
                        />
                        Girar Item
                      </label>
                      
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#555555] cursor-pointer select-none" title="Respeitar o sentido da fibra do papel de origem">
                        <input
                          type="checkbox"
                          checked={newItemGrainSensitive}
                          onChange={(e) => setNewItemGrainSensitive(e.target.checked)}
                          className="rounded-sm border-[#D1D1D1] text-[#0A0A0A] focus:ring-[#0A0A0A] w-3.5 h-3.5"
                        />
                        Fibra Ativa
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#555555]">Cor:</span>
                      <div className="flex items-center gap-1">
                        {COLOR_PALETTE.slice(0, 5).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewItemColor(color)}
                            className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                              newItemColor === color ? 'ring-2 ring-[#0A0A0A] scale-110 border-white' : 'border-[#D1D1D1]'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={newItemColor}
                          onChange={(e) => setNewItemColor(e.target.value)}
                          className="w-5 h-5 rounded-sm p-0 border-0 cursor-pointer"
                          title="Escolher cor personalizada"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-[10px] uppercase tracking-wider rounded-sm py-2 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Item
                    </button>
                    <button
                      type="button"
                      onClick={handleAproveitamentoMaximo}
                      className="w-full border border-[#D1D1D1] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider rounded-sm py-2 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Calcula a quantidade máxima de aproveitamento"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Preencher Limite
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="text-[10px] text-[#555555] mb-3 bg-[#F5F5F5] p-3 border border-[#D1D1D1] rounded-sm flex items-start gap-2 font-mono">
                  <Info className="w-4 h-4 text-[#0A0A0A] flex-shrink-0 mt-0.5" />
                  <div>
                    Escolha uma partição comercial para preenchimento automático. Linha <span className="text-red-600 font-bold">vermelha</span> indica a primeira guilhotinagem.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[300px] pr-1 pb-2">
                  {DIVISION_OPTIONS.map((option) => {
                    let w = 0;
                    let h = 0;
                    if (option.type === 'grid' && option.cols && option.rows) {
                      w = Math.max(1, Math.floor((stockWidth - 2 * margin - (option.cols - 1) * kerf) / option.cols));
                      h = Math.max(1, Math.floor((stockHeight - 2 * margin - (option.rows - 1) * kerf) / option.rows));
                    } else {
                      w = Math.max(1, Math.floor((stockWidth - 2 * margin) * option.wFactor));
                      h = Math.max(1, Math.floor((stockHeight - 2 * margin) * option.hFactor));
                    }

                    // Check if is applied currently
                    const isApplied = appliedDivisionId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleApplyDivision(option)}
                        className={`group flex flex-col p-2.5 border text-left transition relative overflow-hidden h-[150px] cursor-pointer rounded-sm ${
                          isApplied
                            ? 'bg-white border-[#0A0A0A] text-[#0A0A0A] ring-1 ring-[#0A0A0A]'
                            : 'bg-white border-[#D1D1D1] text-[#0A0A0A] hover:border-[#555555]'
                        }`}
                      >
                        <div className="w-full flex items-start justify-between gap-1 mb-1">
                          <div className="min-w-0">
                            <span className="text-[8px] font-mono font-bold uppercase text-[#555555]">
                              {option.label}
                            </span>
                            <p className="text-[10px] font-bold truncate block leading-tight">{option.name}</p>
                          </div>
                          <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded-sm flex-shrink-0 ${
                            isApplied ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] border border-[#D1D1D1] text-[#555555]'
                          }`}>
                            {option.parts} {option.parts === 1 ? 'parte' : 'partes'}
                          </span>
                        </div>

                        {/* Mini CSS Preview of division */}
                        <div className="w-full h-[60px] bg-[#F5F5F5] border border-[#D1D1D1] overflow-hidden relative flex items-center justify-center p-0.5 group-hover:bg-[#EAEAEA] transition mb-1 rounded-sm">
                          <div className="w-full h-full border border-dashed border-[#D1D1D1] relative bg-white flex items-center justify-center overflow-hidden">
                            {option.type === 'grid' && option.cols && option.rows ? (
                              <div 
                                className="w-full h-full grid"
                                style={{
                                  gridTemplateColumns: `repeat(${option.cols}, minmax(0, 1fr))`,
                                  gridTemplateRows: `repeat(${option.rows}, minmax(0, 1fr))`,
                                  gap: '1px'
                                }}
                              >
                                {Array.from({ length: option.parts }).map((_, idx) => {
                                  const cols = option.cols || 1;
                                  const isFirstCol = idx % cols === 0;
                                  const isFirstRow = Math.floor(idx / cols) === 0;
                                  
                                  const drawRedCol = cols > 1 && idx % cols === 1 && isFirstRow;
                                  const drawRedRow = (option.rows || 1) > 1 && Math.floor(idx / cols) === 1 && isFirstCol;

                                  return (
                                    <div 
                                      key={idx} 
                                      className="bg-[#F5F5F5] border border-white flex items-center justify-center text-[7px] font-mono font-bold text-[#555555]/40 relative w-full h-full"
                                    >
                                      {drawRedCol && (
                                        <div className="absolute top-0 bottom-0 left-0 w-[1.5px] bg-red-600 z-10" />
                                      )}
                                      {drawRedRow && (
                                        <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-red-600 z-10" />
                                      )}
                                      •
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="w-full h-full relative">
                                {option.customBoxes?.map((box, idx) => (
                                  <div
                                    key={idx}
                                    className="absolute bg-[#F5F5F5] border border-white flex items-center justify-center"
                                    style={{
                                      left: `${box.x}%`,
                                      top: `${box.y}%`,
                                      width: `${box.w}%`,
                                      height: `${box.h}%`,
                                    }}
                                  >
                                    {idx === 3 && (
                                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-red-600 z-10" />
                                    )}
                                    <span className="text-[7px] font-mono font-bold text-[#555555]/40 scale-75">
                                      {box.r ? 'R' : '•'}
                                    </span>
                                  </div>
                                ))}
                                <div className="absolute inset-0 bg-[#0A0A0A]/5 pointer-events-none -z-10" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-full text-center mt-auto">
                          <p className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-slate-800 transition">
                            {w} x {h} mm
                          </p>
                        </div>

                        {isApplied && (
                          <div className="absolute bottom-1 right-1">
                            <span className="flex h-1.5 w-1.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of items added */}
            <div className="overflow-y-auto max-h-[180px] lg:max-h-none border border-[#D1D1D1] rounded-sm">
              {items.length === 0 ? (
                <div className="h-24 flex flex-col items-center justify-center text-[#555555] bg-white rounded-sm border border-dashed border-[#D1D1D1]">
                  <Info className="w-4 h-4 mb-1 text-[#555555]" />
                  <p className="text-[10px] font-bold uppercase tracking-wide">Nenhuma demanda registrada.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#D1D1D1] bg-white">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 flex items-center justify-between gap-3 transition ${
                        hoveredItemId === item.id ? 'bg-[#F5F5F5]' : 'bg-white'
                      }`}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#0A0A0A] truncate">{item.name}</p>
                          <p className="text-[9px] text-[#555555] font-mono leading-none mt-0.5">
                            {item.width}x{item.height} mm
                            {item.canRotate && <span className="text-[8px] bg-[#EAEAEA] text-[#0A0A0A] px-1 py-0.2 rounded-sm ml-1 font-sans font-bold uppercase tracking-wide">Rotável</span>}
                            {item.grainSensitive && <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded-sm ml-1 font-sans font-bold uppercase tracking-wide">Com Fibra</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Quantity controls */}
                        {session2Tab === 'aproveitamento' ? (
                          <div className="px-2 py-1 bg-[#F5F5F5] border border-[#D1D1D1] rounded-sm text-[9px] font-mono font-bold text-[#0A0A0A] uppercase tracking-wide">
                            {item.quantity} un (Fixo)
                          </div>
                        ) : (
                          <div className="flex items-center border border-[#D1D1D1] rounded-sm bg-white text-[11px] font-mono">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="px-1.5 py-0.5 hover:bg-[#EAEAEA] text-[#555555] font-bold transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold text-[#0A0A0A]">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="px-1.5 py-0.5 hover:bg-[#EAEAEA] text-[#555555] font-bold transition cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* Actions */}
                        {session2Tab !== 'aproveitamento' && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(item)}
                              title="Duplicar"
                              className="p-1 hover:bg-[#EAEAEA] rounded-sm text-[#555555] hover:text-[#0A0A0A] transition cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              title="Excluir"
                              className="p-1 hover:bg-rose-50 rounded-sm text-[#555555] hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 03: Advanced Optimization Parameters */}
          <section className="flex flex-col">
            <h2 className="font-display font-bold text-[11px] uppercase tracking-wider text-[#555555] mb-4">
              [03] Configuração de Otimização
            </h2>

            <div className="space-y-4">
              {/* Cutting type */}
              <div>
                <span className="text-[10px] font-bold text-[#555555] block mb-2 uppercase tracking-wide">Diretriz de Corte:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCutType('guillotine')}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition text-center cursor-pointer ${
                      cutType === 'guillotine'
                        ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white shadow-xs'
                        : 'bg-white border-[#D1D1D1] text-[#555555] hover:border-[#555555]'
                    }`}
                  >
                    Guilhotina
                    <span className="text-[9px] block opacity-85 lowercase font-mono mt-0.5">// cortes retos de ponta a ponta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCutType('free')}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition text-center cursor-pointer ${
                      cutType === 'free'
                        ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white shadow-xs'
                        : 'bg-white border-[#D1D1D1] text-[#555555] hover:border-[#555555]'
                    }`}
                  >
                    Livre / CNC
                    <span className="text-[9px] block opacity-85 lowercase font-mono mt-0.5">// ninho livre multidirecional</span>
                  </button>
                </div>
              </div>

              {/* Grain direction */}
              <div>
                <span className="text-[10px] font-bold text-[#555555] block mb-2 uppercase tracking-wide">Direção da Fibra:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'horizontal', 'vertical'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setGrainDirection(dir)}
                      className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition text-center cursor-pointer ${
                        grainDirection === dir
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                          : 'bg-white border-[#D1D1D1] text-[#555555] hover:border-[#555555]'
                      }`}
                    >
                      {dir === 'none' && 'Indiferente'}
                      {dir === 'horizontal' && 'Horiz. ↔'}
                      {dir === 'vertical' && 'Vert. ↕'}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-[#555555] mt-1.5 leading-tight">
                  Se ativa, itens marcados com "Fibra Ativa" mantêm o alinhamento paralelo ao sentido principal.
                </p>
              </div>

              {/* Split preference */}
              <div>
                <span className="text-[10px] font-bold text-[#555555] block mb-1.5 uppercase tracking-wide">Estratégia de Guilhotinagem:</span>
                <select
                  value={preferredSplit}
                  onChange={(e) => setPreferredSplit(e.target.value as any)}
                  className="w-full bg-white border border-[#D1D1D1] rounded-sm px-2.5 py-2 text-xs focus:outline-none focus:border-[#0A0A0A] font-sans text-[#0A0A0A]"
                >
                  <option value="shorter">Priorizar Lado Menor (Recomendado)</option>
                  <option value="longer">Priorizar Lado Maior (Menos perdas)</option>
                  <option value="horizontal">Cortar Sempre Horizontal Primeiro</option>
                  <option value="vertical">Cortar Sempre Vertical Primeiro</option>
                </select>
              </div>
            </div>
          </section>
        </aside>

        {/* MIDDLE COLUMN: VISUAL CANVAS & PRODUCTION METRICS (Span 1fr) */}
        <section className="flex flex-col gap-6 p-6 overflow-y-auto lg:h-full bg-[#EAEAEA]">
          
          {/* Results Overview (Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-[#D1D1D1] p-3 rounded-sm flex flex-col justify-between shadow-2xs">
              <span className="text-[#555555] font-mono font-bold text-[9px] uppercase tracking-wide">Aproveitamento</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black text-[#0A0A0A] font-mono leading-none">
                  {optimizationResult.overallEfficiency.toFixed(1)}%
                </span>
              </div>
              <span className="text-[9px] text-[#555555] font-mono mt-1">
                Perda: {(100 - optimizationResult.overallEfficiency).toFixed(1)}%
              </span>
            </div>

            <div className="bg-white border border-[#D1D1D1] p-3 rounded-sm flex flex-col justify-between shadow-2xs">
              <span className="text-[#555555] font-mono font-bold text-[9px] uppercase tracking-wide">Folhas Gastas</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black text-[#0A0A0A] font-mono leading-none">{optimizationResult.totalSheets}</span>
                <span className="text-[9px] font-bold text-[#555555] uppercase tracking-wide">fls</span>
              </div>
              <span className="text-[9px] text-[#555555] font-mono mt-1">
                Formato: {stockWidth}x{stockHeight}mm
              </span>
            </div>

            <div className="bg-white border border-[#D1D1D1] p-3 rounded-sm flex flex-col justify-between shadow-2xs">
              <span className="text-[#555555] font-mono font-bold text-[9px] uppercase tracking-wide">Custo Total</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[9px] font-bold text-[#555555]">R$</span>
                <span className="text-xl font-black text-[#0A0A0A] font-mono leading-none">
                  {(optimizationResult.totalSheets * sheetCost).toFixed(2)}
                </span>
              </div>
              <span className="text-[9px] text-[#555555] font-mono mt-1">
                Custo: R$ {sheetCost.toFixed(2)} / un
              </span>
            </div>

            <div className="bg-white border border-[#D1D1D1] p-3 rounded-sm flex flex-col justify-between shadow-2xs">
              <span className="text-[#555555] font-mono font-bold text-[9px] uppercase tracking-wide">Custo Unitário</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[9px] font-bold text-[#555555]">R$</span>
                <span className="text-xl font-black text-[#0A0A0A] font-mono leading-none">
                  {unitCost.toFixed(2)}
                </span>
              </div>
              <span className="text-[9px] text-[#555555] font-mono mt-1">
                Total: {totalPlacedUnits} un
              </span>
            </div>
          </div>

          {/* Visual Layout Container */}
          <div className="flex-1 bg-white border border-[#D1D1D1] p-5 rounded-sm flex flex-col shadow-2xs print:border-none print:shadow-none print:p-0">
            
            {/* Sheet selector (Carousel tabs) */}
            {optimizationResult.sheets.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#D1D1D1] pb-4 print:hidden">
                <div className="flex items-center gap-1 bg-[#F5F5F5] p-0.5 border border-[#D1D1D1] rounded-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedSheetIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedSheetIndex === 0}
                    className="p-1.5 hover:bg-white text-[#0A0A0A] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-[10px] font-mono font-bold text-[#0A0A0A] min-w-24 text-center uppercase tracking-wide">
                    Folha {selectedSheetIndex + 1} // {optimizationResult.sheets.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedSheetIndex(prev => Math.min(optimizationResult.sheets.length - 1, prev + 1))}
                    disabled={selectedSheetIndex === optimizationResult.sheets.length - 1}
                    className="p-1.5 hover:bg-white text-[#0A0A0A] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Sheet performance badge & download button */}
                {selectedSheet && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#0A0A0A] bg-[#F5F5F5] border border-[#D1D1D1] px-2.5 py-1 rounded-sm uppercase tracking-wide">
                      Eficiência: {selectedSheet.efficiency.toFixed(1)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExportSVG(selectedSheet)}
                      className="p-1 px-2 hover:bg-[#F5F5F5] border border-[#D1D1D1] rounded-sm text-[#0A0A0A] transition flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wide cursor-pointer"
                      title="Exportar vetorizado SVG"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar SVG
                    </button>
                  </div>
                )}
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16">
                  <Grid className="w-12 h-12 mb-3 opacity-30 text-slate-600" />
                  <p className="text-sm font-semibold">Nenhum resultado gerado.</p>
                  <p className="text-xs text-slate-500 mt-1">Adicione materiais unitários para visualizar o plano de corte otimizado.</p>
                </div>
              )}

              {/* Interactive Rulers & Canvas */}
              {selectedSheet && (
                <div className="relative mt-6 flex flex-col items-center bg-[#F5F5F5] p-6 md:p-8 rounded-sm border border-[#D1D1D1] overflow-hidden print:p-0 print:bg-white">
                  
                  {/* Informational overlays */}
                  <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-[#555555] tracking-wider uppercase flex items-center gap-1.5 print:hidden">
                    <Eye className="w-3.5 h-3.5" />
                    Plano de Corte // {selectedSheet.width}x{selectedSheet.height} mm
                  </div>

                  {/* Legend / Info */}
                  <div className="absolute bottom-2 right-3 text-[9px] font-mono text-[#555555] print:hidden flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-transparent border border-dashed border-red-500 rounded-xs"></span>
                      Margem ({margin}mm)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-[#D1D1D1]"></span>
                      Lâmina ({kerf}mm)
                    </span>
                  </div>

                  {/* The SVG element representing the sheet */}
                  <div className="w-full max-w-lg aspect-3/2 relative drop-shadow-md print:drop-shadow-none">
                    <svg
                      id={`svg-sheet-${selectedSheet.sheetId}`}
                      viewBox={`0 0 ${selectedSheet.width} ${selectedSheet.height}`}
                      className="w-full h-auto bg-white border border-slate-300 rounded-xs print:border-black"
                    >
                      {/* Grid background (10mm squares) */}
                      <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Paper Margin guideline */}
                      {margin > 0 && (
                        <rect
                          x={margin}
                          y={margin}
                          width={selectedSheet.width - 2 * margin}
                          height={selectedSheet.height - 2 * margin}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="0.75"
                          strokeDasharray="3,3"
                          opacity="0.7"
                        />
                      )}

                      {/* Placed Items */}
                      {selectedSheet.placedItems.map((item) => {
                        const isHovered = hoveredItemId === item.id.split('-')[0];
                        return (
                          <g
                            key={item.id}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredItemId(item.id.split('-')[0])}
                            onMouseLeave={() => setHoveredItemId(null)}
                          >
                            {/* Inner Item Rectangle */}
                            <rect
                              x={item.x}
                              y={item.y}
                              width={item.width}
                              height={item.height}
                              fill={item.color}
                              fillOpacity={isHovered ? 0.35 : 0.2}
                              stroke={item.color}
                              strokeWidth={isHovered ? 2 : 1.25}
                              className="transition-all duration-150"
                            />

                            {/* Label Text - display size and rotation status if there is room */}
                            {item.width > 25 && item.height > 12 && (
                              <text
                                x={item.x + item.width / 2}
                                y={item.y + item.height / 2 - 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={Math.min(item.width * 0.09, 8)}
                                fontWeight="700"
                                fill="#0f172a"
                              >
                                {item.name}
                              </text>
                            )}

                            {item.width > 30 && item.height > 20 && (
                              <text
                                x={item.x + item.width / 2}
                                y={item.y + item.height / 2 + 8}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={Math.min(item.width * 0.07, 7)}
                                className="font-mono text-slate-500 opacity-80"
                                fill="#475569"
                              >
                                {item.width}x{item.height} mm {item.rotated ? '↷' : ''}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* Items Summary list on current sheet */}
              {selectedSheet && (
                <div className="mt-5 border-t border-[#D1D1D1] pt-4 print:hidden">
                  <h3 className="text-[10px] font-mono font-bold text-[#555555] uppercase tracking-wide mb-3">
                    Aproveitamento nesta folha:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Unique item count placed on this sheet */}
                    {Object.values(
                      selectedSheet.placedItems.reduce((acc, current) => {
                        const baseId = current.id.split('-')[0];
                        if (!acc[baseId]) {
                          acc[baseId] = {
                            name: current.name,
                            color: current.color,
                            count: 0,
                            w: current.rotated ? current.height : current.width,
                            h: current.rotated ? current.width : current.height,
                          };
                        }
                        acc[baseId].count++;
                        return acc;
                      }, {} as Record<string, { name: string; color: string; count: number; w: number; h: number }>)
                    ).map((grp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-sm border border-[#D1D1D1]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: grp.color }} />
                          <span className="text-[10px] font-bold text-[#0A0A0A] truncate">{grp.name}</span>
                          <span className="text-[9px] text-[#555555] font-mono">({grp.w}x{grp.h}mm)</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-[#F5F5F5] border border-[#D1D1D1] text-[#0A0A0A] px-1.5 py-0.5 rounded-sm">
                          {grp.count} un
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* RIGHT COLUMN: PRODUCTION SEQUENCE & WARNINGS */}
          <section className="flex flex-col gap-6 p-6 overflow-y-auto lg:h-full bg-[#F5F5F5] border-l border-[#D1D1D1] print:hidden">

            {/* UNPLACED ITEMS ALERT */}
            {optimizationResult.unplacedItems.length > 0 && (
              <div className="bg-[#FFF1F2] border border-[#F43F5E] p-4 rounded-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-[#F43F5E] uppercase tracking-wide">
                      Atenção: Itens Não Posicionados
                    </h4>
                    <p className="text-[10px] text-[#555555] mt-1">
                      Algumas peças não couberam nas folhas de origem:
                    </p>
                    <div className="mt-2 flex flex-col gap-1">
                      {optimizationResult.unplacedItems.map(({ item, remainingQty }) => (
                        <div key={item.id} className="flex items-center gap-2 text-[10px] font-mono text-[#0A0A0A]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="font-bold">{item.name}</span>
                          <span>{remainingQty} un ({item.width}x{item.height} mm)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CUTTING STEPS */}
            <div className="bg-white border border-[#D1D1D1] p-4 rounded-sm flex flex-col shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#D1D1D1]">
                <div>
                  <h3 className="text-[10px] font-mono font-bold text-[#0A0A0A] uppercase tracking-wide">
                    [05] Guia de Cortes
                  </h3>
                  <p className="text-[9px] text-[#555555] font-mono">Sequência recomendada para guilhotina.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#F5F5F5] border border-[#D1D1D1] text-[#0A0A0A] px-2 py-0.5 rounded-sm">
                  {cutSteps.length} Passos
                </span>
              </div>

              {selectedSheet ? (
                <div className="space-y-2">
                  {/* Warning on non-guillotine cuts */}
                  {cutType === 'free' && (
                    <div className="bg-[#FEF3C7] border border-[#D97706] text-[#D97706] p-2.5 rounded-sm text-[10px] font-mono flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] flex-shrink-0 mt-0.5" />
                      Corte livre ativado. Não garante guilhotinagem contínua.
                    </div>
                  )}

                  {cutSteps.length === 0 ? (
                    <div className="p-8 text-center bg-[#F5F5F5] rounded-sm border border-dashed border-[#D1D1D1] text-[#555555] text-[10px] font-mono">
                      Nenhum corte necessário ou folha vazia.
                    </div>
                  ) : (
                    <div className="border border-[#D1D1D1] rounded-sm overflow-hidden divide-y divide-[#D1D1D1] font-mono">
                      {cutSteps.map((step, idx) => (
                        <div key={idx} className="p-2.5 bg-white hover:bg-[#F5F5F5] flex items-start gap-2.5 text-[10px] transition">
                          <span className="w-5 h-5 rounded-sm bg-[#0A0A0A] text-white flex items-center justify-center font-bold flex-shrink-0 text-[9px] font-mono">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1 py-0.25 rounded-sm text-[8px] font-bold uppercase tracking-wider border ${
                                step.direction === 'horizontal' 
                                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' 
                                  : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                              }`}>
                                {step.direction === 'horizontal' ? 'HORIZ ↔' : 'VERT ↕'}
                              </span>
                              <span className="font-bold text-[#0A0A0A]">{step.position.toFixed(1)} mm</span>
                            </div>
                            <p className="text-[#555555] text-[9px] mt-1 font-sans leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-[#555555] text-[10px] font-mono">
                  Adicione demandas para visualizar as guias de corte.
                </div>
              )}
            </div>

            {/* ABOUT THE ALGORITHM / METADATA SUMMARY */}
            <div className="bg-white border border-[#D1D1D1] p-4 rounded-sm flex flex-col shadow-2xs">
              <h3 className="text-[10px] font-mono font-bold text-[#0A0A0A] uppercase tracking-wide mb-2">
                [06] Heurística 2D
              </h3>
              <p className="text-[10px] text-[#555555] leading-relaxed">
                Este motor utiliza uma formulação heurística recursiva do problema <strong>Bin Packing 2D</strong>. 
                Os cortes simulados buscam a máxima aproximação do rendimento físico real, 
                garantindo aproveitamento otimizado de materiais e geração rápida de diagramas.
              </p>
            </div>

          </section>
        </main>

      {/* Footer / Credits */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-12 print:hidden text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Calculadora de corte. Layouts vetoriais calculados localmente em tempo real.</p>
          <div className="flex gap-4">
            <span className="italic text-slate-500">por Foite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

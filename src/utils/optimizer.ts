/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockSheet {
  width: number;
  height: number;
  margin: number; // margin on edges (mm)
  kerf: number;   // blade/cut thickness (mm)
}

export interface CutItem {
  id: string;
  name: string;
  width: number;
  height: number;
  quantity: number;
  canRotate: boolean;
  color: string;
  grainSensitive?: boolean; // if true, must respect grain direction if sheet has grain
}

export interface PlacedItem {
  id: string;
  name: string;
  x: number; // relative to sheet top-left, including margin
  y: number; // relative to sheet top-left, including margin
  width: number;
  height: number;
  rotated: boolean;
  color: string;
}

export interface SheetResult {
  sheetId: number;
  width: number;
  height: number;
  placedItems: PlacedItem[];
  usedArea: number;
  totalArea: number;
  efficiency: number; // percentage
}

export interface OptimizationResult {
  sheets: SheetResult[];
  unplacedItems: { item: CutItem; remainingQty: number }[];
  totalSheets: number;
  overallEfficiency: number;
  totalUsedArea: number;
  totalStockArea: number;
  executionTimeMs: number;
}

// A free rectangle representation for packing
interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Packs items using a Guillotine algorithm on a list of sheets.
 * Runs multiple heuristics and returns the best packing result.
 */
export function optimizePaperCutting(
  stock: StockSheet,
  items: CutItem[],
  settings: {
    cutType: 'guillotine' | 'free'; // 'guillotine' = straight cuts, 'free' = maximal rects
    grainDirection: 'none' | 'horizontal' | 'vertical';
    preferredSplit: 'shorter' | 'longer' | 'horizontal' | 'vertical';
  }
): OptimizationResult {
  const startTime = performance.now();

  // Create a deep copy of items and expand them into individual units to pack
  // (We'll pack item by item to support different placements/rotations)
  const itemsToPack: { sourceId: string; item: CutItem; index: number }[] = [];
  items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      itemsToPack.push({
        sourceId: item.id,
        item: { ...item },
        index: i,
      });
    }
  });

  if (itemsToPack.length === 0) {
    return {
      sheets: [],
      unplacedItems: [],
      totalSheets: 0,
      overallEfficiency: 0,
      totalUsedArea: 0,
      totalStockArea: 0,
      executionTimeMs: 0,
    };
  }

  // Define sorting strategies
  const sortingHeuristics: Array<{
    name: string;
    sortFn: (a: typeof itemsToPack[0], b: typeof itemsToPack[0]) => number;
  }> = [
    {
      name: 'Area Descending',
      sortFn: (a, b) => (b.item.width * b.item.height) - (a.item.width * a.item.height),
    },
    {
      name: 'Max Dimension Descending',
      sortFn: (a, b) => Math.max(b.item.width, b.item.height) - Math.max(a.item.width, a.item.height),
    },
    {
      name: 'Perimeter Descending',
      sortFn: (a, b) => (b.item.width + b.item.height) - (a.item.width + a.item.height),
    },
    {
      name: 'Height Descending',
      sortFn: (a, b) => b.item.height - a.item.height,
    },
    {
      name: 'Width Descending',
      sortFn: (a, b) => b.item.width - a.item.width,
    },
  ];

  let bestResult: OptimizationResult | null = null;

  // We try two variants of itemsToPack:
  // 1. Original orientations
  // 2. Pre-rotated orientations (for items that can rotate)
  const variants = [itemsToPack];
  if (items.some(item => item.canRotate)) {
    const itemsToPackRotated: typeof itemsToPack = [];
    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        const newItem = { ...item };
        if (item.canRotate) {
          newItem.width = item.height;
          newItem.height = item.width;
        }
        itemsToPackRotated.push({
          sourceId: item.id,
          item: newItem,
          index: i,
        });
      }
    });
    variants.push(itemsToPackRotated);
  }

  // Run each sorting heuristic and find the best one (fewest sheets, highest efficiency)
  for (const variant of variants) {
    for (const heuristic of sortingHeuristics) {
      // Sort items
      const sortedItems = [...variant].sort(heuristic.sortFn);

      const result = runPacking(stock, sortedItems, settings);

      if (!bestResult) {
        bestResult = result;
      } else {
        // We prefer:
        // 1. More items placed (fewer total remainingQty)
        // 2. Fewer sheets used
        // 3. If same sheets, higher overall efficiency
        const bestRemaining = countRemaining(bestResult.unplacedItems);
        const currentRemaining = countRemaining(result.unplacedItems);

        if (currentRemaining < bestRemaining) {
          bestResult = result;
        } else if (currentRemaining === bestRemaining) {
          if (result.sheets.length < bestResult.sheets.length) {
            bestResult = result;
          } else if (result.sheets.length === bestResult.sheets.length) {
            if (result.overallEfficiency > bestResult.overallEfficiency) {
              bestResult = result;
            }
          }
        }
      }
    }
  }

  const endTime = performance.now();
  if (bestResult) {
    bestResult.executionTimeMs = Math.round(endTime - startTime);
    return bestResult;
  }

  return {
    sheets: [],
    unplacedItems: [],
    totalSheets: 0,
    overallEfficiency: 0,
    totalUsedArea: 0,
    totalStockArea: 0,
    executionTimeMs: Math.round(endTime - startTime),
  };
}

function countRemaining(unplaced: { item: CutItem; remainingQty: number }[]): number {
  return unplaced.reduce((acc, u) => acc + u.remainingQty, 0);
}

/**
 * Runs the packer for a specific ordered list of items.
 */
function runPacking(
  stock: StockSheet,
  itemsToPack: { sourceId: string; item: CutItem; index: number }[],
  settings: {
    cutType: 'guillotine' | 'free';
    grainDirection: 'none' | 'horizontal' | 'vertical';
    preferredSplit: 'shorter' | 'longer' | 'horizontal' | 'vertical';
  }
): OptimizationResult {
  const margin = stock.margin;
  const kerf = stock.kerf;
  const sheetW = stock.width;
  const sheetH = stock.height;

  // The actual printable/cuttable area inside the sheet
  const workW = sheetW - 2 * margin;
  const workH = sheetH - 2 * margin;

  const sheets: SheetResult[] = [];
  const unplacedItemCounts: { [id: string]: { item: CutItem; count: number } } = {};

  // If any item is larger than the working sheet area in both orientations, it is immediately unplaceable
  const placeableItems: typeof itemsToPack = [];
  itemsToPack.forEach((pkg) => {
    const { item } = pkg;
    const canFitNormal = item.width <= workW && item.height <= workH;
    const canFitRotated = item.canRotate && item.height <= workW && item.width <= workH;

    // Check grain alignment restriction
    let normalAllowed = canFitNormal;
    let rotatedAllowed = canFitRotated;

    if (settings.grainDirection !== 'none' && item.grainSensitive) {
      // Paper grain is running in a specific direction (e.g., Vertical or Horizontal)
      // If we need to respect grain (grainSensitive = true), we assume items must be aligned.
      // Usually, grain direction means we want folding lines parallel to grain, or grain aligned with book spine.
      // We will model grain restrictions: if grain is horizontal, item's horizontal dimension (width) should run horizontally.
      // Or we can let the user specify. Let's say grain sensitive items CANNOT rotate if it breaks the alignment.
      // If settings.grainDirection === 'horizontal', item must be placed with its "width" horizontally. So rotation is not allowed!
      if (settings.grainDirection === 'horizontal') {
        rotatedAllowed = false; // Must keep normal
      } else if (settings.grainDirection === 'vertical') {
        // Must align vertical
        // Let's assume normal orientation is correct, rotated is forbidden
        rotatedAllowed = false;
      }
    }

    if (!normalAllowed && !rotatedAllowed) {
      if (!unplacedItemCounts[item.id]) {
        unplacedItemCounts[item.id] = { item, count: 0 };
      }
      unplacedItemCounts[item.id].count++;
    } else {
      placeableItems.push(pkg);
    }
  });

  // Loop to pack placeable items
  let remainingItems = [...placeableItems];

  while (remainingItems.length > 0) {
    const sheetId = sheets.length + 1;
    const placedOnThisSheet: PlacedItem[] = [];

    // Initialize free rectangles for this new sheet
    // We start with one large free rectangle covering the entire working area
    let freeRects: FreeRect[] = [{ x: margin, y: margin, width: workW, height: workH }];

    const stillUnplaced: typeof remainingItems = [];

    for (const pkg of remainingItems) {
      const { item } = pkg;
      let bestRectIndex = -1;
      let rotateItem = false;
      let minWaste = Infinity;

      // Find the best free rectangle to fit this item
      for (let i = 0; i < freeRects.length; i++) {
        const rect = freeRects[i];

        // Check normal fit
        const fitsNormal = item.width <= rect.width && item.height <= rect.height;

        // Check rotated fit (taking into account item ability to rotate and grain constraints)
        let fitsRotated = item.canRotate && item.height <= rect.width && item.width <= rect.height;
        if (settings.grainDirection !== 'none' && item.grainSensitive) {
          fitsRotated = false; // Grain limits rotation
        }

        if (fitsNormal) {
          // Guillotine Best Area Fit (or Best Short Side Fit)
          const waste = rect.width * rect.height - item.width * item.height;
          if (waste < minWaste) {
            minWaste = waste;
            bestRectIndex = i;
            rotateItem = false;
          }
        }

        if (fitsRotated) {
          const waste = rect.width * rect.height - item.height * item.width;
          if (waste < minWaste) {
            minWaste = waste;
            bestRectIndex = i;
            rotateItem = true;
          }
        }
      }

      if (bestRectIndex !== -1) {
        // Place the item!
        const rect = freeRects[bestRectIndex];
        const w = rotateItem ? item.height : item.width;
        const h = rotateItem ? item.width : item.height;

        placedOnThisSheet.push({
          id: `${item.id}-${pkg.index}`,
          name: item.name,
          x: rect.x,
          y: rect.y,
          width: w,
          height: h,
          rotated: rotateItem,
          color: item.color,
        });

        // Split the chosen free rectangle
        // Remove the packed rectangle from freeRects list
        freeRects.splice(bestRectIndex, 1);

        // Generate new free rectangles based on cutting settings
        if (settings.cutType === 'guillotine') {
          // Guillotine Cut splits:
          // We split the chosen free rectangle into 2 new sub-rectangles
          // We decide whether to split horizontally or vertically.
          let splitHorizontally = true;

          const hSplitRightW = rect.width - w - kerf;
          const hSplitTopH = rect.height - h - kerf;

          if (settings.preferredSplit === 'horizontal') {
            splitHorizontally = true;
          } else if (settings.preferredSplit === 'vertical') {
            splitHorizontally = false;
          } else if (settings.preferredSplit === 'shorter') {
            splitHorizontally = hSplitRightW < hSplitTopH;
          } else {
            // 'longer'
            splitHorizontally = hSplitRightW > hSplitTopH;
          }

          if (splitHorizontally) {
            // Split horizontally:
            // 1. Right rectangle: (rect.x + w + kerf, rect.y, rect.width - w - kerf, h)
            if (hSplitRightW > 0 && h > 0) {
              freeRects.push({
                x: rect.x + w + kerf,
                y: rect.y,
                width: hSplitRightW,
                height: h,
              });
            }
            // 2. Top rectangle: (rect.x, rect.y + h + kerf, rect.width, rect.height - h - kerf)
            if (rect.width > 0 && hSplitTopH > 0) {
              freeRects.push({
                x: rect.x,
                y: rect.y + h + kerf,
                width: rect.width,
                height: hSplitTopH,
              });
            }
          } else {
            // Split vertically:
            // 1. Top rectangle: (rect.x, rect.y + h + kerf, w, rect.height - h - kerf)
            if (w > 0 && hSplitTopH > 0) {
              freeRects.push({
                x: rect.x,
                y: rect.y + h + kerf,
                width: w,
                height: hSplitTopH,
              });
            }
            // 2. Right rectangle: (rect.x + w + kerf, rect.y, rect.width - w - kerf, rect.height)
            if (hSplitRightW > 0 && rect.height > 0) {
              freeRects.push({
                x: rect.x + w + kerf,
                y: rect.y,
                width: hSplitRightW,
                height: rect.height,
              });
            }
          }
        } else {
          // 'free' / Maximal Rectangles style:
          // We split the chosen free rectangle into 2 new sub-rectangles, but we also can intersect
          // with other free rectangles if we want true nesting.
          // For a simpler and fast non-overlapping rect packer in browser, we can also use a 2D guillotine
          // but splitting it differently, or keep track of free spaces.
          // Let's do a standard Guillotine split with 'shorter' option for 'free' as it is highly efficient,
          // but we also optimize by choosing splits that maximize the larger remaining area.
          const hSplitRightW = rect.width - w - kerf;
          const hSplitTopH = rect.height - h - kerf;
          const splitHorizontally = hSplitRightW > hSplitTopH;

          if (splitHorizontally) {
            if (hSplitRightW > 0 && h > 0) {
              freeRects.push({ x: rect.x + w + kerf, y: rect.y, width: hSplitRightW, height: h });
            }
            if (rect.width > 0 && hSplitTopH > 0) {
              freeRects.push({ x: rect.x, y: rect.y + h + kerf, width: rect.width, height: hSplitTopH });
            }
          } else {
            if (w > 0 && hSplitTopH > 0) {
              freeRects.push({ x: rect.x, y: rect.y + h + kerf, width: w, height: hSplitTopH });
            }
            if (hSplitRightW > 0 && rect.height > 0) {
              freeRects.push({ x: rect.x + w + kerf, y: rect.y, width: hSplitRightW, height: rect.height });
            }
          }
        }

        // Clean up free rectangles that are too small to be of any use
        // (e.g. width or height <= 0)
        freeRects = freeRects.filter((r) => r.width > 0 && r.height > 0);
      } else {
        // Item couldn't fit on this sheet, save it for the next sheet
        stillUnplaced.push(pkg);
      }
    }

    // Check if we actually placed anything on this sheet to prevent infinite loop
    if (placedOnThisSheet.length === 0) {
      // Nothing could be placed on a fresh sheet!
      // This means remaining placeable items can't fit even on an empty sheet (should be impossible based on pre-filtering, but safety first)
      remainingItems.forEach((pkg) => {
        const { item } = pkg;
        if (!unplacedItemCounts[item.id]) {
          unplacedItemCounts[item.id] = { item, count: 0 };
        }
        unplacedItemCounts[item.id].count++;
      });
      break;
    }

    // Calculate sheet metrics
    const usedArea = placedOnThisSheet.reduce((acc, p) => acc + p.width * p.height, 0);
    const totalArea = sheetW * sheetH;
    const efficiency = (usedArea / totalArea) * 100;

    sheets.push({
      sheetId,
      width: sheetW,
      height: sheetH,
      placedItems: placedOnThisSheet,
      usedArea,
      totalArea,
      efficiency,
    });

    remainingItems = stillUnplaced;

    // Safety brake to prevent browser freeze
    if (sheets.length > 50) {
      // If we are exceeding 50 sheets, push all remaining items to unplaced and break
      remainingItems.forEach((pkg) => {
        const { item } = pkg;
        if (!unplacedItemCounts[item.id]) {
          unplacedItemCounts[item.id] = { item, count: 0 };
        }
        unplacedItemCounts[item.id].count++;
      });
      break;
    }
  }

  // Convert unplaced dict to list
  const unplacedItems = Object.keys(unplacedItemCounts).map((id) => ({
    item: unplacedItemCounts[id].item,
    remainingQty: unplacedItemCounts[id].count,
  }));

  // Overall metrics
  const totalSheets = sheets.length;
  const totalStockArea = totalSheets * sheetW * sheetH;
  const totalUsedArea = sheets.reduce((acc, s) => acc + s.usedArea, 0);
  const overallEfficiency = totalStockArea > 0 ? (totalUsedArea / totalStockArea) * 100 : 0;

  return {
    sheets,
    unplacedItems,
    totalSheets,
    overallEfficiency,
    totalUsedArea,
    totalStockArea,
    executionTimeMs: 0,
  };
}

/**
 * Generates a cutting instruction sequence (step-by-step) for guillotine cuts.
 * This is very helpful to guide users physically on how to cut the paper!
 */
export interface CutStep {
  sheetId: number;
  stepNumber: number;
  direction: 'horizontal' | 'vertical';
  position: number; // Cut coordinate (mm)
  description: string;
}

export function generateCutSteps(sheet: SheetResult, stock: StockSheet): CutStep[] {
  const steps: CutStep[] = [];
  let stepNumber = 1;

  // Let's create an intuitive list of cutting lines
  // A cut line is a line across the sheet from one edge to another.
  // We can extract cut lines from the placed items.
  // To make it simple and practical for the user:
  // Sort items by X, then by Y.
  // For each placed item, suggest cuts along its right edge and bottom edge,
  // relative to the stock margins.
  
  // Since we want simple, actionable cuts:
  // 1. Trim margins (first step of any print shop!)
  if (stock.margin > 0) {
    steps.push({
      sheetId: sheet.sheetId,
      stepNumber: stepNumber++,
      direction: 'horizontal',
      position: stock.margin,
      description: `Refile de Margem Superior: Corte horizontal a ${stock.margin} mm do topo.`,
    });
    steps.push({
      sheetId: sheet.sheetId,
      stepNumber: stepNumber++,
      direction: 'horizontal',
      position: stock.height - stock.margin,
      description: `Refile de Margem Inferior: Corte horizontal a ${stock.height - stock.margin} mm do topo.`,
    });
    steps.push({
      sheetId: sheet.sheetId,
      stepNumber: stepNumber++,
      direction: 'vertical',
      position: stock.margin,
      description: `Refile de Margem Esquerda: Corte vertical a ${stock.margin} mm da lateral esquerda.`,
    });
    steps.push({
      sheetId: sheet.sheetId,
      stepNumber: sheet.sheetId,
      direction: 'vertical',
      position: stock.width - stock.margin,
      description: `Refile de Margem Direita: Corte vertical a ${stock.width - stock.margin} mm da lateral esquerda.`,
    });
  }

  // To prevent overwhelming lists, let's identify unique cut lines where items end
  const verticalCuts = new Set<number>();
  const horizontalCuts = new Set<number>();

  sheet.placedItems.forEach((item) => {
    // Cut at the right edge of item
    const rightEdge = item.x + item.width;
    if (rightEdge < stock.width - stock.margin) {
      verticalCuts.add(rightEdge);
    }
    // Cut at the bottom edge of item
    const bottomEdge = item.y + item.height;
    if (bottomEdge < stock.height - stock.margin) {
      horizontalCuts.add(bottomEdge);
    }
  });

  // Convert to sorted arrays
  const sortedVert = Array.from(verticalCuts).sort((a, b) => a - b);
  const sortedHoriz = Array.from(horizontalCuts).sort((a, b) => a - b);

  sortedHoriz.forEach((pos) => {
    steps.push({
      sheetId: sheet.sheetId,
      stepNumber: stepNumber++,
      direction: 'horizontal',
      position: pos,
      description: `Corte horizontal a ${pos.toFixed(1)} mm da borda superior.`,
    });
  });

  sortedVert.forEach((pos) => {
    steps.push({
      sheetId: sheet.sheetId,
      stepNumber: stepNumber++,
      direction: 'vertical',
      position: pos,
      description: `Corte vertical a ${pos.toFixed(1)} mm da lateral esquerda.`,
    });
  });

  return steps;
}

/**
 * dataProcessor.js — Data analysis, interchangeability metrics, and processing
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/**
 * Consolidate all raw parts from multiple pump files, apply DIN 24296
 * classification, and compute recommended stock quantities.
 *
 * @param {object[]} allParts         - Flat array of raw part objects (from fileHandler).
 * @param {number}   totalPumps       - Total fleet size.
 * @param {boolean}  useDIN24296      - Whether to apply DIN 24296 Table 32 optimization.
 * @returns {object} Categorized results object with summary statistics.
 */
function processAndCategorizeParts(allParts, totalPumps, useDIN24296) {
    const partsMap = new Map();

    /* --- 1. Consolidate duplicate parts (keyed by material number) --- */
    allParts.forEach((part) => {
        const key = part.materialNumber || part.partNo || '';
        if (!key) return; // skip parts with no identifier

        if (partsMap.has(key)) {
            const existing = partsMap.get(key);
            // Keep the higher quantity-per-pump value
            existing.quantityPerPump = Math.max(existing.quantityPerPump, part.quantity);
            existing.sourceFiles.add(part.sourceFile);
            existing.occurrences += 1;
            if (part.pumpModel && !existing.pumpModels.includes(part.pumpModel)) {
                existing.pumpModels.push(part.pumpModel);
            }
            if (part.pumpSerialNo && !existing.serialNos.includes(part.pumpSerialNo)) {
                existing.serialNos.push(part.pumpSerialNo);
            }
        } else {
            partsMap.set(key, {
                ...part,
                quantityPerPump: part.quantity,
                sourceFiles: new Set([part.sourceFile]),
                occurrences: 1,
                pumpModels: part.pumpModel ? [part.pumpModel] : [],
                serialNos: part.pumpSerialNo ? [part.pumpSerialNo] : [],
            });
        }
    });

    /* --- 2. Classify and compute quantities --- */
    const consolidatedParts = Array.from(partsMap.values()).map((part) => {
        const category = categorizePart(part);
        const dinPartType = getDINPartType(part, category);
        const standardQty = part.quantityPerPump * totalPumps;
        let recommendedQty = standardQty;
        let calculation = `Standard: ${part.quantityPerPump} × ${totalPumps} pumps = ${standardQty}`;
        let isInterchangeable = false;

        if (useDIN24296 && part.sourceFiles.size > 1) {
            const din = getDIN24296RecommendedQty(dinPartType, totalPumps, part.quantityPerPump);
            recommendedQty = din.recommendedQty;
            calculation = din.calculation;
            isInterchangeable = true;
        }

        const savings = standardQty - recommendedQty;

        return {
            ...part,
            sourceFiles: Array.from(part.sourceFiles),
            category,
            dinPartType,
            standardQty,
            recommendedQty,
            savings,
            calculation,
            totalWeight: part.weight * recommendedQty,
            isInterchangeable,
            displayModel: part.pumpModels.join(', ') || 'N/A',
            displaySerial: part.serialNos.join(', ') || 'N/A',
            isCommon: part.sourceFiles.size > 1,
        };
    });

    /* --- 3. Partition by category --- */
    return {
        all: consolidatedParts,
        common: consolidatedParts.filter((p) => p.isCommon),
        shafts: consolidatedParts.filter((p) => p.category === 'shafts'),
        impellers: consolidatedParts.filter((p) => p.category === 'impellers'),
        seals: consolidatedParts.filter((p) => p.category === 'seals'),
        bearings: consolidatedParts.filter((p) => p.category === 'bearings'),
        wearParts: consolidatedParts.filter((p) => p.category === 'wear-parts'),
        accessories: consolidatedParts.filter((p) => p.category === 'accessories'),
        totalPumps,
        din24296Enabled: useDIN24296,
        /* pumpList is set by the caller (app.js) after parsing */
        pumpList: [],
    };
}

/**
 * Apply search and category/commonality filters to the analyzed dataset.
 *
 * @param {object}  analyzedData     - Result from processAndCategorizeParts().
 * @param {string}  searchTerm       - Text search query (already lowercased).
 * @param {string}  categoryValue    - Category filter value ('all' or category name).
 * @param {string}  commonalityValue - Commonality filter ('all', 'common', 'interchangeable', 'high-use').
 * @returns {object[]} Filtered array of part objects.
 */
function applyDataFilters(analyzedData, searchTerm, categoryValue, commonalityValue) {
    let dataset;

    if (categoryValue === 'all') {
        dataset = analyzedData.all;
    } else if (categoryValue === 'wear-parts') {
        dataset = analyzedData.wearParts;
    } else {
        dataset = analyzedData[categoryValue] || analyzedData.all;
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        dataset = dataset.filter(
            (part) =>
                (part.partNo        || '').toLowerCase().includes(term) ||
                (part.designation   || '').toLowerCase().includes(term) ||
                (part.materialNumber|| '').toLowerCase().includes(term) ||
                (part.material      || '').toLowerCase().includes(term) ||
                (part.displayModel  || '').toLowerCase().includes(term) ||
                (part.displaySerial || '').toLowerCase().includes(term)
        );
    }

    switch (commonalityValue) {
        case 'common':
            dataset = dataset.filter((p) => p.sourceFiles.length > 1);
            break;
        case 'interchangeable':
            dataset = dataset.filter((p) => p.isInterchangeable);
            break;
        case 'high-use':
            dataset = dataset.filter((p) => p.sourceFiles.length >= 5);
            break;
        default:
            break;
    }

    return dataset;
}

/**
 * Compute summary statistics from the analyzed data.
 *
 * @param {object} analyzedData - Result from processAndCategorizeParts().
 * @returns {object} Statistics object.
 */
function computeStatistics(analyzedData) {
    const { all, common, totalPumps } = analyzedData;

    const totalRecommendedQty = all.reduce((s, p) => s + p.recommendedQty, 0);
    const standardQty         = all.reduce((s, p) => s + p.standardQty,    0);
    const totalWeight         = all.reduce((s, p) => s + p.totalWeight,     0);
    const savings             = standardQty - totalRecommendedQty;
    const savingsPercent      = standardQty > 0 ? savings / standardQty : 0;

    return {
        totalPumps,
        totalParts:          all.length,
        commonParts:         common.length,
        commonPercent:       all.length > 0 ? common.length / all.length : 0,
        totalRecommendedQty,
        totalWeight:         parseFloat(totalWeight.toFixed(2)),
        savings,
        savingsPercent,
        byCategory: {
            shafts:      analyzedData.shafts.length,
            impellers:   analyzedData.impellers.length,
            seals:       analyzedData.seals.length,
            bearings:    analyzedData.bearings.length,
            wearParts:   analyzedData.wearParts.length,
            accessories: analyzedData.accessories.length,
        },
    };
}

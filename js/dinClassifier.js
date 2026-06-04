/**
 * dinClassifier.js — DIN 24296 classification and stock quantity logic
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 *
 * Implements the official DIN 24296 Table 32 lookup for recommended
 * spare-parts stock quantities based on fleet size and part type.
 */

'use strict';

/* ============================================================
   DIN 24296 Table 32 — Official spare-parts quantity lookup
   Array indices map as follows:
     [0] = unused
     [1] = unused
     [2] = 2  pumps
     [3] = 3  pumps
     [4] = 4  pumps
     [5] = 5  pumps
     [6] = 6-7 pumps  (index 6 used for this range in code, mapped to [7])
     [7] = 6-7 pumps  (raw table column)
     [8] = 8-9 pumps
     [9] = percentage multiplier for 10+ pumps
   ============================================================ */
const DIN_24296_TABLE = {
    shaft:            [0, 0, 1, 1, 1, 2, 2, 2, 2, 0.20],
    impeller:         [0, 0, 1, 1, 1, 2, 2, 2, 2, 0.20],
    'bearing-rolling':[0, 0, 1, 1, 2, 2, 2, 3, 3, 0.25],
    'bearing-ball':   [0, 0, 1, 1, 2, 2, 2, 3, 3, 0.25],
    'bearing-roller': [0, 0, 1, 1, 2, 2, 2, 3, 3, 0.25],
    'wear-ring':      [0, 0, 2, 2, 2, 3, 3, 4, 4, 0.50],
    sleeve:           [0, 0, 2, 2, 2, 3, 3, 4, 4, 0.50],
    'seal-mechanical':[0, 0, 1, 1, 2, 2, 2, 3, 3, 0.25],
    'seal-elements':  [0, 0, 4, 6, 8, 8, 9, 12, 12, 1.50],
    'seal-gland':     [0, 0, 4, 4, 6, 6, 6, 8, 8, 1.00],
    coupling:         [0, 0, 1, 1, 2, 2, 3, 4, 4, 0.30],
    gasket:           [0, 0, 4, 6, 8, 8, 9, 12, 12, 1.50],
    'o-ring':         [0, 0, 4, 6, 8, 8, 9, 12, 12, 1.50],
    default:          [0, 0, 1, 1, 1, 2, 2, 2, 2, 0.20],
};

/**
 * Retrieve the recommended spare-parts quantity from DIN 24296 Table 32.
 *
 * @param {string} partType     - Key matching DIN_24296_TABLE (e.g. 'shaft').
 * @param {number} numberOfPumps - Total fleet size (number of pumps).
 * @param {number} qtyPerPump    - Quantity of this part installed per pump.
 * @returns {{ recommendedQty: number, calculation: string }}
 */
function getDIN24296RecommendedQty(partType, numberOfPumps, qtyPerPump) {
    const table = DIN_24296_TABLE[partType] || DIN_24296_TABLE.default;
    let recommendedQty;
    let calculation;

    if (numberOfPumps >= 10) {
        const percentage = table[9];
        recommendedQty = Math.max(1, Math.ceil(numberOfPumps * qtyPerPump * percentage));
        calculation = `Table 32: ${(percentage * 100).toFixed(0)}% × ${numberOfPumps} pumps × ${qtyPerPump} = ${recommendedQty}`;
    } else if (numberOfPumps >= 8) {
        recommendedQty = table[8] * qtyPerPump;
        calculation = `Table 32: ${table[8]} piece(s) for 8–9 pumps × ${qtyPerPump} = ${recommendedQty}`;
    } else if (numberOfPumps >= 6) {
        recommendedQty = table[7] * qtyPerPump;
        calculation = `Table 32: ${table[7]} piece(s) for 6–7 pumps × ${qtyPerPump} = ${recommendedQty}`;
    } else if (numberOfPumps >= 2) {
        recommendedQty = table[numberOfPumps + 1] * qtyPerPump;
        calculation = `Table 32: ${table[numberOfPumps + 1]} piece(s) for ${numberOfPumps} pumps × ${qtyPerPump} = ${recommendedQty}`;
    } else {
        recommendedQty = qtyPerPump;
        calculation = `Single pump: ${qtyPerPump} piece(s)`;
    }

    return {
        recommendedQty: Math.max(1, recommendedQty),
        calculation,
    };
}

/* ============================================================
   Part category classifier
   ============================================================ */

/**
 * Classify a part into one of the standard DIN pump categories.
 *
 * @param {{ designation: string, partNo: string }} part
 * @returns {'shafts'|'impellers'|'seals'|'bearings'|'wear-parts'|'accessories'}
 */
function categorizePart(part) {
    const designation = (part.designation || '').toLowerCase();
    const partNo = (part.partNo || '').toLowerCase();

    if (designation.includes('shaft') && !designation.includes('sleeve')) {
        return 'shafts';
    }
    if (designation.includes('impeller')) {
        return 'impellers';
    }
    if (
        designation.includes('seal') ||
        designation.includes('packing') ||
        partNo.includes('433') ||
        partNo.includes('461')
    ) {
        return 'seals';
    }
    if (
        designation.includes('bearing') ||
        designation.includes('bear ') ||
        partNo.includes('320') ||
        partNo.includes('321') ||
        partNo.includes('322')
    ) {
        return 'bearings';
    }
    if (
        (designation.includes('wear') && designation.includes('ring')) ||
        designation.includes('sleeve')
    ) {
        return 'wear-parts';
    }
    if (
        designation.includes('gasket') ||
        designation.includes('o-ring') ||
        partNo.includes('411') ||
        partNo.includes('412')
    ) {
        return 'seals'; // Gaskets/O-rings treated as sealing elements
    }
    if (designation.includes('coupling')) {
        return 'accessories';
    }
    return 'accessories';
}

/**
 * Map a part to its DIN 24296 Table 32 part-type key.
 *
 * @param {{ designation: string, partNo: string }} part
 * @param {string} category - Result from categorizePart().
 * @returns {string} Key for DIN_24296_TABLE lookup.
 */
function getDINPartType(part, category) {
    const designation = (part.designation || '').toLowerCase();
    const partNo = (part.partNo || '').toLowerCase();

    switch (category) {
        case 'shafts':
            return 'shaft';

        case 'impellers':
            return 'impeller';

        case 'bearings':
            if (designation.includes('rolling') || partNo.includes('320.02')) return 'bearing-rolling';
            if (designation.includes('ball')    || partNo.includes('321'))    return 'bearing-ball';
            if (designation.includes('roller')  || partNo.includes('322'))    return 'bearing-roller';
            return 'bearing-rolling';

        case 'wear-parts':
            if (designation.includes('wear') && designation.includes('ring')) return 'wear-ring';
            if (designation.includes('sleeve') || designation.includes('protect')) return 'sleeve';
            return 'wear-ring';

        case 'seals':
            if (designation.includes('mechanical seal') || partNo.includes('433')) return 'seal-mechanical';
            if (designation.includes('gland') || designation.includes('packing') || partNo.includes('461')) return 'seal-gland';
            if (
                designation.includes('gasket') ||
                designation.includes('o-ring') ||
                partNo.includes('411') ||
                partNo.includes('412') ||
                partNo.includes('99-9')
            ) {
                return 'seal-elements';
            }
            return 'seal-elements';

        default:
            if (designation.includes('coupling')) return 'coupling';
            return 'default';
    }
}

// Harvard Plate v5.0.1 mask path constants and layout anchors.
// These paths use the 1536x1152 canvas coordinate system.
(function(global){
  'use strict';
  const VERSION = 'v5.0.1-asset-polish';
  const CANVAS = Object.freeze({ width:1536, height:1152, viewBox:'0 0 1536 1152' });
  const MASK_PATHS = Object.freeze({
    "plate": "M768 31 m -545 0 a545 545 0 1 0 1090 0 a545 545 0 1 0 -1090 0",
    "leftHalf": "M768 31 A545 545 0 0 0 768 1121 L768 31 Z",
    "vegetables": "M768 48 A528 528 0 0 0 230 1032 C292 862 430 746 604 720 C666 711 718 718 768 742 L768 48 Z",
    "fruits": "M230 1032 C292 862 430 746 604 720 C666 711 718 718 768 742 L768 1120 A528 528 0 0 1 230 1032 Z",
    "wholeGrains": "M784 48 A528 528 0 0 1 1296 520 L784 520 Z",
    "protein": "M784 632 L1296 632 A528 528 0 0 1 784 1120 Z"
});
  const FILL_WINDOWS = Object.freeze({
    "vegetables": {
        "direction": "bottom-up",
        "bounds": {
            "x": 220,
            "y": 48,
            "width": 548,
            "height": 1030
        },
        "clipPath": "hpv5-clip-vegetables"
    },
    "fruits": {
        "direction": "bottom-up",
        "bounds": {
            "x": 230,
            "y": 710,
            "width": 538,
            "height": 410
        },
        "clipPath": "hpv5-clip-fruits"
    },
    "wholeGrains": {
        "direction": "bottom-up",
        "bounds": {
            "x": 784,
            "y": 48,
            "width": 512,
            "height": 472
        },
        "clipPath": "hpv5-clip-whole-grains"
    },
    "protein": {
        "direction": "bottom-up",
        "bounds": {
            "x": 784,
            "y": 632,
            "width": 512,
            "height": 488
        },
        "clipPath": "hpv5-clip-protein"
    }
});
  const LABEL_ANCHORS = Object.freeze({
    "vegetables": {
        "x": 420,
        "y": 360
    },
    "fruits": {
        "x": 460,
        "y": 925
    },
    "wholeGrains": {
        "x": 1055,
        "y": 250
    },
    "protein": {
        "x": 1060,
        "y": 885
    }
});
  const BADGE_ANCHORS = Object.freeze({
    "vegetables": {
        "x": 660,
        "y": 275
    },
    "fruits": {
        "x": 630,
        "y": 960
    },
    "wholeGrains": {
        "x": 1188,
        "y": 132
    },
    "protein": {
        "x": 1190,
        "y": 1012
    }
});
  global.HarvardPlateV5Masks = Object.freeze({ version: VERSION, canvas: CANVAS, paths: MASK_PATHS, fillWindows: FILL_WINDOWS, labelAnchors: LABEL_ANCHORS, badgeAnchors: BADGE_ANCHORS });
})(window);

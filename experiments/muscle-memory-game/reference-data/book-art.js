export const BOOK_ART_PRIMARY = Object.freeze(
[
  {
    "structureId": "serratus-anterior",
    "sourceId": "goldfinger-human-anatomy-artists-1991",
    "kind": "book-art-exact",
    "match": "exact",
    "assetPath": "./assets/reference/books/goldfinger/serratus-anterior.svg",
    "spritePath": "./assets/reference/books/goldfinger/serratus-anterior.svg",
    "spriteColumns": 1,
    "column": 0,
    "aspectRatio": "4 / 5",
    "pdfPage": 84,
    "locator": "PDF стр. 84",
    "titleRu": "Передняя зубчатая мышца",
    "cropPolicy": "artist-drawn-anatomical-fragment",
    "reviewStatus": "manual-reviewed"
  },
  {
    "structureId": "deltoid",
    "sourceId": "goldfinger-human-anatomy-artists-1991",
    "kind": "book-art-exact",
    "match": "exact",
    "assetPath": "./assets/reference/books/goldfinger/deltoid.svg",
    "spritePath": "./assets/reference/books/goldfinger/deltoid.svg",
    "spriteColumns": 1,
    "column": 0,
    "aspectRatio": "4 / 5",
    "pdfPage": 87,
    "locator": "PDF стр. 87",
    "titleRu": "Дельтовидная мышца",
    "cropPolicy": "artist-drawn-anatomical-fragment",
    "reviewStatus": "manual-reviewed"
  },
  {
    "structureId": "supraspinatus",
    "sourceId": "goldfinger-human-anatomy-artists-1991",
    "kind": "book-art-exact",
    "match": "exact",
    "assetPath": "./assets/reference/books/goldfinger/supraspinatus.svg",
    "spritePath": "./assets/reference/books/goldfinger/supraspinatus.svg",
    "spriteColumns": 1,
    "column": 0,
    "aspectRatio": "4 / 5",
    "pdfPage": 89,
    "locator": "PDF стр. 89",
    "titleRu": "Надостная мышца",
    "cropPolicy": "artist-drawn-anatomical-fragment",
    "reviewStatus": "manual-reviewed"
  },
  {
    "structureId": "infraspinatus",
    "sourceId": "goldfinger-human-anatomy-artists-1991",
    "kind": "book-art-exact",
    "match": "exact",
    "assetPath": "./assets/reference/books/goldfinger/infraspinatus.svg",
    "spritePath": "./assets/reference/books/goldfinger/infraspinatus.svg",
    "spriteColumns": 1,
    "column": 0,
    "aspectRatio": "4 / 5",
    "pdfPage": 90,
    "locator": "PDF стр. 90",
    "titleRu": "Подостная мышца",
    "cropPolicy": "artist-drawn-anatomical-fragment",
    "reviewStatus": "manual-reviewed"
  },
  {
    "structureId": "teres-minor",
    "sourceId": "goldfinger-human-anatomy-artists-1991",
    "kind": "book-art-exact",
    "match": "exact",
    "assetPath": "./assets/reference/books/goldfinger/teres-minor.svg",
    "spritePath": "./assets/reference/books/goldfinger/teres-minor.svg",
    "spriteColumns": 1,
    "column": 0,
    "aspectRatio": "4 / 5",
    "pdfPage": 91,
    "locator": "PDF стр. 91",
    "titleRu": "Малая круглая мышца",
    "cropPolicy": "artist-drawn-anatomical-fragment",
    "reviewStatus": "manual-reviewed"
  },
  {
    "structureId": "teres-major",
    "sourceId": "goldfinger-human-anatomy-artists-1991",
    "kind": "book-art-exact",
    "match": "exact",
    "assetPath": "./assets/reference/books/goldfinger/teres-major.svg",
    "spritePath": "./assets/reference/books/goldfinger/teres-major.svg",
    "spriteColumns": 1,
    "column": 0,
    "aspectRatio": "4 / 5",
    "pdfPage": 92,
    "locator": "PDF стр. 92",
    "titleRu": "Большая круглая мышца",
    "cropPolicy": "artist-drawn-anatomical-fragment",
    "reviewStatus": "manual-reviewed"
  }
]
.map((item) => Object.freeze(item))
);

const BOOK_ART_BY_STRUCTURE = new Map(
  BOOK_ART_PRIMARY.map((item) => [item.structureId, item])
);

export function bookArtPrimaryForStructure(structureId) {
  return BOOK_ART_BY_STRUCTURE.get(structureId) || null;
}

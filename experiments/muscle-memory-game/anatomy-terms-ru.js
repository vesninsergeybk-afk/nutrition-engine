import { bodyPartsMuscleNameRu } from "./bodyparts4-muscles-ru.js";

const TERMS = [
  { re: /clavicular part of (right|left) deltoid/i, ru: (m) => `Ключичная часть ${m[1] === "right" ? "правой" : "левой"} дельтовидной мышцы`, latin: "pars clavicularis m. deltoidei", aliases: ["дельтовидная", "дельта", "deltoid"] },
  { re: /acromial part of (right|left) deltoid/i, ru: (m) => `Акромиальная часть ${m[1] === "right" ? "правой" : "левой"} дельтовидной мышцы`, latin: "pars acromialis m. deltoidei", aliases: ["дельтовидная", "дельта", "deltoid"] },
  { re: /spinal part of (right|left) deltoid/i, ru: (m) => `Остистая часть ${m[1] === "right" ? "правой" : "левой"} дельтовидной мышцы`, latin: "pars spinalis m. deltoidei", aliases: ["дельтовидная", "дельта", "deltoid"] },

  { re: /short head of (right|left) biceps brachii/i, ru: (m) => `Короткая головка ${m[1] === "right" ? "правой" : "левой"} двуглавой мышцы плеча`, latin: "caput breve m. bicipitis brachii", aliases: ["бицепс", "двуглавая мышца плеча", "biceps"] },
  { re: /long head of (right|left) biceps brachii/i, ru: (m) => `Длинная головка ${m[1] === "right" ? "правой" : "левой"} двуглавой мышцы плеча`, latin: "caput longum m. bicipitis brachii", aliases: ["бицепс", "двуглавая мышца плеча", "biceps"] },

  { re: /medial head of (right|left) triceps brachii/i, ru: (m) => `Медиальная головка ${m[1] === "right" ? "правой" : "левой"} трёхглавой мышцы плеча`, latin: "caput mediale m. tricipitis brachii", aliases: ["трицепс", "трёхглавая мышца плеча", "triceps"] },
  { re: /lateral head of (right|left) triceps brachii/i, ru: (m) => `Латеральная головка ${m[1] === "right" ? "правой" : "левой"} трёхглавой мышцы плеча`, latin: "caput laterale m. tricipitis brachii", aliases: ["трицепс", "трёхглавая мышца плеча", "triceps"] },
  { re: /long head of (right|left) triceps brachii/i, ru: (m) => `Длинная головка ${m[1] === "right" ? "правой" : "левой"} трёхглавой мышцы плеча`, latin: "caput longum m. tricipitis brachii", aliases: ["трицепс", "трёхглавая мышца плеча", "triceps"] },

  { re: /clavicular part of (right|left) pectoralis major/i, ru: (m) => `Ключичная часть ${m[1] === "right" ? "правой" : "левой"} большой грудной мышцы`, latin: "pars clavicularis m. pectoralis majoris", aliases: ["большая грудная", "грудная мышца", "pectoralis major"] },
  { re: /sternocostal part of (right|left) pectoralis major/i, ru: (m) => `Грудино-рёберная часть ${m[1] === "right" ? "правой" : "левой"} большой грудной мышцы`, latin: "pars sternocostalis m. pectoralis majoris", aliases: ["большая грудная", "грудная мышца", "pectoralis major"] },
  { re: /abdominal part of (right|left) pectoralis major/i, ru: (m) => `Брюшная часть ${m[1] === "right" ? "правой" : "левой"} большой грудной мышцы`, latin: "pars abdominalis m. pectoralis majoris", aliases: ["большая грудная", "грудная мышца", "pectoralis major"] },

  { re: /descending part of (right|left) trapezius/i, ru: (m) => `Нисходящая часть ${m[1] === "right" ? "правой" : "левой"} трапециевидной мышцы`, latin: "pars descendens m. trapezii", aliases: ["трапециевидная", "трапеция", "trapezius"] },
  { re: /transverse part of (right|left) trapezius/i, ru: (m) => `Поперечная часть ${m[1] === "right" ? "правой" : "левой"} трапециевидной мышцы`, latin: "pars transversa m. trapezii", aliases: ["трапециевидная", "трапеция", "trapezius"] },
  { re: /ascending part of (right|left) trapezius/i, ru: (m) => `Восходящая часть ${m[1] === "right" ? "правой" : "левой"} трапециевидной мышцы`, latin: "pars ascendens m. trapezii", aliases: ["трапециевидная", "трапеция", "trapezius"] },

  { re: /(right|left) supraspinatus/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} надостная мышца`, latin: "m. supraspinatus", aliases: ["надостная", "supraspinatus", "ротаторная манжета"] },
  { re: /(right|left) infraspinatus/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} подостная мышца`, latin: "m. infraspinatus", aliases: ["подостная", "infraspinatus", "ротаторная манжета"] },
  { re: /(right|left) subscapularis/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} подлопаточная мышца`, latin: "m. subscapularis", aliases: ["подлопаточная", "subscapularis", "ротаторная манжета"] },
  { re: /(right|left) teres minor/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} малая круглая мышца`, latin: "m. teres minor", aliases: ["малая круглая", "teres minor", "ротаторная манжета"] },
  { re: /(right|left) teres major/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} большая круглая мышца`, latin: "m. teres major", aliases: ["большая круглая", "teres major"] },
  { re: /(right|left) serratus anterior/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} передняя зубчатая мышца`, latin: "m. serratus anterior", aliases: ["передняя зубчатая", "serratus anterior"] },
  { re: /(right|left) rhomboid major/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} большая ромбовидная мышца`, latin: "m. rhomboideus major", aliases: ["большая ромбовидная", "rhomboid major"] },
  { re: /(right|left) rhomboid minor/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} малая ромбовидная мышца`, latin: "m. rhomboideus minor", aliases: ["малая ромбовидная", "rhomboid minor"] },
  { re: /(right|left) levator scapulae/i, ru: (m) => `Мышца, поднимающая ${m[1] === "right" ? "правую" : "левую"} лопатку`, latin: "m. levator scapulae", aliases: ["поднимающая лопатку", "levator scapulae"] },
  { re: /(right|left) coracobrachialis/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} клювовидно-плечевая мышца`, latin: "m. coracobrachialis", aliases: ["клювовидно-плечевая", "coracobrachialis"] },
  { re: /(right|left) latissimus dorsi/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} широчайшая мышца спины`, latin: "m. latissimus dorsi", aliases: ["широчайшая", "latissimus dorsi"] },

  { re: /(right|left) clavicle/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} ключица`, latin: "clavicula", aliases: ["ключица", "clavicle"] },
  { re: /(right|left) scapula/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} лопатка`, latin: "scapula", aliases: ["лопатка", "scapula"] },
  { re: /(right|left) humerus/i, ru: (m) => `${m[1] === "right" ? "Правая" : "Левая"} плечевая кость`, latin: "humerus", aliases: ["плечевая кость", "humerus"] },

  { re: /deltoid/i, ru: () => "Дельтовидная мышца", latin: "m. deltoideus", aliases: ["дельтовидная", "дельта"] },
  { re: /pectoralis.?major/i, ru: () => "Большая грудная мышца", latin: "m. pectoralis major", aliases: ["большая грудная"] },
  { re: /latissimus/i, ru: () => "Широчайшая мышца спины", latin: "m. latissimus dorsi", aliases: ["широчайшая"] },
  { re: /biceps.?brach/i, ru: () => "Двуглавая мышца плеча", latin: "m. biceps brachii", aliases: ["бицепс", "двуглавая"] },
  { re: /triceps.?brach/i, ru: () => "Трёхглавая мышца плеча", latin: "m. triceps brachii", aliases: ["трицепс", "трёхглавая"] },
  { re: /trapezius/i, ru: () => "Трапециевидная мышца", latin: "m. trapezius", aliases: ["трапециевидная", "трапеция"] },
  { re: /supraspinatus/i, ru: () => "Надостная мышца", latin: "m. supraspinatus", aliases: ["надостная"] },
  { re: /infraspinatus/i, ru: () => "Подостная мышца", latin: "m. infraspinatus", aliases: ["подостная"] },
  { re: /subscapularis/i, ru: () => "Подлопаточная мышца", latin: "m. subscapularis", aliases: ["подлопаточная"] },
  { re: /teres.?minor/i, ru: () => "Малая круглая мышца", latin: "m. teres minor", aliases: ["малая круглая"] },
  { re: /teres.?major/i, ru: () => "Большая круглая мышца", latin: "m. teres major", aliases: ["большая круглая"] },
  { re: /serratus.?anterior/i, ru: () => "Передняя зубчатая мышца", latin: "m. serratus anterior", aliases: ["передняя зубчатая"] },
  { re: /rhomboid.*major|rhomboideus.*major/i, ru: () => "Большая ромбовидная мышца", latin: "m. rhomboideus major", aliases: ["большая ромбовидная"] },
  { re: /rhomboid.*minor|rhomboideus.*minor/i, ru: () => "Малая ромбовидная мышца", latin: "m. rhomboideus minor", aliases: ["малая ромбовидная"] },
  { re: /levator.?scapulae/i, ru: () => "Мышца, поднимающая лопатку", latin: "m. levator scapulae", aliases: ["поднимающая лопатку"] },
  { re: /coracobrachialis/i, ru: () => "Клювовидно-плечевая мышца", latin: "m. coracobrachialis", aliases: ["клювовидно-плечевая"] },
  { re: /clavicle|clavicula/i, ru: () => "Ключица", latin: "clavicula", aliases: ["ключица"] },
  { re: /scapula/i, ru: () => "Лопатка", latin: "scapula", aliases: ["лопатка"] },
  { re: /humerus/i, ru: () => "Плечевая кость", latin: "humerus", aliases: ["плечевая кость"] },
];

export function structureTerm(sourceName) {
  const source = String(sourceName || "").trim();
  for (const item of TERMS) {
    const match = source.match(item.re);
    if (!match) continue;
    const nameRu = typeof item.ru === "function" ? item.ru(match) : item.ru;
    return {
      source,
      nameRu,
      latin: item.latin || "",
      aliases: item.aliases || [],
    };
  }
  const muscleNameRu = bodyPartsMuscleNameRu(source);
  if (muscleNameRu) {
    return {
      source,
      nameRu: muscleNameRu,
      latin: "",
      aliases: [source],
    };
  }

  return { source, nameRu: source || "Неизвестная структура", latin: "", aliases: [] };
}

export function structureSearchText(sourceName) {
  const term = structureTerm(sourceName);
  return [term.nameRu, term.latin, term.source, ...term.aliases]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}

import { bodyPartsMuscleNameRu } from "./bodyparts4-muscles-ru.js";

const sideNom = (side) => (side === "right" ? "Правая" : "Левая");
const sideGen = (side) => (side === "right" ? "правой" : "левой");

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

  { re: /(right|left) rectus abdominis/i, ru: (m) => `${sideNom(m[1])} прямая мышца живота`, latin: "m. rectus abdominis", aliases: ["прямая мышца живота", "rectus abdominis"] },
  { re: /(right|left) internal (?:abdominal )?oblique/i, ru: (m) => `${sideNom(m[1])} внутренняя косая мышца живота`, latin: "m. obliquus internus abdominis", aliases: ["внутренняя косая", "internal oblique"] },
  { re: /(right|left) transversus abdominis/i, ru: (m) => `${sideNom(m[1])} поперечная мышца живота`, latin: "m. transversus abdominis", aliases: ["поперечная мышца живота", "transversus abdominis"] },
  { re: /(right|left) pyramidalis/i, ru: (m) => `${sideNom(m[1])} пирамидальная мышца`, latin: "m. pyramidalis", aliases: ["пирамидальная мышца", "pyramidalis"] },
  { re: /(right|left) quadratus lumborum/i, ru: (m) => `${sideNom(m[1])} квадратная мышца поясницы`, latin: "m. quadratus lumborum", aliases: ["квадратная мышца поясницы", "quadratus lumborum"] },
  { re: /(right|left) multifidus/i, ru: (m) => `${sideNom(m[1])} многораздельная мышца`, latin: "m. multifidus", aliases: ["многораздельная мышца", "multifidus"] },
  { re: /(right|left) extensor digitorum brevis/i, ru: (m) => `${sideNom(m[1])} короткий разгибатель пальцев стопы`, latin: "m. extensor digitorum brevis", aliases: ["короткий разгибатель пальцев", "extensor digitorum brevis"] },

  { re: /orbital part of (right|left) orbicularis oculi/i, ru: (m) => `Глазничная часть ${sideGen(m[1])} круговой мышцы глаза`, latin: "pars orbitalis m. orbicularis oculi", aliases: ["круговая мышца глаза", "orbicularis oculi"] },
  { re: /palpebral part of (right|left) orbicularis oculi/i, ru: (m) => `Вековая часть ${sideGen(m[1])} круговой мышцы глаза`, latin: "pars palpebralis m. orbicularis oculi", aliases: ["круговая мышца глаза", "orbicularis oculi"] },
  { re: /(right|left) frontalis/i, ru: (m) => `${sideNom(m[1])} лобная мышца`, latin: "m. frontalis", aliases: ["лобная мышца", "frontalis"] },
  { re: /(right|left) occipitalis/i, ru: (m) => `${sideNom(m[1])} затылочная мышца`, latin: "m. occipitalis", aliases: ["затылочная мышца", "occipitalis"] },
  { re: /(right|left) corrugator supercilii/i, ru: (m) => `${sideNom(m[1])} мышца, сморщивающая бровь`, latin: "m. corrugator supercilii", aliases: ["мышца, сморщивающая бровь", "corrugator supercilii"] },
  { re: /(right|left) levator labii superioris alaeque nasi/i, ru: (m) => `${sideNom(m[1])} мышца, поднимающая верхнюю губу и крыло носа`, latin: "m. levator labii superioris alaeque nasi", aliases: ["поднимающая верхнюю губу и крыло носа"] },
  { re: /(right|left) levator labii superioris/i, ru: (m) => `${sideNom(m[1])} мышца, поднимающая верхнюю губу`, latin: "m. levator labii superioris", aliases: ["поднимающая верхнюю губу"] },
  { re: /(right|left) zygomaticus major/i, ru: (m) => `${sideNom(m[1])} большая скуловая мышца`, latin: "m. zygomaticus major", aliases: ["большая скуловая", "zygomaticus major"] },
  { re: /(right|left) zygomaticus minor/i, ru: (m) => `${sideNom(m[1])} малая скуловая мышца`, latin: "m. zygomaticus minor", aliases: ["малая скуловая", "zygomaticus minor"] },
  { re: /(right|left) depressor labii inferioris/i, ru: (m) => `${sideNom(m[1])} мышца, опускающая нижнюю губу`, latin: "m. depressor labii inferioris", aliases: ["опускающая нижнюю губу"] },
  { re: /(right|left) levator anguli oris/i, ru: (m) => `${sideNom(m[1])} мышца, поднимающая угол рта`, latin: "m. levator anguli oris", aliases: ["поднимающая угол рта"] },
  { re: /(right|left) mentalis/i, ru: (m) => `${sideNom(m[1])} подбородочная мышца`, latin: "m. mentalis", aliases: ["подбородочная мышца", "mentalis"] },
  { re: /(right|left) depressor anguli oris/i, ru: (m) => `${sideNom(m[1])} мышца, опускающая угол рта`, latin: "m. depressor anguli oris", aliases: ["опускающая угол рта"] },
  { re: /(right|left) buccinator/i, ru: (m) => `${sideNom(m[1])} щёчная мышца`, latin: "m. buccinator", aliases: ["щёчная мышца", "buccinator"] },
  { re: /(right|left) risorius/i, ru: (m) => `${sideNom(m[1])} мышца смеха`, latin: "m. risorius", aliases: ["мышца смеха", "risorius"] },
  { re: /superficial part of (right|left) masseter/i, ru: (m) => `Поверхностная часть ${sideGen(m[1])} жевательной мышцы`, latin: "pars superficialis m. masseteris", aliases: ["жевательная мышца", "masseter"] },
  { re: /deep part of (right|left) masseter/i, ru: (m) => `Глубокая часть ${sideGen(m[1])} жевательной мышцы`, latin: "pars profunda m. masseteris", aliases: ["жевательная мышца", "masseter"] },
  { re: /(right|left) temporalis/i, ru: (m) => `${sideNom(m[1])} височная мышца`, latin: "m. temporalis", aliases: ["височная мышца", "temporalis"] },
  { re: /(right|left) medial pterygoid/i, ru: (m) => `${sideNom(m[1])} медиальная крыловидная мышца`, latin: "m. pterygoideus medialis", aliases: ["медиальная крыловидная", "medial pterygoid"] },
  { re: /lower head of (right|left) lateral pterygoid/i, ru: (m) => `Нижняя головка ${sideGen(m[1])} латеральной крыловидной мышцы`, latin: "caput inferius m. pterygoidei lateralis", aliases: ["латеральная крыловидная", "lateral pterygoid"] },
  { re: /upper head of (right|left) lateral pterygoid/i, ru: (m) => `Верхняя головка ${sideGen(m[1])} латеральной крыловидной мышцы`, latin: "caput superius m. pterygoidei lateralis", aliases: ["латеральная крыловидная", "lateral pterygoid"] },
  { re: /(right|left) nasalis/i, ru: (m) => `${sideNom(m[1])} носовая мышца`, latin: "m. nasalis", aliases: ["носовая мышца", "nasalis"] },
  { re: /(right|left) procerus/i, ru: (m) => `${sideNom(m[1])} мышца гордецов`, latin: "m. procerus", aliases: ["мышца гордецов", "procerus"] },
  { re: /(right|left) depressor septi nasi/i, ru: (m) => `${sideNom(m[1])} мышца, опускающая перегородку носа`, latin: "m. depressor septi nasi", aliases: ["опускающая перегородку носа"] },
  { re: /^orbicularis oris$/i, ru: () => "Круговая мышца рта", latin: "m. orbicularis oris", aliases: ["круговая мышца рта", "orbicularis oris"] },

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
  const shortSource = term.source.replace(/\babdominal\b/gi, " ").replace(/\s+/g, " ");
  return [term.nameRu, term.latin, term.source, shortSource, ...term.aliases]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}

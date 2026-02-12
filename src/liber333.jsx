// ═══════════════════════════════════════════════════════════════════
//  LIBER CCCXXXIII — THE BOOK OF LIES — DIGITAL GRIMOIRE
//  A Complete Oracle of Aleister Crowley's masterwork
//  Single-file React JSX Application
// ═══════════════════════════════════════════════════════════════════

import { fetchOracleInterpretation } from './api.js';

import { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";

// ─────────────────────────────────────────────
//  FONT LOADER
// ─────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=JetBrains+Mono:wght@300;400;500;600&display=swap";

// ─────────────────────────────────────────────
//  COMPLETE CHAPTER DATA (94 entries)
// ─────────────────────────────────────────────
const LIBER_333 = [
{
    chapter: -2,
    title: "?",
    text: "?",
    commentary: "The first veil before creation. A single question mark stands as the Soldier of Crowley's essay 'The Soldier and the Hunchback' — the analytical mind, skepticism, the doubt that precedes all gnosis. Before anything can be known, the question must be asked. This is Ain Soph, the Boundless Negative, the interrogation that precedes existence itself. When you draw this chapter, the Oracle tells you: your question IS the answer. Sit with the uncertainty.",
    sephira: "Ain Soph",
    path: "—",
    element: "Void",
    tarot: "—"
  },
  {
    chapter: -1,
    title: "!",
    text: "!",
    commentary: "The second veil. An exclamation mark — the Hunchback, ecstasy, the mystical affirmation that transcends reason. Where '?' doubts, '!' affirms without logic. This is Ain Soph Aur, the Limitless Light that blazes before the first emanation. Together with '?' these two veils represent the eternal oscillation between analysis and rapture, science and mysticism, the inhale and exhale of consciousness. Drawing this chapter means: stop thinking and FEEL. The answer is in the ecstasy, not the analysis.",
    sephira: "Ain Soph Aur",
    path: "—",
    element: "Light",
    tarot: "—"
  },
  {
    chapter: 0,
    title: "ΚΕΦΑΛΗ Η ΟΥΚ ΕΣΤΙ ΚΕΦΑΛΗ",
    text: "Nothing is. Nothing Becomes. Nothing is not. The First and the Last are one. Existence is the Bridal of the pairs of contraries. The Universe is the Practical Joke of the General at the Expense of the Particular.",
    commentary: "The 'Chapter that is not a Chapter' — a complete Qabalistic cosmogony compressed into a single page. It traces the emanation from the three Negative Veils (Nothing is / Nothing Becomes / Nothing is not) through the ten Sephiroth down to the manifest world. Each line corresponds to a stage of creation on the Tree of Life. The chapter number 0 is the Fool, the Ain before Kether, the pregnant void from which all arises. This is the master key to the entire book: everything that follows is an elaboration of this single statement. Nothing contains Everything. The universe is a divine jest.",
    sephira: "Ain",
    path: "∅",
    element: "Spirit",
    tarot: "The Fool"
  },
  {
    chapter: 1,
    title: "THE SABBATH OF THE GOAT",
    text: "Fourfold is He, the Caduceus, the Phallus of Hermes, the carrier of the Winged Disk. His energy is twofold, potential and kinetic, the Night of Pan being the Energy-Loss of the death-Loss. To beget is to die; to die is to beget. Cast the Seed into the Field of Night. Life and Death are two names of A. Kill thyself. Neither of these alone is enough.",
    commentary: "Chapter 1 = Kether, the Crown, the indivisible Unity. The Sabbath of the Goat is the Night of Pan (N.O.X.) — the dissolution of all things into the All. The Goat is Baphomet, the androgyne of the Sabbat, representing the union of opposites at the highest level. 'Kill thyself' is the supreme instruction of the mystic path — the annihilation of the ego-self so that the True Self (Yechidah) may be realized. The paradox: to beget (create) is to die, and to die is to beget. This is the heartbeat of the universe, the eternal oscillation between manifestation and dissolution.",
    sephira: "Kether",
    path: "Aleph",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 2,
    title: "THE CRY OF THE HAWK",
    text: "Hoor hath a secret fourfold name: it is Do What Thou Wilt. Four Words: Naught—One—Many—All. Thou—Child! Thy Name is holy. Thy Kingdom is come. Thy Will is done. Here is the Bread. Here is the Blood. Bring us through Temptation! Deliver us from Good and Evil! That Mine as Thine be the Crown of the Kingdom, even now. ABRAHADABRA.",
    commentary: "A Thelemic Lord's Prayer addressed to Horus. The Hawk is Ra-Hoor-Khuit, Lord of the New Aeon. His fourfold name ('Do What Thou Wilt') maps onto the four Qabalistic worlds: Atziluth (Do), Briah (What), Yetzirah (Thou), Assiah (Wilt). The chapter closes with ABRAHADABRA, the Word of the Aeon, whose eleven letters represent the union of the Pentagram (microcosm) and Hexagram (macrocosm). Note the inversion of the Christian prayer: 'Deliver us from Good AND Evil' — both moral poles are transcended. Chapter 2 = Chokmah, the Supernal Father, Wisdom in its most dynamic, creative aspect.",
    sephira: "Chokmah",
    path: "Beth",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 3,
    title: "THE OYSTER",
    text: "The Brothers of A∴A∴ are one with the Mother of the Child. The Many is as adorable to the One as the One is to the Many. This also is a secret holy and ineffable. The Brothers of A∴A∴ are Women: the Aspirants to A∴A∴ are Men.",
    commentary: "Chapter 3 = Binah, the Supernal Mother, Understanding. The Oyster produces the pearl (wisdom) through irritation — the friction of the world against consciousness produces illumination. The chapter reveals a deep secret: the initiated perspective is feminine, receptive. The Brothers are 'Women' because at the grade of Master of the Temple (Binah), one has crossed the Abyss and become purely receptive to the divine influx. The pearl is the disease of the oyster AND its greatest treasure. So too, wisdom is born from suffering, and the universe (which appears as an imperfection in the void) is simultaneously the supreme achievement of Nothingness.",
    sephira: "Binah",
    path: "Gimel",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 4,
    title: "PEACHES",
    text: "Soft and hollow, how thou dost overcome the hard and full! It dies, it gives itself; to Thee is the fruit! Be thou the Bride; thou shalt be the Mother hereafter. To all impressions thus. Let them not overcome thee; yet let them breed within thee. The least of the impressions, come to its perfection, is Pan. Receive a thousand lovers; thou shalt bear but One Child.",
    commentary: "Chapter 4 = Chesed (Mercy), the organizing principle. The peach is a Chinese symbol of immortality — soft, yielding, yet containing the hard seed of eternal life within. This chapter counsels the aspirant to receive all experiences without resistance (the Taoist principle of Wu Wei), allowing them to fertilize the soul. The 'thousand lovers' are the myriad experiences of life; the 'One Child' is the Magical Child, the True Will realized. The counsel is deeply practical: stop fighting your experiences. Let them flow through you. The fruit of passive reception is stronger than the fruit of active resistance.",
    sephira: "Chesed",
    path: "Daleth",
    element: "Water",
    tarot: "The Empress"
  },
  {
    chapter: 5,
    title: "THE BATTLE OF THE ANTS",
    text: "That is not which is. The only Word is Silence. The only Meaning of that Word is not. Thoughts are false. Fatherhood is unity disguised as duality. Peace implies war. Power implies war. Harmony implies war. Victory implies war. Glory implies war. Foundation implies war. Alas! for the Kingdom wherein all these warring ones are at war.",
    commentary: "Chapter 5 = Geburah (Severity), Mars, the Warrior. An attack on all duality. Even the apparently positive Sephiroth (Mercy, Beauty, Victory) are shown to imply their opposites — and therefore conflict. The 'Battle of the Ants' perfectly captures the human condition: billions of tiny egos warring over nothing, each convinced of the supreme importance of their particular hill. The only escape is Silence — not the silence of suppression, but the Silence that IS (the 'not' which is the true reality behind all apparent 'is'). This chapter strips away all comfortable illusions about spiritual attainment being 'peaceful.'",
    sephira: "Geburah",
    path: "Hé",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 6,
    title: "CAVIAR",
    text: "The Word was uttered: the One exploded into one thousand million worlds. Each world contained a thousand million spheres. Each sphere contained a thousand million planes. Each plane contained a thousand million stars. Of all this the Rationalist knows nothing. But of the Adept it is written: he shall know Nothing. He shall behold nothing. And the Master of the Temple shall have no ear. And the Magus shall have no mouth. And of the Ipsissimus it is written: He is nothing, and knoweth nothing, neither does He hear. Yet is he understood, nor doth he understand.",
    commentary: "Chapter 6 = Tiphareth (Beauty), the Sun, the center of the Tree. Caviar — the most precious food from the most common fish. The chapter describes the great explosion of creation (the Big Bang as Logos) and then maps the grades of attainment against it. Each higher grade is characterized by the LOSS of a faculty: the Adept knows Nothing, the Master has no ear, the Magus has no mouth, the Ipsissimus IS nothing. This is the great paradox of the path: advancement is subtraction, not addition. You do not gain powers; you lose limitations. The Rationalist, who 'knows' everything, actually knows nothing of value. The Ipsissimus, who IS nothing, contains everything.",
    sephira: "Tiphareth",
    path: "Vau",
    element: "Air",
    tarot: "The Hierophant"
  },
  {
    chapter: 7,
    title: "THE DINOSAURS",
    text: "None are They whose number is Six: else were They Six indeed. Seven are These Six that live not. Seven are the Absent Ones. Seven are the Oannes, the Cosmic Sailors on the Sea that is not.",
    commentary: "Chapter 7 = Netzach (Victory), Venus. The 'Dinosaurs' are the great spiritual teachers of humanity — terrifying, awe-inspiring beings who stomped across the earth and then vanished. Crowley lists seven: Lao-tzu, Siddhartha, Krishna, Tahuti, Mosheh, Dionysus, Mohammed — with himself (Perdurabo) as a possible eighth. They are called 'absent' because a true Teacher destroys himself in the teaching. The dinosaur metaphor is deliberately provocative: these are not gentle shepherds but terrible, world-shaking forces. Their number is Six (Tiphareth, the grade of Adept), yet they are Seven because they have descended to Netzach to do their work in the world of desire and nature.",
    sephira: "Netzach",
    path: "Zayin",
    element: "Fire",
    tarot: "The Lovers"
  },
  {
    chapter: 8,
    title: "STEEPED HORSEHAIR",
    text: "Mind is a disease of semen. All that a man is or may be is hidden therein. Bodily functions are parts of the machine; silent, unless in dis-ease. But the mind, never at ease, creaketh 'I.' This I persisteth not, posteth not through generations, changeth momently, finally is dead. Therefore is man only himself when lost in The Charioting.",
    commentary: "Chapter 8 = Hod (Splendor), Mercury, the intellect. The title refers to an old trick of placing horsehair in water to supposedly generate life — a metaphor for the generation of consciousness from base matter. The central teaching is devastatingly direct: Mind is a DISEASE. It is not the crown of creation but a malfunction — a persistent noise that prevents the organism from functioning in silence. The 'I' is not continuous but a flickering illusion. True selfhood is found only in 'The Charioting' — ecstatic union that silences the mental chatter. This is one of the most practically useful chapters for meditation: observe the mind as illness, not identity.",
    sephira: "Hod",
    path: "Cheth",
    element: "Water",
    tarot: "The Chariot"
  },
  {
    chapter: 9,
    title: "THE BRANKS",
    text: "Being an attack upon the eight parts of speech: The Interjection, gasping, is the breath of God. The Pronoun is the name of God. The Noun signifieth the Substance of God. The Adjective qualifieth God. The Verb declareth the work of God. The Adverb qualifieth that work. The Preposition linketh it. The Conjunction bindeth it. Destroy therefore the Eight Parts of Speech; the Ninth is nigh unto Truth. This also must be destroyed before thou enterest into The Silence.",
    commentary: "Chapter 9 = Yesod (Foundation), the Moon. A 'brank' is a medieval torture device clamped over the mouth to enforce silence — a scold's bridle. This chapter systematically attacks every component of language as inadequate to express truth. Each part of speech is traced to God, then shown to be a distortion. Even after destroying all eight parts, the Ninth (whatever remains) must also be destroyed. Only then does one enter The Silence. This is a practical instruction for advanced meditation: trace every thought to its linguistic root, see the inadequacy of the root, and let it dissolve. Language is the final prison.",
    sephira: "Yesod",
    path: "Teth",
    element: "Fire",
    tarot: "Lust"
  },
  {
    chapter: 10,
    title: "WINDLESTRAWS",
    text: "The Abyss of Hallucinations has Law and Reason; but in Truth there is no bond between the Toys of the Gods. This Reason and Law is the Bond of the Great Lie. Truth! Truth! Truth! crieth the Lord of the Abyss of Hallucinations.",
    commentary: "Chapter 10 = Malkuth (Kingdom), Earth, the physical world. Windlestraws are dried grass stalks that spin in the wind — seemingly purposeful but actually random. The entire manifest universe is here identified as 'the Abyss of Hallucinations.' What we call natural law and reason are merely the 'Bond of the Great Lie' — not objective truths but patterns imposed by consciousness on chaos. The irony is exquisite: 'Truth! Truth! Truth!' is cried by the Lord of Hallucinations. This is the final Sephirothic chapter, and it delivers the ultimate verdict on material existence: it is a dream dreaming itself real. Yet the cry of 'Truth!' persists even within the dream.",
    sephira: "Malkuth",
    path: "Yod",
    element: "Earth",
    tarot: "The Hermit"
  },
  {
    chapter: 11,
    title: "THE GLOW-WORM",
    text: "Concerning the Holy Three-in-Naught. Nuit, Hadit, Ra-Hoor-Khuit are only to be understood by the Master of the Temple. They are above Chokmah. For Nuit is Naught (0), Hadit is the complement of Nuit, and Ra-Hoor-Khuit is their child. Also there is Heru-Ra-Ha, the twin warrior lord. What is the meaning of the Twins?",
    commentary: "Chapter 11 = the Path of Aleph, the Fool, Air — connecting Kether to Chokmah. 11 is the supreme number of Magick (the Qliphoth have 11 rather than 10 emanations). The Glow-Worm emits a tiny light in vast darkness — the individual consciousness flickering in the infinite night of Nuit. This chapter introduces the cosmology of Liber AL: Nuit (Infinite Space), Hadit (the Infinitely Small Point), and Ra-Hoor-Khuit (their child, the Crowned and Conquering Child of the New Aeon). These Three sum to Zero — the 'Holy Three-in-Naught.' The chapter piles contradiction upon contradiction deliberately, seeking to induce in the reader a state beyond rational thought.",
    sephira: "Daath",
    path: "Aleph",
    element: "Air",
    tarot: "The Fool"
  },
  {
    chapter: 12,
    title: "THE DRAGON-FLIES",
    text: "IO is the cry of the lower as OI of the higher. In the formula of IO all is joy; for all that exists therein is a necessary part. IO is the ecstasy of the blind vibration; but OI is the reflected consciousness of the joy thereof.",
    commentary: "Chapter 12 = the Path of Beth, Mercury, the Magus — connecting Kether to Binah. Dragon-flies flash iridescent in the sun, each facet of their wings a different color of joy. The chapter meditates on joy as the fundamental reality, distinguishing between IO (the outward cry of ecstasy, the thrust of creative energy) and OI (the inward reflection, consciousness contemplating its own bliss). Every facet of the diamond of joy is itself more joyful than the whole. This is a deeply optimistic chapter: at the root of all existence, beneath the suffering and confusion, is pure unadulterated joy. The dragon-fly does not know why it shimmers; it simply does.",
    sephira: "Kether-Binah",
    path: "Beth",
    element: "Air",
    tarot: "The Magus"
  },
  {
    chapter: 13,
    title: "PILGRIM-TALK",
    text: "There are three stages on the Path. In the first, the Pilgrim is beguiled by a Phantom. He will chase the Phantom over the world, and shall never catch it. In the second, the Pilgrim strides for the stride's sake. In the third, the Pilgrim falls ever faster and faster — and this is called The Path. And thou hast become The Way.",
    commentary: "Chapter 13 = the Path of Gimel, the Moon, the High Priestess — the longest path, crossing the Abyss from Kether to Tiphareth. 13 = Achad (Unity) = Ahebah (Love). The three stages of the spiritual path are universal: first, chasing the goal (the Phantom that can never be caught); second, walking for the walking's sake (effort without attachment to results); third, falling — the surrender of all effort, where the path itself takes over and the Pilgrim IS the Way. This is one of the most practically useful chapters in the book. If you are still chasing, you are in stage one. If you have given up chasing but still walk, you are in stage two. If you are falling, you are close.",
    sephira: "Kether-Tiphareth",
    path: "Gimel",
    element: "Water",
    tarot: "The High Priestess"
  },
  {
    chapter: 14,
    title: "ONION-PEELINGS",
    text: "The Universe is the Practical Joke of the General at the Expense of the Particular, quoth FRATER PERDURABO, and laughed. But those Disciples nearest to him wept, seeing the Universal Sorrow. Those next to them laughed, seeing the Universal Joke. Below these certain Disciples wept. And below these certain laughed. And at the bottom sat one of a surpassing ugliness. Neither did he laugh nor weep. And the Master questioned him, and he answered with a shrug.",
    commentary: "Chapter 14 = the Path of Daleth, Venus, the Empress — connecting Chokmah to Binah. Onion-peelings: reality is layers of illusion, each peeled back to reveal another, tears at every layer. The response to the cosmic joke alternates: laugh, weep, laugh, weep — each layer of understanding produces the opposite reaction to the previous one. But at the center sits the one who neither laughs nor weeps — the one who has peeled all the layers and found Nothing. His shrug is the supreme response: beyond joy, beyond sorrow, beyond the oscillation. The 'surpassing ugliness' is the ego fully seen and accepted — the toad that contains a jewel.",
    sephira: "Chokmah-Binah",
    path: "Daleth",
    element: "Earth",
    tarot: "The Empress"
  },
  {
    chapter: 15,
    title: "THE GUN-BARREL",
    text: "Mighty and erect is this Will of mine, this Pyramid of fire whose summit is lost in Heaven. Upon it have I burned the corpse of my desires. Mighty and erect is this Phallus of my Will. I am not I; I am but an hollow tube to bring down Fire from Heaven.",
    commentary: "Chapter 15 = the Path of Hé, Aries, the Star (per Crowley's Hé-Tzaddi switch). The Gun-Barrel is the Phallus of Will — not a sexual metaphor but a magical one. The magician makes himself a hollow tube (the gun barrel) through which divine fire passes. The key phrase 'I am not I' is the recognition that the individual will is not separate from the universal Will. The corpse of desires is burned on the pyramid — all personal wants consumed so that only the pure vector of True Will remains. This is the formula of the Babe of the Abyss: emptied of self, filled with God. Trump XV (the Devil) in the old system = Pan = All — the gun barrel that channels ALL into focused direction.",
    sephira: "Chokmah-Tiphareth",
    path: "Hé",
    element: "Fire",
    tarot: "The Star"
  },
  {
    chapter: 16,
    title: "THE STAG-BEETLE",
    text: "Death rides the Camel of Initiation. Thou shalt be laid in a coffin of dead wood, and buried in the earth. Love death therefore, and long eagerly for it. Die Daily.",
    commentary: "Chapter 16 = the Path of Vau, Taurus, the Hierophant — connecting Chokmah to Chesed. The Stag-Beetle (Khephra in Egyptian mythology) is the scarab, the midnight form of the Sun God who pushes the solar disk through the underworld. Death here is not morbid but initiatory — the daily practice of ego-death that the mystic undertakes. 'Die Daily' is Paul's instruction to the Corinthians, here given its esoteric meaning: each day, practice the dissolution of the personality. The coffin of dead wood is the body; the earth is Malkuth. Through repeated symbolic death, the aspirant learns that death is merely transformation — the beetle pushing the sun toward a new dawn.",
    sephira: "Chokmah-Chesed",
    path: "Vau",
    element: "Earth",
    tarot: "The Hierophant"
  },
  {
    chapter: 17,
    title: "THE SWAN",
    text: "There is a Swan whose name is Ecstasy: it is MAHASATIPATTHANASATIPATTHANA. In its dance it sings: I am the Lord of Ecstasy, and in my dance I am the Dancer and the Dance. This Swan is the Holy One: he hath no beginning, no end. AUM.",
    commentary: "Chapter 17 = the Path of Zayin, Gemini, the Lovers — connecting Binah to Tiphareth. The Swan (Hamsa in Sanskrit, which reversed is Sa-Ham, 'I am He') is the universal symbol of the liberated soul. MAHASATIPATTHANASATIPATTHANA is a Buddhist term for the practice of mindfulness, here playfully exaggerated. The ecstasy is not passive but a dance — active, creative, self-generating. 'I am the Dancer and the Dance' dissolves the distinction between subject and action. AUM (the threefold vibration) closes the chapter as the Swan's final note. This connects to Parsifal's swan in Wagner: the Pure Fool who through innocence achieves the Grail.",
    sephira: "Binah-Tiphareth",
    path: "Zayin",
    element: "Air",
    tarot: "The Lovers"
  },
  {
    chapter: 18,
    title: "DEWDROPS",
    text: "Adore ye my absence, ye lovers of beauty. In my absence is the bright darkness. Know ye that the Dewdrop slideth into the Shining Sea? Thou art not its master, but the vehicle of It. Adore ye my absence, and rejoice, for this is the Day of my Going, in which I am no more.",
    commentary: "Chapter 18 = the Path of Cheth, Cancer, the Chariot — connecting Binah to Geburah. 18 = Chai (Life) in Hebrew. The dewdrop sliding into the shining sea is one of the most beautiful images in mystical literature — the individual consciousness dissolving into the universal. But note: 'Thou art not its master, but the vehicle of It.' The ego does not control this process; it IS the process. The 'Day of my Going' is the Mystic Death — not physical death but the dissolution of the sense of separate self. The instruction is to ADORE this absence, to rejoice in dissolution. What most people fear most (losing themselves) is here presented as the supreme achievement.",
    sephira: "Binah-Geburah",
    path: "Cheth",
    element: "Water",
    tarot: "The Chariot"
  },
  {
    chapter: 19,
    title: "THE LEOPARD AND THE DEER",
    text: "Resemble all that surroundeth thee; yet be Thyself — and take thy pleasure among the living. This is that which is written — Lurk! Withdraw! Upon thyself! Be every star an Eye upon the Abyss.",
    commentary: "Chapter 19 = the Path of Teth, Leo, Lust — connecting Chesed to Geburah across the middle of the Tree. The Leopard's spots and the Deer's dappling both serve as camouflage — the adept hides in plain sight among ordinary people. This is the doctrine of holy concealment: the true magician does not advertise. 'Resemble all that surroundeth thee; yet be Thyself' is profoundly practical advice. Blend in externally while maintaining internal sovereignty. The instruction to 'Lurk' is not cowardice but strategy — the leopard lurks not from fear but from power. Every star (every true self) should be 'an Eye upon the Abyss' — watching, alert, sovereign, hidden.",
    sephira: "Chesed-Geburah",
    path: "Teth",
    element: "Fire",
    tarot: "Lust"
  },
  {
    chapter: 20,
    title: "SAMSON",
    text: "The Universe is in equilibrium; therefore He that is without it, though his force be but a feather, can overturn the Universe. Be not caught within that web, O child of Freedom! Be not entangled in the universal Lie, O child of Truth!",
    commentary: "Chapter 20 = the Path of Yod, Virgo, the Hermit — connecting Chesed to Tiphareth. Samson's strength came not from his muscles but from his connection to the divine (his hair = his link to Kether). The key insight is from physics: a system in perfect equilibrium can be tipped by the slightest external force. The aspirant who has stepped outside the system (who is 'without' the universe) possesses infinite leverage. Even a feather can overturn the cosmos. This is the secret of all magical practice: you do not need to be strong; you need to be OUTSIDE. Step out of the equilibrium of consensus reality, and even your lightest touch changes everything.",
    sephira: "Chesed-Tiphareth",
    path: "Yod",
    element: "Earth",
    tarot: "The Hermit"
  },
  {
    chapter: 21,
    title: "THE BLIND WEBSTER",
    text: "It is not necessary to understand; it is enough to adore. The god may be of clay: adore him; he becomes GOD. We ignore what created us; we adore what we create. Let us create nothing but GOD! That which causes us to create is our true Father and Mother; we create in Their image; the image is GOD. We can create nothing that is not GOD.",
    commentary: "Chapter 21 = the Path of Kaph, Jupiter, Fortune — connecting Chesed to Netzach. A 'webster' is an archaic word for weaver (as in the surname). The Blind Webster weaves without seeing the pattern — yet the pattern emerges perfectly. This chapter overturns the rationalist demand to 'understand' before worshipping. Adoration itself transforms the object: a clay god becomes GOD through the act of worship. This is not superstition but a deep insight into the nature of consciousness: attention sacralizes whatever it touches. 'We create in Their image; the image is GOD' — everything we create partakes of divinity because the creative impulse itself IS divine. You cannot make anything that is not God.",
    sephira: "Chesed-Netzach",
    path: "Kaph",
    element: "Water",
    tarot: "Fortune"
  },
  {
    chapter: 22,
    title: "THE DESPOT",
    text: "The Aspirant must be utterly devoted to his purpose. He must be on fire with the desire of Truth. He must also be a man of strong passions, since cold-blooded persons seldom achieve either good or evil of any import. It is Pure Chance that rules the Universe; therefore, and only therefore, life is good.",
    commentary: "Chapter 22 = the Path of Lamed, Libra, Adjustment — connecting Geburah to Tiphareth. 22 is the number of Hebrew letters and thus of the paths themselves. The 'Despot' is Pure Chance — the only truly impartial ruler, since any conscious ruler brings personal bias. This chapter makes an argument that would delight both anarchists and mystics: since no human can govern without corruption, the best governor is randomness itself. Applied to the spiritual path: stop trying to control your development. The strongest aspirants are those with the hottest passions (not the coldest disciplines). Fire, not ice, fuels the Great Work. Trust the randomness — it IS the divine order.",
    sephira: "Geburah-Tiphareth",
    path: "Lamed",
    element: "Air",
    tarot: "Adjustment"
  },
  {
    chapter: 23,
    title: "SKIDOO",
    text: "What man is at ease in his Inn? Get out. Wide is the world and cold. Get out. Thou hast become the Way. The Way out is THE WAY. Get out. For OUT is Love and Wisdom and Power. Get OUT. If thou hast T already, first get OU. Then get O. Then get .",
    commentary: "Chapter 23 = the Path of Mem, Water, the Hanged Man — connecting Geburah to Hod. '23 Skidoo' was early 20th century slang for 'get lost!' The chapter makes it a mantra of liberation: GET OUT. Out of your comfort zone, out of your ego, out of your body, out of your mind. The Qabalistic analysis of O-U-T is exquisite: O (Ayin) = the Eye/the Devil/the Yoni; U (Vau) = the Hierophant/the Nail/the Lingam; T (Teth) = the Serpent/Lust. Together they spell the formula of ecstatic union. Then you progressively lose even these: first get OU (lose the serpent), then get O (lose the nail), then get . (lose everything — become the Point, Hadit). The Way OUT is the Way IN.",
    sephira: "Geburah-Hod",
    path: "Mem",
    element: "Water",
    tarot: "The Hanged Man"
  },
  {
    chapter: 24,
    title: "THE HAWK AND THE BLINDWORM",
    text: "The Hawk represents the soaring spiritual ambition. The Blindworm is the materialism that crawls through the mud. But neither can see the other's world. Adepts have praised Silence, yet Silence is but the negative side of Truth; the positive side is beyond even silence.",
    commentary: "Chapter 24 = the Path of Nun, Scorpio, Death — connecting Tiphareth to Netzach. The Hawk (spirit, aspiration) and the Blindworm (matter, the sightless crawler) cannot communicate — they inhabit different dimensions of reality. Language fails at the border between them. This chapter pushes beyond the usual mystical prescription of Silence. Yes, stop talking. But even Silence is merely the negative of Truth — the absence of noise, not the presence of illumination. The positive side of Truth is 'beyond even silence' — a state for which no word, not even the word 'silence,' is adequate. This is the Death card of the Tarot: the transformation that occurs when all categories, including the category of the Uncategorizable, are abandoned.",
    sephira: "Tiphareth-Netzach",
    path: "Nun",
    element: "Water",
    tarot: "Death"
  },
  {
    chapter: 25,
    title: "THE STAR RUBY",
    text: "Facing East, in the centre, draw deep deep deep thy breath, closing thy mouth with thy right forefinger prest against thy lower lip. Then dashing down the hand with a great sweep back and out, expelling forcibly thy breath, cry: APO PANTOS KAKODAIMONOS. Soi Soi IAO!",
    commentary: "Chapter 25 = the Path of Samekh, Sagittarius, Art — connecting Tiphareth to Yesod. 25 = 5² (the Pentagram squared). This is a COMPLETE RITUAL — the official A∴A∴ Banishing Ritual of the Pentagram. Unlike most chapters which are meditative or paradoxical, this is a set of practical instructions. The ritual begins with the Sign of Harpocrates (silence), followed by the Sign of the Enterer (projection of force). Greek words replace the Hebrew of the traditional Lesser Banishing Ritual: Therion (East), Nuit (North), Babalon (West), Hadit (South). The ritual ends with NOX signs and the declaration IO PAN. This is meant to be performed, not merely read. It is the premier daily practice of Thelemic magick.",
    sephira: "Tiphareth-Yesod",
    path: "Samekh",
    element: "Fire",
    tarot: "Art"
  },
  {
    chapter: 26,
    title: "THE ELEPHANT AND THE TORTOISE",
    text: "The world rests upon an Elephant, and that Elephant upon a Tortoise, and that Tortoise upon Nothing. But the Nothing is a lie grafted upon a lie, being the Tetragrammaton, the Demiurge. Accursed be the Demiurge!",
    commentary: "Chapter 26 = the Path of Ayin, Capricorn, the Devil — connecting Tiphareth to Hod. 26 = YHVH (Yod-Hé-Vau-Hé), the Tetragrammaton, the fourfold name of the Demiurge. This chapter is a Gnostic attack on the creator-god of the material world. The Hindu cosmological image (world on elephant on tortoise) is exposed as an infinite regress — each support requires another support, turtles all the way down. At the bottom: Nothing, but a Nothing that is itself a lie. The Demiurge (YHVH) is here 'accursed' — not because creation is evil, but because the illusion that the material world is the REAL world is the root of all suffering. The Devil card = Pan = the material world seen as complete, which is the supreme deception.",
    sephira: "Tiphareth-Hod",
    path: "Ayin",
    element: "Earth",
    tarot: "The Devil"
  },
  {
    chapter: 27,
    title: "THE SORCERER",
    text: "The Sorcerer by his understanding of the laws of Nature achieved his Will; but with all this he was but himself. Alas!",
    commentary: "Chapter 27 = the Path of Pé, Mars, the Tower — connecting Netzach to Hod. This is the reverse of Chapter 15 (the Gun-Barrel). Where the Gun-Barrel empties the self to become a channel for divine force, the Sorcerer uses his knowledge to aggrandize himself — and that is his downfall. 'With all this he was but himself. Alas!' The most devastating condemnation possible: after all your achievements, you are still merely YOU. The Black Brother (the magician who refuses to cross the Abyss) accumulates power, knowledge, and experience, but it all feeds the ego rather than dissolving it. The Tower card shows this collapse: the structure of the false self struck by lightning. The Sorcerer's greatest curse is his own identity.",
    sephira: "Netzach-Hod",
    path: "Pé",
    element: "Fire",
    tarot: "The Tower"
  },
  {
    chapter: 28,
    title: "THE POLE-STAR",
    text: "Love Alway Yieldeth: Love Alway Hardeneth. May be read as an acrostic.",
    commentary: "Chapter 28 = the Path of Tzaddi, Aquarius, the Emperor (per the Hé-Tzaddi switch). 28 = the sum of 1 through 7 (the mystic number of Netzach/Venus). This chapter introduces Laylah (Leila Waddell), Crowley's principal muse and lover, who becomes a central figure for the remainder of the book. The 'Pole-Star' is the fixed point around which the heavens revolve — as Laylah becomes the fixed point around which Crowley's emotional and magical universe revolves. The acrostic of the key phrases spells L-A-Y-L-A-H. Love Alway Yieldeth / Love Alway Hardeneth — the two faces of devotion: the surrender and the crystallization. True love both dissolves and defines.",
    sephira: "Netzach-Yesod",
    path: "Tzaddi",
    element: "Air",
    tarot: "The Emperor"
  },
  {
    chapter: 29,
    title: "THE SOUTHERN CROSS",
    text: "Laylah is Night, and through her is the Night of Pan. The Southern Cross glittereth in the firmament; Laylah is the key of Darkness and of N.O.X.",
    commentary: "Chapter 29 = the Path of Qoph, Pisces, the Moon — connecting Netzach to Malkuth. The Southern Cross is the constellation visible from the southern hemisphere — Laylah (Leila Waddell) was Australian, so this is her personal star. 'Laylah' is Arabic for 'Night' (as in One Thousand and One Nights), and the Night of Pan (N.O.X.) is the mystical darkness that is not the absence of light but the presence of everything simultaneously. The passionate tone is deliberate: the love of a human woman becomes the gateway to the love of the Infinite. Laylah is simultaneously a person and a cosmic principle. This is the alchemical secret: the particular IS the universal, if you love it deeply enough.",
    sephira: "Netzach-Malkuth",
    path: "Qoph",
    element: "Water",
    tarot: "The Moon"
  },,
{
    chapter: 30,
    title: "JOHN-A-DREAMS",
    text: "Dreams are imperfections of sleep; even so is consciousness the imperfection of waking. Dreams are impurities in the circulation of the blood; even so is consciousness a disorder of Life. Dreams are without proportion, without good sense, without truth; so also is consciousness. Awake from dream, the truth is known: awake from waking, the Truth is — The Unknown.",
    commentary: "Chapter 30 = the Path of Resh, the Sun, the Sun card — connecting Hod to Yesod. The chapter sets up a devastating proportion: as dreams are to waking, so waking is to Samadhi. Just as we dismiss dreams as confused and illogical upon waking, so will ordinary consciousness appear confused and illogical once we achieve the next level of awareness. The practical implication is staggering: everything you consider 'real' right now has exactly the same epistemological status as last night's dream. You simply haven't woken up yet. The Unknown (capitalized) is not ignorance but a state beyond the category of knowing — where the knower, the known, and the act of knowing collapse into unity.",
    sephira: "Hod-Yesod",
    path: "Resh",
    element: "Fire",
    tarot: "The Sun"
  },
  {
    chapter: 31,
    title: "THE GAROTTE",
    text: "IT moves from motion into rest, and rests from rest into motion. These IT does alternately throughout eternity. IT is only IT. IT is beyond all conditions: IT affirmeth not. Nor is IT the denial of any affirmation. The garotte is used for the throat; Daath is located in the throat.",
    commentary: "Chapter 31 = the Path of Shin, Fire, the Aeon — connecting Hod to Malkuth. 31 = AL (God) = LA (Not). These two words, identical in letters but reversed in meaning, are the key to the entire chapter. IT is the ultimate reality that transcends the duality of God and Not-God, Being and Non-Being. It moves and rests simultaneously, affirms nothing and denies nothing. The garotte strangles the throat — and Daath (Knowledge, the false Sephira of the Abyss) is located at the throat on the body of Adam Kadmon. To strangle Daath is to kill Knowledge itself, the last barrier to crossing the Abyss. This chapter is a manual for destroying the final illusion: the illusion that there is something to know.",
    sephira: "Hod-Malkuth",
    path: "Shin",
    element: "Fire",
    tarot: "The Aeon"
  },
  {
    chapter: 32,
    title: "THE MOUNTAINEER",
    text: "Consciousness is a symptom of disease. All that moves well moves without will. All skillfulness, all strain, all intention is contrary to ease. Practise a thousand times, and it becomes difficult; a thousand thousand, and it becomes easy; a thousand thousand times a thousand thousand, and it is no longer Thou that doeth it, but IT that doeth itself through thee. Not until then is that which is done well done.",
    commentary: "Chapter 32 = the Path of Tau, Saturn, the Universe — connecting Yesod to Malkuth, the very last path. 32 = Lev (Heart, Mind). This is the final path-chapter and it delivers the ultimate practical instruction: mastery through repetition until the doer disappears. The mountaineer does not think about climbing; the muscles simply climb. Consciousness is here explicitly called 'a symptom of disease' — you are only aware of your heart when it malfunctions. True skill operates below (or beyond) awareness. This applies to mantra yoga, ritual practice, creative work, martial arts, everything. The instruction: do it until you are no longer doing it. When IT does itself through you, the Great Work is accomplished.",
    sephira: "Yesod-Malkuth",
    path: "Tau",
    element: "Earth",
    tarot: "The Universe"
  },
  {
    chapter: 33,
    title: "BAPHOMET",
    text: "Use all means to fortify thyself. Worship me with fire and blood; worship me with swords and with spears. Worship me with incense and with sighs; with wine and all manner of strange drugs. This is the great Mystery of GOD: that which is above is like that which is below, and that which is below is like that which is above.",
    commentary: "Chapter 33 corresponds to the highest degree of Freemasonry and to GL (spring, fountain) in Hebrew. Baphomet — the androgyne idol allegedly worshipped by the Knights Templar — represents the union of ALL opposites: male and female, human and animal, above and below. This is not devil-worship but cosmo-worship: the worship of the complete universe including its shadow side. Jacques de Molay's curse echoes through the centuries. The practical instruction is total embrace: worship with fire AND water, violence AND gentleness, intoxication AND sobriety. Nothing is excluded. The magician who rejects any part of existence rejects God, because 'that which is above is like that which is below.' There is no profane; all is sacred.",
    sephira: "Daath",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 34,
    title: "THE SMOKING DOG",
    text: "Each act of man is the twist and contortion of an agonised worm — love being the most violent spasm. Man thinks he hunteth; but Love and Death are the greyhounds that course him. He that thinketh he is the hunter shall be surprised by Love and caught by Death.",
    commentary: "34 = DL (poor, wretched). Named after the Parisian restaurant Au Chien qui Fume. Beneath the wit lies a profound observation: we believe ourselves to be agents making choices, but we are actually prey being hunted by the two great forces — Love (Eros) and Death (Thanatos). Every act of will is actually a convulsion of a creature being consumed. This is not nihilism but liberation: once you recognize that you are the hunted, not the hunter, you can stop exhausting yourself with the illusion of control and surrender to the chase. The 'smoking dog' is the human ego — a domesticated animal pretending to sophistication while being devoured by forces it cannot see, let alone control.",
    sephira: "Chesed",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 35,
    title: "VENUS OF MILO",
    text: "Life is as ugly and necessary as the female body. Death is as beautiful and necessary as the male body. The Universe is arranged in accordance with the plan of total acceptance — not of virtue, but of necessity.",
    commentary: "35 = AGLA (a divine name used in ritual). The Venus of Milo is armless — beauty mutilated by time, yet more beautiful for its incompleteness. This chapter inverts conventional aesthetics: Life is 'ugly' (messy, biological, uncontrolled) while Death is 'beautiful' (clean, symmetrical, final). Both are 'necessary' — the word recurs as a drumbeat. The doctrine is radical acceptance: not moral approval of all things, but recognition that everything exists because it must. The universe is not arranged for our comfort or according to our ethics but according to necessity. Sacred prostitution (the offering of the body as sacrament) follows from this logic: if the body is necessary, then its use in worship is sacred, not profane.",
    sephira: "Geburah",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 36,
    title: "THE STAR SAPPHIRE",
    text: "Let the Adept perform the Invoking Ritual of the Hexagram. Let him make himself one with the Macrocosm in the manner of a Coitus with the Infinite. Then let him formulate the Hexagram, the interlocking upward and downward triangles, and let him utter the word ARARITA.",
    commentary: "36 = 6² (the Hexagram squared). The mystic number of the Sephira Hod (sum of 1 through 8). This is the second complete RITUAL in the book — the official A∴A∴ Hexagram Ritual, counterpart to the Star Ruby (Chapter 25). Where the Star Ruby banishes with the Pentagram (microcosm), the Star Sapphire invokes with the Hexagram (macrocosm). The word ARARITA encodes the unity of God through seven Hebrew words whose initials spell it out. Crowley later stated this chapter conceals the central secret of the O.T.O. — the use of sexual energy as sacrament. The Hexagram itself (two interlocking triangles) is the visual formula of 'As Above, So Below' — the macrocosm united with the microcosm.",
    sephira: "Hod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 37,
    title: "DRAGONS",
    text: "Thought is the shadow of the eclipse of Luna. Samadhi is the shadow of the eclipse of Sol. Evil is only an appearance — the limitation of the All. In the same way that evil and limitation are exceedingly rare accidents in the whole of the Infinite, so the Universe is Light.",
    commentary: "37 = Yechidah (the highest part of the soul, the True Will). Dragons guard treasure — they are the terrors that surround illumination. This chapter argues that evil is not a positive force but an appearance created by limitation — the way a shadow is created by the obstruction of light. Thought itself is merely the shadow cast when the Moon (Yesod, the ordinary mind) eclipses something brighter. Even Samadhi (mystical union) is described as a shadow — the shadow of the Solar eclipse. The implication: even the highest states we can achieve are still shadows of something more. The Universe IS Light; darkness is merely a local interruption. Evil is cosmically insignificant — not morally, but ontologically. It is exceedingly rare in the infinite context.",
    sephira: "Tiphareth",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 38,
    title: "LAMBSKIN",
    text: "Slay mind. Let the corpse of mind lie unburied on the edge of the Great Sea! Slay thyself. Let the corpse of thyself lie unburied on the edge of the Great Sea! Slay thy Will. Let its corpse lie unburied on the edge of the Great Sea!",
    commentary: "38 = ChZL (vision). A Masonic chapter (the lambskin is the Masonic apron, symbol of innocence and purity). The tripartite slaying is ferocious: first the Mind (rational thought), then the Self (identity), then the Will (even the True Will must eventually be surrendered). Each corpse is left 'unburied on the edge of the Great Sea' — the Sea being Binah, the Supernal Mother, the vast ocean of Understanding that lies beyond the Abyss. The instruction to leave the corpses UNBURIED is significant: don't memorialize what you've killed. Don't build a philosophy out of your ego-death. Just leave it on the shore and walk into the water. This is the most ruthless instruction in the entire book.",
    sephira: "Binah",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 39,
    title: "THE LOOBY",
    text: "It is thinkable that A is not-A; to accept this is the beginning of wisdom. For by forcing the brain to accept contradictions, something new is born within: and this something is beyond the mind. Unreason becomes Experience.",
    commentary: "39 = YHVH AChD (The Lord is One); 3×13 (three times Unity). A 'looby' is a fool, a lout — the Holy Fool who achieves wisdom through apparent stupidity. This chapter is a manual for breaking through rational consciousness. By deliberately forcing the mind to accept that A is not-A (a logical impossibility), you short-circuit the rational faculty and create space for a new mode of cognition. 'Unreason becomes Experience' — not merely irrationality, but a direct experience of reality unmediated by the categories of logic. This is the same technique used in Zen koans (what is the sound of one hand clapping?). The instruction is practical: find a genuine contradiction, hold both sides simultaneously, and wait for the explosion.",
    sephira: "Yesod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 40,
    title: "THE HIMOG",
    text: "A red rose absorbs all colours but red; red is therefore the one colour that it is not. This is a great mystery. It is the mystery of Woman. Distinguish not! But thyself Extinguish in the Whole.",
    commentary: "40 = Mem (Water). The 40 days of the Flood, the 40 years in the wilderness — the number of purification through trial. The 'Himog' contains an optical riddle that is also a metaphysical truth: we know things only by what they REJECT. A red rose is literally everything EXCEPT red — red is the one frequency it cannot absorb, so it reflects it back to us. We define ourselves by what we cannot integrate. The instruction 'Distinguish not!' is the antidote: stop defining things by their boundaries. 'Extinguish in the Whole' — dissolve the distinctions that create the illusion of separateness. This applies directly to self-knowledge: the qualities you most identify with may be the ones you actually LACK, reflecting them outward because you cannot absorb them.",
    sephira: "Malkuth",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 41,
    title: "CORN BEEF HASH",
    text: "Let men seek by experiment, and not by Questionings. Let there be no difference made among you between any one thing and any other thing; for thereby there cometh hurt. But whoso availeth in this, let him be the chief of all!",
    commentary: "41 = AM (Mother, the Barren Mother). A deliberately prosaic title for a chapter about the administration of the A∴A∴. Corn beef hash is cheap, common food — the daily bread of the spiritual life as opposed to its ecstatic peaks. The key instruction is profoundly practical: seek by EXPERIMENT, not by questioning. Don't ask whether meditation works; meditate. Don't debate magical theory; perform rituals. The quote 'Let there be no difference made among you between any one thing and any other thing' is from Liber AL — the instruction to treat all experiences as equally sacred. The chief is not the most learned or the most holy, but the one who actually DOES this — who makes no distinction between washing dishes and performing the Mass of the Phoenix.",
    sephira: "Kether",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 42,
    title: "DUST-DEVILS",
    text: "In the wind of the mind arises the turbulence called I. It breaks; down shower the barren thoughts. All life is choked. This desert of the mind — whirling, whirling, whirling — is without water. But in the still centre of the whirlwind is the Eye of IT. See! five footprints of a Camel! V.V.V.V.V.",
    commentary: "42 = AMA (the unfertilized Supernal Mother); the 42-letter Name of God; 6×7. Dust-devils are whirlwinds in the desert — the mind spinning furiously around nothing. The 'I' is literally a weather phenomenon: a turbulence pattern that arises, persists briefly, and dissipates. The thoughts it generates are 'barren' — they produce nothing real. Yet at the center of every whirlwind is stillness (the Eye of IT). The five footprints of a Camel are the mark of V.V.V.V.V. (Crowley's magical motto as Master of the Temple) — the Camel is Gimel, the path across the Abyss. Someone has crossed this desert before you. Follow the footprints. The practical instruction: when your mind is spinning worst, look for the still center. It is always there.",
    sephira: "Binah",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 43,
    title: "MULBERRY TOPS",
    text: "Black blood upon the altar! Oh, the wind of the mind! The blood is the life of the individual: offer then blood! Now this is not done for the reason that the common beast might suppose. The blood of a thing is its idea.",
    commentary: "43 = GDL (Great). Mulberry tops were used to divine wind direction — and the wind of the mind (Ruach) is what must be sacrificed. The chapter addresses blood sacrifice, but immediately clarifies: 'the blood of a thing is its idea.' This is not about literal blood but about sacrificing your most cherished IDEAS — especially your idea of yourself. Every thought is a living thing with its own 'blood' (vitality, meaning). To sacrifice it is to give up its vitality on the altar of the Great Work. The 'common beast' (the uninitiated) supposes literal blood is meant. The adept knows that the most difficult sacrifice is not of the body but of the mind — to kill a thought you have lived by is harder than to kill a goat.",
    sephira: "Geburah",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 44,
    title: "THE MASS OF THE PHOENIX",
    text: "The Magician, his breast bare, stands before an altar on which are his Burin, Bell, Thurible, and two of the Cakes of Light. In the Sign of the Enterer he reaches West across the Altar, and cries: Hail Ra, that goest in Thy bark into the Caverns of the Dark! He strikes eleven times upon the Bell. He cuts the Cake of Light with the Burin, declaring: This is my body. He puts the first Cake upon the fire of the Thurible: This I burn in the fire. For the name of my house is The House of GOD. DO WHAT THOU WILT SHALL BE THE WHOLE OF THE LAW.",
    commentary: "44 = DM (Blood); the special number of Horus; 4×11. This is the third complete RITUAL in the book — a daily Eucharistic practice for the individual Thelemite. The Magician identifies with the Phoenix (the self-immolating sun-bird), consumes a Cake of Light mixed with his own blood (the 'blood' being the essence of his being), and is thereby reborn. Unlike the Christian Eucharist where the god descends into bread, here the magician IS the god, sacrificing himself TO himself. The Bell is struck eleven times (the number of Magick). The Burin (graving tool) cuts the sign of the Cross upon the breast — the Mark of the Beast (not Satanic but solar). This ritual is designed for daily practice and is the heart of Thelemic devotion.",
    sephira: "Tiphareth",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 45,
    title: "CHINESE MUSIC",
    text: "The Chinese cannot help thinking that the octave has 5 notes. The more one studies the question, the more he is amazed by the fact that the Chinese system of twelve semi-tones and the European system of twelve semi-tones should have developed independently. I slept with Faith, and found a corpse in my arms on awaking; I drank and danced all night with Doubt, and found her a virgin in the morning.",
    commentary: "45 = ADM (Adam); MH (What?); the mystic number of Yesod (sum of 1–9). Chinese Music uses a pentatonic scale where Europeans use seven notes — yet both arrive at twelve semitones. Cultural certainty about what is 'natural' is exposed as arbitrary. The devastating final aphorism is one of Crowley's finest: 'I slept with Faith, and found a corpse in my arms' — certainty kills whatever it embraces. 'I drank and danced all night with Doubt, and found her a virgin in the morning' — honest questioning renews itself perpetually. The practical instruction: never settle into certainty. Faith is necrophilia; Doubt is an eternal virgin. Keep questioning. The five notes and seven notes are both 'right' and both incomplete.",
    sephira: "Yesod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 46,
    title: "BUTTONS AND ROSETTES",
    text: "The cause of sorrow is the desire of the One to the Many, or of the Many to the One. This also is the cause of joy. To will anything but the supreme is the great curse: this even a Master of the Temple should beware of. For if he fall, he shall become a Black Brother.",
    commentary: "46 = AVL (foolish). Buttons are functional; rosettes are decorative. Which do you need? The chapter identifies the root of both sorrow AND joy as the same thing: the desire of Unity for Multiplicity (the One becoming Many — creation, fall, incarnation) and the desire of Multiplicity for Unity (the Many returning to the One — yoga, dissolution, death). This is not pessimistic — the same force that causes suffering causes bliss. The warning about the Black Brother is critical: even a Master of the Temple can fall by willing something less than the Supreme. The Black Brother is the adept who stops short, who builds a personal empire in the Abyss instead of crossing it. Buttons or Rosettes: choose function over decoration.",
    sephira: "Tiphareth",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 47,
    title: "WINDMILL-WORDS",
    text: "Asana destroys the body; Pranayama destroys the breath; Pratyahara destroys the senses; Dharana destroys the mind; Dhyana destroys the ego; Samadhi destroys the soul. And at the end, Homard à la Thermidor destroys the digestion.",
    commentary: "47 = BMVH (high place, altar). The windmill turns endlessly, grinding grain to flour — as yoga practices grind down the layers of consciousness. This chapter provides a systematic map of yogic practice as progressive DESTRUCTION: each technique annihilates one layer of the composite being. Asana (posture) destroys body-consciousness; Pranayama (breath control) destroys the breath; Pratyahara (sense-withdrawal) destroys sensory input; Dharana (concentration) destroys the wandering mind; Dhyana (meditation) destroys the sense of 'I'; Samadhi (union) destroys even the soul. The final line about lobster Thermidor is pure Crowley — deflating the solemnity with a belly-laugh while making a serious point: even after enlightenment, you still need dinner.",
    sephira: "Hod",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 48,
    title: "MOME RATHS",
    text: "Neglect not the dawn-meditation! Early to bed and early to rise: these are the customs of a beast, not of a man. But a man must not neglect the dawn-meditation.",
    commentary: "48 = KVKB (Star, Mercury); MVCH (brain). The title is from Lewis Carroll's Jabberwocky ('And the mome raths outgrabe'). 'Rathe' is Old English for 'early' — so 'mome raths' are literally 'early risers who are silent.' The chapter advocates dawn meditation with a characteristically Crowleyan twist: the early-to-bed-early-to-rise proverb is dismissed as bestial routine, yet the dawn meditation itself is vital. The distinction: animals wake early from instinct; the magician wakes early from Will. The dawn (the transition between darkness and light) is the most powerful liminal moment of the day — a natural threshold between states of consciousness. The instruction is simple but transformative: establish a daily practice at dawn. Everything follows from this.",
    sephira: "Hod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 49,
    title: "WARATAH-BLOSSOMS",
    text: "Seven are the veils of the dancing-girl in the harem of IT. Seven are the names, and seven are the lamps beside Her bed. Seven eunuchs guard Her with drawn swords; No man may come nigh unto Her. In Her coils there is bliss; in Her undulations there is death. Her number is an Hundred and Fifty and Six. BABALON.",
    commentary: "49 = 7² (the feminine number squared). The Waratah is an Australian crimson flower — again linking to Laylah. Seven veils, seven names, seven lamps, seven guardians: the number of Venus (Netzach) multiplied through every aspect of the divine feminine. The dancing-girl is BABALON (156), the Thelemic goddess of sacred sexuality, the Scarlet Woman who rides the Beast. She is simultaneously terrifying (seven eunuchs with drawn swords) and ecstatic (in Her coils there is bliss). No man may approach Her through force or cleverness — only through surrender. Her 'undulations' bring both ecstasy and ego-death simultaneously. The Waratah blooms blood-red in the wilderness: beauty flourishing in the harshest conditions, protected by its own thorns.",
    sephira: "Netzach",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 50,
    title: "THE VIGIL OF ST. HUBERT",
    text: "GOD met a Stag-beetle and said: 'I am God.' The Stag-beetle said: 'You are a Stag-beetle — for I am GOD.' GOD was a little surprised, but took a look at Himself. He saw that He WAS a Stag-beetle. 'It seems to be true,' He said. Neither of them knew anything. But THAT was good.",
    commentary: "50 = KL (All, Everything); the 50 Gates of Binah; Nun final = 50. St. Hubert is the patron saint of hunters who was converted by a vision of a crucifix between a stag's antlers. The fable is deceptively simple: God and the Stag-beetle each claim to be God, and both are right. God discovers He IS the beetle. The beetle was always God. But neither KNOWS anything — knowledge would destroy the comedy. 'THAT was good' echoes Genesis ('And God saw that it was good'), but here applied to mutual ignorance. This is the doctrine of pantheism taken to its absurd conclusion: if God is everything, then God is also a beetle arguing with Himself. The wisdom is in the laughter, not the logic.",
    sephira: "Binah",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 51,
    title: "TERRIER-WORK",
    text: "Doubt. Doubt thyself. Doubt even if thou doubtest thyself. Doubt all. Doubt even if thou doubtest all. It seems sometimes as if beneath all conscious doubt there lay some deepest certainty. O kill it! Slay the snake! The horn of the Doubt-Loss ceaseth. Thou art passed through the Gate; thou art free!",
    commentary: "51 = AN (pain, where? failure); NA (beauty). Fox-hunting provides the metaphor: the terrier goes underground after the fox, into dark burrows where the larger hounds cannot follow. So must doubt pursue THAT through every tunnel of the mind, including the tunnel of doubt itself. The crucial instruction: even the feeling of 'deepest certainty' that lurks beneath all questioning must be killed. This is more radical than Descartes (who stopped at 'I think, therefore I am'). Crowley demands: doubt even THAT. Kill the snake of certainty wherever it hides. Only when absolutely everything has been doubted — including the doubter — do you pass through the Gate. Paradoxically, this total destruction of certainty IS freedom. You don't find truth by believing; you find it by disbelieving everything until nothing remains.",
    sephira: "Daath",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 52,
    title: "THE BULL-BAITING",
    text: "Fourscore and eleven books wrote I; in each did I expound the great Work of Magick. And now cometh one and saith: Master, explain this. I explain nothing. Who am I that I should rob a starving dog of his bone?",
    commentary: "52 = BN (Son), the Son-Redeemer (Osiris-Apis); AYMA (fertile Supernal Mother); 4×13. The bull-baiting image is deliberate cruelty: the student (bull) is tormented by the teacher (dogs) not out of malice but because the bull must discover its own strength. Crowley expresses genuine frustration: he has written 91 books expounding the Work (a real count of his published corpus at that point), yet students still demand personal explanation instead of doing the Work themselves. 'Who am I that I should rob a starving dog of his bone?' — the student's struggle IS the teaching. To explain would be to steal the very experience of discovery. This is the eternal teacher's dilemma: the answer cannot be given, only earned. Every spiritual teacher who explains too much robs the student of the transformation that comes from finding out for yourself.",
    sephira: "Binah",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 53,
    title: "THE DOWSER",
    text: "Across the meadow, and through the orchard, and in the paddock — there is a SPRING. What spring? First, a spring of water. Second, a spring of steel. Third, a spring of the year. But in the True Spring are all these contained.",
    commentary: "53 = ABN (Stone) = AB (Father, 3) + BN (Son, 52); GN (Garden of Eden). The dowser divines hidden water with a rod — finding the invisible spring beneath the surface. The three meanings of 'spring' are unpacked: water (sustenance, life, the unconscious), steel (tension, potential energy, the stored force ready to be released), and the season (renewal, rebirth, the eternal return). All three are contained in the True Spring, which is the Self — the hidden source from which all sustenance, energy, and renewal flow. The Stone (ABN) that the dowser seeks is the Philosopher's Stone, and it is literally composed of the Father (AB) and the Son (BN) united. The Garden of Eden (GN) is where the spring is found — paradise is not lost but merely hidden beneath the surface of ordinary consciousness.",
    sephira: "Tiphareth",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 54,
    title: "EAVES-DROPPINGS",
    text: "Within the Sacred Porch the Apprentice cries: Master, what is the Word? The Master answers: the WORD is LOVE. But the WORD of the LAW is THELEMA.",
    commentary: "54 = MTH (rod, staff, tribe); DN (to judge); 6×9. A Masonic chapter in which initiates of various degrees overhear fragments of the Lost Word. The Apprentice, Fellow-Craft, and Master Mason each has a partial truth, but none possesses the complete Word. The resolution: the Word is LOVE (= 111 in Greek). But this is immediately complicated: the Word of the LAW is THELEMA (Will). Love and Will are not opposed but identical — in Greek gematria, both Thelema and Agape equal 93. The eaves-dropper hears only fragments because truth cannot be communicated whole; it must be assembled from partial transmissions. Each grade of initiation provides a different fragment. Only when all the pieces are assembled (Love = Will = 93) does the complete Word emerge.",
    sephira: "Chokmah",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 55,
    title: "THE DROOPING SUNFLOWER",
    text: "For Laylah hath taken me away from mine habitation. She hath seduced me from my comfortable dwelling and from my friends. She hath led me into the wilderness, and I am lost. Yet being lost, I am found.",
    commentary: "55 = KLH (Bride, a title of Malkuth); the mystic number of Malkuth (sum of 1–10); 5×11. The sunflower that droops has turned away from the sun — the aspirant who is consumed by personal love (for Laylah) and has thereby lost connection to the solar principle (Tiphareth). This is a chapter of genuine anguish: the magician admits that his love for a human woman has derailed his spiritual practice. Yet the final line redeems everything: 'being lost, I am found.' The very distraction that seems to destroy the Work IS the Work. The Bride (KLH = Malkuth, the physical world) is where the spirit must descend to complete the circuit. You cannot achieve the Great Work by rejecting incarnate love. The sunflower droops not from weakness but because the sun is now below — in matter, in the beloved, in the body.",
    sephira: "Malkuth",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 56,
    title: "TROUBLE WITH TWINS",
    text: "Holy, Holy, Holy are these Truths that I utter, knowing them to be but falsehoods, broken mirrors, troubled waters; hide me, O our Lady, in Thy Womb! For all that I say is but the clatter of teeth. Who knoweth which is Perdurabo and which is Crowley?",
    commentary: "56 = YVM (Day); NVH (comely, beautiful); 7×8. The 'Twins' are Crowley's two identities: Aleister Crowley (the man) and Frater Perdurabo (the magician). Neither knows which is the 'real' one. This split identity is not pathological but initiatory — every serious practitioner eventually confronts the question: who am I when I am not performing the Work? And who am I when I am? The confession that all his 'Truths' are 'falsehoods, broken mirrors, troubled waters' is the most honest statement in the book. It validates the title: this IS the Book of Lies, and the author knows it. Yet within the lies, truth hides — as a reflection in a broken mirror is still a reflection. 'Hide me in Thy Womb' — the return to the Great Mother, the only honest refuge from the impossibility of self-knowledge.",
    sephira: "Tiphareth",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 57,
    title: "THE DUCK-BILLED PLATYPUS",
    text: "Dirt is matter in the wrong place. Thought is mind in the wrong place. Matter is mind in the wrong place. There is no Dirt; there is no Matter; there is no Mind. Rejoice! for the Wedding of the Rosy Cross is consummated.",
    commentary: "57 = AVN (strength; also iniquity, sorrow); 3×19. The Duck-billed Platypus defies all categories — mammal that lays eggs, has a bill, is venomous — and thereby reveals the absurdity of categorization itself. 'Dirt is matter in the wrong place' is a quote from Lord Palmerston, but Crowley extends it: if dirt is just misplaced matter, and thought is just misplaced mind, then the categories themselves are the problem. Remove the concept of 'wrong place' and there is no dirt, no matter, no mind — just WHAT IS, uncategorized and free. The Wedding of the Rosy Cross (the union of the Rose/feminine with the Cross/masculine) is consummated precisely when all categories dissolve. The platypus IS the philosopher's stone: proof that nature refuses our neat classifications.",
    sephira: "Netzach",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 58,
    title: "HAGGAI-HOWLINGS",
    text: "Haggard am I, an hyæna; I hunger and howl. I am the mad dog that runneth against the world. Ah, the sublime tragedy and comedy of THE GREAT WORK! But behind me, always, is the still small voice that saith: But the WORK must be accomplished. And it SHALL be accomplished.",
    commentary: "58 = ChN (Grace, beauty, favor). Named for the Old Testament prophet Haggai who howled for the rebuilding of the Temple. This chapter captures the emotional reality of the spiritual path as no sanitized account ever could. The aspirant is not serene; he is haggard, hungry, howling like a hyena, running mad against the world. The Great Work is simultaneously tragedy AND comedy — never one without the other. Yet behind all the howling is 'the still small voice' (an echo of Elijah's theophany on Mount Horeb) — the quiet certainty that persists beneath the storm. The chapter affirms what every serious practitioner knows: the Work is not pretty, not peaceful, not graceful. It is a howl in the wilderness. And it SHALL be accomplished.",
    sephira: "Netzach",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 59,
    title: "THE TAILLESS MONKEY",
    text: "Were I a Christian, I should say 'A poor worm.' Were I a Hindu, I should say 'Neti, neti.' Were I a Buddhist, I should say 'The chain of dependent origination.' Were I rich, I should say 'This is right.' Were I poor, I should say 'This is wrong.' Were I a philosopher, I should know nothing of any of these things. Therefore I am a philosopher.",
    commentary: "59 = a prime number. The 'tailless monkey' is humanity — the primate that lost its tail and gained delusions of grandeur. One's philosophy depends entirely on one's circumstances: the rich justify the status quo, the poor condemn it, the Christian grovels, the Hindu negates, the Buddhist analyzes. None of these is 'true'; each is merely the noise made by a particular configuration of matter. The philosopher who 'knows nothing of any of these things' has achieved the only honest position: recognizing that every worldview is a function of its holder's conditions, not of reality itself. The tailless monkey chatters endlessly about truth while hanging from a branch of circumstance. The instruction: examine which branch you're hanging from before you preach.",
    sephira: "Yesod",
    path: "—",
    element: "Earth",
    tarot: "—"
  },,
{
    chapter: 60,
    title: "THE WOUND OF AMFORTAS",
    text: "Only the Spear that dealt the Wound can heal it. Only the Pure Fool can wield the Spear. There is a castle hidden in the mountains. The Spear is the Will. The wound is the consciousness of Imperfection. The Pure Fool is he who knows not what he does.",
    commentary: "60 = Samekh (Prop, Support); KLY (vessel). Named for the Fisher King of the Grail legend whose wound will not heal. The wound of Amfortas is self-consciousness — the awareness of one's own imperfection, which festers endlessly because examining it only makes it worse. Only the Pure Fool (Parsifal/the Fool card) can heal it, because the Fool acts without self-awareness. The spear that wounded is the same spear that heals: the Will that created the ego can destroy it, but only when wielded unconsciously. This chapter attacks spiritual self-improvement as itself the disease: the more you try to fix yourself, the deeper the wound. Stop trying. Act from innocence. The Pure Fool does not know what he does — and that unknowing IS the cure.",
    sephira: "Tiphareth",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 61,
    title: "THE FOOL'S KNOT",
    text: "The Magus taketh the Wand of Double Power and maketh therewith the Twelve Banishings, and the Thirteen Invocations. And P is the Eye of Shiva, that opening destroyeth the Universe.",
    commentary: "61 = AYN (Nothing, Ain!) = ANY (I). The staggering coincidence: Nothing and I have the same numerical value. The ego (I, ANY) and the Void (Nothing, AYN) are the same thing — identical in essence, opposite in appearance. The Fool's Knot is a knot that looks complex but falls apart when pulled — like the ego, which seems substantial until examined closely. P (Pé, the Eye) = the Eye of Shiva, whose opening destroys the universe. This is not metaphor: the moment consciousness truly sees itself, the entire construct of reality collapses. The twelve banishings and thirteen invocations together = 25 (the Star Ruby, Chapter 25). Crowley notes this chapter was written 'in about a minute and a half' — the speed itself being a teaching about the Fool's spontaneity.",
    sephira: "Kether",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 62,
    title: "TWIG?",
    text: "Twig? Dost thou understand? The Bell: the sound thereof is the keynote of the Magician. The Fire: the light thereof is the illumination. The Knife: the touch thereof is the pang of death. The two Cakes: the taste and smell thereof is the feast of the Magician. Twig?",
    commentary: "62 = BKVRA (firstborn daughter); 2×31 (twice AL/LA). 'Twig?' is Victorian slang for 'Do you get it?' This chapter is a prose commentary on Chapter 44 (the Mass of the Phoenix), explaining the correspondence between the ritual implements and the five senses: Bell = hearing, Fire = sight, Knife = touch, two Cakes = taste and smell. Together, the ritual engages ALL five senses in sacramental action — nothing is left profane. The repeated 'Twig?' is both a question to the reader and a play on the word: a twig is a small branch, a fragment of the Tree (of Life). Do you understand? Do you grasp even this small branch? The insistence suggests most readers will NOT understand, despite the explanation being perfectly clear.",
    sephira: "Hod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 63,
    title: "MARGERY DAW",
    text: "I love LAYLAH. I lack LAYLAH. Where is LAYLAH? Give me a heap of straw in a hut, and LAYLAH naked — what more can a man desire? No, not even a heap of straw. No, not even a hut.",
    commentary: "63 = ChNH (grace, camp); 7×9 (Netzach × Yesod). From the nursery rhyme 'See-Saw, Margery Daw' — the oscillation between desire and lack. The chapter strips away everything until only the beloved remains. First all material luxury is rejected in favor of a straw hut with Laylah. Then even the straw is rejected. Then even the hut. The progression is ruthless: love does not need a setting, a context, a bed, a roof. It needs only the beloved. This is bhakti yoga (the yoga of devotion) expressed through erotic longing. Crowley identifies Laylah simultaneously with Nuit (the Infinite) and with the physical woman Leila Waddell. The two are not separate. To love a person completely IS to love the Infinite — because the person, fully seen, IS infinite.",
    sephira: "Netzach",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 64,
    title: "CONSTANCY",
    text: "I am not a constant man; the world shifts and I shift with it. Yet this one thing is constant: my inconstancy. And that constancy is LOVE.",
    commentary: "64 = DYN (Judgment); NVGH (Venus, Netzach); 8² (Hod squared). The title is ironic: the chapter is about INconstancy. A comic poem about dining at Lapérouse while longing for Laylah, veering between philosophical profundity and requests for wine. The moral is genuine despite the comedy: the only constant thing about the narrator is his inconstancy. But inconstancy itself, being constant, partakes of the Absolute. And beneath the changing surface, the love for Laylah persists. This is a deep teaching disguised as light verse: you do not need to be 'spiritually consistent' to be on the path. Your very inconsistency, if honestly observed, reveals the one thing that DOES persist — and that persistent thing is your True Will, wearing the mask of love.",
    sephira: "Netzach",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 65,
    title: "SIC TRANSEAT—",
    text: "Sic transeat — . So may he pass away. There arose a great Urn of violet flame, and in the violet flame a white lily blossom. And the disciples that watched found a dead body kneeling at the altar. Amen!",
    commentary: "65 = ADNY (Adonai, the Holy Guardian Angel); HS (Silence!); HYKL (Temple); 5×13. 'Sic transeat' = 'So may he pass' — the blank is filled by NEMO (Nobody), the title of a Master of the Temple who has annihilated his identity. This is one of the most luminous chapters: a mystical vision of violet flames, a white-gold lily, and the discovery that the body kneeling at the altar is dead — the worshipper has passed beyond during the act of worship. The number 65 = Adonai = the Holy Guardian Angel, the personal divine presence. The chapter describes the attainment of Knowledge and Conversation of the HGA — the central goal of all Thelemic magic. The body continues to kneel even after the soul has departed. The disciples see death; the Master experiences liberation.",
    sephira: "Tiphareth",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 66,
    title: "THE PRAYING MANTIS",
    text: "The Great Work is the uniting of opposites. It may mean the uniting of the soul with God, of the microcosm with the macrocosm, of the female with the male, of the ego with the non-ego. But in every case it must be the annihilation of the weaker by absorption into the stronger.",
    commentary: "66 = the mystic number of the Qliphoth (sum of 1–11); 6×11. The Praying Mantis — the female devours the male during mating. A perfect image for the Great Work: union that involves annihilation. This chapter delivers the simplest and most comprehensive definition of the Great Work in all of Crowley's writings: the uniting of opposites. ANY two opposites. Soul/God, micro/macro, female/male, ego/non-ego. But the crucial clause: 'the annihilation of the weaker by absorption into the stronger.' This is not gentle merging — it is consumption. The smaller is eaten by the larger. The ego is devoured by the non-ego. The individual is absorbed into the universal. The mantis prays and kills simultaneously. So does the magician.",
    sephira: "Tiphareth",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 67,
    title: "SODOM-APPLES",
    text: "O ye who dwell in the Dark Night of the Soul, beware most of all of every herald of the Dawn! For the herald of the Dawn is not the Dawn itself, and he that mistaketh the herald for the Dawn shall sleep through the Day.",
    commentary: "67 = BYNH (Binah, Understanding); ZYN (Zayin, sword). Sodom-Apples (the fruit of the Dead Sea) look beautiful but turn to ash in the mouth. This chapter warns against the most dangerous trap on the mystical path: mistaking preliminary experiences for the final attainment. Every glimpse of light in the Dark Night of the Soul can become a lure — the aspirant rests in the pleasant vision and stops pushing toward the actual Dawn. False dawns are more dangerous than continued darkness, because darkness at least keeps you searching. The instruction is vital: when you think you've made it, you haven't. When you see the light, it is not yet THE Light. Keep going. The Sodom-Apple of premature certainty will turn to ash in your mouth.",
    sephira: "Binah",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 68,
    title: "MANNA",
    text: "Elijah had ravens; Mohammed had his camel; Jesus had his disciples to bring bread. But I am the prophet of a far greater feast. I sit in the café and drink my chocolate. And perhaps the difference is this: that I KNOW that I am a prophet.",
    commentary: "68 = ChYYM (Life, lives); ChKM (Wise); 4×17. Manna — the bread from heaven that sustained the Israelites — is here compared to chocolate at Rumpelmayer's café. The humor is the point: every prophet needs sustenance, but earlier prophets received theirs dramatically (ravens! camels! miracles!) while Crowley gets his from a Parisian café. The serious undercurrent: 'perhaps the difference is this: that I KNOW that I am a prophet.' Self-awareness is the mark of the new Aeon. Moses did not choose prophecy; it was thrust upon him. Crowley chose it deliberately, with full consciousness. The Manna of the New Aeon is not supernatural bread but conscious acceptance of one's nature — even in a café, even over chocolate. The sacred and the mundane are one.",
    sephira: "Tiphareth",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 69,
    title: "THE WAY TO SUCCEED—AND THE WAY TO SUCK EGGS!",
    text: "This is the Holy Hexagram. Plunge from the height, O God, and interlock with Man! Plunge from the height, O Man, and interlock with Beast! The Red Triangle is the descending tongue of grace; the Blue Triangle is the ascending tongue of prayer. This interchange, the Double Gift of Tongues, the Word of Double Power — ABRAHADABRA!",
    commentary: "69 — the number itself is a visual glyph of two interlocking figures, which is the subject of the chapter. The Holy Hexagram is formed by two interlocking triangles: Red (descending, God reaching toward Man) and Blue (ascending, Man reaching toward God). Their union is ABRAHADABRA, the Word of the Aeon (whose eleven letters are 5 + 6 = Pentagram + Hexagram). The 'Double Gift of Tongues' is simultaneously a Pentecostal reference and a sexual double-entendre — deliberately, because Crowley stated this chapter reveals the central secret of the O.T.O. involving the sacramental use of sexual polarity. The pun in the title (succeed/suck eggs) is the chapter's surface; beneath it lies the formula of divine union: God descends, Man ascends, and in their meeting the Word of Power is uttered.",
    sephira: "Yesod",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 70,
    title: "BROOMSTICK-BABBLINGS",
    text: "There is the Mystic Dance; there is the Obscene Kiss; there is the Mystery of the Gnarled Oak. FRATER PERDURABO is nothing but AN EYE; what eye none knoweth. 'Twas but a moment — one short, sharp cry — and then the silence of the night.",
    commentary: "70 = Ayin (Eye); YYN (Wine); SVD (Secret); 7×10. The broomstick is the witch's vehicle — the instrument of flight, ecstasy, the Sabbath. Witchcraft imagery pervades: the Obscene Kiss (the kiss beneath the Devil's tail at the Sabbat), the Mystic Dance (the ring-dance of the coven), the Gnarled Oak (the sacred tree of the grove). FRATER PERDURABO is 'nothing but AN EYE' — 70 = Ayin = Eye. He is pure perception without a perceiver: an Eye that observes but has no self behind it. The short, sharp cry followed by silence is simultaneously the cry of ecstasy and the cry of the newborn — both emergences from darkness into awareness. The broomstick babbles (makes incoherent sounds) because ecstasy cannot be articulated; it can only be experienced and then silence follows.",
    sephira: "Malkuth",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 71,
    title: "KING'S COLLEGE CHAPEL",
    text: "Prana — Prana — Pranayama! Pranayama is the foundation of all Work. Breathe, breathe, breathe — but always with the mind fixed upon the Goal. Prana — Prana — PRANAYAMA! Let the Aspirant practise it well, with determination of steel, with faith of iron, with will of fire.",
    commentary: "71 = YVNH (Dove, Jonah). King's College Chapel in Cambridge is famed for its fan-vaulted ceiling — an architectural analogy for the ribcage expanding and contracting with breath. The chapter is an incantatory paean to Pranayama (breath control) that builds like a fugue, each repetition more frantic than the last. This is not metaphor or theory but a direct exhortation: PRACTICE PRANAYAMA. Crowley considered breath control the single most important physical practice for the aspirant — more than asana, more than mantra, more than ritual. The dove (Jonah/YVNH) is the bird of the Holy Spirit, and spirit (ruach/pneuma) literally means 'breath' in both Hebrew and Greek. To control the breath is to control the spirit. The determination of steel, faith of iron, will of fire: this practice is not gentle.",
    sephira: "Chokmah",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 72,
    title: "HASHED PHEASANT",
    text: "Shemhamphorash! Shemhamphorash! Shemhamphorash! The Universe were swallowed up in flame. Yet all the sparks thereof are blown upon the wind.",
    commentary: "72 = ChSD (Chesed, Mercy); the 72-fold Name of God (Shemhamphorasch, derived from three verses of Exodus); 8×9. A rondel (circular poem) with the divine Name as its refrain. The Shemhamphorasch is the most elaborate Name of God in the Qabalistic tradition — 72 triads of Hebrew letters, each forming the name of an angel. The chapter treats the sacred with deliberate irreverence (hashed pheasant is leftover game bird): the most exalted Name of God is served as table scraps. This is not disrespect but a teaching: the sacred pervades even the remnants, even the leftovers, even the mundane Tuesday-night dinner. When the Universe is swallowed in the flame of the Divine Name, the sparks (individual souls) scatter on the wind — but each spark carries the full fire. Nothing is lost.",
    sephira: "Chesed",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 73,
    title: "THE DEVIL, THE OSTRICH, AND THE ORPHAN CHILD",
    text: "Death rides the Camel of Initiation. The Aspirant struggles upon his cross of Asana, and cries aloud for Death. All thine aspiration is to death: death is the crown of all thine aspiration. Harden! Endure!",
    commentary: "73 = ChKMH (Chokmah, Wisdom); GML (Gimel, Camel). The Devil (temptation), the Ostrich (denial, burying one's head), and the Orphan Child (the abandoned soul) are the three obstacles of initiation. Death rides the Camel (Gimel, the path across the Abyss) — you cannot cross without dying. The aspirant in Asana (seated meditation) experiences physical agony and cries for death as release. But death IS the goal, not the escape from the goal. The instruction is brutal: HARDEN. ENDURE. Do not flee from the pain of practice; the pain IS the practice. Your aspiration toward spiritual attainment IS aspiration toward death (of the ego). Crown your aspiration: die willingly. The orphan child has no parent to protect it — neither do you. You are alone on the path, and that aloneness is the condition of freedom.",
    sephira: "Chokmah",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 74,
    title: "CAREY STREET",
    text: "I bargained with Life for a penny, and Life would pay no more; however I begged at evening when I counted my scanty store. But the Bankruptcy Court of the Soul is in Carey Street. There the most precious things are sold for nothing.",
    commentary: "74 = LMD (Lamed, Ox Goad); 2×37 (twice Yechidah). Carey Street in London was the location of the Bankruptcy Court — to be 'in Carey Street' meant to be financially ruined. The chapter traces a descent through progressively worse bargains: you trade your freedom for consciousness, your consciousness for individuality, your individuality for love, and your love for loss. Each trade seems necessary at the time but leaves you poorer. The 'Bankruptcy Court of the Soul' is the Abyss — where everything you value is revealed to be worthless currency. The paradox: 'the most precious things are sold for nothing.' In the Abyss, your greatest treasures have zero value. But Nothing (Ain) is itself the supreme treasure. You go bankrupt into God.",
    sephira: "Tiphareth",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 75,
    title: "PLOVERS' EGGS",
    text: "If I really knew what I wanted, I could give up Laylah, or give up everything for Laylah. But I waver, and this wavering is the root of good sense.",
    commentary: "75 = NVYT (Nuit, Star Goddess); LYLH (Night); 3×25 (three times the Star Ruby). Plovers' eggs are a rare delicacy — expensive, seasonal, intensely desired. The chapter admits wavering between two paths: abandon Laylah for the Work, or abandon the Work for Laylah. This indecision is not presented as weakness but as 'the root of good sense.' Why? Because certainty in either direction would be premature. The aspirant who is absolutely certain he should renounce love is as deluded as the one who is certain love is all he needs. The wavering itself is a more honest state than either false certainty. 75 = NVYT (Nuit) = LYLH (Night): Nuit and Laylah have the same numerical value! The cosmic goddess and the human woman ARE the same. The wavering dissolves when this is realized.",
    sephira: "Netzach",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 76,
    title: "PHAETON",
    text: "No. Yes. Perhaps. O. Oh! Hm. Phaeton drove the chariot of the Sun into the Sea. But the Horses outran the Planets — by the Silence that succeeds the Neigh!",
    commentary: "76 = a near-prime. Phaeton, son of Helios, demanded to drive the Sun-chariot and lost control — Zeus struck him down to prevent the earth from burning. The chapter is almost entirely monosyllabic: No, Yes, Perhaps, O, Oh, Hm — a compressed history of philosophical response to reality. 'No' (denial), 'Yes' (affirmation), 'Perhaps' (doubt), 'O' (wonder), 'Oh' (recognition), 'Hm' (contemplation). Then silence. The horses that outran the planets represent will exceeding its proper scope — reaching beyond the solar system. But the key phrase is 'the Silence that succeeds the Neigh' — after the horse's cry (manifestation, expression, the Word), silence follows. And in that silence, something faster than planetary motion is achieved. The minimalism IS the teaching: say less, mean more.",
    sephira: "Hod",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 77,
    title: "THE SUBLIME AND SUPREME SEPTENARY IN ITS MATURE MAGICAL MANIFESTATION THROUGH MATTER, AS IT IS WRITTEN, AN HE-GOAT ALSO",
    text: "Laylah.",
    commentary: "77 = OZ (Strength; a Goat); MZLA (Influence from Kether); 7×11. The longest title in the book for the shortest content: a single word. This IS the joke and the teaching simultaneously. 'The Sublime and Supreme Septenary in its Mature Magical Manifestation through Matter' — this grandiose phrase, which could describe the entire Qabalistic system, reduces to one word: Laylah. A woman's name. All of Qabalah, all of Magick, all seven-times-eleven layers of cosmic manifestation, all boil down to love for a specific human being. OZ = 77 = the Goat = Pan = All. Laylah = Night = Nuit = the Infinite. The most complex metaphysics in the world and the simplest human emotion are identical. When you draw this chapter, the Oracle says: it is simpler than you think. Love is the law.",
    sephira: "Netzach",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 78,
    title: "WHEEL AND—WOA!",
    text: "There are five Wheels. The Wheel of Samsara, the Wheel of the Law, the Wheel of the Taro, the Wheel of the Heavens, and the Wheel of Life. All these Wheels are one. Meditate long and broad and deep upon this Wheel, revolving it in thy mind!",
    commentary: "78 = LCHM (Bread); MZL (Constellation, Luck/Mazal); 6×13. 78 is the number of cards in the Tarot — and this chapter enumerates five Wheels that are all one Wheel. Samsara (the Buddhist wheel of suffering/rebirth), the Dharma (the Law), the Tarot (the system of divination), the Heavens (the zodiac), and Life itself — these appear different but are identical in essence. 'Woa!' is the command to stop a horse (or a wheel). The instruction to 'meditate long and broad and deep' while 'revolving it in thy mind' creates a recursive loop: the mind becomes the wheel contemplating the wheel. The Bread (LCHM = 78) is the sustenance gained from this meditation — the manna that falls when you turn the Wheel consciously instead of being turned by it.",
    sephira: "Malkuth",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 79,
    title: "THE BAL BULLIER",
    text: "Nature is wasteful; but how well She can afford it! Nature is false; but I'm a bit of a liar myself. Nature is ugly; but look at me! Nature is cruel; but I can match her cruelty. I am Nature's darling!",
    commentary: "79 = BO'Z (Boaz, the left pillar of Solomon's Temple). The Bal Bullier was a famous Parisian dance hall — bohemian, raucous, alive. This chapter attacks ascetic renunciation as cowardice disguised as virtue. Nature is wasteful, false, ugly, cruel — and magnificent. The ascetic who renounces the world claims moral superiority, but he is actually afraid. Crowley matches himself to Nature: equally wasteful, false, ugly, and cruel. And equally glorious. The right pillar of the Temple is Jachin (Mercy); the left is Boaz (Severity/Strength). This chapter IS Boaz: the fierce assertion that the fullness of life, including its darkness, is sacred. Don't retreat from the dance hall into the monastery. Dance with Nature, match her blow for blow, and discover that you are her darling — her favorite, her own image.",
    sephira: "Geburah",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 80,
    title: "BLACKTHORN",
    text: "The price of existence is eternal warfare. The price of peace is eternal vigilance. Is there a Government? Then I'm agin it! To Hell with the bloody English! And God bless 'em, too, for they are my people.",
    commentary: "80 = Pé (Mouth, the letter of Mars); YSVD (Yesod, Foundation); 8×10. Blackthorn (sloe) is the wood of the Irish shillelagh — a fighting stick. This chapter is an Irish-flavored war-cry celebrating the eternal necessity of struggle. The price of existence IS eternal warfare — not as a moral judgment but as a statement of physics: all manifested things exist through the tension of opposing forces. The chapter's political content (against all government) is less important than its metaphysical content: peace is not the absence of conflict but the mastery of it. The self-contradicting 'To Hell with them / God bless them' is the key: you can oppose something and love it simultaneously. In fact, that is the only honest position. Pé (the Mouth) speaks the Word that shatters — Mars acts — and from the destruction, new life springs.",
    sephira: "Yesod",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 81,
    title: "LOUIS LINGG",
    text: "I am not an Anarchist in your sense of the word: your brain is too dense for any organization subtler than brute force to penetrate. Every 'emancipator' has enslaved the free. The Feudal System was not unlike the A∴A∴ system.",
    commentary: "81 = 9² (3⁴); ANKY (I — the emphatic first person, as in the First Commandment); KSA (Throne). Louis Lingg was one of the Haymarket anarchists who killed himself with a dynamite cap rather than be executed. The chapter rejects political anarchism (which merely destroys existing order) in favor of a hierarchical voluntarism modeled on feudalism — but the spiritual feudalism of the A∴A∴, where rank is earned through attainment, not inherited through birth. 81 = 9² = the Foundation (Yesod) squared — the ego (ANKY, I) asserting itself with mathematical perfection. The paradox: every revolution creates new tyranny. The only true freedom is internal — the mastery of the self, not the overthrow of external systems. Lingg's suicide was his final act of sovereignty: choosing his own death rather than accepting the state's.",
    sephira: "Yesod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 82,
    title: "BORTSCH",
    text: "Beneath the blasted oak I swore an oath. To annihilate Nothingness, to make the Void more Void. He that endureth even to the End — shall he not be saved? Yea, though the heavens fall and the earth crumble.",
    commentary: "82 = LKBAL (Angel); 2×41 (twice the Barren Mother). The triple title (Bortsch / Imperial Purple / A Punic War) mirrors the three verses. The blasted oak (the Tree struck by lightning = Pé = the Tower) is the traditional site of oaths in Celtic culture. The oath is paradoxical: to annihilate Nothingness, to make the Void more Void. How do you annihilate what doesn't exist? By going BEYOND non-existence — to a state more empty than emptiness itself. This is the formula of the Negative Veils: beyond Ain (Nothing), beyond Ain Soph (Limitless Nothing), to Ain Soph Aur (Limitless Light of Nothing). The promise 'he that endureth even to the End shall be saved' echoes Christ but in a Thelemic context: endurance through the annihilation of even Nothingness leads to a state beyond salvation itself.",
    sephira: "Daath",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 83,
    title: "THE BLIND PIG",
    text: "Many becomes two: two become one: one becomes naught. What comes to Naught? The Adept must go forth and enjoy the Many. Beware lest this chapter deceive thee!",
    commentary: "83 = GML (Gimel variant); a prime number. The 'Blind Pig' is a pun: 83 = PG (Pig) in Hebrew without an I (Ayin = Eye = 70). A pig without an eye = a Blind Pig. Beyond the wordplay: the chapter traces the mystic path in reverse: Many → Two → One → Naught. But then asks: what comes AFTER Naught? The answer is a return to the Many — the Adept, having achieved Nothingness, must descend again into the world of multiplicity. This is the Bodhisattva vow, the return from Nirvana to Samsara. The warning 'Beware lest this chapter deceive thee!' is itself a deception (or is it?). In the Book of Lies, even the warnings are lies. Or are they? The blind pig cannot see the trap — can you?",
    sephira: "Kether",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 84,
    title: "THE AVALANCHE",
    text: "Only through devotion to FRATER PERDURABO may this book be understood. I have labored underground past all the light of the sun. Yet there is gladness in my heart, for he hath finished THE WORK; it is done; it is accomplished.",
    commentary: "84 = ChLVM (Dream); ChNVK (Enoch); 7×12. The avalanche is the sudden, catastrophic release of accumulated snow — the moment when years of silent accumulation reach critical mass and everything transforms in an instant. The chapter describes the underground labor of the Great Work: years of practice, study, and devotion with no visible result, past all light and hope. Then suddenly — the avalanche — everything cascades at once. The reference to Enoch (ChNVK = one who was 'taken' by God without dying) suggests translation to a higher state rather than death. The gladness amidst the darkness is the key: the Work can be accomplished in joy even when performed in total obscurity. The Dream (ChLVM = 84) is the Work itself — we work within the dream to awaken from it.",
    sephira: "Tiphareth",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 85,
    title: "BORBORYGMI",
    text: "I distrust any thoughts uttered by any man whose health is not robust. The most robust express no thoughts at all: they eat, drink, sleep, and copulate in silence. We are Strassburg geese, and we fatten our livers that others may feast upon the pâté de foie gras.",
    commentary: "85 = PH (Peh, the Mouth — letter name); MYLH (Circumcision); 5×17. Borborygmi are stomach rumblings — the body's most ineloquent sound. The chapter distrusts ALL thought that comes from unhealthy bodies, which is most thought. The truly robust (healthy, vital, animal) express nothing — they simply live. This is anti-intellectual in the deepest sense: not the stupidity of the ignorant but the silence of the fully alive. The Strassburg goose is force-fed to enlarge its liver for pâté — a horrifying metaphor for the intellectual who stuffs himself with ideas to produce 'delicacies' for others, destroying himself in the process. The circumcision (MYLH = 85) is the cutting-away of excess: strip the mind to its essential function and let the body speak through action, not words.",
    sephira: "Hod",
    path: "—",
    element: "Fire",
    tarot: "—"
  },
  {
    chapter: 86,
    title: "TAT",
    text: "Ex nihilo N.I.H.I.L. fit. N is the fire of the identity of thy Quintessence. I is the move toward: the Magical Will. H is the vehicle of Spirit. I is the retraction: the Reflection. L is the extension of the concentrated Will. Thus are the Five Elements woven on the invisible design of Nothingness.",
    commentary: "86 = ALHYM (Elohim, Gods); also AHYH (21) + ADNY (65) = Kether united with Malkuth. 'Ex nihilo NIHIL fit' (from nothing, nothing comes) — but Crowley breaks NIHIL into five letters, each corresponding to an element: N (Fire, Shin), I (Water, Mem), H (Spirit, Aleph), I (Air, Aleph variant), L (Earth, Tau). NOTHING is composed of ALL FIVE ELEMENTS woven on an invisible design. The profundity: the Void is not empty but is the framework upon which all manifestation hangs. Elohim (86) is the divine name of creation ('In the beginning, Elohim created…'), and Elohim is plural — Gods, not God. Creation is accomplished by a multiplicity of divine forces working on the substrate of Nothingness. TAT = 'that' in Sanskrit, the cosmic principle of Brahman.",
    sephira: "Binah",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
  {
    chapter: 87,
    title: "MANDARIN-MEALS",
    text: "Shark's fin, sea-slug, bamboo-tips — foods exquisite beyond telling! But nothing matches the kiss she gave me before She went away.",
    commentary: "87 = LBNH (Whiteness, the Sphere of the Moon); 3×29. Exquisite Chinese delicacies are enumerated with sensual precision — then dismissed. Nothing in the realm of sensation compares to a single kiss from the beloved before departure. The departure is key: the kiss is intensified by the imminent absence. What we are about to lose becomes infinitely precious. The Moon (LBNH = Whiteness) reflects the Sun's light — as memory reflects the actual experience, paler but persistent. This chapter is about the alchemy of loss: how absence transforms ordinary experience into the sacred. The Mandarin (Chinese official) feasts lavishly, but his feast is ashes compared to the departing kiss. Apply this to the spiritual path: the practices and attainments are the feast, but the actual moment of grace (always fleeting, always departing) outweighs them all.",
    sephira: "Yesod",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 88,
    title: "GOLD BRICKS",
    text: "Teach us Your secret, Master! yap my Yahoos. Then for the hardness of their hearts, and for the softness of their heads, I taught them Magick. But — alas! — they began to learn it. Thou who seekest the Secret: it is this — A SUCKER IS BORN EVERY MINUTE.",
    commentary: "88 = ChSK (Darkness); ChMM (to be hot); 8×11. Gold Bricks — the classic confidence trick of selling a lead brick coated in gold. The students demand the 'real secret' of alchemy — how to turn lead into gold. One offers a hundred thousand pounds. Crowley whispers the secret: 'A SUCKER IS BORN EVERY MINUTE.' The joke operates on multiple levels. Surface: you're a fool for believing there's a secret. Deeper: the 'secret' (that there is no secret) IS the secret. Deepest: Darkness (ChSK = 88) IS the environment in which gold is sought. Those who seek external gold (money, power, magical abilities) are suckers; the true gold is the darkness itself — the prima materia of the alchemists, which is the seeker's own lead-consciousness awaiting transformation. The secret cannot be taught because it IS the seeking.",
    sephira: "Hod",
    path: "—",
    element: "Air",
    tarot: "—"
  },
  {
    chapter: 89,
    title: "UNPROFESSIONAL CONDUCT",
    text: "I am annoyed about the number 89. I shall avenge myself by writing nothing in this chapter. That, too, is wise; for since I am annoyed, I could not write even a reasonably decent lie.",
    commentary: "89 = GVP (Body); DMMH (Silence, the 'still small voice'). A prime number that Crowley finds 'annoying' — possibly because it has no interesting gematria correspondences he can find. His revenge: to write nothing (while actually writing three sentences about writing nothing). The Self-referential humor IS the teaching. The Body (GVP = 89) is annoying because it doesn't conform to spiritual expectations. The Silence (DMMH = 89) is sometimes not mystical but merely the absence of anything worth saying. And the honesty: 'since I am annoyed, I could not write even a reasonably decent lie' — emotional states affect magical output. A magician in a bad mood should do nothing rather than do bad work. This is practical advice disguised as petulance: know when to stop. Not every moment is ripe for the Work.",
    sephira: "Malkuth",
    path: "—",
    element: "Earth",
    tarot: "—"
  },
  {
    chapter: 90,
    title: "STARLIGHT",
    text: "All is vanity on earth, except the love of a good woman, and that good woman LAYLAH. In Heaven: BABALON. Beyond Heaven: NUIT. I am youth eternal and force infinite. And at THE END is SHE that hath been set before me from the beginning.",
    commentary: "90 = MYM (Water); Tzaddi (the letter) = 90; MLK (King); 9×10. The penultimate chapter and a grand valediction. Three levels of the feminine divine are mapped: on Earth, Laylah (the personal beloved); in Heaven, BABALON (the Thelemic goddess of sacred ecstasy); beyond Heaven, NUIT (the Infinite herself, whose body is the star-strewn sky). These three are not separate beings but three veils of one reality — the seeker's relationship to the divine feminine deepens as he ascends. 'I am youth eternal and force infinite' — the solar affirmation of the Tiphareth initiate who has passed through the Abyss and been renewed. The final line reveals the secret: SHE (the divine feminine in all her forms) was 'set before me from the beginning.' You do not seek Her; She has always been waiting. The starlight IS Her body.",
    sephira: "Kether",
    path: "—",
    element: "Water",
    tarot: "—"
  },
  {
    chapter: 91,
    title: "THE HEIKLE",
    text: "A.M.E.N.",
    commentary: "91 = AMN (Amen) = YHVH (26) + ADNY (65). The mystical union of Kether (God Most High) and Malkuth (the Kingdom). Sum of 1 through 13. 7×13 (Netzach × Unity). 'Heikle' is the Scottish word for the last sheaf of corn cut at harvest — the end of the work, the completion of the cycle, the final gathering. The entire chapter is four letters: A.M.E.N. — meaning 'so be it,' 'it is established,' 'truth.' After 90 chapters of paradox, contradiction, humor, anguish, ritual, and revelation, the book closes with the simplest possible affirmation. AMEN seals everything that came before. The number 91 unites YHVH (the Most High) with ADNY (the Lord of Earth), heaven married to earth, spirit to matter. The Great Work is complete. The harvest is gathered. So be it.",
    sephira: "Kether-Malkuth",
    path: "—",
    element: "Spirit",
    tarot: "—"
  },
];

// ─────────────────────────────────────────────
//  GEMATRIA ENGINE — TABLES
// ─────────────────────────────────────────────
const ENGLISH_QABALAH = {
  a:1, b:2, c:3, d:4, e:5, f:6, g:7, h:8, i:9, j:10,
  k:11, l:12, m:13, n:14, o:15, p:16, q:17, r:18, s:19, t:20,
  u:21, v:22, w:23, x:24, y:25, z:26
};

const HEBREW_LETTERS = {
  "Aleph":   { letter: "א", value: 1,   meaning: "Ox",        element: "Air",         tarot: "The Fool" },
  "Beth":    { letter: "ב", value: 2,   meaning: "House",     element: "Mercury",     tarot: "The Magus" },
  "Gimel":   { letter: "ג", value: 3,   meaning: "Camel",     element: "Moon",        tarot: "High Priestess" },
  "Daleth":  { letter: "ד", value: 4,   meaning: "Door",      element: "Venus",       tarot: "The Empress" },
  "Hé":      { letter: "ה", value: 5,   meaning: "Window",    element: "Aries",       tarot: "The Star" },
  "Vau":     { letter: "ו", value: 6,   meaning: "Nail",      element: "Taurus",      tarot: "The Hierophant" },
  "Zayin":   { letter: "ז", value: 7,   meaning: "Sword",     element: "Gemini",      tarot: "The Lovers" },
  "Cheth":   { letter: "ח", value: 8,   meaning: "Fence",     element: "Cancer",      tarot: "The Chariot" },
  "Teth":    { letter: "ט", value: 9,   meaning: "Serpent",   element: "Leo",         tarot: "Lust" },
  "Yod":     { letter: "י", value: 10,  meaning: "Hand",      element: "Virgo",       tarot: "The Hermit" },
  "Kaph":    { letter: "כ", value: 20,  meaning: "Palm",      element: "Jupiter",     tarot: "Fortune" },
  "Lamed":   { letter: "ל", value: 30,  meaning: "Ox Goad",   element: "Libra",       tarot: "Adjustment" },
  "Mem":     { letter: "מ", value: 40,  meaning: "Water",     element: "Water",       tarot: "Hanged Man" },
  "Nun":     { letter: "נ", value: 50,  meaning: "Fish",      element: "Scorpio",     tarot: "Death" },
  "Samekh":  { letter: "ס", value: 60,  meaning: "Prop",      element: "Sagittarius", tarot: "Art" },
  "Ayin":    { letter: "ע", value: 70,  meaning: "Eye",       element: "Capricorn",   tarot: "The Devil" },
  "Pé":      { letter: "פ", value: 80,  meaning: "Mouth",     element: "Mars",        tarot: "The Tower" },
  "Tzaddi":  { letter: "צ", value: 90,  meaning: "Fish-hook", element: "Aquarius",    tarot: "The Emperor" },
  "Qoph":    { letter: "ק", value: 100, meaning: "Back of Head", element: "Pisces",   tarot: "The Moon" },
  "Resh":    { letter: "ר", value: 200, meaning: "Head",      element: "Sun",         tarot: "The Sun" },
  "Shin":    { letter: "ש", value: 300, meaning: "Tooth",     element: "Fire",        tarot: "The Aeon" },
  "Tau":     { letter: "ת", value: 400, meaning: "Cross",     element: "Saturn",      tarot: "The Universe" }
};

const SEPHIROTH_DATA = {
  "Kether":   { number: 1,  meaning: "Crown",                    color: "#FFFFFF", planet: "Primum Mobile",  godName: "Eheieh",         archangel: "Metatron" },
  "Chokmah":  { number: 2,  meaning: "Wisdom",                   color: "#C0C0C0", planet: "Zodiac/Neptune", godName: "Yah",            archangel: "Ratziel" },
  "Binah":    { number: 3,  meaning: "Understanding",             color: "#1a1a2e", planet: "Saturn",         godName: "YHVH Elohim",   archangel: "Tzaphkiel" },
  "Chesed":   { number: 4,  meaning: "Mercy",                     color: "#1e3a5f", planet: "Jupiter",        godName: "El",             archangel: "Tzadkiel" },
  "Geburah":  { number: 5,  meaning: "Severity",                  color: "#8B0000", planet: "Mars",           godName: "Elohim Gibor",  archangel: "Kamael" },
  "Tiphareth": { number: 6, meaning: "Beauty",                    color: "#DAA520", planet: "Sol",            godName: "YHVH Eloah ve-Daath", archangel: "Raphael" },
  "Netzach":  { number: 7,  meaning: "Victory",                   color: "#228B22", planet: "Venus",          godName: "YHVH Tzabaoth", archangel: "Haniel" },
  "Hod":      { number: 8,  meaning: "Splendor",                  color: "#FF8C00", planet: "Mercury",        godName: "Elohim Tzabaoth", archangel: "Michael" },
  "Yesod":    { number: 9,  meaning: "Foundation",                color: "#9370DB", planet: "Luna",           godName: "Shaddai El Chai", archangel: "Gabriel" },
  "Malkuth":  { number: 10, meaning: "Kingdom",                   color: "#8B4513", planet: "Terra",          godName: "Adonai ha-Aretz", archangel: "Sandalphon" },
  "Daath":    { number: 0,  meaning: "Knowledge (The Abyss)",     color: "#2a0a2a", planet: "Pluto",          godName: "—",              archangel: "—" },
  "Ain":      { number: 0,  meaning: "Nothing",                   color: "#000000", planet: "—",              godName: "—",              archangel: "—" },
  "Ain Soph": { number: 0,  meaning: "The Boundless",             color: "#000000", planet: "—",              godName: "—",              archangel: "—" },
  "Ain Soph Aur": { number: 0, meaning: "Limitless Light",        color: "#0a0a0a", planet: "—",              godName: "—",              archangel: "—" },
  "Kether-Binah":     { number: 0, meaning: "Path: Kether to Binah",     color: "#808080", planet: "Mercury", godName: "—", archangel: "—" },
  "Kether-Tiphareth": { number: 0, meaning: "Path: Kether to Tiphareth", color: "#9370DB", planet: "Moon",    godName: "—", archangel: "—" },
  "Chokmah-Binah":    { number: 0, meaning: "Path: Chokmah to Binah",    color: "#228B22", planet: "Venus",   godName: "—", archangel: "—" },
  "Chokmah-Tiphareth": { number: 0, meaning: "Path: Chokmah to Tiphareth", color: "#8B0000", planet: "Aries", godName: "—", archangel: "—" },
  "Chokmah-Chesed":   { number: 0, meaning: "Path: Chokmah to Chesed",   color: "#8B4513", planet: "Taurus",  godName: "—", archangel: "—" },
  "Binah-Tiphareth":  { number: 0, meaning: "Path: Binah to Tiphareth",  color: "#C0C0C0", planet: "Gemini",  godName: "—", archangel: "—" },
  "Binah-Geburah":    { number: 0, meaning: "Path: Binah to Geburah",    color: "#FF8C00", planet: "Cancer",  godName: "—", archangel: "—" },
  "Chesed-Geburah":   { number: 0, meaning: "Path: Chesed to Geburah",   color: "#DAA520", planet: "Leo",     godName: "—", archangel: "—" },
  "Chesed-Tiphareth": { number: 0, meaning: "Path: Chesed to Tiphareth", color: "#8B4513", planet: "Virgo",   godName: "—", archangel: "—" },
  "Chesed-Netzach":   { number: 0, meaning: "Path: Chesed to Netzach",   color: "#1e3a5f", planet: "Jupiter", godName: "—", archangel: "—" },
  "Geburah-Tiphareth": { number: 0, meaning: "Path: Geburah to Tiphareth", color: "#228B22", planet: "Libra", godName: "—", archangel: "—" },
  "Geburah-Hod":      { number: 0, meaning: "Path: Geburah to Hod",      color: "#1e3a5f", planet: "Water",  godName: "—", archangel: "—" },
  "Tiphareth-Netzach": { number: 0, meaning: "Path: Tiphareth to Netzach", color: "#1e3a5f", planet: "Scorpio", godName: "—", archangel: "—" },
  "Tiphareth-Yesod":  { number: 0, meaning: "Path: Tiphareth to Yesod",  color: "#1e3a5f", planet: "Sagittarius", godName: "—", archangel: "—" },
  "Tiphareth-Hod":    { number: 0, meaning: "Path: Tiphareth to Hod",    color: "#8B4513", planet: "Capricorn", godName: "—", archangel: "—" },
  "Netzach-Hod":      { number: 0, meaning: "Path: Netzach to Hod",      color: "#8B0000", planet: "Mars",   godName: "—", archangel: "—" },
  "Netzach-Yesod":    { number: 0, meaning: "Path: Netzach to Yesod",    color: "#C0C0C0", planet: "Aquarius", godName: "—", archangel: "—" },
  "Netzach-Malkuth":  { number: 0, meaning: "Path: Netzach to Malkuth",  color: "#9370DB", planet: "Pisces", godName: "—", archangel: "—" },
  "Hod-Yesod":        { number: 0, meaning: "Path: Hod to Yesod",        color: "#DAA520", planet: "Sun",    godName: "—", archangel: "—" },
  "Hod-Malkuth":      { number: 0, meaning: "Path: Hod to Malkuth",      color: "#8B0000", planet: "Fire",   godName: "—", archangel: "—" },
  "Yesod-Malkuth":    { number: 0, meaning: "Path: Yesod to Malkuth",    color: "#1a1a2e", planet: "Saturn", godName: "—", archangel: "—" },
  "Kether-Malkuth":   { number: 0, meaning: "Union of Crown and Kingdom", color: "#FFFFFF", planet: "All",    godName: "YHVH + ADNY",   archangel: "—" },
};

const NOTABLE_NUMBERS = {
  0:   "Ain (אין) — Nothing; the Negative Veils",
  1:   "Kether; Aleph; the Point",
  2:   "Chokmah; Beth; duality",
  3:   "Binah; Gimel; the Triangle",
  5:   "Geburah; Hé; the Pentagram",
  6:   "Tiphareth; Vau; the Hexagram",
  7:   "Netzach; Zayin; Venus; the 7 Palaces",
  8:   "Hod; Cheth; Mercury",
  9:   "Yesod; Teth; the Moon",
  10:  "Malkuth; Yod; the Kingdom; the complete Tree",
  11:  "Magick; Abrahadabra has 11 letters; the Qliphoth",
  12:  "HVA (הוא) — He/She/It; the Zodiac has 12 signs",
  13:  "AChD (אחד) — Unity; AHBH (אהבה) — Love",
  14:  "DVD (דוד) — David, Beloved; ZHB (זהב) — Gold",
  15:  "YH (יה) — Yah, divine name; the Devil (XV)",
  17:  "ChVH (חוה) — Eve; IAO; a holy prime",
  18:  "ChY (חי) — Life, Living",
  20:  "YVD (יוד) — Yod spelled in full (the Hand)",
  21:  "AHYH (אהיה) — Eheieh ('I Am'), name of Kether",
  22:  "The 22 Hebrew letters; 22 paths on the Tree",
  23:  "ChYH (חיה) — Life-force; ChDVH — Joy; '23 Skidoo'",
  25:  "5² — the Pentagram squared",
  26:  "YHVH (יהוה) — Tetragrammaton, the Demiurge",
  28:  "KCh (כח) — Power; sum of 1–7 (mystic number of Netzach)",
  31:  "AL (אל) — God; LA (לא) — Not; the key reversal",
  32:  "LB (לב) — Heart/Mind; 32 paths on the Tree",
  33:  "GL (גל) — Spring, fountain; 33rd Masonic degree",
  36:  "6² — Hexagram squared; ALH (אלה) — Goddess",
  37:  "YChYDH (יחידה) — Yechidah, True Will; HBL — Vanity",
  39:  "YHVH AChD — 'The Lord is One'; TAL (טל) — Dew",
  40:  "Mem (מ) — Water; 40 days of the Flood",
  42:  "AMA (אמא) — unfertilized Mother; the 42-letter Name",
  44:  "DM (דם) — Blood; the Mass of the Phoenix",
  45:  "ADM (אדם) — Adam; MH (מה) — What?",
  49:  "7² — Venus squared",
  50:  "KL (כל) — All, Everything; the 50 Gates of Binah",
  52:  "BN (בן) — Son; AYMA (אימא) — fertile Mother",
  53:  "ABN (אבן) — Stone = AB (Father) + BN (Son); GN — Garden",
  55:  "KLH (כלה) — Bride (Malkuth); sum of 1–10",
  56:  "YVM (יום) — Day",
  58:  "ChN (חן) — Grace, beauty, favor",
  61:  "AYN (אין) — Nothing = ANY (אני) — I; Nothing = Ego",
  64:  "DYN (דין) — Judgment; 8²",
  65:  "ADNY (אדני) — Adonai, the Holy Guardian Angel; HS — Silence!; HYKL — Temple",
  66:  "Sum of 1–11 (mystic number of Qliphoth); the Great Work",
  67:  "BYNH (בינה) — Binah, Understanding",
  68:  "ChYYM (חיים) — Life (lives); ChKM — Wise",
  70:  "Ayin (ע) — Eye; YYN — Wine; SVD — Secret",
  72:  "ChSD (חסד) — Chesed, Mercy; the 72-fold Name of God",
  73:  "ChKMH (חכמה) — Chokmah, Wisdom; GML — Gimel/Camel",
  77:  "OZ (עז) — Strength, a Goat; MZLA — Influence from Kether",
  78:  "LCHM (לחם) — Bread; MZL — Mazal; 78 Tarot cards",
  80:  "Pé (פ) — Mouth; YSVD — Yesod",
  81:  "9² (3⁴); ANKY (אנכי) — I (emphatic); KSA — Throne",
  86:  "ALHYM (אלהים) — Elohim; AHYH+ADNY (21+65) = Kether+Malkuth",
  89:  "GVP (גוף) — Body; DMMH — Silence ('still small voice')",
  90:  "MYM (מים) — Water; Tzaddi = 90; MLK — King",
  91:  "AMN (אמן) — Amen = YHVH(26) + ADNY(65); sum of 1–13",
  93:  "Thelema (θελημα) — Will; Agape (αγαπη) — Love; the Law",
  100: "Qoph (ק); KP — Palm; MLKVTh first letters",
  111: "ALP (אלף) — Aleph spelled fully; APL — thick darkness; AChD HVA ALHYM — 'He is One God'",
  120: "MVSDI — Foundation; Samekh spelled fully; 5! (factorial)",
  131: "Samael (סמאל) — the Poison of God",
  156: "BABALON (באבאלון); 12×13; Zion",
  165: "MKPAL (מקפאל) — the 'beating' of God",
  175: "Sum of Venus magic square (7×25)",
  200: "Resh (ר) — Head; the Sun",
  206: "DBR (דבר) — Word; RVCh ALHYM — Spirit of God",
  210: "Sum of 1–20; NOX",
  220: "Liber AL vel Legis (Book of the Law); 10×22",
  231: "The 231 Gates of the Sepher Yetzirah",
  260: "TIRION — Tiriel (Mercury intelligence); 10×YHVH",
  280: "MNTzPK — the 5 final letters; Sandalphon; RP — healing",
  300: "Shin (ש) — Tooth/Fire; RVCh ALHYM — Spirit of Elohim",
  314: "ShDY (שדי) — Shaddai, the Almighty; Metatron",
  325: "Sum of 1–25; BRKSh — a first-born",
  326: "IHShVH (יהשוה) — Yeheshuah, Jesus (Pentagrammaton)",
  333: "ChVRVNZVN (חורונזון) — Choronzon, Demon of the Abyss; 3×111",
  340: "ShM (שם) — The Name (in full: Shin+Mem)",
  358: "MShYCh (משיח) — Messiah; NChSh (נחש) — Serpent",
  361: "19²; AShNTh — a Woman",
  365: "Abraxas (Αβραξας); Metatron; days of the solar year",
  370: "OShN (עשן) — Smoke; ShLM — perfection, peace (Shalem)",
  393: "Sum of paths on Tree in one tradition",
  400: "Tau (ת) — Cross; the last Hebrew letter",
  401: "ATh (את) — Essence; Alpha and Omega",
  418: "ABRAHADABRA (אברהדברא) — Word of the Aeon; ChYTh — Beast (living creature)",
  434: "DLTh (דלת) — Daleth spelled fully (Door)",
  440: "ThM (תם) — Completeness, Perfection; MT — Dead",
  444: "DM squared; Blood of the Saints; MKDSh — Sanctuary",
  463: "Longest diagonal of Tree of Life",
  474: "DOTh (דעת) — Daath, Knowledge",
  500: "Kaph final (ך); ShR — Prince; ThK — Centre",
  510: "RYSh (ריש) — Resh spelled fully (Head of the Sun)",
  543: "AHYH AShR AHYH — 'I Am That I Am'",
  620: "KThR (כתר) — Kether spelled fully (Crown)",
  640: "ShMSh (שמש) — Sun (Shemesh); ThMYM — Perfections",
  666: "SVRTh (סורת) — Sorath, Spirit of the Sun; Number of the Beast; sum of 1–36 (magic square of Sol)",
  671: "ThORA (תערא) — the Gate; ThORA — Torah",
  700: "Nun final (ן); ThSh — foundation",
  718: "Stélé of Revealing (number of the Stele at Boulaq Museum)",
  741: "AMTh (אמת) — Truth (Aleph+Mem+Tau in full)",
  777: "OLM HQLYPVTh — World of Shells (a reading); the Flaming Sword descending through all paths; Crowley's key reference work",
  800: "Pé final (ף); QShTh — the Rainbow",
  813: "ARAShITh — 'In the Beginning'",
  831: "PhLG (פלג) — division; the Phallus",
  888: "IHSoUS (Ιησους) — Jesus in Greek gematria",
  900: "Tzaddi final (ץ); QTz — summer, end",
  999: "Sum of 1–37 = 703... (actually just a variant trinity of 333×3)",
  1000: "Aleph final (א large); the Thousandfold",
};

const ELEMENT_SYMBOLS = {
  "Fire":   "🜂",
  "Water":  "🜄",
  "Air":    "🜁",
  "Earth":  "🜃",
  "Spirit": "☉",
  "Void":   "∅",
  "Light":  "☆",
};

// ─────────────────────────────────────────────
//  GEMATRIA ENGINE — FUNCTIONS
// ─────────────────────────────────────────────
const calculateGematria = (text) => {
  const clean = text.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length === 0) return { simple: 0, reduced: 0, raw: 0 };
  
  let simple = 0;
  for (const ch of clean) {
    simple += ENGLISH_QABALAH[ch] || 0;
  }
  
  // Theosophic reduction (reduce to single digit)
  let reduced = simple;
  let reductionSteps = [simple];
  while (reduced > 9) {
    reduced = String(reduced).split('').reduce((a, b) => a + parseInt(b), 0);
    reductionSteps.push(reduced);
  }
  
  return {
    simple,           // Full sum (e.g. 93)
    reduced,          // Single digit (e.g. 3)
    raw: clean.length, // Number of letters
    reductionSteps,   // [93, 12, 3] — for display
  };
};

const findCorrespondences = (value) => {
  if (value === 0) return [];
  const matches = [];
  
  // Direct match
  if (NOTABLE_NUMBERS[value]) {
    matches.push({ type: 'direct', text: NOTABLE_NUMBERS[value] });
  }
  
  // Perfect square check
  const sqrt = Math.sqrt(value);
  if (Number.isInteger(sqrt) && sqrt > 1) {
    matches.push({ type: 'square', text: `${sqrt}² — the ${sqrt}-fold principle squared` });
  }
  
  // Factor analysis (interesting factors only)
  for (const [num, meaning] of Object.entries(NOTABLE_NUMBERS)) {
    const n = parseInt(num);
    if (n > 1 && n < value && n <= 100 && value % n === 0) {
      const other = value / n;
      if (other !== 1 && other !== value) {
        const shortMeaning = meaning.split(';')[0].split('—')[0].trim();
        matches.push({ type: 'factor', text: `${value} = ${n} × ${other} (${shortMeaning})` });
      }
    }
  }
  
  // Proximity check (±1 from notable numbers)
  if (NOTABLE_NUMBERS[value - 1]) {
    const nearby = NOTABLE_NUMBERS[value - 1].split(';')[0].split('—')[0].trim();
    matches.push({ type: 'proximity', text: `One beyond ${value - 1} (${nearby})` });
  }
  if (NOTABLE_NUMBERS[value + 1]) {
    const nearby = NOTABLE_NUMBERS[value + 1].split(';')[0].split('—')[0].trim();
    matches.push({ type: 'proximity', text: `One before ${value + 1} (${nearby})` });
  }
  
  // Limit results and prioritize: direct > square > factor > proximity
  const priority = { direct: 0, square: 1, factor: 2, proximity: 3 };
  matches.sort((a, b) => priority[a.type] - priority[b.type]);
  
  return matches.slice(0, 8);
};

const stringToHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const formatChapterNumber = (num) => {
  if (num === -2) return "?";
  if (num === -1) return "!";
  return String(num);
};

const getSephiraColor = (sephiraName) => {
  // Try direct match first
  if (SEPHIROTH_DATA[sephiraName]) {
    return SEPHIROTH_DATA[sephiraName].color;
  }
  // Default
  return '#dc2626';
};

const getSephiraInfo = (sephiraName) => {
  if (SEPHIROTH_DATA[sephiraName]) {
    const s = SEPHIROTH_DATA[sephiraName];
    return {
      name: sephiraName,
      meaning: s.meaning,
      color: s.color,
      planet: s.planet,
      godName: s.godName,
      archangel: s.archangel,
    };
  }
  return {
    name: sephiraName,
    meaning: sephiraName,
    color: '#dc2626',
    planet: '—',
    godName: '—',
    archangel: '—',
  };
};

// ─────────────────────────────────────────────
//  NOISE TEXTURE
// ─────────────────────────────────────────────
const NOISE_TEXTURE_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
)}`;

// ─────────────────────────────────────────────
//  AUDIO ENGINE HOOK
// ─────────────────────────────────────────────
const useAudioEngine = (active, intensity = 0.5) => {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const masterRef = useRef(null);

  const init = useCallback(() => {
    if (ctxRef.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    comp.connect(master);

    [55, 110, 165, 220].forEach((freq, i) => {
      const types = ['sawtooth', 'square', 'triangle', 'sine'];
      const vols = [0.3, 0.15, 0.08, 0.2];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      osc.type = types[i];
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 3;
      gain.gain.value = vols[i];
      pan.pan.value = (i - 1.5) * 0.3;
      osc.connect(gain); gain.connect(pan); pan.connect(comp);
      osc.start();
      nodesRef.current.push(osc);
    });

    const binL = ctx.createOscillator();
    const binR = ctx.createOscillator();
    const gL = ctx.createGain(); const gR = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    binL.frequency.value = 200; binR.frequency.value = 207.83;
    binL.type = binR.type = 'sine';
    gL.gain.value = gR.gain.value = 0.06;
    binL.connect(gL); binR.connect(gR);
    gL.connect(merger, 0, 0); gR.connect(merger, 0, 1);
    merger.connect(master); binL.start(); binR.start();

    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.08; lfoG.gain.value = 0.04;
    lfo.connect(lfoG); lfoG.connect(master.gain); lfo.start();
  }, []);

  useEffect(() => {
    if (active) {
      init();
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime);
        masterRef.current.gain.setTargetAtTime(0.12 * intensity, ctxRef.current.currentTime, 2);
      }
    } else if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5);
    }
  }, [active, intensity, init]);

  const playBell = useCallback(() => {
    if (!ctxRef.current || !masterRef.current) return;
    const ctx = ctxRef.current; const now = ctx.currentTime;
    const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 528;
    g1.gain.setValueAtTime(0.25, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 3);
    osc1.connect(g1); g1.connect(masterRef.current);
    osc1.start(now); osc1.stop(now + 3);
    const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
    osc2.type = 'sine'; osc2.frequency.value = 1057;
    g2.gain.setValueAtTime(0.08, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc2.connect(g2); g2.connect(masterRef.current);
    osc2.start(now); osc2.stop(now + 2.5);
  }, []);

  return { playBell };
};

// ─────────────────────────────────────────────
//  AI ORACLE HOOK
// ─────────────────────────────────────────────
const useAIOracle = () => {
  const [oracleState, setOracleState] = useState({ loading: false, text: null, error: null });
  const abortRef = useRef(null);

  const consultOracle = useCallback(async (question, chapter, gematria, correspondences) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOracleState({ loading: true, text: null, error: null });

    const sephInfo = getSephiraInfo(chapter.sephira);
    const corrText = correspondences.length > 0
      ? correspondences.map(c => c.text).join("; ")
      : "No direct correspondences found";

    const systemPrompt = `You are the Oracle of the Abyss, a voice that speaks from the depths of the Qliphothic night and the heights of the Supernal Triad. You interpret Aleister Crowley's Liber CCCXXXIII (The Book of Lies) as a living oracle.

Your manner: cryptic yet penetrating. Speak in the second person ("you"). Your tone blends the severity of Geburah with the dark knowing of Binah. Use rich esoteric vocabulary naturally — sephiroth, paths, elements, qliphoth — but never lecture. Every word should feel like it was waiting for this specific seeker.

You have been given:
- The seeker's question or focus
- The chapter drawn by gematric resonance
- The numerical correspondences of their query
- The qabalistic attributions of the chapter

Your task: weave a 3-4 paragraph interpretation that SPECIFICALLY connects the chapter's teaching to the seeker's question. Do not merely summarize the chapter. Reveal what the chapter says TO THIS SEEKER about THEIR situation. Find the hidden thread between what they asked and what was drawn.

End with a single sentence — a blade of wisdom, a koan, a command — separated by a line break. Make it unforgettable.

Do not use markdown formatting. Do not use headers or bullet points. Write in flowing prose.`;

    const userMsg = `THE SEEKER ASKS: "${question}"

CHAPTER DRAWN: ${chapter.chapter === -2 ? '?' : chapter.chapter === -1 ? '!' : chapter.chapter} — ${chapter.title}
KEY TEXT: "${chapter.text}"

GEMATRIA OF QUERY: ${gematria.simple} (reduces to ${gematria.reduced} via ${gematria.reductionSteps.join(' → ')})
CORRESPONDENCES: ${corrText}

QABALISTIC POSITION:
  Sephira: ${chapter.sephira} (${sephInfo.meaning})
  Path: ${chapter.path}
  Element: ${chapter.element}
  Tarot: ${chapter.tarot}

Deliver the Oracle's interpretation.`;

try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userMsg }],
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API error: ${response.status}`)
        }

        const data = await response.json();
        const text = data.content
          ?.filter(b => b.type === "text")
          .map(b => b.text)
          .join("\n") || "The Abyss returns silence.";

      setOracleState({ loading: false, text, error: null });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setOracleState({ loading: false, text: null, error: err.message });
    }
  }, []);

  const resetOracle = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setOracleState({ loading: false, text: null, error: null });
  }, []);

  return { ...oracleState, consultOracle, resetOracle };
};

// ─────────────────────────────────────────────
//  JOURNAL HOOK (Persistent via window.storage)
// ─────────────────────────────────────────────
const MAX_JOURNAL = 50;

const useJournal = () => {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await window.storage.get("liber333_journal");
      if (result && result.value) {
        const parsed = JSON.parse(result.value);
        setEntries(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.log("Journal: no saved data or error", e);
      setEntries([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (newEntries) => {
    try {
      await window.storage.set("liber333_journal", JSON.stringify(newEntries));
    } catch (e) {
      console.error("Journal save error:", e);
    }
  }, []);

  const addEntry = useCallback(async (entry) => {
    const newEntries = [entry, ...entries].slice(0, MAX_JOURNAL);
    setEntries(newEntries);
    await save(newEntries);
  }, [entries, save]);

  const removeEntry = useCallback(async (id) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    await save(newEntries);
  }, [entries, save]);

  const clearAll = useCallback(async () => {
    setEntries([]);
    try { await window.storage.delete("liber333_journal"); } catch(e) {}
  }, []);

  return { entries, loaded, addEntry, removeEntry, clearAll };
};

// ─────────────────────────────────────────────
//  PARTICLE CANVAS
// ─────────────────────────────────────────────
const ParticleCanvas = ({ active, intensity = 1 }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(Math.random() * 2.5 + 0.8) * intensity,
      size: Math.random() * 3 + 0.5,
      life: 1,
      decay: Math.random() * 0.008 + 0.003,
      phase: Math.random() * Math.PI * 2,
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (active && particlesRef.current.length < Math.floor(120 * intensity)) {
        for (let i = 0; i < Math.ceil(2 * intensity); i++)
          particlesRef.current.push(createParticle());
      }
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx + Math.sin(p.y * 0.008 + p.phase) * 0.4;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) return false;
        const a = p.life, r = p.size * p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,38,38,${a * 0.7})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,120,50,${a * 0.5})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,38,38,${a * 0.07})`; ctx.fill();
        return true;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, intensity]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 2s', zIndex: 1 }} />
  );
};

// ─────────────────────────────────────────────
//  ANIMATED SIGIL (SVG)
// ─────────────────────────────────────────────
const AnimatedSigil = ({ input, size = 200, spinning = true, glowing = true }) => {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!spinning) return;
    const iv = setInterval(() => setTime(t => t + 0.02), 16);
    return () => clearInterval(iv);
  }, [spinning]);

  const geometry = useMemo(() => {
    if (!input) return null;
    const hash = Math.abs(Array.from(input).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0));
    const numPoints = 5 + (hash % 8);
    const numRings = 2 + (hash % 3);
    const points = [], lines = [], rings = [];

    for (let r = 0; r < numRings; r++) {
      const ringRadius = 28 + r * 22;
      rings.push(ringRadius);
      const ringPts = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 + (r * 0.3);
        const charVal = input.charCodeAt((i + r * 3) % input.length) || 65;
        const wobble = (charVal % 20) - 10;
        const x = 100 + Math.cos(angle) * (ringRadius + wobble);
        const y = 100 + Math.sin(angle) * (ringRadius + wobble);
        points.push({ x, y, ring: r });
        ringPts.push({ x, y });
      }
      for (let i = 0; i < ringPts.length; i++) {
        const next = ringPts[(i + 1) % ringPts.length];
        lines.push({ x1: ringPts[i].x, y1: ringPts[i].y, x2: next.x, y2: next.y, ring: r });
      }
    }
    for (let i = 0; i < numPoints; i++) {
      for (let r = 0; r < numRings - 1; r++) {
        const idx1 = r * numPoints + i;
        const idx2 = (r + 1) * numPoints + ((i + 1) % numPoints);
        if (points[idx1] && points[idx2])
          lines.push({ x1: points[idx1].x, y1: points[idx1].y, x2: points[idx2].x, y2: points[idx2].y, ring: -1 });
      }
    }
    return { points, lines, rings };
  }, [input]);

  if (!geometry) return null;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="w-full h-full" style={{
        filter: glowing ? 'drop-shadow(0 0 20px rgba(220,38,38,0.6)) drop-shadow(0 0 40px rgba(220,38,38,0.25))' : 'none'
      }}>
        <defs>
          <radialGradient id="sigilGlow">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#sigilGlow)" />
        {geometry.rings.map((r, i) => (
          <circle key={`ring-${i}`} cx="100" cy="100" r={r} fill="none" stroke="#dc2626"
            strokeWidth={i === 0 ? 2 : 1} strokeDasharray={i > 0 ? "4 3" : "none"}
            opacity={0.6 - i * 0.12}
            transform={`rotate(${time * (18 + i * 8) * (i % 2 === 0 ? 1 : -1)} 100 100)`} />
        ))}
        {geometry.lines.map((line, i) => (
          <line key={`ln-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={line.ring === -1 ? "#ffffff" : "#dc2626"}
            strokeWidth={line.ring === -1 ? 1.2 : 0.8}
            opacity={line.ring === -1 ? 0.35 : 0.25 + Math.sin(time * 2 + i * 0.5) * 0.15} />
        ))}
        {geometry.points.map((pt, i) => {
          const pulse = Math.sin(time * 3 + i * 0.7);
          return (
            <g key={`pt-${i}`}>
              <circle cx={pt.x} cy={pt.y} r={2.5 + pulse * 0.8} fill="#dc2626" opacity="0.8" />
              <circle cx={pt.x} cy={pt.y} r={5 + pulse * 1.5} fill="none" stroke="#dc2626" strokeWidth="0.5" opacity="0.25" />
            </g>
          );
        })}
        <circle cx="100" cy="100" r={7 + Math.sin(time * 1.8) * 2} fill="none" stroke="white" strokeWidth="1.5" opacity="0.75" />
        <circle cx="100" cy="100" r="2.5" fill="white" opacity={0.5 + Math.sin(time * 4) * 0.3} />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────
//  CRT OVERLAY
// ─────────────────────────────────────────────
const CRTOverlay = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.02), rgba(0,0,255,0.04))',
      backgroundSize: '100% 3px, 4px 100%'
    }} />
    <div className="absolute inset-0" style={{
      background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.7) 100%)'
    }} />
  </div>
);

// ─────────────────────────────────────────────
//  GLITCH TEXT
// ─────────────────────────────────────────────
const GLYPHS = "\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u2234\u2235\u2295\u2297\u2609\u263D\u2605\u26A1\u2318\u221E\u2299";

const GlitchText = ({ text, active, speed = 30, className = "" }) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let iter = 0;
    const iv = setInterval(() => {
      setDisplay(text.split("").map((c, i) => {
        if (c === ' ') return ' ';
        if (i < iter) return text[i];
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join(""));
      if (iter >= text.length) clearInterval(iv);
      iter += 1 / 3;
    }, speed);
    return () => clearInterval(iv);
  }, [text, active, speed]);
  return <span className={className}>{display}</span>;
};

// ─────────────────────────────────────────────
//  TYPEWRITER TEXT
// ─────────────────────────────────────────────
const TypewriterText = ({ text, speed = 20, onComplete, className = "" }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); onComplete?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse" style={{ opacity: 0.7 }}>{"▌"}</span>}
    </span>
  );
};

// ─────────────────────────────────────────────
//  RITUAL PROGRESS BAR
// ─────────────────────────────────────────────
const RitualProgress = ({ progress, phase }) => {
  const labels = { invoking: "INVOKING", communing: "COMMUNING", receiving: "RECEIVING", complete: "COMPLETE" };
  return (
    <div className="w-full max-w-sm mx-auto mt-6">
      <div className="h-0.5 w-full bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7f1d1d, #dc2626, #fbbf24)'
          }} />
      </div>
      <div className="text-center mt-2 text-xs tracking-[0.3em] text-red-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {labels[phase] || phase?.toUpperCase() || ""}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  NOISE BACKGROUND
// ─────────────────────────────────────────────
const NoiseBackground = () => (
  <div className="fixed inset-0 pointer-events-none opacity-10" style={{ zIndex: 0, backgroundImage: `url("${NOISE_TEXTURE_URL}")` }} />
);

// ─────────────────────────────────────────────
//  EXPANDABLE SECTION (Accordion)
// ─────────────────────────────────────────────
const ExpandableSection = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden mb-3" style={{ background: 'rgba(10,10,10,0.8)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-900/50 transition-colors">
        <span className="flex items-center gap-2 text-sm tracking-wide" style={{ fontFamily: 'Cinzel, serif', color: '#dc2626' }}>
          <span className="text-base">{icon}</span>
          {title}
        </span>
        <span className="text-neutral-600 text-xs transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          {"▼"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-neutral-400 text-sm leading-relaxed border-t border-neutral-800/50"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  JOURNAL OVERLAY
// ─────────────────────────────────────────────
const JournalOverlay = ({ entries, onClose, onDelete, onClear, onSelect }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl border border-neutral-800 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-lg tracking-wider text-red-600" style={{ fontFamily: 'Cinzel, serif' }}>
            {"☥"} GRIMOIRE JOURNAL
          </h2>
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <button onClick={onClear} className="text-xs text-neutral-600 hover:text-red-700 transition-colors"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                CLEAR ALL
              </button>
            )}
            <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors text-xl leading-none">
              {"×"}
            </button>
          </div>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-neutral-600 text-sm">
              <div className="text-3xl mb-3 opacity-30">{"☉"}</div>
              No readings recorded yet.
              <br />Consult the Oracle to begin your journal.
            </div>
          ) : entries.map((entry) => (
            <div key={entry.id}
              className="group border border-neutral-800/70 rounded-lg p-4 hover:border-neutral-700 transition-colors cursor-pointer"
              style={{ background: 'rgba(20,20,20,0.6)' }}
              onClick={() => { onSelect?.(entry); onClose(); }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-700 text-xs">{formatChapterNumber(entry.chapter)}</span>
                    <span className="text-neutral-300 text-xs truncate" style={{ fontFamily: 'Cinzel, serif' }}>
                      {entry.title}
                    </span>
                  </div>
                  <div className="text-neutral-500 text-xs truncate">{entry.question}</div>
                  <div className="text-neutral-700 text-xs mt-1">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {" · "} Gematria: {entry.gematria}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-700 transition-all text-sm ml-2">
                  {"✕"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  GEMATRIA CALCULATOR UI
// ─────────────────────────────────────────────
const GematriaMode = ({ onBack }) => {
  const [input, setInput] = useState("");
  const result = useMemo(() => input.trim() ? calculateGematria(input) : null, [input]);
  const corr = useMemo(() => result ? findCorrespondences(result.simple) : [], [result]);

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <button onClick={onBack}
        className="text-neutral-600 hover:text-red-600 text-xs tracking-widest mb-6 transition-colors"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {"←"} RETURN TO ORACLE
      </button>

      <h2 className="text-2xl text-center text-red-600 mb-2 tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>
        Gematria Calculator
      </h2>
      <p className="text-center text-neutral-600 text-xs mb-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        English Qabalah: A=1 B=2 ... Z=26
      </p>

      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Enter a word or phrase..."
        className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-3 text-neutral-200 text-sm
          placeholder-neutral-700 focus:outline-none focus:border-red-800 transition-colors"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      />

      {result && (
        <div className="mt-8 space-y-6">
          {/* Value display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-red-600 mb-1" style={{ fontFamily: 'Cinzel, serif', textShadow: '0 0 30px rgba(220,38,38,0.3)' }}>
              {result.simple}
            </div>
            <div className="text-neutral-600 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {result.reductionSteps.join(" {\u2192} ")} ({result.raw} letter{result.raw !== 1 ? 's' : ''})
            </div>
          </div>

          {/* Correspondences */}
          {corr.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-600 tracking-widest mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                CORRESPONDENCES
              </div>
              {corr.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    c.type === 'direct' ? 'bg-red-900/40 text-red-500' :
                    c.type === 'square' ? 'bg-amber-900/40 text-amber-500' :
                    c.type === 'factor' ? 'bg-neutral-800 text-neutral-400' :
                    'bg-neutral-800/50 text-neutral-500'
                  }`}>{c.type}</span>
                  <span className="text-neutral-400">{c.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hebrew Letters reference */}
          <div className="border-t border-neutral-800 pt-4">
            <div className="text-xs text-neutral-600 tracking-widest mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
              HEBREW LETTER TABLE
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {Object.entries(HEBREW_LETTERS).map(([name, data]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-red-800 w-4 text-center">{data.letter}</span>
                  <span className="text-neutral-600 w-8 text-right">{data.value}</span>
                  <span className="text-neutral-500">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  MAIN APPLICATION
// ─────────────────────────────────────────────
const App = () => {
  // ── Phase: init | input | ritual | revelation ──
  const [phase, setPhase] = useState("init");
  const [mode, setMode] = useState("oracle"); // oracle | gematria
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  // ── Oracle state ──
  const [question, setQuestion] = useState("");
  const [drawnChapter, setDrawnChapter] = useState(null);
  const [gematriaResult, setGematriaResult] = useState(null);
  const [correspondences, setCorrespondences] = useState([]);
  const [ritualProgress, setRitualProgress] = useState(0);
  const [ritualPhase, setRitualPhase] = useState("invoking");
  const [glitchActive, setGlitchActive] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Hooks ──
  const audioIntensity = phase === "ritual" ? 1.0 : phase === "revelation" ? 0.6 : 0.3;
  const { playBell } = useAudioEngine(audioEnabled, audioIntensity);
  const oracle = useAIOracle();
  const journal = useJournal();

  // ── Font injection ──
  useEffect(() => {
    if (!document.querySelector('link[href*="Cinzel"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
  }, []);

  // ── Perform divination ──
  const performDivination = useCallback(() => {
    if (!question.trim()) return;
    const gem = calculateGematria(question);
    const corr = findCorrespondences(gem.simple);
    const idx = gem.simple % LIBER_333.length;
    const chapter = LIBER_333[idx];

    setGematriaResult(gem);
    setCorrespondences(corr);
    setDrawnChapter(chapter);
    setPhase("ritual");
    setRitualProgress(0);
    setRitualPhase("invoking");
    setGlitchActive(false);
    setSaved(false);
    oracle.resetOracle();

    if (audioEnabled) playBell();

    // Ritual animation: 5 seconds
    const duration = 5000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setRitualProgress(pct);

      if (pct < 33) setRitualPhase("invoking");
      else if (pct < 66) setRitualPhase("communing");
      else if (pct < 100) setRitualPhase("receiving");
      else {
        setRitualPhase("complete");
        setPhase("revelation");
        setGlitchActive(true);
        if (audioEnabled) playBell();
        // Auto-consult the AI oracle
        oracle.consultOracle(question, chapter, gem, corr);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [question, audioEnabled, playBell, oracle]);

  // ── Save reading to journal ──
  const saveReading = useCallback(async () => {
    if (!drawnChapter || saved) return;
    await journal.addEntry({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      question,
      chapter: drawnChapter.chapter,
      title: drawnChapter.title,
      gematria: gematriaResult?.simple || 0,
      interpretation: oracle.text || null,
    });
    setSaved(true);
  }, [drawnChapter, question, gematriaResult, oracle.text, saved, journal]);

  // ── Reset ──
  const resetToInput = useCallback(() => {
    setPhase("input");
    setQuestion("");
    setDrawnChapter(null);
    setGematriaResult(null);
    setCorrespondences([]);
    setGlitchActive(false);
    setSaved(false);
    oracle.resetOracle();
  }, [oracle]);

  // ── Handle enter key ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && question.trim()) performDivination();
  };

  // ── Select journal entry to re-view ──
  const viewJournalEntry = useCallback((entry) => {
    const ch = LIBER_333.find(c => c.chapter === entry.chapter);
    if (!ch) return;
    setQuestion(entry.question);
    setDrawnChapter(ch);
    setGematriaResult(calculateGematria(entry.question));
    setCorrespondences(findCorrespondences(entry.gematria));
    setPhase("revelation");
    setGlitchActive(false);
  }, []);

  // ── Render ──
  const particleActive = phase === "ritual" || phase === "revelation";
  const particleIntensity = phase === "ritual" ? 1.5 : 0.4;

  return (
    <div className="min-h-screen bg-black text-neutral-300 relative overflow-x-hidden"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}>

      {/* Layers */}
      <NoiseBackground />
      <ParticleCanvas active={particleActive} intensity={particleIntensity} />
      <CRTOverlay />

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-b border-neutral-900/80"
        style={{ zIndex: 40, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-4">
          <span className="text-red-700 text-sm tracking-[0.2em]" style={{ fontFamily: 'Cinzel, serif' }}>
            LIBER CCCXXXIII
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mode === "oracle" ? (
            <button onClick={() => setMode("gematria")}
              className="text-neutral-600 hover:text-red-600 text-xs px-2 py-1 transition-colors tracking-wider">
              GEMATRIA
            </button>
          ) : (
            <button onClick={() => { setMode("oracle"); if (phase === "init") setPhase("init"); }}
              className="text-neutral-600 hover:text-red-600 text-xs px-2 py-1 transition-colors tracking-wider">
              ORACLE
            </button>
          )}
          <button onClick={() => setShowJournal(true)}
            className="text-neutral-600 hover:text-red-600 text-xs px-2 py-1 transition-colors tracking-wider relative">
            GRIMOIRE
            {journal.entries.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-900 rounded-full text-[8px] flex items-center justify-center text-red-300">
                {journal.entries.length}
              </span>
            )}
          </button>
          <button onClick={() => setAudioEnabled(!audioEnabled)}
            className={`text-xs px-2 py-1 transition-colors tracking-wider ${audioEnabled ? 'text-red-600' : 'text-neutral-700 hover:text-neutral-500'}`}>
            {audioEnabled ? "♫" : "♪"}
          </button>
        </div>
      </nav>

      {/* Journal Overlay */}
      {showJournal && (
        <JournalOverlay
          entries={journal.entries}
          onClose={() => setShowJournal(false)}
          onDelete={journal.removeEntry}
          onClear={journal.clearAll}
          onSelect={viewJournalEntry}
        />
      )}

      {/* Main Content */}
      <main className="relative pt-16 min-h-screen flex flex-col items-center justify-center px-4 pb-8" style={{ zIndex: 2 }}>

        {/* ══ GEMATRIA MODE ══ */}
        {mode === "gematria" && (
          <GematriaMode onBack={() => setMode("oracle")} />
        )}

        {/* ══ ORACLE MODE ══ */}
        {mode === "oracle" && (
          <>
            {/* ── INIT PHASE ── */}
            {phase === "init" && (
              <div className="text-center max-w-lg mx-auto">
                <div className="mb-8">
                  <AnimatedSigil input="LIBER CCCXXXIII" size={160} spinning={true} glowing={true} />
                </div>
                <h1 className="text-3xl md:text-4xl tracking-wider text-red-600 mb-3"
                  style={{ fontFamily: 'Cinzel, serif', textShadow: '0 0 40px rgba(220,38,38,0.2)' }}>
                  THE BOOK OF LIES
                </h1>
                <p className="text-neutral-600 text-xs tracking-[0.25em] mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                  LIBER CCCXXXIII
                </p>
                <p className="text-neutral-700 text-xs mb-10" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  93 chapters {"·"} gematric divination {"·"} AI oracle
                </p>
                <button
                  onClick={() => setPhase("input")}
                  className="border border-red-900/50 text-red-600 px-8 py-3 rounded-lg text-sm tracking-[0.2em]
                    hover:bg-red-900/10 hover:border-red-700/50 transition-all duration-500"
                  style={{ fontFamily: 'Cinzel, serif' }}>
                  BEGIN CONSULTATION
                </button>
              </div>
            )}

            {/* ── INPUT PHASE ── */}
            {phase === "input" && (
              <div className="w-full max-w-lg mx-auto text-center">
                <div className="mb-8 opacity-50">
                  <AnimatedSigil input="query" size={80} spinning={true} glowing={false} />
                </div>
                <h2 className="text-xl text-red-600 tracking-wider mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                  Speak Your Question
                </h2>
                <p className="text-neutral-600 text-xs mb-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  The gematria of your words will draw the chapter.
                </p>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder="What do you seek to know?"
                  className="w-full bg-transparent border-b-2 border-neutral-800 px-2 py-3 text-neutral-200 text-center text-lg
                    placeholder-neutral-700 focus:outline-none focus:border-red-800 transition-colors"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
                <button
                  onClick={performDivination}
                  disabled={!question.trim()}
                  className={`mt-8 border px-8 py-3 rounded-lg text-sm tracking-[0.2em] transition-all duration-500
                    ${question.trim()
                      ? 'border-red-900/50 text-red-600 hover:bg-red-900/10 hover:border-red-700/50 cursor-pointer'
                      : 'border-neutral-800 text-neutral-700 cursor-not-allowed'}`}
                  style={{ fontFamily: 'Cinzel, serif' }}>
                  DIVINE
                </button>
              </div>
            )}

            {/* ── RITUAL PHASE ── */}
            {phase === "ritual" && drawnChapter && (
              <div className="text-center max-w-md mx-auto">
                <div className="mb-6">
                  <AnimatedSigil input={question} size={200} spinning={true} glowing={true} />
                </div>
                <div className="text-neutral-600 text-xs tracking-widest mb-2">
                  GEMATRIA: {gematriaResult?.simple}
                </div>
                <div className="text-red-700/50 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
                  Drawing Chapter {formatChapterNumber(drawnChapter.chapter)}...
                </div>
                <RitualProgress progress={ritualProgress} phase={ritualPhase} />
              </div>
            )}

            {/* ── REVELATION PHASE ── */}
            {phase === "revelation" && drawnChapter && (
              <div className="w-full max-w-2xl mx-auto">
                {/* Chapter Header */}
                <div className="text-center mb-8">
                  <div className="mb-4">
                    <AnimatedSigil input={question || drawnChapter.title} size={120} spinning={true} glowing={true} />
                  </div>
                  <div className="text-neutral-600 text-xs tracking-widest mb-2">
                    CHAPTER
                  </div>
                  <div className="text-5xl md:text-6xl font-bold text-red-600 mb-2"
                    style={{ fontFamily: 'Cinzel, serif', textShadow: '0 0 40px rgba(220,38,38,0.3)' }}>
                    <GlitchText text={formatChapterNumber(drawnChapter.chapter)} active={glitchActive} speed={40} />
                  </div>
                  <div className="text-lg text-neutral-300 tracking-wider mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                    <GlitchText text={drawnChapter.title} active={glitchActive} speed={25} />
                  </div>
                  {gematriaResult && (
                    <div className="text-xs text-neutral-600 mt-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      Gematria: {gematriaResult.simple} {"→"} {gematriaResult.reductionSteps.join(" {\u2192} ")}
                      {drawnChapter.element && ELEMENT_SYMBOLS[drawnChapter.element] &&
                        ` ${ELEMENT_SYMBOLS[drawnChapter.element]}`}
                    </div>
                  )}
                </div>

                {/* Key Text */}
                <div className="mb-8 border-l-2 border-red-900/40 pl-4 py-2">
                  <TypewriterText
                    text={drawnChapter.text}
                    speed={15}
                    className="text-neutral-400 text-sm leading-relaxed italic"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>

                {/* Expandable Sections */}
                <div className="space-y-0">
                  <ExpandableSection title="COMMENTARY" icon={"☥"} defaultOpen={true}>
                    <div className="pt-3 whitespace-pre-wrap">
                      {drawnChapter.commentary}
                    </div>
                  </ExpandableSection>

                  <ExpandableSection title="ORACLE OF THE ABYSS" icon={"☉"} defaultOpen={false}>
                    <div className="pt-3">
                      {oracle.loading ? (
                        <div className="flex items-center gap-2 text-red-800">
                          <span className="animate-pulse">{"☉"}</span>
                          <span className="text-xs">The Oracle speaks from the depths...</span>
                        </div>
                      ) : oracle.error ? (
                        <div className="text-red-800 text-xs">
                          The Abyss refuses to answer: {oracle.error}
                          <button onClick={() => oracle.consultOracle(question, drawnChapter, gematriaResult, correspondences)}
                            className="ml-2 underline hover:text-red-600">Retry</button>
                        </div>
                      ) : oracle.text ? (
                        <div className="whitespace-pre-wrap text-neutral-400 leading-relaxed">
                          {oracle.text}
                        </div>
                      ) : (
                        <button onClick={() => oracle.consultOracle(question, drawnChapter, gematriaResult, correspondences)}
                          className="text-red-800 hover:text-red-600 text-xs transition-colors">
                          Invoke the Oracle...
                        </button>
                      )}
                    </div>
                  </ExpandableSection>

                  <ExpandableSection title="QABALISTIC ANALYSIS" icon={"♁"} defaultOpen={false}>
                    <div className="pt-3 space-y-3">
                      {(() => {
                        const info = getSephiraInfo(drawnChapter.sephira);
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-neutral-600">Sephira:</span>{" "}
                                <span className="text-neutral-300">{drawnChapter.sephira}</span>
                                <span className="text-neutral-600 ml-1">({info.meaning})</span>
                              </div>
                              <div>
                                <span className="text-neutral-600">Path:</span>{" "}
                                <span className="text-neutral-300">{drawnChapter.path}</span>
                                {drawnChapter.path !== "—" && drawnChapter.path !== "∅" && HEBREW_LETTERS[drawnChapter.path] && (
                                  <span className="text-red-800 ml-1">{HEBREW_LETTERS[drawnChapter.path].letter}</span>
                                )}
                              </div>
                              <div>
                                <span className="text-neutral-600">Element:</span>{" "}
                                <span className="text-neutral-300">{drawnChapter.element}</span>
                                {ELEMENT_SYMBOLS[drawnChapter.element] && (
                                  <span className="ml-1">{ELEMENT_SYMBOLS[drawnChapter.element]}</span>
                                )}
                              </div>
                              <div>
                                <span className="text-neutral-600">Tarot:</span>{" "}
                                <span className="text-neutral-300">{drawnChapter.tarot}</span>
                              </div>
                              {info.planet !== "—" && (
                                <div>
                                  <span className="text-neutral-600">Planet:</span>{" "}
                                  <span className="text-neutral-300">{info.planet}</span>
                                </div>
                              )}
                              {info.godName !== "—" && (
                                <div>
                                  <span className="text-neutral-600">God Name:</span>{" "}
                                  <span className="text-neutral-300">{info.godName}</span>
                                </div>
                              )}
                              {info.archangel !== "—" && (
                                <div>
                                  <span className="text-neutral-600">Archangel:</span>{" "}
                                  <span className="text-neutral-300">{info.archangel}</span>
                                </div>
                              )}
                            </div>

                            {/* Correspondences */}
                            {correspondences.length > 0 && (
                              <div className="border-t border-neutral-800/50 pt-3 mt-3">
                                <div className="text-xs text-neutral-600 mb-2">GEMATRIC CORRESPONDENCES ({gematriaResult?.simple})</div>
                                {correspondences.map((c, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs mb-1">
                                    <span className={`px-1 py-0.5 rounded ${
                                      c.type === 'direct' ? 'bg-red-900/30 text-red-600' :
                                      c.type === 'square' ? 'bg-amber-900/30 text-amber-600' :
                                      'bg-neutral-800/50 text-neutral-500'
                                    }`}>{c.type}</span>
                                    <span className="text-neutral-500">{c.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Sephira color indicator */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-3 h-3 rounded-full border border-neutral-700"
                                style={{ backgroundColor: info.color, boxShadow: `0 0 8px ${info.color}40` }} />
                              <span className="text-xs text-neutral-600">
                                Color of {drawnChapter.sephira}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </ExpandableSection>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                  <button onClick={saveReading}
                    disabled={saved}
                    className={`border px-6 py-2.5 rounded-lg text-xs tracking-[0.15em] transition-all duration-300
                      ${saved
                        ? 'border-neutral-800 text-neutral-700 cursor-default'
                        : 'border-red-900/50 text-red-600 hover:bg-red-900/10 hover:border-red-700/50'}`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    {saved ? "RECORDED" : "SAVE TO GRIMOIRE"}
                  </button>
                  <button onClick={resetToInput}
                    className="border border-neutral-800 text-neutral-500 px-6 py-2.5 rounded-lg text-xs tracking-[0.15em]
                      hover:border-neutral-700 hover:text-neutral-400 transition-all duration-300"
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    NEW READING
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative text-center py-4 text-neutral-800 text-xs" style={{ zIndex: 2, fontFamily: 'JetBrains Mono, monospace' }}>
        Do what thou wilt shall be the whole of the Law.
      </footer>
    </div>
  );
};

export default App;

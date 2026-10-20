import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Share2, Download, RefreshCw, Edit3, Sparkles, Heart, X, Check, Copy, AlertCircle, Sun, CloudRain, Snowflake, Settings } from 'lucide-react';

// ==========================================
// CẤU HÌNH TRÒ CHƠI / GAME CONFIG
// ==========================================
const CONFIG = {
  TOTAL_FLOWERS: 8, // Đúng 8 bông hoa để nở
  MIN_DOUBLE_CLICKS: 5, // 5 - 8 lần đúp mỗi bông
  MAX_DOUBLE_CLICKS: 8,
  WILT_TIME_MS: 4000, // Hơn 4 giây bỏ mặc là hoa héo rũ, tụt 1 giai đoạn
  MISS_RATE: 0.18, // Xác suất trật 18% (15-20%)
  MAX_CONSECUTIVE_MISSES: 2, // Chống bực: không bao giờ trật quá 2 lần liên tiếp
  TAP_DISTANCE_THRESHOLD: 24, // Khoảng cách pixel thật tối đa giữa 2 lần chạm
  DOUBLE_TAP_INTERVAL: 300, // ms giữa 2 lần chạm
};

// ==========================================
// BẢNG MÀU RETRO 16 MÀU / RETRO PALETTE
// ==========================================
const PALETTE: Record<string, string> = {
  '.': 'transparent',
  '#': '#22140c', // Outline đậm
  'd': '#53341e', // Đất sẫm
  'D': '#7e5130', // Đất sáng
  's': '#a8754b', // Đất xới
  'g': '#2b4a1c', // Thân xanh đậm
  'G': '#4c7a28', // Lá xanh trung
  'l': '#7fa83a', // Lá xanh tươi
  'w': '#fffef0', // Trắng ngà
  'c': '#e6d8b8', // Kem / bóng trắng
  'r': '#ab2626', // Đỏ hồng nhung
  'R': '#d63434', // Đỏ tươi
  'm': '#831a1a', // Đỏ đậm bóng
  't': '#f36868', // Tulip hồng san hô
  'T': '#ff9f9f', // Tulip hồng phấn
  'y': '#f5af19', // Hướng dương vàng
  'Y': '#fde24f', // Vàng rực
  'b': '#4a2810', // Nhụy nâu hướng dương / lông chim
  'p': '#f06292', // Anh đào hồng / củ cải hồng
  'P': '#f8bbd0', // Anh đào phấn
  'q': '#880e4f', // Anh đào đậm
  'u': '#54a0ff', // Nước xanh
  'U': '#99d0ff', // Bọt nước
  'x': '#ffd32a', // Lấp lánh vàng
  'B': '#1e90ff', // Lông chim xanh
};

// ==========================================
// SPRITE PIXEL ART ĐỊNH NGHĨA DẠNG MA TRẬN
// ==========================================
const SPRITE_WATERING_CAN = [
  "...####.....",
  "..#uuuu#....",
  ".#uuuuuu####",
  "#uuuuuuuuuu#",
  "#uuuuuuuuuu#",
  "#uuuuuuuuuu#",
  ".#uuuuuuuu#.",
  "..########..",
  "....#uu#....",
  "....####...."
];

const SPRITE_SEED = [
  "........",
  "...##...",
  "..#DD#..",
  ".#DwwD#.",
  "#DDssDD#",
  "#dddddd#",
  ".######.",
  "........"
];

const SPRITE_SPROUT = [
  "..........",
  "...l.l....",
  "..lGlGl...",
  "...lGg....",
  "....g.....",
  "...#g#....",
  "..#DssD#..",
  ".#DddddD#.",
  "..######..",
  ".........."
];

const SPRITE_STEM = [
  "............",
  ".....lG.....",
  "....lGl.....",
  ".....g......",
  "...lGggGl...",
  "..lGGggGGl..",
  "...l.gg.l...",
  ".....gg.....",
  "....lgg.....",
  "....lGg.....",
  ".....g......",
  "...#DssD#...",
  "..#DddddD#..",
  "...######..."
];

const SPRITE_WILTED = [
  "............",
  "............",
  "....####....",
  "...#DDDD#...",
  "....#GG#....",
  ".....#g#....",
  "......#g#...",
  ".......#g#..",
  "..#DDDD#.#..",
  ".#DddddD#...",
  "..######....",
  "............"
];

const SPRITE_BIRD = [
  "...##.....",
  "..#yy##...",
  ".#yyyyy#..",
  "#BBBBBB##.",
  ".#BBBBBBB#",
  "..#BBBB#..",
  "...#dd#...",
  ".........."
];

const BUTTERFLY_SPRITES: Record<string, { open: string[]; flap: string[] }> = {
  blue: {
    open: [
      "#B#....#B#",
      "#BB#..#BB#",
      ".#BB##BB#.",
      "..#B##B#..",
      "...####...",
      "..#B##B#..",
      ".#BB##BB#.",
      "#B#....#B#"
    ],
    flap: [
      "...#u..u#...",
      "...#uBBu#...",
      "....#BB#....",
      "....####....",
      "....#BB#....",
      "...#uBBu#...",
      "...#u..u#...",
      "............"
    ]
  },
  yellow: {
    open: [
      "#y#....#y#",
      "#YY#..#YY#",
      ".#YY##YY#.",
      "..#y##y#..",
      "...####...",
      "..#y##y#..",
      ".#YY##YY#.",
      "#y#....#y#"
    ],
    flap: [
      "...#Y..Y#...",
      "...#YyyY#...",
      "....#yy#....",
      "....####....",
      "....#yy#....",
      "...#YyyY#...",
      "...#Y..Y#...",
      "............"
    ]
  },
  pink: {
    open: [
      "#p#....#p#",
      "#PP#..#PP#",
      ".#PP##PP#.",
      "..#p##p#..",
      "...####...",
      "..#p##p#..",
      ".#PP##PP#.",
      "#p#....#p#"
    ],
    flap: [
      "...#P..P#...",
      "...#PppP#...",
      "....#pp#....",
      "....####....",
      "....#pp#....",
      "...#PppP#...",
      "...#P..P#...",
      "............"
    ]
  }
};

const SPRITE_BUTTERFLY = BUTTERFLY_SPRITES.blue.open;

const SPRITE_RADISH = [
  "....GGG...",
  "...lGGGl..",
  "....gGg...",
  "...#www#..",
  "..#wwppw#.",
  "..#wwppw#.",
  "..#wwppw#.",
  "...#www#..",
  "....#w#...",
  "....#w#...",
  ".....#....",
  ".........."
];

const ROSE_SPRITES = {
  bud: [
    "....##....",
    "...#RR#...",
    "..#mRRm#..",
    "..#gRRg#..",
    "...#gg#...",
    "....gg....",
    "..lGggGl..",
    "....gg...."
  ],
  half: [
    "...#RR#...",
    "..#mRRm#..",
    ".#RRmRRm#.",
    ".#RRRRRR#.",
    "..#gRRg#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ],
  full: [
    "...####...",
    "..#RRRR#..",
    ".#mRRmRR#.",
    "#RRmRRmRR#",
    "#RRRRRRRR#",
    ".#mRRRRm#.",
    "..#gRRg#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ]
};

const TULIP_SPRITES = {
  bud: [
    "....##....",
    "...#tt#...",
    "..#tTTt#..",
    "..#tTTt#..",
    "...#gg#...",
    "....gg....",
    "..lGggGl..",
    "....gg...."
  ],
  half: [
    "...#..#...",
    "..#t##t#..",
    ".#tTTTTt#.",
    ".#tTTTTt#.",
    "..#tttt#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ],
  full: [
    "..#....#..",
    ".#t#..#t#.",
    "#tTT##TTt#",
    "#tTTTTTTt#",
    ".#tTTTTt#.",
    "..#tttt#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ]
};

const SUNFLOWER_SPRITES = {
  bud: [
    "....##....",
    "...#yy#...",
    "..#yYYy#..",
    "..#gYYg#..",
    "...#gg#...",
    "....gg....",
    "..lGggGl..",
    "....gg...."
  ],
  half: [
    "..#y##y#..",
    ".#yYYYYy#.",
    ".#yYbbYy#.",
    "..#yYYy#..",
    "...#gg#...",
    "....gg....",
    "..lGggGl..",
    "....gg...."
  ],
  full: [
    ".#y#y##y#y.",
    "#yYYYYYYYYy#",
    "yYYbbbbbbYYy",
    "#YYbbbbbbYY#",
    "#yYYYYYYYYy#",
    ".#y#y##y#y.",
    "....#gg#....",
    "...lGggGl...",
    ".....gg....."
  ]
};

const CHERRY_SPRITES = {
  bud: [
    "....##....",
    "...#pp#...",
    "..#pPPp#..",
    "..#gPPg#..",
    "...#gg#...",
    "....gg....",
    "..lGggGl..",
    "....gg...."
  ],
  half: [
    "...#pp#...",
    "..#pPPp#..",
    ".#pPxxPp#.",
    ".#pPPPPp#.",
    "..#pppp#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ],
  full: [
    "..#p##p#..",
    ".#pPPPPp#.",
    "#pPPxxPPp#",
    "#pPPxxPPp#",
    ".#pPPPPp#.",
    "..#p##p#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ]
};

const DAISY_SPRITES = {
  bud: [
    "....##....",
    "...#ww#...",
    "..#wccw#..",
    "..#gccg#..",
    "...#gg#...",
    "....gg....",
    "..lGggGl..",
    "....gg...."
  ],
  half: [
    "...#ww#...",
    "..#wccw#..",
    ".#wcYYcw#.",
    ".#wccccw#.",
    "..#wwww#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ],
  full: [
    "..#w##w#..",
    ".#wccccw#.",
    "#wcYYYYcw#",
    "#wcYYYYcw#",
    ".#wccccw#.",
    "..#w##w#..",
    "...#gg#...",
    "..lGggGl..",
    "....gg...."
  ]
};

const FLOWER_TYPES = [
  { id: 'rose', name: 'Hoa Hồng', sprites: ROSE_SPRITES },
  { id: 'tulip', name: 'Hoa Tulip', sprites: TULIP_SPRITES },
  { id: 'sunflower', name: 'Hướng Dương', sprites: SUNFLOWER_SPRITES },
  { id: 'cherry', name: 'Anh Đào', sprites: CHERRY_SPRITES },
  { id: 'daisy', name: 'Cúc Họa Mi', sprites: DAISY_SPRITES }
];

// ==========================================
// CÂU TRÊU GHẸO THEO TỪNG GIAI ĐOẠN & TRẬT LẤT
// ==========================================
const STAGE_TAUNTS = {
  seed: [
    "vừa chôn hạt giống xuống đó. liệu mà đúp cho nó lớn, bỏ bê là giận nha.",
    "hạt này khó chiều lắm đó [Tên] ơi, tay bấm mỏi thì nghỉ tí rồi bấm tiếp.",
    "đất này màu mỡ ghê, mọc hoa hay mọc cục tức thì tùy công đúp nha :P",
    "gieo mầm hi vọng... mà hy vọng đúp đừng có lười!"
  ],
  sprout: [
    "nhú được tí mầm rồi kìa! tưởng [Tên] bỏ cuộc rồi chứ.",
    "mới có hai lá mầm bé tí, đừng nhìn chằm chằm nó ngại đó.",
    "cố lên, nhìn mầm non yếu ớt giống tính nết ai đó ghê.",
    "nhú tí xanh xanh rồi, đúp tiếp đi đừng dừng lại!"
  ],
  stem: [
    "lên được thân lá rồi nè, tay nghề làm nông cũng không tồi.",
    "đúp mỏi tay chưa? chưa thì đúp tiếp, hoa chưa ưng đâu.",
    "xanh tươi mơn mởn rồi, ráng tí nữa đừng có lười nha [Tên].",
    "thân cây đang vươn lên, cố tí nữa là có hoa đem khoe rồi."
  ],
  bud: [
    "sắp nở rồi... lừa đó, đúp tiếp đi :))",
    "nụ ngại lắm, gọi nó thêm tí nữa đi.",
    "còn đúng 1 lần nữa thôi... thề! (thực ra còn lâu nha :D)",
    "nụ khép lại rồi kìa, ai bảo bấm ngập ngừng chi!",
    "nụ rung rinh sắp bung... ủa chưa bung, đúp mạnh dạn lên!"
  ],
  half: [
    "hé rồi hé rồi! đừng chớp mắt kẻo bỏ lỡ nha.",
    "cánh hoa rung rinh rồi kìa, nhanh tay lên kẻo hoa dỗi.",
    "thấy màu hoa chưa? đẹp gần bằng [Tên] rồi đó.",
    "còn tí xíu nữa thôi, lần này thề thật không lừa nữa!"
  ],
  wilted: [
    "bỏ mặc người ta hơn 4 giây là héo liền, đúp cứu hoa gấp!",
    "cây giận dỗi tụt lùi một bậc rồi kìa, vô tâm quá hà :<",
    "hoa dỗi rồi, đúp dỗ nó lẹ lên [Tên] ơi!",
    "khát khô cả cổ rồi, tưới nước (đúp) ngay không là tèo đó!"
  ]
};

const MISS_TAUNTS = {
  dodge: [
    "né được rồi hehe. à mà thôi, đúp lại đi :))",
    "hoa này né dẻo ghê chưa! bình tưới tưới trúng khoảng không rồi.",
    "né đỉnh chóp! [Tên] đúp lại lẹ xem hoa có né kịp nữa không."
  ],
  miss_water: [
    "tưới trúng đất, trượt hoa. tay cầm bình tưới hay cầm gì vậy :P",
    "tưới lệch cả mét rồi [Tên] ơi, nhắm cho chuẩn vào!",
    "nước rơi một đằng, hoa đứng một nẻo, tưới lại đi nào."
  ],
  bird_steal: [
    "chim ăn mất hạt rồi, gieo lại đi :D",
    "con chim nó bảo hạt ngon quá, cướp luôn rồi kìa!",
    "vừa gieo xong đã bị chim cuỗm mất, để lại mấy cọng lông thôi!"
  ],
  seed_roll: [
    "hạt vừa gieo bật nảy lăn đi mất tiêu rồi, gieo lại nào!",
    "hạt này hiếu động ghê, lăn lốc sang chỗ khác rồi.",
    "trượt tay hạt lăn mất rồi, đặt lại hạt mới đi [Tên] ơi."
  ],
  distant_tap: [
    "đúp lệch rồi, đúp cho chuẩn nào!",
    "ngón tay run hả [Tên]? hai lần bấm cách xa nhau quá kìa.",
    "chạm hai chỗ khác nhau rồi, gõ vào đúng một điểm thôi!"
  ],
  fake_veggie: [
    "trật lất, hoa này nhầm là củ cải rồi :D đúp thêm đi!",
    "tưởng hoa nở, ai dè nở ra củ cải mập mạp! đúp tiếp để biến thành hoa thật nào.",
    "trồng hoa mà thu hoạch củ cải, tay nghề nông dân lạ ghê ha."
  ],
  butterfly_block: [
    "con bướm đậu che mất tiêu rồi, đuổi nó đi rồi đúp lại nha!",
    "bướm tranh chỗ với hoa kìa, đúp làm bướm bay đi rồi đúp lại nhé.",
    "hoa bị bướm che khuất rồi, đúp thêm nhịp nữa nào [Tên]!"
  ]
};

const BLOOM_WISHES = [
  "chúc [Tên] 20/10 thật vui, bớt quạu lại và đừng giận mình quá 5 phút nha.",
  "hoa này nở vì bạn đó. công đúp mỏi tay xem như bài tập ngón tay 20/10.",
  "chúc [Tên] luôn đáng yêu, ăn ngon ngủ kỹ và không bao giờ bị deadline dí.",
  "hoa này tặng cho người kiên nhẫn nhất mình biết. chầu trà sữa thì tính sau.",
  "20/10 vui vẻ! chúc [Tên] mỗi ngày đều nhiều niềm vui như số lần vừa đúp hoa.",
  "bông hoa nở rực rỡ rồi. người nhận hoa hôm nay cũng phải rực rỡ y như vậy nha!",
  "chúc [Tên] ngày 20/10 ngập tràn quà cáp, hoa tươi và những điều ngọt ngào nhất.",
  "chăm hoa cực vậy mà cũng ráng đúp cho nở, xứng đáng được 100 điểm kiên trì!",
  "chúc [Tên] cười nhiều hơn hôm qua, bớt suy nghĩ linh tinh và luôn tự tin là chính mình.",
  "hoa pixel tuy ảo nhưng lời chúc chân thành là thật 100% nha [Tên].",
  "chúc [Tên] hôm nay không cần làm gì cũng có người lo, bước ra đường là gặp may.",
  "chúc [Tên] xinh xắn rạng ngời, tài khoản nhảy số đều và tâm trạng luôn phơi phới.",
  "bông hoa này không biết tàn đâu, giống như sự quý mến của mình dành cho [Tên] vậy.",
  "chúc người đặc biệt 20/10 nhận được cả rổ yêu thương và không gặp chuyện bực mình.",
  "hoa nở thơm ngát cả khu vườn pixel. chúc [Tên] ngày phụ nữ việt nam siêu hạnh phúc!",
  "ngón tay còn ổn không [Tên]? hoa nở đẹp lung linh thế này là nhờ công bạn cả đấy.",
  "chúc [Tên] luôn có người lắng nghe lúc buồn, chia vui lúc thắng và có trà sữa lúc thèm.",
  "20/10 vui vẻ nha [Tên]! chúc bạn luôn tìm thấy niềm vui trong những điều nhỏ xíu.",
  "đúp mỏi tay nhưng hoa nở đáng công đúng không? chúc [Tên] vạn sự hanh thông!",
  "chúc [Tên] luôn giữ nụ cười tỏa nắng, ai gặp cũng quý, ai nhìn cũng thương mến.",
  "hoa này không cần tưới nước nữa, chỉ cần [Tên] cười một cái là tươi mãi thôi.",
  "chúc [Tên] 20/10 được nhận nhiều hoa ngoài đời, còn hoa pixel này giữ làm kỷ niệm nha.",
  "cảm ơn [Tên] vì đã xuất hiện và làm thế giới này dễ thương hơn. 20/10 an vui nhé!",
  "chúc [Tên] một ngày 20/10 thật ấm áp, dịu dàng và được nuông chiều hết mực.",
  "nở được hoa này chứng tỏ [Tên] siêu kiên trì. chúc ước mơ của bạn sớm thành hiện thực!",
  "chúc [Tên] luôn xinh đẹp theo cách riêng của mình, độc nhất vô nhị không ai thay thế."
];

type WeatherType = 'sun' | 'rain' | 'snow';

interface FarmPlot {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

interface Plant {
  id: number;
  plotId: number;
  x: number;
  y: number;
  flowerTypeIndex: number;
  stage: number; // 1: seed, 2: sprout, 3: stem, 4: bud, 5: half, 6: full
  requiredClicks: number;
  currentClicks: number;
  lastWateredTime: number;
  isWilted: boolean;
  didTrickBud: boolean;
  isFakeVeggie: boolean;
  hasButterfly: boolean;
  dodgeOffset: number;
  bounceOffset: number;
  swayFrame: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'petal' | 'water' | 'firework' | 'feather';
}

interface WeatherParticle {
  x: number;
  y: number;
  speed: number;
  drift: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

interface BirdAnim {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'swoop' | 'snatch' | 'leave';
  frame: number;
}

interface AmbientButterfly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  colorType: 'blue' | 'yellow' | 'pink';
  wingTick: number;
  pauseTimer: number;
  flutterOffset: number;
  scaredTimer: number;
}

export default function App() {
  const [toName, setToName] = useState<string>('cô gái đặc biệt');
  const [fromName, setFromName] = useState<string>('một người bạn');
  const [isEditingNames, setIsEditingNames] = useState<boolean>(false);
  const [tempTo, setTempTo] = useState<string>('');
  const [tempFrom, setTempFrom] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [weather, setWeather] = useState<WeatherType>('sun');
  const weatherRef = useRef<WeatherType>('sun');

  const [dialogText, setDialogText] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showGrandModal, setShowGrandModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);

  // Thống kê hoa & trật lất
  const [bloomedCount, setBloomedCount] = useState<number>(0);
  const [missCount, setMissCount] = useState<number>(0);
  const [totalPlantsCount, setTotalPlantsCount] = useState<number>(0);

  // Nút chạy trốn "không nhận hoa đâu"
  const [runawayPos, setRunawayPos] = useState<{ x: number; y: number }>({ x: 20, y: 76 });
  const [runawayTaunt, setRunawayTaunt] = useState<string>('');

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotsRef = useRef<FarmPlot[]>([]);
  const plantsRef = useRef<Plant[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const weatherParticlesRef = useRef<WeatherParticle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const birdAnimRef = useRef<BirdAnim | null>(null);
  const butterfliesRef = useRef<AmbientButterfly[]>([]);
  const wateringEffectRef = useRef<{ x: number; y: number; frame: number; isMiss?: boolean } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Tránh lặp và chống bực
  const consecutiveMissesRef = useRef<number>(0);
  const didTriggerFakeVeggieRef = useRef<boolean>(false);
  const usedWishesRef = useRef<string[]>([]);
  const lastTauntIndexRef = useRef<Record<string, number>>({});

  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleClickCountRef = useRef<number>(0);
  const nextPlantIdRef = useRef<number>(1);
  const floatingTextIdRef = useRef<number>(1);

  const [virtualSize, setVirtualSize] = useState<{ width: number; height: number }>({ width: 220, height: 320 });

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  // Init params từ URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    const fromParam = params.get('from');
    if (toParam) setToName(toParam);
    if (fromParam) setFromName(fromParam);
  }, []);

  // Khởi tạo các hạt thời tiết (Mưa / Tuyết)
  useEffect(() => {
    const wp: WeatherParticle[] = [];
    for (let i = 0; i < 45; i++) {
      wp.push({
        x: Math.random() * 340 - 20,
        y: Math.random() * 340 - 20,
        speed: 2.2 + Math.random() * 2.2,
        drift: Math.random() * Math.PI * 2
      });
    }
    weatherParticlesRef.current = wp;
  }, []);

  // Khởi tạo bướm pixel tự động bay ngẫu nhiên
  useEffect(() => {
    butterfliesRef.current = [
      {
        id: 1,
        x: 45,
        y: 50,
        vx: 0.5,
        vy: 0.2,
        targetX: 130,
        targetY: 70,
        colorType: 'blue',
        wingTick: 0,
        pauseTimer: 0,
        flutterOffset: 0,
        scaredTimer: 0,
      },
      {
        id: 2,
        x: 170,
        y: 40,
        vx: -0.4,
        vy: 0.3,
        targetX: 70,
        targetY: 85,
        colorType: 'yellow',
        wingTick: 12,
        pauseTimer: 0,
        flutterOffset: 1.6,
        scaredTimer: 0,
      },
      {
        id: 3,
        x: 110,
        y: 80,
        vx: 0.3,
        vy: -0.3,
        targetX: 190,
        targetY: 55,
        colorType: 'pink',
        wingTick: 24,
        pauseTimer: 0,
        flutterOffset: 3.2,
        scaredTimer: 0,
      }
    ];
  }, []);

  // Web Audio Synthesizer
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playSound = useCallback((type: 'tap' | 'water' | 'bloom' | 'trick' | 'wilt' | 'type' | 'firework' | 'runaway' | 'miss' | 'chirp', stage = 1) => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'type') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'tap') {
        osc.type = 'square';
        const baseFreq = 240 + stage * 60;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'water') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.12);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'miss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === 'chirp') {
        [1400, 1750, 1300, 1850].forEach((freq, idx) => {
          const chirpOsc = ctx.createOscillator();
          const chirpGain = ctx.createGain();
          chirpOsc.type = 'sine';
          chirpOsc.frequency.setValueAtTime(freq, now + idx * 0.05);
          chirpGain.gain.setValueAtTime(0.12, now + idx * 0.05);
          chirpGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.06);
          chirpOsc.connect(chirpGain);
          chirpGain.connect(ctx.destination);
          chirpOsc.start(now + idx * 0.05);
          chirpOsc.stop(now + idx * 0.05 + 0.06);
        });
      } else if (type === 'trick') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === 'bloom') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = 'triangle';
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
          noteGain.gain.setValueAtTime(0.18, now + idx * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + idx * 0.08);
          noteOsc.stop(now + idx * 0.08 + 0.25);
        });
      } else if (type === 'wilt') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.22);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'firework') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'runaway') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(680, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch {
      // Audio fallback
    }
  }, [soundEnabled, initAudio]);

  const triggerVibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  const formatTaunt = useCallback((text: string) => {
    return text.replace(/\[Tên\]/g, toName.trim() || 'bạn');
  }, [toName]);

  const showDialog = useCallback((msg: string) => {
    const formatted = formatTaunt(msg);
    setDialogText(formatted);
    setDisplayedText('');
    setIsTyping(true);
  }, [formatTaunt]);

  const handleFastForwardDialog = () => {
    if (isTyping && dialogText) {
      setDisplayedText(dialogText);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!isTyping || !dialogText) return;
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedText(dialogText.slice(0, idx));
      if (idx % 2 === 0) playSound('type');
      if (idx >= dialogText.length) {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 18);
    return () => clearInterval(timer);
  }, [dialogText, isTyping, playSound]);

  // Khởi tạo 8 luống đất
  useEffect(() => {
    const updateDimensions = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const vw = isPortrait ? 220 : 320;
      const vh = isPortrait ? 320 : 200;
      setVirtualSize({ width: vw, height: vh });

      const plots: FarmPlot[] = [];
      const skyHeight = Math.floor(vh * 0.28);
      const farmHeight = vh - skyHeight;

      if (isPortrait) {
        const rows = 4;
        const cols = 2;
        const startX = Math.round(vw * 0.28);
        const gapX = Math.round(vw * 0.44);
        const startY = skyHeight + Math.round(farmHeight * 0.16);
        const gapY = Math.round(farmHeight * 0.22);

        let id = 1;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            plots.push({
              id: id++,
              row: r,
              col: c,
              x: startX + c * gapX,
              y: startY + r * gapY,
            });
          }
        }
      } else {
        const rows = 2;
        const cols = 4;
        const startX = Math.round(vw * 0.18);
        const gapX = Math.round(vw * 0.22);
        const startY = skyHeight + Math.round(farmHeight * 0.28);
        const gapY = Math.round(farmHeight * 0.40);

        let id = 1;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            plots.push({
              id: id++,
              row: r,
              col: c,
              x: startX + c * gapX,
              y: startY + r * gapY,
            });
          }
        }
      }
      plotsRef.current = plots;
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Màn mở đầu
  useEffect(() => {
    showDialog('20/10 rồi đó. đúp vào đất để gieo hạt, rồi đúp thật nhiều. nhấp một lần là hoa không nghe đâu. với lại coi chừng trật nha!');
  }, [showDialog]);

  // Chọn chế độ thời tiết cụ thể (Nắng, Mưa, Tuyết)
  const selectWeather = (mode: WeatherType) => {
    setWeather(mode);
    if (mode === 'rain') {
      playSound('water');
      showDialog('trời đổ mưa rào lất phất rồi, mát mẻ ghê! đất mềm thế này đúp hoa mau lớn lắm nha.');
    } else if (mode === 'snow') {
      playSound('tap', 4);
      showDialog('tuyết rơi nhẹ phủ trắng nông trại rồi nè! lãng mạn như phim luôn, đúp hoa giữa trời tuyết ấm lòng ghê [Tên] ơi.');
    } else {
      playSound('chirp');
      showDialog('trời hửng nắng ấm rực rỡ trở lại rồi! hoa tha hồ tắm nắng nha [Tên].');
    }
  };

  // Chuyển đổi vòng lặp thời tiết nhanh (Nắng -> Mưa -> Tuyết)
  const cycleWeather = () => {
    const nextMode: WeatherType = weather === 'sun' ? 'rain' : weather === 'rain' ? 'snow' : 'sun';
    selectWeather(nextMode);
  };

  const getRandomTaunt = useCallback((list: string[], category = 'default') => {
    if (list.length === 1) return list[0];
    let nextIdx = Math.floor(Math.random() * list.length);
    if (lastTauntIndexRef.current[category] !== undefined && nextIdx === lastTauntIndexRef.current[category]) {
      nextIdx = (nextIdx + 1) % list.length;
    }
    lastTauntIndexRef.current[category] = nextIdx;
    return list[nextIdx];
  }, []);

  const getUniqueBloomWish = useCallback(() => {
    const available = BLOOM_WISHES.filter(w => !usedWishesRef.current.includes(w));
    const chosen = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : BLOOM_WISHES[Math.floor(Math.random() * BLOOM_WISHES.length)];
    usedWishesRef.current.push(chosen);
    return chosen;
  }, []);

  const addParticles = useCallback((x: number, y: number, type: 'sparkle' | 'petal' | 'water' | 'firework' | 'feather', count = 8, colorOverride?: string) => {
    const colors = type === 'water'
      ? ['#54a0ff', '#99d0ff', '#ffffff']
      : type === 'sparkle'
      ? ['#ffd32a', '#ffffff', '#fde24f']
      : type === 'feather'
      ? ['#fffef0', '#e6d8b8', '#999999']
      : type === 'petal'
      ? ['#e74c3c', '#ff7675', '#fd79a8', '#fffef0', '#f5af19']
      : ['#ff3838', '#ff9f1a', '#2ed573', '#1e90ff', '#cd84f1', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'firework' ? 1.6 + Math.random() * 2.6 : 0.6 + Math.random() * 1.4;
      particlesRef.current.push({
        x: x + (Math.random() * 6 - 3),
        y: y + (Math.random() * 6 - 3),
        vx: Math.cos(angle) * speed,
        vy: type === 'petal' || type === 'feather' ? 0.3 + Math.random() * 0.8 : Math.sin(angle) * speed - (type === 'water' ? 0.5 : 0),
        color: colorOverride || colors[Math.floor(Math.random() * colors.length)],
        size: type === 'firework' ? 2 : (Math.random() > 0.5 ? 2 : 1),
        life: 0,
        maxLife: type === 'petal' || type === 'feather' ? 60 + Math.random() * 40 : 25 + Math.random() * 20,
        type
      });
    }
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color = '#e74c3c') => {
    floatingTextsRef.current.push({
      id: floatingTextIdRef.current++,
      text,
      x,
      y,
      color,
      life: 0,
      maxLife: 45
    });
  }, []);

  // Xử lý quyết định TRẬT LẤT hay TRÚNG
  const handleActionAt = useCallback((virtX: number, virtY: number, tapDistance: number) => {
    initAudio();
    const plots = plotsRef.current;
    const plants = plantsRef.current;

    let nearestPlot: FarmPlot | null = null;
    let minPlotDist = 36;
    for (const plot of plots) {
      const dist = Math.hypot(plot.x - virtX, plot.y - virtY);
      if (dist < minPlotDist) {
        minPlotDist = dist;
        nearestPlot = plot;
      }
    }

    if (!nearestPlot) return;

    const targetPlant = plants.find(p => p.plotId === nearestPlot!.id);
    const now = Date.now();

    // 1. KIỂM TRA ĐÚP LỆCH (2 lần chạm cách xa nhau > 24px)
    if (tapDistance > CONFIG.TAP_DISTANCE_THRESHOLD) {
      consecutiveMissesRef.current++;
      setMissCount(m => m + 1);
      playSound('miss');
      triggerVibrate([30, 20]);
      addFloatingText('?', nearestPlot.x, nearestPlot.y - 14, '#ffd32a');
      showDialog(getRandomTaunt(MISS_TAUNTS.distant_tap, 'distant_tap'));
      return;
    }

    // 2. TÍNH XÁC SUẤT TRẬT (15-20%) VỚI CƠ CHẾ CHỐNG BỰC
    let isMiss = false;
    if (consecutiveMissesRef.current >= CONFIG.MAX_CONSECUTIVE_MISSES) {
      isMiss = false;
    } else {
      const currentMissRate = consecutiveMissesRef.current > 0 ? CONFIG.MISS_RATE * 0.4 : CONFIG.MISS_RATE;
      isMiss = Math.random() < currentMissRate;
    }

    if (isMiss) {
      consecutiveMissesRef.current++;
      setMissCount(m => {
        const nextM = m + 1;
        if (nextM === 5) {
          setTimeout(() => {
            showDialog('trật 5 lần rồi đó nha, tập trung vào [Tên] ơi :))');
          }, 2500);
        } else if (nextM === 10) {
          setTimeout(() => {
            showDialog('trật tới 10 lần luôn?! hoa này né đỉnh hay [Tên] bấm lụi vậy ta haha.');
          }, 2500);
        }
        return nextM;
      });

      playSound('miss');
      triggerVibrate([30, 20]);
      addFloatingText('TRẬT!', nearestPlot.x, nearestPlot.y - 14, '#e74c3c');

      if (!targetPlant) {
        const rollSeedMissType = Math.random() < 0.5 ? 'bird_steal' : 'seed_roll';
        if (rollSeedMissType === 'bird_steal') {
          playSound('chirp');
          birdAnimRef.current = {
            x: -20,
            y: nearestPlot.y - 15,
            targetX: nearestPlot.x,
            targetY: nearestPlot.y - 8,
            state: 'swoop',
            frame: 0
          };
          addParticles(nearestPlot.x, nearestPlot.y, 'feather', 6);
          showDialog(getRandomTaunt(MISS_TAUNTS.bird_steal, 'bird_steal'));
        } else {
          addParticles(nearestPlot.x + 10, nearestPlot.y, 'sparkle', 4);
          showDialog(getRandomTaunt(MISS_TAUNTS.seed_roll, 'seed_roll'));
        }
        return;
      }

      const plantMissPool: ('dodge' | 'miss_water' | 'butterfly_block' | 'fake_veggie')[] = ['dodge', 'miss_water', 'butterfly_block'];
      if (!didTriggerFakeVeggieRef.current && (targetPlant.stage === 4 || targetPlant.stage === 5) && Math.random() < 0.4) {
        plantMissPool.push('fake_veggie');
      }

      const chosenMiss = plantMissPool[Math.floor(Math.random() * plantMissPool.length)];

      if (chosenMiss === 'dodge') {
        targetPlant.dodgeOffset = Math.random() < 0.5 ? 8 : -8;
        wateringEffectRef.current = { x: nearestPlot.x, y: nearestPlot.y - 18, frame: 12, isMiss: true };
        addParticles(nearestPlot.x, nearestPlot.y, 'water', 4);
        showDialog(getRandomTaunt(MISS_TAUNTS.dodge, 'dodge'));
      } else if (chosenMiss === 'miss_water') {
        wateringEffectRef.current = { x: nearestPlot.x + 14, y: nearestPlot.y - 18, frame: 12, isMiss: true };
        addParticles(nearestPlot.x + 14, nearestPlot.y + 4, 'water', 6);
        showDialog(getRandomTaunt(MISS_TAUNTS.miss_water, 'miss_water'));
      } else if (chosenMiss === 'butterfly_block') {
        targetPlant.hasButterfly = true;
        showDialog(getRandomTaunt(MISS_TAUNTS.butterfly_block, 'butterfly_block'));
      } else if (chosenMiss === 'fake_veggie') {
        didTriggerFakeVeggieRef.current = true;
        targetPlant.isFakeVeggie = true;
        targetPlant.requiredClicks += 2;
        showDialog(getRandomTaunt(MISS_TAUNTS.fake_veggie, 'fake_veggie'));
      }
      return;
    }

    // ==========================================
    // TRƯỜNG HỢP TRÚNG (HIT)
    // ==========================================
    consecutiveMissesRef.current = 0;
    wateringEffectRef.current = { x: nearestPlot.x, y: nearestPlot.y - 18, frame: 12, isMiss: false };

    if (targetPlant) {
      targetPlant.dodgeOffset = 0;
      targetPlant.bounceOffset = 3.5;
      targetPlant.lastWateredTime = now;

      if (targetPlant.hasButterfly) {
        targetPlant.hasButterfly = false;
        playSound('water', targetPlant.stage);
        addParticles(targetPlant.x, targetPlant.y - 10, 'sparkle', 6);
        showDialog('đuổi được bướm đi rồi, hoa đón nước nè! đúp tiếp đi!');
        return;
      }

      if (targetPlant.isFakeVeggie) {
        targetPlant.currentClicks += 1;
        playSound('water', 5);
        addParticles(targetPlant.x, targetPlant.y - 10, 'water', 8);
        if (targetPlant.currentClicks >= targetPlant.requiredClicks) {
          targetPlant.isFakeVeggie = false;
          targetPlant.stage = 6;
          playSound('bloom', 6);
          triggerVibrate([50, 40, 50, 40, 80]);
          addParticles(targetPlant.x, targetPlant.y - 12, 'petal', 24);
          addParticles(targetPlant.x, targetPlant.y - 12, 'sparkle', 16);
          const newBloomed = plants.filter(p => p.stage === 6).length;
          setBloomedCount(newBloomed);
          const wish = getUniqueBloomWish();
          showDialog(wish);
          return;
        } else {
          showDialog('củ cải đang biến hình dần thành hoa thật nè, đúp dồn dập vào!');
          return;
        }
      }

      if (targetPlant.isWilted) {
        targetPlant.isWilted = false;
        playSound('water', targetPlant.stage);
        addParticles(targetPlant.x, targetPlant.y - 10, 'water', 8);
        showDialog('hết dỗi rồi nha! uống miếng nước tươi tỉnh liền. đúp tiếp đi!');
        return;
      }

      if (targetPlant.stage >= 6) {
        playSound('bloom', 6);
        addParticles(targetPlant.x, targetPlant.y - 14, 'petal', 14);
        triggerVibrate([30, 20, 30]);
        const randomWish = getRandomTaunt(BLOOM_WISHES, 'bloom_revisit');
        showDialog(randomWish);
        return;
      }

      targetPlant.currentClicks += 1;
      const progress = targetPlant.currentClicks / targetPlant.requiredClicks;
      let targetStage = Math.min(5, Math.floor(1 + progress * 4.6));

      if (targetStage === 4 && !targetPlant.didTrickBud && Math.random() < 0.75) {
        targetPlant.didTrickBud = true;
        playSound('trick');
        triggerVibrate([35, 35]);
        addParticles(targetPlant.x, targetPlant.y - 10, 'sparkle', 5);
        showDialog(getRandomTaunt(STAGE_TAUNTS.bud, 'bud'));
        return;
      }

      if (targetPlant.currentClicks >= targetPlant.requiredClicks) {
        targetPlant.stage = 6;
        playSound('bloom', 6);
        triggerVibrate([50, 40, 50, 40, 80]);
        addParticles(targetPlant.x, targetPlant.y - 12, 'petal', 24);
        addParticles(targetPlant.x, targetPlant.y - 12, 'sparkle', 16);

        const newBloomed = plants.filter(p => p.stage === 6).length;
        setBloomedCount(newBloomed);

        const wish = getUniqueBloomWish();
        showDialog(wish);

        if (newBloomed === 1) {
          setTimeout(() => {
            showDialog('bông đầu tiên kìa! mới một bông thôi mà trông đắc ý ghê.');
          }, 3200);
        } else if (newBloomed === 3) {
          setTimeout(() => {
            showDialog('ba bông rồi nha, sắp thành nông dân chăm chỉ của năm 20/10 rồi.');
          }, 3200);
        } else if (newBloomed === 5) {
          setTimeout(() => {
            showDialog('năm bông rồi kìa, còn đúng 3 bông nữa là trọn vẹn cả vườn!');
          }, 3200);
        } else if (newBloomed === 7) {
          setTimeout(() => {
            showDialog('bảy bông luôn? còn duy nhất một bông cuối cùng thôi [Tên] ơi!');
          }, 3200);
        } else if (newBloomed === CONFIG.TOTAL_FLOWERS) {
          setTimeout(() => {
            setShowGrandModal(true);
            for (let f = 0; f < 10; f++) {
              setTimeout(() => {
                playSound('firework');
                addParticles(
                  Math.random() * virtualSize.width,
                  Math.random() * (virtualSize.height * 0.6),
                  'firework',
                  25
                );
              }, f * 280);
            }
          }, 1200);
        }
        return;
      }

      if (targetStage > targetPlant.stage) {
        targetPlant.stage = targetStage;
        playSound('water', targetPlant.stage);
        addParticles(targetPlant.x, targetPlant.y - 10, 'water', 8);

        let tauntsList: string[] = STAGE_TAUNTS.stem;
        let cat = 'stem';
        if (targetPlant.stage === 2) { tauntsList = STAGE_TAUNTS.sprout; cat = 'sprout'; }
        else if (targetPlant.stage === 3) { tauntsList = STAGE_TAUNTS.stem; cat = 'stem'; }
        else if (targetPlant.stage === 4) { tauntsList = STAGE_TAUNTS.bud; cat = 'bud'; }
        else if (targetPlant.stage === 5) { tauntsList = STAGE_TAUNTS.half; cat = 'half'; }

        showDialog(getRandomTaunt(tauntsList, cat));
      } else {
        playSound('water', targetPlant.stage);
        addParticles(targetPlant.x, targetPlant.y - 8, 'water', 5);
        if (Math.random() < 0.45) {
          showDialog(getRandomTaunt(STAGE_TAUNTS.stem, 'stem_mid'));
        }
      }
      return;
    }

    // Gieo hạt mới
    if (plants.length >= CONFIG.TOTAL_FLOWERS) {
      showDialog('vườn đủ 8 bông hoa rồi nha! chăm cho nở hết hoa đi đã.');
      return;
    }

    const newPlant: Plant = {
      id: nextPlantIdRef.current++,
      plotId: nearestPlot.id,
      x: nearestPlot.x,
      y: nearestPlot.y,
      flowerTypeIndex: plants.length % FLOWER_TYPES.length,
      stage: 1,
      requiredClicks: Math.floor(Math.random() * (CONFIG.MAX_DOUBLE_CLICKS - CONFIG.MIN_DOUBLE_CLICKS + 1)) + CONFIG.MIN_DOUBLE_CLICKS,
      currentClicks: 1,
      lastWateredTime: now,
      isWilted: false,
      didTrickBud: false,
      isFakeVeggie: false,
      hasButterfly: false,
      dodgeOffset: 0,
      bounceOffset: 4,
      swayFrame: Math.floor(Math.random() * 60)
    };

    plants.push(newPlant);
    setTotalPlantsCount(plants.length);
    playSound('tap', 1);
    addParticles(nearestPlot.x, nearestPlot.y, 'sparkle', 6);
    triggerVibrate(30);

    showDialog(getRandomTaunt(STAGE_TAUNTS.seed, 'seed'));
  }, [initAudio, playSound, addParticles, addFloatingText, showDialog, getRandomTaunt, getUniqueBloomWish, virtualSize]);

  // Bộ nhận diện Double Click / Double Tap
  const handlePointerInteraction = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = virtualSize.width / rect.width;
    const scaleY = virtualSize.height / rect.height;

    const virtX = (clientX - rect.left) * scaleX;
    const virtY = (clientY - rect.top) * scaleY;

    // Tương tác chạm trêu bướm pixel: chạm gần bướm thì bướm giật mình vỗ cánh bay vút đi
    const ambientButterflies = butterfliesRef.current;
    let didScareButterfly = false;
    ambientButterflies.forEach(b => {
      const bDist = Math.hypot(virtX - b.x, virtY - b.y);
      if (bDist < 26) {
        b.scaredTimer = 50;
        b.pauseTimer = 0;
        b.targetX = b.x + (b.x < virtX ? -60 : 60);
        b.targetY = Math.max(15, b.y - 35);
        addParticles(b.x, b.y, 'sparkle', 6);
        didScareButterfly = true;
      }
    });
    if (didScareButterfly) {
      playSound('chirp');
    }

    const now = Date.now();
    const elapsed = now - lastTapTimeRef.current;
    const dx = clientX - lastTapPosRef.current.x;
    const dy = clientY - lastTapPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (elapsed < CONFIG.DOUBLE_TAP_INTERVAL) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      singleClickCountRef.current = 0;
      lastTapTimeRef.current = 0;
      handleActionAt(virtX, virtY, dist);
    } else {
      lastTapTimeRef.current = now;
      lastTapPosRef.current = { x: clientX, y: clientY };

      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }

      singleTapTimerRef.current = setTimeout(() => {
        singleClickCountRef.current += 1;
        if (singleClickCountRef.current >= 2) {
          const teases = [
            'ĐÚP cơ mà. chưa quen nhận hoa hả?',
            'Nhấp một cái hoa hông thèm lớn đâu nha :P',
            'Đúp nhanh 2 lần liên tiếp cơ mà [Tên] ơi!',
            'Một cái hoa tưởng gió thổi đó, đúp 2 cái đi!'
          ];
          showDialog(teases[Math.floor(Math.random() * teases.length)]);
        }
      }, CONFIG.DOUBLE_TAP_INTERVAL + 20);
    }
  }, [virtualSize, handleActionAt, showDialog]);

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handlePointerInteraction(touch.clientX, touch.clientY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handleRunawayMove = () => {
    playSound('runaway');
    const newX = 12 + Math.random() * 65;
    const newY = 16 + Math.random() * 60;
    setRunawayPos({ x: newX, y: newY });

    const taunts = [
      'chạy đâu cho thoát :))',
      'đã bảo là phải nhận mà!',
      'bắt được nút này thì tính tiếp',
      'nút này lẹ hơn bạn tưởng đó!'
    ];
    setRunawayTaunt(taunts[Math.floor(Math.random() * taunts.length)]);
  };

  const handleRunawayClick = () => {
    showDialog('nút này hỏng rồi. nhận hoa đi :P');
    playSound('trick');
    triggerVibrate(60);
  };

  const handleResetGarden = () => {
    plantsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    birdAnimRef.current = null;
    consecutiveMissesRef.current = 0;
    didTriggerFakeVeggieRef.current = false;
    usedWishesRef.current = [];
    setBloomedCount(0);
    setMissCount(0);
    setTotalPlantsCount(0);
    setShowResetConfirm(false);
    showDialog('phũ vậy... hoa trồng nãy giờ đó! giờ đúp lại từ đầu nè.');
    playSound('wilt');
  };

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  // VÒNG LẶP RENDER PIXEL ART GAME
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let cloudOffset = 0;
    let tick = 0;

    const renderSprite = (
      matrix: string[],
      anchorX: number,
      anchorY: number,
      bounce = 0,
      scale = 1,
      flipX = false
    ) => {
      const height = matrix.length;
      const width = matrix[0].length;
      const startX = Math.round(anchorX - (width * scale) / 2);
      const startY = Math.round(anchorY - (height * scale) - bounce);

      for (let r = 0; r < height; r++) {
        const row = matrix[r];
        for (let c = 0; c < row.length; c++) {
          const colIndex = flipX ? row.length - 1 - c : c;
          const char = row[colIndex];
          if (char !== '.' && PALETTE[char]) {
            ctx.fillStyle = PALETTE[char];
            ctx.fillRect(startX + c * scale, startY + r * scale, scale, scale);
          }
        }
      }
    };

    const render = () => {
      tick++;
      const { width: vw, height: vh } = virtualSize;
      canvas.width = vw;
      canvas.height = vh;
      ctx.imageSmoothingEnabled = false;

      const currentW = weatherRef.current;
      const skyHeight = Math.floor(vh * 0.28);

      // 1. BẦU TRỜI THEO THỜI TIẾT
      if (currentW === 'rain') {
        ctx.fillStyle = '#6e919f'; // Trời u ám mát mẻ
      } else if (currentW === 'snow') {
        ctx.fillStyle = '#8ca3ba'; // Trời đông se lạnh lãng mạn
      } else {
        ctx.fillStyle = '#9fe1ea'; // Trời nắng ấm trong lành
      }
      ctx.fillRect(0, 0, vw, skyHeight);

      // Mặt trời pixel
      if (currentW === 'sun') {
        ctx.fillStyle = '#fff4cc';
        ctx.fillRect(vw - 32, 10, 14, 14);
        ctx.fillStyle = '#fde24f';
        ctx.fillRect(vw - 30, 12, 10, 10);
      } else if (currentW === 'rain') {
        // Mặt trời khuất sau mây mưa
        ctx.fillStyle = 'rgba(230, 240, 245, 0.45)';
        ctx.fillRect(vw - 30, 12, 10, 10);
      } else {
        // Mặt trời nhạt giữa trời tuyết
        ctx.fillStyle = '#fff9e8';
        ctx.fillRect(vw - 30, 12, 10, 10);
      }

      // Mây pixel theo thời tiết
      cloudOffset = (cloudOffset + 0.15) % (vw + 60);
      const drawCloud = (cx: number, cy: number, w: number) => {
        if (currentW === 'rain') {
          ctx.fillStyle = '#5d7d8c';
          ctx.fillRect(cx, cy, w, 8);
          ctx.fillRect(cx + 4, cy - 4, w - 8, 12);
          ctx.fillStyle = '#7899a8';
          ctx.fillRect(cx + 2, cy + 6, w - 4, 3);
        } else if (currentW === 'snow') {
          ctx.fillStyle = '#c5d5e6';
          ctx.fillRect(cx, cy, w, 8);
          ctx.fillRect(cx + 4, cy - 4, w - 8, 12);
          ctx.fillStyle = '#e4ecf5';
          ctx.fillRect(cx + 2, cy + 6, w - 4, 3);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx, cy, w, 8);
          ctx.fillRect(cx + 4, cy - 4, w - 8, 12);
          ctx.fillStyle = '#e8f4f8';
          ctx.fillRect(cx + 2, cy + 6, w - 4, 3);
        }
      };
      drawCloud((cloudOffset * 0.8) % (vw + 80) - 40, 12, 34);
      drawCloud(((cloudOffset + 120) * 0.6) % (vw + 100) - 50, 22, 42);

      // Cánh đồng cỏ Stardew
      if (currentW === 'snow') {
        ctx.fillStyle = '#456f34';
      } else if (currentW === 'rain') {
        ctx.fillStyle = '#3d6621';
      } else {
        ctx.fillStyle = '#4c7a28';
      }
      ctx.fillRect(0, skyHeight, vw, vh - skyHeight);

      // Hàng rào gỗ
      ctx.fillStyle = '#6b4324';
      ctx.fillRect(0, skyHeight - 4, vw, 2);
      for (let fx = 8; fx < vw; fx += 16) {
        ctx.fillStyle = '#8a5933';
        ctx.fillRect(fx, skyHeight - 8, 3, 9);
        ctx.fillStyle = '#523319';
        ctx.fillRect(fx + 2, skyHeight - 8, 1, 9);
      }

      // Ô cỏ dither
      ctx.fillStyle = currentW === 'snow' ? '#5a8247' : '#416a22';
      for (let gy = skyHeight + 6; gy < vh; gy += 14) {
        for (let gx = 4; gx < vw; gx += 14) {
          ctx.fillRect(gx + (gy % 28 === 0 ? 0 : 7), gy, 2, 2);
        }
      }

      // Đốm tuyết trắng đọng trên cỏ nếu là mùa tuyết
      if (currentW === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let s = 10; s < vw; s += 28) {
          ctx.fillRect(s, skyHeight + 10 + (s % 30), 2, 1);
        }
      }

      // 2. VẼ 8 LUỐNG ĐẤT NÔNG TRẠI
      const plots = plotsRef.current;
      const plants = plantsRef.current;

      plots.forEach(plot => {
        const px = plot.x;
        const py = plot.y;

        ctx.fillStyle = '#362112';
        ctx.fillRect(px - 16, py - 6, 32, 13);
        ctx.fillStyle = '#53341e';
        ctx.fillRect(px - 14, py - 5, 28, 11);
        ctx.fillStyle = '#7e5130';
        ctx.fillRect(px - 12, py - 4, 24, 7);
        ctx.fillStyle = '#a8754b';
        ctx.fillRect(px - 9, py - 3, 18, 3);

        const hasPlant = plants.some(p => p.plotId === plot.id);
        if (!hasPlant) {
          ctx.fillStyle = '#ead9b6';
          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
      });

      // 3. VẼ CÁC CÂY TRỒNG
      const now = Date.now();
      plants.forEach(plant => {
        if (plant.stage > 1 && plant.stage < 6 && !plant.isFakeVeggie) {
          if (now - plant.lastWateredTime > CONFIG.WILT_TIME_MS && !plant.isWilted) {
            plant.isWilted = true;
            plant.stage = Math.max(1, plant.stage - 1);
            playSound('wilt');
            showDialog(getRandomTaunt(STAGE_TAUNTS.wilted, 'wilted'));
          }
        }

        if (plant.bounceOffset > 0) {
          plant.bounceOffset -= 0.28;
          if (plant.bounceOffset < 0) plant.bounceOffset = 0;
        }

        const flowerType = FLOWER_TYPES[plant.flowerTypeIndex] || FLOWER_TYPES[0];
        const drawX = plant.x + plant.dodgeOffset;

        ctx.fillStyle = 'rgba(34, 20, 12, 0.4)';
        ctx.fillRect(drawX - 8, plant.y - 1, 16, 3);

        if (plant.isFakeVeggie) {
          renderSprite(SPRITE_RADISH, drawX, plant.y, plant.bounceOffset);
        } else if (plant.isWilted) {
          renderSprite(SPRITE_WILTED, drawX, plant.y, plant.bounceOffset);
          ctx.fillStyle = '#54a0ff';
          ctx.fillRect(drawX + 6, plant.y - 14 - (Math.floor(tick / 10) % 3), 2, 2);
        } else if (plant.stage === 1) {
          renderSprite(SPRITE_SEED, drawX, plant.y, plant.bounceOffset);
        } else if (plant.stage === 2) {
          renderSprite(SPRITE_SPROUT, drawX, plant.y, plant.bounceOffset);
        } else if (plant.stage === 3) {
          renderSprite(SPRITE_STEM, drawX, plant.y, plant.bounceOffset);
        } else if (plant.stage === 4) {
          renderSprite(flowerType.sprites.bud, drawX, plant.y, plant.bounceOffset);
        } else if (plant.stage === 5) {
          renderSprite(flowerType.sprites.half, drawX, plant.y, plant.bounceOffset);
        } else if (plant.stage >= 6) {
          const bloomSway = Math.floor((tick + plant.swayFrame) / 20) % 2 === 0 ? 0 : 1;
          renderSprite(flowerType.sprites.full, drawX + bloomSway, plant.y, plant.bounceOffset);

          if (Math.random() < 0.05) {
            addParticles(drawX, plant.y - 14, 'sparkle', 1);
          }
        }

        if (plant.hasButterfly) {
          renderSprite(SPRITE_BUTTERFLY, drawX, plant.y - 12);
        }
      });

      // 4. CHIM CƯỚP HẠT
      if (birdAnimRef.current) {
        const b = birdAnimRef.current;
        b.frame++;
        if (b.state === 'swoop') {
          b.x += 3.5;
          b.y += (b.targetY - b.y) * 0.18;
          if (b.x >= b.targetX) {
            b.state = 'leave';
          }
        } else {
          b.x += 3.5;
          b.y -= 1.8;
          if (b.x > vw + 40) {
            birdAnimRef.current = null;
          }
        }
        renderSprite(SPRITE_BIRD, b.x, b.y);
      }

      // 4.5. HỆ THỐNG BƯỚM PIXEL BAY TỰ DO TRÊN BẦU TRỜI NÔNG TRẠI
      const ambientButterflies = butterfliesRef.current;
      ambientButterflies.forEach(b => {
        b.wingTick++;
        if (b.scaredTimer > 0) b.scaredTimer--;

        // Tính toán mục tiêu bay
        const dx = b.targetX - b.x;
        const dy = b.targetY - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 12 || b.pauseTimer > 0) {
          if (b.pauseTimer > 0) {
            b.pauseTimer--;
          } else {
            // Khi bay tới đích, 45% cơ hội ghé vờn hoa nếu vườn có hoa
            if (Math.random() < 0.45 && plants.length > 0) {
              const targetFlower = plants[Math.floor(Math.random() * plants.length)];
              b.targetX = targetFlower.x + (Math.random() * 14 - 7);
              b.targetY = targetFlower.y - 12 + (Math.random() * 6 - 3);
              b.pauseTimer = Math.floor(45 + Math.random() * 65); // Đậu vờn hoa 1.5 - 2.5s
            } else {
              b.targetX = 15 + Math.random() * (vw - 30);
              b.targetY = 15 + Math.random() * (skyHeight + 50);
              b.pauseTimer = 0;
            }
          }
        }

        // Tốc độ bay (nhanh hơn khi bị giật mình, chậm khi đang lượn quanh hoa)
        const speed = b.scaredTimer > 0 ? 1.6 : (b.pauseTimer > 0 ? 0.12 : 0.52);
        if (dist > 2) {
          b.vx += ((dx / dist) * speed - b.vx) * 0.08;
          b.vy += ((dy / dist) * speed - b.vy) * 0.08;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Giữ bướm trong khuôn viên nông trại
        if (b.x < -10) { b.x = -10; b.vx = Math.abs(b.vx); b.targetX = vw * 0.5; }
        if (b.x > vw + 10) { b.x = vw + 10; b.vx = -Math.abs(b.vx); b.targetX = vw * 0.5; }
        if (b.y < 12) { b.y = 12; b.vy = Math.abs(b.vy); }
        if (b.y > vh - 22) { b.y = vh - 22; b.vy = -Math.abs(b.vy); }

        // Đung đưa lượn sóng tự nhiên
        const floatWave = Math.sin(tick * 0.09 + b.flutterOffset) * 0.8;
        const flapInterval = b.scaredTimer > 0 ? 3 : (b.pauseTimer > 0 ? 8 : 4);
        const isFlap = Math.floor(b.wingTick / flapInterval) % 2 === 1;

        const sprites = BUTTERFLY_SPRITES[b.colorType] || BUTTERFLY_SPRITES.blue;
        const spriteMatrix = isFlap ? sprites.flap : sprites.open;
        const flip = b.vx < -0.05;

        renderSprite(spriteMatrix, b.x, b.y + floatWave, 0, 1, flip);
      });

      // 5. HIỆU ỨNG BÌNH TƯỚI NƯỚC
      if (wateringEffectRef.current && wateringEffectRef.current.frame > 0) {
        const wEffect = wateringEffectRef.current;
        wEffect.frame--;
        renderSprite(SPRITE_WATERING_CAN, wEffect.x - 2, wEffect.y);

        ctx.fillStyle = '#54a0ff';
        const dropOffset = (12 - wEffect.frame) * 1.5;
        ctx.fillRect(wEffect.x + 4, wEffect.y + dropOffset, 1, 2);
        ctx.fillRect(wEffect.x + 7, wEffect.y + dropOffset + 3, 2, 2);
      }

      // 6. CHỮ "TRẬT!" BAY LÊN
      const fTexts = floatingTextsRef.current;
      for (let i = fTexts.length - 1; i >= 0; i--) {
        const ft = fTexts[i];
        ft.life++;
        ft.y -= 0.6;
        const wobble = (ft.life % 4 < 2) ? -1 : 1;

        ctx.fillStyle = '#22140c';
        ctx.font = 'bold 12px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x + wobble + 1, ft.y + 1);

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x + wobble, ft.y);

        if (ft.life >= ft.maxLife) {
          fTexts.splice(i, 1);
        }
      }

      // 7. HIỆU ỨNG THỜI TIẾT PIXEL (MƯA LẤT PHẤT / TUYẾT NHẸ)
      const wParticles = weatherParticlesRef.current;
      if (currentW === 'rain') {
        ctx.fillStyle = '#d4effc';
        wParticles.forEach(p => {
          p.y += p.speed;
          p.x += 0.8; // Gió nghiêng nhẹ
          if (p.y > vh || p.x > vw + 10) {
            p.y = -6;
            p.x = Math.random() * (vw + 40) - 20;
          }
          // Vệt mưa pixel 1x3
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3);

          // Bọt nước bắn nhẹ khi chạm đất
          if (p.y > skyHeight + 10 && Math.random() < 0.08) {
            ctx.fillStyle = 'rgba(212, 239, 252, 0.7)';
            ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
            ctx.fillStyle = '#d4effc';
          }
        });
      } else if (currentW === 'snow') {
        wParticles.forEach(p => {
          p.y += p.speed * 0.42;
          p.x += Math.sin(tick * 0.04 + p.drift) * 0.55;
          if (p.y > vh) {
            p.y = -5;
            p.x = Math.random() * vw;
          }
          const size = p.drift > 3.14 ? 2 : 1;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(p.x), Math.round(p.y), size, size);
        });
      }

      // 8. CẬP NHẬT PARTICLES (CÁNH HOA, NƯỚC, LÔNG VŨ, PHÁO HOA)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.type === 'water') {
          p.vy += 0.12;
        } else if (p.type === 'petal') {
          p.x += Math.sin(p.life * 0.1) * 0.45;
        } else if (p.type === 'feather') {
          p.x += Math.sin(p.life * 0.15) * 0.6;
          p.vy = 0.35;
        } else if (p.type === 'firework') {
          p.vx *= 0.95;
          p.vy *= 0.95;
        }

        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [virtualSize, playSound, showDialog, getRandomTaunt, addParticles]);

  const handleDownloadStandalone = async () => {
    try {
      const res = await fetch('/standalone.html');
      if (res.ok) {
        const text = await res.text();
        const customText = text
          .replace(/let toName = "cô gái đặc biệt";/, `let toName = "${toName.replace(/"/g, '\\"')}";`)
          .replace(/let fromName = "một người bạn";/, `let fromName = "${fromName.replace(/"/g, '\\"')}";`)
          .replace(/let weather = 'sun';/, `let weather = '${weather}';`);
        const blob = new Blob([customText], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nong-trai-hoa-20-10-${toName ? toName.replace(/\s+/g, '-') : 'tang-nang'}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowDownloadModal(false);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('to', toName);
    url.searchParams.set('from', fromName);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopyStatus('Đã sao chép link! Gửi ngay cho người ấy nha 💕');
      setTimeout(() => setCopyStatus(''), 3000);
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#22140c] select-none touch-manipulation font-['Pixelify_Sans',monospace]"
    >
      {/* CANVAS NÔNG TRẠI CHÍNH */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchEnd={handleTouchEnd}
        className="block image-pixelated cursor-[crosshair] touch-none shadow-2xl border-4 border-[#3d2314]"
        style={{
          width: 'min(98vw, 640px)',
          height: 'min(92vh, 840px)',
          objectFit: 'contain',
        }}
      />

      {/* TOP HUD BAR */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none max-w-xl mx-auto z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Bộ đếm hoa */}
          <div className="bg-[#fcf7e6] border-[3px] border-[#3d2314] px-3 py-1.5 shadow-[2px_2px_0px_#1a0e08] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#c0392b] fill-[#c0392b] animate-pulse" />
            <span className="text-[#3d2314] font-bold text-sm sm:text-base">
              HOA: <span className="text-[#c0392b] font-black">{bloomedCount}</span> / 8
            </span>
          </div>

          {/* Bộ đếm trật */}
          {missCount > 0 && (
            <div className="bg-[#fde24f] border-[3px] border-[#3d2314] px-2 py-1.5 shadow-[2px_2px_0px_#1a0e08] flex items-center gap-1 text-[#3d2314] font-bold text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-[#c0392b]" />
              <span>TRẬT: {missCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* NÚT ĐỔI THỜI TIẾT NHANH (NẮNG / MƯA / TUYẾT) */}
          <button
            onClick={cycleWeather}
            className="bg-[#fcf7e6] hover:bg-[#fff9e8] active:translate-y-0.5 border-[3px] border-[#3d2314] p-1.5 sm:px-2.5 sm:py-1.5 shadow-[2px_2px_0px_#1a0e08] text-[#3d2314] font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform"
            title="Nhấp để đổi nhanh thời tiết (Nắng / Mưa / Tuyết)"
          >
            {weather === 'sun' && <Sun className="w-4 h-4 text-[#f5af19]" />}
            {weather === 'rain' && <CloudRain className="w-4 h-4 text-[#54a0ff]" />}
            {weather === 'snow' && <Snowflake className="w-4 h-4 text-[#74b9ff]" />}
            <span className="hidden sm:inline">
              {weather === 'sun' ? 'NẮNG' : weather === 'rain' ? 'MƯA' : 'TUYẾT'}
            </span>
          </button>

          {/* Nút Âm thanh */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-[#fcf7e6] hover:bg-[#fff9e8] active:translate-y-0.5 border-[3px] border-[#3d2314] p-1.5 sm:px-2.5 sm:py-1.5 shadow-[2px_2px_0px_#1a0e08] text-[#3d2314] font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#2b4a1c]" /> : <VolumeX className="w-4 h-4 text-[#8a2424]" />}
            <span className="hidden sm:inline">{soundEnabled ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Nút Cài đặt toàn diện (Thời tiết, Âm thanh, Đổi tên) */}
          <button
            onClick={() => {
              setTempTo(toName);
              setTempFrom(fromName);
              setShowSettingsModal(true);
            }}
            className="bg-[#fcf7e6] hover:bg-[#fff9e8] active:translate-y-0.5 border-[3px] border-[#3d2314] p-1.5 sm:px-2.5 sm:py-1.5 shadow-[2px_2px_0px_#1a0e08] text-[#3d2314] font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform"
            title="Cài đặt thời tiết pixel, âm thanh và lời chúc"
          >
            <Settings className="w-4 h-4 text-[#7e5130]" />
            <span className="hidden sm:inline">CÀI ĐẶT</span>
          </button>

          {plantsRef.current.length > 0 && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="bg-[#fcf7e6] hover:bg-[#fff9e8] active:translate-y-0.5 border-[3px] border-[#3d2314] p-1.5 sm:px-2.5 sm:py-1.5 shadow-[2px_2px_0px_#1a0e08] text-[#3d2314] font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform"
              title="Xóa hết hoa để trồng lại"
            >
              <RefreshCw className="w-4 h-4 text-[#c0392b]" />
            </button>
          )}

          <button
            onClick={() => setShowDownloadModal(true)}
            className="bg-[#fcf7e6] hover:bg-[#fff9e8] active:translate-y-0.5 border-[3px] border-[#3d2314] p-1.5 sm:px-2.5 sm:py-1.5 shadow-[2px_2px_0px_#1a0e08] text-[#3d2314] font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform"
            title="Tải file HTML độc lập"
          >
            <Download className="w-4 h-4 text-[#2b4a1c]" />
            <span className="hidden sm:inline">TẢI HTML</span>
          </button>
        </div>
      </div>

      {/* NÚT CHẠY TRỐN "KHÔNG NHẬN HOA ĐÂU" */}
      <div
        style={{
          position: 'absolute',
          top: `${runawayPos.y}%`,
          left: `${runawayPos.x}%`,
          transition: 'all 0.16s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          zIndex: 15,
        }}
        onMouseEnter={handleRunawayMove}
        onTouchStart={handleRunawayMove}
        onClick={handleRunawayClick}
        className="pointer-events-auto"
      >
        <button
          className="bg-[#fde24f] hover:bg-[#ffd32a] active:translate-y-0.5 border-[3px] border-[#3d2314] px-2.5 py-1 text-xs font-bold text-[#3d2314] shadow-[2px_2px_0px_#1a0e08] cursor-pointer whitespace-nowrap"
        >
          {runawayTaunt || 'không nhận hoa đâu 😛'}
        </button>
      </div>

      {/* HỘP THOẠI RPG TYPEWRITER (CLICK ĐỂ HIỆN HẾT NGAY) */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none z-20">
        <div
          onClick={handleFastForwardDialog}
          className="w-full max-w-lg bg-[#fbf6e8] border-4 border-[#3d2314] p-3 sm:p-4 shadow-[4px_4px_0px_#1a0e08] pointer-events-auto relative cursor-pointer select-none"
        >
          <div className="flex items-center justify-between text-xs text-[#7e5130] font-bold pb-1.5 mb-1.5 border-b-2 border-[#e6d8b8]">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#c0392b]" />
              <span>GỬI: <strong className="text-[#c0392b] uppercase">{toName}</strong></span>
            </div>
            <span>TỪ: <strong className="text-[#3d2314]">{fromName}</strong></span>
          </div>

          <div className="text-[#22140c] text-sm sm:text-base font-medium leading-relaxed min-h-[46px] flex items-center">
            <span>{displayedText}</span>
            {!isTyping && (
              <span className="inline-block ml-1 text-[#c0392b] animate-bounce font-bold text-xs sm:text-sm">
                ▼
              </span>
            )}
          </div>

          <div className="text-[10px] sm:text-xs text-[#a8754b] mt-1 pt-1 border-t border-[#f0e4c8] flex justify-between">
            <span>💡 Nhấp đúp vào đất & hoa (coi chừng trật lất nha)</span>
            <span>20/10 🌸</span>
          </div>
        </div>
      </div>

      {/* MODAL KHI NỞ ĐỦ 8 BÔNG (ĐẠI TIỆC PHÁO HOA TOÀN MÀN HÌNH) */}
      {showGrandModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-[#fbf6e8] border-4 border-[#3d2314] max-w-md w-full p-5 shadow-[6px_6px_0px_#1a0e08] relative">
            <button
              onClick={() => setShowGrandModal(false)}
              className="absolute top-2 right-2 text-[#3d2314] hover:text-[#c0392b] font-bold p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-3">
              <div className="text-2xl mb-1">🎉 🌸 💖 🌸 🎉</div>
              <h2 className="text-lg sm:text-xl font-bold text-[#c0392b] uppercase tracking-wider">
                ĐẠI TIỆC 8 BÔNG HOA NỞ RỘ!
              </h2>
              <p className="text-xs text-[#7e5130] mt-0.5">Khu vườn rực rỡ và kiên trì nhất</p>
            </div>

            <div className="bg-[#fffef0] border-2 border-[#3d2314] p-3 text-sm leading-relaxed text-[#22140c] mb-4 space-y-2">
              <p>
                u là trời, kiên nhẫn đúp được trọn vẹn <strong>cả 8 bông hoa</strong> luôn á?!
              </p>
              {missCount > 0 ? (
                <p className="text-[#a8754b] italic">
                  (Trật tới <strong>{missCount} lần</strong> mà vẫn không bỏ cuộc, đỉnh thật sự đó nha!)
                </p>
              ) : (
                <p className="text-[#a8754b] italic">
                  (Tay nghề đúp chuẩn xác 100%, không trật phát nào luôn!)
                </p>
              )}
              <p className="font-semibold text-[#c0392b]">
                Đoạn đầu trêu cho bạn mỏi tay tí thôi, chứ 20/10 này chúc <span className="underline decoration-wavy decoration-[#c0392b]">{toName}</span> thật lòng luôn nè: luôn xinh đẹp, rạng rỡ, mỗi ngày đều ngập tràn niềm vui và được yêu thương chiều chuộng hết mực!
              </p>
              <p className="text-right font-bold text-xs text-[#3d2314] mt-2">
                — Ký tên: {fromName} 💕
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-[#c0392b] hover:bg-[#a92316] text-[#fffef0] font-bold py-2 border-[3px] border-[#3d2314] shadow-[2px_2px_0px_#1a0e08] active:translate-y-0.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                SAO CHÉP LINK GỬI NGƯỜI ẤY
              </button>
              <button
                onClick={() => setShowGrandModal(false)}
                className="bg-[#fbf6e8] hover:bg-[#fff9e8] text-[#3d2314] font-bold px-4 py-2 border-[3px] border-[#3d2314] shadow-[2px_2px_0px_#1a0e08] active:translate-y-0.5 text-xs sm:text-sm cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>

            {copyStatus && (
              <p className="text-center text-xs text-[#2b4a1c] font-bold mt-2 animate-bounce">
                {copyStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT (THỜI TIẾT PIXEL, ÂM THANH, TÊN) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-[#fbf6e8] border-4 border-[#3d2314] max-w-sm w-full p-4 sm:p-5 shadow-[6px_6px_0px_#1a0e08] relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-2.5 right-2.5 text-[#3d2314] hover:text-[#c0392b] font-bold p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#3d2314] mb-3 flex items-center gap-1.5 pb-2 border-b-2 border-[#e6d8b8]">
              <Settings className="w-4 h-4 text-[#c0392b]" />
              CÀI ĐẶT NÔNG TRẠI 20/10
            </h3>

            <div className="space-y-3.5 mb-4 text-xs">
              {/* PHẦN 1: HIỆU ỨNG THỜI TIẾT PIXEL */}
              <div className="bg-[#fffef0] border-2 border-[#3d2314] p-3 shadow-[2px_2px_0px_#1a0e08]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#7e5130] uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#f5af19]" />
                    Thời tiết background:
                  </span>
                  <span className="font-bold px-1.5 py-0.5 border border-[#3d2314] text-[10px] bg-[#fbf6e8] text-[#3d2314]">
                    {weather === 'sun' ? '☀️ NẮNG (TẮT)' : weather === 'rain' ? '🌧️ ĐANG MƯA' : '❄️ ĐANG TUYẾT'}
                  </span>
                </div>

                <p className="text-[#a8754b] text-[11px] mb-2.5 leading-tight">
                  Tạo cảm giác sống động, lãng mạn hơn cho nông trại với mưa lất phất hoặc tuyết nhẹ.
                </p>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <button
                    onClick={() => selectWeather('sun')}
                    className={`p-2 border-[2px] border-[#3d2314] flex flex-col items-center gap-1 text-center cursor-pointer transition-all ${
                      weather === 'sun'
                        ? 'bg-[#fde24f] text-[#3d2314] font-bold shadow-[2px_2px_0px_#1a0e08]'
                        : 'bg-[#fbf6e8] hover:bg-[#fff9e8] text-[#555]'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-[#f5af19]" />
                    <span className="text-[11px] font-bold">Nắng Dịu</span>
                    <span className="text-[9px] text-[#7e5130]">(Tắt hiệu ứng)</span>
                  </button>

                  <button
                    onClick={() => selectWeather('rain')}
                    className={`p-2 border-[2px] border-[#3d2314] flex flex-col items-center gap-1 text-center cursor-pointer transition-all ${
                      weather === 'rain'
                        ? 'bg-[#54a0ff] text-white font-bold shadow-[2px_2px_0px_#1a0e08]'
                        : 'bg-[#fbf6e8] hover:bg-[#fff9e8] text-[#555]'
                    }`}
                  >
                    <CloudRain className="w-5 h-5 text-[#54a0ff]" />
                    <span className="text-[11px] font-bold">Mưa Phùn</span>
                    <span className="text-[9px] text-[#2c3e50]">(Lất phất)</span>
                  </button>

                  <button
                    onClick={() => selectWeather('snow')}
                    className={`p-2 border-[2px] border-[#3d2314] flex flex-col items-center gap-1 text-center cursor-pointer transition-all ${
                      weather === 'snow'
                        ? 'bg-[#74b9ff] text-white font-bold shadow-[2px_2px_0px_#1a0e08]'
                        : 'bg-[#fbf6e8] hover:bg-[#fff9e8] text-[#555]'
                    }`}
                  >
                    <Snowflake className="w-5 h-5 text-[#74b9ff]" />
                    <span className="text-[11px] font-bold">Tuyết Nhẹ</span>
                    <span className="text-[9px] text-[#2c3e50]">(Bồng bềnh)</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#ebd8b8] text-[11px]">
                  <span className="text-[#7e5130]">Bật / Tắt hiệu ứng nhanh:</span>
                  <button
                    onClick={() => selectWeather(weather === 'sun' ? 'rain' : 'sun')}
                    className={`px-2 py-0.5 border border-[#3d2314] font-bold cursor-pointer text-[10px] ${
                      weather !== 'sun' ? 'bg-[#4c7a28] text-white' : 'bg-[#a8754b] text-white'
                    }`}
                  >
                    {weather !== 'sun' ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </button>
                </div>
              </div>

              {/* PHẦN 2: ÂM THANH 8-BIT */}
              <div className="bg-[#fffef0] border-2 border-[#3d2314] p-3 shadow-[2px_2px_0px_#1a0e08]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#7e5130] uppercase flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#2b4a1c]" />
                    Âm thanh retro (8-bit):
                  </span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-3 py-1 border-[2px] border-[#3d2314] font-bold cursor-pointer active:translate-y-0.5 text-xs ${
                      soundEnabled ? 'bg-[#4c7a28] text-white' : 'bg-[#ab2626] text-white'
                    }`}
                  >
                    {soundEnabled ? 'BẬT' : 'TẮT'}
                  </button>
                </div>
                <p className="text-[#a8754b] text-[11px] mt-1 leading-tight">
                  Tiếng tík tík typewriter, tiếng tưới nước, chim hót và pháo hoa.
                </p>
              </div>

              {/* PHẦN 3: ĐỔI TÊN NGƯỜI NHẬN & NGƯỜI GỬI */}
              <div className="bg-[#fffef0] border-2 border-[#3d2314] p-3 shadow-[2px_2px_0px_#1a0e08] space-y-2.5">
                <span className="font-bold text-[#7e5130] uppercase block">
                  Cá nhân hóa người nhận:
                </span>
                <div>
                  <label className="block text-[11px] font-bold text-[#7e5130] mb-0.5">
                    TÊN NGƯỜI NHẬN:
                  </label>
                  <input
                    type="text"
                    value={tempTo}
                    onChange={e => setTempTo(e.target.value)}
                    placeholder="Ví dụ: Lan, Bé Yêu..."
                    className="w-full bg-[#fbf6e8] border-2 border-[#3d2314] p-1.5 text-xs text-[#3d2314] focus:outline-none"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#7e5130] mb-0.5">
                    TÊN BẠN (NGƯỜI GỬI):
                  </label>
                  <input
                    type="text"
                    value={tempFrom}
                    onChange={e => setTempFrom(e.target.value)}
                    placeholder="Ví dụ: Tuấn, Người bí ẩn..."
                    className="w-full bg-[#fbf6e8] border-2 border-[#3d2314] p-1.5 text-xs text-[#3d2314] focus:outline-none"
                    maxLength={30}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  setToName(tempTo.trim() || 'cô gái đặc biệt');
                  setFromName(tempFrom.trim() || 'một người bạn');
                  setShowSettingsModal(false);
                  showDialog('Đã lưu cấu hình cài đặt thành công rồi nha [Tên]!');
                }}
                className="flex-1 bg-[#4c7a28] hover:bg-[#3d6220] text-[#fffef0] font-bold py-2 border-[3px] border-[#3d2314] shadow-[2px_2px_0px_#1a0e08] active:translate-y-0.5 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                LƯU CÀI ĐẶT
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-[#fbf6e8] hover:bg-[#fff9e8] text-[#3d2314] font-bold px-3 py-2 border-[3px] border-[#3d2314] shadow-[2px_2px_0px_#1a0e08] active:translate-y-0.5 text-xs cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full bg-[#f5af19] hover:bg-[#e09e14] text-[#3d2314] font-bold py-1.5 border-[2px] border-[#3d2314] text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              SAO CHÉP LINK CÓ SẴN CẤU HÌNH
            </button>
            {copyStatus && (
              <p className="text-center text-xs text-[#2b4a1c] font-bold mt-2">
                {copyStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL ĐỔI TÊN & LINK CHIA SẺ */}
      {isEditingNames && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50">
          <div className="bg-[#fbf6e8] border-4 border-[#3d2314] max-w-sm w-full p-5 shadow-[5px_5px_0px_#1a0e08]">
            <h3 className="text-base font-bold text-[#3d2314] mb-3 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-[#c0392b]" />
              CÁ NHÂN HÓA LỜI CHÚC 20/10
            </h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#7e5130] mb-1">
                  TÊN NGƯỜI NHẬN (CÔ GÁI ĐẶC BIỆT):
                </label>
                <input
                  type="text"
                  value={tempTo}
                  onChange={e => setTempTo(e.target.value)}
                  placeholder="Ví dụ: Lan, Phương, Bé Yêu..."
                  className="w-full bg-[#fffef0] border-2 border-[#3d2314] p-2 text-sm text-[#3d2314] focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7e5130] mb-1">
                  TÊN BẠN (NGƯỜI GỬI):
                </label>
                <input
                  type="text"
                  value={tempFrom}
                  onChange={e => setTempFrom(e.target.value)}
                  placeholder="Ví dụ: Tuấn, Người bí ẩn..."
                  className="w-full bg-[#fffef0] border-2 border-[#3d2314] p-2 text-sm text-[#3d2314] focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
                  maxLength={30}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setToName(tempTo.trim() || 'cô gái đặc biệt');
                  setFromName(tempFrom.trim() || 'một người bạn');
                  setIsEditingNames(false);
                  showDialog(`Đã cập nhật tên người nhận là [Tên] rồi nha!`);
                }}
                className="flex-1 bg-[#4c7a28] hover:bg-[#3d6220] text-[#fffef0] font-bold py-2 border-[3px] border-[#3d2314] shadow-[2px_2px_0px_#1a0e08] active:translate-y-0.5 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                LƯU THAY ĐỔI
              </button>
              <button
                onClick={() => setIsEditingNames(false)}
                className="bg-[#fbf6e8] hover:bg-[#fff9e8] text-[#3d2314] font-bold px-3 py-2 border-[3px] border-[#3d2314] shadow-[2px_2px_0px_#1a0e08] active:translate-y-0.5 text-xs cursor-pointer"
              >
                HỦY
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full mt-2.5 bg-[#f5af19] hover:bg-[#e09e14] text-[#3d2314] font-bold py-1.5 border-[2px] border-[#3d2314] text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              SAO CHÉP LINK CÓ SẴN TÊN
            </button>
            {copyStatus && (
              <p className="text-center text-xs text-[#2b4a1c] font-bold mt-2">
                {copyStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA VƯỜN */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50">
          <div className="bg-[#fbf6e8] border-4 border-[#3d2314] max-w-xs w-full p-4 shadow-[5px_5px_0px_#1a0e08] text-center">
            <h4 className="text-sm font-bold text-[#c0392b] mb-2">
              XÓA HẾT 8 BÔNG HOA?
            </h4>
            <p className="text-xs text-[#22140c] mb-4">
              phũ vậy... bao nhiêu công đúp mỏi tay nãy giờ đó nha :((
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResetGarden}
                className="flex-1 bg-[#c0392b] text-[#fffef0] font-bold py-1.5 border-[2px] border-[#3d2314] text-xs cursor-pointer active:translate-y-0.5"
              >
                XÓA HẾT LUÔN
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-[#fbf6e8] text-[#3d2314] font-bold py-1.5 border-[2px] border-[#3d2314] text-xs cursor-pointer active:translate-y-0.5"
              >
                THÔI GIỮ LẠI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẢI FILE HTML ĐỘC LẬP */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50">
          <div className="bg-[#fbf6e8] border-4 border-[#3d2314] max-w-sm w-full p-4 shadow-[5px_5px_0px_#1a0e08]">
            <h3 className="text-sm font-bold text-[#3d2314] mb-2 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#2b4a1c]" />
              XUẤT FILE HTML DUY NHẤT
            </h3>
            <p className="text-xs text-[#7e5130] mb-3 leading-relaxed">
              Tải file HTML đơn lẻ (Single-file) 100% tự chứa, không cần cài đặt gì, nhấp đúp là mở ngay trên điện thoại hoặc máy tính, hoặc gửi qua Zalo/Facebook/GitHub Pages!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadStandalone}
                className="flex-1 bg-[#2b4a1c] hover:bg-[#1f3514] text-[#fffef0] font-bold py-2 border-[3px] border-[#3d2314] text-xs flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                TẢI VỀ MÁY (.HTML)
              </button>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="bg-[#fbf6e8] text-[#3d2314] font-bold px-3 py-2 border-[3px] border-[#3d2314] text-xs cursor-pointer active:translate-y-0.5"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const { getUser, updateUser } = require('../data/user');
const { styleNum } = require('../tools')

const COOLDOWN_TIME = 30 * 60 * 1000; 
const SEP = "⎔───────㊙︎─────⎔";
const BUTTERFLY = "🦋";

const JOBS = {
  'صيد الشياطين': {
    ranges: [
      { max: 20, amountRange: [1000, 2000], action: 'أصبت بجروح بليغة أثناء المواجهة وخسرت', type: 'loss' },
      { max: 80, amountRange: [5000, 15000], action: 'قطعت رأس شيطان من الرتب الدنيا وحصلت على', type: 'win' },
      { max: 100, amountRange: [20000, 50000], action: 'واجهت قمراً هابطاً وأبدت شجاعة استحققت عليها', type: 'win' }
    ],
    baseMessage: 'خرجت في مهمة ليلية للصيد'
  },
  'حماية القرية': {
    ranges: [
      { max: 30, amountRange: [500, 1500], action: 'فشلت في حماية المخازن من النهب وخسرت', type: 'loss' },
      { max: 100, amountRange: [3000, 7000], action: 'أمنت القرية من هجوم مفاجئ وحصلت على مكافأة', type: 'win' }
    ],
    baseMessage: 'تم تكليفك بحماية قرية نائية'
  },
  'تدريب الهاشيرا': {
    ranges: [
      { max: 40, amountRange: [2000, 4000], action: 'لم تتحمل شدة تدريبات الهاشيرا وخسرت', type: 'loss' },
      { max: 100, amountRange: [10000, 25000], action: 'أبهرت الهاشيرا بقدراتك الاستثنائية وحصلت على', type: 'win' }
    ],
    baseMessage: 'دخلت في معسكر تدريب مكثف'
  },
  'تطهير الغابة': {
    ranges: [
      { max: 30, amountRange: [1000, 3000], action: 'تعرضت لكمين من شيطان الغابة وخسرت', type: 'loss' },
      { max: 100, amountRange: [5000, 10000], action: 'طهرت غابة "فوجيكاساني" تماماً وحصلت على', type: 'win' }
    ],
    baseMessage: 'قمت بتمشيط غابة الزهور'
  },
  'مرافقة العربة': {
    ranges: [
      { max: 50, amountRange: [1000, 2000], action: 'تعرضت القافلة للهجوم وفقدت حمولتها وخسرت', type: 'loss' },
      { max: 100, amountRange: [4000, 8000], action: 'وصلت القافلة بسلام إلى المقر وحصلت على', type: 'win' }
    ],
    baseMessage: 'قمت بحماية قافلة الإمدادات'
  },
  'علاج المصابين': {
    ranges: [
      { max: 30, amountRange: [500, 1000], action: 'أخطأت في مزج الأدوية في مشفى الفراشة وخسرت', type: 'loss' },
      { max: 100, amountRange: [3000, 6000], action: 'ساعدت "شينوبو" في شفاء المحاربين وحصلت على', type: 'win' }
    ],
    baseMessage: 'عملت في مشفى الفراشة'
  }
};

const getRandomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomJobResult = (job) => {
  const ratio = Math.floor(Math.random() * 101);
  const range = job.ranges.find(r => ratio <= r.max);
  if (!range) return { amount: 0, action: 'لم تتوفر مهمات في الفيلق اليوم', type: 'neutral' };
  
  return {
    amount: getRandomAmount(range.amountRange[0], range.amountRange[1]),
    action: range.action,
    type: range.type
  };
};

const handleJobCommand = async (api, event, user) => {
  const { threadID, messageID } = event;
  const currentTime = Date.now();
  user.lastJobTime = Number(user.lastJobTime) || 0; 

  const timeElapsed = currentTime - user.lastJobTime;
  if (timeElapsed < COOLDOWN_TIME) {
    const timeRemaining = COOLDOWN_TIME - timeElapsed;
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    let timeMsg = '';
    if (minutes > 0) timeMsg += `${styleNum(minutes)} دقيقة`;
    if (seconds > 0) timeMsg += `${minutes > 0 ? ' و ' : ''}${styleNum(seconds)} ثانية`;

    return api.sendMessage(`${BUTTERFLY} | جسدك يحتاج للراحة! انتظر ${timeMsg} قبل المهمة التالية.`, threadID, messageID);
  }

  const jobKeys = Object.keys(JOBS);
  const randomJobKey = jobKeys[Math.floor(Math.random() * jobKeys.length)];
  const job = JOBS[randomJobKey];
  
  const { amount, action, type } = getRandomJobResult(job);
  user.lastJobTime = currentTime; 

  if (type === 'neutral') {
    await updateUser(user.id, { lastJobTime: user.lastJobTime });
    return api.sendMessage(`${BUTTERFLY} | الغراب أبلغك أنه لا توجد مهمات ${randomJobKey} حالياً.`, threadID, messageID);
  }

  user.money = Number(user.money) || 0;
  let finalAmount = amount;
  
  if (type === 'loss') {
    if (user.money < amount) {
      finalAmount = user.money;
      user.money = 0;
    } else {
      finalAmount = -amount;
      user.money += finalAmount;
    }
  } else {
    user.money += finalAmount;
  }
  
  await updateUser(user.id, { money: user.money, lastJobTime: user.lastJobTime });

  const sign = finalAmount >= 0 ? '+' : '-';
  const formattedAmount = Math.abs(finalAmount).toLocaleString();
  const balance = user.money.toLocaleString();

  const finalMessage = 
    `${SEP}\n` +
    `${BUTTERFLY} | تـقـريـر الـمـهـمـة\n` +
    `${SEP}\n` +
    `⌬ ${job.baseMessage}\n` +
    `⌬ ${action} ${sign}${styleNum(formattedAmount)} جنيه.\n` +
    `⌬ رصيدك الحالي: ${styleNum(balance)} جنيه.\n` +
    `${SEP}`;

  api.sendMessage(finalMessage, threadID, messageID);
};

module.exports = {
  name: 'عمل',
  otherName: ['شغل', 'job'],
  type: ['الاموال', 'الالعاب'],
  rank: 0,
  run: async (api, event) => {
    const user = await getUser(event.senderID);
    if (!user) {
      return api.sendMessage(`${BUTTERFLY} | لم يتم تسجيلك في سجلات الفيلق. استخدم "تسجيل" أولاً.`, event.threadID, event.messageID);
    }
    await handleJobCommand(api, event, user);
  }
};

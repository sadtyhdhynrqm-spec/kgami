const { getUserRank } = require("../handlers/handleCmd");
const log = require('../logger')
const config = require('../config.json')
const { styleText, styleNum } = require('../tools')

module.exports = {
  name: "اوامر",
  otherName: ['help', 'أوامر'],
  rank: 0,
  cooldown: 0,
  hide: false,
  prefix: true,
  run: async (api, event, allCommands) => {
    try {
      const { senderID, threadID, messageID } = event;
      const userRank = getUserRank(senderID, config);
      
      const availableCommands = (allCommands || []).filter(cmd => {
        if (userRank >= 2) return cmd.name !== 'اوامر'; 
        return cmd.rank <= userRank && cmd.hide === false && cmd.name !== 'اوامر';
      });

      if (availableCommands.length === 0) {
        return api.sendMessage(`⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ لا توجد أوامر متاحة.\n●────── ✾ ⌬ ✾ ──────●`, threadID, messageID);
      }
      
      const totalCommands = availableCommands.length;

      const categories = {};
      availableCommands.forEach(cmd => {
        const cat = cmd.category || "الألعاب";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd.name);
      });

      let finalCommands = "";
      const catKeys = Object.keys(categories);

      catKeys.forEach((cat, index) => {
        finalCommands += `✾ ┇\n✾ ┇ ⏣ ⟬ قـسـم ${cat} ⟭\n`;
        const cmds = categories[cat];
        
        // عرض الأوامر بنظام 3 في كل سطر
        for (let i = 0; i < cmds.length; i += 3) {
          const row = cmds.slice(i, i + 3).join(' ◍ ');
          finalCommands += `✾ ┇ ◍ ${row}\n`;
        }

        // إضافة الفاصل الممتد بين الأقسام
        if (index !== catKeys.length - 1) {
          finalCommands += `✾ ┇ ⸻⸻⸻⸻⸻\n`;
        }
      });

      const messageText = `●────── ✾ ⌬ ✾ ──────●
${finalCommands}
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣
 ⠇عـدد الأوامـر: ${styleNum(totalCommands)}
 ⠇الـمـطـوࢪ: سينكو 𓆩☆𓆪`;
      
      api.sendMessage(messageText, threadID, messageID);
    } catch (err) {
      log.error(err);
      api.sendMessage('error in help.js', config.editor);
    }
  }
};

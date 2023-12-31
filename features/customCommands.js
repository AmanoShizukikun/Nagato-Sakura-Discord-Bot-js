// features/customCommands.js

const { readFileAsync, writeFileAsync } = require('../utils/fileUtils');
//const axios = require('axios');
//const cheerio = require('cheerio');

const cache = {};                                                                       //快取所有伺服器指令

async function addCommand(guildId, commandName, replyMessage) {                         //!add 指令
  const commands = await getCommands(guildId);                                          //addCommand從getCommands拿指令
  const lowercaseCommandName = commandName.toLowerCase();
  if (['add', 'edit', 'remove', 'help', 'vote', 'addvote', 'voteresults'].includes(lowercaseCommandName)) {       
    return '禁止使用關鍵字作為指令';
  }
  if (!commandName || !replyMessage) {                                                  //檢測格式是否正確
    return '請使用正確格式 : !add [指令名稱] [回覆內容]';
  }
  commands[lowercaseCommandName] = replyMessage;                                        //設定指令
  await saveCommands(guildId,commands);                                                 //存檔
  return `已新增指令「${lowercaseCommandName}」，回覆訊息為：${replyMessage}`;
}

async function editCommand(guildId, commandName, replyMessage) {                        //!edit 指令
  const commands = await getCommands(guildId);
  const lowercaseCommandName = commandName.toLowerCase();
  if (!commands[lowercaseCommandName]) {
    return `找不到指令「${commandName}」，請先使用 !add 新增指令。`;
  }
  if (!replyMessage) {
    return '請設定回覆訊息：!edit [指令名稱] [回覆內容]';
  }
  commands[lowercaseCommandName] = replyMessage;
  await saveCommands(guildId, commands);
  return `已編輯指令「${lowercaseCommandName}」的回覆訊息為：${replyMessage}`;
}

async function removeCommand(guildId, commandName) {                                     //remove指令
  const commands = await getCommands(guildId);
  const lowercaseCommandName = commandName.toLowerCase();
  if (!commands[lowercaseCommandName]) {
    return `找不到指令「${commandName}」，請先使用 !add 新增指令。`;
  }
  delete commands[lowercaseCommandName];
  await saveCommands(guildId, commands);
  return `已刪除指令「${lowercaseCommandName}」`;
}

async function getCommands(guildId) {
  if (!cache[guildId]) {                                                                  //從快取版本先拿資料
    try {
      const filePath = `server/${guildId}.json`;                                          //沒有快取就先讀檔
      const data = await readFileAsync(filePath);
      cache[guildId] = data || {};                                                        //讀完檔就設定快取資料為拿到的data
    } 
    catch (err) {
      console.error(err);
      cache[guildId] = {};
    }
  }
  return cache[guildId];
}

async function saveCommands(guildId, commands) {                                         //存檔
  try {
    const filePath = `server/${guildId}.json`;
    await writeFileAsync(filePath, commands);
    cache[guildId] = commands;
  } 
  catch (err) {
    console.error(err);
  }
}

async function createVote(guildId, question, option) {  
  const votes = await getVotes(guildId);
  if (!question || option.length < 2) {
    return '請使用正確格式 : !addvote [問題] [選項0] [選項1] ...';
  }
  votes[question] = option.map((option, index) => ({
    option,
    votes: 0,
  }));
  await saveVotes(guildId, votes);
  return `已創建投票：${question}`;
}

async function vote(guildId, question, optionIndex) {
  const votes = await getVotes(guildId);
  if (!votes[question]) {
    return '找不到該投票。';
  }
  const options = votes[question];
  if (optionIndex < 0 || optionIndex >= options.length) {
    return '請輸入有效的選項編號。';
  }
  options[optionIndex].votes++;                                                                 // 增加所選選項的票數
  await saveVotes(guildId, votes);
  let message = `你的投票已記錄！\n\n目前「${question}」各選項的票數：\n`;                         // 準備回傳訊息，包含所有選項的票數
  options.forEach((option, index) => {
    message += `選項: ${option.option} ${option.votes} 票\n`;
  });
  return message;
}

async function getVotes(guildId) {
  if (!cache[`votes_${guildId}`]) {
    try {
      const filePath = `server/votes_${guildId}.json`;
      const data = await readFileAsync(filePath);
      cache[`votes_${guildId}`] = data || {};
    } 
    catch (err) {
      console.error(err);
      cache[`votes_${guildId}`] = {};
    }
  }
  return cache[`votes_${guildId}`];
}

async function saveVotes(guildId, votes) {
  try {
    const filePath = `server/votes_${guildId}.json`;
    await writeFileAsync(filePath, votes);
    cache[`votes_${guildId}`] = votes;
  } 
  catch (err) {
    console.error(err);
  }
}

async function getVoteResults(guildId, question) {
  const votes = await getVotes(guildId);
  if (!votes[question]) {
    return '找不到該投票。';
  }
  const options = votes[question];
  let message = `目前「${question}」各選項的票數：\n`;                                         // 準備回傳訊息，包含所有選項的票數
  options.forEach((option, index) => {
    message += `選項: ${option.option} ${option.votes} 票\n`;
  });
  return message;
}

/*
async function searchWeb(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
    const response = await axios.get(searchUrl);
    const searchData = parseSearchResults(response.data);
    return searchData;
  } catch (error) {
    console.error(error);
    throw new Error('發生錯誤，無法取得搜尋結果。');
  }
}

function parseSearchResults(html) {
  const $ = cheerio.load(html);
  const searchResults = [];
  $('.tF2Cxc').each((index, element) => {
    const title = $(element).find('h3').text();
    const link = $(element).find('a').attr('href');
    searchResults.push({ title, link });
  });
  return searchResults.map((result, index) => `${index + 1}. ${result.title} - ${result.link}`);
}
*/

async function processCustomCommand(guildId, command, args) {                 
  const lowercaseCommand = command.toLowerCase();                              //先看指令是否為大小寫，並轉成小寫
  const commands = await getCommands(guildId);
  if (commands[lowercaseCommand]) {                                            //找到直接回傳找到的指令
    return commands[lowercaseCommand];
  }
  else if (lowercaseCommand === 'help') {                                      //2023/09/11 更改部分
    return '使用方式：\n' +                                                     // 返回帮助信息
           '`!add [指令名稱] [回覆內容]` - 新增自訂指令\n' +
           '`!edit [指令名稱] [新的回覆內容]` - 編輯自訂指令\n' +
           '`!remove [指令名稱]` - 刪除自訂指令\n' +
           '`!help` - 顯示此幫助信息\n' +
           '`!addvote [問題] [選項0] [選項1] ...` - 創建一個新的投票\n' +
           '`!vote [問題] [選項編號(從0開始)]` - 投票\n' +
           '`!voteresults [問題]` - 顯示投票結果';
  }
  else if (command === 'addvote') {
    if (args.length < 3) {  // 修改為至少3個參數
      return '請使用正確格式 : !addvote [問題] [選項0] [選項1] ...';
    }
    const question = args.shift();
    return await createVote(guildId, question, args);
  }
  else if (command === 'vote') {
    if (args.length < 2) {
      return '請使用正確格式 : !vote [問題] [選項編號(從0開始)]';
    }
    const question = args.shift();
    const optionIndex = parseInt(args[0]); // 解析選項編號
    return await vote(guildId, question, optionIndex);
  }
  else if (command === 'voteresults') {
    if (args.length < 1) {
      return '請使用正確格式 : !voteresults [問題]';
    }
    const question = args.join(' ');
    return await getVoteResults(guildId, question);
  }
  else if (command === 'search') {
    if (args.length < 1) {
      return '請使用正確格式 : !search [查詢內容]';
    }
    const query = args.join(' ');
    try {
      const searchResults = await searchWeb(query);
      if (searchResults.length === 0) {
        return '未找到任何搜尋結果。';
      } else {
        return '搜尋結果:\n' + searchResults.join('\n');
      }
    } catch (error) {
      console.error(error);
      return '發生錯誤，無法取得搜尋結果。';
    }
  }
  else {
    return '無效指令!請用 !add 、 !edit 或 !remove 來管理指令。';                 //回傳無效指令
  }
}

async function handleCommand(message) {
  const args = message.content.slice(1).trim().split(/ +/);                     //分解message
  const command = args.shift().toLowerCase();                                   //
  const guildId = message.guild.id;                                             //guildId拿到伺服器的id
  if (['add', 'edit', 'remove', ].includes(command)) {
    if (command === 'add') {
      const commandName = args.shift();                                         //從args陣列拿走add，123變為commandName
      const replyMessage = args.join(' ');                                      //456變為replyMessage
      return await addCommand(guildId, commandName, replyMessage);              //新增Command指令
    } 
    else if (command === 'edit') {
      const commandName = args.shift();                                         //從args陣列拿走edit
      const replyMessage = args.join(' ');
      return await editCommand(guildId, commandName, replyMessage);
    } 
    else if (command === 'remove') {
      const commandName = args.shift();                                         //從args陣列拿走remove
      return await removeCommand(guildId, commandName);
    }
    else if (command === 'addvote') {
      if (args.length < 3) {
        return '請使用正確格式 : !addvote [問題] [選項0] [選項1] ...';
      }
      const question = args.shift();
      return await createVote(guildId, question, args);
    }
    else if (command === 'vote') {
      if (args.length > 3) {
        return '請使用正確格式 : !vote [問題] [選項編號(從0開始)]';
      }
      const question = args.shift();
      return await vote(guildId, question, args);
    }
    else if (command === 'help') {                                             
      return                                                                   //直接返回帮助信息
    }
  } 
  else {
    return await processCustomCommand(guildId, command, args,);                  //執行CustomCommand
  }
}

module.exports = {
  addCommand,
  editCommand,
  removeCommand,
  handleCommand,
  //searchWeb,
};
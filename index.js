// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, } = require('discord.js');  //從discord.js 讀取 Client Events GatewayIntenBits資料
const { token } = require('./config.json');                           //從config.json讀取機器人的token
const { handleCommand } = require('./features/customCommands');       //執行到handleCommand時運行features/customCommands.js


// Create a new client instance
const client = new Client({ 
    intents: [  //設定機器人權限
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
 });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);                 //傳送機器人登入訊息
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;                                   //判斷訊息是否來自機器人
    if (message.content.startsWith('!')) {                            //確認第一個字母是否為驚嘆號
        try {
            const replyMessage = await handleCommand(message);        //replyMessage拿到handleCommand中的message
            if (replyMessage) {
                message.reply(replyMessage);                          //回覆
            }
        }
        catch (err) {                                                 //錯誤狀況
            console.error(err);                                       //日誌紀錄錯誤
            message.reply('錯誤，指令失敗')                            //客戶端回報錯誤
            }
        }
});

client.on(Events.MessageCreate, async (message) => {                 //機器人打招呼
    if (message.author.bot) return;                                  //判斷訊息是否來自機器人
    if (message.content === '哈囉'){                                 //偵測關鍵字
        message.reply(`你好${message.author.toString()}`)            //回覆已設定好的答案並且@發送訊息的人
    } 
    if (message.content === '你好'){                                 //偵測關鍵字
        message.reply(`你好${message.author.toString()}`)
    } 
    if (message.content === '小妖精'){                               //偵測關鍵字
        message.reply(`你好${message.author.toString()}請問有甚麼需要幫忙的嗎? \n請輸入 !help 讓我進一步協助您`)
    } 
});

// Log in to Discord with your client's token
client.login(token);

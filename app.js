const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const tokenLib = require('./token');
const token = tokenLib.token;

const commandsMenu = {
  reply_markup: {
    inline_keyboard: [
      [{
        text: 'Вибрати валюту',
        callback_data: 'course'
      }],
      [{
        text: 'Показати курс усіх валют',
        callback_data: 'all_courses'
      }]
    ]
  }
};

const currencyMenu = {
  reply_markup: {
    inline_keyboard: [
      [{
        text: '€ - EUR',
        callback_data: 'EUR'
      }, {
        text: '$ - USD',
        callback_data: 'USD'
      }],
      [{
        text: '₽ - RUR',
        callback_data: 'RUR'
      }, {
        text: '₿ - BTC',
        callback_data: 'BTC'
      }]
    ]
  }
};

const flag = {
  'EUR': '🇪🇺',
  'USD': '🇺🇸',
  'RUR': '🇷🇺',
  'UAH': '🇺🇦',
  'BTC': '₿'
};

const currencies = [
  'EUR',
  'USD',
  'RUR',
  'UAH',
  'BTC'
];

const showStartMenu = function (chatId) {
  bot.sendMessage(chatId, 'Виберіть потрібний пункт меню', commandsMenu);
}

const showCourseMenu = function (chatId) {
  bot.sendMessage(chatId, 'Виберіть яка валюта вас цікавить', currencyMenu);
}

const onCourseButtonClick = function (query, chatId) {
  request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function (error, response, body) {
    const data = JSON.parse(body);
    const result = data.filter(item => item.ccy === query.data)[0];
    let md = `
      *${flag[result.ccy]} ${result.ccy} 💱 ${result.base_ccy} ${flag[result.base_ccy]}*
      Buy: _${result.buy}_
      Sale: _${result.sale}_
    `;
    bot.sendMessage(chatId, md, {
      parse_mode: 'Markdown'
    })
  });
};

const onAllCoursesButtonClick = function (chatId) {
  request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5',
    function (error, response, body) {
      const data = JSON.parse(body);
      let md = 'Курс відносно гривні 🇺🇦\n';
      data.forEach(element => {
        if (flag[element.ccy] && element.ccy !== 'BTC') {
          md += '' + flag[element.ccy] + ' ' + element.buy + '\n';
        }
      });
      bot.sendMessage(chatId, md)
    });
}

const bot = new TelegramBot(token, {
  polling: true
});

bot.onText(/\/menu/, (msg, match) => {
  showStartMenu(msg.chat.id);
});

bot.onText(/\/course/, (msg, match) => {
  showCourseMenu(msg.chat.id);
});

bot.onText(/\/all_courses/, (msg, match) => {
  onAllCoursesButtonClick(msg.chat.id);
});

bot.on('callback_query', query => {
  const chatId = query.message.chat.id;
  const typeOfQuery = query.data;
  if (typeOfQuery === 'course') {
    showCourseMenu(chatId);
  } else if (typeOfQuery === 'all_courses') {
    onAllCoursesButtonClick(chatId);
  } else if (currencies.indexOf(typeOfQuery) !== -1) {
    onCourseButtonClick(query, chatId);
  }
});
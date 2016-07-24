
$('#botdroid-box').remove();
$('head link[href*="botdroid.css"]').remove(); // remove existing css
$('head link[href*="minEmoji2.css"]').remove();
$('head script[src*="jMinEmoji2.min.js"]').remove();

var host = "http://localhost:8080";
var apiHost = "http://192.168.1.106/"
var BotDroid = function() {};
var currentQuery = 'user-opinion';

// ---------- Chat field ----------
var chatField = $('<input id="botdroid-textinput" type="text">');

$(chatField).bind('enterKey',function(e) {
	var target = $(e.target)
	var text = target.val();
	if (text.length > 0) {
		BotDroid.onText(text);
		target.val('');
	}
});

chatField.keyup(function(e) {
    if(e.keyCode == 13) {
        $(this).trigger('enterKey');
    }
});

// ---------- Chat list ----------

var chatList = $('<div id="botdroid-list">');
chatList.css({
	flex: '1 1 auto',
	overflow: 'scroll'
});

// ---------- Chat Header ----------
var chatHeader = $('<div id="botdroid-header">');
chatHeader.append('<span id="botdroid-title">Gilloux da b0t!</span>');
var closeButton = $('<a id="botdroid-header-close">X</a>');
chatHeader.append(closeButton);

// ---------- Chat box ----------
var chatBox = $('<div id="botdroid-box">');
chatBox.append(chatHeader, chatList, chatField);

// ---------- BotDroid logic ----------

BotDroid.createButtons = function(buttons) {
	var buttonList = $('<div class="button-list">');

	$.map(buttons, function(value, key) {
			var btn = $('<a href="#" class="bubble">');
			btn.text(value).minEmoji();
			btn.click(function() {

				// hack: removing the bubble around the button list
				BotDroid.removeAnimated(buttonList.parent(), function() {
					//BotDroid.removeAnimated(); 
					BotDroid.sendUserMessage(value, function() {
						BotDroid.newQuery(key);
					});
				});
				
			});
			return btn;
		})
		.forEach(function(btn) {
			buttonList.append(btn);
		});

	return buttonList;
};

BotDroid.sendBotMessage = function(message, cb) {
	var bubble = $('<div class="bubble bubble-bot">');
	bubble.append(message);
	BotDroid.addAnimated(bubble, cb);
};

BotDroid.sendUserMessage = function(message, cb) {
	var bubble = $('<div class="bubble bubble-user">');
	bubble.append(message);
	BotDroid.addAnimated(bubble, cb);
};

BotDroid.addLoader = function(cb) {
	var loader = $('<div class="bubble bubble-bot">');
	loader.append($('<div class="loading-dots"><span/><span/><span/></div>'));
	BotDroid.addAnimated(loader, cb);
	return loader;
};

BotDroid.removeAnimated = function(elmt, cb) {
	elmt.addClass('animated chatOut');
	elmt.bind('animationend', function() {
		elmt.remove();
		if (cb) { cb(); }
	});
};

BotDroid.addAnimated = function(elmt, cb) {
	elmt.bind('animationend', function() {
		if (cb) { cb(); }
	});

	chatList.append(elmt);
	elmt.addClass('animated chatIn');

	chatList.animate({ scrollTop: chatList.prop('scrollHeight') - chatList.height() }, 'fast');
};

BotDroid.onText = function(text) {
	var newElement = $('<div class="bubble bubble-user">');
	newElement.text(text);
	BotDroid.addAnimated(newElement, function() {

		if (BotDroid.inputKey) {
			BotDroid.inputKey = null; // quirky, send text in key
			BotDroid.newQuery(text);
		} else {
			// todo: dummy loader
			var loader = BotDroid.addLoader(function() {
				setTimeout(function() {
					BotDroid.removeAnimated(loader);
				}, 1500);
			});
		}
	});
};

BotDroid.handleTextResponse = function(item) {
	var span = $('<span>');
	span.text(item).minEmoji();
	BotDroid.sendBotMessage(span);
};

BotDroid.handleButtonResponse = function(item) {
	var buttonList = BotDroid.createButtons(item);
	BotDroid.sendBotMessage(buttonList);
};

BotDroid.handleImageResponse = function(item) {
	var img = $('<img>');
	img.prop('src', item);
	BotDroid.sendBotMessage(img);
};

BotDroid.handleInputResponse = function(item) {
	BotDroid.inputKey = item;
};

BotDroid.handleChangeQuestionResponse = function(item) {
	BotDroid.inputKey = null;
	currentQuery = item;
	BotDroid.newQuery();
};

BotDroid.handleResponse = function(data) {

	const handlers = {
		'text': BotDroid.handleTextResponse,
		'button': BotDroid.handleButtonResponse,
		'image': BotDroid.handleImageResponse,
		'input': BotDroid.handleInputResponse,
		'change-question': BotDroid.handleChangeQuestionResponse,
	};
	const delay = 400;

	data.forEach(function(item, index) {
		setTimeout(function() {
			var handler = handlers[item.type];
			if (handler) {
				handler(item.items);
			}
		}, delay*index);
		
	});
};

BotDroid.newQuery = function(key) {
	var endpoint = apiHost + '?question='+encodeURIComponent(currentQuery)
	if (key) {
		endpoint = endpoint + '&key='+encodeURIComponent(key);
	}

	console.log('> GET ' + endpoint);

	var loader = BotDroid.addLoader();
	var start = new Date().getTime();
	const minWaitTime = 1500;

	$.get(endpoint, function(data) {
		var duration = (new Date().getTime() - start);
		var remainingWaitTime = Math.max(0, minWaitTime - duration);
		setTimeout(function() {
			BotDroid.removeAnimated(loader, function() {
				BotDroid.handleResponse(data);
			});
		}, remainingWaitTime);
	});
};

BotDroid.start = function() {
	BotDroid.newQuery();
};

// ---------- Integration ----------

// insert a reload query param to force reload the stylesheet
$('head').append('<link rel="stylesheet" href="'+host+'/css/botdroid.css?reload='+encodeURIComponent(new Date())+'" type="text/css" />');
$('head').append('<link rel="stylesheet" href="'+host+'/css/minEmoji2.css" type="text/css" />');
$('head').append('<script type="text/javascript" src="'+host+'/js/jMinEmoji2.min.js" />');
$(document.body).append(chatBox);
chatField.focus();

BotDroid.start();

$('#botdroid-box').remove();
$('head link[href*="botdroid.css"]').remove(); // remove existing css

var host = "http://localhost:8080";
var apiHost = "http://192.168.1.106/"
var BotDroid = function() {};

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

// ---------- Chat box ----------
var chatBox = $('<div id="botdroid-box">');
chatBox.append(chatList, chatField);

// ---------- BotDroid logic ----------

BotDroid.createButtons = function(buttons) {
	var buttonList = $('<div class="button-list">');

	$.map(buttons, function(value, key) {
			var btn = $('<a href="#" class="bubble">');
			btn.text(value);
			btn.click(function() {
				BotDroid.removeAnimated(buttonList.parent()); // hack: removing the bubble around the button list
				BotDroid.sendUserMessage(value, function() {
					BotDroid.newQuery(key);
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
		var loader = BotDroid.addLoader(function() {
			//
			setTimeout(function() {
				BotDroid.removeAnimated(loader);
			}, 1500);
		});
	});
};

BotDroid.handleTextResponse = function(item) {
	var span = $('<span>');
	span.text(item);
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

BotDroid.handleResponse = function(data) {

	const handlers = {
		'text': BotDroid.handleTextResponse,
		'button': BotDroid.handleButtonResponse,
		'image': BotDroid.handleImageResponse
	};
	const delay = 600;

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
	var endpoint = apiHost + '?question='+encodeURIComponent(key);
	var loader = BotDroid.addLoader();
	$.get(endpoint, function(data) {
		BotDroid.removeAnimated(loader, function() {
			BotDroid.handleResponse(data);
		});
	});
};

BotDroid.start = function() {
	BotDroid.newQuery('mood');
};

// ---------- Integration ----------

// insert a reload query param to force reload the stylesheet
$('head').append('<link rel="stylesheet" href="'+host+'/botdroid.css?reload='+encodeURIComponent(new Date())+'" type="text/css" />');
$(document.body).append(chatBox);
chatField.focus();

BotDroid.start();
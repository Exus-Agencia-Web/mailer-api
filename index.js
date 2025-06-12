console.dump = function(data,titulo="Dump:"){ console.log(""); console.log("## "+titulo); console.dir(data); console.log(""); }
process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = 1;


exports.handler = async (event, context, lambda_cb) => {
	var socket;
	var isWebSocket = (!!event.requestContext && !!event.requestContext.routeKey && !event.rawPath);
	const awsAccountId = context.invokedFunctionArn.split(':')[4];
	context.callbackWaitsForEmptyEventLoop = false;
	var firebase = require("firebase-admin");
	var serviceAccount = require("firebase.json");
	const { session:sessionManager, tools, ddb, jwt, dump, mixpanel } = require("PageGearCoreNode");
	const {SocketManager,SocketManagerAPI} = require("./libs/socket");
	const axios = require('axios');
	const uploader = require('./libs/uploader');

	const session = Object.assign({},sessionManager);

	// UTILIDADES
	var utils = {

		wait: async (milis)=>{
			return new Promise((resolve,reject)=>{
				setTimeout(function(){
					resolve(1);
				},milis);
			});
		},

		cachedData: cachedData,
		internalPrivateKey: "17d3c46fd7a2bd49f8fec8e4257e88e9",
		internalPGEAPIKey: "b2f80567bfd0cc457d0dc4c81927cb2c",
		authorizedHeaders: 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,pagegeartoken,PageGearToken,PageGear-Token,pagegear-token,Cookie,cookie,Cache-Control,Expires',

		validHttpCode: (code) => {
			const codes = [200, 301, 401, 404, 500, 502];
			return (codes.includes(code)) ? code : 200;
		},

		responderRaw : async (data = null, httpcode = 200) => {
			if(isWebSocket){
				let response = {statusCode:httpcode, body:data};
				if(!!event.body && !!event.body.cbId) response.cbId = event.body.cbId;
				return lambda_cb(null, response);
			}else{
				let response = {
					"statusCode": httpcode,
					"headers": {
						"Access-Control-Allow-Origin":"*",
						"Access-Control-Allow-Headers": utils.authorizedHeaders,
						"Content-type": "application/json; charset=utf-8",
						"Cache-Control": "public, max-age=0",
						"Expires": new Date(Date.now()).toUTCString(),
						// "Set-Cookie": 'PageGearToken='+SessionID+';Expires='+expires+';Path=/;Domain=api.pagegear.co'
					},
					"body": data,
					"isBase64Encoded": false
				};
				return lambda_cb(null, response);
			}
		},

		responder : async (status, dataset = null,status_message = null, httpcode = 200, __http_response=true) => {
			let response;
			let resp = { status: status };

			if(dataset != null) {
				resp.data = dataset;
			}

			if(status_message != null) {
				resp.status_message = status_message;
			}

			let token = await session.save();

			if(__http_response == false) return resp;

			if(isWebSocket){
				resp.connectionId = event.requestContext.connectionId;
				if(!!event.body && !!event.body.cbId) resp.cbId = event.body.cbId;

				//  Eventos de depuración vía socket
				// if(( !!event.body &&  !!event.body.dumpConnectionId) || (!!event.headers && !!event.headers.dumpConnectionId  )){
				// 	const connectionId = ( !!event.body &&  !!event.body.dumpConnectionId)?event.body.dumpConnectionId : event.headers.dumpConnectionId;
				// 	await SocketManager.emmit(connectionId,{resp, event, context});
				// }
				// console.dump(resp,"##RESP:");

				response = {statusCode:200, body:JSON.stringify(resp)};
				lambda_cb(null, response);
			}else{
				resp.PageGearToken = token;
				response = {
					"statusCode": httpcode,
					"headers": {
						"Access-Control-Allow-Origin":"*",
						"Access-Control-Allow-Headers": utils.authorizedHeaders,
						"Content-type": "application/json; charset=utf-8",
						"Cache-Control": "public, max-age=0",
						"LiveConnect-Version": "2059",
						"Expires": new Date(Date.now()).toUTCString(),
					},
					"body": JSON.stringify(resp),
					"isBase64Encoded": false
				};

				// console.dump(resp,"##RESP:");
				lambda_cb(null, response);
			}
			await utils.wait(1000);
			return response;
		},

		apiResp: async(dataset,status=1,status_message="Ok", __http_response=true)=>{
			return await utils.responder(status,dataset,status_message, 200, __http_response);
		},

		apiError: async(status,status_message=null,dataset=null, __http_response=true)=>{
			return await utils.responder(status,dataset,status_message, 200, __http_response);
		},

		isJson: (str) => {
		    try {
		        JSON.parse(str);
		    } catch (e) {
		        return false;
		    }
		    return true;
		},

		sleep: (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs)),

		dump: async(data,titulo="Dump from Lambda!")=>{
			// console.dir(JSON.stringify(data,null, 4));
			try{
				let texto = "🚧 " + titulo + "\n\n```JS\n" + JSON.stringify(data, null, 4) + "\n```";
				return await utils.discord(texto,"https://discord.com/api/webhooks/872191700263641139/Gm-2PKtcwRq45nnWOCX95mmjOt9SF6iArivRmfmoPD5VzKlaU-8rLCDvtBA61lv99BKV");
			}catch(e){}
		},

		pushDiscord: async(texto)=>{
			return await utils.discord(texto,"https://discord.com/api/webhooks/866339159010312262/ncNxBgbdtod0GNid1v1w-MPCm5J4M96wD-AST_vA37ZaDR1vhfG0MU6ju2Dw1Ih856S9");
		},

		discord: async(texto,url)=>{
			let axiosConfig = {};
				axiosConfig.method = 'post';
				axiosConfig.url = url;

				// Header
				axiosConfig.headers = {};
				axiosConfig.headers['Content-Type'] = "application/json";
				axiosConfig.headers['User-Agent'] = "PageGear-Lambda-Hook/1.4.3";

				// Información POST
				axiosConfig.data = {
					content: texto
				};

			return await axios(axiosConfig).catch();
		}

	};

	const parseMixData = (_data, _event, _context) => {
		let dataset = {};
			dataset.path = _event.path;
			dataset.stage = (_event.requestContext && _event.requestContext.stage) ? _event.requestContext.stage : 'prod';
			dataset.module = (_data.get && _data.get.acc) ? _data.get.acc : 'none';
			dataset.method = (_data.get && _data.get.fnc) ? _data.get.fnc : 'none';

			if (dataset.module == 'none') {
				if (_event['Records'] && _event['Records'].length > 0) {
					let record = _event['Records'][0];
					if (record.eventSource && record.eventSource != '') {
						dataset.eventSource = record.eventSource;
						dataset.module = 'aws';
						dataset.method = dataset.eventSource;
					}
					if (record.body) dataset.body = (utils.isJson(record.body)) ? JSON.parse(record.body) : {};
				}else if (_event.source && _event.source != '') {
					dataset.eventSource = _event['detail-type'] || '';
					dataset.module = 'aws';
					dataset.method = _event.source;
				}else{
					return {event:_event, context:_context};
				}
			}

			if (dataset.module == 'aws') return false;
			if (dataset.module == 'bulk') return false;
			if (dataset.module == 'agents') return false;

			let post = _data.post || {};
			let get = _data.get || {};

			dataset.post = post;
			// dataset.get = get;

			switch (dataset.method) {
				case 'wapi':
					if (get.id) dataset.distinct_id = get.id;
					if (get.id) dataset.idc = get.id;
					if (get.uid) dataset.id_canal = get.uid;
					if (get.uid) dataset.uid = get.uid;
				    if (post.uid) dataset.message_uid = post.uid;
				    if (post.status) dataset.message_status = post.status;
				    if (post.type) dataset.message_type = post.type;
				    switch (dataset.message_type || 'none') {
				    	case 'state':
				    		if (post.state) dataset.message_status = post.state;
				    		break;
				    }
					break;
				case 'wabags':
				    if (get.prm) dataset.distinct_id = get.prm;
				    if (get.prm) dataset.idc = get.prm;
				    if (get.prm2) dataset.id_canal = get.prm2;
				    if (post.app) dataset.uid = post.app;
				    if (post.type) dataset.message_type = post.type;
				    if (post.payload && post.payload.type) dataset.message_status = post.payload.type;
				    // if (post.payload && post.payload.id) dataset.post.payload.gsId = post.payload.id;
					break;
				case 'aws:sqs':
					if (dataset.body.uid) dataset.instance_uid = dataset.body.uid;
					break;
			}

			if (!dataset.idc || dataset.idc != 1305) return false;

			// dataset.event = _event;
			// dataset.context = _context;

			return dataset;
	};


	try{
		if (isWebSocket){
			utils.socket = socket = new SocketManager({event,session,utils});
			await session.start(socket.ssid,86400,"DDB",false);
			// console.dump(session.getSessionData());

			switch (event.requestContext.routeKey) {
				case "$connect":
					return await socket.onConnect();

				case "$disconnect":
					return await socket.onDisconnect();

				default:
					try { event = Object.assign(event, JSON.parse(event.body)); } catch (e) { }
					break;
			}

		}

		// Homologación para Lambda URL Functions
		if(typeof event.rawPath != "undefined" && typeof event.requestContext!='undefined' && typeof event.requestContext.domainName!='undefined' ){
			event.path = event.rawPath;
			event.httpMethod = event.requestContext.http.method;
		}

	    // Procesar entrada
	    // CWE Payload: {"queryStringParameters":{"prm":"check"}}
	    var data = tools.processRequestEvent(event);
		// console.dir(data?.get);
		// console.dir(data?.post);

		// Iniciar Sesión
		if(!isWebSocket){
			await session.start(data,28800,"JWT",false);
		}

		// MODULOS //
		var modulosPGE = {};

		modulosPGE.socket	= new SocketManagerAPI({event,session,utils});

		modulosPGE.direct	= require("modulos/direct.js");
		modulosPGE.admin	= require("modulos/admin.js");
		modulosPGE.account	= require("modulos/account.js");
		modulosPGE.contacts	= require("modulos/contacts.js");
		modulosPGE.catalogue	= require("modulos/catalogue.js");
		modulosPGE.users	= require("modulos/users.js");
		modulosPGE.channels	= require("modulos/channels.js");
		modulosPGE.assistant	= require("modulos/assistant.js");
		modulosPGE.groups	= require("modulos/groups.js");
		modulosPGE.history	= require("modulos/history.js");
		modulosPGE.conversation	= require("modulos/conversation.js");
		modulosPGE.proxy	= require("modulos/proxy.js");
		modulosPGE.bulk		= require("modulos/bulk.js");
		modulosPGE.chat 	= require("modulos/chat.js");
		modulosPGE.agents	= require("modulos/agents.js");
		modulosPGE.bot		= require("modulos/bot.js");
		modulosPGE.messenger = require("modulos/x.messenger.js");
		modulosPGE.integrations	= require("modulos/integrations.js");
		modulosPGE.balance	= require("modulos/balance.js");
		modulosPGE.soporte	= require("modulos/soporte.js");
		modulosPGE.autoEndChats	= require("modulos/auto.end.chat.js");
		modulosPGE.massiveActionsChats	= require("modulos/massive.actions.chat.js");
		modulosPGE.kickouts	= require("modulos/kickouts.js");

		// Whatsapp Routes
		modulosPGE.gateway	= require("modulos/gateway.js");
		modulosPGE.wablas	= require("modulos/x.wablas.js");
		modulosPGE.chatapi	= require("modulos/x.chatapi.js");
		modulosPGE.wapi 	= require("modulos/x.wapi.js");
		modulosPGE.wabags 	= require("modulos/x.wabags.js");
		modulosPGE.waba 	= require("modulos/x.waba.js");

		// ADMIN
		modulosPGE.config			= require("admin/config.js");
		modulosPGE.library  		= require("admin/library.js");
		modulosPGE.adminChannels 	= require("admin/channels.js");
		modulosPGE.schedule 		= require("admin/schedule.js");
		modulosPGE.automations 		= require("admin/automations.js");
		modulosPGE.adminIa 			= require("admin/ia.js");
		modulosPGE.notifications 	= require("admin/notifications.js");
		modulosPGE.adminBalance 	= require("admin/balance.js");
		modulosPGE.adminBots 		= require("admin/bots.js");
		modulosPGE.adminHistory 	= require("admin/history.js");
		modulosPGE.adminContacts 	= require("admin/contacts.js");
		modulosPGE.adminUsers 		= require("admin/users.js");
		modulosPGE.adminKickouts	= require("admin/kickouts.js");

		utils.getIdConversacion = async(tipo, id_canal, id_visitante)=>{
			switch (tipo) {
				case 'whatsapp':
					var chatId = modulosPGE.wapi.getChatId({
						username:id_visitante
					});
					return modulosPGE.wapi.getIdConversacion(id_canal, chatId);

				case 'waba':
					return modulosPGE.wabags.getIdConversacion(id_canal,id_visitante);

				case 'wabameta':
					return  modulosPGE.waba.getIdConversacion(id_canal,id_visitante);

				default:
					return false;
			}
		}

	    dump.enviroment().set((() => {
			let stage = (event.rawPath || event.path || '').replace(/^\/+|\/+$/g, '').split("/")[0];
			if (stage) {
				return (stage.toUpperCase() == 'PROD') ? 'PROD' : 'DEV';
			} else if(context && context.functionVersion) {
	    		return (context.functionVersion == '$LATEST') ? 'DEV' : 'PROD';
	    	} else if (event && event.requestContext && event.requestContext.stage) {
	    		return (event.requestContext.stage == 'prod') ? 'PROD' : 'DEV';
	    	} else {
	    		return 'PROD';
	    	}
	    }) ());

	    dump.endpoint().set([
	    	"https://webhook.site/951bc917-cf47-4448-a006-796da451ad9e",
	    	"https://webhook.site/4f50048f-d458-41ad-af61-bc20f2800ccc",
	    	"https://webhook.site/dd745cbe-882f-4e4e-9ca4-798afe57f738",
	    	'https://webhook.site/2ee057c8-e17a-4e5b-bfaf-afde5604e025'
	    ]);

	    mixpanel.init('e7ef50c6263affc769897b4de6665f4e'); // MIXPANEL: LAMBDA LOG

	    // await mixpanel.track('REQUEST', parseMixData(data, event, context));


		// FIREBASE
		if (!firebase.apps.length) {
			var defaultDB = "https://pagegearliveconnect.firebaseio.com";
			// var firebaseDB = session.get("firebaseDB");
			// 	firebaseDB = (typeof firebaseDB == "undefined")?defaultDB:firebaseDB;
			firebase.initializeApp({
			  credential: firebase.credential.cert(serviceAccount),
			  databaseURL: defaultDB
			});
		}

		// pasar utilidades extra
		utils.emmit2integrations = modulosPGE.integrations.core.emmit;
		utils.firebase = firebase;
		utils.session = session;
		utils.proxy	= modulosPGE.proxy;
		utils.uploaderS3 = uploader;
		utils.enviroment = dump.enviroment().get();

		if(typeof event.Records != "undefined"){
			for (var i in event.Records) {
				let msg = event.Records[i];

				switch (msg.eventSourceARN){
					// Envios Masivos LiveConnect
					case `arn:aws:sqs:us-east-1:${awsAccountId}:LiveConnect-Bulk`:
						await modulosPGE.bulk.parseMessageSQS(utils,msg);
						break;

					// Integraciones LiveConnect
					case `arn:aws:sqs:us-east-1:${awsAccountId}:LiveConnect-Integrations`:
						await modulosPGE.integrations.parseMessageSQS(utils,msg);
						break;
					
					// Finalización automatica de Chats
					case `arn:aws:sqs:us-east-1:${awsAccountId}:LiveConnect-End-Chats`:
						await modulosPGE.autoEndChats.parseMessageSQS(utils,msg);
						break;

					// Ejecución de acciones masivas sobre de Chats
					case `arn:aws:sqs:us-east-1:${awsAccountId}:LiveConnect-Massive-Conv-Actions`:
						await modulosPGE.massiveActionsChats.parseMessageSQS(utils,msg);
						break;

					default:
						await utils.dump(event);
				}
			}
		}else if(typeof event.source != "undefined" && event.source=="aws.ecs"){
			await modulosPGE.admin.ecsEvent(utils, event, context);
		}else if(typeof data.get != "undefined"){
		    switch (data.get.acc) {

				case 'time':
					await utils.apiResp({
						serverTime:Math.floor(Date.now() / 1000)
					});
					break;

		        default:
	    	        if(typeof modulosPGE[data.get.acc]!="undefined"){
	    	        	// try {
							if(typeof modulosPGE[data.get.acc][data.get.fnc] != "undefined") {
		                		await modulosPGE[data.get.acc][data.get.fnc](utils, data, context);
		                	} else {
		                		await utils.responder(-404, data, "No existe el metodo buscado...", 404);
		                	}
						// } catch(e) {
						//     let error = extend(true, {
						//         status: -404,
						//         status_message: 'Se presento un error...',
						//         data: {}
						//     }, e);
						// 	await utils.responder(error.status, error.data, error.status_message, utils.validHttpCode(error.status < 0 ? (error.status * -1) : error.status));
						// }
	    	        }else{
	                	await utils.responder(-404, data, "No existe el modulo buscado...", 404);
	    	        }
	    	        break;
		    }
		} else{
			await utils.apiError(-1,"No hay datos del request...",event);
		}
	}catch(error){
		await utils.apiError(-500,error.message,String(error.stack).split("\n"));
	}
};

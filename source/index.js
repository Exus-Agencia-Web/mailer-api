var lambda_cb;
const extend = require("extend");
const { tools,session,db } = require("PageGearCoreNode");


// UTILIDADES 
/**
 * Funciones utilitarias para formateo de respuestas API, procesamiento de solicitudes y validación.
 * 
 * @namespace utils
 * 
 * @property {function} responder - Formatea y envía una respuesta HTTP con estado, datos y mensaje.
 * @property {function} apiResp - Atajo para enviar una respuesta exitosa de API.
 * @property {function} apiError - Atajo para enviar una respuesta de error de API.
 * @property {function} isJson - Verifica si una cadena es JSON válido.
 * @property {function} sleep - Retorna una promesa que se resuelve después de un tiempo en milisegundos.
 * @property {function} processRequestEvent - Procesa un evento de AWS Lambda y extrae los datos de la solicitud.
 * @property {function} validarApiKey - Valida la API key de los headers y obtiene la información de la cuenta.
 */
var utils = {

	responder : async (status, dataset = null,status_message = null, httpcode = 200) => {
		let resp = { status: status };
		
		if(dataset != null) {
			resp.data = dataset;
		}

		if(status_message != null) {
			resp.status_message = status_message;
		}
	

	    var date= new Date(); date.setTime(date.getTime() + (60*60*24 * 1000));
	    var expires = date.toGMTString();

	
		let response = {
			"statusCode": httpcode,
			"headers": {
				"Access-Control-Allow-Origin":"*",
				"Content-type": "application/json; charset=utf-8",
				"Access-Control-Allow-Headers":"Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,PageGearToken"
			},
			"body": JSON.stringify(resp),
			"isBase64Encoded": false
		};
		
		
		lambda_cb(null, response);
		return response;
		
	},
	apiResp: async(dataset,status=1,status_message="Ok")=>{
		return await utils.responder(status,dataset,status_message);
	},
	apiError: async(status,status_message=null,dataset=null)=>{
		return await utils.responder(status,dataset,status_message);
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

	processRequestEvent : (event)=>{
		function parseCookies (event) {
			try{
				var list = {},
					rc = event.headers.cookie;
			
				rc && rc.split(';').forEach(function( cookie ) {
					var parts = cookie.split('=');
					list[parts.shift().trim()] = decodeURI(parts.join('='));
				});
			
				return list;
			}catch(e){
				return [];
			}
		}

		var data = {};
		var isELB = (typeof event.requestContext!='undefined' && typeof event.requestContext.elb!='undefined' )?true:false;

		// Definir objeto general
		data = { isELB:isELB, type:"", headers:{}, get:{}, query:{}, post:{} };
		
		// Tipo de request y headers
		data.type = event.httpMethod;
		data.query = (event.queryStringParameters==null)?{}:event.queryStringParameters;
		data.get = data.query;
		
		// Definición de GET
		if(typeof event.path != "undefined" || typeof event.path != "rawPath"){
			
			var startParamsIn = (typeof event.startParamsIn != "undefined" && !isNaN(event.startParamsIn))?parseInt(event.startParamsIn):2;
			
			var path = event.path || event.rawPath || "";
				path = path.split("/");
			if(typeof path[0+startParamsIn] != "undefined") data.get.acc =  path[0+startParamsIn];
			if(typeof path[1+startParamsIn] != "undefined") data.get.fnc =  path[1+startParamsIn];
			if(typeof path[2+startParamsIn] != "undefined") data.get.prm =  path[2+startParamsIn];
			if(typeof path[3+startParamsIn] != "undefined") data.get.prm2 = path[3+startParamsIn];
			if(typeof path[4+startParamsIn] != "undefined") data.get.prm3 = path[4+startParamsIn];
			if(typeof path[5+startParamsIn] != "undefined") data.get.prm4 = path[5+startParamsIn];
			if(typeof path[6+startParamsIn] != "undefined") data.get.prm5 = path[6+startParamsIn];
			if(typeof path[7+startParamsIn] != "undefined") data.get.prm6 = path[7+startParamsIn];
		}
		
		
		// Definición de POST
		if(typeof event.body!="undefined" && event.body!=null){
			try {
				if(typeof event.headers['content-type'] != "undefined" && String(event.headers['content-type']).indexOf("application/x-www-form-urlencoded") != -1) {
					let form = tools.base64_decode(event.body);
						form = decodeURI(form);
					data.post = parse(form);
					}else{
					data.post = JSON.parse(event.body);
					}	        	
			} catch (e) {
				data.post = event.body;
			}
		}
		
		// Headers de la solicitud
		data.headers = event.headers;
		
		data.cookies = parseCookies(event);
		
		return data;
	},

	validarApiKey: async (utils, data,useReturn=false) => {
		if(typeof data.headers['x-api-key'] != "undefined"){
			let cuenta = utils.session.get("cuenta");
			if(typeof cuenta != "undefined"){
				return cuenta;
			}else{
				var SQL = "SELECT id,id_pge,id_proveedor,id_listanegra,cliente as nombre,email_notificaciones,creditos FROM mailer where api_key=" + utils.db.getSQLV(data.headers['x-api-key']);
				let accountDataset = await utils.db.getFilaSqlQuery(SQL);
				if(accountDataset!=false){
					utils.session.set("cuenta", accountDataset);
					return accountDataset;
				}else{
					if(typeof useReturn == "undefined") await utils.apiError(-403, "API Key no valida [2]");
					return false;
				}
			}
		} else {
			if(typeof useReturn == "undefined") await utils.apiError(-403, "API Key no valida [1]");
			return false;
		}
	}
	
};


exports.handler = async (event, context, lambdaCallback) => {
	try{
	    // Inicializar callback
	    lambda_cb = lambdaCallback;
		context.callbackWaitsForEmptyEventLoop = false;

		// Inicializar Base de Datos
		utils.db = extend(true, {}, db);
		utils.db.config.db = "pagegear_mailer";

	    // Procesar entrada
		event.startParamsIn = 1;
	    var data = utils.processRequestEvent(event);

		// Inicializar Session
		var sessionID = data.headers['x-api-key'] || false;
			utils.session = session;
			await utils.session.start(sessionID);
		
		// MODULOS //
		var modulosPGE = {};
			modulosPGE.mailer = require("modulos/mailer.js");
			modulosPGE.queue = require("modulos/queue.js");
			modulosPGE.voice = require("modulos/voice.js");
			modulosPGE.email = require("modulos/email.js");


	    if(typeof event.Records != "undefined"){
	    	data.get.acc = "Lambda-SQS-Trigger";
	    }
	
		if(typeof data.get != "undefined"){
		    switch (data.get.acc) {
		    	case 'prueba':
		    		await utils.apiResp({}, 1, "Esto es una prueba");
					break;
	
				case 'time':
					await utils.apiResp({
						serverTime:Math.floor(Date.now() / 1000)
					});
					break;
	
				case 'Lambda-SQS-Trigger':
	        		var resp = await modulosPGE.mailer.procesarTriggerLambdaSQS(utils, event, context);
	        		await utils.responder(200, resp, "Trigger Procesado!", 200);
					break;
	
		        default:
	    	        if(typeof modulosPGE[data.get.acc]!="undefined"){
	                	if(typeof modulosPGE[data.get.acc][data.get.fnc] != "undefined") {
	                		var resp = await modulosPGE[data.get.acc][data.get.fnc](utils, data, context);
	                		await utils.responder(200, resp, "Exito", 200);
	                	} else {
	                		await utils.responder(-404, data, "No existe el metodo buscado...", 404);
	                	}
	    	        }else{
	                	await utils.responder(-404, [data,event], "No existe el modulo buscado...", 404);
	    	        }
	    	        break;
		    }
		}else{
			await utils.apiError(-1,"No hay datos del request...",event);
		}
	}catch(error){
		await utils.apiError(-500,error.message,String(error.stack).split("\n"));
	}
};

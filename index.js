process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = 1;

exports.handler = async (event, context, lambda_cb) => {

	// UTILIDADES
	var utils = {

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

		sleep: (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))

	};

	try{
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
		// MODULOS //
		var modulosPGE = {};

		modulosPGE.trx	= require("admin/kickouts.js");

		if(typeof event.Records != "undefined"){
			for (var i in event.Records) {
				let msg = event.Records[i];

				switch (msg.eventSourceARN){
					// Envios Masivos LiveConnect
					case `arn:aws:sqs:us-east-1:${awsAccountId}:LiveConnect-Bulk`:
						await modulosPGE.bulk.parseMessageSQS(utils,msg);
						break;
				}
			}
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

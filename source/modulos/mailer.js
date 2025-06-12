const htmlToText = require('html-email-to-text');
const core = require('PageGearCoreNode');
const extend = require("extend");

const dbm = extend(true, {}, core.db);
dbm.config.db = "pagegear_mailer";

const messageLoopTimmer = 'PageGearMailerLoop';
const messagesQueue = "https://sqs.us-east-1.amazonaws.com/098497473728/PageGear-Mailer";
// const messagesQueue = "https://sqs.us-east-1.amazonaws.com/098497473728/PageGear-Mailer.fifo";
const MailerReportQueue = "https://sqs.us-east-1.amazonaws.com/098497473728/PageGearMailer-Reports";


/* Encolador Simple */
var cacheEnvios = {};
var dataResp = [];
var queue = {

    check: async(utils, params, context) => {
        // return await queue.obtenerMensajes(utils, params, context, [], true);
        return await core.cwe.disable(messageLoopTimmer).catch(); 
    },

    obtenerMensajes: async(utils, params, context, data = [], check = false) => {
        // Obtener envíos pendientes
        var mensajes = await core.sqs.m.get(messagesQueue, 10).catch();
        console.log(mensajes);
        if (mensajes && mensajes.length > 0) {

            if (check == true) {
                await core.cwe.enable(messageLoopTimmer).catch();
            }

            for (var m = mensajes.length - 1; m >= 0; m--) {
                try {
                    var mensaje = mensajes[m];

                    let resp = await queue.procesarMensaje(JSON.parse(mensaje.Body)).catch();

                    if (typeof resp != "undefined" && resp == 1) {
                        // Si todo esta bien eliminamos el mensaje
                        await core.sqs.m.del(messagesQueue, mensaje.ReceiptHandle).catch();
                    }

                    dataResp.push(resp);
                }
                catch (e) {
                    console.log("## Error al procesar mensaje en bucle, error:", e);
                }
            }
            
            // Lanzar recursiva siempre que tenga mas de 10 seg.
            if (context.getRemainingTimeInMillis() > 10000) {
                return await queue.obtenerMensajes(utils, params, context, dataResp).catch();
            }
            else {
                await utils.apiResp(dataResp, 2, "Pausando envios...");
            }
        }
        else {
            await core.cwe.disable(messageLoopTimmer).catch();
            await utils.apiResp(dataResp, 1, "No hay mas mensajes...");
        }
    },

    procesarTriggerLambdaSQS: async(utils, params, context) => {
        // Obtener envíos pendientes
        var dataResp = [];
        var mensajes = params.Records;
        if (mensajes && mensajes.length > 0) {
            for (var m = mensajes.length - 1; m >= 0; m--) {
                try {
                    var mensaje = mensajes[m];
                    let resp = await queue.procesarMensaje(JSON.parse(mensaje.body)).catch();
                    console.log("Envio",resp);
                    dataResp.push(resp);
                }
                catch (e) {
                    console.log("## Error al procesar mensaje en bucle, error:", e);
                }
            }
        }
        return dataResp;
    },


    procesarMensaje: async(mensaje) => {
        
        if(typeof mensaje.id_envio != "undefined" && mensaje.id_envio>0){  /* Email del Mailer */

    		let envio = await queue.getEnvio(mensaje.id_envio);
    		if(envio!=false){
                var options = {
    				envio:envio,
    				mensaje: mensaje.data
    			};
    			await queue.enviarMensaje(options).catch();
    		}else{
    		    console.log("No se encontro el envío #"+mensaje.id_envio);
    		    return -1;
    		}

        }else{ /* Email Estandar */
			await core.mail.send({
			    fromName: mensaje.fromName,
			    from: mensaje.from,
			    to: mensaje.to,
			    subject: mensaje.subject,
			    text: htmlToText(mensaje.message),
			    html: mensaje.message
			});
        }
        
        // await core.db.wait(200);
        return 1;
    },

    getEnvio: async(id_envio)=>{
        if(typeof cacheEnvios[id_envio] != "undefined"){
            return cacheEnvios[id_envio];
        }else{
    		var SQL = "SELECT `id`, `id_mailer`, `id_campana`, `id_proveedor`, `id_automatizacion`, `tipo`, `estado`, `remitente`, `remitente_nombre`, `campana_subject`, `campana_content`, `campana_preview_text`, `fecha`, `fecha_envio`,  `stats_id_remoto`, `aws_sqs` FROM m_envios where id="+dbm.getSQLV(id_envio);
    		let envio = await dbm.getFilaSqlQuery(SQL);
    		if(envio!=false){
    		    cacheEnvios[id_envio] = envio;
    		}
    		console.log("Recuperando envio...");
    		return envio;
        }
    },

    enviarMensaje: async(params)=>{

    	var vars = params.mensaje;
    	var asunto = params.envio.campana_subject;
    	var mensaje = params.envio.campana_content;
    
    
    	Object.keys(vars).forEach(function(key) {
    		var val = vars[key];
    		
    		asunto = core.tools.str_replace("{"+key+"}",val,asunto);
    		mensaje = core.tools.str_replace("{"+key+"}",val,mensaje);
    		
    		asunto = core.tools.str_replace("(("+key+"))",val,asunto);
    		mensaje = core.tools.str_replace("(("+key+"))",val,mensaje);
    	});
    
    	mensaje = core.tools.str_replace("{campana_preview_text}",params.envio.campana_preview_text,mensaje);
    
    
    	var mailOptions = {
    		fromName: 	params.envio.remitente_nombre,
    		from: 		params.envio.remitente,
    		to: 		params.mensaje.ToEmail,
    		subject: 	asunto,
    		html: 		mensaje,
    		text:       htmlToText(mensaje)
    	};
    	var send = await core.mail.send(mailOptions).catch();
    	
    	var err, estado, messageId;
    	if(typeof send.messageId != "undefined"){
    		err = '';
    		estado = 1;
    		messageId = send.messageId;
    	}else{
    		err = send;
    		estado = 2;
    		messageId = '';
    	}
    	
    	// Reportar envío
    	var report = {
    		type: 'ses-send-report',
    		id_envio:params.envio.id,
    		email: params.mensaje.ToEmail,
    		id_remoto: messageId,
    		estado:estado,
    		data: err,
    		ts: Math.floor(Date.now()/1000)
    	};
    
    	await core.sqs.m.add(MailerReportQueue,report).catch();
    	
    	return 1;
    }
};

module.exports = queue;

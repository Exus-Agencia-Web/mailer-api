const core = require('PageGearCoreNode');
const extend = require("extend");
const axios = require("axios");

var email = {

    OAuthTest: async(utils, params, context)=>{
		let utilsTmp = extend(true, {}, utils);
        let valid = await utils.validarApiKey(utilsTmp, params,true);
        if(!valid){
            return await utils.responder(-1, {}, "Invalid Key!", 401);
        }else{
            return await utils.responder(1,{}, "Good Key!", 200);
        }
    },

    send: async(utils, params, context)=>{
        let cuenta = await utils.validarApiKey(utils, params);
        return cuenta;
    },

    procesarMensaje: async(params)=>{

        var vars = params.mensaje;
        var asunto = params.asunto;
        var mensaje = params.contenido;
    
    
        Object.keys(vars).forEach(function(key) {
            var val = vars[key];
            
            asunto = core.tools.str_replace("{"+key+"}",val,asunto);
            mensaje = core.tools.str_replace("{"+key+"}",val,mensaje);
            
            asunto = core.tools.str_replace("(("+key+"))",val,asunto);
            mensaje = core.tools.str_replace("(("+key+"))",val,mensaje);
        });
    
        mensaje = core.tools.str_replace("{campana_preview_text}",params.portada,mensaje);
    
    
        var mailOptions = {
            fromName: 	params.remitente_nombre,
            from: 		params.remitente,
            to: 		params.email,
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
        // var report = {
        //     type: 'ses-send-report',
        //     id_envio:params.envio.id,
        //     email: params.mensaje.ToEmail,
        //     id_remoto: messageId,
        //     estado:estado,
        //     data: err,
        //     ts: Math.floor(Date.now()/1000)
        // };
        // await core.sqs.m.add(MailerReportQueue,report).catch();
        
        return 1;
    },

    template: async(utils, params, context)=>{},
    
};

module.exports = email;
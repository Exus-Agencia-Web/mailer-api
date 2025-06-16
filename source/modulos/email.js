const core = require('PageGearCoreNode');
const extend = require("extend");
const axios = require("axios");

var internal = {

    enviarEmail: async(params)=>{

        var vars = params.vars || {};
        var asunto = params.asunto;
        var mensaje = params.contenido;
    
    
        Object.keys(vars).forEach(function(key) {
            var val = vars[key];
            
            asunto = core.tools.str_replace("{"+key+"}",val,asunto);
            mensaje = core.tools.str_replace("{"+key+"}",val,mensaje);
            
            asunto = core.tools.str_replace("(("+key+"))",val,asunto);
            mensaje = core.tools.str_replace("(("+key+"))",val,mensaje);
        });
    
        mensaje = core.tools.str_replace("{text-preview}",params.portada,mensaje);
    
    
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

        return 1;
    },

};

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

        // Insertarlo en la base de datos
        let emailID = await utils.db.conector();

        // Enviar el email
        let dataset = {
            vars: {
                id: emailID
            },
            email: params.email,
            asunto: params.asunto,
            contenido: params.contenido,
            preview: params.preview,
            remitente_nombre: cuenta.remitente_nombre,
            remitente: cuenta.remitente
        };
        await internal.enviarEmail(dataset);
        
        return await utils.responder(1, {emailID: emailID}, "Email enviado!");
    },

	pixel: async(data)=>{

		let response = {
			"statusCode": 200,
			"headers": {
				"content-type": "image/png"
			},
			"body": "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
			"isBase64Encoded": true
		};

		return response;
	},
	

    template: async(utils, params, context)=>{},
    
};

module.exports = email;
const core = require('PageGearCoreNode');
const extend = require("extend");
const axios = require("axios");
const htmlToText = require('html-email-to-text');
const util = require('util');
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
    
        // mensaje = core.tools.str_replace("{text-preview}",params.portada,mensaje);
    
    
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

        return {mailOptions,send};
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
        //Get envio
        let sqlCampaing  = util.format(
            "SELECT * FROM m_campanas WHERE id_mailer=%s AND id = %s",
            utils.db.getSQLV(cuenta.id),
            utils.db.getSQLV(params.post.campaignId)
        );
        let campaign = await utils.db.getFilaSqlQuery(sqlCampaing);
        // return {campaign}
        // Insertarlo en la base de datos
        let sql = util.format("INSERT INTO `m_transaccional` (`id_mailer`, `estado`, `segmento`, `asunto`, `mensaje`, `remitente`, `remitente_nombre`, `data`) VALUES(%s,%s,%s,%s,%s,%s,%s,%s) ", 
            utils.db.getSQLV(cuenta.id),
            utils.db.getSQLV('Enviado'),
            utils.db.getSQLV(''),
            utils.db.getSQLV(params.post.subject),
            utils.db.getSQLV(campaign.constenido),
            utils.db.getSQLV(params.post.remitenteId),
            utils.db.getSQLV(params.post.remitenteName),
            utils.db.getSQLV(JSON.stringify(params.post))
        );
        await utils.db.conector(sql);
        let emailID = utils.db.queryResp.filas.insertId || 0;
        //return {sql,emailID}
        // Enviar el email
        let dataset = {
            vars: {
                id: emailID
            },
            email: params.post.to,
            asunto: params.post.subject,
            contenido: campaign.contenido,
            preview: 's',
            remitente_nombre:  "Sin Nombre",
            remitente: params.post.remitenteId
        };
        let sendEmail = await internal.enviarEmail(dataset);
        
        return await utils.responder(1, {emailID,sendEmail,dataset}, "Email enviado!");
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
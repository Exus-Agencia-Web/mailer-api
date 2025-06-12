const core = require('PageGearCoreNode');
const extend = require("extend");

const dbm = extend(true, {}, core.db);
dbm.config.db = "pagegear_mailer";

const messagesQueue = "https://sqs.us-east-1.amazonaws.com/098497473728/PageGear-Mailer";
// const messagesQueue = "https://sqs.us-east-1.amazonaws.com/098497473728/PageGear-Mailer.fifo";

var queue = {
    
    add: async (utils, params, context)=>{
        let data = await core.sqs.m.add(messagesQueue,params.post).catch();
        utils.apiResp(data);
    },
    
    addMultiple: async (utils, params, context)=>{
        let data = await core.sqs.m.addMultiple(messagesQueue,params.post).catch();
        utils.apiResp(data);
    },
    
    addBulkMailer: async(utils, params, context) => {
        var id_envio = params.post.id_envio;
        var Emails = params.post.emails;
        
        while (Emails.length) {
            
            var messages = [];
            var block = Emails.splice(0, 9);
            for (var i = block.length - 1; i >= 0; i--) {
                messages.push({
                    // MessageGroupId: id_envio,
                    id_envio: id_envio,
                    data: block[i]
                });
            }
            
            let add = await core.sqs.m.addMultiple(messagesQueue, messages).catch();
            console.log(add);

            await core.db.wait(300);

        }
        return 1;            
    }
    
};

module.exports = queue;

const BaseJoi=require('joi'); 
const sanitizeHtml=require('sanitize-html');

const extension=(joi)=>({
    type:'string',
    base:joi.string(),
    messages:{
        'string.escapeHTML':"{{#label}} must not include HTML!"
    },
    rules:{
        escapeHTML:{
            validate(value, helpers){
                const clean=sanitizeHtml(value, {
                    allowedTags:[],
                    allowedAtributes:{},
                });
                if(clean!==value) return helpers.error('string.escapeHTML', {value})
                return clean;
            }
        }
    }
});

const Joi=BaseJoi.extend(extension);

module.exports.whiteboardSchema=Joi.object({
    room:Joi.object({
        name:Joi.string().required().escapeHTML(),
        username:Joi.string().required().escapeHTML(),
        password:Joi.string().required().escapeHTML()
    }).required()
});


module.exports.charadesSchema=Joi.object({
    room:Joi.object({
        name:Joi.string().required().escapeHTML(),
        username:Joi.string().required().escapeHTML(),
        password:Joi.string().required().escapeHTML()
    }).required()
});